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

const { cpSync, existsSync, mkdirSync, readdirSync, rmSync } = require('fs');
const { join, resolve, delimiter } = require('path');
const { spawnSync } = require('child_process');

const projectRoot = join(__dirname, '..');
const isWin = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const REL_AST = join('src', 'frontend', 'cppFrontend', 'ast');
const REL_AST_CPP = join(REL_AST, 'cpp');
const REL_AST_BUILD = join(REL_AST_CPP, 'build');

const astDir = join(projectRoot, REL_AST);
const astCppDir = join(projectRoot, REL_AST_CPP);
const buildDir = join(astCppDir, 'build');
const dumperDir = join(astDir, 'dumper');
/** N-API addon output (see cpp/CMakeLists.txt). */
const ADDON_NODE = 'astJsonDumper.node';
const targetAddonPath = join(dumperDir, ADDON_NODE);

/** 常见 Unix 布局：<prefix>/bin/llvm-config 与 <prefix>/lib/cmake/llvm 成对出现，避免两处手写重复路径。 */
const UNIX_LLVM_PREFIXES = [
    '/usr/lib/llvm-19',
    '/opt/homebrew/opt/llvm@19',
    '/usr/local/opt/llvm@19',
    '/opt/homebrew/opt/llvm',
    '/usr/local/opt/llvm',
];

/** 非标准布局（无法由 UNIX_LLVM_PREFIXES 推导），仅用于 existsSync 兜底。 */
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

/**
 * @param {Record<string, string | undefined>} [envExtra]
 */
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
        ? spawnSync(llvmConfig, ['--cmakedir'], { encoding: 'utf8' })
        : { status: 1 };
    if (llvmConfigResult.status === 0) {
        const llvmDir = llvmDirFromEnv ?? llvmConfigResult.stdout.trim();
        return { llvmDir, clangDir: clangDirBesideLlvm(llvmDir, clangDirFromEnv) };
    }

    const defaultLlvm = firstExistingLlvmCmakeDir();
    if (defaultLlvm) {
        const llvmDir = llvmDirFromEnv ?? defaultLlvm;
        return { llvmDir, clangDir: clangDirBesideLlvm(llvmDir, clangDirFromEnv) };
    }

    if (!isWin) {
        const brew = spawnSync('brew', ['--prefix', 'llvm'], { encoding: 'utf8' });
        if (brew.status === 0) {
            const prefix = brew.stdout.trim();
            if (prefix) {
                return {
                    llvmDir: llvmDirFromEnv ?? join(prefix, 'lib', 'cmake', 'llvm'),
                    clangDir: clangDirFromEnv ?? join(prefix, 'lib', 'cmake', 'clang'),
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

/**
 * 与「清空后重新 cmake」等效，避免在旧缓存上因编译器/选项变更导致 N-API 目标未生成。
 * 只删除 `build` 下的内容、不 `rm -rf build` 本身，这样终端里 `cd` 在 `ast/cpp/build` 时
 * 当前工作目录不会变成已删除的 inode，后续 `npm` 的 process.cwd() 不会 ENOENT。
 * 需增量时设置 ARKANALYZER_INCREMENTAL_CPP_BUILD=1 跳过此步。
 */
function ensureFreshCppBuildDir() {
    if (process.env.ARKANALYZER_INCREMENTAL_CPP_BUILD === '1') {
        return;
    }
    if (!existsSync(buildDir)) {
        return;
    }
    for (const name of readdirSync(buildDir, { withFileTypes: true })) {
        rmSync(join(buildDir, name.name), { recursive: true, force: true });
    }
}

ensureFreshCppBuildDir();
mkdirSync(buildDir, { recursive: true });
mkdirSync(dumperDir, { recursive: true });

const { llvmDir, clangDir } = discoverLlvmCmakeDirs();
if (!llvmDir || !clangDir) {
    console.error(
        '[build:cpp] Could not find LLVM/Clang CMake dirs. Set LLVM_DIR and Clang_DIR, or install llvm-config / LLVM dev packages.',
    );
    process.exit(1);
}

const nodeApiDir = resolveNodeApiIncludeDir();
if (!nodeApiDir) {
    console.error(
        '[build:cpp] node_api.h not found. Set NODE_API_INCLUDE_DIR, or run `npm install` (node-api-headers), or install Node headers (e.g. /usr/include/node).',
    );
    process.exit(1);
}

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

runCommand('cmake', cmakeConfigureArgs, envForCmake);
const cmakeBuildArgs = ['--build', REL_AST_BUILD, '--target', 'astJsonDumper_addon', '-j'];
if (isWin && !useWinNinja) {
    cmakeBuildArgs.push('--config', 'Release');
}
runCommand('cmake', cmakeBuildArgs, envForCmake);

const outputNode = findBuiltAddonNodePath();
if (!existsSync(outputNode)) {
    console.error(`[build:cpp] ${ADDON_NODE} not found after build: ${outputNode}`);
    process.exit(1);
}
cpSync(outputNode, targetAddonPath);
console.log(`[build:cpp] Copied ${outputNode} -> ${targetAddonPath}`);
