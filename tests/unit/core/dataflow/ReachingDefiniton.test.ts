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
    Scene,
    SceneConfig,
} from '../../../../src/index';
import { describe, it } from 'vitest';
import path from 'path';
import {
    CONDITIONAL_OPERATOR_EXPECT_CASE1,
    CONDITIONAL_OPERATOR_EXPECT_CASE2
} from '../../../resources/reachingDef/conditionalOperator/ConditionalOperatorExpect';
import {
    FOR_LOOP_EXPECT_CASE,
    WHILE_LOOP_EXPECT_CASE,
    DO_WHILE_LOOP_EXPECT_CASE, FOR_OF_LOOP_EXPECT_CASE, FOR_IN_LOOP_EXPECT_CASE
} from '../../../resources/reachingDef/loop/LoopExpect';
import {
    SWITCH_EXPECT_CASE1,
    SWITCH_EXPECT_CASE2,
    SWITCH_EXPECT_CASE3
} from '../../../resources/reachingDef/switch/SwitchExpect';
import {
    TRY_CATCH_EXPECT_CASE1,
    TRY_CATCH_EXPECT_CASE2,
    TRY_CATCH_EXPECT_CASE3
} from '../../../resources/reachingDef/tryCatch/TryCatchExpect';
import { testReachingDef } from '../../common';

describe('ReachingDefTest', () => {
    it('case1: conditional operator', () => {
        const scene = buildScene('conditionalOperator');
        const fileName = 'ConditionalOperatorSample.ts';
        testReachingDef(scene, fileName, 'case1', CONDITIONAL_OPERATOR_EXPECT_CASE1);
        testReachingDef(scene, fileName, 'case2', CONDITIONAL_OPERATOR_EXPECT_CASE2);
    });
    it('case2: loop', () => {
        const scene = buildScene('loop');
        const fileName = 'LoopSample.ts';
        testReachingDef(scene, fileName, 'forLoopCase', FOR_LOOP_EXPECT_CASE);
        testReachingDef(scene, fileName, 'whileLoopCase', WHILE_LOOP_EXPECT_CASE);
        testReachingDef(scene, fileName, 'doWhileLoopCase', DO_WHILE_LOOP_EXPECT_CASE);
        testReachingDef(scene, fileName, 'forInLoopCase', FOR_IN_LOOP_EXPECT_CASE);
        testReachingDef(scene, fileName, 'forOfLoopCase', FOR_OF_LOOP_EXPECT_CASE);
    });
    it('case3: switch', () => {
        const scene = buildScene('switch');
        const fileName = 'SwitchSample.ts';
        testReachingDef(scene, fileName, 'case1', SWITCH_EXPECT_CASE1);
        testReachingDef(scene, fileName, 'case2', SWITCH_EXPECT_CASE2);
        testReachingDef(scene, fileName, 'case3', SWITCH_EXPECT_CASE3);
    });

    it('case4: tryCatch', () => {
        const scene = buildScene('tryCatch');
        const fileName = 'TryCatchSample.ts';
        testReachingDef(scene, fileName, 'case1', TRY_CATCH_EXPECT_CASE1);
        testReachingDef(scene, fileName, 'case2', TRY_CATCH_EXPECT_CASE2);
        testReachingDef(scene, fileName, 'case3', TRY_CATCH_EXPECT_CASE3);
    });
});

const BASE_DIR = 'tests/resources/reachingDef';

function buildScene(folderName: string): Scene {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(BASE_DIR, folderName));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    return scene;
}
