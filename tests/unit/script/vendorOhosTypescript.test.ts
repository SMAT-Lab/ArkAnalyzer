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

import { existsSync, readFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { describe, expect, it } from 'vitest';

const requireScript = createRequire(__filename);
const { isOhosTypescriptExcludedFile } = requireScript(path.resolve(__dirname, '../../../script/ohosTypescriptVendorFiles.js')) as {
    isOhosTypescriptExcludedFile: (relPath: string) => boolean;
};

describe('ohos-typescript vendor blacklist', () => {
    it('does not exclude the compiler API entry, package metadata, or ES lib declarations', () => {
        expect(isOhosTypescriptExcludedFile('package.json')).toBe(false);
        expect(isOhosTypescriptExcludedFile('LICENSE')).toBe(false);
        expect(isOhosTypescriptExcludedFile('LICENSE.txt')).toBe(false);
        expect(isOhosTypescriptExcludedFile('.ohos-typescript-version')).toBe(false);
        expect(isOhosTypescriptExcludedFile('lib/typescript.js')).toBe(false);
        expect(isOhosTypescriptExcludedFile('lib/typescript.d.ts')).toBe(false);
        expect(isOhosTypescriptExcludedFile('lib/lib.d.ts')).toBe(false);
        expect(isOhosTypescriptExcludedFile('lib/lib.es6.d.ts')).toBe(false);
        expect(isOhosTypescriptExcludedFile('lib/lib.es2020.d.ts')).toBe(false);
        expect(isOhosTypescriptExcludedFile('lib/lib.es2021.d.ts')).toBe(false);
        expect(isOhosTypescriptExcludedFile('lib\\lib.es2020.bigint.d.ts')).toBe(false);
    });

    it('excludes tsserver, tsc, locale diagnostics, and other unused toolchain files', () => {
        expect(isOhosTypescriptExcludedFile('lib/tsserver.js')).toBe(true);
        expect(isOhosTypescriptExcludedFile('lib/tsserverlibrary.js')).toBe(true);
        expect(isOhosTypescriptExcludedFile('lib/tsserverlibrary.d.ts')).toBe(true);
        expect(isOhosTypescriptExcludedFile('lib/tsc.js')).toBe(true);
        expect(isOhosTypescriptExcludedFile('lib/typingsInstaller.js')).toBe(true);
        expect(isOhosTypescriptExcludedFile('lib/cancellationToken.js')).toBe(true);
        expect(isOhosTypescriptExcludedFile('lib/watchGuard.js')).toBe(true);
        expect(isOhosTypescriptExcludedFile('lib/lib.dom.d.ts')).toBe(true);
        expect(isOhosTypescriptExcludedFile('lib/lib.webworker.d.ts')).toBe(true);
        expect(isOhosTypescriptExcludedFile('lib/typesMap.json')).toBe(true);
        expect(isOhosTypescriptExcludedFile('lib/zh-cn/diagnosticMessages.generated.json')).toBe(true);
        expect(isOhosTypescriptExcludedFile('README.md')).toBe(true);
        expect(isOhosTypescriptExcludedFile('bin/tsc')).toBe(true);
        expect(isOhosTypescriptExcludedFile('bin/tsserver')).toBe(true);
    });

    it('does not exclude any lib.es*.d.ts referenced from the default ES2021 built-in chain', () => {
        const libDir = path.resolve(__dirname, '../../../node_modules/ohos-typescript/lib');
        const entry = path.join(libDir, 'lib.es2021.d.ts');
        expect(existsSync(entry)).toBe(true);
        const needed = new Set<string>();
        const visit = (filePath: string): void => {
            if (needed.has(filePath) || !existsSync(filePath)) {
                return;
            }
            needed.add(filePath);
            const text = readFileSync(filePath, 'utf8');
            const refs = [...text.matchAll(/\/\/\/\s*<reference\s+lib="([^"]+)"\s*\/>/g)];
            for (const ref of refs) {
                visit(path.join(libDir, `lib.${ref[1]}.d.ts`));
            }
        };
        visit(entry);
        expect(needed.size).toBeGreaterThan(1);
        for (const filePath of needed) {
            const rel = path.relative(path.join(libDir, '..'), filePath).replace(/\\/g, '/');
            expect(isOhosTypescriptExcludedFile(rel), rel).toBe(false);
        }
    });
});
