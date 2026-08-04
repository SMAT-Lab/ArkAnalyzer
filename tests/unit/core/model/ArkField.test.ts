/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

import { assert, describe, expect, it } from 'vitest';
import { ArkField } from '../../../../src/core/model/ArkField';
import { Decorator } from '../../../../src/core/base/Decorator';
import { ModifierType } from '../../../../src/core/model/ArkBaseModel';
import { buildScene } from '../../common';
import path from 'path';

describe("ArkField Test", () => {
    it('test getDecorators', async () => {
        let field = new ArkField();
        field.addDecorator(new Decorator('State'));
        field.addDecorator(new Decorator('Link'));
        field.addModifier(ModifierType.STATIC);
        field.addModifier(ModifierType.PUBLIC);
        field.removeModifier(ModifierType.PUBLIC);
        field.removeDecorator('Link');
        expect(field.getModifiers()).eq(ModifierType.STATIC);
        expect(field.getDecorators().length).eq(1);
    })
})

describe('ArkField Source Code and Position Test', () => {
    const scene = buildScene(path.join(__dirname, '../../../resources/model/method'));
    const arkFile = scene.getFiles().find((file) => file.getName() === 'method.ts');
    const globalTestClass = arkFile?.getClassWithName('GlobalTest');

    it('test getOriginFullPosition for f field', async () => {
        const field = globalTestClass?.getFieldWithName('f');
        assert.isDefined(field);
        
        const position = field!.getOriginFullPosition();
        assert.isDefined(position);
        expect(position!.getFirstLine()).eq(210);
        expect(position!.getFirstCol()).eq(5);
        expect(position!.getLastLine()).eq(212);
        expect(position!.getLastCol()).eq(7);
    });

    it('test getCode for f field', async () => {
        const field = globalTestClass?.getFieldWithName('f');
        assert.isDefined(field);
        
        const expectedCode = `f = (): void => {
        console.log(GLOBAL_NUM);
    };`;
        expect(field!.getCode().replace(/\r\n/g, '\n')).eq(expectedCode);
    });

    it('test getOriginFullPosition for goo field', async () => {
        const field = globalTestClass?.getStaticFieldWithName('a');
        assert.isNull(field);
    });
});