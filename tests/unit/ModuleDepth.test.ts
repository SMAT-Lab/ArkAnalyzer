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
        it('INDEX equals 0', () => {
            expect(ModuleDepthLevel.INDEX).toBe(0);
        });

        it('SIGNATURES equals 1', () => {
            expect(ModuleDepthLevel.SIGNATURES).toBe(1);
        });

        it('BODIES equals 2', () => {
            expect(ModuleDepthLevel.BODIES).toBe(2);
        });
    });

    describe('enum order', () => {
        it('INDEX < SIGNATURES < BODIES', () => {
            expect(ModuleDepthLevel.INDEX).toBeLessThan(ModuleDepthLevel.SIGNATURES);
            expect(ModuleDepthLevel.SIGNATURES).toBeLessThan(ModuleDepthLevel.BODIES);
        });
    });
});
