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

import { NullType, NumberType, StringType, UndefinedType } from '../../src/core/base/Type';
import { ValueUtil } from '../../src/core/common/ValueUtil';
import { assert, describe, expect, it } from 'vitest';
import { FileSignature, ModelUtils, Scene, SceneConfig } from "../../src";
import path from "path";

describe("ValueUtil Test", () => {
    it('string case', () => {
        let type = StringType.getInstance();
        let value = ValueUtil.createStringConst('');
        expect(value.getType())
            .toEqual(type);
    })
    it('normal case 2', () => {
        let type = NumberType.getInstance();
        let value = ValueUtil.getOrCreateNumberConst(0);
        expect(value.getType())
            .toEqual(type);
    })
    it('normal case 3', () => {
        let type = UndefinedType.getInstance();
        let value = ValueUtil.getUndefinedConst();
        expect(value.getType())
            .toEqual(type);
    })
    it('normal case 4', () => {
        let type = NullType.getInstance();
        let value = ValueUtil.getNullConstant();
        expect(value.getType())
            .toEqual(type);
    })
})

describe("ModelUtils Test", () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({moduleName: "", name: "ohos", path: path.join(__dirname, "../resources/Sdk")})
    config.buildFromProjectDir(path.join(__dirname, "../resources/inferType"));
    let scene: Scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();
    it('namespace normal case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'demo.ts');
        const outerNameSpace = scene.getFile(fileId)?.getNamespaceWithName('outer');
        const cls = outerNameSpace?.getNamespaceWithName('inner')?.getClassWithName('TestClass');
        assert.isDefined(cls);
        const namespace = ModelUtils.getNamespaceWithName('outer', cls!);
        assert.equal(namespace, outerNameSpace);

    })

    it('AwaitExpr Union Type case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'TestAbility.ets');
        const file = scene.getFile(fileId);
        const stmts = file?.getClassWithName('TestRelease')?.getMethodWithName('onDestroy')?.getCfg()?.getStmts();
        if (stmts) {
            assert.equal(stmts[3].toString(), 'instanceinvoke %1.<@ohos/api/@internal/component/ets/@ohos.multimedia.image.d.ts: image.PixelMap.release()>()');
        }
    })
})