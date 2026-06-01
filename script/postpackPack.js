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

const { getProjectRoot, isCppBuildReady } = require('./cpp/cppPackUtils');
const { packLocalCurrentPlatform } = require('./cpp/packPlatformCxxPackage');

const packageJsonPath = join(getProjectRoot(), 'package.json');
const packageJsonBackupPath = join(getProjectRoot(), '.package.json.prepack.bak');

if (existsSync(packageJsonBackupPath)) {
    writeFileSync(packageJsonPath, readFileSync(packageJsonBackupPath, 'utf8'));
    unlinkSync(packageJsonBackupPath);
}

if (isCppBuildReady()) {
    console.log('[postpack] C++ build detected: packing platform @arkanalyzer/cxx-ast-parser package');
    packLocalCurrentPlatform();
} else {
    console.log('[postpack] No C++ build: only arkanalyzer-*.tgz (run npm run build:cpp first for a second platform tgz)');
}
