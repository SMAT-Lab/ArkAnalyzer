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

const { existsSync, readFileSync, rmSync, writeFileSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const { CXX_RUNTIME_PACKAGE, getProjectRoot, isCppBuildReady } = require('./cppPackUtils');

const projectRoot = getProjectRoot();
const packageJsonPath = join(projectRoot, 'package.json');
const packageJsonBackupPath = join(projectRoot, '.package.json.prepack.bak');

function run(command, args) {
    const result = spawnSync(command, args, {
        cwd: projectRoot,
        stdio: 'inherit',
        env: process.env,
        shell: true,
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function readPackageJson() {
    return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
}

function writePackageJson(pkg) {
    writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function backupPackageJson() {
    writeFileSync(packageJsonBackupPath, readFileSync(packageJsonPath, 'utf8'));
}

function configurePackManifest(withCpp) {
    const pkg = readPackageJson();
    if (withCpp) {
        // npm does not bundle peerDependencies; use a file: dep + bundledDependencies for pack.
        pkg.dependencies = pkg.dependencies ?? {};
        pkg.dependencies[CXX_RUNTIME_PACKAGE] = `file:packages/cxx-ast-runtime`;
        pkg.bundledDependencies = [CXX_RUNTIME_PACKAGE];
    } else {
        delete pkg.bundledDependencies;
        if (pkg.dependencies?.[CXX_RUNTIME_PACKAGE]?.startsWith('file:')) {
            delete pkg.dependencies[CXX_RUNTIME_PACKAGE];
            if (Object.keys(pkg.dependencies).length === 0) {
                delete pkg.dependencies;
            }
        }
    }
    writePackageJson(pkg);
}

function removeLinkedRuntimeFromNodeModules() {
    const linked = join(projectRoot, 'node_modules', '@arkanalyzer', 'cxx-ast-runtime');
    if (existsSync(linked)) {
        rmSync(linked, { recursive: true, force: true });
    }
}

/** Drop addon copy from a previous full prepack so lite tgz stays ArkTS-only. */
function removePackagedLibAst() {
    const libAst = join(projectRoot, 'lib', 'ast');
    if (existsSync(libAst)) {
        rmSync(libAst, { recursive: true, force: true });
    }
}

function installBundledRuntime() {
    run('npm', ['install', './packages/cxx-ast-runtime', '--no-save', '--install-links']);
}

const withCpp = isCppBuildReady();

backupPackageJson();
configurePackManifest(withCpp);

run('node', ['script/syncAddonOptionalDeps.js']);
run('npm', ['run', 'build']);
run('npx', ['tsc', '-p', 'tsconfig.prod.json']);
run('node', ['script/vendorOhosTypescript.js']);

if (withCpp) {
    console.log('[prepack] C++ build detected: bundling @arkanalyzer/cxx-ast-runtime into arkanalyzer tgz');
    installBundledRuntime();
    run('node', ['script/packageCppAddons.js']);
} else {
    console.log('[prepack] No C++ build: arkanalyzer tgz is ArkTS-only (run npm run build:cpp first to include C++)');
    removeLinkedRuntimeFromNodeModules();
    removePackagedLibAst();
}
