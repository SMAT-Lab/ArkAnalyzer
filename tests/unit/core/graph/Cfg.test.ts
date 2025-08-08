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

import { ArkErrorCode } from '../../../../src/core/common/ArkError';
import {
    ArkConditionExpr,
    ArkIfStmt,
    ArkReturnVoidStmt,
    BasicBlock,
    Cfg,
    Local,
    RelationalBinaryOperator,
    Scene,
    SceneConfig,
    Stmt,
    ValueUtil,
} from '../../../../src/index';
import { describe, expect, it } from 'vitest';
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
    SWITCH_EXPECT_CASE14,
    SWITCH_EXPECT_CASE2,
    SWITCH_EXPECT_CASE3,
    SWITCH_EXPECT_CASE4,
    SWITCH_EXPECT_CASE5,
    SWITCH_EXPECT_CASE6,
    SWITCH_EXPECT_CASE7,
    SWITCH_EXPECT_CASE8,
    SWITCH_EXPECT_CASE9,
} from '../../../resources/cfg/switch/SwitchExpect';
import { LOOP_EXPECT_CASE1, LOOP_EXPECT_CASE2 } from '../../../resources/cfg/loop/LoopExpect';
import { testBlocks } from '../../common';
import {
    MIX_OF_STATEMENTS_EXPECT_CASE1,
    MIX_OF_STATEMENTS_EXPECT_CASE2,
    MIX_OF_STATEMENTS_EXPECT_CASE3,
    MIX_OF_STATEMENTS_EXPECT_CASE4,
} from '../../../resources/cfg/mixOfStatements/MixOfStatementsExpect';

describe('CfgTest', () => {
    it('case1: patching interface', () => {
        let cfg = new Cfg();
        let bb: BasicBlock = new BasicBlock();
        let startingStmt: Stmt = new ArkReturnVoidStmt();
        startingStmt.setCfg(cfg);
        bb.addStmtToFirst(startingStmt);
        cfg.setStartingStmt(startingStmt);

        cfg.addBlock(bb);
        let stmt0 = new ArkIfStmt(
            new ArkConditionExpr(new Local('%0'), ValueUtil.getOrCreateNumberConst(0),
                RelationalBinaryOperator.Equality),
        );
        let ans = cfg.insertAfter(stmt0, startingStmt);
        expect(ans).eq(1);

        let err0 = bb.validate();
        expect(err0.errCode).eq(ArkErrorCode.BB_MORE_THAN_ONE_BRANCH_RET_STMT);

        let stmt1 = new ArkIfStmt(
            new ArkConditionExpr(new Local('%1'), ValueUtil.getOrCreateNumberConst(1),
                RelationalBinaryOperator.Equality),
        );
        let stmt2 = new ArkIfStmt(
            new ArkConditionExpr(new Local('%2'), ValueUtil.getOrCreateNumberConst(2),
                RelationalBinaryOperator.Equality),
        );
        ans = cfg.insertAfter([stmt1, stmt2], startingStmt);
        expect(ans).eq(2);
        expect(
            cfg
                .getStmts()
                .map((stmt) => stmt.toString())
                .join('\n'),
        ).eq([startingStmt, stmt1, stmt2, stmt0].map((stmt) => stmt.toString()).join('\n'));

        let stmt3 = new ArkIfStmt(
            new ArkConditionExpr(new Local('%3'), ValueUtil.getOrCreateNumberConst(1),
                RelationalBinaryOperator.Equality),
        );
        let stmt4 = new ArkIfStmt(
            new ArkConditionExpr(new Local('%4'), ValueUtil.getOrCreateNumberConst(2),
                RelationalBinaryOperator.Equality),
        );

        ans = cfg.insertBefore([stmt3, stmt4], startingStmt);
        expect(ans).eq(2);
        expect(
            cfg
                .getStmts()
                .map((stmt) => stmt.toString())
                .join('\n'),
        ).eq([stmt3, stmt4, startingStmt, stmt1, stmt2, stmt0].map((stmt) => stmt.toString()).join('\n'));

        cfg.remove(stmt4);
        expect(
            cfg
                .getStmts()
                .map((stmt) => stmt.toString())
                .join('\n'),
        ).eq([stmt3, startingStmt, stmt1, stmt2, stmt0].map((stmt) => stmt.toString()).join('\n'));

        ans = cfg.insertAfter(stmt3, stmt4);
        expect(ans).eq(0);

        let err = cfg.validate();
        expect(err.errCode).eq(ArkErrorCode.OK);
    });

    it('case2: conditional operator', () => {
        const scene = buildScene('conditionalOperator');
        testBlocks(scene, 'ConditionalOperatorSample.ts', 'case1', CONDITIONAL_OPERATOR_EXPECT_CASE1.blocks);
        testBlocks(scene, 'ConditionalOperatorSample.ts', 'case2', CONDITIONAL_OPERATOR_EXPECT_CASE2.blocks);
        testBlocks(scene, 'ConditionalOperatorSample.ts', 'case3', CONDITIONAL_OPERATOR_EXPECT_CASE3.blocks);
        testBlocks(scene, 'ConditionalOperatorSample.ts', 'case4', CONDITIONAL_OPERATOR_EXPECT_CASE4.blocks);
        testBlocks(scene, 'ConditionalOperatorSample.ts', 'case5', CONDITIONAL_OPERATOR_EXPECT_CASE5.blocks);
        testBlocks(scene, 'ConditionalOperatorSample.ts', 'case6', CONDITIONAL_OPERATOR_EXPECT_CASE6.blocks);
        testBlocks(scene, 'ConditionalOperatorSample.ts', 'case7', CONDITIONAL_OPERATOR_EXPECT_CASE7.blocks);
    });

    it('case3: switch statement', () => {
        const scene = buildScene('switch');
        testBlocks(scene, 'SwitchSample.ts', 'case1', SWITCH_EXPECT_CASE1.blocks);
        testBlocks(scene, 'SwitchSample.ts', 'case2', SWITCH_EXPECT_CASE2.blocks);
        testBlocks(scene, 'SwitchSample.ts', 'case3', SWITCH_EXPECT_CASE3.blocks);
        testBlocks(scene, 'SwitchSample.ts', 'case4', SWITCH_EXPECT_CASE4.blocks);
        testBlocks(scene, 'SwitchSample.ts', 'case5', SWITCH_EXPECT_CASE5.blocks);
        testBlocks(scene, 'SwitchSample.ts', 'case6', SWITCH_EXPECT_CASE6.blocks);
        testBlocks(scene, 'SwitchSample.ts', 'case7', SWITCH_EXPECT_CASE7.blocks);
        testBlocks(scene, 'SwitchSample.ts', 'case8', SWITCH_EXPECT_CASE8.blocks);
        testBlocks(scene, 'SwitchSample.ts', 'case9', SWITCH_EXPECT_CASE9.blocks);
        testBlocks(scene, 'SwitchSample.ts', 'case10', SWITCH_EXPECT_CASE10.blocks);
        testBlocks(scene, 'SwitchSample.ts', 'case11', SWITCH_EXPECT_CASE11.blocks);
        testBlocks(scene, 'SwitchSample.ts', 'case12', SWITCH_EXPECT_CASE12.blocks);
        testBlocks(scene, 'SwitchSample.ts', 'case13', SWITCH_EXPECT_CASE13.blocks);
        testBlocks(scene, 'SwitchSample.ts', 'case14', SWITCH_EXPECT_CASE14.blocks);
    });

    it('case4: loop statement', () => {
            const scene = buildScene('loop');
            testBlocks(scene, 'LoopSample.ts', 'case1', LOOP_EXPECT_CASE1.blocks);
            testBlocks(scene, 'LoopSample.ts', 'case2', LOOP_EXPECT_CASE2.blocks);
        },
    );

    it('case5: mix of statements', () => {
        const scene = buildScene('mixOfStatements');
        testBlocks(scene, 'MixOfStatementsSample.ts', 'case1', MIX_OF_STATEMENTS_EXPECT_CASE1.blocks);
        testBlocks(scene, 'MixOfStatementsSample.ts', 'case2', MIX_OF_STATEMENTS_EXPECT_CASE2.blocks);
        testBlocks(scene, 'MixOfStatementsSample.ts', 'case3', MIX_OF_STATEMENTS_EXPECT_CASE3.blocks);
        testBlocks(scene, 'MixOfStatementsSample.ts', 'case4', MIX_OF_STATEMENTS_EXPECT_CASE4.blocks);
    });
});

const BASE_DIR = 'tests/resources/cfg';

function buildScene(folderName: string): Scene {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(BASE_DIR, folderName));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    return scene;
}
