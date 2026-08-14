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

const { cpSync, existsSync, mkdirSync, readdirSync } = require('fs');
const { rmDirSafe } = require('../shared/fileUtils');
const { join, resolve, delimiter } = require('path');
const {
    buildCxxAstRuntimeLib,
    ensureCxxAstRuntimeInstalled,
    ensureFlatbuffersTools,
    installCxxAstRuntimeDeps,
    isCommandAvailable,
    resolveFlatbuffersIncludeDir,
    runCommand,
    runCommandOptional,
    runFlatcCodegen,
    spawnCommand,
} = require('./cppPackUtils');

const projectRoot = join(__dirname, '..', '..');
const cxxAstRuntimeRoot = join(projectRoot, 'packages', 'cxx-ast-parser');
const isWin = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const REL_AST_CPP = join('packages', 'cxx-ast-parser', 'cpp');
const REL_AST_BUILD = join(REL_AST_CPP, 'build');

const astCppDir = join(projectRoot, REL_AST_CPP);
const buildDir = join(astCppDir, 'build');
const dumperDir = join(projectRoot, 'packages', 'cxx-ast-parser', 'dumper');
/** N-API addon output (see cpp/CMakeLists.txt). */
const ADDON_NODE = 'astJsonDumper.node';
const targetAddonPath = join(dumperDir, ADDON_NODE);

const UNIX_LLVM_PREFIXES = [
    '/usr/lib/llvm-19',
    '/opt/homebrew/opt/llvm@19',
    '/usr/local/opt/llvm@19',
    '/opt/homebrew/opt/llvm',
    '/usr/local/opt/llvm',
];

const EXTRA_UNIX_LLVM_CMAKE_DIRS = ['/usr/local/lib/llvm-19/cmake/llvm'];

const MSYS2_ENV_SUBDIRS = ['mingw64', 'ucrt64', 'clang64'];
const MSYS2_SHORT_PREFIX = {
    '/mingw64': 'mingw64',
    '/ucrt64': 'ucrt64',
    '/clang64': 'clang64',
    '/clang32': 'clang32',
    '/mingw32': 'mingw32',
};

const WIN_OUTPUT_SUBDIRS = [
    [],
    ['Release'],
    ['Debug'],
    ['MinSizeRel'],
    ['RelWithDebInfo'],
    ['x64', 'Release'],
    ['x64', 'Debug'],
];

function mingwPrefixToWindowsPath(mingwPrefix) {
    if (!mingwPrefix || typeof mingwPrefix !== 'string') {
        return undefined;
    }
    if (/^[A-Za-z]:[\\/]/.test(mingwPrefix)) {
        return mingwPrefix.replace(/\//g, '\\');
    }
    const key = mingwPrefix.replace(/\\/g, '/').replace(/\/+$/, '');
    const sub = MSYS2_SHORT_PREFIX[key];
    if (!sub) {
        return undefined;
    }
    const root = process.env.MSYS2_ROOT;
    return root ? join(root, sub) : join('C:\\msys64', sub);
}

function windowsLlvmInstallRoots() {
    const out = [];
    const pf = process.env.ProgramFiles;
    const pf86 = process.env['ProgramFiles(x86)'];
    const local = process.env.LOCALAPPDATA;
    if (pf) {
        out.push(join(pf, 'LLVM'));
    }
    if (pf86) {
        out.push(join(pf86, 'LLVM'));
    }
    if (local) {
        out.push(join(local, 'Programs', 'LLVM'));
    }
    const mp = mingwPrefixToWindowsPath(process.env.MINGW_PREFIX);
    if (mp) {
        out.push(mp);
    }
    const roots = new Set([process.env.MSYS2_ROOT, 'C:\\msys64', 'C:\\msys32', 'D:\\msys64'].filter(Boolean));
    for (const root of roots) {
        for (const sub of MSYS2_ENV_SUBDIRS) {
            out.push(join(root, sub));
        }
    }
    return out;
}

function firstWorkingLlvmConfig() {
    const candidates = ['llvm-config', 'llvm-config-19'];
    if (!isWin) {
        for (const prefix of UNIX_LLVM_PREFIXES) {
            candidates.push(join(prefix, 'bin', 'llvm-config'));
        }
    } else {
        for (const base of windowsLlvmInstallRoots()) {
            candidates.push(join(base, 'bin', 'llvm-config.exe'));
        }
    }
    for (const command of candidates) {
        const isPath = command.includes('/') || command.includes('\\');
        if (isPath && !existsSync(command)) {
            continue;
        }
        if (isCommandAvailable(command)) {
            return command;
        }
    }
    return undefined;
}

function firstExistingLlvmCmakeDir() {
    if (isWin) {
        for (const base of windowsLlvmInstallRoots()) {
            const dir = join(base, 'lib', 'cmake', 'llvm');
            if (existsSync(dir)) {
                return dir;
            }
        }
        return undefined;
    }
    for (const prefix of UNIX_LLVM_PREFIXES) {
        const dir = join(prefix, 'lib', 'cmake', 'llvm');
        if (existsSync(dir)) {
            return dir;
        }
    }
    for (const dir of EXTRA_UNIX_LLVM_CMAKE_DIRS) {
        if (existsSync(dir)) {
            return dir;
        }
    }
    return undefined;
}

function clangDirBesideLlvm(llvmDir, clangDirFromEnv) {
    if (clangDirFromEnv) {
        return clangDirFromEnv;
    }
    const d = join(llvmDir, '..', 'clang');
    return existsSync(d) ? d : undefined;
}

function discoverLlvmCmakeDirs() {
    const llvmDirFromEnv = process.env.LLVM_DIR;
    const clangDirFromEnv = process.env.Clang_DIR;
    if (llvmDirFromEnv && clangDirFromEnv) {
        return { llvmDir: llvmDirFromEnv, clangDir: clangDirFromEnv };
    }

    const llvmConfig = firstWorkingLlvmConfig();
    const llvmConfigResult = llvmConfig
        ? spawnCommand(llvmConfig, ['--cmakedir'], { encoding: 'utf8' })
        : { status: 1 };
    if (llvmConfigResult.status === 0) {
        const cmakeDir = (llvmConfigResult.stdout ?? '').trim();
        if (cmakeDir) {
            const llvmDir = llvmDirFromEnv ?? cmakeDir;
            return { llvmDir, clangDir: clangDirBesideLlvm(llvmDir, clangDirFromEnv) };
        }
    }

    const defaultLlvm = firstExistingLlvmCmakeDir();
    if (defaultLlvm) {
        const llvmDir = llvmDirFromEnv ?? defaultLlvm;
        return { llvmDir, clangDir: clangDirBesideLlvm(llvmDir, clangDirFromEnv) };
    }

    if (!isWin) {
        for (const formula of ['llvm@19', 'llvm']) {
            const brew = spawnCommand('brew', ['--prefix', formula], { encoding: 'utf8' });
            if (brew.status !== 0) {
                continue;
            }
            const prefix = (brew.stdout ?? '').trim();
            if (!prefix) {
                continue;
            }
            const llvmDir = join(prefix, 'lib', 'cmake', 'llvm');
            const clangDir = join(prefix, 'lib', 'cmake', 'clang');
            if (existsSync(llvmDir) && existsSync(clangDir)) {
                return {
                    llvmDir: llvmDirFromEnv ?? llvmDir,
                    clangDir: clangDirFromEnv ?? clangDir,
                };
            }
        }
    }

    return { llvmDir: llvmDirFromEnv, clangDir: clangDirFromEnv };
}

/** LLVM 安装根目录，例如 .../lib/cmake/llvm -> .../ */
function llvmRootFromCmakeDir(llvmDir) {
    if (!llvmDir) {
        return undefined;
    }
    return resolve(llvmDir, '..', '..', '..');
}

/**
 * 与手动的 -DNODE_API_INCLUDE_DIR= 一致：环境变量 > node_modules > /usr/include/node
 */
function resolveNodeApiHeaders() {
    const fromEnv = process.env.NODE_API_INCLUDE_DIR;
    if (fromEnv && existsSync(join(fromEnv, 'node_api.h'))) {
        const defFromEnv = process.env.NODE_API_DEF;
        return {
            includeDir: fromEnv,
            defPath:
                defFromEnv && existsSync(defFromEnv)
                    ? defFromEnv
                    : join(fromEnv, '..', 'def', 'node_api.def'),
        };
    }
    try {
        const apiHeaders = require(join(projectRoot, 'node_modules', 'node-api-headers'));
        if (apiHeaders?.include_dir && existsSync(join(apiHeaders.include_dir, 'node_api.h'))) {
            return {
                includeDir: apiHeaders.include_dir,
                defPath: apiHeaders.def_paths?.node_api_def,
            };
        }
    } catch {
        /* optional package */
    }
    const fromNm = join(projectRoot, 'node_modules', 'node-api-headers', 'include');
    if (existsSync(join(fromNm, 'node_api.h'))) {
        return {
            includeDir: fromNm,
            defPath: join(projectRoot, 'node_modules', 'node-api-headers', 'def', 'node_api.def'),
        };
    }
    const systemNode = '/usr/include/node';
    if (existsSync(join(systemNode, 'node_api.h'))) {
        return { includeDir: systemNode, defPath: undefined };
    }
    return undefined;
}

function shouldUseLld(llvmRoot) {
    if (process.env.ARKANALYZER_USE_LLD === '0') {
        return false;
    }
    if (!isLinux || !llvmRoot) {
        return false;
    }
    return existsSync(join(llvmRoot, 'bin', 'ld.lld'));
}

function findBuiltAddonNodePath() {
    for (const parts of WIN_OUTPUT_SUBDIRS) {
        const p = parts.length ? join(buildDir, ...parts, ADDON_NODE) : join(buildDir, ADDON_NODE);
        if (existsSync(p)) {
            return p;
        }
    }
    return join(buildDir, ADDON_NODE);
}

function ensureFreshCppBuildDir() {
    if (process.env.ARKANALYZER_INCREMENTAL_CPP_BUILD === '1') {
        return;
    }
    if (!existsSync(buildDir)) {
        return;
    }
    for (const name of readdirSync(buildDir, { withFileTypes: true })) {
        rmDirSafe(join(buildDir, name.name));
    }
}

ensureFreshCppBuildDir();
mkdirSync(buildDir, { recursive: true });
mkdirSync(dumperDir, { recursive: true });
runFlatcCodegen({ logPrefix: '[build:cpp]', exitOnError: true });
installCxxAstRuntimeDeps();

const { llvmDir, clangDir } = discoverLlvmCmakeDirs();
if (!llvmDir || !clangDir) {
    console.error(
        '[build:cpp] Could not find LLVM/Clang CMake dirs. Set LLVM_DIR and Clang_DIR, or install llvm-config / LLVM dev packages.',
    );
    process.exit(1);
}

const nodeApiHeaders = resolveNodeApiHeaders();
if (!nodeApiHeaders?.includeDir) {
    console.error(
        '[build:cpp] node_api.h not found. Set NODE_API_INCLUDE_DIR, or run `npm install` (node-api-headers), or install Node headers (e.g. /usr/include/node).',
    );
    process.exit(1);
}
const nodeApiDir = nodeApiHeaders.includeDir;

const llvmRoot = llvmRootFromCmakeDir(llvmDir);
const llvmBin = llvmRoot ? join(llvmRoot, 'bin') : undefined;
const pathWithLlvm = llvmBin && existsSync(llvmBin) ? `${llvmBin}${delimiter}${process.env.PATH || ''}` : undefined;
const envForCmake = pathWithLlvm ? { PATH: pathWithLlvm } : undefined;

const cmakeConfigureArgs = ['-S', REL_AST_CPP, '-B', REL_AST_BUILD, `-DNODE_API_INCLUDE_DIR=${nodeApiDir}`];
const useWinNinja = isWin && isCommandAvailable('ninja');
if (useWinNinja) {
    cmakeConfigureArgs.unshift('-G', 'Ninja');
    cmakeConfigureArgs.push('-DCMAKE_BUILD_TYPE=Release');
} else if (!isWin) {
    cmakeConfigureArgs.push('-DCMAKE_BUILD_TYPE=Release');
}
cmakeConfigureArgs.push(`-DLLVM_DIR=${llvmDir}`, `-DClang_DIR=${clangDir}`);
cmakeConfigureArgs.push(`-DARKANALYZER_ROOT=${projectRoot}`);
if (isWin && nodeApiHeaders.defPath && existsSync(nodeApiHeaders.defPath)) {
    cmakeConfigureArgs.push(`-DNODE_API_DEF=${nodeApiHeaders.defPath}`);
}
ensureFlatbuffersTools({ logPrefix: '[build:cpp] flatbuffers' });
const flatbuffersIncludeDir = resolveFlatbuffersIncludeDir(projectRoot);
if (!flatbuffersIncludeDir) {
    console.error('[build:cpp] flatbuffers C++ headers not found after ensureFlatbuffersTools');
    process.exit(1);
}
cmakeConfigureArgs.push(`-DFLATBUFFERS_INCLUDE_DIR=${flatbuffersIncludeDir}`);
console.log(`[build:cpp] FLATBUFFERS_INCLUDE_DIR=${flatbuffersIncludeDir}`);

if (llvmRoot) {
    const clangxx = isWin ? join(llvmRoot, 'bin', 'clang++.exe') : join(llvmRoot, 'bin', 'clang++');
    const cc = isWin ? join(llvmRoot, 'bin', 'clang.exe') : join(llvmRoot, 'bin', 'clang');
    if (existsSync(clangxx)) {
        cmakeConfigureArgs.push(`-DCMAKE_CXX_COMPILER=${clangxx}`);
    }
    if (existsSync(cc)) {
        cmakeConfigureArgs.push(`-DCMAKE_C_COMPILER=${cc}`);
    }
}

if (shouldUseLld(llvmRoot)) {
    const f = '-fuse-ld=lld';
    cmakeConfigureArgs.push(
        `-DCMAKE_EXE_LINKER_FLAGS=${f}`,
        `-DCMAKE_SHARED_LINKER_FLAGS=${f}`,
        `-DCMAKE_MODULE_LINKER_FLAGS=${f}`,
    );
}

runCommand('cmake', cmakeConfigureArgs, {
    cwd: projectRoot,
    env: envForCmake ? { ...process.env, ...envForCmake } : process.env,
});
const cmakeBuildArgs = ['--build', REL_AST_BUILD, '--target', 'astJsonDumper_addon', '-j'];
if (isWin && !useWinNinja) {
    cmakeBuildArgs.push('--config', 'Release');
}
runCommand('cmake', cmakeBuildArgs, {
    cwd: projectRoot,
    env: envForCmake ? { ...process.env, ...envForCmake } : process.env,
});

const outputNode = findBuiltAddonNodePath();
if (!existsSync(outputNode)) {
    console.error(`[build:cpp] ${ADDON_NODE} not found after build: ${outputNode}`);
    process.exit(1);
}
cpSync(outputNode, targetAddonPath);
console.log(`[build:cpp] Copied ${outputNode} -> ${targetAddonPath}`);
buildCxxAstRuntimeLib({ logPrefix: '[build:cpp]' });
ensureCxxAstRuntimeInstalled();
