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

import { SceneConfig } from '../../src/Config';
import { ClassSignature, FileSignature, MethodSignature } from '../../src/core/model/ArkSignature';
import { MethodSignatureManager, printCallGraphDetails, SceneManager } from '../../src/utils/callGraphUtils';
import { assert, describe, expect, it, vi } from 'vitest';
import { Scene } from '../../src/Scene';
import path from 'path';
import { ArkSignatureBuilder } from '../../src/core/model/builder/ArkSignatureBuilder';
import { UNKNOWN_METHOD_NAME } from '../../src/core/common/Const';

describe("MethodSignatureManager Test", () => {

    it('addToWorkList removeFromWorkList case', () => {
        let test = new MethodSignatureManager();
        let ms = ArkSignatureBuilder.buildMethodSignatureFromMethodName(UNKNOWN_METHOD_NAME);
        test.addToWorkList(ms);
        expect(test.workList.length).toBe(1);
        assert.equal(ms, test.findInWorkList(ms));
        test.removeFromWorkList(ms);
        expect(test.workList.length).toBe(0);
    })

    it('addToProcessedList removeFromProcessedList  case', () => {
        let test = new MethodSignatureManager();
        let ms = ArkSignatureBuilder.buildMethodSignatureFromMethodName(UNKNOWN_METHOD_NAME);
        test.addToProcessedList(ms);
        let list = test.processedList;
        expect(list.length).toBe(1);
        assert.equal(ms, list[0]);
        test.removeFromProcessedList(ms);
        expect(test.processedList.length).toBe(0);
    })

})


describe("SceneManager Test", () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, "../../src/core/dataflow"));
    let sceneManager = new SceneManager();
    sceneManager.scene = new Scene();
    sceneManager.scene.buildSceneFromProjectDir(config);
    it('get Method case', () => {
        let ms = ArkSignatureBuilder.buildMethodSignatureFromMethodName(UNKNOWN_METHOD_NAME);
        assert.isNull(sceneManager.getMethod(ms));
    })

    it('get Class case', () => {
        let clazz = ArkSignatureBuilder.buildClassSignatureFromClassName('undefined');
        assert.isNull(sceneManager.getClass(clazz));
        clazz = ArkSignatureBuilder.buildClassSignatureFromClassName('test');
        assert.isNull(sceneManager.getClass(clazz));
    })

    it('get exsit case', () => {
        let file = new FileSignature('dataflow', 'ReachingDef.ts');
        let clazz = new ClassSignature('ReachingDefProblem', file);
        let res = sceneManager.getExtendedClasses(clazz);
        expect(res.length).toBe(1);
        assert.equal(clazz.toString(), res[0].getSignature().toString());
    })

})

describe("MethodSignatureManager Test", () => {

    it('normal case', () => {
        let set = new Set<MethodSignature>();
        let ms = ArkSignatureBuilder.buildMethodSignatureFromMethodName(UNKNOWN_METHOD_NAME);
        set.add(ms);
        let map = new Map();
        map.set(ms, [ms]);
        const printSpy = vi.fn(printCallGraphDetails);
        printSpy(set, map, "");
        expect(printSpy).toBeCalled();
    })
})