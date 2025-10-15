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
import path from 'path';
import {
    ANONYMOUS_METHOD_PREFIX,
    ArkAssignStmt,
    ArkFile,
    ArkMethod,
    ArkInstanceFieldRef,
    ArkStaticFieldRef,
    DEFAULT_ARK_CLASS_NAME,
    GlobalRef,
    Local,
    LOG_LEVEL,
    Logger,
    NAME_DELIMITER,
    NAME_PREFIX,
    NumberType,
    Scene,
    Value,
} from '../../src';
import {
    ASSIGNMENT_EXPECT_IR,
    BinaryExpression_Expect_IR,
    CallExpression_Expect_IR,
    DESTRUCTURING1_EXPECT_IR,
    DESTRUCTURING2_EXPECT_IR,
    DESTRUCTURING3_EXPECT_IR,
    ExpressionStatements_Expect_IR,
    LiteralExpression_Expect_IR,
    NewExpression_Expect_IR,
    Operator_Expect_IR,
    PostfixAndPrefixUnaryExpression_Expected_IR,
    PTR_INVOKE_EXPRESSION_AM4$PROMISECALL_EXPECT_IR,
    PTR_INVOKE_EXPRESSION_CALLFUNCRETURNED_EXPECT_IR,
    PTR_INVOKE_EXPRESSION_RETURNFUNC1_EXPECT_IR,
    REST_ELEMENTS1_EXPECT_IR,
    REST_ELEMENTS2_EXPECT_IR,
    REST_ELEMENTS3_EXPECT_IR,
    REST_PARAMETERS1_EXPECT_IR,
    SPREAD_ARRAY1_EXPECT_IR,
    SPREAD_ARRAY2_EXPECT_IR,
    SPREAD_ARRAY3_EXPECT_IR,
    SPREAD_ARRAY4_EXPECT_IR,
    SPREAD_PARAMETERS1_EXPECT_IR,
    SPREAD_PARAMETERS2_EXPECT_IR,
    SPREAD_PARAMETERS3_EXPECT_IR,
    UnaryExpression_Expect_IR,
    INCREMENT_EXPECT_IR,
} from '../resources/arkIRTransformer/expression/ExpressionExpectIR';
import {
    CompoundAssignment_Expect_IR,
    Declaration_Expect_IR,
    Destructuring_Expect_IR,
} from '../resources/arkIRTransformer/assignment/AssignmentExpectIR';
import {
    ArrowFunction_Expect_IR,
    BasicNestedMethod1_Expect_IR,
    BasicNestedMethod2_Expect_IR,
    BasicNestedMethod3_Expect_IR,
    BasicNestedMethod4_Expect_IR,
    BasicNestedMethod_Expect_IR,
    BasicOuterMethod1_Expect_IR,
    BasicOuterMethod2_Expect_IR,
    BasicOuterMethod3_Expect_IR,
    BasicOuterMethod4_Expect_IR,
    BasicOuterMethod_Expect_IR,
    CallMethod4_Expect_IR,
    ClosureAnonymousFunction_Expect_IR,
    ClosureClassMethod_Expect_IR,
    ClosureFunction_Expect_IR,
    ClosureNamespaceClassMethod_Expect_IR,
    ClosureNamespaceFunction_Expect_IR,
    MultipleAnonymousMethod1_Expect_IR,
    MultipleAnonymousMethod2_Expect_IR,
    MultipleAnonymousMethod3_Expect_IR,
    MultipleAnonymousMethod4_Expect_IR,
    MultipleCallMethod4_Expect_IR,
    MultipleNested111Method1_Expect_IR,
    MultipleNested11Method1_Expect_IR,
    MultipleNested1Method1_Expect_IR,
    MultipleNested222Method1_Expect_IR,
    MultipleNested22Method1_Expect_IR,
    MultipleNested2Method1_Expect_IR,
    MultipleNested33Method1_Expect_IR,
    MultipleNested3Method1_Expect_IR,
    MultipleNestedInNestedMethod4_Expect_IR,
    MultipleNestedMethod4_Expect_IR,
    MultipleOuterMethod1_Expect_IR,
    MultipleOuterMethod2_Expect_IR,
    MultipleOuterMethod3_Expect_IR,
    MultipleOuterMethod4_Expect_IR,
    NoOverloadMethod_Expect_IR,
    NoOverloadMethodWithBody2_Expect_IR,
    NoOverloadMethodWithBody_Expect_IR,
    OverloadClassMethod_Expect_IR,
    OverloadInterfaceMethod_Expect_IR,
    OverloadMethod_Expect_IR,
    OverloadNamespaceMethod_Expect_IR,
    UnClosureFunction_Expect_IR,
} from '../resources/arkIRTransformer/function/FunctionExpectIR';
import { MethodParameter } from '../../src/core/model/builder/ArkMethodBuilder';
import { assertStmtsEqual, buildScene, testBlocks, testFileStmts, testMethodIR, testMethodStmts } from './common';
import {
    FOR_STATEMENT_EXPECT_CASE1,
    FOR_STATEMENT_EXPECT_CASE2,
    FOR_STATEMENT_EXPECT_CASE3,
    FOR_STATEMENT_EXPECT_CASE4,
    FOR_STATEMENT_EXPECT_CASE5,
    FOR_STATEMENT_EXPECT_CASE6,
    FOR_STATEMENT_EXPECT_CASE7,
} from '../resources/arkIRTransformer/loopStatement/LoopExpect';
import { ArkIRFilePrinter } from '../../src/save/arkir/ArkIRFilePrinter';
import { ClosureFieldRef } from '../../src/core/base/Ref';

const BASE_DIR = path.join(__dirname, '../../tests/resources/arkIRTransformer');
Logger.configure('out/ArkIRTransformerTest.test.log', LOG_LEVEL.INFO, LOG_LEVEL.INFO, false);

function testMethodOverload(scene: Scene, filePath: string, methodName: string, expectMethod: any): void {
    const arkFile = scene.getFiles().find((file) => file.getName().endsWith(filePath));
    const arkMethod = arkFile?.getDefaultClass().getMethods().find((method) => (method.getName() === methodName));
    if (arkMethod === undefined) {
        assert.isDefined(arkMethod);
        return;
    }
    assertMethodLineEqual(arkMethod, expectMethod);
    assertMethodBodyEqual(arkMethod, true, expectMethod);
    assertMethodSignatureEqual(arkMethod, expectMethod);
}

function testClassMethodOverload(scene: Scene, filePath: string, className: string, methodName: string, expectMethod: any): void {
    const arkFile = scene.getFiles().find((file) => file.getName().endsWith(filePath));
    const arkClass = arkFile?.getClasses().find((cls) => cls.getName() === className);
    const arkMethod = arkClass?.getMethods().find((method) => (method.getName() === methodName));
    if (arkMethod === undefined) {
        assert.isDefined(arkMethod);
        return;
    }
    assertMethodLineEqual(arkMethod, expectMethod);
    assertMethodBodyEqual(arkMethod, true, expectMethod);
    assertMethodSignatureEqual(arkMethod, expectMethod);
}

function testNamespaceMethodOverload(scene: Scene, filePath: string, namespaceName: string, methodName: string, expectMethod: any): void {
    const arkFile = scene.getFiles().find((file) => file.getName().endsWith(filePath));
    const arkNamespace = arkFile?.getNamespaces().find((ns) => ns.getName() === namespaceName);
    const arkMethod = arkNamespace?.getDefaultClass().getMethods().find((method) => (method.getName() === methodName));
    if (arkMethod === undefined) {
        assert.isDefined(arkMethod);
        return;
    }
    assertMethodLineEqual(arkMethod, expectMethod);
    assertMethodBodyEqual(arkMethod, false);
    assertMethodSignatureEqual(arkMethod, expectMethod);
}

function testInterfaceMethodOverload(scene: Scene, filePath: string, interfaceName: string, methodName: string, expectMethod: any): void {
    const arkFile = scene.getFiles().find((file) => file.getName().endsWith(filePath));
    const arkClass = arkFile?.getClasses().find((cls) => cls.getName() === interfaceName);
    const arkMethod = arkClass?.getMethods().find((method) => (method.getName() === methodName));
    if (arkMethod === undefined) {
        assert.isDefined(arkMethod);
        return;
    }
    assertMethodLineEqual(arkMethod, expectMethod);
    assertMethodBodyEqual(arkMethod, false, expectMethod);
    assertMethodSignatureEqual(arkMethod, expectMethod);
}

function testNoMethodOverload(scene: Scene, filePath: string, methodName: string, expectMethod: any): void {
    const arkFile = scene.getFiles().find((file) => file.getName().endsWith(filePath));
    const arkMethod = arkFile?.getDefaultClass().getMethods().find((method) => (method.getName() === methodName));
    if (arkMethod === undefined) {
        assert.isDefined(arkMethod);
        return;
    }
    assertMethodLineEqual(arkMethod, expectMethod);
    assertMethodBodyEqual(arkMethod, false);
    assertMethodSignatureEqual(arkMethod, expectMethod);
}

function testNoMethodOverloadWithBody(scene: Scene, filePath: string, methodName: string, expectMethod: any): void {
    const arkFile = scene.getFiles().find((file) => file.getName().endsWith(filePath));
    const arkMethod = arkFile?.getDefaultClass().getMethods().find((method) => (method.getName() === methodName));
    if (arkMethod === undefined) {
        assert.isDefined(arkMethod);
        return;
    }
    assertMethodLineEqual(arkMethod, expectMethod);
    assertMethodBodyEqual(arkMethod, true, expectMethod);
    assertMethodSignatureEqual(arkMethod, expectMethod);
}

function assertMethodLineEqual(method: ArkMethod, expectMethod: any): void {
    const declareLines = method.getDeclareLines();
    const expectDeclareLines = expectMethod.methodDeclareLines;
    if (expectDeclareLines !== undefined) {
        if (expectDeclareLines === null) {
            assert.isNull(declareLines);
        } else {
            assert.isNotNull(declareLines);
            expect(declareLines?.length).toEqual(expectDeclareLines.length);
            declareLines?.forEach((line, index) => {
                expect(line).toEqual(expectDeclareLines[index]);
            });
        }
    }

    if (expectMethod.line !== undefined) {
        if (expectMethod.line === null) {
            assert.isNull(method.getLine());
        } else {
            expect(method.getLine()).toEqual(expectMethod.line);
        }
    }
}

function assertLocalsEqual(actualLocals: Map<string, Local>, expectLocals: any): void {
    for (let i = 0; i < expectLocals.length; i++) {
        const actualLocal = actualLocals.get(expectLocals[i].name);
        assert.isDefined(actualLocal);
        if (expectLocals[i].type !== undefined) {
            assert.equal(actualLocal!.getType().toString(), expectLocals[i].type);
        }
        if (expectLocals[i].declaringStmt !== undefined) {
            if (expectLocals[i].declaringStmt === null) {
                expect(actualLocal!.getDeclaringStmt()).toEqual(expectLocals[i].declaringStmt);
            } else {
                expect(actualLocal!.getDeclaringStmt()?.toString()).toEqual(expectLocals[i].declaringStmt.text);
            }
        }
        if (expectLocals[i].usedStmts !== undefined) {
            assertStmtsEqual(actualLocal!.getUsedStmts(), expectLocals[i].usedStmts);
        }
    }
}

function assertGlobalsEqual(actualGlobals: Map<string, Value> | undefined, expectGlobals: any): void {
    if (expectGlobals !== undefined && expectGlobals !== null) {
        assert.isDefined(actualGlobals);
    } else {
        assert.isUndefined(actualGlobals);
        return;
    }
    for (let i = 0; i < expectGlobals.length; i++) {
        const actualGlobal = actualGlobals!.get(expectGlobals[i].name);
        assert.isDefined(actualGlobal);
        if (expectGlobals[i].instanceof !== undefined) {
            assert.isTrue(actualGlobal instanceof expectGlobals[i].instanceof);
            if (expectGlobals[i].ref === null) {
                const refValue = (actualGlobal as GlobalRef).getRef();
                assert.isNull(refValue);
            } else if (expectGlobals[i].ref !== undefined && expectGlobals[i].instanceof === GlobalRef) {
                const refValue = (actualGlobal as GlobalRef).getRef();
                assert.isNotNull(refValue);
                assertGlobalRefEqual(refValue!, expectGlobals[i].ref);
            }
        }
        if (expectGlobals[i].type !== undefined) {
            assert.equal(actualGlobal!.getType().toString(), expectGlobals[i].type);
        }
        if (expectGlobals[i].usedStmts !== undefined) {
            if (actualGlobal instanceof GlobalRef) {
                assertStmtsEqual(actualGlobal!.getUsedStmts(), expectGlobals[i].usedStmts);
            }
        }
    }
}

function assertGlobalRefEqual(refValue: Value, expectedRef: any): void {
    if (expectedRef.type !== undefined) {
        assert.equal(refValue.getType().toString(), expectedRef.type);
    }
    if (expectedRef.instanceof !== undefined) {
        assert.isTrue(refValue instanceof expectedRef.instanceof);
        if (expectedRef.instanceof === ArkStaticFieldRef) {
            const fieldSignature = (refValue as ArkStaticFieldRef).getFieldSignature();
            if (expectedRef.fieldName !== undefined) {
                assert.equal(fieldSignature.getFieldName(), expectedRef.fieldName);
            }
            if (expectedRef.declaringSignature !== undefined) {
                assert.equal(fieldSignature.getDeclaringSignature().toString(), expectedRef.declaringSignature);
            }
        }
    }
}

function assertMethodBodyEqual(method: ArkMethod, expectBodyDefined: boolean, expectMethod?: any): void {
    const body = method.getBody();
    if (!expectBodyDefined) {
        assert.isUndefined(body);
        return;
    }
    assert.isDefined(expectMethod);
    if (expectMethod.body !== undefined) {
        assert.isDefined(body);
        if (expectMethod.body.locals !== undefined) {
            assertLocalsEqual(body!.getLocals(), expectMethod.body.locals);
        }
        assertGlobalsEqual(body!.getUsedGlobals(), expectMethod.body.globals);
        if (expectMethod.body.stmts !== undefined) {
            assertStmtsEqual(body!.getCfg().getStmts(), expectMethod.body.stmts);
        }
    }
}

function assertMethodBodyBuilderEqual(method: ArkMethod, expectedBodyBuilder: any): void {
    const bodyBuilder = method.getBodyBuilder();
    if (expectedBodyBuilder === undefined) {
        assert.isUndefined(bodyBuilder);
    } else {
        assert.isDefined(bodyBuilder);
    }
}

function assertParamsEqual(actualParams: MethodParameter[], expectedParams: any): void {
    if (expectedParams !== undefined) {
        assert.equal(actualParams.length, expectedParams.length);
        for (let i = 0; i < expectedParams.length; i++) {
            assert.equal(actualParams[i].getName(), expectedParams[i].name);
            assert.equal(actualParams[i].getType().getTypeString(), expectedParams[i].type);
        }
    }
}

function assertMethodSignatureEqual(method: ArkMethod, expectMethod?: any): void {
    const declareSignatures = method.getDeclareSignatures();
    const expectDeclareSignatures = expectMethod.methodDeclareSignatures;
    if (expectDeclareSignatures === null) {
        assert.isNull(declareSignatures);
    } else if (expectDeclareSignatures !== undefined) {
        assert.isNotNull(declareSignatures);
        assert.equal(declareSignatures?.length, expectDeclareSignatures.length);
        let index = 0;
        for (let signature of declareSignatures!) {
            assert.equal(signature.toString(), expectDeclareSignatures[index].toString);
            const expectDeclareSubSignatures = expectDeclareSignatures[index].methodSubSignature;
            index++;
            if (expectDeclareSubSignatures === undefined) {
                continue;
            }
            if (expectDeclareSubSignatures.returnType !== undefined) {
                assert.equal(signature.getType().toString(), expectDeclareSubSignatures.returnType);
            }
            if (expectDeclareSubSignatures.parameters !== undefined) {
                assertParamsEqual(signature.getMethodSubSignature().getParameters(), expectDeclareSubSignatures.parameters);
            }
        }
    }

    const implementationSignature = method.getImplementationSignature();
    const expectImplSignature = expectMethod.methodSignature;
    if (expectImplSignature !== undefined && expectImplSignature !== null) {
        assert.isNotNull(implementationSignature);
        assert.equal(implementationSignature!.toString(), expectImplSignature.toString);
        const expectImplSubSignature = expectImplSignature.methodSubSignature;
        if (expectImplSubSignature !== undefined) {
            if (expectImplSubSignature.returnType !== undefined) {
                assert.equal(implementationSignature!.getType().toString(), expectImplSubSignature.returnType);
            }
            if (expectImplSubSignature.parameters !== undefined) {
                assertParamsEqual(implementationSignature!.getMethodSubSignature().getParameters(), expectImplSubSignature.parameters);
            }
        }
    }
}

function assertOuterMethodEqual(method: ArkMethod, outerMethod: any): void {
    if (outerMethod === undefined || outerMethod === null || outerMethod.toString === undefined) {
        assert.isUndefined(method.getOuterMethod());
        return;
    }
    assert.equal(method.getOuterMethod()?.getSignature().toString(), outerMethod.toString);
}

function testMethodClosure(arkMethod: ArkMethod, expectMethod: any): void {
    assertOuterMethodEqual(arkMethod, expectMethod.outerMethod);
    assertMethodSignatureEqual(arkMethod, expectMethod);
    assertMethodBodyEqual(arkMethod, true, expectMethod);
    assertMethodBodyBuilderEqual(arkMethod, expectMethod.bodyBuilder);
}

function printFileIR(arkFile: ArkFile): string {
    const printer = new ArkIRFilePrinter(arkFile);
    return printer.dump();
}

describe('expression Test', () => {
    const scene = buildScene(path.join(BASE_DIR, 'expression'));

    it('test binary expression', async () => {
        testMethodStmts(scene, 'BinaryExpressionTest.ts', BinaryExpression_Expect_IR.stmts);
    });

    it('test unary expression', async () => {
        testMethodStmts(scene, 'UnaryExpressionTest.ts', UnaryExpression_Expect_IR.stmts);
    });

    it('test new expression', async () => {
        testMethodStmts(scene, 'NewExpressionTest.ts', NewExpression_Expect_IR.stmts);
    });

    it('test literal expression', async () => {
        testMethodStmts(scene, 'LiteralExpressionTest.ts', LiteralExpression_Expect_IR.stmts);
    });

    it('test operator', async () => {
        testMethodStmts(scene, 'OperatorTest.ts', Operator_Expect_IR.stmts);
    });

    it('test call expression', async () => {
        testMethodStmts(scene, 'CallExpressionTest.ts', CallExpression_Expect_IR.stmts);
    });

    it('test expression statement', async () => {
        testMethodStmts(scene, 'ExpressionStatementsTest.ts', ExpressionStatements_Expect_IR.stmts);
    });

    it('test postfix and prefix unary expression', async () => {
        const file = scene.getFiles().find((file) => file.getName().endsWith('PostfixAndPrefixUnaryExpression.ts'));
        assert.isDefined(file);
        assert.equal(printFileIR(file!), PostfixAndPrefixUnaryExpression_Expected_IR);
    });

    it('test ptr invoke expression', async () => {
        testMethodIR(scene, 'CallExpressionTest.ts', DEFAULT_ARK_CLASS_NAME, 'returnFunc1',
            PTR_INVOKE_EXPRESSION_RETURNFUNC1_EXPECT_IR);
        testMethodIR(scene, 'CallExpressionTest.ts', DEFAULT_ARK_CLASS_NAME, 'callFuncReturned',
            PTR_INVOKE_EXPRESSION_CALLFUNCRETURNED_EXPECT_IR);
        testMethodIR(scene, 'CallExpressionTest.ts', DEFAULT_ARK_CLASS_NAME, '%AM5$promiseCall',
            PTR_INVOKE_EXPRESSION_AM4$PROMISECALL_EXPECT_IR);
    });

    it('test spread syntax', async () => {
        testMethodIR(scene, 'Spread.ts', DEFAULT_ARK_CLASS_NAME, 'spreadArray1', SPREAD_ARRAY1_EXPECT_IR);
        testMethodIR(scene, 'Spread.ts', DEFAULT_ARK_CLASS_NAME, 'spreadArray2', SPREAD_ARRAY2_EXPECT_IR);
        testMethodIR(scene, 'Spread.ts', DEFAULT_ARK_CLASS_NAME, 'spreadArray3', SPREAD_ARRAY3_EXPECT_IR);
        testMethodIR(scene, 'Spread.ts', DEFAULT_ARK_CLASS_NAME, 'spreadArray4', SPREAD_ARRAY4_EXPECT_IR);
        testMethodIR(scene, 'Spread.ts', DEFAULT_ARK_CLASS_NAME, 'spreadParameters1', SPREAD_PARAMETERS1_EXPECT_IR);
        testMethodIR(scene, 'Spread.ts', DEFAULT_ARK_CLASS_NAME, 'spreadParameters2', SPREAD_PARAMETERS2_EXPECT_IR);
        testMethodIR(scene, 'Spread.ts', DEFAULT_ARK_CLASS_NAME, 'spreadParameters3', SPREAD_PARAMETERS3_EXPECT_IR);
    });

    it('test rest syntax', async () => {
        testMethodIR(scene, 'Rest.ts', DEFAULT_ARK_CLASS_NAME, 'restElements1', REST_ELEMENTS1_EXPECT_IR);
        testMethodIR(scene, 'Rest.ts', DEFAULT_ARK_CLASS_NAME, 'restElements2', REST_ELEMENTS2_EXPECT_IR);
        testMethodIR(scene, 'Rest.ts', DEFAULT_ARK_CLASS_NAME, 'restElements3', REST_ELEMENTS3_EXPECT_IR);
        testMethodIR(scene, 'Rest.ts', DEFAULT_ARK_CLASS_NAME, 'restParameter', REST_PARAMETERS1_EXPECT_IR);
    });

    it('test assignment', async () => {
        testMethodIR(scene, 'Assignment.ts', DEFAULT_ARK_CLASS_NAME, 'additiveCompoundAssignment',
            ASSIGNMENT_EXPECT_IR);
    });

    it('test destructuring', async () => {
        testMethodIR(scene, 'Destructuring.ts', DEFAULT_ARK_CLASS_NAME, 'destructuring1', DESTRUCTURING1_EXPECT_IR);
        testMethodIR(scene, 'Destructuring.ts', DEFAULT_ARK_CLASS_NAME, 'destructuring2', DESTRUCTURING2_EXPECT_IR);
        testMethodIR(scene, 'Destructuring.ts', DEFAULT_ARK_CLASS_NAME, 'destructuring3', DESTRUCTURING3_EXPECT_IR);
    });

    it('test increment expression', async () => {
        testMethodIR(scene, 'IncrementExpressionTest.ts', DEFAULT_ARK_CLASS_NAME, 'incrementExpression', INCREMENT_EXPECT_IR);
    });
});

describe('assignment Test', () => {
    const scene = buildScene(path.join(BASE_DIR, 'assignment'));

    it('test declaration', async () => {
        testMethodStmts(scene, 'DeclarationTest.ts', Declaration_Expect_IR.stmts);
    });

    it('test compound assignment', async () => {
        testMethodStmts(scene, 'CompoundAssignmentTest.ts', CompoundAssignment_Expect_IR.stmts);
    });

    it('test destructuring', async () => {
        testMethodStmts(scene, 'DestructuringSample.ts', Destructuring_Expect_IR.stmts);
    });
});

describe('loop statement Test', () => {
    const scene = buildScene(path.join(BASE_DIR, 'loopStatement'));

    it('for statement', async () => {
        testBlocks(scene, 'ForStatementSample.ts', 'case1', FOR_STATEMENT_EXPECT_CASE1.blocks);
        testBlocks(scene, 'ForStatementSample.ts', 'case2', FOR_STATEMENT_EXPECT_CASE2.blocks);
        testBlocks(scene, 'ForStatementSample.ts', 'case3', FOR_STATEMENT_EXPECT_CASE3.blocks);
        testBlocks(scene, 'ForStatementSample.ts', 'case4', FOR_STATEMENT_EXPECT_CASE4.blocks);
        testBlocks(scene, 'ForStatementSample.ts', 'case5', FOR_STATEMENT_EXPECT_CASE5.blocks);
        testBlocks(scene, 'ForStatementSample.ts', 'case6', FOR_STATEMENT_EXPECT_CASE6.blocks);
        testBlocks(scene, 'ForStatementSample.ts', 'case7', FOR_STATEMENT_EXPECT_CASE7.blocks);
    });

});

describe('function Test', () => {
    const scene = buildScene(path.join(BASE_DIR, 'function'));

    it('test arrow function', async () => {
        testFileStmts(scene, 'ArrowFunctionTest.ts', ArrowFunction_Expect_IR);
    });

    it('test overload function', async () => {
        testMethodOverload(scene, 'OverloadFunctionTest.ts', 'overloadedFunction1', OverloadMethod_Expect_IR);
    });

    it('test overload class function', async () => {
        testClassMethodOverload(scene, 'OverloadFunctionTest.ts', 'OverloadClass', 'overloadedFunction2', OverloadClassMethod_Expect_IR);
    });

    it('test overload namespace function', async () => {
        testNamespaceMethodOverload(scene, 'OverloadFunctionTest.ts', 'overloadNamespace', 'overloadedFunction3', OverloadNamespaceMethod_Expect_IR);
    });

    it('test overload interface function', async () => {
        testInterfaceMethodOverload(scene, 'OverloadFunctionTest.ts', 'OverloadInterface', 'overloadedFunction4', OverloadInterfaceMethod_Expect_IR);
    });

    it('test no overload function without body', async () => {
        testNoMethodOverload(scene, 'OverloadFunctionTest.ts', 'function5', NoOverloadMethod_Expect_IR);
    });

    it('test no overload function with body', async () => {
        testNoMethodOverloadWithBody(scene, 'OverloadFunctionTest.ts', 'function6', NoOverloadMethodWithBody_Expect_IR);
    });

    it('test no overload function with body 2', async () => {
        testNoMethodOverloadWithBody(scene, 'OverloadFunctionTest.ts', 'function7', NoOverloadMethodWithBody2_Expect_IR);
    });
});

describe('closure Test', () => {
    const scene = buildScene(path.join(BASE_DIR, 'function'));
    const arkFile = scene.getFiles().find((file) => file.getName().endsWith('ClosureParamsTest.ts'));

    it('basic test nested function with no closures', async () => {
        const nestedMethod = arkFile?.getClassWithName('BasicTest')?.getMethods().find((method) => (method.getName() === '%nestedMethod$basicMethod'));
        assert.isDefined(nestedMethod);
        testMethodClosure(nestedMethod as ArkMethod, BasicNestedMethod_Expect_IR);

        const outerMethod = arkFile?.getClassWithName('BasicTest')?.getMethods().find((method) => (method.getName() === 'basicMethod'));
        assert.isDefined(outerMethod);
        testMethodClosure(outerMethod as ArkMethod, BasicOuterMethod_Expect_IR);
    });

    it('basic test independently nested function declaration', async () => {
        const nestedMethod = arkFile?.getClassWithName('BasicTest')?.getMethods().find((method) => (method.getName() === '%basicNestedMethod1$basicOuterMethod1'));
        assert.isDefined(nestedMethod);
        testMethodClosure(nestedMethod as ArkMethod, BasicNestedMethod1_Expect_IR);

        const outerMethod = arkFile?.getClassWithName('BasicTest')?.getMethods().find((method) => (method.getName() === 'basicOuterMethod1'));
        assert.isDefined(outerMethod);
        testMethodClosure(outerMethod as ArkMethod, BasicOuterMethod1_Expect_IR);

        // make sure in nested method, there is only one %closures0 instance
        const nestedStmts = nestedMethod!.getCfg()?.getStmts();
        const closure = ((nestedStmts![0] as ArkAssignStmt).getLeftOp() as Local);
        const closureRefBase = ((nestedStmts![2] as ArkAssignStmt).getRightOp() as ClosureFieldRef).getBase();
        const nestedLocal = nestedMethod!.getBody()?.getLocals().get(closure.getName());
        const outerLocal = outerMethod!.getBody()?.getLocals().get(closure.getName());
        assert.isTrue(closure === closureRefBase);
        assert.isTrue(closure === nestedLocal);
        assert.isTrue(closure !== outerLocal);
    });

    it('basic test anonymous nested function declared in forEach', async () => {
        const nestedMethod = arkFile?.getClassWithName('BasicTest')?.getMethods().find((method) => (method.getName() === '%AM0$basicOuterMethod2'));
        assert.isDefined(nestedMethod);
        testMethodClosure(nestedMethod!, BasicNestedMethod2_Expect_IR);

        const outerMethod = arkFile?.getClassWithName('BasicTest')?.getMethods().find((method) => (method.getName() === 'basicOuterMethod2'));
        assert.isDefined(outerMethod);
        testMethodClosure(outerMethod!, BasicOuterMethod2_Expect_IR);
    });

    it('basic test ptr invoke anonymous nested function', async () => {
        const nestedMethod = arkFile?.getClassWithName('BasicTest')?.getMethods().find((method) => (method.getName() === '%AM1$basicOuterMethod3'));
        assert.isDefined(nestedMethod);
        testMethodClosure(nestedMethod!, BasicNestedMethod3_Expect_IR);

        const outerMethod = arkFile?.getClassWithName('BasicTest')?.getMethods().find((method) => (method.getName() === 'basicOuterMethod3'));
        assert.isDefined(outerMethod);
        testMethodClosure(outerMethod!, BasicOuterMethod3_Expect_IR);
    });

    it('basic test return nested function', async () => {
        const nestedMethod = arkFile?.getDefaultClass().getMethods().find((method) => (method.getName() === '%basicNestedMethod4$basicOuterMethod4'));
        assert.isDefined(nestedMethod);
        testMethodClosure(nestedMethod!, BasicNestedMethod4_Expect_IR);

        const outerMethod = arkFile?.getDefaultClass().getMethods().find((method) => (method.getName() === 'basicOuterMethod4'));
        assert.isDefined(outerMethod);
        testMethodClosure(outerMethod!, BasicOuterMethod4_Expect_IR);

        // TODO: 此处的callMethod(3)应该是ptrInvoke，args需要加入闭包变量，当前错误识别成statcInvoke，args中缺失闭包变量。需类型推导时处理
        const callMethod = arkFile?.getDefaultClass().getMethods().find((method) => (method.getName() === 'callMethod4'));
        assert.isDefined(callMethod);
        testMethodClosure(callMethod!, CallMethod4_Expect_IR);
    });

    it('test closure in function', async () => {
        const methodName = `${NAME_PREFIX}innerFunction1${NAME_DELIMITER}outerFunction1`;
        const arkMethod = arkFile?.getDefaultClass().getMethods().find((method) => (method.getName() === methodName));
        assert.isDefined(arkMethod);
        testMethodClosure(arkMethod as ArkMethod, ClosureFunction_Expect_IR);
    });

    it('test unClosure function', async () => {
        const arkMethod = arkFile?.getDefaultClass().getMethods().find((method) => (method.getName() === 'outerFunction1'));
        assert.isDefined(arkMethod);
        testMethodClosure(arkMethod as ArkMethod, UnClosureFunction_Expect_IR);
    });

    it('test closure in anonymous function', async () => {
        const methodName = `${ANONYMOUS_METHOD_PREFIX}1${NAME_DELIMITER}outerFunction1`;
        const arkMethod = arkFile?.getDefaultClass().getMethods().find((method) => (method.getName() === methodName));
        assert.isDefined(arkMethod);
        testMethodClosure(arkMethod as ArkMethod, ClosureAnonymousFunction_Expect_IR);
    });

    it('test closure in class method', async () => {
        const arkClass = arkFile?.getClasses().find((cls) => (cls.getName() === 'ClosureClass'));
        const methodName = `${NAME_PREFIX}innerFunction2${NAME_DELIMITER}outerFunction2`;
        const arkMethod = arkClass?.getMethods().find((method) => (method.getName() === methodName));
        assert.isDefined(arkMethod);
        testMethodClosure(arkMethod as ArkMethod, ClosureClassMethod_Expect_IR);
    });

    it('test closure in Namespace function', async () => {
        const arkNS = arkFile?.getNamespaces().find((ns) => ns.getName() === 'closureNamespace');
        const methodName = `${NAME_PREFIX}innerFunction3${NAME_DELIMITER}outerFunction3`;
        const arkMethod = arkNS?.getDefaultClass().getMethods().find((method) => (method.getName() === methodName));
        assert.isDefined(arkMethod);
        testMethodClosure(arkMethod as ArkMethod, ClosureNamespaceFunction_Expect_IR);
    });

    it('test closure Namespace Class method', async () => {
        const arkNS = arkFile?.getNamespaces().find((ns) => ns.getName() === 'closureNamespace');
        const methodName = `${NAME_PREFIX}innerFunction3${NAME_DELIMITER}outerFunction3`;
        const arkMethod = arkNS?.getClassWithName('ClosureClass')?.getMethods().find((method) => (method.getName() === methodName));
        assert.isDefined(arkMethod);
        testMethodClosure(arkMethod as ArkMethod, ClosureNamespaceClassMethod_Expect_IR);
    });
});

describe('multiple closure Test', () => {
    const scene = buildScene(path.join(BASE_DIR, 'function'));
    const arkFile = scene.getFiles().find((file) => file.getName().endsWith('ClosureParamsTest.ts'));
    const multipleTestClass = arkFile?.getClassWithName('MultipleNestedTest');

    it('basic test for function declaration', async () => {
        const outerMethod = multipleTestClass?.getMethods().find((method) => (method.getName() === 'outerMethod1'));
        assert.isDefined(outerMethod);
        testMethodClosure(outerMethod!, MultipleOuterMethod1_Expect_IR);

        const nested1Method = multipleTestClass?.getMethods().find((method) => (method.getName() === '%nested1Method1$outerMethod1'));
        assert.isDefined(nested1Method);
        testMethodClosure(nested1Method!, MultipleNested1Method1_Expect_IR);

        const nested2Method = multipleTestClass?.getMethods().find((method) => (method.getName() === '%nested2Method1$%nested1Method1$outerMethod1'));
        assert.isDefined(nested2Method);
        testMethodClosure(nested2Method!, MultipleNested2Method1_Expect_IR);

        const nested3Method = multipleTestClass?.getMethods().find((method) => (method.getName() === '%nested3Method1$%nested2Method1$%nested1Method1$outerMethod1'));
        assert.isDefined(nested3Method);
        testMethodClosure(nested3Method!, MultipleNested3Method1_Expect_IR);

        const nested11Method = multipleTestClass?.getMethods().find((method) => (method.getName() === '%nested11Method1$outerMethod1'));
        assert.isDefined(nested11Method);
        testMethodClosure(nested11Method!, MultipleNested11Method1_Expect_IR);

        const nested22Method = multipleTestClass?.getMethods().find((method) => (method.getName() === '%nested22Method1$%nested11Method1$outerMethod1'));
        assert.isDefined(nested22Method);
        testMethodClosure(nested22Method!, MultipleNested22Method1_Expect_IR);

        const nested33Method = multipleTestClass?.getMethods().find((method) => (method.getName() === '%nested33Method1$%nested11Method1$outerMethod1'));
        assert.isDefined(nested33Method);
        testMethodClosure(nested33Method!, MultipleNested33Method1_Expect_IR);

        const nested111Method = multipleTestClass?.getMethods().find((method) => (method.getName() === '%nested111Method1$outerMethod1'));
        assert.isDefined(nested111Method);
        testMethodClosure(nested111Method!, MultipleNested111Method1_Expect_IR);

        const nested222Method = multipleTestClass?.getMethods().find((method) => (method.getName() === '%nested222Method1$%nested111Method1$outerMethod1'));
        assert.isDefined(nested222Method);
        testMethodClosure(nested222Method!, MultipleNested222Method1_Expect_IR);
    });

    it('anonymous nested function declared in forEach', async () => {
        const outerMethod = multipleTestClass?.getMethods().find((method) => (method.getName() === 'outerMethod2'));
        assert.isDefined(outerMethod);
        testMethodClosure(outerMethod!, MultipleOuterMethod2_Expect_IR);

        const anonymousMethod1 = multipleTestClass?.getMethods().find((method) => (method.getName() === '%AM1$outerMethod2'));
        assert.isDefined(anonymousMethod1);
        testMethodClosure(anonymousMethod1!, MultipleAnonymousMethod1_Expect_IR);

        const anonymousMethod2 = multipleTestClass?.getMethods().find((method) => (method.getName() === '%AM2$%AM1$outerMethod2'));
        assert.isDefined(anonymousMethod2);
        testMethodClosure(anonymousMethod2!, MultipleAnonymousMethod2_Expect_IR);
    });

    it('ptr invoke anonymous nested function', async () => {
        const outerMethod = multipleTestClass?.getMethods().find((method) => (method.getName() === 'outerMethod3'));
        assert.isDefined(outerMethod);
        testMethodClosure(outerMethod!, MultipleOuterMethod3_Expect_IR);

        const anonymousMethod3 = multipleTestClass?.getMethods().find((method) => (method.getName() === '%AM3$outerMethod3'));
        assert.isDefined(anonymousMethod3);
        testMethodClosure(anonymousMethod3!, MultipleAnonymousMethod3_Expect_IR);

        const anonymousMethod4 = multipleTestClass?.getMethods().find((method) => (method.getName() === '%AM4$%AM3$outerMethod3'));
        assert.isDefined(anonymousMethod4);
        testMethodClosure(anonymousMethod4!, MultipleAnonymousMethod4_Expect_IR);
    });

    it('return nested function', async () => {
        const outerMethod = multipleTestClass?.getMethods().find((method) => (method.getName() === 'outerMethod4'));
        assert.isDefined(outerMethod);
        testMethodClosure(outerMethod!, MultipleOuterMethod4_Expect_IR);

        const nestedMethod4 = multipleTestClass?.getMethods().find((method) => (method.getName() === '%nestedMethod4$outerMethod4'));
        assert.isDefined(nestedMethod4);
        testMethodClosure(nestedMethod4!, MultipleNestedMethod4_Expect_IR);

        const nestedInNestedMethod4 = multipleTestClass?.getMethods().find((method) => (method.getName() === '%nestedInNestedMethod4$%nestedMethod4$outerMethod4'));
        assert.isDefined(nestedInNestedMethod4);
        testMethodClosure(nestedInNestedMethod4!, MultipleNestedInNestedMethod4_Expect_IR);

        const callMethod = multipleTestClass?.getMethods().find((method) => (method.getName() === 'callMethod4'));
        assert.isDefined(callMethod);
        testMethodClosure(callMethod!, MultipleCallMethod4_Expect_IR);
    });
});

describe('closure in anonymous class Test', () => {
    const scene = buildScene(path.join(BASE_DIR, 'function'));
    const arkFile = scene.getFiles().find((file) => file.getName().endsWith('ClosureParamsTest.ts'));

    it('create anonymous class in anonymous function', async () => {
        const method = arkFile?.getClassWithName('%AC1$ClosureInClass.%AM0$%statInit')?.getInstanceInitMethod();
        assert.isDefined(method);
        const stmt = method?.getCfg()?.getStmts()[1];
        assert.isDefined(stmt);
        assert.isTrue(((stmt! as ArkAssignStmt).getRightOp() as ArkInstanceFieldRef).getType() instanceof NumberType);
    });

    it('create anonymous class in class method', async () => {
        const method = arkFile?.getClassWithName('%AC0$ClosureInClass.goo')?.getInstanceInitMethod();
        assert.isDefined(method);
        const stmt = method?.getCfg()?.getStmts()[1];
        assert.isDefined(stmt);
        assert.isTrue(((stmt! as ArkAssignStmt).getRightOp() as ArkInstanceFieldRef).getType() instanceof NumberType);
    });
});