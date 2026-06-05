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

const { existsSync, readFileSync, unlinkSync, writeFileSync } = require('fs');
const { join } = require('path');
const { getProjectRoot, runCommand } = require('./cpp/cppPackUtils');

const projectRoot = getProjectRoot();
const packageJsonPath = join(projectRoot, 'package.json');
const packageJsonBackupPath = join(projectRoot, '.package.json.prepack.bak');

function backupPackageJson() {
    writeFileSync(packageJsonBackupPath, readFileSync(packageJsonPath, 'utf8'));
}

backupPackageJson();

console.log('[prepack] arkanalyzer tgz is ArkTS-only (C++ is a separate platform package if build:cpp was run)');

runCommand('npm', ['run', 'build'], { cwd: projectRoot });
runCommand('npx', ['tsc', '-p', 'tsconfig.prod.json'], { cwd: projectRoot });
runCommand('node', ['script/vendorOhosTypescript.js'], { cwd: projectRoot });
