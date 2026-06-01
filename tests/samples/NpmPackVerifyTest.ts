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

/**
 * Manual npm pack smoke test (not part of default tests/samples pipeline).
 * Set ARKANALYZER_VERIFY_NPM_PACK=1 (or pass --verify-npm-pack) before running.
 *
 *   ARKANALYZER_VERIFY_NPM_PACK=1 npx ts-node tests/samples/NpmPackVerifyTest.ts \\
 *     --main-tgz ./arkanalyzer-1.0.90.tgz \\
 *     --cxx-tgz ./arkanalyzer-cxx-ast-parser-linux-x64-1.0.90.tgz
 */
// @ts-nocheck
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { basename, delimiter, join, resolve } from 'path';
import { tmpdir } from 'os';

const npmPackVerifyEnabled =
    process.env.ARKANALYZER_VERIFY_NPM_PACK === '1' ||
    process.env.ARKANALYZER_VERIFY_NPM_PACK === 'true' ||
    process.argv.includes('--verify-npm-pack');

if (!npmPackVerifyEnabled) {
    console.log('[NpmPackVerifyTest] skipped (set ARKANALYZER_VERIFY_NPM_PACK=1 to run)');
    process.exit(0);
}

const fixturesDir = join(__dirname, '../cppResources/verifyNpmPack');
const collectWindowsParserDllsPath = join(__dirname, '../../script/cpp/collectWindowsParserDlls.js');
const platformPkg = `@arkanalyzer/cxx-ast-parser-${process.platform}-${process.arch}`;

const WIN_SYSTEM_DLL = new Set([
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
    console.error(`Usage: ARKANALYZER_VERIFY_NPM_PACK=1 npx ts-node tests/samples/NpmPackVerifyTest.ts --main-tgz <arkanalyzer-*.tgz> [--cxx-tgz <platform-*.tgz>] [--work-dir <dir>]

Verifies npm pack artifacts on the current OS (${process.platform}-${process.arch}):
  1) main package alone — build a tiny ArkTS Scene
  2) main + platform C++ — load native addon and parse minimal.cpp via CppFrontend

Does not require system LLVM; platform tgz bundles astJsonDumper.node and deps.

Examples:
  # Linux / WSL
  ARKANALYZER_VERIFY_NPM_PACK=1 npx ts-node tests/samples/NpmPackVerifyTest.ts \\
    --main-tgz ./arkanalyzer-1.0.90.tgz \\
    --cxx-tgz ./arkanalyzer-cxx-ast-parser-linux-x64-1.0.90.tgz

  # Windows (PowerShell)
  $env:ARKANALYZER_VERIFY_NPM_PACK='1'; npx ts-node tests/samples/NpmPackVerifyTest.ts \\
    --main-tgz .\\arkanalyzer-1.0.90.tgz \\
    --cxx-tgz .\\arkanalyzer-cxx-ast-parser-win32-x64-1.0.90.tgz

  # macOS (darwin-arm64)
  ARKANALYZER_VERIFY_NPM_PACK=1 npx ts-node tests/samples/NpmPackVerifyTest.ts \\
    --main-tgz ./arkanalyzer-1.0.90.tgz \\
    --cxx-tgz ./arkanalyzer-cxx-ast-parser-darwin-arm64-1.0.90.tgz
`);
    process.exit(2);
}

function parseArgs(argv) {
    const out = { mainTgz: undefined, cxxTgz: undefined, workDir: undefined };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--main-tgz') {
            out.mainTgz = resolve(argv[++i] ?? '');
        } else if (a === '--cxx-tgz') {
            out.cxxTgz = resolve(argv[++i] ?? '');
        } else if (a === '--work-dir') {
            out.workDir = resolve(argv[++i] ?? '');
        } else if (a === '-h' || a === '--help') {
            usage();
        }
    }
    if (!out.mainTgz) {
        usage();
    }
    return out;
}

function runNpm(args, cwd) {
    const isWin = process.platform === 'win32';
    const r = spawnSync(isWin ? 'npm.cmd' : 'npm', args, {
        cwd,
        stdio: 'inherit',
        env: process.env,
        // Windows: spawn .cmd without shell returns EINVAL (status null → "exit unknown").
        shell: isWin,
    });
    if (r.error) {
        throw new Error(`npm ${args.join(' ')} failed: ${r.error.message}`);
    }
    if (r.status !== 0) {
        throw new Error(`npm ${args.join(' ')} failed (exit ${r.status})`);
    }
}

function step(title, fn) {
    process.stdout.write(`\n== ${title} ==\n`);
    fn();
    console.log(`OK: ${title}`);
}

function setupWorkDir(args) {
    const workDir = args.workDir ?? mkdtempSync(join(tmpdir(), 'arkanalyzer-npm-verify-'));
    mkdirSync(workDir, { recursive: true });
    if (!existsSync(join(workDir, 'package.json'))) {
        writeFileSync(join(workDir, 'package.json'), '{"name":"arkanalyzer-npm-verify","private":true}\n');
    }
    const installArgs = ['install', '--no-save', args.mainTgz];
    if (args.cxxTgz) {
        if (!existsSync(args.cxxTgz)) {
            throw new Error(`Missing --cxx-tgz: ${args.cxxTgz}`);
        }
        installArgs.push(args.cxxTgz);
    }
    if (!existsSync(args.mainTgz)) {
        throw new Error(`Missing --main-tgz: ${args.mainTgz}`);
    }
    runNpm(installArgs, workDir);
    return workDir;
}

function materializeProject(parent, dirName, files) {
    const dir = join(parent, dirName);
    mkdirSync(dir, { recursive: true });
    for (const [name, src] of Object.entries(files)) {
        cpSync(src, join(dir, name));
    }
    return dir;
}

function verifyMainPackage(workDir) {
    const projectDir = materializeProject(workDir, 'mini-arkts', {
        'sample.ets': join(fixturesDir, 'sample.ets'),
    });
    const mod = require(join(workDir, 'node_modules', 'arkanalyzer'));
    const { Scene, SceneConfig } = mod;
    const config = new SceneConfig({ supportFileExts: ['.ets', '.ts'], enableMethodBodyBuild: true });
    config.buildFromProjectDir(projectDir);
    const scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    const files = scene.getFiles();
    if (!files.length) {
        throw new Error('main package: Scene has no files after buildSceneFromProjectDir');
    }
    const methods = files[0].getClasses().flatMap((c) => c.getMethods(true));
    if (!methods.some((m) => m.getName() === 'add')) {
        throw new Error('main package: expected method "add" in sample.ets');
    }
    console.log(`main package: Scene built ${files.length} file(s), found add()`);
}

function platformDumperDir(workDir) {
    return join(workDir, 'node_modules', '@arkanalyzer', `cxx-ast-parser-${process.platform}-${process.arch}`, 'dumper');
}

function findWin32Objdump() {
    const candidates = [
        process.env.MINGW_BIN ? join(process.env.MINGW_BIN, 'llvm-objdump.exe') : undefined,
        'C:\\msys64\\mingw64\\bin\\llvm-objdump.exe',
        'C:\\tools\\msys64\\mingw64\\bin\\llvm-objdump.exe',
    ].filter(Boolean);
    for (const p of candidates) {
        if (existsSync(p)) {
            return p;
        }
    }
    const r = spawnSync('where', ['llvm-objdump'], { encoding: 'utf8', shell: true });
    if (r.status === 0 && r.stdout) {
        const line = r.stdout.split(/\r?\n/).find((l) => l.trim().endsWith('.exe'));
        if (line && existsSync(line.trim())) {
            return line.trim();
        }
    }
    return undefined;
}

function assertWin32DumperClosure(dumperDir) {
    const { peDllImportsViaFile } = require(collectWindowsParserDllsPath);
    const objdump = findWin32Objdump();
    if (!objdump) {
        console.log('win32: llvm-objdump not found — skip dumper import closure check');
        return;
    }
    const present = new Set(readdirSync(dumperDir));
    const missing = [];
    const queue = ['astJsonDumper.node'];
    const scanned = new Set();
    while (queue.length > 0) {
        const file = queue.shift();
        if (!file || scanned.has(file)) {
            continue;
        }
        scanned.add(file);
        const pePath = join(dumperDir, file);
        if (!existsSync(pePath)) {
            continue;
        }
        for (const dllName of peDllImportsViaFile(objdump, pePath)) {
            if (WIN_SYSTEM_DLL.has(dllName)) {
                continue;
            }
            if (!present.has(dllName)) {
                missing.push(`${dllName} (imported by ${file})`);
            } else if (!scanned.has(dllName)) {
                queue.push(dllName);
            }
        }
    }
    if (missing.length > 0) {
        throw new Error(`win32 platform tgz incomplete — missing in dumper/: ${missing.join('; ')}`);
    }
    console.log(`win32: dumper import closure OK (${present.size} file(s))`);
}

function findOtool() {
    const candidates = ['/usr/bin/otool', 'otool'];
    if (process.env.LLVM_PREFIX) {
        candidates.unshift(join(process.env.LLVM_PREFIX, 'bin', 'otool'));
    }
    const brewPrefix = spawnSync('brew', ['--prefix', 'llvm@19'], { encoding: 'utf8' });
    if (brewPrefix.status === 0 && brewPrefix.stdout?.trim()) {
        candidates.unshift(join(brewPrefix.stdout.trim(), 'bin', 'otool'));
    }
    for (const p of candidates) {
        if (p.includes('/') && existsSync(p)) {
            return p;
        }
        const which = spawnSync('which', [p], { encoding: 'utf8' });
        if (which.status === 0 && which.stdout?.trim()) {
            return which.stdout.trim();
        }
    }
    return undefined;
}

function isDarwinSystemDylib(depPath) {
    const p = depPath.trim();
    if (p.startsWith('/usr/lib/') || p.startsWith('/System/') || p.startsWith('/Library/')) {
        return true;
    }
    const base = basename(p);
    return (
        base === 'libc++.1.dylib' ||
        base === 'libSystem.B.dylib' ||
        base === 'libobjc.A.dylib' ||
        base === 'libresolv.9.dylib'
    );
}

function darwinDepBasename(depPath) {
    const p = depPath.trim().split(' ')[0];
    if (p.startsWith('@loader_path/') || p.startsWith('@rpath/')) {
        return basename(p.replace(/^@(loader_path|rpath)\//, ''));
    }
    return basename(p);
}

function otoolDylibDeps(otool, binaryPath) {
    const r = spawnSync(otool, ['-L', binaryPath], { encoding: 'utf8' });
    if (r.status !== 0) {
        throw new Error(`otool -L failed for ${binaryPath} (exit ${r.status})`);
    }
    const deps = [];
    for (const line of (r.stdout ?? '').split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.endsWith(':') || !trimmed.includes('.dylib')) {
            continue;
        }
        deps.push(trimmed.split(/\s+/)[0]);
    }
    return deps;
}

function assertDarwinDumperClosure(dumperDir) {
    const otool = findOtool();
    if (!otool) {
        console.log('darwin: otool not found — skip dumper dylib closure check');
        return;
    }
    const present = new Set(readdirSync(dumperDir));
    const missing = [];
    const queue = ['astJsonDumper.node'];
    const scanned = new Set();
    while (queue.length > 0) {
        const file = queue.shift();
        if (!file || scanned.has(file)) {
            continue;
        }
        scanned.add(file);
        const binPath = join(dumperDir, file);
        if (!existsSync(binPath)) {
            continue;
        }
        for (const dep of otoolDylibDeps(otool, binPath)) {
            if (isDarwinSystemDylib(dep)) {
                continue;
            }
            const base = darwinDepBasename(dep);
            if (!base.endsWith('.dylib')) {
                continue;
            }
            if (!present.has(base)) {
                missing.push(`${base} (imported by ${file}, ref ${dep})`);
            } else if (!scanned.has(base)) {
                queue.push(base);
            }
        }
    }
    if (missing.length > 0) {
        throw new Error(`darwin platform tgz incomplete — missing in dumper/: ${missing.join('; ')}`);
    }
    console.log(`darwin: dumper dylib closure OK (${present.size} file(s))`);
}

function prepareDarwinNativePath(workDir) {
    const dumperDir = platformDumperDir(workDir);
    if (!existsSync(dumperDir)) {
        return;
    }
    const names = readdirSync(dumperDir);
    console.log(`dumper contents: ${names.join(', ') || '(empty)'}`);
    if (!names.some((n) => n.endsWith('.node'))) {
        throw new Error('darwin: missing astJsonDumper.node in platform package dumper/');
    }
    if (!names.some((n) => /^libLLVM/i.test(n) && n.endsWith('.dylib'))) {
        throw new Error('darwin: missing libLLVM*.dylib in platform package dumper/');
    }
    assertDarwinDumperClosure(dumperDir);
    const prev = process.env.DYLD_LIBRARY_PATH || '';
    process.env.DYLD_LIBRARY_PATH = prev ? `${dumperDir}${delimiter}${prev}` : dumperDir;
}

function prepareLinuxNativePath(workDir) {
    const dumperDir = platformDumperDir(workDir);
    if (!existsSync(dumperDir)) {
        return;
    }
    const names = readdirSync(dumperDir);
    console.log(`dumper contents: ${names.join(', ') || '(empty)'}`);
    if (!names.some((n) => n.endsWith('.node'))) {
        throw new Error('linux: missing astJsonDumper.node in platform package dumper/');
    }
    const prev = process.env.LD_LIBRARY_PATH || '';
    process.env.LD_LIBRARY_PATH = prev ? `${dumperDir}${delimiter}${prev}` : dumperDir;
}

function prepareWin32NativePath(workDir) {
    const dumperDir = platformDumperDir(workDir);
    if (!existsSync(dumperDir)) {
        return;
    }
    const names = readdirSync(dumperDir);
    console.log(`dumper contents: ${names.join(', ') || '(empty)'}`);
    if (!names.some((n) => n.toLowerCase().endsWith('.node'))) {
        throw new Error('win32: missing astJsonDumper.node in platform package dumper/');
    }
    if (!names.some((n) => /^libLLVM/i.test(n))) {
        throw new Error('win32: missing libLLVM*.dll in platform package dumper/');
    }
    assertWin32DumperClosure(dumperDir);
    process.env.PATH = `${dumperDir}${delimiter}${process.env.PATH || ''}`;
}

function prepareNativePlatformPath(workDir) {
    if (process.platform === 'win32') {
        prepareWin32NativePath(workDir);
    } else if (process.platform === 'darwin') {
        prepareDarwinNativePath(workDir);
    } else if (process.platform === 'linux') {
        prepareLinuxNativePath(workDir);
    }
}

function verifyPlatformNative(workDir) {
    prepareNativePlatformPath(workDir);
    const projectDir = materializeProject(workDir, 'mini-cpp-platform', {
        'minimal.cpp': join(fixturesDir, 'minimal.cpp'),
    });
    const cppPath = join(projectDir, 'minimal.cpp');
    const mod = require(join(workDir, 'node_modules', platformPkg));
    const { AstParser } = mod;
    if (typeof AstParser?.runCppAst !== 'function') {
        throw new Error(`${platformPkg}: AstParser.runCppAst missing`);
    }
    let parsed = false;
    const result = AstParser.runCppAst({
        scene: { getCcjsonPath: () => undefined },
        sources: [cppPath],
        projectDir,
        includeDirs: [],
        maxParallelProcesses: 1,
        maxPendingAstResults: 2,
        onSourceAst: (_source, astRoot) => {
            parsed = astRoot != null;
        },
    });
    if (result.exitCode !== 0) {
        throw new Error(`${platformPkg}: runCppAst exitCode=${result.exitCode}`);
    }
    if (!parsed) {
        throw new Error(`${platformPkg}: runCppAst did not produce an AST root`);
    }
    console.log(`${platformPkg}: native addon parsed minimal.cpp`);
}

function verifyMainWithCpp(workDir) {
    prepareNativePlatformPath(workDir);
    const projectDir = materializeProject(workDir, 'mini-cpp-integrated', {
        'minimal.cpp': join(fixturesDir, 'minimal.cpp'),
    });
    const mod = require(join(workDir, 'node_modules', 'arkanalyzer'));
    const { Scene, SceneConfig } = mod;
    const config = new SceneConfig({
        supportFileExts: ['.cpp', '.cc', '.cxx', '.h', '.hpp'],
        enableMethodBodyBuild: true,
    });
    config.buildFromProjectDir(projectDir);
    const scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    const files = scene.getFiles();
    if (!files.length) {
        throw new Error('main+cpp: Scene has no CXX files');
    }
    const classes = files[0].getClasses();
    if (!classes.length) {
        throw new Error('main+cpp: no ArkClass from minimal.cpp (is platform package installed?)');
    }
    console.log(`main+cpp: Scene built CXX file with ${classes.length} class(es)`);
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    const workDir = setupWorkDir(args);
    console.log(`Work dir: ${workDir}`);
    console.log(`Platform: ${process.platform}-${process.arch} -> ${platformPkg}`);

    step('1) main package alone (ArkTS Scene)', () => verifyMainPackage(workDir));

    if (!args.cxxTgz) {
        console.log('\nSkip C++ tests (no --cxx-tgz). Re-run with platform tgz for this OS.');
        return;
    }

    step(`2) platform package native (${platformPkg})`, () => verifyPlatformNative(workDir));
    step('3) main package + platform C++ (Scene + CppFrontend path)', () => verifyMainWithCpp(workDir));

    console.log('\nAll requested checks passed.');
}

try {
    main();
} catch (err) {
    console.error('\nVERIFY FAILED:', err instanceof Error ? err.message : err);
    if (/module could not be found|dlopen|image not found/i.test(String(err))) {
        if (process.platform === 'win32') {
            console.error('Hint: win32 platform tgz may be missing DLLs in dumper/ (see collectWindowsParserDlls CI logs).');
        } else if (process.platform === 'darwin') {
            console.error('Hint: darwin platform tgz may be missing .dylib in dumper/ (see otool -L CI collect step).');
        }
    }
    process.exit(1);
}
