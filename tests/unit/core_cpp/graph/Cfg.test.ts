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
import { describe, it } from 'vitest';
import path from 'path';
import {
    CONDITIONAL_OPERATOR_EXPECT_CASE1,
    CONDITIONAL_OPERATOR_EXPECT_CASE2,
    CONDITIONAL_OPERATOR_EXPECT_CASE3,
    CONDITIONAL_OPERATOR_EXPECT_CASE4,
    CONDITIONAL_OPERATOR_EXPECT_CASE5,
    CONDITIONAL_OPERATOR_EXPECT_CASE6,
    CONDITIONAL_OPERATOR_EXPECT_CASE7,
} from '../../../resources/cfg/conditionalOperator/ConditionalOperatorExpect';
import {
    SWITCH_EXPECT_CASE1,
    SWITCH_EXPECT_CASE10,
    SWITCH_EXPECT_CASE11,
    SWITCH_EXPECT_CASE12,
    SWITCH_EXPECT_CASE13,
    SWITCH_EXPECT_CASE2,
    SWITCH_EXPECT_CASE3,
    SWITCH_EXPECT_CASE4,
    SWITCH_EXPECT_CASE5,
    SWITCH_EXPECT_CASE6,
    SWITCH_EXPECT_CASE7,
    SWITCH_EXPECT_CASE8,
    SWITCH_EXPECT_CASE9,
} from '../../../resources_cpp/cfg/switch/SwitchExpect';
import { LOOP_EXPECT_CASE1, LOOP_EXPECT_CASE2 } from '../../../resources/cfg/loop/LoopExpect';
import { assertClassBlocksEqual, showTestBlocks, testBlocks } from '../../common';
import { Scene } from '../../../../src/Scene_cpp';


describe('CfgTest', () => {
    it('case1: conditional operator', () => {
        const scene = buildScene('conditionalOperator');
        testBlocks(scene, 'conditionalOperator.cpp', 'case1', CONDITIONAL_OPERATOR_EXPECT_CASE1.blocks);
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
        testBlocks(scene, 'ifSample.cpp', 'case1', CONDITIONAL_OPERATOR_EXPECT_CASE1.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case2', CONDITIONAL_OPERATOR_EXPECT_CASE2.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case3', CONDITIONAL_OPERATOR_EXPECT_CASE3.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case4', CONDITIONAL_OPERATOR_EXPECT_CASE4.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case5', CONDITIONAL_OPERATOR_EXPECT_CASE5.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case6', CONDITIONAL_OPERATOR_EXPECT_CASE6.blocks);
        testBlocks(scene, 'ifSample.cpp', 'case7', CONDITIONAL_OPERATOR_EXPECT_CASE7.blocks);
    });

    // it('case3: switch statement', () => {
    //     const scene = buildScene('switch');
    //     testBlocks(scene, 'switchSample.cpp', 'case1', SWITCH_EXPECT_CASE1.blocks);
    //     testBlocks(scene, 'switchSample.cpp', 'case2', SWITCH_EXPECT_CASE2.blocks);
    //     testBlocks(scene, 'switchSample.cpp', 'case3', SWITCH_EXPECT_CASE3.blocks);
    //     testBlocks(scene, 'switchSample.cpp', 'case4', SWITCH_EXPECT_CASE4.blocks);
    //     testBlocks(scene, 'switchSample.cpp', 'case5', SWITCH_EXPECT_CASE5.blocks);
    //     testBlocks(scene, 'switchSample.cpp', 'case6', SWITCH_EXPECT_CASE6.blocks);
    //     testBlocks(scene, 'switchSample.cpp', 'case7', SWITCH_EXPECT_CASE7.blocks);
    //     testBlocks(scene, 'switchSample.cpp', 'case8', SWITCH_EXPECT_CASE8.blocks);
    //     testBlocks(scene, 'switchSample.cpp', 'case9', SWITCH_EXPECT_CASE9.blocks);
    //     testBlocks(scene, 'switchSample.cpp', 'case10', SWITCH_EXPECT_CASE10.blocks);
    //     testBlocks(scene, 'switchSample.cpp', 'case11', SWITCH_EXPECT_CASE11.blocks);
    //     testBlocks(scene, 'switchSample.cpp', 'case12', SWITCH_EXPECT_CASE12.blocks);
    //     testBlocks(scene, 'switchSample.cpp', 'case13', SWITCH_EXPECT_CASE13.blocks);
    // });

    it('case4: loop statement', () => {
            const scene = buildScene('loop');
            testBlocks(scene, 'LoopSample.ts', 'case1', LOOP_EXPECT_CASE1.blocks);
            testBlocks(scene, 'LoopSample.ts', 'case2', LOOP_EXPECT_CASE2.blocks);
        },
    );
    it('case5: while-continue statement', () => {
            const scene = buildScene('whileContinue');
            testBlocks(scene, 'LoopSample.ts', 'case1', LOOP_EXPECT_CASE1.blocks);
            testBlocks(scene, 'LoopSample.ts', 'case2', LOOP_EXPECT_CASE2.blocks);
        },
    );
    it('case6: goto statement', () => {
            const scene = buildScene('goto');
            testBlocks(scene, 'LoopSample.ts', 'case1', LOOP_EXPECT_CASE1.blocks);
            testBlocks(scene, 'LoopSample.ts', 'case2', LOOP_EXPECT_CASE2.blocks);
        },
    );
    it('case7: binaryCondition', () => {
            const scene = buildScene('binaryCondition');
            testBlocks(scene, 'binaryConditionSample.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
            testBlocks(scene, 'binaryConditionSample.cpp', 'case2', LOOP_EXPECT_CASE2.blocks);
        },
    );
});


describe('Type Test', () => {
    it('case1: base dataType', () => {
            const scene = buildScene('baseDataType');
            testBlocks(scene, 'baseDataType.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );
    it('case2: pointer Type', () => {
            const scene = buildScene('pointer');
            testBlocks(scene, 'pointer.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );
    it('case3: reference Type', () => {
            const scene = buildScene('reference');
            testBlocks(scene, 'reference.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );
    it('case4: Derived Class', () => {
            const scene = buildScene('derivedDataType');
            testBlocksClass(scene, 'derivedDataType.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );
    it('case5: DataStruct Test', () => {
            const scene = buildScene('dataStruct');
            testBlocks(scene, 'dataStruct.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );
    it('case6: NullPtr Test', () => {
            const scene = buildScene('nullPtr');
            testBlocks(scene, 'nullPtrSample.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );
    it('case7: CompoundLiteral Test', () => {
            const scene = buildScene('compoundLiteral');
            testBlocks(scene, 'compoundLiteralSample.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );

    it('case:8 Template Test', () => {
            const scene = buildScene('template');
            testBlocks(scene, 'template.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );



});
describe('Function Test', () => {
    it('case1: return value', () => {
            const scene = buildScene('operators');
            testBlocks(scene, 'cppOperators.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );
    it('case2: no return value', () => {
            const scene = buildScene('operators');
            testBlocks(scene, 'cppOperators.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );

    it('case3: Lambda Function Test', () => {
            const scene = buildScene('lambdaFunc');
            testBlocks(scene, 'lambdaFunc.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );
});



describe('Other Test', () => {
    it('case1: arithmetic operator', () => {
            const scene = buildScene('operators');
            testBlocks(scene, 'cppOperators.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );
    it('case2: try catch throw', () => {
            const scene = buildScene('throw');
            testBlocks(scene, 'throwSample.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );
    it('case3: iostream', () => {
            const scene = buildScene('iostream');
            testBlocks(scene, 'iostreamTest.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );
    it('case4: Cast Test', () => {
            const scene = buildScene('cast');
            testBlocks(scene, 'castSample.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );
    it('case5: NullStmt Test', () => {
            const scene = buildScene('nullStmt');
            testBlocks(scene, 'nullStmt.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
        },
    );
    it('case6: BuiltInAndSTLFunc Test', () => {
            const scene = buildScene('builtInAndSTLFunc');
            testBlocks(scene, 'builtInAndSTLFunc.cpp', 'case1', LOOP_EXPECT_CASE1.blocks);
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

function testBlocksClass(scene: Scene, filePath: string, className: string, expectBlocks: any[]): void {
    const arkFile = scene.getFiles().find((file) => file.getName().endsWith(filePath));
    const arkClass = arkFile?.getClasses().find(arkClass => (arkClass.getName() === className));
    const classBlockMap = new Map<String, BasicBlock[]>();
    for (const block of expectBlocks) {
        classBlockMap.set(block.methodName, block.blocks);
    }
    arkClass?.getMethods()?.forEach(method =>{
        let classBlock = classBlockMap.get(method.getName());
        if (classBlock !== undefined) {
            assertClassBlocksEqual(method, classBlock);
        }
    })
}
