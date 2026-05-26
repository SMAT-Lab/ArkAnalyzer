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

const { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const projectRoot = join(__dirname, '..');
const cxxAstRuntimeRoot = join(projectRoot, 'packages', 'cxx-ast-runtime');
const astCppDir = join(cxxAstRuntimeRoot, 'cpp');

const FLATC_TS_OUTPUT_MARKERS = [
    'astWire.ts',
    join('ark-cxx-ast-fb', 'cxx-ast-payload.ts'),
    join('ark-cxx-ast-fb', 'cxx-ast-node-wire.ts'),
];
const FLATC_CPP_OUTPUT_MARKER = 'astWire_generated.h';

function runCommand(command, args) {
    const result = spawnSync(command, args, {
        cwd: projectRoot,
        stdio: 'inherit',
        env: process.env,
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function isCommandAvailable(command) {
    return spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0;
}

function flatGeneratedOutputDirs() {
    return {
        cppOut: join(astCppDir, 'serialization', 'flatGenerated'),
        tsOut: join(cxxAstRuntimeRoot, 'ts', 'serialization', 'flatGenerated'),
    };
}

function flatGeneratedOutputsPresent(cppOut, tsOut) {
    if (!existsSync(join(cppOut, FLATC_CPP_OUTPUT_MARKER))) {
        return false;
    }
    return FLATC_TS_OUTPUT_MARKERS.every((rel) => existsSync(join(tsOut, rel)));
}

function resolveFlatcCommand() {
    const candidates = [
        join(cxxAstRuntimeRoot, 'node_modules', 'flatbuffers', 'flatc'),
        join(cxxAstRuntimeRoot, 'node_modules', '.bin', 'flatc'),
        join(projectRoot, 'node_modules', 'flatbuffers', 'flatc'),
        join(projectRoot, 'node_modules', '.bin', 'flatc'),
        join(projectRoot, 'tools', 'flatc'),
        'flatc',
    ];
    for (const command of candidates) {
        if (command === 'flatc') {
            if (isCommandAvailable('flatc')) {
                return command;
            }
            continue;
        }
        if (existsSync(command)) {
            return command;
        }
    }
    return undefined;
}

function patchFlatcTsImports(tsOutDir) {
    for (const entry of readdirSync(tsOutDir, { withFileTypes: true })) {
        const filePath = join(tsOutDir, entry.name);
        if (entry.isDirectory()) {
            patchFlatcTsImports(filePath);
            continue;
        }
        if (!entry.name.endsWith('.ts')) {
            continue;
        }
        const source = readFileSync(filePath, 'utf8');
        const patched = source.replace(/(from\s+['"])([^'"]+)\.js(['"])/g, '$1$2$3');
        if (patched !== source) {
            writeFileSync(filePath, patched);
        }
    }
}

/** Installs packages/cxx-ast-runtime npm deps when flatc is not yet on PATH or under tools/. */
function ensureCxxAstRuntimeFlatcDeps() {
    if (resolveFlatcCommand()) {
        return;
    }
    if (!existsSync(join(cxxAstRuntimeRoot, 'package.json'))) {
        return;
    }
    console.log('[flatcCodegen] Installing packages/cxx-ast-runtime deps for flatc...');
    runCommand('npm', ['--prefix', 'packages/cxx-ast-runtime', 'install']);
}

/**
 * Runs flatc on astWire.fbs when outputs are missing or ARKANALYZER_FORCE_FLATC_CODEGEN=1.
 * @param {{ logPrefix?: string, exitOnError?: boolean }} [options]
 * @returns {boolean} true when outputs are present after this call
 */
function runFlatcCodegen(options = {}) {
    const logPrefix = options.logPrefix ?? '[flatcCodegen]';
    const exitOnError = options.exitOnError !== false;
    const fbsPath = join(astCppDir, 'serialization', 'astWire.fbs');
    const { cppOut, tsOut } = flatGeneratedOutputDirs();
    mkdirSync(cppOut, { recursive: true });
    mkdirSync(tsOut, { recursive: true });

    const forceRegenerate = process.env.ARKANALYZER_FORCE_FLATC_CODEGEN === '1';
    if (!forceRegenerate && flatGeneratedOutputsPresent(cppOut, tsOut)) {
        console.log(
            `${logPrefix} flatGenerated outputs already present; skipping flatc ` +
                '(set ARKANALYZER_FORCE_FLATC_CODEGEN=1 to regenerate)',
        );
        return true;
    }

    ensureCxxAstRuntimeFlatcDeps();
    const flatc = resolveFlatcCommand();
    if (!flatc) {
        const message =
            `${logPrefix} flatc not found. Place flatc under tools/flatc, or run npm run build:cpp ` +
            '(installs flatbuffers via packages/cxx-ast-runtime).';
        if (exitOnError) {
            console.error(message);
            process.exit(1);
        }
        console.warn(message);
        return false;
    }

    console.log(`${logPrefix} flatc codegen: ${fbsPath}`);
    runCommand(flatc, ['--cpp', '-o', cppOut, fbsPath]);
    runCommand(flatc, ['--ts', '-o', tsOut, fbsPath]);
    patchFlatcTsImports(tsOut);
    return flatGeneratedOutputsPresent(cppOut, tsOut);
}

module.exports = {
    ensureCxxAstRuntimeFlatcDeps,
    flatGeneratedOutputDirs,
    flatGeneratedOutputsPresent,
    resolveFlatcCommand,
    runFlatcCodegen,
};
