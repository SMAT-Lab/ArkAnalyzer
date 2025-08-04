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

import { assert, describe, expect, it, vi } from 'vitest';
import path from 'path';
import { ArkClass, ClassType, CONSTRUCTOR_NAME, MethodSignature, Scene, SceneConfig, TypeInference } from '../../src';
import { OperandOriginalPositions_Expect_IR } from '../resources/inferType/IRChange/OperandOriginalPositionsExpect';
import { testMethodStmts } from './common';

describe('StaticSingleAssignmentFormer Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, '../resources/save'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    let methods = scene.getMethods();

    it('inferTypeInMethod case', () => {
        let method = methods[0];
        if (method == null) {
            assert.isNotNull(methods);
            return;
        }

        const spy = vi.spyOn(method, 'getBody');
        TypeInference.inferTypeInMethod(method);
        expect(spy).toHaveBeenCalledTimes(10);
    });

    it('inferSimpleTypeInMethod case', () => {
        if (methods == null) {
            assert.isNotNull(methods);
            return;
        }

        for (const method of methods) {
            const spy = vi.spyOn(method, 'getBody');
            TypeInference.inferSimpleTypeInMethod(method);
            expect(spy).toHaveBeenCalledTimes(1);
        }
    });
});

describe('Infer Method Return Type', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, '../resources/inferType'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    let sampleClass = scene.getFiles().find(file => file.getName() === 'inferSample.ts')?.getClassWithName('Sample');

    it('constructor method return type infer case', () => {
        assert.isDefined(sampleClass);
        assert.isNotNull(sampleClass);

        let method = (sampleClass as ArkClass).getMethodWithName(CONSTRUCTOR_NAME);
        assert.isNotNull(method);
        let signature = method?.getImplementationSignature();
        assert.isDefined(signature);
        assert.isNotNull(signature);
        TypeInference.inferSignatureReturnType(signature!, method!);
        expect(signature?.toString()).toEqual('@inferType/inferSample.ts: Sample.constructor()');
        assert.isTrue(signature?.getType() instanceof ClassType);
        expect(signature?.getType().toString()).toEqual('@inferType/inferSample.ts: Sample');
    });

    it('declare method return type infer case', () => {
        assert.isDefined(sampleClass);
        assert.isNotNull(sampleClass);

        let method = (sampleClass as ArkClass).getMethodWithName('sampleMethod');
        assert.isNotNull(method);
        TypeInference.inferTypeInMethod(method!);
        let signatures = method?.getDeclareSignatures();
        assert.isDefined(signatures);
        assert.isNotNull(signatures);
        expect((signatures as MethodSignature[])[0].toString()).toEqual('@inferType/inferSample.ts: Sample.sampleMethod()');
        assert.isTrue((signatures as MethodSignature[])[0].getType() instanceof ClassType);
        expect((signatures as MethodSignature[])[0].getType().toString()).toEqual('@inferType/inferSample.ts: Sample');
        expect((signatures as MethodSignature[])[1].toString()).toEqual('@inferType/inferSample.ts: Sample.sampleMethod(number)');
        assert.isTrue((signatures as MethodSignature[])[1].getType() instanceof ClassType);
        expect((signatures as MethodSignature[])[1].getType().toString()).toEqual('@inferType/inferSample.ts: Sample');

        let signature = method?.getImplementationSignature();
        assert.isDefined(signature);
        assert.isNotNull(signature);
        expect(signature?.toString()).toEqual('@inferType/inferSample.ts: Sample.sampleMethod(number)');
        assert.isTrue(signature?.getType() instanceof ClassType);
        expect(signature?.getType().toString()).toEqual('@inferType/inferSample.ts: Sample');
    });

    it('method return with any type infer case', () => {
        const method = scene.getFiles().find(file => file.getName() === 'inferSample.ts')?.getDefaultClass().getMethodWithName('returnWithAny');
        assert.isDefined(method);
        assert.isNotNull(method);

        TypeInference.inferTypeInMethod(method!);
        const returnType = method?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), 'any[]');
    });
});

describe('IR Changes with Type Inference Test', () => {
    const config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, '../resources/inferType/IRChange'));
    const scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('operand original positions case', () => {
        testMethodStmts(scene, 'OperandOriginalPositionsTest.ts', OperandOriginalPositions_Expect_IR.stmts, 'Sample',
            'testOperandOriginalPositions');
    });

});