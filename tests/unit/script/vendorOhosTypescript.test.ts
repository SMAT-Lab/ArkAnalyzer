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
const { isOhosTypescriptRuntimeFile } = requireScript(path.resolve(__dirname, '../../../script/ohosTypescriptVendorFiles.js')) as {
    isOhosTypescriptRuntimeFile: (relPath: string) => boolean;
};

describe('ohos-typescript vendor whitelist', () => {
    it('keeps the compiler API entry and ES lib declarations used at runtime', () => {
        expect(isOhosTypescriptRuntimeFile('package.json')).toBe(true);
        expect(isOhosTypescriptRuntimeFile('LICENSE.txt')).toBe(true);
        expect(isOhosTypescriptRuntimeFile('.ohos-typescript-version')).toBe(true);
        expect(isOhosTypescriptRuntimeFile('lib/typescript.js')).toBe(true);
        expect(isOhosTypescriptRuntimeFile('lib/typescript.d.ts')).toBe(true);
        expect(isOhosTypescriptRuntimeFile('lib/lib.d.ts')).toBe(true);
        expect(isOhosTypescriptRuntimeFile('lib/lib.es6.d.ts')).toBe(true);
        expect(isOhosTypescriptRuntimeFile('lib/lib.es2020.d.ts')).toBe(true);
        expect(isOhosTypescriptRuntimeFile('lib/lib.es2021.d.ts')).toBe(true);
        expect(isOhosTypescriptRuntimeFile('lib\\lib.es2020.bigint.d.ts')).toBe(true);
    });

    it('drops tsserver, tsc, and other unused toolchain files', () => {
        expect(isOhosTypescriptRuntimeFile('lib/tsserver.js')).toBe(false);
        expect(isOhosTypescriptRuntimeFile('lib/tsserverlibrary.js')).toBe(false);
        expect(isOhosTypescriptRuntimeFile('lib/tsserverlibrary.d.ts')).toBe(false);
        expect(isOhosTypescriptRuntimeFile('lib/tsc.js')).toBe(false);
        expect(isOhosTypescriptRuntimeFile('lib/typingsInstaller.js')).toBe(false);
        expect(isOhosTypescriptRuntimeFile('lib/cancellationToken.js')).toBe(false);
        expect(isOhosTypescriptRuntimeFile('lib/watchGuard.js')).toBe(false);
        expect(isOhosTypescriptRuntimeFile('lib/lib.dom.d.ts')).toBe(false);
        expect(isOhosTypescriptRuntimeFile('lib/lib.webworker.d.ts')).toBe(false);
        expect(isOhosTypescriptRuntimeFile('lib/typesMap.json')).toBe(false);
        expect(isOhosTypescriptRuntimeFile('README.md')).toBe(false);
        expect(isOhosTypescriptRuntimeFile('bin/tsc')).toBe(false);
    });

    it('keeps every lib.es*.d.ts referenced from the default ES2021 built-in chain', () => {
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
            expect(isOhosTypescriptRuntimeFile(rel), rel).toBe(true);
        }
    });
});
