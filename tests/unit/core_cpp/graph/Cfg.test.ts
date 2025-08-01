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
    SceneConfig,
} from '../../../../src';
import { describe, it, expect } from 'vitest';
import path from 'path';
import { Scene } from '../../../../src';
import { assertClassBlocksEqual, testBlocks, testBlocksWithSignature } from '../../common';
import * as CONDITION_EXPECT from '../../../resources_cpp/cfg/conditionalOperator';
import * as IF_EXPECT from '../../../resources_cpp/cfg/if/ifSampleExpects';
import * as SWITCH_EXPECT from '../../../resources_cpp/cfg/switch/switchSampleExpects'
import * as LOOP_EXPECT from '../../../resources_cpp/cfg/loop/loopSampleExpects';
import * as GOTO_EXPECT from '../../../resources_cpp/cfg/goto/gotoSampleExpects';
import * as BINARY_CONDITIONAL_EXPECT from  '../../../resources_cpp/cfg/binaryConditional/binaryConditionalSampleExpects';
import * as POINTER_EXPECT from '../../../resources_cpp/cfg/pointer/pointerExprExpects'
import * as REFERENCE_EXPECT from '../../../resources_cpp/cfg/reference/referenceExpects';
import * as DATA_STRUCT_EXPECT from '../../../resources_cpp/cfg/dataStruct/dataStructExpects';
import * as COMPOUND_LITERAL_EXPECT from '../../../resources_cpp/cfg/compoundLiteral/compoundLiteralExprExpects';
import * as TEMPLATE_EXPECT from  '../../../resources_cpp/cfg/template/templateExpects';
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
import * as ADDRLABEL_EXPECT from '../../../resources_cpp/cfg/addrLabelExpr/addrLabelExprExpect';
import * as NAMESPACE_EXPECT from '../../../resources_cpp/cfg/namespace';
import * as OVERLOAD from '../../../resources_cpp/cfg/overload/overloadExpect';
import * as USING_EXPECT from '../../../resources_cpp/cfg/using/usingExpects';
import * as TYPEDEF_EXPECT from '../../../resources_cpp/cfg/typedef/typdefExpects';

describe('CfgTest', () => {
    it('case1: conditional operator', () => {
        const scene = buildScene('conditionalOperator');
        testBlocks(scene, 'conditionalOperator.cpp', 'case1', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE1.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'case2', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE2.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'case3', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE3.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'case4', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE4.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'case5', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE5.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'case6', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE6.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'case7', CONDITION_EXPECT.CONDITIONAL_OPERATOR_EXPECT_CASE7.blocks);
    });
    it('case2: if statement', () => {
        const scene = buildScene('if');
        testBlocks(scene, 'ifSample.cpp', 'case1', IF_EXPECT.IF_EXPECT_CASE1.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case2', IF_EXPECT.IF_EXPECT_CASE2.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case3', IF_EXPECT.IF_EXPECT_CASE3.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case4', IF_EXPECT.IF_EXPECT_CASE4.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case5', IF_EXPECT.IF_EXPECT_CASE5.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case6', IF_EXPECT.IF_EXPECT_CASE6.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case7', IF_EXPECT.IF_EXPECT_CASE7.blocks);
    });

    it('case3: switch statement', () => {
        const scene = buildScene('switch');
        testBlocks(scene, 'switchSample.cpp', 'case1', SWITCH_EXPECT.SWITCH_EXPECT_CASE1.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case2', SWITCH_EXPECT.SWITCH_EXPECT_CASE2.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case3', SWITCH_EXPECT.SWITCH_EXPECT_CASE3.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case4', SWITCH_EXPECT.SWITCH_EXPECT_CASE4.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case5', SWITCH_EXPECT.SWITCH_EXPECT_CASE5.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case6', SWITCH_EXPECT.SWITCH_EXPECT_CASE6.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case7', SWITCH_EXPECT.SWITCH_EXPECT_CASE7.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case8', SWITCH_EXPECT.SWITCH_EXPECT_CASE8.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case9', SWITCH_EXPECT.SWITCH_EXPECT_CASE9.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case10', SWITCH_EXPECT.SWITCH_EXPECT_CASE10.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case11', SWITCH_EXPECT.SWITCH_EXPECT_CASE11.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case12', SWITCH_EXPECT.SWITCH_EXPECT_CASE12.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case13', SWITCH_EXPECT.SWITCH_EXPECT_CASE13.blocks);
    });

    it('case4: loop statement', () => {
            const scene = buildScene('loop');
        testBlocks(scene, 'loopSample.cpp', 'case1', LOOP_EXPECT.LOOP_EXPECT_CASE1.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case2', LOOP_EXPECT.LOOP_EXPECT_CASE2.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case3', LOOP_EXPECT.LOOP_EXPECT_CASE3.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case4', LOOP_EXPECT.LOOP_EXPECT_CASE4.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case5', LOOP_EXPECT.LOOP_EXPECT_CASE5.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case6', LOOP_EXPECT.LOOP_EXPECT_CASE6.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case7', LOOP_EXPECT.LOOP_EXPECT_CASE7.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case8', LOOP_EXPECT.LOOP_EXPECT_CASE8.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case9', LOOP_EXPECT.LOOP_EXPECT_CASE9.blocks);
        },
    );
    it('case5: while-continue statement', () => {
            const scene = buildScene('whileContinue');
        testBlocks(scene, 'whileContinueSample.cpp', 'main', WHILE_CONTINUE_EXPECT.WHILE_CONTINUE_EXPECT_MAIN.blocks);
        },
    );
    it('case6: goto statement', () => {
            const scene = buildScene('goto');
        testBlocks(scene, 'gotoSample.cpp', 'case1', GOTO_EXPECT.GOTO_EXPECT_CASE1.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case2', GOTO_EXPECT.GOTO_EXPECT_CASE2.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case3', GOTO_EXPECT.GOTO_EXPECT_CASE3.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case4', GOTO_EXPECT.GOTO_EXPECT_CASE4.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case5', GOTO_EXPECT.GOTO_EXPECT_CASE5.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case6', GOTO_EXPECT.GOTO_EXPECT_CASE6.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case7', GOTO_EXPECT.GOTO_EXPECT_CASE7.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case8', GOTO_EXPECT.GOTO_EXPECT_CASE8.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case9', GOTO_EXPECT.GOTO_EXPECT_CASE9.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case10', GOTO_EXPECT.GOTO_EXPECT_CASE10.blocks);
        },
    );
    it('case7: binaryCondition', () => {
        const scene = buildScene('binaryConditional');
        testBlocks(scene, 'binaryConditionalSample.cpp', 'case1', BINARY_CONDITIONAL_EXPECT.BINARY_CONDITIONAL_EXPECT_CASE1.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'case2', BINARY_CONDITIONAL_EXPECT.BINARY_CONDITIONAL_EXPECT_CASE2.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'case3', BINARY_CONDITIONAL_EXPECT.BINARY_CONDITIONAL_EXPECT_CASE3.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'case4', BINARY_CONDITIONAL_EXPECT.BINARY_CONDITIONAL_EXPECT_CASE4.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'case5', BINARY_CONDITIONAL_EXPECT.BINARY_CONDITIONAL_EXPECT_CASE5.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'case6', BINARY_CONDITIONAL_EXPECT.BINARY_CONDITIONAL_EXPECT_CASE6.blocks);
        },
    );
    it('case8: addrLabelExpr', () => {
            const scene = buildScene('addrLabelExpr');
            testBlocks(scene, 'addrLabelExpr.cpp', 'foo1', ADDRLABEL_EXPECT.ADDRLABEL_EXPECT_CASE1.blocks);
            testBlocks(scene, 'addrLabelExpr.cpp', 'foo2', ADDRLABEL_EXPECT.ADDRLABEL_EXPECT_CASE2.blocks);
            testBlocks(scene, 'addrLabelExpr.cpp', 'foo3', ADDRLABEL_EXPECT.ADDRLABEL_EXPECT_CASE3.blocks);
        },
    );
});


describe('Type Test', () => {
    it('case1: base dataType', () => {
            const scene = buildScene('baseDataType');
        testBlocks(scene, 'baseDataType.cpp', 'main', BASE_DATA_TYPE_EXPECT.BASE_DATA_TYPE_EXPECT_MAIN.blocks);
        },
    );
    it('case2: pointer Type', () => {
            const scene = buildScene('pointer');
        testBlocks(scene, 'pointerExpr.cpp', 'ptrType', POINTER_EXPECT.POINTER_EXPECT_CASE1.blocks);
        testBlocks(scene, 'pointerExpr.cpp', 'basePtrOp', POINTER_EXPECT.POINTER_EXPECT_CASE2.blocks);
        testBlocks(scene, 'pointerExpr.cpp', 'multiLevelPtrOp', POINTER_EXPECT.POINTER_EXPECT_CASE3.blocks);
        },
    );
    it('case3: reference Type', () => {
            const scene = buildScene('reference');
        testBlocks(scene, 'reference.cpp', 'baseLeftRefer', REFERENCE_EXPECT.REFERENCE_EXPECT_CASE1.blocks);
        testBlocks(scene, 'reference.cpp', 'pointRefer', REFERENCE_EXPECT.REFERENCE_EXPECT_CASE2.blocks);
        testBlocks(scene, 'reference.cpp', 'myClassRefer', REFERENCE_EXPECT.REFERENCE_EXPECT_CASE3.blocks);
        testBlocks(scene, 'reference.cpp', 'baseRightRefer', REFERENCE_EXPECT.REFERENCE_EXPECT_CASE4.blocks);
        testBlocks(scene, 'reference.cpp', 'relay', REFERENCE_EXPECT.REFERENCE_EXPECT_CASE5.blocks);
        },
    );
    it('case4: Derived Class', () => {
            const scene = buildScene('derivedDataType');
            testBlocksClass(scene, 'derivedDataType.cpp', 'MyClass', DERIVED_DATA_TYPE_EXPECT.DERIVED_DATA_TYPE_EXPECT_CLASS);
            testBlocksClass(scene, 'derivedDataType.cpp', 'DefaultClass', DERIVED_DATA_TYPE_EXPECT.DERIVED_DATA_TYPE_EXPECT_CLASS2);
            testBlocksClass(scene, 'derivedDataType.cpp', 'MyStruct', DERIVED_DATA_TYPE_EXPECT.DERIVED_DATA_TYPE_EXPECT_STRUCT);
        },
    );
    it('case5: DataStruct Test', () => {
            const scene = buildScene('dataStruct');
        testBlocks(scene, 'dataStruct.cpp', 'vectorTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_VECTOR.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'setTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_SET.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'mapTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_MAP.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'unorderedMapTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_MAP2.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'queueTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_QUEUE.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'dequeTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_DEQUE.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'stackTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_STACK.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'listTest', DATA_STRUCT_EXPECT.DATA_STRUCT_EXPECT_LIST.blocks);
        },
    );
    it('case6: NullPtr Test', () => {
            const scene = buildScene('nullPtr');
        testBlocks(scene, 'nullPtrSample.cpp', 'case1', NULLPTR_EXPECT.NULLPTR_EXPECT_CASE1.blocks);
        },
    );
    it('case7: CompoundLiteral Test', () => {
            const scene = buildScene('compoundLiteral');
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'case1', COMPOUND_LITERAL_EXPECT.COMPOUND_LITERAL_EXPECT_CASE1.blocks);
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'case2', COMPOUND_LITERAL_EXPECT.COMPOUND_LITERAL_EXPECT_CASE2.blocks);
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'case3', COMPOUND_LITERAL_EXPECT.COMPOUND_LITERAL_EXPECT_CASE3.blocks);
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'case4', COMPOUND_LITERAL_EXPECT.COMPOUND_LITERAL_EXPECT_CASE4.blocks);
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'case5', COMPOUND_LITERAL_EXPECT.COMPOUND_LITERAL_EXPECT_CASE5.blocks);
        },
    );

    it('case:8 Template Test', () => {
            const scene = buildScene('template');
        testBlocks(scene, 'template.cpp', 'max1', TEMPLATE_EXPECT.TEMPLATE_EXPECT_CASE1.blocks);
        testBlocks(scene, 'template.cpp', 'max2', TEMPLATE_EXPECT.TEMPLATE_EXPECT_CASE2.blocks);
        testBlocks(scene, 'template.cpp', 'printPair', TEMPLATE_EXPECT.TEMPLATE_EXPECT_CASE3.blocks);
        testBlocksClass(scene, 'template.cpp', 'MyContainer', TEMPLATE_EXPECT.TEMPLATE_MYCONTAINER_CLASS);
        testBlocks(scene, 'template.cpp', 'main', TEMPLATE_EXPECT.TEMPLATE_EXPECT_CASE4.blocks);
        testBlocks(scene, 'template.cpp', 'sum', TEMPLATE_EXPECT.TEMPLATE_EXPECT_CASE5.blocks);
        testBlocks(scene, 'template.cpp', 'instantiation3', TEMPLATE_EXPECT.TEMPLATE_EXPECT_CASE6.blocks);
        },
    );

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
        testBlocks(scene, 'cppOperators.cpp', 'returnValue', OPERATOR_EXPECT.OPERATOR_EXPECT_RETURN.blocks);
        },
    );
    it('case2: no return value', () => {
            const scene = buildScene('operators');
        testBlocks(scene, 'cppOperators.cpp', 'noReturnValue', OPERATOR_EXPECT.OPERATOR_EXPECT_NO_RETURN.blocks);
        },
    );

    it('case3: Lambda Function Test', () => {
            const scene = buildScene('lambdaFunc');
        testBlocks(scene, 'lambdaFuncSample.cpp', 'case1', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE1.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'case2', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE2.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'case3', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE3.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'case4', LAMBDA_EXPECT.LAMBDA_EXPECT_CASE4.blocks);
        },
    );

    it('case4: delete Expression Test', () => {
            const scene = buildScene('delete');
        testBlocks(scene, 'deleteExpr.cpp', 'delObj', DELETE_EXPECT.DELETE_EXPECT_CASE1.blocks);
        testBlocks(scene, 'deleteExpr.cpp', 'delArr', DELETE_EXPECT.DELETE_EXPECT_CASE2.blocks);
        testBlocks(scene, 'deleteExpr.cpp', 'delClassObj', DELETE_EXPECT.DELETE_EXPECT_CASE3.blocks);
        testBlocks(scene, 'deleteExpr.cpp', 'delMember', DELETE_EXPECT.DELETE_EXPECT_CASE4.blocks);
        },
    );

    it('case5: Overload Test', () => {
        const scene = buildScene('overload');
        scene.inferTypes();
        testBlocksWithSignature(scene, 'overloadSample.cpp', '',
            'printInfo(int)', OVERLOAD.OVERLOAD_PRINT_INFO_CASE1_EXPECT.blocks);
        testBlocksWithSignature(scene, 'overloadSample.cpp', '',
            'printInfo(char)', OVERLOAD.OVERLOAD_PRINT_INFO_CASE2_EXPECT.blocks);
        testBlocksWithSignature(scene, 'overloadSample.cpp', '',
            'printInfo(int, char)', OVERLOAD.OVERLOAD_PRINT_INFO_CASE3_EXPECT.blocks);
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
        testBlocks(scene, 'cppOperators.cpp', 'arithmeticOperator', OPERATOR_EXPECT.OPERATOR_EXPECT_CASE1.blocks);
        testBlocks(scene, 'cppOperators.cpp', 'relationOperator', OPERATOR_EXPECT.OPERATOR_EXPECT_CASE2.blocks);
        testBlocks(scene, 'cppOperators.cpp', 'componentOperator', OPERATOR_EXPECT.OPERATOR_EXPECT_CASE3.blocks);
        testBlocks(scene, 'cppOperators.cpp', 'bitOperator', OPERATOR_EXPECT.OPERATOR_EXPECT_CASE4.blocks);
        testBlocks(scene, 'cppOperators.cpp', 'otherOperator', OPERATOR_EXPECT.OPERATOR_EXPECT_CASE5.blocks);
        },
    );
    it('case2: try catch throw', () => {
            const scene = buildScene('throw');
        testBlocks(scene, 'throwSample.cpp', 'division', THROW_EXPECT.THROW_EXPECT_CASE1.blocks);
        testBlocks(scene, 'throwSample.cpp', 'main', THROW_EXPECT.THROW_EXPECT_CASE2.blocks);
        testBlocks(scene, 'throwSample.cpp', 'try_throw_case', THROW_EXPECT.THROW_EXPECT_CASE3.blocks);
        },
    );
    it('case3: iostream', () => {
            const scene = buildScene('iostream');
        testBlocks(scene, 'iostreamTest.cpp', 'main', IOSTREAM_EXPECT.IOSTREAM_EXPECT_CASE1.blocks);
        },
    );
    it('case4: Cast Test', () => {
            const scene = buildScene('cast');
        testBlocks(scene, 'castSample.cpp', 'CXXStaticCastTest', CAST_EXPECT.CAST_EXPECT_CASE1.blocks);
        testBlocks(scene, 'castSample.cpp',  'cStyleCastTest', CAST_EXPECT.CAST_EXPECT_CASE2.blocks);
        testBlocks(scene, 'castSample.cpp', 'CXXConstCastTest', CAST_EXPECT.CAST_EXPECT_CASE3.blocks);
        testBlocks(scene, 'castSample.cpp', 'CXXDynamicCastTest', CAST_EXPECT.CAST_EXPECT_CASE4.blocks);
        testBlocks(scene, 'castSample.cpp', 'CXXReinterpretCastTest', CAST_EXPECT.CAST_EXPECT_CASE5.blocks);
        testBlocks(scene, 'castSample.cpp', 'CXXFunctionalCastTest', CAST_EXPECT.CAST_EXPECT_CASE6.blocks);
        },
    );
    it('case5: NullStmt Test', () => {
            const scene = buildScene('nullStmt');
        testBlocks(scene, 'nullStmtSample.cpp', 'case1', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE1.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case2', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE2.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case3', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE3.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case4', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE4.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case5', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE5.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case6', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE6.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case7', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE7.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case8', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE8.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case9', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE9.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case10', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE10.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case11', NULLSTMT_EXPECT.NULLSTMT_EXPECT_CASE11.blocks);
        },
    );
    it('case6: BuiltInAndSTLFunc Test', () => {
            const scene = buildScene('builtInAndSTLFunc');
        testBlocks(scene, 'builtInAndSTLFunction.cpp', 'CXXTypeidExprTest', BUILT_IN_EXPECT.BUILT_IN_EXPECT_CASE1.blocks);
        testBlocks(scene, 'builtInAndSTLFunction.cpp', 'ArrayTypeTraitTest', BUILT_IN_EXPECT.BUILT_IN_EXPECT_CASE2.blocks);
        testBlocks(scene, 'builtInAndSTLFunction.cpp', 'CXXNoexceptExprTest', BUILT_IN_EXPECT.BUILT_IN_EXPECT_CASE3.blocks);
        testBlocks(scene, 'builtInAndSTLFunction.cpp', 'AtomicExprTest', BUILT_IN_EXPECT.BUILT_IN_EXPECT_CASE4.blocks);
        },
    );
});


describe('Lazy Import Test', () => {
    it('case1: lazy import case1', () => {
        const scene = buildScene('lazyImport/lazyImportCase1');
        testBlocksClass(scene, 'lazyImportCase1.cpp', 'GlobalConfig', LAZY_IMPORT_EXPECT1.LAZY_IMPORT_CASE1_CLASS);
        },
    );
    it('case2: lazy import case2', () => {
            const scene = buildScene('lazyImport/lazyImportCase2');
            testBlocks(scene, 'lazyImportCase2.cpp', 'DefineObject', lazyImportCase2.DEFINE_OBJECT_EXPECT.blocks);
            testBlocks(scene, 'lazyImportCase2.cpp', 'CallObject', lazyImportCase2.CALL_OBJECT_EXPECT.blocks);
        },
    );
    it('case3: lazy import case3', () => {
            const scene = buildScene('lazyImport/lazyImportCase3');
            testBlocks(scene, 'lazyImportCase3.cpp', 'MapDemo', lazyImportCase3.MapDemo_EXPECT.blocks);
        },
    );
    it('case4: lazy import case4', () => {
            const scene = buildScene('lazyImport/lazyImportCase4');
            testBlocks(scene, 'lazyImportCase4.cpp', 'NativeCallArkTS', lazyImportCase4.NativeCallArkTS_EXPECT.blocks);
        },
    );
    it('case5: lazy import case5', () => {
            const scene = buildScene('lazyImport/lazyImportCase5');
            testBlocks(scene, 'lazyImportCase5.cpp', 'Napi_AddPropertyInt32', lazyImportCase5.Napi_AddPropertyInt32_EXPECT.blocks);
            testBlocks(scene, 'lazyImportCase5.cpp', 'CallbackToArkTS', lazyImportCase5.CallbackToArkTS_EXPECT.blocks);
        },
    );
    it('case6: lazy import case6', () => {
            const scene = buildScene('lazyImport/lazyImportCase6');
            testBlocks(scene, 'lazyImportCase6.cpp', 'CallFunction', lazyImportCase6.CallFunction_EXPECT.blocks);
        },
    );
    it('case7: lazy import case7', () => {
            const scene = buildScene('lazyImport/lazyImportCase7');
            testBlocks(scene, 'lazyImportCase7.cpp', 'ModifyObject', lazyImportCase7.ModifyObject_EXPECT.blocks);
        },
    );
    it('case8: lazy import case8', () => {
            const scene = buildScene('lazyImport/lazyImportCase8');
            testBlocks(scene, 'lazyImportCase8.cpp', 'NativeCallArkTS', lazyImportCase8.NativeCallArkTS8_EXPECT.blocks);
        },
    );
});

describe('namespace Test', () => {
    it('case1: namespace', () => {
            const scene = buildScene('namespace');
            testBlocks(scene, 'namespace.cpp', 'test', NAMESPACE_EXPECT.NAMESPACE_CASE1.blocks);
        },
    );
});

describe('using Test', () => {
    it('case1: using', () => {
            const scene = buildScene('using');
            testBlocks(scene, 'usingcase.cpp', 'test_using_namespace', USING_EXPECT.USING_EXPECT_CASE1.blocks);},
    );
    it('case2: using', () => {
        const scene = buildScene('using');
        testBlocks(scene, 'usingcase.cpp', 'test_using_declaration', USING_EXPECT.USING_EXPECT_CASE2.blocks);},
    );
    it('case3: using', () => {
        const scene = buildScene('using');
        testBlocks(scene, 'usingcase.cpp', 'test_using_base_member', USING_EXPECT.USING_EXPECT_CASE3.blocks);},
    );
    it('case4: using', () => {
        const scene = buildScene('using');
        testBlocks(scene, 'usingcase.cpp', 'test_using_enum_member', USING_EXPECT.USING_EXPECT_CASE4.blocks);},
    );
});

describe('typedef Test', () => {
    it('case1: typedef', () => {
        const scene = buildScene('typedef');
        testBlocks(scene, 'typedef.cpp', 'main', TYPEDEF_EXPECT.TYPEDEF_EXPECT_CASE1.blocks);
        },
    );
});

const BASE_DIR = 'tests/resources_cpp/cfg';

function buildScene(folderName: string): Scene {
    let config: SceneConfig = new SceneConfig();
    config.setOptions(['.c', '.cpp', '.h', '.hpp']);
    config.buildFromProjectDir(path.join(BASE_DIR, folderName));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    return scene;
}

function testBlocksClass(scene: Scene, filePath: string, className: string, expectBlocks: any, isCheckOverload?: boolean): void {
    const arkFile = scene.getFiles().find((file) => file.getName().endsWith(filePath));
    const arkClass = arkFile?.getClasses().find(arkClass => (arkClass.getName() === className));
    const classBlockMap = new Map<String, BasicBlock[]>();
    for (const block of expectBlocks.blocks) {
        classBlockMap.set(block.methodName, block.blocks);
    }
    // 1.判断类的继承
    const heritageClasses = new Set();
    arkClass?.getAllHeritageClasses()?.forEach(heritageClass => {
        heritageClasses.add(heritageClass.getName());
    })
    expect(heritageClasses).toEqual(new Set(expectBlocks.heritageClasses));
    // 2.判断类的域成员
    const fieldOfClass = new Set();
    arkClass?.getFields()?.forEach(field => {
        fieldOfClass.add(field.getName());
    })
    expect(fieldOfClass).toEqual(new Set(expectBlocks.fields));
    // 3.判断类的成员函数
    arkClass?.getMethods()?.forEach(method =>{
        const mapKey = isCheckOverload ? method.getSubSignature().toString() : method.getName();
        const classBlock = classBlockMap.get(mapKey);
        if (classBlock) {
            assertClassBlocksEqual(method, classBlock);
        }
    })
}
