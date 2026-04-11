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

const { cpSync, existsSync, mkdirSync, readFileSync, rmSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const projectRoot = join(__dirname, '..');
const isWin = process.platform === 'win32';
const REL_AST = join('src', 'frontend', 'cppFrontend', 'ast');
const REL_AST_BUILD = join(REL_AST, 'build');

const astDir = join(projectRoot, REL_AST);
const buildDir = join(astDir, 'build');
const dumperDir = join(astDir, 'dumper');
const astJsonDumperBinaryName = isWin ? 'astJsonDumper.exe' : 'astJsonDumper';
const targetBinary = join(dumperDir, astJsonDumperBinaryName);

/** 常见 Unix 布局：<prefix>/bin/llvm-config 与 <prefix>/lib/cmake/llvm 成对出现，避免两处手写重复路径。 */
const UNIX_LLVM_PREFIXES = [
    '/usr/lib/llvm-19',
    '/opt/homebrew/opt/llvm@19',
    '/usr/local/opt/llvm@19',
    '/opt/homebrew/opt/llvm',
    '/usr/local/opt/llvm'
];

/** 非标准布局（无法由 UNIX_LLVM_PREFIXES 推导），仅用于 existsSync 兜底。 */
const EXTRA_UNIX_LLVM_CMAKE_DIRS = ['/usr/local/lib/llvm-19/cmake/llvm'];

const MSYS2_ENV_SUBDIRS = ['mingw64', 'ucrt64', 'clang64'];
const MSYS2_SHORT_PREFIX = {
    '/mingw64': 'mingw64',
    '/ucrt64': 'ucrt64',
    '/clang64': 'clang64',
    '/clang32': 'clang32',
    '/mingw32': 'mingw32'
};

const WIN_OUTPUT_SUBDIRS = [
    [],
    ['Release'],
    ['Debug'],
    ['MinSizeRel'],
    ['RelWithDebInfo'],
    ['x64', 'Release'],
    ['x64', 'Debug']
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

function runCommand(command, args) {
    const result = spawnSync(command, args, { cwd: projectRoot, stdio: 'inherit' });
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
                    clangDir: clangDirFromEnv ?? join(prefix, 'lib', 'cmake', 'clang')
                };
            }
        }
    }

    return { llvmDir: llvmDirFromEnv, clangDir: clangDirFromEnv };
}

function findBuiltAstJsonDumperPath() {
    const name = astJsonDumperBinaryName;
    for (const parts of WIN_OUTPUT_SUBDIRS) {
        const p = parts.length ? join(buildDir, ...parts, name) : join(buildDir, name);
        if (existsSync(p)) {
            return p;
        }
    }
    return join(buildDir, name);
}

function ensureCleanCmakeCache() {
    const cmakeCache = join(buildDir, 'CMakeCache.txt');
    if (!existsSync(cmakeCache)) {
        return;
    }
    const cacheContent = readFileSync(cmakeCache, 'utf8');
    const expectedSource = `CMAKE_HOME_DIRECTORY:INTERNAL=${astDir}`;
    const expectedBuild = `CMAKE_CACHEFILE_DIR:INTERNAL=${buildDir}`;
    if (!cacheContent.includes(expectedSource) || !cacheContent.includes(expectedBuild)) {
        rmSync(buildDir, { recursive: true, force: true });
    }
}

ensureCleanCmakeCache();
mkdirSync(buildDir, { recursive: true });
mkdirSync(dumperDir, { recursive: true });

const { llvmDir, clangDir } = discoverLlvmCmakeDirs();
const cmakeConfigureArgs = ['-S', REL_AST, '-B', REL_AST_BUILD];
const useWinNinja = isWin && isCommandAvailable('ninja');
if (useWinNinja) {
    cmakeConfigureArgs.unshift('-G', 'Ninja');
    cmakeConfigureArgs.push('-DCMAKE_BUILD_TYPE=Release');
}
if (llvmDir) {
    cmakeConfigureArgs.push(`-DLLVM_DIR=${llvmDir}`);
}
if (clangDir) {
    cmakeConfigureArgs.push(`-DClang_DIR=${clangDir}`);
}

runCommand('cmake', cmakeConfigureArgs);
const cmakeBuildArgs = ['--build', REL_AST_BUILD, '-j'];
if (isWin && !useWinNinja) {
    cmakeBuildArgs.push('--config', 'Release');
}
runCommand('cmake', cmakeBuildArgs);

const outputBinary = findBuiltAstJsonDumperPath();
if (!existsSync(outputBinary)) {
    console.error(`[build:cpp] Binary not found after build: ${outputBinary}`);
    process.exit(1);
}
cpSync(outputBinary, targetBinary);
console.log(`[build:cpp] Copied ${outputBinary} -> ${targetBinary}`);
