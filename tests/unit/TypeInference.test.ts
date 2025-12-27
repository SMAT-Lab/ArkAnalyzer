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
import {
    ArkClass,
    ClassType,
    CONSTRUCTOR_NAME,
    MethodSignature,
    Printer,
    Scene,
    SceneConfig,
    TypeInference
} from '../../src';
import { OperandOriginalPositions_Expect_IR } from '../resources/inferType/IRChange/OperandOriginalPositionsExpect';
import { testMethodStmts } from './common';
import { ArkIRFilePrinter } from '../../src/save/arkir/ArkIRFilePrinter';

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

describe('Import Type Inference Test', () => {
    const config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, '../resources/typeInference/importType'));
    const scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    const CASE1_EXPECT = `class %dflt {
  %dflt(): void {
    label0:
      this = this: @importType/MyComponent2.ets: %dflt
      return
  }
}
import * as XX from './MyComponent';
import {f, MyComponent} from './MyComponent';
@Component
struct MyComponent2 {
  %instInit(): void {
    label0:
      this = this: @importType/MyComponent2.ets: MyComponent2
      return
  }

  static %statInit(): void {
    label0:
      this = this: @importType/MyComponent2.ets: MyComponent2
      return
  }

  constructor(##storage?: LocalStorage): @importType/MyComponent2.ets: MyComponent2 {
    label0:
      ##storage = parameter0: LocalStorage
      this = this: @importType/MyComponent2.ets: MyComponent2
      instanceinvoke this.<@importType/MyComponent2.ets: MyComponent2.%instInit()>()
      return this
  }

  build(): void {
    label0:
      this = this: @importType/MyComponent2.ets: MyComponent2
      %0 = staticinvoke <@%unk/%unk: Row.create()>()
      %1 = new @importType/MyComponent2.ets: %AC0$MyComponent2-build
      %1 = instanceinvoke %1.<@importType/MyComponent2.ets: %AC0$MyComponent2-build.constructor()>()
      instanceinvoke XX.<@importType/MyComponent.ets: MyComponent.constructor(string)>(%1)
      %2 = new @importType/MyComponent2.ets: %AC1$MyComponent2-build
      %2 = instanceinvoke %2.<@importType/MyComponent2.ets: %AC1$MyComponent2-build.constructor()>()
      %3 = new @importType/MyComponent.ets: MyComponent
      %3 = instanceinvoke %3.<@importType/MyComponent.ets: MyComponent.constructor(string)>(%2)
      %4 = staticinvoke <@%unk/%unk: View.create()>(%3)
      staticinvoke <@%unk/%unk: View.pop()>()
      staticinvoke <@%unk/%unk: Row.pop()>()
      return
  }
}
object %AC0$MyComponent2-build {
  status1: string
  status2: string
  callback: @importType/MyComponent2.ets: %AC0$MyComponent2-build.%AM0$%instInit()

  constructor(): @importType/MyComponent2.ets: %AC0$MyComponent2-build {
    label0:
      this = this: @importType/MyComponent2.ets: %AC0$MyComponent2-build
      instanceinvoke this.<@importType/MyComponent2.ets: %AC0$MyComponent2-build.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @importType/MyComponent2.ets: %AC0$MyComponent2-build
      this.<@importType/MyComponent2.ets: %AC0$MyComponent2-build.status1> = 'aaa'
      this.<@importType/MyComponent2.ets: %AC0$MyComponent2-build.status2> = 'bbb'
      this.<@importType/MyComponent2.ets: %AC0$MyComponent2-build.callback> = %AM0$%instInit
      return
  }

  %AM0$%instInit(): void {
    label0:
      this = this: @importType/MyComponent2.ets: %AC0$MyComponent2-build
      instanceinvoke console.<@%unk/%unk: .log()>('cccc')
      staticinvoke <@importType/MyComponent.ets: %dflt.f(string)>('hello')
      staticinvoke <@importType/MyComponent.ets: %dflt.f(string)>('hello2')
      return
  }
}
object %AC1$MyComponent2-build {
  status1: string

  constructor(): @importType/MyComponent2.ets: %AC1$MyComponent2-build {
    label0:
      this = this: @importType/MyComponent2.ets: %AC1$MyComponent2-build
      instanceinvoke this.<@importType/MyComponent2.ets: %AC1$MyComponent2-build.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @importType/MyComponent2.ets: %AC1$MyComponent2-build
      this.<@importType/MyComponent2.ets: %AC1$MyComponent2-build.status1> = 'xxxx'
      return
  }
}
`;

    it('case1: ', () => {
        let arkfile = scene.getFiles().find((value) => {
            return value.getName().endsWith('MyComponent2.ets');
        });
        assert.isDefined(arkfile);
        let printer: Printer = new ArkIRFilePrinter(arkfile!);
        let ir = printer.dump();
        expect(ir).eq(CASE1_EXPECT);
    });

});