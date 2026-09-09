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

const ROOT_FILES = new Set(['package.json', 'LICENSE.txt', '.ohos-typescript-version']);
const LIB_FILES = new Set(['typescript.js', 'typescript.d.ts', 'lib.d.ts', 'lib.es6.d.ts']);

/**
 * Runtime files copied into lib/node_modules/ohos-typescript at pack time.
 * Keeps the compiler API (typescript.js) and ES lib .d.ts used by SdkUtils;
 * drops tsserver/tsc and DOM/webworker libs.
 * @param {string} relPath path relative to the ohos-typescript package root
 * @returns {boolean}
 */
function isOhosTypescriptRuntimeFile(relPath) {
    const normalized = relPath.replace(/\\/g, '/');
    if (ROOT_FILES.has(normalized)) {
        return true;
    }
    if (!normalized.startsWith('lib/')) {
        return false;
    }
    const base = normalized.slice('lib/'.length);
    if (base.includes('/')) {
        return false;
    }
    if (LIB_FILES.has(base)) {
        return true;
    }
    return /^lib\.es.+\.d\.ts$/.test(base);
}

module.exports = { isOhosTypescriptRuntimeFile };
