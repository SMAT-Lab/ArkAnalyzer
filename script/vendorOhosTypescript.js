/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

const { rmDirSafe } = require('./shared/fileUtils');
const { isOhosTypescriptRuntimeFile } = require('./ohosTypescriptVendorFiles');

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'node_modules', 'ohos-typescript');
const targetDir = path.join(projectRoot, 'lib', 'node_modules', 'ohos-typescript');
const markerPath = path.join(sourceDir, '.ohos-typescript-version');

function collectRuntimeRelPaths(rootDir) {
    const result = [];
    function walk(absDir, relBase) {
        for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
            const rel = relBase ? `${relBase}/${ent.name}` : ent.name;
            const abs = path.join(absDir, ent.name);
            if (ent.isDirectory()) {
                walk(abs, rel);
                continue;
            }
            if (isOhosTypescriptRuntimeFile(rel)) {
                result.push(rel);
            }
        }
    }
    walk(rootDir, '');
    return result;
}

if (!fs.existsSync(sourceDir)) {
    console.error('[vendorOhosTypescript] source not found:', sourceDir);
    process.exit(1);
}

if (!process.env.CLOUD_BUILD_ENV && !fs.existsSync(markerPath)) {
    console.error('[vendorOhosTypescript] marker missing in source:', markerPath);
    process.exit(1);
}

const runtimeFiles = collectRuntimeRelPaths(sourceDir);
if (!runtimeFiles.includes('lib/typescript.js')) {
    console.error('[vendorOhosTypescript] missing lib/typescript.js in source');
    process.exit(1);
}

rmDirSafe(targetDir);
for (const rel of runtimeFiles) {
    const from = path.join(sourceDir, rel);
    const to = path.join(targetDir, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
}

console.log(`[vendorOhosTypescript] vendored ${runtimeFiles.length} runtime files to ${targetDir}`);
