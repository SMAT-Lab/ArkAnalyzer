/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
const sourceDir = path.join(projectRoot, 'node_modules', 'ohos-typescript');
const targetDir = path.join(projectRoot, 'lib', 'node_modules', 'ohos-typescript');
const markerPath = path.join(sourceDir, '.ohos-typescript-version');

if (!fs.existsSync(sourceDir)) {
    console.error('[vendorOhosTypescript] source not found:', sourceDir);
    process.exit(1);
}

if (!fs.existsSync(markerPath)) {
    console.error('[vendorOhosTypescript] marker missing in source:', markerPath);
    process.exit(1);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log('[vendorOhosTypescript] vendored to', targetDir);
