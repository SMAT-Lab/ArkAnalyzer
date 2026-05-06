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

import {
    BasicBlock,
    FileUtils,
    Scene,
    SceneConfig,
    ArkNamespace,
    LEXICAL_ENV_NAME_PREFIX,
    LexicalEnvType,
    getCxxSourceFileExtensions,
} from '../../../../src';
import { Language } from '../../../../src/core/model/ArkFile';
import { ModifierType } from '../../../../src/core/model/ArkBaseModel';
import { assert, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
    assertClassBlocksEqual,
    testBlocks,
    testBlocksWithSignature,
    testBlocksClass,
    assertBlocksEqual,
} from '../../common';
import { ensureCompileDb, resolveSdkPaths } from '../cppBuildUtils';

// ---- Cfg test expect data imports ----
import * as CONDITION_EXPECT from '../../../cppResources/cfg/conditionalOperator';
import * as IF_EXPECT from '../../../cppResources/cfg/if/ifSampleExpects';
import * as SWITCH_EXPECT from '../../../cppResources/cfg/switch/switchSampleExpects';
import * as LOOP_EXPECT from '../../../cppResources/cfg/loop/loopSampleExpects';
import * as GOTO_EXPECT from '../../../cppResources/cfg/goto/gotoSampleExpects';
import * as BINARY_CONDITIONAL_EXPECT
    from '../../../cppResources/cfg/binaryConditional/binaryConditionalSampleExpects';
import * as POINTER_EXPECT from '../../../cppResources/cfg/pointer/pointerExprExpects';
import * as REFERENCE_EXPECT from '../../../cppResources/cfg/reference/referenceExpects';
import * as DATA_STRUCT_EXPECT from '../../../cppResources/cfg/dataStruct/dataStructExpects';
import * as COMPOUND_LITERAL_EXPECT from '../../../cppResources/cfg/compoundLiteral/compoundLiteralExprExpects';
import * as TEMPLATE_EXPECT from '../../../cppResources/cfg/template/templateExpects';
import * as OPERATOR_EXPECT from '../../../cppResources/cfg/operators/cppOperatorExpects';
import * as LAMBDA_EXPECT from '../../../cppResources/cfg/lambdaFunc/lambdaFuncExpects';
import * as THROW_EXPECT from '../../../cppResources/cfg/throw/throwExpects';
import * as CAST_EXPECT from '../../../cppResources/cfg/cast/castSampleExpects';
import * as NULLSTMT_EXPECT from '../../../cppResources/cfg/nullStmt/nullStmtExpects';
import * as BUILT_IN_EXPECT from '../../../cppResources/cfg/builtInAndSTLFunc/builtInAndSTLFunctionExpects';
import * as DERIVED_DATA_TYPE_EXPECT from '../../../cppResources/cfg/derivedDataType/derivedDataTypeExpects';
import * as DELETE_EXPECT from '../../../cppResources/cfg/delete/deleteExprExpects';
import * as IOSTREAM_EXPECT from '../../../cppResources/cfg/iostream/iostreamExpects';
import * as NULLPTR_EXPECT from '../../../cppResources/cfg/nullPtr/nullPtrSampleExpects';
import * as BASE_DATA_TYPE_EXPECT from '../../../cppResources/cfg/baseDataType/baseDataTypeExpects';
import * as WHILE_CONTINUE_EXPECT from '../../../cppResources/cfg/whileContinue/whileContinueSampleExpects';
import * as CLASS_EXPECT from '../../../cppResources/cfg/class/classExpect';
import * as LAZY_IMPORT_EXPECT1 from '../../../cppResources/cfg/lazyImport/lazyImportCase1/lazyImportCase1Expect';
import * as LAZY_IMPORT_EXPECT2 from '../../../cppResources/cfg/lazyImport/lazyImportCase2';
import * as LAZY_IMPORT_EXPECT3 from '../../../cppResources/cfg/lazyImport/lazyImportCase3';
import * as LAZY_IMPORT_EXPECT4 from '../../../cppResources/cfg/lazyImport/lazyImportCase4';
import * as LAZY_IMPORT_EXPECT5 from '../../../cppResources/cfg/lazyImport/lazyImportCase5';
import * as LAZY_IMPORT_EXPECT6 from '../../../cppResources/cfg/lazyImport/lazyImportCase6';
import * as LAZY_IMPORT_EXPECT7 from '../../../cppResources/cfg/lazyImport/lazyImportCase7';
import * as LAZY_IMPORT_EXPECT8 from '../../../cppResources/cfg/lazyImport/lazyImportCase8';
import * as NAMESPACE_EXPECT from '../../../cppResources/cfg/namespace';
import * as OVERLOAD from '../../../cppResources/cfg/overload/overloadExpect';
import * as USING_EXPECT from '../../../cppResources/cfg/using/usingExpects';
import * as TYPEDEF_EXPECT from '../../../cppResources/cfg/typedef/typdefExpects';
import * as THREAD_EXPECT from '../../../cppResources/cfg/thread/threadExpects';
import * as FUNCPTR_EXPECT from '../../../cppResources/cfg/functionPointer/functionPointerExpts';
import * as AUTO_EXPECT from '../../../cppResources/cfg/decltype/decltypeExpects';
import * as INCLUDE_IN_SCOPE from '../../../cppResources/cfg/includeInScope/includeInFunctionExpects';
import * as STRUCTBINDING from '../../../cppResources/cfg/structBinding/structBindingExpect';
import * as CALLEXPR_EXPECT from '../../../cppResources/cfg/call/callExpect';
import * as MALLOC_EXPECT from '../../../cppResources/cfg/malloc/mallocSampleExpects';
import * as INITIALZERLIST from '../../../cppResources/cfg/stdInitializerListExpr/initializerListExpects';
import * as SUPPLEMENTARY from '../../../cppResources/cfg/supplementary/supplementary';
import * as TRAP from '../../../cppResources/cfg/trap/cxxTrapExpects';
import * as OVERWRITE from '../../../cppResources/cfg/overwrite/overwriteExpect';

// ---- SDK paths and constants ----
const { cxxIncludeDir, sysrootIncludeDir, configSiteDirs } = resolveSdkPaths();
const isWin32 = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const BASE_DIR = 'tests/cppResources/cfg';

// ---- Build helpers ----

function buildScene(folderName: string): Scene {
    vi.spyOn(FileUtils, 'getFileLanguage').mockReturnValue(Language.CXX);
    vi.spyOn(Scene.prototype, 'getSdkGlobal').mockReturnValue(null);
    const config = new SceneConfig({ supportFileExts: [...getCxxSourceFileExtensions()] });
    const includeDirs: string[] = [cxxIncludeDir, ...configSiteDirs];
    if (folderName.includes('lazyImport')) {
        includeDirs.push(...getNapiIncludeDirs());
    }
    const projectDir = path.resolve(__dirname, '../../../cppResources/cfg', folderName);
    const cmakeListsPath = path.join(projectDir, 'CMakeLists.txt');
    if (process.env.OHOS_SDK_HOME && fs.existsSync(cmakeListsPath)) {
        const buildDir = path.resolve(__dirname, '../../../../output/cppResources/cfg', folderName, 'build-ohos-db');
        ensureCompileDb(projectDir, buildDir);
        config.setCcjsonPath(path.join(buildDir, 'compile_commands.json'));
    }
    config.buildFromProjectDir(path.join(BASE_DIR, folderName), includeDirs);
    const scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    return scene;
}

function getNapiIncludeDirs(): string[] {
    return [
        path.join(sysrootIncludeDir, 'x86_64-linux-ohos'),
        sysrootIncludeDir,
    ];
}

// ---- Test helpers ----

function testNamespaceClasses(scene: Scene, filePath: string, namespaceName: string, expectIR: any, namespace?: ArkNamespace): void {
    const arkFile = scene.getFiles().find(file => file.getName().endsWith(filePath));
    const arkNamespace = namespace ? namespace : arkFile?.getNamespaces().find(ns => ns.getName() === namespaceName);

    if (!arkNamespace) {
        throw new Error(`Namespace ${namespaceName} not found in file ${filePath}`);
    }

    const namespaceClassBlockMap = new Map<string, any>();
    for (const classBlock of expectIR.classBlocks) {
        namespaceClassBlockMap.set(classBlock.className, classBlock);
    }
    testClassInNamespace(arkNamespace, namespaceClassBlockMap);

    const nestedNamspaceBlockMap = new Map<string, any>();
    for (const nsBlock of expectIR.nestedNamespaces) {
        nestedNamspaceBlockMap.set(nsBlock.namespaceName, nsBlock);
    }
    arkNamespace.getNamespaces().forEach(ns => {
        const nsName = ns.getName();
        testNamespaceClasses(scene, filePath, nsName, nestedNamspaceBlockMap.get(nsName), ns);
    });
}

function testClassInNamespace(ns: ArkNamespace, nsExpectClassMap: Map<string, any>): void {
    ns.getClasses().forEach(arkClass => {
        const expectedClassData = nsExpectClassMap.get(arkClass.getName());
        if (!expectedClassData) {
            throw new Error(`Expected class data for ${arkClass.getName()} not found`);
        }
        const heritageClasses = new Set<string>();
        arkClass.getAllHeritageClasses()?.forEach(heritageClass => {
            heritageClasses.add(heritageClass.getName());
        });
        expect(heritageClasses).toEqual(new Set(expectedClassData.heritageClasses));

        const fieldOfClass = new Set<string>();
        arkClass.getFields()?.forEach(field => {
            fieldOfClass.add(field.getName());
        });
        expect(fieldOfClass).toEqual(new Set(expectedClassData.fields));

        const classBlockMap = new Map<string, BasicBlock[]>();
        for (const block of expectedClassData.blocks) {
            classBlockMap.set(block.methodName, block.blocks);
        }

        arkClass.getMethods().forEach(method => {
            const classBlock = classBlockMap.get(method.getName());
            if (classBlock) {
                assertClassBlocksEqual(method, classBlock);
            }
        });
    });
}

function testLambdaFunction(scene: Scene, filePath: string, methodName: string, expectIR: any): void {
    const arkFile = scene.getFiles().find((file) => file.getName().endsWith(filePath));
    const arkMethod = arkFile?.getDefaultClass().getMethods()
        .find((method) => (method.getName() === methodName));

    const blocks = arkMethod?.getCfg()?.getBlocks();
    if (!blocks) {
        assert.isDefined(blocks);
        return;
    }
    const stmtsLength = arkMethod?.getCfg()?.getStmts().length;
    const stmtToBlockLength = arkMethod?.getCfg()?.getStmtToBlock().size;
    assert(stmtsLength === stmtToBlockLength);
    assertBlocksEqual(blocks, expectIR.blocks);

    expect(arkMethod?.getOuterMethod()?.getSignature().toString()).toEqual(expectIR.outerFunctionSignature);

    const locals = arkMethod?.getBody()?.getLocals();
    if (!locals) {
        assert.isDefined(locals);
        return;
    }
    const closureLocalPair = Array.from(locals).find(
        ([key, value]) => key.startsWith(LEXICAL_ENV_NAME_PREFIX) && value.getType() instanceof LexicalEnvType);
    if (!closureLocalPair) {
        return;
    }
    const [_, closureLocal] = closureLocalPair;
    const closures = new Set((closureLocal.getType() as LexicalEnvType).getClosures().map(c => c.getName()));
    expect(closures).toEqual(new Set(expectIR.closures));

    const genericTypes = arkMethod?.getGenericTypes() ?? [];
    const genericTypesName = new Set(genericTypes.map(t => t.getName()));
    expect(genericTypesName).toEqual(new Set(expectIR.genericTypes));
}

// ================================================================
// Test suites
// ================================================================

describe('CfgTest', () => {
    it('case1: conditional operator', () => {
        const scene = buildScene('conditionalOperator');
        testBlocks(scene, 'conditionalOperator.cpp', 'Case1', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE1.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'Case2', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE2.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'Case3', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE3.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'Case4', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE4.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'Case5', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE5.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'Case6', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE6.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'main', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_MAIN.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'TernaryWithLogicalOperators', CONDITION_EXPECT.CONDITIONAL_WITH_LOGICAL_EXPECT.blocks);
    });
    it('case2: if statement', () => {
        const scene = buildScene('if');
        testBlocks(scene, 'ifSample.cpp', 'Case1', IF_EXPECT.IF_EXPECT_CASE1.blocks);
        testBlocks(scene, 'ifSample.cpp', 'Case2', IF_EXPECT.IF_EXPECT_CASE2.blocks);
        testBlocks(scene, 'ifSample.cpp', 'Case3', IF_EXPECT.IF_EXPECT_CASE3.blocks);
        testBlocks(scene, 'ifSample.cpp', 'Case4', IF_EXPECT.IF_EXPECT_CASE4.blocks);
        testBlocks(scene, 'ifSample.cpp', 'Case5', IF_EXPECT.IF_EXPECT_CASE5.blocks);
        testBlocks(scene, 'ifSample.cpp', 'Case6', IF_EXPECT.IF_EXPECT_CASE6.blocks);
        testBlocks(scene, 'ifSample.cpp', 'Case7', IF_EXPECT.IF_EXPECT_CASE7.blocks);
        testBlocks(scene, 'ifSample.cpp', 'Case8', IF_EXPECT.IF_EXPECT_CASE8.blocks);
        testBlocks(scene, 'ifSample.cpp', 'Case9', IF_EXPECT.IF_EXPECT_CASE9.blocks);
        testBlocks(scene, 'ifSample.cpp', 'Case10', IF_EXPECT.IF_EXPECT_CASE10.blocks);
        testBlocks(scene, 'ifSample.cpp', 'Case11', IF_EXPECT.IF_EXPECT_CASE11.blocks);
    });

    it('case3: switch statement', () => {
        const scene = buildScene('switch');
        scene.inferTypes();
        testBlocks(scene, 'switchSample.cpp', 'Case1', SWITCH_EXPECT.SWITCH_EXPECT_CASE1.blocks);
        testBlocks(scene, 'switchSample.cpp', 'Case2', SWITCH_EXPECT.SWITCH_EXPECT_CASE2.blocks);
        testBlocks(scene, 'switchSample.cpp', 'Case3', SWITCH_EXPECT.SWITCH_EXPECT_CASE3.blocks);
        testBlocks(scene, 'switchSample.cpp', 'Case4', SWITCH_EXPECT.SWITCH_EXPECT_CASE4.blocks);
        testBlocks(scene, 'switchSample.cpp', 'Case5', SWITCH_EXPECT.SWITCH_EXPECT_CASE5.blocks);
        testBlocks(scene, 'switchSample.cpp', 'Case6', SWITCH_EXPECT.SWITCH_EXPECT_CASE6.blocks);
        testBlocks(scene, 'switchSample.cpp', 'Case7', SWITCH_EXPECT.SWITCH_EXPECT_CASE7.blocks);
        testBlocks(scene, 'switchSample.cpp', 'Case8', SWITCH_EXPECT.SWITCH_EXPECT_CASE8.blocks);
        testBlocks(scene, 'switchSample.cpp', 'Case9', SWITCH_EXPECT.SWITCH_EXPECT_CASE9.blocks);
        testBlocks(scene, 'switchSample.cpp', 'Case10', SWITCH_EXPECT.SWITCH_EXPECT_CASE10.blocks);
        testBlocks(scene, 'switchSample.cpp', 'Case11', SWITCH_EXPECT.SWITCH_EXPECT_CASE11.blocks);
        testBlocks(scene, 'switchSample.cpp', 'Case12', SWITCH_EXPECT.SWITCH_EXPECT_CASE12.blocks);
        testBlocks(scene, 'switchSample.cpp', 'Case13', SWITCH_EXPECT.SWITCH_EXPECT_CASE13.blocks);
        testBlocks(scene, 'switchSample.cpp', 'HandleGameSelection', SWITCH_EXPECT.SWITCH_EXPECT_NEST.blocks);
        testBlocks(scene, 'switchSample.cpp', 'ProcessChoice', SWITCH_EXPECT.SWITCH_EXPECT_PROCESS_CHOICE.blocks);
        testBlocks(scene, 'switchSample.cpp', 'ProcessValue', SWITCH_EXPECT.SWITCH_EXPECT_PROCESS_VALUE.blocks);
        testBlocks(scene, 'switchSample.cpp', 'TestConstexprSwitch', SWITCH_EXPECT.SWITCH_EXPECT_TEST_CONST.blocks);
        testBlocks(scene, 'switchSample.cpp', 'CaseWithInit', SWITCH_EXPECT.SWITCH_EXPECT_WITH_INIT.blocks);
    });

    it('case4: loop statement', () => {
        const scene = buildScene('loop');
        testBlocks(scene, 'loopSample.cpp', 'Case1', LOOP_EXPECT.LOOP_EXPECT_CASE1.blocks);
        testBlocks(scene, 'loopSample.cpp', 'Case2', LOOP_EXPECT.LOOP_EXPECT_CASE2.blocks);
        testBlocks(scene, 'loopSample.cpp', 'Case3', LOOP_EXPECT.LOOP_EXPECT_CASE3.blocks);
        testBlocks(scene, 'loopSample.cpp', 'Case4', LOOP_EXPECT.LOOP_EXPECT_CASE4.blocks);
        testBlocks(scene, 'loopSample.cpp', 'Case5', LOOP_EXPECT.LOOP_EXPECT_CASE5.blocks);
        testBlocks(scene, 'loopSample.cpp', 'Case6', LOOP_EXPECT.LOOP_EXPECT_CASE6.blocks);
        testBlocks(scene, 'loopSample.cpp', 'Case7', LOOP_EXPECT.LOOP_EXPECT_CASE7.blocks);
        testBlocks(scene, 'loopSample.cpp', 'Case8', LOOP_EXPECT.LOOP_EXPECT_CASE8.blocks);
        testBlocks(scene, 'loopSample.cpp', 'Case9', LOOP_EXPECT.LOOP_EXPECT_CASE9.blocks);
        testBlocks(scene, 'loopSample.cpp', 'Case10', LOOP_EXPECT.LOOP_EXPECT_CASE10.blocks);
        testBlocks(scene, 'loopSample.cpp', 'Case11', LOOP_EXPECT.LOOP_EXPECT_CASE11.blocks);
        testBlocks(scene, 'loopSample.cpp', 'ForWithLogicalOperators', LOOP_EXPECT.LOOP_EXPECT_CASE12.blocks);
        testBlocks(scene, 'loopSample.cpp', 'NestedLoopExample', LOOP_EXPECT.LOOP_EXPECT_CASE13.blocks);
        testBlocks(scene, 'loopSample.cpp', 'CaseForCondDeclBoolCompare', LOOP_EXPECT.LOOP_EXPECT_CASE14.blocks);
    });
    it('case5: while-continue statement', () => {
        const scene = buildScene('whileContinue');
        testBlocks(scene, 'whileContinueSample.cpp', 'main', WHILE_CONTINUE_EXPECT.WHILE_CONTINUE_EXPECT_MAIN.blocks);
        testBlocks(scene, 'whileContinueSample.cpp', 'DoStmtFunc', WHILE_CONTINUE_EXPECT.DO_WHILE_STMT.blocks);
        testBlocks(scene, 'whileContinueSample.cpp', 'CommaExprFunc', WHILE_CONTINUE_EXPECT.COMMA_EXPRESSION.blocks);
        testBlocks(scene, 'whileContinueSample.cpp', 'EmptyDoWhile', WHILE_CONTINUE_EXPECT.EMPTY_DO_WHILE.blocks);
        testBlocks(scene, 'whileContinueSample.cpp', 'ContinueDoWhile', WHILE_CONTINUE_EXPECT.CONTINUE_DO_WHILE.blocks);
        testBlocks(scene, 'whileContinueSample.cpp', 'WhileWithLogicalOperators', WHILE_CONTINUE_EXPECT.CONTINUE_WHILE_WITH_LOGICAL_OPERATORS.blocks);
        testBlocks(scene, 'whileContinueSample.cpp', 'DoWhileWithLogicalOperators', WHILE_CONTINUE_EXPECT.CONTINUE_DO_WHILE_WITH_LOGICAL_OPERATORS.blocks);
    });
    it('case6: goto statement', () => {
        const scene = buildScene('goto');
        testBlocks(scene, 'gotoSample.cpp', 'Case1', GOTO_EXPECT.GOTO_EXPECT_CASE1.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'Case2', GOTO_EXPECT.GOTO_EXPECT_CASE2.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'Case3', GOTO_EXPECT.GOTO_EXPECT_CASE3.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'Case4', GOTO_EXPECT.GOTO_EXPECT_CASE4.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'Case5', GOTO_EXPECT.GOTO_EXPECT_CASE5.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'Case6', GOTO_EXPECT.GOTO_EXPECT_CASE6.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'Case7', GOTO_EXPECT.GOTO_EXPECT_CASE7.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'Case8', GOTO_EXPECT.GOTO_EXPECT_CASE8.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'Case9', GOTO_EXPECT.GOTO_EXPECT_CASE9.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'Case10', GOTO_EXPECT.GOTO_EXPECT_CASE10.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'Case11', GOTO_EXPECT.GOTO_EXPECT_CASE11.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'Case12', GOTO_EXPECT.GOTO_EXPECT_CASE12.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'Case13', GOTO_EXPECT.GOTO_EXPECT_CASE13.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'Case14', GOTO_EXPECT.GOTO_EXPECT_CASE14.blocks);
    });
    it('case7: binaryCondition', () => {
        const scene = buildScene('binaryConditional');
        testBlocks(scene, 'binaryConditionalSample.cpp', 'Case1', BINARY_CONDITIONAL_EXPECT.BINARY_CONDITIONAL_EXPECT_CASE1.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'Case2', BINARY_CONDITIONAL_EXPECT.BINARY_CONDITIONAL_EXPECT_CASE2.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'Case3', BINARY_CONDITIONAL_EXPECT.BINARY_CONDITIONAL_EXPECT_CASE3.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'Case4', BINARY_CONDITIONAL_EXPECT.BINARY_CONDITIONAL_EXPECT_CASE4.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'Case5', BINARY_CONDITIONAL_EXPECT.BINARY_CONDITIONAL_EXPECT_CASE5.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'Case6', BINARY_CONDITIONAL_EXPECT.BINARY_CONDITIONAL_EXPECT_CASE6.blocks);
    });
});

describe('Type Test', () => {
    it('case1: base dataType', () => {
        const scene = buildScene('baseDataType');
        testBlocks(scene, 'baseDataType.cpp', 'main', BASE_DATA_TYPE_EXPECT.BASE_DATA_TYPE_EXPECT_MAIN.blocks);
    });
    it('case2: pointer Type', () => {
        const scene = buildScene('pointer');
        testBlocks(scene, 'pointerExpr.cpp', 'PtrType', POINTER_EXPECT.POINTER_EXPECT_CASE1.blocks);
        testBlocks(scene, 'pointerExpr.cpp', 'BasePtrOp', POINTER_EXPECT.POINTER_EXPECT_CASE2.blocks);
        testBlocks(scene, 'pointerExpr.cpp', 'MultiLevelPtrOp', POINTER_EXPECT.POINTER_EXPECT_CASE3.blocks);
        testBlocks(scene, 'pointerExpr.cpp', 'UniquePtrTest', POINTER_EXPECT.POINTER_EXPECT_CASE4.blocks);
        testBlocks(scene, 'pointerExpr.cpp', 'SharedPtrTest', POINTER_EXPECT.POINTER_EXPECT_CASE5.blocks);
        testBlocks(scene, 'pointerExpr.cpp', 'CircularReferenceExample', POINTER_EXPECT.POINTER_EXPECT_CASE6.blocks);
        testBlocksClass(scene, 'pointerExpr.cpp', 'Node', POINTER_EXPECT.POINTER_NODE_CLASS1);
    });
    it('case3: reference Type', () => {
        const scene = buildScene('reference');
        testBlocks(scene, 'reference.cpp', 'BaseLeftRefer', REFERENCE_EXPECT.REFERENCE_EXPECT_CASE1.blocks);
        testBlocks(scene, 'reference.cpp', 'PointRefer', REFERENCE_EXPECT.REFERENCE_EXPECT_CASE2.blocks);
        testBlocks(scene, 'reference.cpp', 'MyClassRefer', REFERENCE_EXPECT.REFERENCE_EXPECT_CASE3.blocks);
        testBlocks(scene, 'reference.cpp', 'BaseRightRefer', REFERENCE_EXPECT.REFERENCE_EXPECT_CASE4.blocks);
        testBlocks(scene, 'reference.cpp', 'Relay', REFERENCE_EXPECT.REFERENCE_EXPECT_CASE5.blocks);
        testBlocks(scene, 'reference.cpp', 'MoveCase', REFERENCE_EXPECT.REFERENCE_EXPECT_CASE6.blocks);
    });
    it('case4: Derived Class', () => {
        const scene = buildScene('derivedDataType');
        testBlocksClass(scene, 'derivedDataType.cpp', 'MyClass', DERIVED_DATA_TYPE_EXPECT.DERIVED_DATA_TYPE_EXPECT_CLASS);
        testBlocksClass(scene, 'derivedDataType.cpp', 'DefaultClass', DERIVED_DATA_TYPE_EXPECT.DERIVED_DATA_TYPE_EXPECT_CLASS2);
        testBlocksClass(scene, 'derivedDataType.cpp', 'MyStruct', DERIVED_DATA_TYPE_EXPECT.DERIVED_DATA_TYPE_EXPECT_STRUCT);
    });
    it('case5: DataStruct Test', () => {
        const scene = buildScene('dataStruct');
        testBlocks(scene, 'dataStruct.cpp', 'VectorTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_VECTOR.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'SetTest',
            isWin32 ? DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_SET.blocks : DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_SET_LINUX.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'MapTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_MAP.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'UnorderedMapTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_MAP2.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'QueueTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_QUEUE.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'DequeTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_DEQUE.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'StackTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_STACK.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'ListTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_LIST.blocks);
    });
    it('case6: NullPtr Test', () => {
        const scene = buildScene('nullPtr');
        testBlocks(scene, 'nullPtrSample.cpp', 'Case1', NULLPTR_EXPECT.NULLPTR_EXPECT_CASE1.blocks);
    });
    it('case7: CompoundLiteral Test', () => {
        const scene = buildScene('compoundLiteral');
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'Case1', COMPOUND_LITERAL_EXPECT.COMPOUND_LITERAL_EXPECT_CASE1.blocks);
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'Case2', COMPOUND_LITERAL_EXPECT.COMPOUND_LITERAL_EXPECT_CASE2.blocks);
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'Case3', COMPOUND_LITERAL_EXPECT.COMPOUND_LITERAL_EXPECT_CASE3.blocks);
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'Case4', COMPOUND_LITERAL_EXPECT.COMPOUND_LITERAL_EXPECT_CASE4.blocks);
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'Case5', COMPOUND_LITERAL_EXPECT.COMPOUND_LITERAL_EXPECT_CASE5.blocks);
    });

    it('case:8 Template Test', () => {
        const scene = buildScene('template');
        testBlocks(scene, 'template.cpp', 'Max1', TEMPLATE_EXPECT.TEMPLATE_EXPECT_CASE1.blocks);
        testBlocks(scene, 'template.cpp', 'Max2', TEMPLATE_EXPECT.TEMPLATE_EXPECT_CASE2.blocks);
        testBlocks(scene, 'template.cpp', 'PrintPair', TEMPLATE_EXPECT.TEMPLATE_EXPECT_CASE3.blocks);
        testBlocksClass(scene, 'template.cpp', 'MyContainer', TEMPLATE_EXPECT.TEMPLATE_MYCONTAINER_CLASS);
        testBlocksClass(scene, 'template.cpp', 'FixedArray', TEMPLATE_EXPECT.TEMPLATE_FIXEDARRAY_CLASS);
        testBlocks(scene, 'template.cpp', 'main', TEMPLATE_EXPECT.TEMPLATE_EXPECT_CASE4.blocks);
        testBlocks(scene, 'template.cpp', 'Sum', TEMPLATE_EXPECT.TEMPLATE_EXPECT_CASE5.blocks);
        testBlocks(scene, 'template.cpp', 'Instantiation3', TEMPLATE_EXPECT.TEMPLATE_EXPECT_CASE6.blocks);
    });
    it('case9: class Test', () => {
        const scene = buildScene('class');
        testBlocksClass(scene, 'classSample.cpp', 'Base', CLASS_EXPECT.BASE_CLASS_EXPECT);
        testBlocksClass(scene, 'classSample.cpp', 'Left', CLASS_EXPECT.LEFT_CLASS_EXPECT);
        testBlocksClass(scene, 'classSample.cpp', 'Right', CLASS_EXPECT.RIGHT_CLASS_EXPECT);
        testBlocksClass(scene, 'classSample.cpp', 'Derived', CLASS_EXPECT.DERIVED_CLASS_EXPECT);
        testBlocksClass(scene, 'classSample.cpp', 'Animal', CLASS_EXPECT.ANIMAL_CLASS_EXPECT);
        testBlocksClass(scene, 'classSample.cpp', 'Cat', CLASS_EXPECT.CAT_CLASS_EXPECT);
        testBlocksClass(scene, 'classSample.cpp', 'Dog', CLASS_EXPECT.DOG_CLASS_EXPECT);
        testBlocksClass(scene, 'classSample.cpp', 'Pig', CLASS_EXPECT.PIG_CLASS_EXPECT);
        testBlocksClass(scene, 'classSample.cpp', 'D', CLASS_EXPECT.D_CLASS_EXPECT);
        testBlocks(scene, 'classSample.cpp', 'main', CLASS_EXPECT.MAIN_EXPECT.blocks);
    });
});
describe('Function Test', () => {
    it('case1: return value', () => {
        const scene = buildScene('operators');
        testBlocks(scene, 'cppOperators.cpp', 'ReturnValue', OPERATOR_EXPECT.OPERATOR_EXPECT_RETURN.blocks);
    });
    it('case2: no return value', () => {
        const scene = buildScene('operators');
        testBlocks(scene, 'cppOperators.cpp', 'NoReturnValue', OPERATOR_EXPECT.OPERATOR_EXPECT_NO_RETURN.blocks);
    });

    it('case3: Lambda Function Test', () => {
        const scene = buildScene('lambdaFunc');
        scene.inferTypes();
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case1', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE1.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case2', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE2.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case3', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE3.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case4', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE4.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case5', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE5.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case6', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE6.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case7', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE7.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case9', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE9.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Apply', LAMBDA_EXPECT.LAMBDA_EXPECT_APPLY.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case10', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE10.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case11', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE11.blocks);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM0$Case1', LAMBDA_EXPECT.LAMBDA_EXPECT_AM0_Case1);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM1$Case2', LAMBDA_EXPECT.LAMBDA_EXPECT_AM1_Case2);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM2$Case2', LAMBDA_EXPECT.LAMBDA_EXPECT_AM2_Case2);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM3$Case3', LAMBDA_EXPECT.LAMBDA_EXPECT_AM3_Case3);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM4$Case4', LAMBDA_EXPECT.LAMBDA_EXPECT_AM4_Case4);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM5$Case5', LAMBDA_EXPECT.LAMBDA_EXPECT_AM5_Case5);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM6$Case5', LAMBDA_EXPECT.LAMBDA_EXPECT_AM6_Case5);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM7$Case5', LAMBDA_EXPECT.LAMBDA_EXPECT_AM7_Case5);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM9$%AM8$Case6', LAMBDA_EXPECT.LAMBDA_EXPECT_AM9_AM8_Case6);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM8$Case6', LAMBDA_EXPECT.LAMBDA_EXPECT_AM8_Case6);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM10$Case7', LAMBDA_EXPECT.LAMBDA_EXPECT_AM10_Case7);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM11$Case8', LAMBDA_EXPECT.LAMBDA_EXPECT_AM11_Case8);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM12$Case9', LAMBDA_EXPECT.LAMBDA_EXPECT_AM12_Case9);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM13$Case9', LAMBDA_EXPECT.LAMBDA_EXPECT_AM13_Case9);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM14$Case10', LAMBDA_EXPECT.LAMBDA_EXPECT_AM14_Case10);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM15$Case11', LAMBDA_EXPECT.LAMBDA_EXPECT_AM15_Case11);
        testLambdaFunction(scene, 'lambdaFuncSample.cpp', '%AM16$Case11', LAMBDA_EXPECT.LAMBDA_EXPECT_AM16_Case11);

        const arkFile = scene.getFiles().find((file) => file.getName().endsWith('lambdaFuncSample.cpp'));
        const arkMethod10 = arkFile?.getDefaultClass().getMethods()
            .find((method) => (method.getName() === '%AM10$Case7'));
        expect(arkMethod10?.getModifiers()).toEqual(ModifierType.MUTABLE);
        const arkMethod11 = arkFile?.getDefaultClass().getMethods()
            .find((method) => (method.getName() === '%AM11$Case8'));
        expect(arkMethod11?.getModifiers()).toEqual(ModifierType.CONSTEXPR);
    });

    it('case4: delete Expression Test', () => {
        const scene = buildScene('delete');
        testBlocks(scene, 'deleteExpr.cpp', 'DelObj', DELETE_EXPECT.DELETE_EXPECT_CASE1.blocks);
        testBlocks(scene, 'deleteExpr.cpp', 'DelArr', DELETE_EXPECT.DELETE_EXPECT_CASE2.blocks);
        testBlocks(scene, 'deleteExpr.cpp', 'DelClassObj', DELETE_EXPECT.DELETE_EXPECT_CASE3.blocks);
        testBlocks(scene, 'deleteExpr.cpp', 'DelMember', DELETE_EXPECT.DELETE_EXPECT_CASE4.blocks);
    });

    it('case5: Overload Test', () => {
        const scene = buildScene('overload');
        scene.inferTypes();
        testBlocksWithSignature(scene, 'overloadSample.cpp', '', 'PrintInfo(int)', OVERLOAD.OVERLOAD_PRINT_INFO_CASE1_EXPECT.blocks);
        testBlocksWithSignature(scene, 'overloadSample.cpp', '', 'PrintInfo(char)', OVERLOAD.OVERLOAD_PRINT_INFO_CASE2_EXPECT.blocks);
        testBlocksWithSignature(scene, 'overloadSample.cpp', '', 'PrintInfo(int, char)', OVERLOAD.OVERLOAD_PRINT_INFO_CASE3_EXPECT.blocks);
        testBlocksClass(scene, 'overloadSample.cpp', 'Person', OVERLOAD.OVERLOAD_CLASS_PERSON_EXPECT, undefined, true);
        testBlocksClass(scene, 'overloadSample.cpp', 'Vector', OVERLOAD.VECTOR_CLASS_EXPECT);
        testBlocks(scene, 'overloadSample.cpp', 'operator<<', OVERLOAD.OVERLOAD_COUT_EXPECT.blocks);
        testBlocks(scene, 'overloadSample.cpp', 'operator>>', OVERLOAD.OVERLOAD_CIN_EXPECT.blocks);
        testBlocks(scene, 'overloadSample.cpp', 'operator""_km', OVERLOAD.OVERLOAD_USER_DEFINED_LITERAL_NUMBER_EXPECT.blocks);
        testBlocks(scene, 'overloadSample.cpp', 'operator""_c', OVERLOAD.OVERLOAD_USER_DEFINED_LITERAL_CHAR_EXPECT.blocks);
        testBlocks(scene, 'overloadSample.cpp', 'main', OVERLOAD.OVERLOAD_MAIN_EXPECT.blocks);
    });

    it('case6: call expr', () => {
        const scene = buildScene('call');
        testBlocks(scene, 'call.cpp', 'Case1', CALLEXPR_EXPECT.CXXMEMBERCALL_EXPECT.blocks);
        testBlocks(scene, 'call.cpp', 'Case2', CALLEXPR_EXPECT.CXXMETHODDEFAULT_CASE2_EXPECT.blocks);
        testBlocks(scene, 'call.cpp', 'Case3', CALLEXPR_EXPECT.CXXMETHODDEFAULT_CASE3_EXPECT.blocks);
    });

    it('case7: overwrite Test', () => {
        const scene = buildScene('overwrite');
        scene.inferTypes();
        testBlocksWithSignature(scene, 'overwriteSample.cpp', 'Calculator', 'Add(int, int)', OVERWRITE.OVERWRITE_PRINT_INFO_CASE1_EXPECT.blocks);
        testBlocksWithSignature(scene, 'overwriteSample.cpp', 'Calculator', 'Add(double, double)', OVERWRITE.OVERWRITE_PRINT_INFO_CASE2_EXPECT.blocks);
        testBlocksWithSignature(scene, 'overwriteSample.cpp', 'Calculator', 'Add(int, int, int)', OVERWRITE.OVERWRITE_PRINT_INFO_CASE3_EXPECT.blocks);
    });
});

describe('Other Test', () => {
    it('case1: arithmetic operator', () => {
        const scene = buildScene('operators');
        testBlocks(scene, 'cppOperators.cpp', 'ArithmeticOperator', OPERATOR_EXPECT.OPERATOR_EXPECT_CASE1.blocks);
        testBlocks(scene, 'cppOperators.cpp', 'RelationOperator', OPERATOR_EXPECT.OPERATOR_EXPECT_CASE2.blocks);
        testBlocks(scene, 'cppOperators.cpp', 'ComponentOperator', OPERATOR_EXPECT.OPERATOR_EXPECT_CASE3.blocks);
        testBlocks(scene, 'cppOperators.cpp', 'BitOperator', OPERATOR_EXPECT.OPERATOR_EXPECT_CASE4.blocks);
        testBlocks(scene, 'cppOperators.cpp', 'OtherOperator', OPERATOR_EXPECT.OPERATOR_EXPECT_CASE5.blocks);
    });
    it('case2: try catch throw', () => {
        const scene = buildScene('throw');
        testBlocks(scene, 'throwSample.cpp', 'Division', THROW_EXPECT.THROW_EXPECT_CASE1.blocks);
        testBlocks(scene, 'throwSample.cpp', 'main', THROW_EXPECT.THROW_EXPECT_CASE2.blocks);
        testBlocks(scene, 'throwSample.cpp', 'TryThrowCase', THROW_EXPECT.THROW_EXPECT_CASE3.blocks);
    });
    it('case3: iostream', () => {
        const scene = buildScene('iostream');
        testBlocks(scene, 'iostreamTest.cpp', 'main', IOSTREAM_EXPECT.IOSTREAM_EXPECT_CASE1.blocks);
    });
    it('case4: Cast Test', () => {
        const scene = buildScene('cast');
        testBlocks(scene, 'castSample.cpp', 'CXXStaticCastTest', CAST_EXPECT.CAST_EXPECT_CASE1.blocks);
        testBlocks(scene, 'castSample.cpp', 'CStyleCastTest', CAST_EXPECT.CAST_EXPECT_CASE2.blocks);
        testBlocks(scene, 'castSample.cpp', 'CXXConstCastTest', CAST_EXPECT.CAST_EXPECT_CASE3.blocks);
        testBlocks(scene, 'castSample.cpp', 'CXXDynamicCastTest', CAST_EXPECT.CAST_EXPECT_CASE4.blocks);
        testBlocks(scene, 'castSample.cpp', 'CXXReinterpretCastTest', CAST_EXPECT.CAST_EXPECT_CASE5.blocks);
        testBlocks(scene, 'castSample.cpp', 'CXXFunctionalCastTest', CAST_EXPECT.CAST_EXPECT_CASE6.blocks);
    });
    it('case5: NullStmt Test', () => {
        const scene = buildScene('nullStmt');
        testBlocks(scene, 'nullStmtSample.cpp', 'Case1', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE1.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'Case2', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE2.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'Case3', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE3.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'Case4', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE4.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'Case5', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE5.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'Case6', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE6.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'Case7', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE7.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'Case8', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE8.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'Case9', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE9.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'Case10', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE10.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'Case11', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE11.blocks);
    });
    it('case6: BuiltInAndSTLFunc Test', () => {
        const scene = buildScene('builtInAndSTLFunc');
        testBlocks(scene, 'builtInAndSTLFunction.cpp', 'CXXTypeidExprTest', BUILT_IN_EXPECT.BUILT_IN_EXPECT_CASE1.blocks);
        testBlocks(scene, 'builtInAndSTLFunction.cpp', 'ArrayTypeTraitTest', BUILT_IN_EXPECT.BUILT_IN_EXPECT_CASE2.blocks);
        testBlocks(scene, 'builtInAndSTLFunction.cpp', 'CXXNoexceptExprTest', BUILT_IN_EXPECT.BUILT_IN_EXPECT_CASE3.blocks);
        testBlocks(scene, 'builtInAndSTLFunction.cpp', 'AtomicExprTest',
            isLinux ? BUILT_IN_EXPECT.BUILT_IN_EXPECT_CASE4_LINUX.blocks : BUILT_IN_EXPECT.BUILT_IN_EXPECT_CASE4.blocks);
    });
    it('case7: malloc Test', () => {
        const scene = buildScene('malloc');
        testBlocks(scene, 'mallocSample.cpp', 'main', MALLOC_EXPECT.MALLOC_EXPECT_CASE1.blocks);
    });
    it('case8: stdInitializerListExpr Test', () => {
        const scene = buildScene('stdInitializerListExpr');
        testBlocks(scene, 'stdInitializerListExpr.cpp', 'Example1', INITIALZERLIST.LIST_EXPECT_EXAMPLE1.blocks);
        testBlocks(scene, 'stdInitializerListExpr.cpp', 'Example2', INITIALZERLIST.LIST_EXPECT_EXAMPLE2.blocks);
        testBlocks(scene, 'stdInitializerListExpr.cpp', 'Example3', INITIALZERLIST.LIST_EXPECT_EXAMPLE3.blocks);
    });
});

describe('Lazy Import Test', () => {
    it('case1: lazy import case1', () => {
        const scene = buildScene('lazyImport/lazyImportCase1');
        scene.inferTypes();
        testBlocksClass(scene, 'lazyImportCase1.cpp', 'GlobalConfig', LAZY_IMPORT_EXPECT1.LAZY_IMPORT_CASE1_CLASS);
    });
    it('case2: lazy import case2', () => {
        const scene = buildScene('lazyImport/lazyImportCase2');
        scene.inferTypes();
        testBlocks(scene, 'lazyImportCase2.cpp', 'DefineObject', LAZY_IMPORT_EXPECT2.DEFINE_OBJECT_EXPECT.blocks);
        testBlocks(scene, 'lazyImportCase2.cpp', 'CallObject', LAZY_IMPORT_EXPECT2.CALL_OBJECT_EXPECT.blocks);
    });
    it('case3: lazy import case3', () => {
        const scene = buildScene('lazyImport/lazyImportCase3');
        testBlocks(scene, 'lazyImportCase3.cpp', 'MapDemo', LAZY_IMPORT_EXPECT3.MapDemo_EXPECT.blocks);
    });
    it('case4: lazy import case4', () => {
        const scene = buildScene('lazyImport/lazyImportCase4');
        scene.inferTypes();
        testBlocks(scene, 'lazyImportCase4.cpp', 'NativeCallArkTS', LAZY_IMPORT_EXPECT4.NativeCallArkTS_EXPECT.blocks);
    });
    it('case5: lazy import case5', () => {
        const scene = buildScene('lazyImport/lazyImportCase5');
        scene.inferTypes();
        testBlocks(scene, 'lazyImportCase5.cpp', 'Napi_AddPropertyInt32', LAZY_IMPORT_EXPECT5.Napi_AddPropertyInt32_EXPECT.blocks);
        if (isWin32) {
            testBlocks(scene, 'lazyImportCase5.cpp', 'CallbackToArkTS', LAZY_IMPORT_EXPECT5.CallbackToArkTS_EXPECT.blocks);
        }
    });
    it('case6: lazy import case6', () => {
        const scene = buildScene('lazyImport/lazyImportCase6');
        scene.inferTypes();
        if (isWin32) {
            testBlocks(scene, 'lazyImportCase6.cpp', 'CallFunction', LAZY_IMPORT_EXPECT6.CallFunction_EXPECT.blocks);
        }
    });
    it('case7: lazy import case7', () => {
        const scene = buildScene('lazyImport/lazyImportCase7');
        scene.inferTypes();
        testBlocks(scene, 'lazyImportCase7.cpp', 'ModifyObject', LAZY_IMPORT_EXPECT7.ModifyObject_EXPECT.blocks);
    });
    it('case8: lazy import case8', () => {
        const scene = buildScene('lazyImport/lazyImportCase8');
        scene.inferTypes();
        testBlocks(scene, 'lazyImportCase8.cpp', 'NativeCallArkTS', LAZY_IMPORT_EXPECT8.NativeCallArkTS8_EXPECT.blocks);
    });
});

describe('namespace Test', () => {
    it('case1: namespace', () => {
        const scene = buildScene('namespace');
        scene.inferTypes();
        testBlocks(scene, 'namespace.cpp', 'Test', NAMESPACE_EXPECT.NAMESPACE_CASE1.blocks);
        testNamespaceClasses(scene, 'namespace.cpp', 'School', NAMESPACE_EXPECT.NAMESPACE_SCHOOL_EXPECT);
        testNamespaceClasses(scene, 'namespace.cpp', '%AN0', NAMESPACE_EXPECT.NAMESPACE_AN0_EXPECT);
        testBlocks(scene, 'namespace.cpp', 'TestAnonymousNamespace', NAMESPACE_EXPECT.NAMESPACE_TEST_ANONYMOUS_NAMESPACE.blocks);
    });
});

describe('using Test', () => {
    it('case1: using', () => {
        const scene = buildScene('using');
        testBlocks(scene, 'usingcase.cpp', 'TestUsingNamespace', USING_EXPECT.USING_EXPECT_CASE1.blocks);
    });
    it('case2: using', () => {
        const scene = buildScene('using');
        testBlocks(scene, 'usingcase.cpp', 'TestUsingDeclaration', USING_EXPECT.USING_EXPECT_CASE2.blocks);
    });
    it('case3: using', () => {
        const scene = buildScene('using');
        testBlocks(scene, 'usingcase.cpp', 'TestUsingBaseMember', USING_EXPECT.USING_EXPECT_CASE3.blocks);
    });
    it('case4: using', () => {
        const scene = buildScene('using');
        scene.inferTypes();
        testBlocks(scene, 'usingcase.cpp', 'TestUsingEnumMember', USING_EXPECT.USING_EXPECT_CASE4.blocks);
    });
    it('case5: using', () => {
        const scene = buildScene('using');
        scene.inferTypes();
        testBlocks(scene, 'usingcase.cpp', 'TestNamespaceUsing', USING_EXPECT.USING_EXPECT_CASE5.blocks);
        testBlocks(scene, 'usingcase.cpp', 'MakeIntvec', USING_EXPECT.USING_EXPECT_CASE6.blocks);
        testBlocks(scene, 'usingcase.cpp', 'TestUsingTypeAliasTemplate', USING_EXPECT.USING_EXPECT_CASE7.blocks);
        testBlocks(scene, 'usingcase.cpp', 'TestTemplateTypeAlias', USING_EXPECT.USING_EXPECT_CASE8.blocks);
        testBlocks(scene, 'usingcase.cpp', 'TestNestedAliasInClass', USING_EXPECT.USING_EXPECT_CASE9.blocks);
    });
});

describe('typedef Test', () => {
    it('case1: typedef', () => {
        const scene = buildScene('typedef');
        scene.inferTypes();
        testBlocks(scene, 'typedef.cpp', 'main', TYPEDEF_EXPECT.TYPEDEF_EXPECT_CASE1.blocks);
    });
});

describe('feature Test', () => {
    it('case1: thread', () => {
        const scene = buildScene('thread');
        testBlocks(scene, 'thread.cpp', 'Case1', THREAD_EXPECT.THREAD_EXPECT_CASE1.blocks);
        testBlocks(scene, 'thread.cpp', 'Case2', THREAD_EXPECT.THREAD_EXPECT_CASE2.blocks);
        testBlocks(scene, 'thread.cpp', 'Case3', THREAD_EXPECT.THREAD_EXPECT_CASE3.blocks);
        testBlocks(scene, 'thread.cpp', 'Case4', THREAD_EXPECT.THREAD_EXPECT_CASE4.blocks);
    });
    it('case2: functionPointer', () => {
        const scene = buildScene('functionPointer');
        scene.inferTypes();
        testBlocks(scene, 'functionPointer.cpp', 'Add', FUNCPTR_EXPECT.FUNCPTR_EXPECT_ADD.blocks);
        testBlocks(scene, 'functionPointer.cpp', 'Case1', FUNCPTR_EXPECT.FUNCPTR_EXPECT_CASE1.blocks);
        testBlocks(scene, 'functionPointer.cpp', 'Case2', FUNCPTR_EXPECT.FUNCPTR_EXPECT_CASE2.blocks);
        testBlocks(scene, 'functionPointer.cpp', 'Case3', FUNCPTR_EXPECT.FUNCPTR_EXPECT_CASE3.blocks);
        testBlocks(scene, 'functionPointer.cpp', 'Greet', FUNCPTR_EXPECT.FUNCPTR_EXPECT_GREET.blocks);
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith('functionPointer.cpp'));
        const arkMethod1 = arkFile?.getDefaultClass().getMethods()
            .find((method) => (method.getName() === 'Func1'));
        assert(arkMethod1?.getModifiers() === ModifierType.NOEXCEPT);
        const arkMethod2 = arkFile?.getDefaultClass().getMethods()
            .find((method) => (method.getName() === 'Func2'));
        assert(arkMethod2?.getModifiers() === 0);
        const arkMethod3 = arkFile?.getDefaultClass().getMethods()
            .find((method) => (method.getName() === 'Func3'));
        assert(arkMethod3?.getModifiers() === ModifierType.NOEXCEPT);
    });
    it('case3: structBinding', () => {
        const scene = buildScene('structBinding');
        scene.inferTypes();
        testBlocks(scene, 'structBinding.cpp', 'BasicUsage', STRUCTBINDING.BINGING_EXPECT_BASICUSAGE.blocks);
        testBlocks(scene, 'structBinding.cpp', 'ReferenceUsage', STRUCTBINDING.BINGING_EXPECT_REFERENCE.blocks);
        testBlocks(scene, 'structBinding.cpp', 'TupleUsage', STRUCTBINDING.BINGING_EXPECT_TUPLEUSAGE.blocks);
        testBlocks(scene, 'structBinding.cpp', 'StructUsage', STRUCTBINDING.BINGING_EXPECT_STRUCT.blocks);
        testBlocks(scene, 'structBinding.cpp', 'MapUsage', STRUCTBINDING.BINGING_EXPECT_MAP.blocks);
        testBlocks(scene, 'structBinding.cpp', 'FunctionReturnUsage', STRUCTBINDING.BINGING_EXPECT_FUNCTIONRETURN.blocks);
        testBlocks(scene, 'structBinding.cpp', 'ConstReferenceUsage', STRUCTBINDING.BINGING_EXPECT_CONSTREFERENCE.blocks);
    });
});

describe('decltype Test', () => {
    it('case1: decltype', () => {
        const scene = buildScene('decltype');
        testBlocks(scene, 'decltype.cpp', 'AutoTest', AUTO_EXPECT.AUTO_EXPECT_CASE1.blocks);
        testBlocks(scene, 'decltype.cpp', 'DecltypeTest', AUTO_EXPECT.DECLTYPE_EXPECT_CASE1.blocks);
    });
});

describe('include in scope', () => {
    it('case1: includeInScope', () => {
        const scene = buildScene('includeInScope');
        scene.inferTypes();
        testBlocks(scene, 'includeInScope.cpp', 'IncludeInFunction', INCLUDE_IN_SCOPE.INCLUDE_IN_FUNCTION_CASE1.blocks);
        testBlocksClass(scene, 'includeInScope.cpp', 'IncludeInClass', INCLUDE_IN_SCOPE.INCLUDE_IN_CLASS_CASE1);
    });
});

describe('supplementary', () => {
    it('case1: supplementary', () => {
        const scene = buildScene('supplementary');
        scene.inferTypes();
        testBlocks(scene, 'supplementary.cpp', 'Case1', SUPPLEMENTARY.SUP_CASE1.blocks);
        testBlocks(scene, 'supplementary.cpp', 'PostAdd', SUPPLEMENTARY.POST_AND.blocks);
        testBlocks(scene, 'supplementary.cpp', 'DeclStmt', SUPPLEMENTARY.DECLSTMT.blocks);
    });
    it('case1: trap', () => {
        const scene = buildScene('trap');
        scene.inferTypes();
        testBlocks(scene, 'cxxTrap.cpp', 'Case1', TRAP.TRAP_EXPECT_CASE1.blocks);
        testBlocks(scene, 'cxxTrap.cpp', 'OuterFunction', TRAP.OUTERFUNC_EXPECT_CASE1.blocks);
    });
});
