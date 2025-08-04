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

import { assert, describe, expect, it } from 'vitest';
import { ArkClass, ArkMethod, ClassSignature, ClassType, CONSTRUCTOR_NAME, MethodSignature, Stmt, SUPER_NAME, THIS_NAME } from '../../../../src';
import path from 'path';
import { assertStmtsEqual, buildScene, fullPositionArray2String } from '../../common';
import {
    Class_With_Static_Init_Block_Expect,
    ClassWithFieldAndConstructor,
    ClassWithFieldAndParamConstructor,
    ClassWithGeneratedConstructor,
    ClassWithParamProperty,
    ClassWithSuperConstructor,
    EnumClass,
    InterfaceClass,
    ObjClass,
    SubObjClass,
    SubTypeLiteralClass,
    TypeLiteralClass,
    New_Class_In_Default_Method,
    New_Class_In_Function,
    ClassAConstructorIR,
    ClassBConstructorIR,
    ClassCConstructorIR,
    ClassDConstructorIR,
    ClassEConstructorIR,
    ClassFConstructorIR,
    ClassGConstructorIR,
    ClassHConstructorIR,
} from '../../../resources/model/class/ClassExpect';
import { ArkIRClassPrinter } from '../../../../src/save/arkir/ArkIRClassPrinter';
import { ArkIRMethodPrinter } from '../../../../src/save/arkir/ArkIRMethodPrinter';

function checkAllMethodsStmtsCfg(arkClass: ArkClass): void {
    for (const method of arkClass.getMethods(true)) {
        const stmts = method.getCfg()?.getStmts();
        if (stmts === undefined) {
            continue;
        }
        for (const stmt of stmts) {
            assert.isDefined(stmt.getCfg());
        }
    }
}

describe('ArkClass Test', () => {
    const scene = buildScene(path.join(__dirname, '../../../resources/model/class'));

    it('get method with matched signature', async () => {
        const arkFile = scene.getFiles().find((file) => file.getName() === 'class.ts');
        const arkClass = arkFile?.getClassWithName('TestClass');
        const arkMethod = arkClass?.getMethodWithName('testMethod');

        assert.isNotNull(arkClass);
        assert.isDefined(arkMethod);
        assert.isNotNull(arkMethod);
        const matchedSignature = new MethodSignature((arkClass as ArkClass).getSignature(), (arkMethod as ArkMethod).getSubSignature());
        const method = arkClass?.getMethod(matchedSignature);
        assert.isDefined(method);
        assert.isNotNull(method);
        expect(method?.getLine()).toEqual(19);
    });

    it('get method with unmatched signature', async () => {
        const arkFile = scene.getFiles().find((file) => file.getName() === 'class.ts');
        const arkClass = arkFile?.getClassWithName('TestClass');
        const arkMethod = arkClass?.getMethodWithName('testMethod');

        assert.isNotNull(arkClass);
        assert.isDefined(arkMethod);
        assert.isNotNull(arkMethod);
        const clsSignature = new ClassSignature('newClass', (arkClass as ArkClass).getDeclaringArkFile().getFileSignature());
        const unmatchedSignature = new MethodSignature(clsSignature, (arkMethod as ArkMethod).getSubSignature());
        const method = arkClass?.getMethod(unmatchedSignature);
        assert.isNull(method);
    });

    it('static block', async () => {
        const arkFile = scene.getFiles().find((file) => file.getName() === 'ClassWithStaticInitBlock.ts');
        assert.isDefined(arkFile);

        const staticInitNamePrefix = '%stat';
        const assertStaticBlockEqual = (arkClass: ArkClass, classExpect: any) => {
            for (const arkMethod of arkClass.getMethods(true)) {
                const methodName = arkMethod.getName();
                if (methodName.startsWith(staticInitNamePrefix)) {
                    const methodExpect = classExpect[methodName];
                    const methodSignature = arkMethod.getSignature();
                    const methodSignatureExpect = methodExpect.methodSignature;
                    expect(methodSignature.toString()).toEqual(methodSignatureExpect);

                    assertStmtsEqual(arkMethod.getCfg()?.getStmts() as Stmt[], methodExpect.stmts, false);
                }
            }
        };

        const classCase1 = arkFile?.getClassWithName('Case1');
        assert.isTrue(classCase1 instanceof ArkClass);
        const classCase1Expect = Class_With_Static_Init_Block_Expect.Case1;
        assertStaticBlockEqual(classCase1 as ArkClass, classCase1Expect);

        const classCase2 = arkFile?.getClassWithName('Case2');
        assert.isTrue(classCase2 instanceof ArkClass);
        const classCase2Expect = Class_With_Static_Init_Block_Expect.Case2;
        assertStaticBlockEqual(classCase2 as ArkClass, classCase2Expect);

        const classCase3 = arkFile?.getClassWithName('Case3');
        assert.isTrue(classCase3 instanceof ArkClass);
        const classCase3Expect = Class_With_Static_Init_Block_Expect.Case3;
        assertStaticBlockEqual(classCase3 as ArkClass, classCase3Expect);
    });

    it('stmt cfg', async () => {
        const arkFile = scene.getFiles().find((file) => file.getName() === 'class.ts');
        const arkClass = arkFile?.getClassWithName('TestClass');

        assert.isDefined(arkClass);
        assert.isNotNull(arkClass);
        checkAllMethodsStmtsCfg(arkClass!);
    });
});

describe('ArkClass Constructor and Init Method Test', () => {
    const scene = buildScene(path.join(__dirname, '../../../resources/model/class'));
    const arkFile = scene.getFiles().find((file) => file.getName() === 'ClassWithConstructor.ts');

    it('class with generated constructor', async () => {
        const arkClass = arkFile?.getClassWithName('ClassWithNoConstructor');
        assert.isDefined(arkClass);
        assert.isNotNull(arkClass);
        let printer = new ArkIRClassPrinter(arkClass!);
        let ir = printer.dump();
        assert.equal(ir, ClassWithGeneratedConstructor);
        assert.isTrue(arkClass?.getMethodWithName('test')?.isPublic());

        checkAllMethodsStmtsCfg(arkClass!);
    });

    it('class with field and constructor', async () => {
        const arkClass = arkFile?.getClassWithName('ClassWithNoParamConstructor');
        assert.isDefined(arkClass);
        assert.isNotNull(arkClass);
        let printer = new ArkIRClassPrinter(arkClass!);
        let ir = printer.dump();
        assert.equal(ir, ClassWithFieldAndConstructor);
        assert.isTrue(arkClass?.getFieldWithName('a')?.isPublic());
        checkAllMethodsStmtsCfg(arkClass!);
    });

    it('class with static field and constructor has params', async () => {
        const arkClass = arkFile?.getClassWithName('ClassWithParamsConstructor');
        assert.isDefined(arkClass);
        assert.isNotNull(arkClass);
        let printer = new ArkIRClassPrinter(arkClass!);
        let ir = printer.dump();
        assert.equal(ir, ClassWithFieldAndParamConstructor);
        assert.isTrue(arkClass?.getStaticFieldWithName('a')?.isPublic());
        checkAllMethodsStmtsCfg(arkClass!);
    });

    it('class with super constructor', async () => {
        const arkClass = arkFile?.getClassWithName('ClassWithSuperConstructor');
        assert.isDefined(arkClass);
        assert.isNotNull(arkClass);
        let printer = new ArkIRClassPrinter(arkClass!);
        let ir = printer.dump();
        assert.equal(ir, ClassWithSuperConstructor);
        assert.isTrue(arkClass?.getFieldWithName('c')?.isPublic());
        checkAllMethodsStmtsCfg(arkClass!);
    });

    it('class with param property', async () => {
        const arkClass = arkFile?.getClassWithName('ClassWithParamProperty');
        assert.isDefined(arkClass);
        assert.isNotNull(arkClass);
        let printer = new ArkIRClassPrinter(arkClass!);
        let ir = printer.dump();
        assert.equal(ir, ClassWithParamProperty);
        checkAllMethodsStmtsCfg(arkClass!);
    });
});

describe('ArkClass with Other Category Test', () => {
    const scene = buildScene(path.join(__dirname, '../../../resources/model/class'));
    const arkFile = scene.getFiles().find((file) => file.getName() === 'ClassWithOtherCategory.ts');

    it('interface class', async () => {
        const arkClass = arkFile?.getClassWithName('TestInterface');
        assert.isDefined(arkClass);
        assert.isNotNull(arkClass);
        let printer = new ArkIRClassPrinter(arkClass!);
        let ir = printer.dump();
        assert.equal(ir, InterfaceClass);
        checkAllMethodsStmtsCfg(arkClass!);
    });

    it('enum class', async () => {
        const arkClass = arkFile?.getClassWithName('TestEnum');
        assert.isDefined(arkClass);
        assert.isNotNull(arkClass);
        let printer = new ArkIRClassPrinter(arkClass!);
        let ir = printer.dump();
        assert.equal(ir, EnumClass);
        checkAllMethodsStmtsCfg(arkClass!);
    });

    it('type literal class', async () => {
        const typeLiteral = arkFile?.getDefaultClass().getDefaultArkMethod()?.getBody()?.getAliasTypeByName('TestLiteral');
        assert.isDefined(typeLiteral);
        assert.isNotNull(typeLiteral);

        assert.isTrue(typeLiteral!.getOriginalType() instanceof ClassType);
        const className = (typeLiteral!.getOriginalType() as ClassType).getClassSignature().getClassName();
        const literalClass = arkFile?.getClassWithName(className);
        assert.isDefined(literalClass);
        assert.isNotNull(literalClass);
        let printer = new ArkIRClassPrinter(literalClass!);
        let ir = printer.dump();
        assert.equal(ir, TypeLiteralClass);
        checkAllMethodsStmtsCfg(literalClass!);

        const subLiteralClassType = literalClass?.getFieldWithName('b')?.getType();
        assert.isDefined(subLiteralClassType);
        assert.isTrue(subLiteralClassType instanceof ClassType);
        const subClassName = (subLiteralClassType as ClassType).getClassSignature().getClassName();
        const subLiteralClass = arkFile?.getClassWithName(subClassName);
        assert.isDefined(subLiteralClass);
        assert.isNotNull(subLiteralClass);
        let subClassPrinter = new ArkIRClassPrinter(subLiteralClass!);
        let subIr = subClassPrinter.dump();
        assert.equal(subIr, SubTypeLiteralClass);
        checkAllMethodsStmtsCfg(subLiteralClass!);
    });

    it('object class', async () => {
        const objectClassLocal = arkFile?.getDefaultClass().getDefaultArkMethod()?.getBody()?.getLocals().get('testObj');
        assert.isDefined(objectClassLocal);

        assert.isTrue(objectClassLocal!.getType() instanceof ClassType);
        const objClassName = (objectClassLocal!.getType() as ClassType).getClassSignature().getClassName();
        const objClass = arkFile?.getClassWithName(objClassName);
        assert.isDefined(objClass);
        assert.isNotNull(objClass);
        let printer = new ArkIRClassPrinter(objClass!);
        let ir = printer.dump();
        assert.equal(ir, ObjClass);
        checkAllMethodsStmtsCfg(objClass!);

        const subObjClassType = objClass?.getFieldWithName('b')?.getType();
        assert.isDefined(subObjClassType);
        assert.isTrue(subObjClassType instanceof ClassType);
        const subObjClassName = (subObjClassType as ClassType).getClassSignature().getClassName();
        const subObjClass = arkFile?.getClassWithName(subObjClassName);
        assert.isDefined(subObjClass);
        assert.isNotNull(subObjClass);
        let subClassPrinter = new ArkIRClassPrinter(subObjClass!);
        let subIr = subClassPrinter.dump();
        assert.equal(subIr, SubObjClass);
        checkAllMethodsStmtsCfg(subObjClass!);
    });
});

describe('ArkClass with Heritage Class Test', () => {
    const scene = buildScene(path.join(__dirname, '../../../resources/model/class'));
    const arkFile = scene.getFiles().find((file) => file.getName() === 'ClassWithHeritage.ts');

    it('extended class without constructor', async () => {
        const arkClass = arkFile?.getClassWithName('A');
        assert.isDefined(arkClass);
        assert.isNotNull(arkClass);
        const extendedClass = arkClass!.getExtendedClasses().get('B');
        assert.isDefined(extendedClass);
        assert.equal(extendedClass!.getSignature().toString(), '@class/ClassWithHeritage.ts: B');
        checkAllMethodsStmtsCfg(arkClass!);
    });

    it('extended class with constructor', async () => {
        const arkClass = arkFile?.getClassWithName('B');
        assert.isDefined(arkClass);
        assert.isNotNull(arkClass);
        const extendedClass = arkClass!.getExtendedClasses().get('Q');
        assert.isDefined(extendedClass);
        assert.equal(extendedClass!.getSignature().toString(), '@class/ClassWithHeritage.ts: Q');
        checkAllMethodsStmtsCfg(arkClass!);
    });

    it('parent class and child class both generated constructor', async () => {
        const parentConsMth = arkFile?.getClassWithName('A')?.getMethodWithName(CONSTRUCTOR_NAME);
        const ChildConsMth = arkFile?.getClassWithName('B')?.getMethodWithName(CONSTRUCTOR_NAME);
        assert.isDefined(parentConsMth);
        assert.isNotNull(parentConsMth);
        assert.isDefined(ChildConsMth);
        assert.isNotNull(ChildConsMth);

        const parentConsMthIR = new ArkIRMethodPrinter(parentConsMth!);
        const childConsMthIR = new ArkIRMethodPrinter(ChildConsMth!);
        assert.equal(parentConsMthIR.dump(), ClassAConstructorIR);
        assert.equal(childConsMthIR.dump(), ClassBConstructorIR);
    });

    it('parent class with constructor and child class without constructor', async () => {
        const parentConsMth = arkFile?.getClassWithName('C')?.getMethodWithName(CONSTRUCTOR_NAME);
        const ChildConsMth = arkFile?.getClassWithName('D')?.getMethodWithName(CONSTRUCTOR_NAME);
        assert.isDefined(parentConsMth);
        assert.isNotNull(parentConsMth);
        assert.isDefined(ChildConsMth);
        assert.isNotNull(ChildConsMth);

        const parentConsMthIR = new ArkIRMethodPrinter(parentConsMth!);
        const childConsMthIR = new ArkIRMethodPrinter(ChildConsMth!);
        assert.equal(parentConsMthIR.dump(), ClassCConstructorIR);
        assert.equal(childConsMthIR.dump(), ClassDConstructorIR);
    });

    it('parent class and child class both with constructor', async () => {
        const ChildConsMth = arkFile?.getClassWithName('E')?.getMethodWithName(CONSTRUCTOR_NAME);
        assert.isDefined(ChildConsMth);
        assert.isNotNull(ChildConsMth);

        const childConsMthIR = new ArkIRMethodPrinter(ChildConsMth!);
        assert.equal(childConsMthIR.dump(), ClassEConstructorIR);
    });

    it('parent class is imported from other file', async () => {
        const ChildConsMth = arkFile?.getClassWithName('F')?.getMethodWithName(CONSTRUCTOR_NAME);
        assert.isDefined(ChildConsMth);
        assert.isNotNull(ChildConsMth);

        const childConsMthIR = new ArkIRMethodPrinter(ChildConsMth!);
        assert.equal(childConsMthIR.dump(), ClassFConstructorIR);
    });

    it('parent class also has super class', async () => {
        const ChildConsMth = arkFile?.getClassWithName('G')?.getMethodWithName(CONSTRUCTOR_NAME);
        assert.isDefined(ChildConsMth);
        assert.isNotNull(ChildConsMth);

        const childConsMthIR = new ArkIRMethodPrinter(ChildConsMth!);
        assert.equal(childConsMthIR.dump(), ClassGConstructorIR);
    });

    it('can not find parent class', async () => {
        const ChildConsMth = arkFile?.getClassWithName('H')?.getMethodWithName(CONSTRUCTOR_NAME);
        assert.isDefined(ChildConsMth);
        assert.isNotNull(ChildConsMth);

        const childConsMthIR = new ArkIRMethodPrinter(ChildConsMth!);
        assert.equal(childConsMthIR.dump(), ClassHConstructorIR);
    });

    it('method only in parent class', async () => {
        const method = arkFile?.getClassWithName('D')?.getMethodWithName('goo');
        const stmts = method?.getCfg()?.getStmts();
        assert.isDefined(stmts);

        assert.isAtLeast(stmts!.length, 3);
        assert.equal(stmts![1].toString(), 'instanceinvoke this.<@class/ClassWithHeritage.ts: C.foo()>()');
        assert.equal(stmts![2].toString(), 'instanceinvoke this.<@class/ClassWithHeritage.ts: C.foo()>()');

        const thisLocalStmts = method?.getBody()?.getLocals().get(THIS_NAME)?.getUsedStmts();
        assert.isDefined(thisLocalStmts);
        assert.isAtLeast(thisLocalStmts!.length, 2);
        assert.equal(thisLocalStmts![0].toString(), 'instanceinvoke this.<@class/ClassWithHeritage.ts: C.foo()>()');
        assert.equal(thisLocalStmts![1].toString(), 'instanceinvoke this.<@class/ClassWithHeritage.ts: C.foo()>()');

        const superLocal = method?.getBody()?.getLocals().get(SUPER_NAME);
        assert.isUndefined(superLocal);
    });

    it('method in both parent and child class', async () => {
        const method = arkFile?.getClassWithName('E')?.getMethodWithName('goo');
        const stmts = method?.getCfg()?.getStmts();
        assert.isDefined(stmts);

        assert.isAtLeast(stmts!.length, 3);
        assert.equal(stmts![1].toString(), 'instanceinvoke this.<@class/ClassWithHeritage.ts: E.foo()>()');
        assert.equal(stmts![2].toString(), 'instanceinvoke this.<@class/ClassWithHeritage.ts: C.foo()>()');

        const thisLocalStmts = method?.getBody()?.getLocals().get(THIS_NAME)?.getUsedStmts();
        assert.isDefined(thisLocalStmts);
        assert.isAtLeast(thisLocalStmts!.length, 2);
        assert.equal(thisLocalStmts![0].toString(), 'instanceinvoke this.<@class/ClassWithHeritage.ts: E.foo()>()');
        assert.equal(thisLocalStmts![1].toString(), 'instanceinvoke this.<@class/ClassWithHeritage.ts: C.foo()>()');

        const superLocal = method?.getBody()?.getLocals().get(SUPER_NAME);
        assert.isUndefined(superLocal);
    });

    it('invoke expr with super class of super class', async () => {
        const method = arkFile?.getClassWithName('G')?.getMethodWithName('goo');
        const stmts = method?.getCfg()?.getStmts();
        assert.isDefined(stmts);

        assert.isAtLeast(stmts!.length, 2);
        assert.equal(stmts![1].toString(), 'instanceinvoke this.<@class/ClassWithHeritage.ts: C.foo()>()');

        const thisLocal = method?.getBody()?.getLocals().get(THIS_NAME);
        assert.isDefined(thisLocal);
        assert.equal(thisLocal!.getType().getTypeString(), '@class/ClassWithHeritage.ts: G');
        const thisLocalStmts = thisLocal!.getUsedStmts();
        assert.isAtLeast(thisLocalStmts!.length, 1);
        assert.equal(thisLocalStmts![0].toString(), 'instanceinvoke this.<@class/ClassWithHeritage.ts: C.foo()>()');

        const superLocal = method?.getBody()?.getLocals().get(SUPER_NAME);
        assert.isUndefined(superLocal);
    });
});

describe('New Class Test', () => {
    const scene = buildScene(path.join(__dirname, '../../../resources/model/class'));

    it('new class ir', async () => {
        const arkFile = scene.getFiles().find((file) => file.getName() === 'class.ts');

        const defaultMethod = arkFile?.getDefaultClass().getDefaultArkMethod();
        assert.isDefined(defaultMethod);
        assert.isNotNull(defaultMethod);
        let defaultPrinter = new ArkIRMethodPrinter(defaultMethod!);
        let defaultIr = defaultPrinter.dump();
        assert.equal(defaultIr, New_Class_In_Default_Method);

        const assignLocal1 = defaultMethod?.getBody()?.getLocals().get('%0');
        assert.isDefined(assignLocal1);
        assert.equal(assignLocal1?.getType().toString(), '@class/class.ts: TestClass');
        const defaultStmts = defaultMethod!.getBody()?.getCfg().getStmts();
        assert.isDefined(defaultStmts);
        assert.isAtLeast(defaultStmts!.length, 3);
        assert.equal(fullPositionArray2String(defaultStmts![3].getOperandOriginalPositions()!),
            '[[[28, 5], [28, 17]], [[28, 20], [28, 35]], [[28, 20], [28, 35]], [[28, 20], [28, 35]]]');

        const testMethod = arkFile?.getDefaultClass().getMethodWithName('test');
        assert.isDefined(testMethod);
        assert.isNotNull(testMethod);
        let testPrinter = new ArkIRMethodPrinter(testMethod!);
        let testIr = testPrinter.dump();
        assert.equal(testIr, New_Class_In_Function);

        const assignLocal2 = testMethod?.getBody()?.getLocals().get('%0');
        assert.isDefined(assignLocal2);
        assert.equal(assignLocal2?.getType().toString(), '@class/class.ts: TestClass');
        const testStmts = testMethod!.getBody()?.getCfg().getStmts();
        assert.isDefined(testStmts);
        assert.isAtLeast(testStmts!.length, 3);
        assert.equal(fullPositionArray2String(testStmts![3].getOperandOriginalPositions()!),
            '[[[32, 9], [32, 21]], [[32, 24], [32, 39]], [[32, 24], [32, 39]], [[32, 24], [32, 39]]]');
    });
});
