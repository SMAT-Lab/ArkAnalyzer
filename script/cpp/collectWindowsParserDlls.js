/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const { spawnSync } = require('child_process');
const { basename, dirname, join, resolve } = require('path');
const { closeSync, copyFileSync, existsSync, mkdtempSync, mkdirSync, openSync, readFileSync, readdirSync, rmSync } = require('fs');
const { tmpdir } = require('os');

const SYSTEM_DLL = new Set([
    'KERNEL32.dll',
    'KERNEL32.DLL',
    'msvcrt.dll',
    'ntdll.dll',
    'ADVAPI32.dll',
    'ole32.dll',
    'SHELL32.dll',
    'WS2_32.dll',
    'VERSION.dll',
    'bcrypt.dll',
    'BCRYPT.dll',
    'USER32.dll',
    'GDI32.dll',
    'RPCRT4.dll',
    'NODE.EXE',
]);

function usage() {
    console.error(
        'Usage: node script/cpp/collectWindowsParserDlls.js --node <astJsonDumper.node> --bin-dir <mingw64/bin> --out-dir <dir>',
    );
    process.exit(2);
}

function parseArgs(argv) {
    const out = { node: undefined, binDir: undefined, outDir: undefined };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--node') {
            out.node = resolve(argv[++i] ?? '');
        } else if (a === '--bin-dir') {
            out.binDir = resolve(argv[++i] ?? '');
        } else if (a === '--out-dir') {
            out.outDir = resolve(argv[++i] ?? '');
        } else if (a === '-h' || a === '--help') {
            usage();
        }
    }
    if (!out.node || !out.binDir || !out.outDir) {
        usage();
    }
    return out;
}

function parseDllNamesFromObjdumpText(text) {
    const names = [];
    for (const line of text.split(/\r?\n/)) {
        const m = line.match(/DLL Name:\s+(\S+)/);
        if (m) {
            names.push(m[1]);
        }
    }
    return names;
}

/** llvm-objdump -p can be huge for libLLVM*.dll; write to a temp file to avoid spawn ENOBUFS. */
function peDllImportsViaFile(objdump, pePath) {
    const dir = mkdtempSync(join(tmpdir(), 'arkanalyzer-pe-'));
    const outFile = join(dir, 'imports.txt');
    try {
        const fd = openSync(outFile, 'w');
        try {
            const r = spawnSync(objdump, ['-p', pePath], {
                stdio: ['ignore', fd, 'pipe'],
                encoding: 'utf8',
                shell: false,
            });
            if (r.status !== 0) {
                const detail = (r.stderr ?? '').trim() || (r.error?.message ?? 'spawn failed');
                throw new Error(`llvm-objdump failed for ${pePath} (exit ${r.status}): ${detail}`);
            }
        } finally {
            closeSync(fd);
        }
        return parseDllNamesFromObjdumpText(readFileSync(outFile, 'utf8'));
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

function resolveDllSource(binDir, nodeDir, dllName) {
    const inBin = join(binDir, dllName);
    if (existsSync(inBin)) {
        return inBin;
    }
    const nearNode = join(nodeDir, dllName);
    if (existsSync(nearNode)) {
        return nearNode;
    }
    return undefined;
}

function stageDll(state, dllName) {
    if (!dllName || state.copied.has(dllName)) {
        return;
    }
    const src = resolveDllSource(state.binDir, state.nodeDir, dllName);
    if (!src) {
        state.missing.push(dllName);
        return;
    }
    copyFileSync(src, join(state.outDir, dllName));
    state.copied.add(dllName);
}

function scanPeImports(state, pePath) {
    if (!existsSync(pePath)) {
        return;
    }
    for (const dllName of peDllImportsViaFile(state.objdump, pePath)) {
        if (SYSTEM_DLL.has(dllName)) {
            continue;
        }
        stageDll(state, dllName);
    }
}

function seedDllsFromNodeDir(state) {
    for (const name of readdirSync(state.nodeDir)) {
        if (!name.toLowerCase().endsWith('.dll')) {
            continue;
        }
        stageDll(state, name);
    }
}

function pePathForDllScan(state, dllFileName) {
    const inBin = join(state.binDir, dllFileName);
    return existsSync(inBin) ? inBin : join(state.outDir, dllFileName);
}

function expandDllClosure(state, nodePath) {
    scanPeImports(state, resolve(nodePath));
    for (let round = 0; round < 12; round++) {
        const before = state.copied.size;
        for (const name of readdirSync(state.outDir)) {
            if (!name.toLowerCase().endsWith('.dll')) {
                continue;
            }
            scanPeImports(state, pePathForDllScan(state, name));
        }
        if (state.copied.size === before) {
            break;
        }
    }
}

function createDllCollector(binDir, nodeDir, outDir, objdump) {
    const state = { binDir, nodeDir, outDir, objdump, copied: new Set(), missing: [] };
    return {
        copied: state.copied,
        missing: state.missing,
        seedFromNodeDir: () => seedDllsFromNodeDir(state),
        expandClosure: (nodePath) => expandDllClosure(state, nodePath),
    };
}

function assertDllClosureComplete(missing, logPrefix) {
    const uniqueMissing = [...new Set(missing)].filter((n) => !SYSTEM_DLL.has(n));
    if (uniqueMissing.length > 0) {
        console.error(`${logPrefix} incomplete DLL closure; missing under --bin-dir: ${uniqueMissing.join(', ')}`);
        process.exit(1);
    }
}

function logPackedDlls(outDir, nodePath, logPrefix) {
    const dllNames = readdirSync(outDir).filter((n) => n.toLowerCase().endsWith('.dll'));
    console.log(`${logPrefix} Packed ${dllNames.length} DLL(s) + ${basename(nodePath)} -> ${outDir}`);
    console.log(`${logPrefix} DLLs: ${dllNames.sort().join(', ')}`);
}

/** Copy astJsonDumper.node and MinGW runtime DLL closure into outDir. */
function collectWindowsParserDlls(nodePath, binDir, outDir) {
    const logPrefix = '[collectWindowsParserDlls]';
    const objdump = join(binDir, 'llvm-objdump.exe');
    if (!existsSync(objdump)) {
        throw new Error(`llvm-objdump not found: ${objdump}`);
    }
    if (!existsSync(nodePath)) {
        throw new Error(`Missing addon: ${nodePath}`);
    }

    mkdirSync(outDir, { recursive: true });
    copyFileSync(nodePath, join(outDir, basename(nodePath)));

    const nodeDir = dirname(resolve(nodePath));
    const collector = createDllCollector(binDir, nodeDir, outDir, objdump);
    collector.seedFromNodeDir();
    collector.expandClosure(nodePath);
    assertDllClosureComplete(collector.missing, logPrefix);
    logPackedDlls(outDir, nodePath, logPrefix);
}

function main() {
    const { node, binDir, outDir } = parseArgs(process.argv.slice(2));
    collectWindowsParserDlls(node, binDir, outDir);
}

if (require.main === module) {
    main();
}

module.exports = { collectWindowsParserDlls, peDllImportsViaFile };
