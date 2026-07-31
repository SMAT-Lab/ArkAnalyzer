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

const { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const { rmDirSafe } = require('../shared/fileUtils');
const { join } = require('path');
const { buildCxxAstRuntimeLib, runFlatcCodegen, runCommand } = require('./cppPackUtils');

const projectRoot = join(__dirname, '..', '..');
const cxxAstRuntimeRoot = join(projectRoot, 'packages', 'cxx-ast-parser');
const cxxLibIndex = join(cxxAstRuntimeRoot, 'lib', 'index.js');

const PLATFORM_OS_CPU = {
    'linux-x64': { os: 'linux', cpu: 'x64' },
    'linux-arm64': { os: 'linux', cpu: 'arm64' },
    'win32-x64': { os: 'win32', cpu: 'x64' },
    'darwin-arm64': { os: 'darwin', cpu: 'arm64' },
};

function currentPlatformArch() {
    return `${process.platform}-${process.arch}`;
}

function platformPackageName(platformArch) {
    return `@arkanalyzer/cxx-ast-parser-${platformArch}`;
}

function parsePlatformArch(platformArch) {
    const meta = PLATFORM_OS_CPU[platformArch];
    if (!meta) {
        throw new Error(`Unsupported platform arch for npm pack: ${platformArch}`);
    }
    return meta;
}

function readRootVersion() {
    return JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')).version;
}

function readFlatbuffersVersion() {
    const pkg = JSON.parse(readFileSync(join(cxxAstRuntimeRoot, 'package.json'), 'utf8'));
    const range = pkg.dependencies?.flatbuffers ?? '^25.2.10';
    return range.replace(/^[\^~]/, '');
}

function ensureCxxRuntimeLibBuilt() {
    if (existsSync(cxxLibIndex)) {
        return;
    }
    runFlatcCodegen({ logPrefix: '[packPlatformCxx]', exitOnError: true });
    buildCxxAstRuntimeLib({ logPrefix: '[packPlatformCxx]' });
    if (!existsSync(cxxLibIndex)) {
        console.error('[packPlatformCxx] Missing', cxxLibIndex);
        process.exit(1);
    }
}

function assemblePlatformPackage(platformArch, nativeDir, outDir) {
    const { os, cpu } = parsePlatformArch(platformArch);
    const version = readRootVersion();
    const flatbuffersVersion = readFlatbuffersVersion();
    const pkgDir = join(outDir, platformArch);
    const libDir = join(pkgDir, 'lib');
    const dumperDir = join(pkgDir, 'dumper');

    rmDirSafe(pkgDir);
    mkdirSync(dumperDir, { recursive: true });
    ensureCxxRuntimeLibBuilt();
    cpSync(join(cxxAstRuntimeRoot, 'lib'), libDir, { recursive: true });

    const nodeSrc = join(nativeDir, 'astJsonDumper.node');
    if (!existsSync(nodeSrc)) {
        console.error('[packPlatformCxx] Missing', nodeSrc);
        process.exit(1);
    }
    cpSync(nativeDir, dumperDir, { recursive: true });

    const packageJson = {
        name: platformPackageName(platformArch),
        version,
        description: `Platform C++ AST parser for ArkAnalyzer (${platformArch})`,
        license: 'Apache-2.0',
        main: 'lib/index.js',
        types: 'lib/index.d.ts',
        files: ['lib', 'dumper'],
        exports: {
            '.': {
                types: './lib/index.d.ts',
                default: './lib/index.js',
            },
        },
        dependencies: {
            flatbuffers: flatbuffersVersion,
        },
        os: [os],
        cpu: [cpu],
    };
    writeFileSync(join(pkgDir, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);

    runCommand('npm', ['pack', pkgDir], { cwd: outDir });
    console.log(`[packPlatformCxx] Packed ${packageJson.name}@${version} in ${outDir}`);
}

function packLocalCurrentPlatform() {
    const platformArch = currentPlatformArch();
    const dumperDir = join(cxxAstRuntimeRoot, 'dumper');
    if (!existsSync(join(dumperDir, 'astJsonDumper.node'))) {
        console.error('[packPlatformCxx] Run npm run build:cpp first (missing dumper/astJsonDumper.node)');
        process.exit(1);
    }
    assemblePlatformPackage(platformArch, dumperDir, projectRoot);
}

function main() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args[0] === '--local') {
        packLocalCurrentPlatform();
        return;
    }
    if (args.length === 2) {
        assemblePlatformPackage(args[0], args[1], projectRoot);
        return;
    }
    console.error('Usage: node script/cpp/packPlatformCxxPackage.js [--local]');
    console.error('       node script/cpp/packPlatformCxxPackage.js <platformArch> <nativeArtifactDir>');
    process.exit(1);
}

if (require.main === module) {
    main();
}

module.exports = { packLocalCurrentPlatform, assemblePlatformPackage };
