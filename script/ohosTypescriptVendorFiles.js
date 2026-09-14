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

const EXCLUDED_ROOT_FILES = new Set(['README.md', 'README.OpenSource', 'SECURITY.md', 'ThirdPartyNoticeText.txt']);

const EXCLUDED_LIB_FILES = new Set([
    'tsserver.js',
    'tsserverlibrary.js',
    'tsserverlibrary.d.ts',
    'tsc.js',
    'typingsInstaller.js',
    'cancellationToken.js',
    'watchGuard.js',
    'typesMap.json',
    'README.md',
    'lib.dom.d.ts',
    'lib.dom.iterable.d.ts',
    'lib.webworker.d.ts',
    'lib.webworker.iterable.d.ts',
    'lib.webworker.importscripts.d.ts',
    'lib.scripthost.d.ts',
]);

/**
 * Files skipped when copying ohos-typescript into lib/node_modules at pack time.
 * Default is to copy; only language-service / tsc / DOM libs / locale diagnostics are excluded.
 * @param {string} relPath path relative to the ohos-typescript package root
 * @returns {boolean}
 */
function isOhosTypescriptExcludedFile(relPath) {
    const normalized = relPath.replace(/\\/g, '/');
    if (normalized.startsWith('bin/')) {
        return true;
    }
    if (EXCLUDED_ROOT_FILES.has(normalized)) {
        return true;
    }
    if (!normalized.startsWith('lib/')) {
        return false;
    }
    const base = normalized.slice('lib/'.length);
    if (base.includes('/')) {
        return true;
    }
    return EXCLUDED_LIB_FILES.has(base);
}

module.exports = { isOhosTypescriptExcludedFile };
