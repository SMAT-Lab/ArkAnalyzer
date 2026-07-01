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

import { describe, expect, it } from 'vitest';
import { ModuleDepthLevel } from '../../src/frontend/common/ModuleDepth';

describe('ModuleDepthLevel enum tests', () => {
    describe('numeric values', () => {
        it('META equals 0', () => {
            expect(ModuleDepthLevel.META).toBe(0);
        });

        it('IMPORTS equals 1', () => {
            expect(ModuleDepthLevel.IMPORTS).toBe(1);
        });

        it('SIGNATURES equals 2', () => {
            expect(ModuleDepthLevel.SIGNATURES).toBe(2);
        });

        it('BODIES equals 3', () => {
            expect(ModuleDepthLevel.BODIES).toBe(3);
        });
    });

    describe('enum order', () => {
        it('META < IMPORTS < SIGNATURES < BODIES', () => {
            expect(ModuleDepthLevel.META).toBeLessThan(ModuleDepthLevel.IMPORTS);
            expect(ModuleDepthLevel.IMPORTS).toBeLessThan(ModuleDepthLevel.SIGNATURES);
            expect(ModuleDepthLevel.SIGNATURES).toBeLessThan(ModuleDepthLevel.BODIES);
        });

        it('each higher level is strictly greater than the previous one', () => {
            const levels = [ModuleDepthLevel.META, ModuleDepthLevel.IMPORTS, ModuleDepthLevel.SIGNATURES, ModuleDepthLevel.BODIES];
            for (let i = 0; i < levels.length - 1; i++) {
                expect(levels[i]).toBeLessThan(levels[i + 1]);
            }
        });
    });
});
