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

const { existsSync } = require('fs');
const { join, resolve, delimiter } = require('path');
const { spawnSync } = require('child_process');

const projectRoot = resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const REL_AST_CPP = join('packages', 'cxx-ast-runtime', 'cpp');
const REL_AST_BUILD = join(REL_AST_CPP, 'build');
const buildDir = join(projectRoot, REL_AST_BUILD);
const TEST_TARGET = 'astJsonDumper_unit_tests';
const GTEST_DIR = join(projectRoot, 'tools', 'googletest');

function collectSystemGoogletestProbePaths() {
    const headerPaths = [
        '/usr/include/gtest/gtest.h',
        '/usr/local/include/gtest/gtest.h',
    ];
    const cmakeConfigPaths = [
        '/usr/lib/x86_64-linux-gnu/cmake/GTest/GTestConfig.cmake',
        '/usr/lib/aarch64-linux-gnu/cmake/GTest/GTestConfig.cmake',
        '/usr/lib/cmake/GTest/GTestConfig.cmake',
        '/usr/local/lib/cmake/GTest/GTestConfig.cmake',
    ];
    if (process.platform === 'darwin') {
        const brewPrefix = spawnSync('brew', ['--prefix', 'googletest'], { encoding: 'utf8' });
        if (brewPrefix.status === 0) {
            const prefix = brewPrefix.stdout.trim();
            headerPaths.push(join(prefix, 'include', 'gtest', 'gtest.h'));
            cmakeConfigPaths.push(join(prefix, 'lib', 'cmake', 'GTest', 'GTestConfig.cmake'));
        }
    }
    if (isWin) {
        headerPaths.push('C:\\Program Files\\gtest\\include\\gtest\\gtest.h');
        const vcpkgRoot = process.env.VCPKG_ROOT;
        if (vcpkgRoot) {
            for (const triplet of ['x64-windows', 'x86-windows']) {
                headerPaths.push(join(vcpkgRoot, 'installed', triplet, 'include', 'gtest', 'gtest.h'));
                cmakeConfigPaths.push(
                    join(vcpkgRoot, 'installed', triplet, 'share', 'gtest', 'GTestConfig.cmake'),
                );
            }
        }
    }
    return { headerPaths, cmakeConfigPaths };
}

function hasSystemGoogletest() {
    const { headerPaths, cmakeConfigPaths } = collectSystemGoogletestProbePaths();
    if (headerPaths.some((path) => existsSync(path)) || cmakeConfigPaths.some((path) => existsSync(path))) {
        return true;
    }
    if (isCommandAvailable('pkg-config')) {
        return spawnSync('pkg-config', ['--exists', 'gtest'], { stdio: 'ignore' }).status === 0;
    }
    return false;
}

function printGoogletestOfflineHelp() {
    console.error('[test:cpp] GoogleTest not found. Offline options:');
    console.error('  - Debian/Ubuntu: sudo apt install libgtest-dev');
    console.error('  - Vendor: unzip googletest v1.14.0 to tools/googletest/');
    console.error('  - Online: re-run npm run test:cpp to auto-download');
}

function ensureGoogletest() {
    if (existsSync(join(GTEST_DIR, 'CMakeLists.txt'))) {
        return;
    }
    if (hasSystemGoogletest()) {
        console.log('[test:cpp] System GoogleTest detected (e.g. libgtest-dev); skipping vendor download.');
        return;
    }
    console.log('[test:cpp] tools/googletest missing and system GTest not found; downloading GoogleTest 1.14.0...');
    const toolsDir = join(projectRoot, 'tools');
    const zipPath = join(toolsDir, 'googletest-1.14.0.zip');
    runCommand('mkdir', ['-p', toolsDir]);
    const curl = spawnSync(
        'curl',
        ['-L', '--retry', '3', '-o', zipPath, 'https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip'],
        { cwd: projectRoot, stdio: 'inherit' },
    );
    if (curl.status !== 0) {
        printGoogletestOfflineHelp();
        process.exit(curl.status ?? 1);
    }
    runCommand('unzip', ['-q', '-o', zipPath, '-d', toolsDir]);
    runCommand('mv', ['-f', join(toolsDir, 'googletest-1.14.0'), GTEST_DIR]);
    runCommand('rm', ['-f', zipPath]);
}

const WIN_OUTPUT_SUBDIRS = [[], ['Release'], ['Debug'], ['RelWithDebInfo'], ['x64', 'Release'], ['x64', 'Debug']];

function runCommand(command, args, envExtra) {
    const result = spawnSync(command, args, {
        cwd: projectRoot,
        stdio: 'inherit',
        env: envExtra ? { ...process.env, ...envExtra } : process.env,
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function isCommandAvailable(command) {
    return spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0;
}

function discoverLlvmCmakeDirs() {
    const llvmDirFromEnv = process.env.LLVM_DIR;
    const clangDirFromEnv = process.env.Clang_DIR;
    if (llvmDirFromEnv && existsSync(llvmDirFromEnv)) {
        const clangDir = clangDirFromEnv || join(resolve(llvmDirFromEnv, '..', '..'), 'clang');
        return { llvmDir: llvmDirFromEnv, clangDir };
    }
    for (const command of ['llvm-config-19', 'llvm-config']) {
        if (!isCommandAvailable(command)) {
            continue;
        }
        const cmakeDir = spawnSync(command, ['--cmakedir'], { encoding: 'utf8' });
        if (cmakeDir.status === 0) {
            const llvmDir = cmakeDir.stdout.trim();
            return { llvmDir, clangDir: join(resolve(llvmDir, '..', '..'), 'clang') };
        }
    }
    const fallback = '/usr/lib/llvm-19/lib/cmake/llvm';
    if (existsSync(fallback)) {
        return { llvmDir: fallback, clangDir: '/usr/lib/llvm-19/lib/cmake/clang' };
    }
    return { llvmDir: undefined, clangDir: undefined };
}

function llvmRootFromCmakeDir(llvmDir) {
    return llvmDir ? resolve(llvmDir, '..', '..', '..') : undefined;
}

function resolveNodeApiIncludeDir() {
    const fromEnv = process.env.NODE_API_INCLUDE_DIR;
    if (fromEnv && existsSync(join(fromEnv, 'node_api.h'))) {
        return fromEnv;
    }
    const fromNm = join(projectRoot, 'node_modules', 'node-api-headers', 'include');
    if (existsSync(join(fromNm, 'node_api.h'))) {
        return fromNm;
    }
    const systemNode = '/usr/include/node';
    if (existsSync(join(systemNode, 'node_api.h'))) {
        return systemNode;
    }
    return undefined;
}

function findBuiltTestBinary() {
    const baseName = isWin ? `${TEST_TARGET}.exe` : TEST_TARGET;
    for (const parts of WIN_OUTPUT_SUBDIRS) {
        const candidate = parts.length ? join(buildDir, ...parts, baseName) : join(buildDir, baseName);
        if (existsSync(candidate)) {
            return candidate;
        }
    }
    return join(buildDir, baseName);
}

function configureCmake({ llvmDir, clangDir, nodeApiDir }) {
    const args = [
        '-S',
        REL_AST_CPP,
        '-B',
        REL_AST_BUILD,
        '-DCMAKE_BUILD_TYPE=Debug',
        `-DLLVM_DIR=${llvmDir}`,
        `-DClang_DIR=${clangDir}`,
        `-DARKANALYZER_ROOT=${projectRoot}`,
        '-DARKANALYZER_BUILD_CPP_TESTS=ON',
    ];
    if (nodeApiDir) {
        args.push(`-DNODE_API_INCLUDE_DIR=${nodeApiDir}`);
    }
    const llvmRoot = llvmRootFromCmakeDir(llvmDir);
    const llvmBin = llvmRoot ? join(llvmRoot, 'bin') : undefined;
    const envForCmake =
        llvmBin && existsSync(llvmBin) ? { PATH: `${llvmBin}${delimiter}${process.env.PATH || ''}` } : undefined;
    runCommand('cmake', args, envForCmake);
}

function main() {
    const { llvmDir, clangDir } = discoverLlvmCmakeDirs();
    if (!llvmDir || !clangDir) {
        console.error('[test:cpp] Could not find LLVM/Clang CMake dirs. Set LLVM_DIR and Clang_DIR.');
        process.exit(1);
    }
    if (!existsSync(join(projectRoot, 'tests/cppResources/dumper/minimal.cpp'))) {
        console.error('[test:cpp] Missing tests/cppResources/dumper fixtures.');
        process.exit(1);
    }

    ensureGoogletest();

    const nodeApiDir = resolveNodeApiIncludeDir();
    if (!nodeApiDir) {
        console.warn('[test:cpp] node_api.h not found; configuring without astJsonDumper.node target.');
    }

    configureCmake({ llvmDir, clangDir, nodeApiDir });

    const buildArgs = ['--build', REL_AST_BUILD, '--target', TEST_TARGET, '-j'];
    if (isWin && !isCommandAvailable('ninja')) {
        buildArgs.push('--config', 'Debug');
    }
    runCommand('cmake', buildArgs);

    const testBinary = findBuiltTestBinary();
    if (!existsSync(testBinary)) {
        console.error(`[test:cpp] Test binary not found: ${testBinary}`);
        process.exit(1);
    }
    console.log(`[test:cpp] Running ${testBinary}`);
    runCommand(testBinary, []);
}

main();
