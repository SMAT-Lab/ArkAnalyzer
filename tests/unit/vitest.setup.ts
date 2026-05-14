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

import path from 'path';
import { beforeEach } from 'vitest';
import ConsoleLogger, { LOG_LEVEL } from '../../src/utils/logger';

// Keep cwd at repo root so `./tests/...` resolves correctly if anything leaves it elsewhere.
const REPO_ROOT = path.resolve(__dirname, '../..');
beforeEach(() => {
    try {
        process.chdir(REPO_ROOT);
    } catch {
        /* ignore */
    }
});

const utLogEnabled = ['1', 'true', 'yes', 'on'].includes(
    process.env.V?.trim().toLowerCase() ?? '',
);

if (utLogEnabled) {
    // Enable detailed file log only when explicitly requested.
    ConsoleLogger.configure('output/ArkAnalyzerUT.log', LOG_LEVEL.DEBUG, LOG_LEVEL.DEBUG, true);
}
