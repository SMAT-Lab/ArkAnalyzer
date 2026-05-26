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

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const rootPackageJsonPath = path.join(projectRoot, 'package.json');
const runtimePackageJsonPath = path.join(projectRoot, 'packages', 'cxx-ast-runtime', 'package.json');
const addonPackages = [
    '@arkanalyzer/ast-addon-linux-x64',
    '@arkanalyzer/ast-addon-linux-arm64',
    '@arkanalyzer/ast-addon-win32-x64',
    '@arkanalyzer/ast-addon-darwin-arm64',
];

function syncOptionalDeps(packageJsonPath, logLabel) {
    if (!fs.existsSync(packageJsonPath)) {
        return false;
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8')).version;
    const originalOptionalDeps = packageJson.optionalDependencies ?? {};
    const nextOptionalDeps = { ...originalOptionalDeps };

    for (const addonPackage of addonPackages) {
        nextOptionalDeps[addonPackage] = version;
    }

    const isChanged = addonPackages.some((addonPackage) => originalOptionalDeps[addonPackage] !== version);
    if (!isChanged) {
        console.log(`[syncAddonOptionalDeps] ${logLabel} optionalDependencies already synced to`, version);
        return false;
    }

    packageJson.optionalDependencies = nextOptionalDeps;
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
    console.log(`[syncAddonOptionalDeps] synced ${logLabel} optionalDependencies to`, version);
    return true;
}

syncOptionalDeps(runtimePackageJsonPath, '@arkanalyzer/cxx-ast-runtime');
