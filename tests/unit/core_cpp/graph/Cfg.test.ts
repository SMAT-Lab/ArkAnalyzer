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
import {
    CONDITIONAL_OPERATOR_EXPECT_CASE1,
    CONDITIONAL_OPERATOR_EXPECT_CASE2,
    CONDITIONAL_OPERATOR_EXPECT_CASE3,
    CONDITIONAL_OPERATOR_EXPECT_CASE4,
    CONDITIONAL_OPERATOR_EXPECT_CASE5,
    CONDITIONAL_OPERATOR_EXPECT_CASE6,
    CONDITIONAL_OPERATOR_EXPECT_CASE7,
} from '../../../resources_cpp/cfg/conditionalOperator/conditionalOperatorExpects';
import {
    IF_EXPECT_CASE1,
    IF_EXPECT_CASE2,
    IF_EXPECT_CASE3,
    IF_EXPECT_CASE4,
    IF_EXPECT_CASE5,
    IF_EXPECT_CASE6,
    IF_EXPECT_CASE7
} from '../../../resources_cpp/cfg/if/ifSampleExpects';
import {
    SWITCH_EXPECT_CASE1,
    SWITCH_EXPECT_CASE2,
    SWITCH_EXPECT_CASE3,
    SWITCH_EXPECT_CASE4,
    SWITCH_EXPECT_CASE5,
    SWITCH_EXPECT_CASE6,
    SWITCH_EXPECT_CASE7,
    SWITCH_EXPECT_CASE8,
    SWITCH_EXPECT_CASE9,
    SWITCH_EXPECT_CASE10,
    SWITCH_EXPECT_CASE11,
    SWITCH_EXPECT_CASE12,
    SWITCH_EXPECT_CASE13,
} from '../../../resources_cpp/cfg/switch/switchSampleExpects'
import {
    LOOP_EXPECT_CASE1,
    LOOP_EXPECT_CASE2,
    LOOP_EXPECT_CASE3,
    LOOP_EXPECT_CASE4,
    LOOP_EXPECT_CASE5,
    LOOP_EXPECT_CASE6,
    LOOP_EXPECT_CASE7,
    LOOP_EXPECT_CASE8,
    LOOP_EXPECT_CASE9,
} from '../../../resources_cpp/cfg/loop/loopSampleExpects';
import {
    GOTO_EXPECT_CASE1,
    GOTO_EXPECT_CASE2,
    GOTO_EXPECT_CASE3,
    GOTO_EXPECT_CASE4,
    GOTO_EXPECT_CASE5,
    GOTO_EXPECT_CASE6,
    GOTO_EXPECT_CASE7,
    GOTO_EXPECT_CASE8,
    GOTO_EXPECT_CASE9,
    GOTO_EXPECT_CASE10
} from '../../../resources_cpp/cfg/goto/gotoSampleExpects';
import {
    BINARY_CONDITIONAL_EXPECT_CASE1,
    BINARY_CONDITIONAL_EXPECT_CASE2,
    BINARY_CONDITIONAL_EXPECT_CASE3,
    BINARY_CONDITIONAL_EXPECT_CASE4,
    BINARY_CONDITIONAL_EXPECT_CASE5,
    BINARY_CONDITIONAL_EXPECT_CASE6,
} from '../../../resources_cpp/cfg/binaryConditional/binaryConditionalSampleExpects';
import {
    POINTER_EXPECT_CASE1,
    POINTER_EXPECT_CASE2,
    POINTER_EXPECT_CASE3,
} from '../../../resources_cpp/cfg/pointer/pointerExprExpects'
import {
    REFERENCE_EXPECT_CASE1,
    REFERENCE_EXPECT_CASE2,
    REFERENCE_EXPECT_CASE3,
    REFERENCE_EXPECT_CASE4,
} from '../../../resources_cpp/cfg/reference/referenceExpects';
import {
    DATA_STRUCT_EXPECT_VECTOR,
    DATA_STRUCT_EXPECT_SET,
    DATA_STRUCT_EXPECT_MAP,
    DATA_STRUCT_EXPECT_MAP2,
    DATA_STRUCT_EXPECT_QUEUE,
    DATA_STRUCT_EXPECT_DEQUE,
    DATA_STRUCT_EXPECT_STACK,
    DATA_STRUCT_EXPECT_LIST
} from '../../../resources_cpp/cfg/dataStruct/dataStructExpects';
import {
    COMPOUND_LITERAL_EXPECT_CASE1,
    COMPOUND_LITERAL_EXPECT_CASE2,
    COMPOUND_LITERAL_EXPECT_CASE3,
    COMPOUND_LITERAL_EXPECT_CASE4,
    COMPOUND_LITERAL_EXPECT_CASE5,
} from '../../../resources_cpp/cfg/compoundLiteral/compoundLiteralExprExpects';
import {
    TEMPLATE_EXPECT_CASE1,
    TEMPLATE_EXPECT_CASE2,
    TEMPLATE_EXPECT_CASE3, TEMPLATE_EXPECT_CASE4, TEMPLATE_EXPECT_CASE5, TEMPLATE_EXPECT_CASE6,
    TEMPLATE_MYCONTAINER_CLASS,
} from '../../../resources_cpp/cfg/template/templateExpects';
import {
    OPERATOR_EXPECT_RETURN,
    OPERATOR_EXPECT_NO_RETURN,
    OPERATOR_EXPECT_CASE1,
    OPERATOR_EXPECT_CASE2,
    OPERATOR_EXPECT_CASE3,
    OPERATOR_EXPECT_CASE4,
    OPERATOR_EXPECT_CASE5,
} from '../../../resources_cpp/cfg/operators/cppOperatorExpects';
import {
    LAMBDA_EXPECT_CASE1,
    LAMBDA_EXPECT_CASE2,
    LAMBDA_EXPECT_CASE3,
    LAMBDA_EXPECT_CASE4
} from '../../../resources_cpp/cfg/lambdaFunc/lambdaFuncExpects';
import {
    THROW_EXPECT_CASE1,
    THROW_EXPECT_CASE2
} from '../../../resources_cpp/cfg/throw/throwExpects';
import {
    CAST_EXPECT_CASE1,
    CAST_EXPECT_CASE2,
    CAST_EXPECT_CASE3,
    CAST_EXPECT_CASE4,
    CAST_EXPECT_CASE5,
    CAST_EXPECT_CASE6,
} from '../../../resources_cpp/cfg/cast/castSampleExpects';
import {
    NULLSTMT_EXPECT_CASE1,
    NULLSTMT_EXPECT_CASE2,
    NULLSTMT_EXPECT_CASE3,
    NULLSTMT_EXPECT_CASE4,
    NULLSTMT_EXPECT_CASE5,
    NULLSTMT_EXPECT_CASE6,
    NULLSTMT_EXPECT_CASE7,
    NULLSTMT_EXPECT_CASE8,
    NULLSTMT_EXPECT_CASE9,
    NULLSTMT_EXPECT_CASE10,
    NULLSTMT_EXPECT_CASE11,
} from '../../../resources_cpp/cfg/nullStmt/nullStmtExpects';
import {
    BUILT_IN_EXPECT_CASE1,
    BUILT_IN_EXPECT_CASE2,
    BUILT_IN_EXPECT_CASE3,
    BUILT_IN_EXPECT_CASE4,
} from '../../../resources_cpp/cfg/builtInAndSTLFunc/builtInAndSTLFunctionExpects';
import {
    DERIVED_DATA_TYPE_EXPECT_CLASS,
    DERIVED_DATA_TYPE_EXPECT_CLASS2,
    DERIVED_DATA_TYPE_EXPECT_STRUCT
} from '../../../resources_cpp/cfg/derivedDataType/derivedDataTypeExpects';
import {
    DELETE_EXPECT_CASE1,
    DELETE_EXPECT_CASE2,
    DELETE_EXPECT_CASE3,
    DELETE_EXPECT_CASE4,
} from '../../../resources_cpp/cfg/delete/deleteExprExpects';
import { IOSTREAM_EXPECT_CASE1 } from '../../../resources_cpp/cfg/iostream/iostreamExpects';
import {NULLPTR_EXPECT_CASE1} from '../../../resources_cpp/cfg/nullPtr/nullPtrSampleExpects';
import { BASE_DATA_TYPE_EXPECT_MAIN } from '../../../resources_cpp/cfg/baseDataType/baseDataTypeExpects';
import {WHILE_CONTINUE_EXPECT_MAIN} from '../../../resources_cpp/cfg/whileContinue/whileContinueSampleExpects';
import { assertClassBlocksEqual, testBlocks } from '../../common';
import { Scene } from '../../../../src';
import {
    BASE_CLASS_EXPECT,
    DERIVED_CLASS_EXPECT,
    LEFT_CLASS_EXPECT, MAIN_EXPECT,
    RIGHT_CLASS_EXPECT,
} from '../../../resources_cpp/cfg/class/classExpect';
import { LAZY_IMPORT_CASE1_CLASS } from '../../../resources_cpp/cfg/lazyImport/lazyImportCase1/lazyImportCase1Expect';
import {
    CALL_OBJECT_EXPECT,
    DEFINE_OBJECT_EXPECT,
} from '../../../resources_cpp/cfg/lazyImport/lazyImportCase2/lazyImportCase2Expect';
import { MapDemo_EXPECT } from '../../../resources_cpp/cfg/lazyImport/lazyImportCase3/lazyImportCase3Expect';
import { NativeCallArkTS_EXPECT } from '../../../resources_cpp/cfg/lazyImport/lazyImportCase4/lazyImportCase4Expect';
import {
    CallbackToArkTS_EXPECT,
    Napi_AddPropertyInt32_EXPECT,
} from '../../../resources_cpp/cfg/lazyImport/lazyImportCase5/lazyImportCase5Expect';
import { CallFunction_EXPECT } from '../../../resources_cpp/cfg/lazyImport/lazyImportCase6/lazyImportCase6Expect';
import { ModifyObject_EXPECT } from '../../../resources_cpp/cfg/lazyImport/lazyImportCase7/lazyImportCase7Expect';
import { NativeCallArkTS8_EXPECT } from '../../../resources_cpp/cfg/lazyImport/lazyImportCase8/lazyImportCase8Expect';


describe('CfgTest', () => {
    it('case1: conditional operator', () => {
        const scene = buildScene('conditionalOperator');
        testBlocks(scene, 'conditionalOperator.cpp', 'case1', CONDITIONAL_OPERATOR_EXPECT_CASE1.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'case2', CONDITIONAL_OPERATOR_EXPECT_CASE2.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'case3', CONDITIONAL_OPERATOR_EXPECT_CASE3.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'case4', CONDITIONAL_OPERATOR_EXPECT_CASE4.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'case5', CONDITIONAL_OPERATOR_EXPECT_CASE5.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'case6', CONDITIONAL_OPERATOR_EXPECT_CASE6.blocks);
        testBlocks(scene, 'conditionalOperator.cpp', 'case7', CONDITIONAL_OPERATOR_EXPECT_CASE7.blocks);
    });
    it('case2: if statement', () => {
        const scene = buildScene('if');
        testBlocks(scene, 'ifSample.cpp', 'case1', IF_EXPECT_CASE1.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case2', IF_EXPECT_CASE2.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case3', IF_EXPECT_CASE3.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case4', IF_EXPECT_CASE4.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case5', IF_EXPECT_CASE5.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case6', IF_EXPECT_CASE6.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case7', IF_EXPECT_CASE7.blocks);
    });

    it('case3: switch statement', () => {
        const scene = buildScene('switch');
        testBlocks(scene, 'switchSample.cpp', 'case1', SWITCH_EXPECT_CASE1.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case2', SWITCH_EXPECT_CASE2.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case3', SWITCH_EXPECT_CASE3.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case4', SWITCH_EXPECT_CASE4.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case5', SWITCH_EXPECT_CASE5.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case6', SWITCH_EXPECT_CASE6.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case7', SWITCH_EXPECT_CASE7.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case8', SWITCH_EXPECT_CASE8.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case9', SWITCH_EXPECT_CASE9.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case10', SWITCH_EXPECT_CASE10.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case11', SWITCH_EXPECT_CASE11.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case12', SWITCH_EXPECT_CASE12.blocks);
        testBlocks(scene, 'switchSample.cpp', 'case13', SWITCH_EXPECT_CASE13.blocks);
    });

    it('case4: loop statement', () => {
            const scene = buildScene('loop');
        testBlocks(scene, 'loopSample.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case2', LOOP_EXPECT_CASE2.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case3', LOOP_EXPECT_CASE3.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case4', LOOP_EXPECT_CASE4.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case5', LOOP_EXPECT_CASE5.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case6', LOOP_EXPECT_CASE6.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case7', LOOP_EXPECT_CASE7.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case8', LOOP_EXPECT_CASE8.blocks);
        testBlocks(scene, 'loopSample.cpp', 'case9', LOOP_EXPECT_CASE9.blocks);
        },
    );
    it('case5: while-continue statement', () => {
            const scene = buildScene('whileContinue');
        testBlocks(scene, 'whileContinueSample.cpp', 'main', WHILE_CONTINUE_EXPECT_MAIN.blocks);
        },
    );
    it('case6: goto statement', () => {
            const scene = buildScene('goto');
        testBlocks(scene, 'gotoSample.cpp', 'case1', GOTO_EXPECT_CASE1.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case2', GOTO_EXPECT_CASE2.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case3', GOTO_EXPECT_CASE3.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case4', GOTO_EXPECT_CASE4.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case5', GOTO_EXPECT_CASE5.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case6', GOTO_EXPECT_CASE6.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case7', GOTO_EXPECT_CASE7.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case8', GOTO_EXPECT_CASE8.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case9', GOTO_EXPECT_CASE9.blocks);
        testBlocks(scene, 'gotoSample.cpp', 'case10', GOTO_EXPECT_CASE10.blocks);
        },
    );
    it('case7: binaryCondition', () => {
            const scene = buildScene('binaryConditional');
        testBlocks(scene, 'binaryConditionalSample.cpp', 'case1', BINARY_CONDITIONAL_EXPECT_CASE1.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'case2', BINARY_CONDITIONAL_EXPECT_CASE2.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'case3', BINARY_CONDITIONAL_EXPECT_CASE3.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'case4', BINARY_CONDITIONAL_EXPECT_CASE4.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'case5', BINARY_CONDITIONAL_EXPECT_CASE5.blocks);
        testBlocks(scene, 'binaryConditionalSample.cpp', 'case6', BINARY_CONDITIONAL_EXPECT_CASE6.blocks);
        },
    );
});


describe('Type Test', () => {
    it('case1: base dataType', () => {
            const scene = buildScene('baseDataType');
        testBlocks(scene, 'baseDataType.cpp', 'main', BASE_DATA_TYPE_EXPECT_MAIN.blocks);
        },
    );
    it('case2: pointer Type', () => {
            const scene = buildScene('pointer');
        testBlocks(scene, 'pointerExpr.cpp', 'ptrType', POINTER_EXPECT_CASE1.blocks);
        testBlocks(scene, 'pointerExpr.cpp', 'basePtrOp', POINTER_EXPECT_CASE2.blocks);
        testBlocks(scene, 'pointerExpr.cpp', 'multiLevelPtrOp', POINTER_EXPECT_CASE3.blocks);
        },
    );
    it('case3: reference Type', () => {
            const scene = buildScene('reference');
        testBlocks(scene, 'reference.cpp', 'baseLeftRefer', REFERENCE_EXPECT_CASE1.blocks);
        testBlocks(scene, 'reference.cpp', 'pointRefer', REFERENCE_EXPECT_CASE2.blocks);
        testBlocks(scene, 'reference.cpp', 'myClassRefer', REFERENCE_EXPECT_CASE3.blocks);
        testBlocks(scene, 'reference.cpp', 'baseRightRefer', REFERENCE_EXPECT_CASE4.blocks);
        },
    );
    it('case4: Derived Class', () => {
            const scene = buildScene('derivedDataType');
            testBlocksClass(scene, 'derivedDataType.cpp', 'MyClass', DERIVED_DATA_TYPE_EXPECT_CLASS);
            testBlocksClass(scene, 'derivedDataType.cpp', 'DefaultClass', DERIVED_DATA_TYPE_EXPECT_CLASS2);
            testBlocksClass(scene, 'derivedDataType.cpp', 'MyStruct', DERIVED_DATA_TYPE_EXPECT_STRUCT);
        },
    );
    it('case5: DataStruct Test', () => {
            const scene = buildScene('dataStruct');
        testBlocks(scene, 'dataStruct.cpp', 'vectorTest', DATA_STRUCT_EXPECT_VECTOR.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'setTest', DATA_STRUCT_EXPECT_SET.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'mapTest', DATA_STRUCT_EXPECT_MAP.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'unorderedMapTest', DATA_STRUCT_EXPECT_MAP2.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'queueTest', DATA_STRUCT_EXPECT_QUEUE.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'dequeTest', DATA_STRUCT_EXPECT_DEQUE.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'stackTest', DATA_STRUCT_EXPECT_STACK.blocks);
        testBlocks(scene, 'dataStruct.cpp', 'listTest', DATA_STRUCT_EXPECT_LIST.blocks);
        },
    );
    it('case6: NullPtr Test', () => {
            const scene = buildScene('nullPtr');
        testBlocks(scene, 'nullPtrSample.cpp', 'case1', NULLPTR_EXPECT_CASE1.blocks);
        },
    );
    it('case7: CompoundLiteral Test', () => {
            const scene = buildScene('compoundLiteral');
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'case1', COMPOUND_LITERAL_EXPECT_CASE1.blocks);
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'case2', COMPOUND_LITERAL_EXPECT_CASE2.blocks);
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'case3', COMPOUND_LITERAL_EXPECT_CASE3.blocks);
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'case4', COMPOUND_LITERAL_EXPECT_CASE4.blocks);
        testBlocks(scene, 'compoundLiteralExpr.cpp', 'case5', COMPOUND_LITERAL_EXPECT_CASE5.blocks);
        },
    );

    it('case:8 Template Test', () => {
            const scene = buildScene('template');
        testBlocks(scene, 'template.cpp', 'max1', TEMPLATE_EXPECT_CASE1.blocks);
        testBlocks(scene, 'template.cpp', 'max2', TEMPLATE_EXPECT_CASE2.blocks);
        testBlocks(scene, 'template.cpp', 'printPair', TEMPLATE_EXPECT_CASE3.blocks);
        testBlocksClass(scene, 'template.cpp', 'MyContainer', TEMPLATE_MYCONTAINER_CLASS);
        testBlocks(scene, 'template.cpp', 'main', TEMPLATE_EXPECT_CASE4.blocks);
        testBlocks(scene, 'template.cpp', 'sum', TEMPLATE_EXPECT_CASE5.blocks);
        testBlocks(scene, 'template.cpp', 'instantiation3', TEMPLATE_EXPECT_CASE6.blocks);
        },
    );

    it('case9: class Test', () => {
        const scene = buildScene('class');
        testBlocksClass(scene, 'classSample.cpp', 'Base', BASE_CLASS_EXPECT);
        testBlocksClass(scene, 'classSample.cpp', 'Left', LEFT_CLASS_EXPECT);
        testBlocksClass(scene, 'classSample.cpp', 'Right', RIGHT_CLASS_EXPECT);
        testBlocksClass(scene, 'classSample.cpp', 'Derived', DERIVED_CLASS_EXPECT);
        testBlocks(scene, 'classSample.cpp', 'main', MAIN_EXPECT.blocks);
    });



});
describe('Function Test', () => {
    it('case1: return value', () => {
            const scene = buildScene('operators');
        testBlocks(scene, 'cppOperators.cpp', 'returnValue', OPERATOR_EXPECT_RETURN.blocks);
        },
    );
    it('case2: no return value', () => {
            const scene = buildScene('operators');
        testBlocks(scene, 'cppOperators.cpp', 'noReturnValue', OPERATOR_EXPECT_NO_RETURN.blocks);
        },
    );

    it('case3: Lambda Function Test', () => {
            const scene = buildScene('lambdaFunc');
        testBlocks(scene, 'lambdaFuncSample.cpp', 'case1', LAMBDA_EXPECT_CASE1.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'case2', LAMBDA_EXPECT_CASE2.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'case3', LAMBDA_EXPECT_CASE3.blocks);
        testBlocks(scene, 'lambdaFuncSample.cpp', 'case4', LAMBDA_EXPECT_CASE4.blocks);
        },
    );

    it('case4: delete Expression Test', () => {
            const scene = buildScene('delete');
        testBlocks(scene, 'deleteExpr.cpp', 'delObj', DELETE_EXPECT_CASE1.blocks);
        testBlocks(scene, 'deleteExpr.cpp', 'delArr', DELETE_EXPECT_CASE2.blocks);
        testBlocks(scene, 'deleteExpr.cpp', 'delClassObj', DELETE_EXPECT_CASE3.blocks);
        testBlocks(scene, 'deleteExpr.cpp', 'delMember', DELETE_EXPECT_CASE4.blocks);
        },
    );
});



describe('Other Test', () => {
    it('case1: arithmetic operator', () => {
            const scene = buildScene('operators');
        testBlocks(scene, 'cppOperators.cpp', 'arithmeticOperator', OPERATOR_EXPECT_CASE1.blocks);
        testBlocks(scene, 'cppOperators.cpp', 'relationOperator', OPERATOR_EXPECT_CASE2.blocks);
        testBlocks(scene, 'cppOperators.cpp', 'componentOperator', OPERATOR_EXPECT_CASE3.blocks);
        testBlocks(scene, 'cppOperators.cpp', 'bitOperator', OPERATOR_EXPECT_CASE4.blocks);
        testBlocks(scene, 'cppOperators.cpp', 'otherOperator', OPERATOR_EXPECT_CASE5.blocks);
        },
    );
    it('case2: try catch throw', () => {
            const scene = buildScene('throw');
        testBlocks(scene, 'throwSample.cpp', 'division', THROW_EXPECT_CASE1.blocks);
        testBlocks(scene, 'throwSample.cpp', 'main', THROW_EXPECT_CASE2.blocks);
        },
    );
    it('case3: iostream', () => {
            const scene = buildScene('iostream');
        testBlocks(scene, 'iostreamTest.cpp', 'main', IOSTREAM_EXPECT_CASE1.blocks);
        },
    );
    it('case4: Cast Test', () => {
            const scene = buildScene('cast');
        testBlocks(scene, 'castSample.cpp', 'CXXStaticCastTest', CAST_EXPECT_CASE1.blocks);
        testBlocks(scene, 'castSample.cpp',  'cStyleCastTest', CAST_EXPECT_CASE2.blocks);
        testBlocks(scene, 'castSample.cpp', 'CXXConstCastTest', CAST_EXPECT_CASE3.blocks);
        testBlocks(scene, 'castSample.cpp', 'CXXDynamicCastTest', CAST_EXPECT_CASE4.blocks);
        testBlocks(scene, 'castSample.cpp', 'CXXReinterpretCastTest', CAST_EXPECT_CASE5.blocks);
        testBlocks(scene, 'castSample.cpp', 'CXXFunctionalCastTest', CAST_EXPECT_CASE6.blocks);
        },
    );
    it('case5: NullStmt Test', () => {
            const scene = buildScene('nullStmt');
        testBlocks(scene, 'nullStmtSample.cpp', 'case1', NULLSTMT_EXPECT_CASE1.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case2', NULLSTMT_EXPECT_CASE2.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case3', NULLSTMT_EXPECT_CASE3.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case4', NULLSTMT_EXPECT_CASE4.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case5', NULLSTMT_EXPECT_CASE5.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case6', NULLSTMT_EXPECT_CASE6.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case7', NULLSTMT_EXPECT_CASE7.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case8', NULLSTMT_EXPECT_CASE8.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case9', NULLSTMT_EXPECT_CASE9.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case10', NULLSTMT_EXPECT_CASE10.blocks);
        testBlocks(scene, 'nullStmtSample.cpp', 'case11', NULLSTMT_EXPECT_CASE11.blocks);
        },
    );
    it('case6: BuiltInAndSTLFunc Test', () => {
            const scene = buildScene('builtInAndSTLFunc');
        testBlocks(scene, 'builtInAndSTLFunction.cpp', 'CXXTypeidExprTest', BUILT_IN_EXPECT_CASE1.blocks);
        testBlocks(scene, 'builtInAndSTLFunction.cpp', 'ArrayTypeTraitTest', BUILT_IN_EXPECT_CASE2.blocks);
        testBlocks(scene, 'builtInAndSTLFunction.cpp', 'CXXNoexceptExprTest', BUILT_IN_EXPECT_CASE3.blocks);
        testBlocks(scene, 'builtInAndSTLFunction.cpp', 'AtomicExprTest', BUILT_IN_EXPECT_CASE4.blocks);
        },
    );
});


describe('Lazy Import Test', () => {
    it('case1: lazy import case1', () => {
        const scene = buildScene('lazyImport/lazyImportCase1');
        testBlocksClass(scene, 'lazyImportCase1.cpp', 'GlobalConfig', LAZY_IMPORT_CASE1_CLASS);
        },
    );
    it('case2: lazy import case2', () => {
            const scene = buildScene('lazyImport/lazyImportCase2');
            testBlocks(scene, 'lazyImportCase2.cpp', 'DefineObject', DEFINE_OBJECT_EXPECT.blocks);
            testBlocks(scene, 'lazyImportCase2.cpp', 'CallObject', CALL_OBJECT_EXPECT.blocks);
        },
    );
    it('case3: lazy import case3', () => {
            const scene = buildScene('lazyImport/lazyImportCase3');
            testBlocks(scene, 'lazyImportCase3.cpp', 'MapDemo', MapDemo_EXPECT.blocks);
        },
    );
    it('case4: lazy import case4', () => {
            const scene = buildScene('lazyImport/lazyImportCase4');
            testBlocks(scene, 'lazyImportCase4.cpp', 'NativeCallArkTS', NativeCallArkTS_EXPECT.blocks);
        },
    );
    it('case5: lazy import case5', () => {
            const scene = buildScene('lazyImport/lazyImportCase5');
            testBlocks(scene, 'lazyImportCase5.cpp', 'Napi_AddPropertyInt32', Napi_AddPropertyInt32_EXPECT.blocks);
            testBlocks(scene, 'lazyImportCase5.cpp', 'CallbackToArkTS', CallbackToArkTS_EXPECT.blocks);
        },
    );
    it('case6: lazy import case6', () => {
            const scene = buildScene('lazyImport/lazyImportCase6');
            testBlocks(scene, 'lazyImportCase6.cpp', 'CallFunction', CallFunction_EXPECT.blocks);
        },
    );
    it('case7: lazy import case7', () => {
            const scene = buildScene('lazyImport/lazyImportCase7');
            testBlocks(scene, 'lazyImportCase7.cpp', 'ModifyObject', ModifyObject_EXPECT.blocks);
        },
    );
    it('case8: lazy import case8', () => {
            const scene = buildScene('lazyImport/lazyImportCase8');
            testBlocks(scene, 'lazyImportCase8.cpp', 'NativeCallArkTS', NativeCallArkTS8_EXPECT.blocks);
        },
    );
});


const BASE_DIR = 'tests/resources_cpp/cfg';

function buildScene(folderName: string): Scene {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(BASE_DIR, folderName));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    return scene;
}

function testBlocksClass(scene: Scene, filePath: string, className: string, expectBlocks: any): void {
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
        const classBlock = classBlockMap.get(method.getName());
        if (classBlock) {
            assertClassBlocksEqual(method, classBlock);
        }
    })
}
