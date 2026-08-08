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

import { assert, beforeAll, describe, expect, it } from 'vitest';
import { Scene } from '../../../../src/Scene';
import { SceneConfig } from '../../../../src/Config';
import path from 'path';
import { ArkAssignStmt, ArkInvokeStmt, ArkMethod, ArkReturnStmt, FunctionType, GlobalRef, Local, Stmt, Value } from '../../../../src';
import { getLineNo, getColNo } from '../../../../src/core/base/Position';
import { ArkIRMethodPrinter } from '../../../../src/save/arkir/ArkIRMethodPrinter';
import { buildScene } from '../../common';

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir(path.join(__dirname, '../../../resources/model/method'));
let projectScene: Scene = new Scene();
projectScene.buildSceneFromProjectDir(config);
projectScene.inferTypes();

let arkFile = projectScene.getFiles().find(file => file.getName() == 'method.ts');
let arkDefaultClass = arkFile?.getDefaultClass();
let nestedTestClass = arkFile?.getClassWithName('NestedTestClass');
let testNamespace = arkFile?.getNamespaceWithName('ConstructorTest');

const MethodParamWithDefaultValue = `paramWithInitializer(a: string, x?: number, y?: unknown, z?: number): number {
  label0:
    a = parameter0: string
    x = parameter1: number
    y = parameter2: unknown
    z = parameter3: number
    this = this: @method/method.ts: %dflt
    if x == undefined goto label1 label2

  label1:
    x = 5
    goto label2

  label2:
    if y == undefined goto label3 label4

  label3:
    y = 'abc'
    goto label4

  label4:
    if z == undefined goto label5 label6

  label5:
    z = x + 1
    goto label6

  label6:
    %0 = a + y
    instanceinvoke console.<@%unk/%unk: .log()>(%0)
    %1 = x + z
    return %1
}
`;

const paramWithComplicatedInitializer = `paramWithComplicatedInitializer(a?: unknown, b?: unknown, c: string): void {
  label0:
    a = parameter0: unknown
    b = parameter1: unknown
    c = parameter2: string
    this = this: @method/method.ts: %dflt
    if a == undefined goto label1 label2

  label1:
    a = staticinvoke <@method/method.ts: %dflt.getA()>()
    goto label2

  label2:
    if b == undefined goto label3 label7

  label3:
    if condition != false goto label4 label5

  label4:
    %0 = 'true'
    goto label6

  label6:
    b = %0
    goto label7

  label7:
    %1 = a + b
    instanceinvoke console.<@%unk/%unk: .log()>(%1)
    return

  label5:
    %0 = 'false'
    goto label6
}
`;

const methodWithIfBranch = `paramInitializerWithIfBranch(a?: unknown): number {
  label2:
    a = parameter0: unknown
    this = this: @method/method.ts: %dflt
    if a == undefined goto label3 label4

  label3:
    a = 3
    goto label4

  label4:
    if a > 0 goto label0 label1

  label0:
    return a

  label1:
    %0 = -a
    return %0
}
`;

const methodWithTernary = `paramInitializerWithTernary(a?: unknown): number {
  label0:
    a = parameter0: unknown
    this = this: @method/method.ts: %dflt
    if a == undefined goto label1 label2

  label1:
    a = 3
    goto label2

  label2:
    b = undefined
    if a > 0 goto label3 label4

  label3:
    b = a
    %1 = b
    goto label5

  label5:
    return b

  label4:
    b = -a
    %1 = b
    goto label5
}
`;

const methodWithTryCatch = `paramInitializerWithTryCatch(a?: unknown): void {
  label3:
    a = parameter0: unknown
    this = this: @method/method.ts: %dflt
    if a == undefined goto label4 label0

  label4:
    a = 3
    goto label0

  label0:
    instanceinvoke console.<@%unk/%unk: .log()>(a)
    goto label2

  label2:
    return

  label1:
    e = caughtexception: unknown
    instanceinvoke console.<@%unk/%unk: .log()>(e)
    goto label2
}
`;

const methodWithForLoop = `paramInitializerWithForLoop(a?: unknown): void {
  label4:
    a = parameter0: unknown
    this = this: @method/method.ts: %dflt
    if a == undefined goto label5 label3

  label5:
    a = 3
    goto label3

  label3:
    i = 0
    goto label0

  label0:
    if i < a goto label1 label2

  label1:
    instanceinvoke console.<@%unk/%unk: .log()>(i)
    i = i + 1
    goto label0

  label2:
    return
}
`;

const methodWithSwitch = `paramInitializerWithSwitch(a?: unknown): void {
  label3:
    a = parameter0: unknown
    this = this: @method/method.ts: %dflt
    if a == undefined goto label4 label5

  label4:
    a = 3
    goto label5

  label5:
    if a == 1 goto label0 label1

  label0:
    %0 = a + 1
    instanceinvoke console.<@%unk/%unk: .log()>(%0)
    goto label2

  label2:
    return

  label1:
    instanceinvoke console.<@%unk/%unk: .log()>(a)
    goto label2
}
`;

const methodWithTernaryDefault = `paramInitializerWithTernaryDefault(a?: unknown, b: string): number {
  label0:
    a = parameter0: unknown
    b = parameter1: string
    this = this: @method/method.ts: %dflt
    if a == undefined goto label1 label5

  label1:
    if ternaryDefaultCondition != false goto label2 label3

  label2:
    %0 = staticinvoke <@method/method.ts: %dflt.incrementCounter()>()
    goto label4

  label4:
    a = %0
    goto label5

  label5:
    return a

  label3:
    %0 = 0
    goto label4
}
`;

const methodWithNestedTernaryDefault = `paramInitializerWithNestedTernaryDefault(a?: unknown): number {
  label0:
    a = parameter0: unknown
    this = this: @method/method.ts: %dflt
    if a == undefined goto label1 label8

  label1:
    if nestedTernaryCond != false goto label2 label6

  label2:
    if nestedTernaryCond != false goto label3 label4

  label3:
    %0 = 1
    goto label5

  label5:
    %1 = %0
    goto label7

  label7:
    a = %1
    goto label8

  label8:
    return a

  label4:
    %0 = 2
    goto label5

  label6:
    %1 = 3
    goto label7
}
`;

describe('ArkMethod Test', () => {
    it('test dotDotDot parameter', async () => {
        let method = arkDefaultClass?.getMethodWithName('testDotDotDotToken');
        let parameter = method?.getParameters().find(param => param.getName() == 'arr2');
        if (parameter) {
            const hasDotDotDotToken = parameter.isRest();
            expect(hasDotDotDotToken).eq(true);
        }
    });

    it('test object parameter', async () => {
        let method = arkDefaultClass?.getMethodWithName('testObjectTypeParam');
        let parameter = method?.getParameters().find(param => param.getName() == 'obj');
        if (parameter) {
            const paramTypeName = parameter.getType().toString();
            expect(paramTypeName).eq('object');
        }
    });
});

describe('Nested Method with Function Declaration Statement', () => {
    it('test nested method', async () => {
        const method = arkDefaultClass?.getMethodWithName('%innerFunction1$outerFunction1');
        assert.isDefined(method);
        assert.isNotNull(method);

        const stmts = method?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts);
        expect((stmts as Stmt[])[1].toString()).toEqual("instanceinvoke console.<@%unk/%unk: .log()>('This is nested function with function declaration.')");
        expect((stmts as Stmt[])[2].toString()).toEqual('staticinvoke <@method/method.ts: %dflt.%innerInnerFunction1$%innerFunction1$outerFunction1()>()');

        const global = method!.getBody()?.getUsedGlobals()?.get('innerInnerFunction1');
        assert.isDefined(global);

        expect(global!.getType().toString()).toEqual('@method/method.ts: %dflt.%innerInnerFunction1$%innerFunction1$outerFunction1()');
    });

    it('test nested method in nested method', async () => {
        const method = arkDefaultClass?.getMethodWithName('%innerInnerFunction1$%innerFunction1$outerFunction1');
        assert.isDefined(method);
        assert.isNotNull(method);
        const stmts = method?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts);
        expect((stmts as Stmt[])[1].toString()).toEqual(
            "instanceinvoke console.<@%unk/%unk: .log()>('This is nested function in nested function with function declaration.')"
        );
        const locals = method?.getBody()?.getLocals();
        assert.isDefined(locals);
        expect((locals as Map<string, Local>).size).toEqual(1);
        const globals = method?.getBody()?.getUsedGlobals();
        assert.isDefined(globals);
        expect(globals!.size).toEqual(1);
    });

    it('test outer method', async () => {
        const method = arkDefaultClass?.getMethodWithName('outerFunction1');
        assert.isDefined(method);
        assert.isNotNull(method);

        const stmts = method?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts);
        expect((stmts as Stmt[])[1].toString()).toEqual('staticinvoke <@method/method.ts: %dflt.%innerFunction1$outerFunction1()>()');

        const global = method!.getBody()?.getUsedGlobals()?.get('innerFunction1');
        assert.isDefined(global);

        expect(global!.getType().toString()).toEqual('@method/method.ts: %dflt.%innerFunction1$outerFunction1()');
    });

    it('test local function type', async () => {
        const method = arkDefaultClass?.getMethodWithName('func');
        const stmts = method?.getBody()?.getCfg().getStmts();
        const stmt = stmts?.[stmts?.length - 1];
        assert.isTrue(stmt instanceof ArkReturnStmt);

        assert.equal((stmt as ArkReturnStmt).getOp().getType().toString(), '@method/method.ts: %dflt.returnFunc()');
    });
});

describe('Nested Method with Return Statement', () => {
    it('test nested method', async () => {
        const method = arkDefaultClass?.getMethodWithName('%innerFunction2$outerFunction2');
        assert.isDefined(method);
        assert.isNotNull(method);
        const stmts = method?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts);
        expect((stmts as Stmt[])[2].toString()).toEqual('%0 = instanceinvoke param.<@built-in/lib.es5.d.ts: String.toString()>()');
        const local = method?.getBody()?.getLocals().get('param');
        assert.isDefined(local);
        expect((local as Local).getType().toString()).toEqual('string');
    });

    it('test outer method', async () => {
        const method = arkDefaultClass?.getMethodWithName('outerFunction2');
        assert.isDefined(method);
        assert.isNotNull(method);
        const stmts = method?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts);
        expect((stmts as Stmt[])[2].toString()).toEqual('return %innerFunction2$outerFunction2');
        const functionLocal = method?.getBody()?.getLocals().get('%innerFunction2$outerFunction2');
        assert.isDefined(functionLocal);
        expect((functionLocal as Local).getType().toString()).toEqual('@method/method.ts: %dflt.%innerFunction2$outerFunction2(string)');
        const numberLocal = method?.getBody()?.getLocals().get('innerFunction2');
        assert.isDefined(numberLocal);
        expect((numberLocal as Local).getType().toString()).toEqual('number');
    });
});

describe('Nested Method with Function Expression', () => {
    let outerMethod: ArkMethod;
    let nestedMethod: ArkMethod;

    beforeAll(() => {
        outerMethod = arkDefaultClass?.getMethodWithName('outerFunction3')!;
        const ptrLocalDef = outerMethod?.getBody()?.getLocals().get('innerFunction3')?.getDeclaringStmt();
        assert.isTrue(ptrLocalDef instanceof ArkAssignStmt);

        const methodType = (ptrLocalDef as ArkAssignStmt).getRightOp().getType();
        assert.isTrue(methodType instanceof FunctionType);
        const method = arkDefaultClass?.getMethodWithName((methodType as FunctionType).getMethodSignature().getMethodSubSignature().getMethodName());
        assert.isDefined(method);
        assert.isNotNull(method);
        nestedMethod = method!;
    });

    it('test nested method', async () => {
        const stmts = nestedMethod.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts);
        expect((stmts as Stmt[])[1].toString()).toEqual("instanceinvoke console.<@%unk/%unk: .log()>('This is nested function with function expression.')");
        const locals = nestedMethod.getBody()?.getLocals();
        assert.isDefined(locals);
        expect(locals!.size).toEqual(1);
    });

    it('test outer method', async () => {
        const nestedName = nestedMethod.getName();
        const stmts = outerMethod.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts);
        expect((stmts as Stmt[])[1].toString()).toEqual(`innerFunction3 = ${nestedName}`);
        const leftOpLocal = outerMethod.getBody()?.getLocals().get('innerFunction3');
        assert.isDefined(leftOpLocal);
        expect((leftOpLocal as Local).getType().toString()).toEqual(`@method/method.ts: %dflt.${nestedName}()`);
        assert.isTrue((leftOpLocal as Local).getConstFlag());
        const rightOpLocal = outerMethod.getBody()?.getLocals().get(nestedName);
        assert.isDefined(rightOpLocal);
        expect((rightOpLocal as Local).getType().toString()).toEqual(`@method/method.ts: %dflt.${nestedName}()`);
        expect((stmts as Stmt[])[2].toString()).toEqual('ptrinvoke innerFunction3<@method/method.ts: %dflt.%AM2$outerFunction3()>()');
    });
});

describe('Nested Method with Arrow Function', () => {
    let outerMethod: ArkMethod;
    let nestedMethod: ArkMethod;

    beforeAll(() => {
        outerMethod = arkDefaultClass?.getMethodWithName('outerFunction4')!;
        const ptrLocalDef = outerMethod?.getBody()?.getLocals().get('innerFunction4')?.getDeclaringStmt();
        assert.isTrue(ptrLocalDef instanceof ArkAssignStmt);

        const methodType = (ptrLocalDef as ArkAssignStmt).getRightOp().getType();
        assert.isTrue(methodType instanceof FunctionType);
        const method = arkDefaultClass?.getMethodWithName((methodType as FunctionType).getMethodSignature().getMethodSubSignature().getMethodName());
        assert.isDefined(method);
        assert.isNotNull(method);
        nestedMethod = method!;
    });

    it('test nested method', async () => {
        const stmts = nestedMethod.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts);
        expect((stmts as Stmt[])[1].toString()).toEqual("instanceinvoke console.<@%unk/%unk: .log()>('This is nested function with arrow function.')");
        const locals = nestedMethod.getBody()?.getLocals();
        assert.isDefined(locals);
        expect(locals!.size).toEqual(1);
    });

    it('test outer method', async () => {
        const nestedName = nestedMethod.getName();
        const stmts = outerMethod.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts);
        expect((stmts as Stmt[])[1].toString()).toEqual(`innerFunction4 = ${nestedName}`);
        const leftOpLocal = outerMethod.getBody()?.getLocals().get('innerFunction4');
        assert.isDefined(leftOpLocal);
        expect((leftOpLocal as Local).getType().toString()).toEqual(`@method/method.ts: %dflt.${nestedName}()`);
        assert.isTrue((leftOpLocal as Local).getConstFlag());
        const rightOpLocal = outerMethod.getBody()?.getLocals().get(nestedName);
        assert.isDefined(rightOpLocal);
        expect((rightOpLocal as Local).getType().toString()).toEqual(`@method/method.ts: %dflt.${nestedName}()`);
        expect((stmts as Stmt[])[2].toString()).toEqual('ptrinvoke innerFunction4<@method/method.ts: %dflt.%AM3$outerFunction4()>()');
    });
});

describe('Recursive Method', () => {
    it('test nested method', async () => {
        const method = arkDefaultClass?.getMethodWithName('%factorial$outerFunction5');
        assert.isDefined(method);
        assert.isNotNull(method);

        const global = method!.getBody()?.getUsedGlobals()?.get('factorial');
        assert.isDefined(global);

        // TODO： the type should be FunctionType after inferType support
        expect(global!.getType().toString()).toEqual('unknown');

        expect(method!.getReturnType().toString()).toEqual('number');
    });

    it('test outer method', async () => {
        const method = arkDefaultClass?.getMethodWithName('outerFunction5');
        assert.isDefined(method);
        assert.isNotNull(method);

        const global = method!.getBody()?.getUsedGlobals()?.get('factorial');
        assert.isDefined(global);

        expect(global!.getType().toString()).toEqual('@method/method.ts: %dflt.%factorial$outerFunction5(number)');

        expect(method!.getReturnType().toString()).toEqual('number');
    });
});

describe('Nested Method in Class', () => {
    it('test nested method', async () => {
        const method1 = nestedTestClass?.getMethodWithName('%innerFunction1$outerMethod');
        assert.isDefined(method1);
        assert.isNotNull(method1);
        const stmts1 = method1?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts1);
        expect((stmts1 as Stmt[])[1].toString()).toEqual("instanceinvoke console.<@%unk/%unk: .log()>('innerFunction1')");

        const method2 = nestedTestClass?.getMethodWithName('%AM1$outerMethod');
        assert.isDefined(method2);
        assert.isNotNull(method2);
        const stmts2 = method2?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts2);
        expect((stmts2 as Stmt[])[1].toString()).toEqual("instanceinvoke console.<@%unk/%unk: .log()>('innerFunction2')");

        const method3 = nestedTestClass?.getMethodWithName('%AM2$outerMethod');
        assert.isDefined(method3);
        assert.isNotNull(method3);
        const stmts3 = method3?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts3);
        expect((stmts3 as Stmt[])[1].toString()).toEqual("instanceinvoke console.<@%unk/%unk: .log()>('innerFunction3')");

        const method4 = nestedTestClass?.getMethodWithName('%AM3$outerMethod');
        assert.isDefined(method4);
        assert.isNotNull(method4);
        const stmts4 = method4?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts4);
        expect((stmts4 as Stmt[])[1].toString()).toEqual("instanceinvoke console.<@%unk/%unk: .log()>('innerFunction4')");
    });

    it('test outer method', async () => {
        const outerMethod = nestedTestClass?.getMethodWithName('outerMethod');
        assert.isDefined(outerMethod);
        assert.isNotNull(outerMethod);

        const stmts = outerMethod?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts);
        expect((stmts as Stmt[])[1].toString()).toEqual('staticinvoke <@method/method.ts: %dflt.%innerFunction1$outerFunction1()>()');
        expect((stmts as Stmt[])[4].toString()).toEqual('ptrinvoke innerFunction2<@method/method.ts: NestedTestClass.%AM1$outerMethod()>()');
        expect((stmts as Stmt[])[5].toString()).toEqual('ptrinvoke innerFunction3<@method/method.ts: NestedTestClass.%AM2$outerMethod()>()');

        const locals = outerMethod?.getBody()?.getLocals();
        assert.isDefined(locals);
        let innerFunction1Value: Value | undefined = locals?.get('innerFunction1');
        assert.isUndefined(innerFunction1Value);

        const globals = outerMethod?.getBody()?.getUsedGlobals();
        assert.isDefined(globals);
        innerFunction1Value = globals!.get('innerFunction1');
        assert.isDefined(innerFunction1Value);

        expect(innerFunction1Value!.getType().toString()).toEqual('@method/method.ts: NestedTestClass.%innerFunction1$outerMethod()');
        const innerFunction2Local = locals?.get('innerFunction2');
        assert.isDefined(innerFunction2Local);
        expect(innerFunction2Local!.getType().toString()).toEqual('@method/method.ts: NestedTestClass.%AM1$outerMethod()');
        const innerFunction3Local = locals?.get('innerFunction3');
        assert.isDefined(innerFunction3Local);
        expect(innerFunction3Local!.getType().toString()).toEqual('@method/method.ts: NestedTestClass.%AM2$outerMethod()');
    });
});

describe('Optional Method', () => {
    it('optional methods', async () => {
        const method1 = arkFile?.getClassWithName('InterfaceA')?.getMethodWithName('optionalMethod');
        assert.isDefined(method1);
        assert.isNotNull(method1);
        assert.isTrue(method1!.getQuestionToken());

        const method2 = arkFile?.getClassWithName('ClassA')?.getMethodWithName('optionalMethod');
        assert.isDefined(method2);
        assert.isNotNull(method2);
        assert.isTrue(method2!.getQuestionToken());

        const method3 = arkFile?.getClassWithName('%AC0')?.getMethodWithName('optionalMethod');
        assert.isDefined(method3);
        assert.isNotNull(method3);
        assert.isTrue(method3!.getQuestionToken());

        const method4 = arkFile?.getClassWithName('%AC1')?.getMethodWithName('optionalMethod');
        assert.isDefined(method4);
        assert.isNotNull(method4);
        assert.isTrue(method4!.getQuestionToken());
    });

    it('nonOptional methods', async () => {
        const method1 = arkFile?.getDefaultClass().getMethodWithName('testDotDotDotToken');
        assert.isDefined(method1);
        assert.isNotNull(method1);
        assert.isFalse(method1!.getQuestionToken());

        const method2 = arkFile?.getDefaultClass().getMethodWithName('%innerFunction1$outerFunction1');
        assert.isDefined(method2);
        assert.isNotNull(method2);
        assert.isFalse(method2!.getQuestionToken());

        const outerMethod = arkDefaultClass?.getMethodWithName('outerFunction3')!;
        const ptrLocalDef = outerMethod?.getBody()?.getLocals().get('innerFunction3')?.getDeclaringStmt();
        assert.isTrue(ptrLocalDef instanceof ArkAssignStmt);
        const methodType = (ptrLocalDef as ArkAssignStmt).getRightOp().getType();
        assert.isTrue(methodType instanceof FunctionType);
        const method3 = arkDefaultClass?.getMethodWithName((methodType as FunctionType).getMethodSignature().getMethodSubSignature().getMethodName());
        assert.isDefined(method3);
        assert.isNotNull(method3);
        assert.isFalse(method3!.getQuestionToken());

        const method4 = arkFile?.getDefaultClass().getDefaultArkMethod();
        assert.isDefined(method4);
        assert.isNotNull(method4);
        assert.isFalse(method4!.getQuestionToken());

        const method5 = arkFile?.getClassWithName('%AC0')?.getMethodWithName('requiredMethod');
        assert.isDefined(method5);
        assert.isNotNull(method5);
        assert.isFalse(method5!.getQuestionToken());

        const method6 = arkFile?.getClassWithName('%AC1')?.getMethodWithName('requiredMethod');
        assert.isDefined(method6);
        assert.isNotNull(method6);
        assert.isFalse(method6!.getQuestionToken());
    });
});

describe('Method Param with Default Value', () => {
    const method = arkFile?.getDefaultClass().getMethodWithName('paramWithInitializer');

    it('case1: param without default value', async () => {
        const param = method?.getSubSignature().getParameters()[0];
        assert.isDefined(param);
        assert.isFalse(param!.isOptional());
        assert.equal(param!.getType().toString(), 'string');
    });

    it('case2: param with default value and type annotation', async () => {
        const param = method?.getSubSignature().getParameters()[1];
        assert.isDefined(param);
        assert.isTrue(param!.isOptional());
        assert.equal(param!.getType().toString(), 'number');
    });

    it('case3: param with default value and without type annotation', async () => {
        const param = method?.getSubSignature().getParameters()[2];
        assert.isDefined(param);
        assert.isTrue(param!.isOptional());
        // TODO: type inference should update the param type with initializer stmts.
        assert.equal(param!.getType().toString(), 'unknown');
    });

    it('case4: param with default value according to another param', async () => {
        const param = method?.getSubSignature().getParameters()[3];
        assert.isDefined(param);
        assert.isTrue(param!.isOptional());
        assert.equal(param!.getType().toString(), 'number');
    });

    it('case5: method ir', async () => {
        assert.isDefined(method);
        assert.isNotNull(method);
        const printer = new ArkIRMethodPrinter(method!);
        assert.equal(printer.dump(), MethodParamWithDefaultValue);
    });

    it('case6: method with complicated initializer ir', async () => {
        const method = arkFile?.getDefaultClass().getMethodWithName('paramWithComplicatedInitializer');
        assert.isDefined(method);
        assert.isNotNull(method);
        const printer = new ArkIRMethodPrinter(method!);
        assert.equal(printer.dump(), paramWithComplicatedInitializer);
    });

    it('case7: method with if branch', async () => {
        const method = arkFile?.getDefaultClass().getMethodWithName('paramInitializerWithIfBranch');
        assert.isDefined(method);
        assert.isNotNull(method);
        const printer = new ArkIRMethodPrinter(method!);
        assert.equal(printer.dump(), methodWithIfBranch);
        const startingBlockID = method!.getBody()?.getCfg().getStartingBlock()?.getId();
        assert.isDefined(startingBlockID);
        assert.equal(startingBlockID, 2);
    });

    it('case8: method with ternary expression', async () => {
        const method = arkFile?.getDefaultClass().getMethodWithName('paramInitializerWithTernary');
        assert.isDefined(method);
        assert.isNotNull(method);
        const printer = new ArkIRMethodPrinter(method!);
        assert.equal(printer.dump(), methodWithTernary);
    });

    it('case9: method with try catch', async () => {
        const method = arkFile?.getDefaultClass().getMethodWithName('paramInitializerWithTryCatch');
        assert.isDefined(method);
        assert.isNotNull(method);
        const printer = new ArkIRMethodPrinter(method!);
        assert.equal(printer.dump(), methodWithTryCatch);
        const startingBlockID = method!.getBody()?.getCfg().getStartingBlock()?.getId();
        assert.isDefined(startingBlockID);
        assert.equal(startingBlockID, 3);
    });

    it('case10: method with for loop', async () => {
        const method = arkFile?.getDefaultClass().getMethodWithName('paramInitializerWithForLoop');
        assert.isDefined(method);
        assert.isNotNull(method);
        const printer = new ArkIRMethodPrinter(method!);
        assert.equal(printer.dump(), methodWithForLoop);
        const startingBlockID = method!.getBody()?.getCfg().getStartingBlock()?.getId();
        assert.isDefined(startingBlockID);
        assert.equal(startingBlockID, 4);
    });

    it('case11: method with Switch', async () => {
        const method = arkFile?.getDefaultClass().getMethodWithName('paramInitializerWithSwitch');
        assert.isDefined(method);
        assert.isNotNull(method);
        const printer = new ArkIRMethodPrinter(method!);
        assert.equal(printer.dump(), methodWithSwitch);
        const startingBlockID = method!.getBody()?.getCfg().getStartingBlock()?.getId();
        assert.isDefined(startingBlockID);
        assert.equal(startingBlockID, 3);
    });

    it('case12: method with ternary default ir (side-effects)', async () => {
        const method = arkFile?.getDefaultClass().getMethodWithName('paramInitializerWithTernaryDefault');
        assert.isDefined(method);
        assert.isNotNull(method);
        const printer = new ArkIRMethodPrinter(method!);
        assert.equal(printer.dump(), methodWithTernaryDefault);
    });

    it('case13: method with nested ternary default ir', async () => {
        const method = arkFile?.getDefaultClass().getMethodWithName('paramInitializerWithNestedTernaryDefault');
        assert.isDefined(method);
        assert.isNotNull(method);
        const printer = new ArkIRMethodPrinter(method!);
        assert.equal(printer.dump(), methodWithNestedTernaryDefault);
    });
});

describe('Global Used in Method', () => {
    it('test global with no declaring stmt', async () => {
        const method = arkDefaultClass?.getMethodWithName('assign2Global');
        const stmts = method?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        assert.isAtLeast(stmts!.length, 2);
        assert.isNull(((stmts![1] as ArkAssignStmt).getLeftOp() as Local).getDeclaringStmt());

        const usedGlobal = method?.getBody()?.getUsedGlobals()?.get('globalNumber');
        assert.isTrue(usedGlobal instanceof GlobalRef);
        const ref = (usedGlobal as GlobalRef).getRef();
        assert.isNotNull(ref);
        assert.isTrue(ref instanceof Local);
        assert.equal((ref as Local).getDeclaringStmt()?.toString(), 'globalNumber = 2');
    });

    it('test return global', async () => {
        const method = arkDefaultClass?.getMethodWithName('returnGlobal');
        const usedGlobal = method?.getBody()?.getUsedGlobals()?.get('GLOBAL_NUM');
        assert.isTrue(usedGlobal instanceof GlobalRef);
        const ref = (usedGlobal as GlobalRef).getRef();
        assert.isNotNull(ref);
        assert.isTrue(ref instanceof Local);
        assert.equal((ref as Local).getDeclaringStmt()?.toString(), 'GLOBAL_NUM = 100');
    });

    it('test global used in top lambda', async () => {
        const defaultMethod = arkDefaultClass?.getDefaultArkMethod();
        const ptrLocalDef = defaultMethod?.getBody()?.getLocals().get('ptrWithGlobal')?.getDeclaringStmt();
        assert.isTrue(ptrLocalDef instanceof ArkAssignStmt);

        const methodType = (ptrLocalDef as ArkAssignStmt).getRightOp().getType();
        assert.isTrue(methodType instanceof FunctionType);
        const method = arkDefaultClass?.getMethodWithName((methodType as FunctionType).getMethodSignature().getMethodSubSignature().getMethodName());
        assert.isDefined(method);
        assert.isNotNull(method);

        const usedGlobal = method!.getBody()?.getUsedGlobals()?.get('globalNumber');
        assert.isTrue(usedGlobal instanceof GlobalRef);
        const ref = (usedGlobal as GlobalRef).getRef();
        assert.isNotNull(ref);
        assert.isTrue(ref instanceof Local);
        assert.equal((ref as Local).getDeclaringStmt()?.toString(), 'globalNumber = 2');

        assert.isUndefined(method!.getOuterMethod());
        assert.isUndefined(method!.getBodyBuilder());
    });

    it('test global used in function lambda', async () => {
        const func = arkDefaultClass?.getMethodWithName('globalUsedInFunc');
        const funcUsedGlobal = func?.getBody()?.getUsedGlobals()?.get('globalNumber');
        assert.isTrue(funcUsedGlobal instanceof GlobalRef);
        const funcGlobalRef = (funcUsedGlobal as GlobalRef).getRef();
        assert.isNotNull(funcGlobalRef);
        assert.isTrue(funcGlobalRef instanceof Local);
        assert.equal((funcGlobalRef as Local).getDeclaringStmt()?.toString(), 'globalNumber = 2');

        const funcStmts = func?.getCfg()?.getStmts();
        const lambdaInvoke = funcStmts![2];
        assert.isTrue(lambdaInvoke instanceof ArkInvokeStmt);
        const methodType = (lambdaInvoke as ArkInvokeStmt).getInvokeExpr().getArgs()[0].getType();
        assert.isTrue(methodType instanceof FunctionType);
        const method = arkDefaultClass?.getMethodWithName((methodType as FunctionType).getMethodSignature().getMethodSubSignature().getMethodName());

        const usedGlobal = method?.getBody()?.getUsedGlobals()?.get('globalNumber');
        assert.isTrue(usedGlobal instanceof GlobalRef);
        const ref = (usedGlobal as GlobalRef).getRef();
        assert.isNotNull(ref);
        assert.isTrue(ref instanceof Local);
        assert.equal((ref as Local).getDeclaringStmt()?.toString(), 'globalNumber = 2');
    });

    it('test global used in field lambda', async () => {
        const clazz = arkFile?.getClassWithName('GlobalTest');
        const ptrLocalDef = clazz?.getFieldWithName('f')?.getInitializer()[0];
        assert.isTrue(ptrLocalDef instanceof ArkAssignStmt);

        const methodType = (ptrLocalDef as ArkAssignStmt).getRightOp().getType();
        assert.isTrue(methodType instanceof FunctionType);
        const method = clazz?.getMethodWithName((methodType as FunctionType).getMethodSignature().getMethodSubSignature().getMethodName());
        assert.isDefined(method);
        assert.isNotNull(method);

        const usedGlobal = method?.getBody()?.getUsedGlobals()?.get('GLOBAL_NUM');
        assert.isTrue(usedGlobal instanceof GlobalRef);
        const ref = (usedGlobal as GlobalRef).getRef();
        assert.isNotNull(ref);
        assert.isTrue(ref instanceof Local);
        assert.equal((ref as Local).getDeclaringStmt()?.toString(), 'GLOBAL_NUM = 100');

        assert.isUndefined(method!.getOuterMethod());
        assert.isUndefined(method!.getBodyBuilder());
    });

    it('test global used in method lambda', async () => {
        const clazz = arkFile?.getClassWithName('GlobalTest');
        const func = clazz?.getMethodWithName('goo');
        const funcUsedGlobal = func?.getBody()?.getUsedGlobals()?.get('globalNumber');
        assert.isTrue(funcUsedGlobal instanceof GlobalRef);
        const funcGlobalRef = (funcUsedGlobal as GlobalRef).getRef();
        assert.isNotNull(funcGlobalRef);
        assert.isTrue(funcGlobalRef instanceof Local);
        assert.equal((funcGlobalRef as Local).getDeclaringStmt()?.toString(), 'globalNumber = 2');

        const funcStmts = func?.getCfg()?.getStmts();
        const lambdaInvoke = funcStmts![2];
        assert.isTrue(lambdaInvoke instanceof ArkInvokeStmt);
        const methodType = (lambdaInvoke as ArkInvokeStmt).getInvokeExpr().getArgs()[0].getType();
        assert.isTrue(methodType instanceof FunctionType);
        const method = clazz?.getMethodWithName((methodType as FunctionType).getMethodSignature().getMethodSubSignature().getMethodName());

        const usedGlobal = method?.getBody()?.getUsedGlobals()?.get('globalNumber');
        assert.isTrue(usedGlobal instanceof GlobalRef);
        const ref = (usedGlobal as GlobalRef).getRef();
        assert.isNotNull(ref);
        assert.isTrue(ref instanceof Local);
        assert.equal((ref as Local).getDeclaringStmt()?.toString(), 'globalNumber = 2');
    });
});

describe('Empty Function constructor()', () => {
    it('should execute without errors and have no side effects', () => {
        const method = arkDefaultClass?.getMethodWithName('constructor');
        assert.isDefined(method);
        const stmts = method?.getCfg()?.getStmts();
        assert.isDefined(stmts);
    });
});

describe('Empty Function constructor()', () => {
    it('should execute without errors and have no side effects', () => {
        const method = testNamespace?.getDefaultClass()?.getMethodWithName('constructor');
        assert.isDefined(method);
        const stmts = method?.getCfg()?.getStmts();
        assert.isDefined(stmts);
    });
});

describe('ArkMethod Position Test', () => {
    it('test getImplOriginFullPosition for getA method', async () => {
        const method = arkDefaultClass?.getMethodWithName('getA');
        assert.isDefined(method);
        
        const position = method!.getImplOriginFullPosition();
        assert.isDefined(position);
        expect(position!.getFirstLine()).eq(115);
        expect(position!.getFirstCol()).eq(1);
        expect(position!.getLastLine()).eq(117);
        expect(position!.getLastCol()).eq(2);
    });

    it('test getLineCol for getA method', async () => {
        const method = arkDefaultClass?.getMethodWithName('getA');
        assert.isDefined(method);
        
        const lineCol = method!.getLineCol();
        assert.isNotNull(lineCol);
        expect(getLineNo(lineCol!)).eq(115);
        expect(getColNo(lineCol!)).eq(1);
    });

    it('test getDeclareOriginFullPositions for getA method returns null', async () => {
        const method = arkDefaultClass?.getMethodWithName('getA');
        assert.isDefined(method);
        
        const declarePositions = method!.getDeclareOriginFullPositions();
        assert.isNull(declarePositions);
    });

    it('test getDeclareLineCols for getA method returns null', async () => {
        const method = arkDefaultClass?.getMethodWithName('getA');
        assert.isDefined(method);
        
        const declareLineCols = method!.getDeclareLineCols();
        assert.isNull(declareLineCols);
    });

    it('test getLine for getA method', async () => {
        const method = arkDefaultClass?.getMethodWithName('getA');
        assert.isDefined(method);
        expect(method!.getLine()).eq(115);
    });

    it('test getColumn for getA method', async () => {
        const method = arkDefaultClass?.getMethodWithName('getA');
        assert.isDefined(method);
        expect(method!.getColumn()).eq(1);
    });

    it('test getImplOriginFullPosition for paramInitializerWithIfBranch method', async () => {
        const method = arkDefaultClass?.getMethodWithName('paramInitializerWithIfBranch');
        assert.isDefined(method);
        
        const position = method!.getImplOriginFullPosition();
        assert.isDefined(position);
        expect(position!.getFirstLine()).eq(125);
        expect(position!.getFirstCol()).eq(1);
        expect(position!.getLastLine()).eq(131);
        expect(position!.getLastCol()).eq(2);
    });

    it('test getLineCol for paramInitializerWithIfBranch method', async () => {
        const method = arkDefaultClass?.getMethodWithName('paramInitializerWithIfBranch');
        assert.isDefined(method);
        
        const lineCol = method!.getLineCol();
        assert.isNotNull(lineCol);
        expect(getLineNo(lineCol!)).eq(125);
        expect(getColNo(lineCol!)).eq(1);
    });

    it('test getLine for paramInitializerWithIfBranch method', async () => {
        const method = arkDefaultClass?.getMethodWithName('paramInitializerWithIfBranch');
        assert.isDefined(method);
        expect(method!.getLine()).eq(125);
    });

    it('test getColumn for paramInitializerWithIfBranch method', async () => {
        const method = arkDefaultClass?.getMethodWithName('paramInitializerWithIfBranch');
        assert.isDefined(method);
        expect(method!.getColumn()).eq(1);
    });
});

describe('ArkMethod Declare Method Position Test', () => {
    const declareScene = buildScene(path.join(__dirname, '../../../resources/exports'));
    const declareArkFile = declareScene.getFiles().find((file) => file.getName() === 'exportSample.ts');
    const myNamespace = declareArkFile?.getNamespaceWithName('MyNameSpace');
    const namespaceClass = myNamespace?.getDefaultClass();
    const doaMethod = namespaceClass?.getMethodWithName('doa');

    it('test getImplOriginFullPosition for doa method returns undefined', async () => {
        assert.isDefined(doaMethod);
        expect(doaMethod!.getImplOriginFullPosition()).eq(undefined);
    });

    it('test getLine for doa method returns null', async () => {
        assert.isDefined(doaMethod);
        expect(doaMethod!.getLine()).eq(null);
    });

    it('test getColumn for doa method returns null', async () => {
        assert.isDefined(doaMethod);
        expect(doaMethod!.getColumn()).eq(null);
    });

    it('test getLineCol for doa method returns null', async () => {
        assert.isDefined(doaMethod);
        expect(doaMethod!.getLineCol()).eq(null);
    });

    it('test getDeclareOriginFullPositions for doa method returns non-null', async () => {
        assert.isDefined(doaMethod);
        
        const declarePositions = doaMethod!.getDeclareOriginFullPositions();
        assert.isNotNull(declarePositions);
        expect(declarePositions!.length).eq(1);
        expect(declarePositions![0].getFirstLine()).eq(48);
        expect(declarePositions![0].getFirstCol()).eq(5);
        expect(declarePositions![0].getLastLine()).eq(48);
        expect(declarePositions![0].getLastCol()).eq(38);
    });

    it('test getDeclareLineCols for doa method returns non-null', async () => {
        assert.isDefined(doaMethod);
        
        const declareLineCols = doaMethod!.getDeclareLineCols();
        assert.isNotNull(declareLineCols);
        expect(declareLineCols!.length).eq(1);
        expect(getLineNo(declareLineCols![0])).eq(48);
        expect(getColNo(declareLineCols![0])).eq(5);
    });

    it('test getDeclareLines for doa method returns non-null', async () => {
        assert.isDefined(doaMethod);
        
        const declareLines = doaMethod!.getDeclareLines();
        assert.isNotNull(declareLines);
        expect(declareLines!.length).eq(1);
        expect(declareLines![0]).eq(48);
    });

    it('test getDeclareColumns for doa method returns non-null', async () => {
        assert.isDefined(doaMethod);
        
        const declareColumns = doaMethod!.getDeclareColumns();
        assert.isNotNull(declareColumns);
        expect(declareColumns!.length).eq(1);
        expect(declareColumns![0]).eq(5);
    });
});
