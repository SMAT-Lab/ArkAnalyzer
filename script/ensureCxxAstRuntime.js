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

const { existsSync, readFileSync, rmSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');
const { runFlatcCodegen } = require('./flatcCodegen');

const projectRoot = join(__dirname, '..');
const cxxAstRuntimeRoot = join(projectRoot, 'packages', 'cxx-ast-runtime');
const linkedCxxAstRuntimeDir = join(projectRoot, 'node_modules', '@arkanalyzer', 'cxx-ast-runtime');

/** npm may leave a stale copy under node_modules when lib/ was built after the first install. */
function removeLinkedCxxAstRuntimeFromNodeModules() {
    if (existsSync(linkedCxxAstRuntimeDir)) {
        rmSync(linkedCxxAstRuntimeDir, { recursive: true, force: true });
    }
}

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

function runCommandOptional(command, args) {
    const result = spawnSync(command, args, {
        cwd: projectRoot,
        stdio: 'inherit',
        env: process.env,
    });
    return result.status === 0;
}

function isCxxAstRuntimeLoadable() {
    const result = spawnSync(
        process.execPath,
        ['-e', "require('@arkanalyzer/cxx-ast-runtime');"],
        { cwd: projectRoot, stdio: 'pipe', env: process.env },
    );
    if (result.status !== 0 && result.stderr?.length) {
        console.error(`[ensureCxxAstRuntime] require(@arkanalyzer/cxx-ast-runtime): ${result.stderr.toString().trim()}`);
    }
    return result.status === 0;
}

function installLocalCxxAstRuntimePackage() {
    if (!existsSync(join(cxxAstRuntimeRoot, 'package.json'))) {
        return false;
    }
    removeLinkedCxxAstRuntimeFromNodeModules();
    return runCommandOptional('npm', ['install', './packages/cxx-ast-runtime', '--no-save']);
}

function readCxxAstRuntimeVersion() {
    const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
    const fromPeer = pkg.peerDependencies?.['@arkanalyzer/cxx-ast-runtime'];
    if (fromPeer) {
        return fromPeer.replace(/^[\^~]/, '');
    }
    return pkg.version;
}

function buildLocalCxxAstRuntimePackage() {
    if (!existsSync(join(cxxAstRuntimeRoot, 'package.json'))) {
        return false;
    }
    console.log('[ensureCxxAstRuntime] Building local packages/cxx-ast-runtime...');
    runCommand('npm', ['--prefix', 'packages/cxx-ast-runtime', 'install']);
    if (!runFlatcCodegen({ logPrefix: '[ensureCxxAstRuntime]', exitOnError: false })) {
        console.error(
            '[ensureCxxAstRuntime] flatGenerated outputs missing and flatc codegen failed. Run: npm run build:cpp',
        );
        return false;
    }
    runCommand('npm', ['--prefix', 'packages/cxx-ast-runtime', 'run', 'build']);
    if (!installLocalCxxAstRuntimePackage()) {
        return false;
    }
    if (!isCxxAstRuntimeLoadable()) {
        console.error('[ensureCxxAstRuntime] npm linked packages/cxx-ast-runtime but require(@arkanalyzer/cxx-ast-runtime) failed');
        return false;
    }
    return true;
}

function linkLocalCxxAstRuntimePackage() {
    return installLocalCxxAstRuntimePackage();
}

/**
 * Ensures {@link @arkanalyzer/cxx-ast-runtime} is linked under node_modules (required by vitest and C++ frontend).
 * Prefers the in-repo package when present; registry is only used when packages/cxx-ast-runtime is absent.
 */
function ensureCxxAstRuntimeInstalled() {
    if (isCxxAstRuntimeLoadable()) {
        return;
    }
    const hasLocalPackage = existsSync(join(cxxAstRuntimeRoot, 'package.json'));
    if (hasLocalPackage) {
        if (linkLocalCxxAstRuntimePackage() && isCxxAstRuntimeLoadable()) {
            console.log('[ensureCxxAstRuntime] @arkanalyzer/cxx-ast-runtime linked from packages/cxx-ast-runtime');
            return;
        }
        if (!buildLocalCxxAstRuntimePackage()) {
            console.error('[ensureCxxAstRuntime] Failed to build/link local packages/cxx-ast-runtime');
            process.exit(1);
        }
        console.log('[ensureCxxAstRuntime] @arkanalyzer/cxx-ast-runtime linked from packages/cxx-ast-runtime');
        return;
    }
    const version = readCxxAstRuntimeVersion();
    console.log(`[ensureCxxAstRuntime] Trying registry @arkanalyzer/cxx-ast-runtime@${version}...`);
    if (runCommandOptional('npm', ['install', `@arkanalyzer/cxx-ast-runtime@${version}`, '--no-save']) && isCxxAstRuntimeLoadable()) {
        console.log('[ensureCxxAstRuntime] @arkanalyzer/cxx-ast-runtime installed from registry');
        return;
    }
    console.error(
        '[ensureCxxAstRuntime] @arkanalyzer/cxx-ast-runtime is not loadable. Run: npm run build:cpp',
    );
    process.exit(1);
}

if (require.main === module) {
    ensureCxxAstRuntimeInstalled();
}

module.exports = { ensureCxxAstRuntimeInstalled, isCxxAstRuntimeLoadable };
