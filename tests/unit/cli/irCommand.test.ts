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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, assert, describe, it } from 'vitest';
import { dumpProjectToReadableIR } from '../../../src/cli/commands/ir';

describe('ir command', () => {
    const tempDirs: string[] = [];

    afterEach(() => {
        for (const d of tempDirs) {
            fs.rmSync(d, { recursive: true, force: true });
        }
        tempDirs.length = 0;
    });

    it('generates readable .ir files for project sources', () => {
        const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arkanalyzer-ir-'));
        tempDirs.push(outDir);

        const result = dumpProjectToReadableIR({
            project: './tests/resources/callgraph/cha_rta_test',
            output: outDir,
            inferTypes: false,
        });
        assert.isTrue(result.fileCount > 0);

        const irPath = path.join(outDir, 'main.ts.ir');
        assert.isTrue(fs.existsSync(irPath), `Expected IR file not found: ${irPath}`);
        const content = fs.readFileSync(irPath, 'utf8');
        assert.isTrue(content.length > 0, 'IR output should not be empty');
    });
});
