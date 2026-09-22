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

import { SceneConfig } from '../../../src/Config';
import * as ty from '../../../src/core/base/Type';
import { assert, beforeAll, describe, expect, it } from 'vitest';
import { Scene } from '../../../src/Scene';
import path from 'path';
import { ArkClass, SourceClassPrinter } from '../../../src';
import { SourceTransformer } from '../../../src/save/source/SourceTransformer';
import { PrinterUtils } from '../../../src/save/base/PrinterUtils';


describe('PrinterUtilsTest', () => {
    let transformer: SourceTransformer;
    let arkClass: ArkClass | undefined;

    beforeAll(() => {
        let config: SceneConfig = new SceneConfig();
        config.buildFromProjectDir(path.join(__dirname, '../../resources/save'));
        let scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        arkClass = scene.getClasses().find((cls) => cls.getName() == 'Animal');
        let clsPrinter = new SourceClassPrinter(arkClass!);
        transformer = new SourceTransformer(clsPrinter);
    });

    it('LiteralType case', () => {
        let type = new ty.LiteralType('BooleanKeyword');
        assert.equal(transformer.typeToString(type), 'boolean');
    });

    it('UnknownType case', () => {
        let type = ty.UnknownType.getInstance();
        assert.equal(transformer.typeToString(type), 'any');
    });

    it('ClassType case', () => {
        if (arkClass == null) {
            assert.isNotNull(arkClass);
            return;
        }
        let type = new ty.ClassType(arkClass.getSignature());
        assert.equal(transformer.typeToString(type), 'Animal');
    });

    it('ArrayType case 1', () => {
        let type = new ty.ArrayType(ty.UnknownType.getInstance(), 2);
        assert.equal(transformer.typeToString(type), 'any[][]');
    });
    it('ArrayType case 2', () => {
        let type = new ty.ArrayType(ty.StringType.getInstance(), 1);
        assert.equal(transformer.typeToString(type), 'string[]');
    });

    it('VoidType case', () => {
        let type = ty.VoidType.getInstance();
        assert.equal(transformer.typeToString(type), 'void');
    });

    it('typeArrayToString Test1', () => {
        let types = [ty.VoidType.getInstance(), ty.StringType.getInstance()];
        assert.equal(transformer.typeArrayToString(types), 'void, string');
    });

    it('typeArrayToString Test2', () => {
        let types = [ty.UnknownType.getInstance(), ty.StringType.getInstance()];
        assert.equal(transformer.typeArrayToString(types, '@'), 'any@string');
    });

    it('isIdentifierText', () => {
        expect(PrinterUtils.isIdentifierText('ab\'')).eq(false);
        expect(PrinterUtils.isIdentifierText('123')).eq(false);
        expect(PrinterUtils.isIdentifierText('abc')).eq(true);
        expect(PrinterUtils.isIdentifierText('+')).eq(false);
    })

    it('escape', () => {
        expect(PrinterUtils.escape('ab\'')).eq('ab\\\'');
    })

});
