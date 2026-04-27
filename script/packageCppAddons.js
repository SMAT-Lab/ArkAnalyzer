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

const isCi = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
if (isCi) {
    console.log('[packageCppAddons] skipped: disabled in CI/release environment.');
    process.exit(0);
}

const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'src', 'frontend', 'cppFrontend', 'ast', 'dumper');
const targetDir = path.join(projectRoot, 'lib', 'ast');

if (!fs.existsSync(sourceDir)) {
    console.log('[packageCppAddons] source not found, skip:', sourceDir);
    process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });
console.log('[packageCppAddons] copied', sourceDir, '->', targetDir);
