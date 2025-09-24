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

import { BasicBlock, SceneConfig } from '../../../../src';
import { describe, it, expect } from 'vitest';
import path from 'path';
import { Scene } from '../../../../src';
import { assertClassBlocksEqual, testBlocks, testBlocksWithSignature } from '../../common';
import * as CONDITION_EXPECT from '../../../resources_cpp/cfg/conditionalOperator';
import * as IF_EXPECT from '../../../resources_cpp/cfg/if/ifSampleExpects';
import * as SWITCH_EXPECT from '../../../resources_cpp/cfg/switch/switchSampleExpects';
import * as LOOP_EXPECT from '../../../resources_cpp/cfg/loop/loopSampleExpects';
import * as GOTO_EXPECT from '../../../resources_cpp/cfg/goto/gotoSampleExpects';
import * as BINARY_CONDITIONAL_EXPECT from '../../../resources_cpp/cfg/binaryConditional/binaryConditionalSampleExpects';
import * as POINTER_EXPECT from '../../../resources_cpp/cfg/pointer/pointerExprExpects';
import * as REFERENCE_EXPECT from '../../../resources_cpp/cfg/reference/referenceExpects';
import * as DATA_STRUCT_EXPECT from '../../../resources_cpp/cfg/dataStruct/dataStructExpects';
import * as COMPOUND_LITERAL_EXPECT from '../../../resources_cpp/cfg/compoundLiteral/compoundLiteralExprExpects';
import * as TEMPLATE_EXPECT from '../../../resources_cpp/cfg/template/templateExpects';
import * as OPERATOR_EXPECT from '../../../resources_cpp/cfg/operators/cppOperatorExpects';
import * as LAMBDA_EXPECT from '../../../resources_cpp/cfg/lambdaFunc/lambdaFuncExpects';
import * as THROW_EXPECT from '../../../resources_cpp/cfg/throw/throwExpects';
import * as CAST_EXPECT from '../../../resources_cpp/cfg/cast/castSampleExpects';
import * as NULLSTMT_EXPECT from '../../../resources_cpp/cfg/nullStmt/nullStmtExpects';
import * as BUILT_IN_EXPECT from '../../../resources_cpp/cfg/builtInAndSTLFunc/builtInAndSTLFunctionExpects';
import * as DERIVED_DATA_TYPE_EXPECT from '../../../resources_cpp/cfg/derivedDataType/derivedDataTypeExpects';
import * as DELETE_EXPECT from '../../../resources_cpp/cfg/delete/deleteExprExpects';
import * as IOSTREAM_EXPECT from '../../../resources_cpp/cfg/iostream/iostreamExpects';
import * as NULLPTR_EXPECT from '../../../resources_cpp/cfg/nullPtr/nullPtrSampleExpects';
import * as BASE_DATA_TYPE_EXPECT from '../../../resources_cpp/cfg/baseDataType/baseDataTypeExpects';
import * as WHILE_CONTINUE_EXPECT from '../../../resources_cpp/cfg/whileContinue/whileContinueSampleExpects';
import * as CLASS_EXPECT from '../../../resources_cpp/cfg/class/classExpect';
import * as LAZY_IMPORT_EXPECT1 from '../../../resources_cpp/cfg/lazyImport/lazyImportCase1/lazyImportCase1Expect';
import * as lazyImportCase2 from '../../../resources_cpp/cfg/lazyImport/lazyImportCase2';
import * as lazyImportCase3 from '../../../resources_cpp/cfg/lazyImport/lazyImportCase3';
import * as lazyImportCase4 from '../../../resources_cpp/cfg/lazyImport/lazyImportCase4';
import * as lazyImportCase5 from '../../../resources_cpp/cfg/lazyImport/lazyImportCase5';
import * as lazyImportCase6 from '../../../resources_cpp/cfg/lazyImport/lazyImportCase6';
import * as lazyImportCase7 from '../../../resources_cpp/cfg/lazyImport/lazyImportCase7';
import * as lazyImportCase8 from '../../../resources_cpp/cfg/lazyImport/lazyImportCase8';
import * as NAMESPACE_EXPECT from '../../../resources_cpp/cfg/namespace';
import * as OVERLOAD from '../../../resources_cpp/cfg/overload/overloadExpect';
import * as USING_EXPECT from '../../../resources_cpp/cfg/using/usingExpects';
import * as TYPEDEF_EXPECT from '../../../resources_cpp/cfg/typedef/typdefExpects';
import * as THREAD_EXPECT from '../../../resources_cpp/cfg/thread/threadExpects';
import * as FUNCPTR_EXPECT from '../../../resources_cpp/cfg/functionPointer/functionPointerExpts';
import * as AUTO_EXPECT from '../../../resources_cpp/cfg/decltype/decltypeExpects';
import * as INCLUDE_IN_SCOPE from '../../../resources_cpp/cfg/includeInScope/includeInFunctionExpects';
import * as STRUCTBINDING from '../../../resources_cpp/cfg/structBinding/structBindingExpect';

// Standard library header file configuration for DevEco
const deveco_c = process.env.DEVECO_C !== undefined ? process.env.DEVECO_C : '';
const deveco_include = process.env.DEVECO_INCLUDE !== undefined ? process.env.DEVECO_INCLUDE : '';
const is_system_win32 = process.platform === 'win32';

describe('CfgTest', () => {
    it('case1: conditional operator', () => {
        const scene = buildScene('conditionalOperator');
        testBlocks(scene, 'conditionalOperator.cpp', 'Case1', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE1.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'Case2', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE2.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'Case3', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE3.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'Case4', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE4.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'Case5', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE5.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'Case6', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE6.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'Case7', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE7.blocks);
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
    });

    it('case3: switch statement', () => {
        const scene = buildScene('switch');
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
    });
    it('case5: while-continue statement', () => {
        const scene = buildScene('whileContinue');
        testBlocks(scene, 'whileContinueSample.cpp', 'main', WHILE_CONTINUE_EXPECT.WHILE_CONTINUE_EXPECT_MAIN.blocks);
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
        testBlocks(scene, 'dataStruct.cpp', 'SetTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_SET.blocks);
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
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case1', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE1.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case2', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE2.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case3', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE3.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'Case4', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE4.blocks);
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
        testBlocksClass(scene, 'overloadSample.cpp', 'Person', OVERLOAD.OVERLOAD_CLASS_PERSON_EXPECT, true);
        testBlocksClass(scene, 'overloadSample.cpp', 'Vector', OVERLOAD.VECTOR_CLASS_EXPECT);
        testBlocks(scene, 'overloadSample.cpp', 'operator<<', OVERLOAD.OVERLOAD_COUT_EXPECT.blocks);
        testBlocks(scene, 'overloadSample.cpp', 'operator>>', OVERLOAD.OVERLOAD_CIN_EXPECT.blocks);
        testBlocks(scene, 'overloadSample.cpp', 'operator""_km', OVERLOAD.OVERLOAD_USER_DEFINED_LITERAL_NUMBER_EXPECT.blocks);
        testBlocks(scene, 'overloadSample.cpp', 'operator""_c', OVERLOAD.OVERLOAD_USER_DEFINED_LITERAL_CHAR_EXPECT.blocks);
        testBlocks(scene, 'overloadSample.cpp', 'main', OVERLOAD.OVERLOAD_MAIN_EXPECT.blocks);
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
            is_system_win32 ? BUILT_IN_EXPECT.BUILT_IN_EXPECT_CASE4.blocks : BUILT_IN_EXPECT.BUILT_IN_EXPECT_CASE4_LINUX.blocks);
    });
});

describe('Lazy Import Test', () => {
    it('case1: lazy import case1', () => {
        const scene = buildScene('lazyImport/lazyImportCase1');
        testBlocksClass(scene, 'lazyImportCase1.cpp', 'GlobalConfig', LAZY_IMPORT_EXPECT1.LAZY_IMPORT_CASE1_CLASS);
    });
    it('case2: lazy import case2', () => {
        const scene = buildScene('lazyImport/lazyImportCase2');
        testBlocks(scene, 'lazyImportCase2.cpp', 'DefineObject', lazyImportCase2.DEFINE_OBJECT_EXPECT.blocks);
        testBlocks(scene, 'lazyImportCase2.cpp', 'CallObject', lazyImportCase2.CALL_OBJECT_EXPECT.blocks);
    });
    it('case3: lazy import case3', () => {
        const scene = buildScene('lazyImport/lazyImportCase3');
        testBlocks(scene, 'lazyImportCase3.cpp', 'MapDemo', lazyImportCase3.MapDemo_EXPECT.blocks);
    });
    it('case4: lazy import case4', () => {
        const scene = buildScene('lazyImport/lazyImportCase4');
        testBlocks(scene, 'lazyImportCase4.cpp', 'NativeCallArkTS', lazyImportCase4.NativeCallArkTS_EXPECT.blocks);
    });
    it('case5: lazy import case5', () => {
        const scene = buildScene('lazyImport/lazyImportCase5');
        testBlocks(scene, 'lazyImportCase5.cpp', 'Napi_AddPropertyInt32', lazyImportCase5.Napi_AddPropertyInt32_EXPECT.blocks);
        if (is_system_win32) {
            testBlocks(scene, 'lazyImportCase5.cpp', 'CallbackToArkTS', lazyImportCase5.CallbackToArkTS_EXPECT.blocks);
        }
    });
    it('case6: lazy import case6', () => {
        const scene = buildScene('lazyImport/lazyImportCase6');
        if (is_system_win32) {
            testBlocks(scene, 'lazyImportCase6.cpp', 'CallFunction', lazyImportCase6.CallFunction_EXPECT.blocks);
        }
    });
    it('case7: lazy import case7', () => {
        const scene = buildScene('lazyImport/lazyImportCase7');
        testBlocks(scene, 'lazyImportCase7.cpp', 'ModifyObject', lazyImportCase7.ModifyObject_EXPECT.blocks);
    });
    it('case8: lazy import case8', () => {
        const scene = buildScene('lazyImport/lazyImportCase8');
        testBlocks(scene, 'lazyImportCase8.cpp', 'NativeCallArkTS', lazyImportCase8.NativeCallArkTS8_EXPECT.blocks);
    });
});

describe('namespace Test', () => {
    it('case1: namespace', () => {
        const scene = buildScene('namespace');
        testBlocks(scene, 'namespace.cpp', 'Test', NAMESPACE_EXPECT.NAMESPACE_CASE1.blocks);
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
        testBlocks(scene, 'usingcase.cpp', 'TestUsingEnumMember', USING_EXPECT.USING_EXPECT_CASE4.blocks);
    });
});

describe('typedef Test', () => {
    it('case1: typedef', () => {
        const scene = buildScene('typedef');
        testBlocks(scene, 'typedef.cpp', 'main', TYPEDEF_EXPECT.TYPEDEF_EXPECT_CASE1.blocks);
    });
});

describe('thread Test', () => {
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
        testBlocks(scene, 'functionPointer.cpp', 'Case1', FUNCPTR_EXPECT.FUNCPTR_EXPECT_CASE1.blocks);
        testBlocks(scene, 'functionPointer.cpp', 'Case2', FUNCPTR_EXPECT.FUNCPTR_EXPECT_CASE2.blocks);
        testBlocks(scene, 'functionPointer.cpp', 'Case3', FUNCPTR_EXPECT.FUNCPTR_EXPECT_CASE3.blocks);
        testBlocks(scene, 'functionPointer.cpp', 'Greet', FUNCPTR_EXPECT.FUNCPTR_EXPECT_GREET.blocks);
    });
    it('case3: structBinding', () => {
        const scene = buildScene('structBinding');
        scene.inferTypes();
        testBlocks(scene, 'structBinding.cpp', 'BasicUsage', STRUCTBINDING.REFERENCE_EXPECT_BASICUSAGE.blocks);
        testBlocks(scene, 'structBinding.cpp', 'ReferenceUsage', STRUCTBINDING.REFERENCE_EXPECT_REFERENCE.blocks);
        testBlocks(scene, 'structBinding.cpp', 'TupleUsage', STRUCTBINDING.REFERENCE_EXPECT_TUPLEUSAGE.blocks);
        testBlocks(scene, 'structBinding.cpp', 'StructUsage', STRUCTBINDING.REFERENCE_EXPECT_STRUCT.blocks);
        testBlocks(scene, 'structBinding.cpp', 'MapUsage', STRUCTBINDING.REFERENCE_EXPECT_MAP.blocks);
        testBlocks(scene, 'structBinding.cpp', 'GetStudentInfo', STRUCTBINDING.REFERENCE_EXPECT_GETSTRUCTINFO.blocks);
        testBlocks(scene, 'structBinding.cpp', 'FunctionReturnUsage', STRUCTBINDING.REFERENCE_EXPECT_FUNCTIONRETURN.blocks);
        testBlocks(scene, 'structBinding.cpp', 'ConstReferenceUsage', STRUCTBINDING.REFERENCE_EXPECT_CONSTREFERENCE.blocks);
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
        testBlocks(scene, 'includeInScope.cpp', 'IncludeInFunction', INCLUDE_IN_SCOPE.INCLUDE_IN_FUNCTION_CASE1.blocks);
        testBlocksClass(scene, 'includeInScope.cpp', 'IncludeInClass', INCLUDE_IN_SCOPE.INCLUDE_IN_CLASS_CASE1);
    });
});

const BASE_DIR = 'tests/resources_cpp/cfg';

function buildScene(folderName: string): Scene {
    let config: SceneConfig = new SceneConfig();
    config.setSupportFileExts(['.c', '.cpp', '.h', '.hpp']);
    let includeDirs: string[] = [];
    // header file configuration for DevEco
    includeDirs.push(path.join(deveco_c, 'c++', 'v1'));
    includeDirs.push(path.join(deveco_include, 'include'));
    config.buildFromProjectDir(path.join(BASE_DIR, folderName), includeDirs);
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    return scene;
}

function testBlocksClass(scene: Scene, filePath: string, className: string, expectBlocks: any, isCheckOverload?: boolean): void {
    const arkFile = scene.getFiles().find(file => file.getName().endsWith(filePath));
    const arkClass = arkFile?.getClasses().find(arkClass => arkClass.getName() === className);
    const classBlockMap = new Map<String, BasicBlock[]>();
    for (const block of expectBlocks.blocks) {
        classBlockMap.set(block.methodName, block.blocks);
    }
    // 1.Check class inheritance
    const heritageClasses = new Set();
    arkClass?.getAllHeritageClasses()?.forEach(heritageClass => {
        heritageClasses.add(heritageClass.getName());
    });
    expect(heritageClasses).toEqual(new Set(expectBlocks.heritageClasses));
    // 2.Check class fields
    const fieldOfClass = new Set();
    arkClass?.getFields()?.forEach(field => {
        fieldOfClass.add(field.getName());
    });
    expect(fieldOfClass).toEqual(new Set(expectBlocks.fields));
    // 3.Check class member functions
    arkClass?.getMethods()?.forEach(method => {
        const mapKey = isCheckOverload ? method.getSubSignature().toString() : method.getName();
        const classBlock = classBlockMap.get(mapKey);
        if (classBlock) {
            assertClassBlocksEqual(method, classBlock);
        }
    });
}
