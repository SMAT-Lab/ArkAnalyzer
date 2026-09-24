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

import path from 'path';
import { describe, expect, it } from 'vitest';
import { Local, ModelUtils } from '../../src';
import { buildScene } from './common';

describe('ModelUtils local resolution Test', () => {
    it('findDeclaredLocalType matches findDeclaredLocal(...).getType() across resolution paths', () => {
        const scene = buildScene(path.join(__dirname, '../resources/model/method'));
        const file = scene.getFiles().find(f => f.getName() === 'method.ts');
        expect(file).toBeDefined();
        const method = file!.getDefaultClass().getMethodWithName('testDotDotDotToken');
        expect(method).toBeDefined();
        const paramNames = method!.getParameters().map(p => p.getName());
        expect(paramNames).toEqual(['arr1', 'arr2']);

        const probes = [...paramNames, 'definitelyNotAName', 'this', '%temp0'];
        for (const name of probes) {
            for (const times of [0, 1]) {
                const viaLocal = ModelUtils.findDeclaredLocal(new Local(name), method!, times)?.getType();
                const viaType = ModelUtils.findDeclaredLocalType(name, method!, times);
                expect(viaType).toEqual(viaLocal);
            }
        }
    });
});
