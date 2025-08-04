/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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
    ArkConditionExpr,
    ArkIfStmt,
    ArkReturnVoidStmt,
    BasicBlock,
    Cfg,
    Local,
    RelationalBinaryOperator,
    Stmt,
} from '../../src/index';
import { describe, expect, it } from 'vitest';
import { AbstractFlowGraph } from '../../src/utils/CfgStructualAnalysis';
import { ValueUtil } from '../../src/core/common/ValueUtil';

function createStmtForBasicBlock(bb: BasicBlock, cfg: Cfg): void {
    const stmt = new ArkReturnVoidStmt();
    stmt.setCfg(cfg);
    bb.addStmt(stmt);
}

describe('CfgStructualAnalysisTest', () => {
    it('case1: structual analysis', () => {
        let cfg = new Cfg();
        let bbs: BasicBlock[] = [];
        let startingStmt: Stmt = new ArkReturnVoidStmt();
        startingStmt.setCfg(cfg);

        for (let i = 0; i < 9; i++) {
            let bb = new BasicBlock();
            bb.setId(i);
            bbs.push(bb);
        }

        bbs[0].addStmtToFirst(startingStmt);
        cfg.setStartingStmt(startingStmt);

        bbs[0].addSuccessorBlock(bbs[1]);

        createStmtForBasicBlock(bbs[1], cfg);
        bbs[1].addPredecessorBlock(bbs[0]);
        bbs[1].addSuccessorBlock(bbs[2]);
        bbs[1].addSuccessorBlock(bbs[3]);

        createStmtForBasicBlock(bbs[2], cfg);
        bbs[2].addPredecessorBlock(bbs[1]);
        bbs[2].addSuccessorBlock(bbs[3]);
        bbs[2].addSuccessorBlock(bbs[2]);
        bbs[2].addPredecessorBlock(bbs[2]);

        createStmtForBasicBlock(bbs[3], cfg);
        bbs[3].addPredecessorBlock(bbs[1]);
        bbs[3].addPredecessorBlock(bbs[2]);
        bbs[3].addSuccessorBlock(bbs[4]);
        bbs[3].addSuccessorBlock(bbs[5]);

        createStmtForBasicBlock(bbs[4], cfg);
        bbs[4].addPredecessorBlock(bbs[3]);
        bbs[4].addSuccessorBlock(bbs[8]);

        createStmtForBasicBlock(bbs[5], cfg);
        bbs[5].addPredecessorBlock(bbs[3]);
        bbs[5].addSuccessorBlock(bbs[6]);
        bbs[5].addSuccessorBlock(bbs[7]);

        createStmtForBasicBlock(bbs[6], cfg);
        bbs[6].addPredecessorBlock(bbs[5]);
        bbs[6].addSuccessorBlock(bbs[7]);

        createStmtForBasicBlock(bbs[7], cfg);
        bbs[7].addPredecessorBlock(bbs[5]);
        bbs[7].addPredecessorBlock(bbs[6]);
        bbs[7].addSuccessorBlock(bbs[8]);

        createStmtForBasicBlock(bbs[8], cfg);
        bbs[8].addPredecessorBlock(bbs[4]);
        bbs[8].addPredecessorBlock(bbs[7]);

        for (let i = 0; i < 9; i++) {
            cfg.addBlock(bbs[i]);
        }

        let afg = new AbstractFlowGraph(cfg);
        let order: number[] = [];
        afg.preOrder(afg.getEntry(), (block) => {
            if (block) {
                order.push(block?.getId());
            }
        })
        expect(order.join(',')).eq('0,1,2,3,4,5,6,7,8');
    });

    it('case2: structual analysis while', () => {
        let cfg = new Cfg();
        let bbs: BasicBlock[] = [];
        let startingStmt: Stmt = new ArkReturnVoidStmt();
        startingStmt.setCfg(cfg);

        for (let i = 0; i < 4; i++) {
            let bb = new BasicBlock();
            bb.setId(i);
            bbs.push(bb);
        }

        bbs[0].addStmtToFirst(startingStmt);
        cfg.setStartingStmt(startingStmt);

        bbs[0].addSuccessorBlock(bbs[1]);

        bbs[1].addPredecessorBlock(bbs[0]);
        bbs[1].addPredecessorBlock(bbs[2]);
        bbs[1].addSuccessorBlock(bbs[2]);
        bbs[1].addSuccessorBlock(bbs[3]);

        bbs[2].addPredecessorBlock(bbs[1]);
        bbs[2].addSuccessorBlock(bbs[1]);

        bbs[3].addPredecessorBlock(bbs[1]);
        
        for (let i = 0; i < 4; i++) {
            cfg.addBlock(bbs[i]);
        }

        let afg = new AbstractFlowGraph(cfg);

        let order: number[] = [];
        afg.preOrder(afg.getEntry(), (block) => {
            if (block) {
                order.push(block?.getId());
            }
        })
        expect(order.join(',')).eq('0,1,2,3');
    });

    it('case3: structual analysis do-while', () => {
        let cfg = new Cfg();
        let bbs: BasicBlock[] = [];
        let startingStmt: Stmt = new ArkReturnVoidStmt();
        startingStmt.setCfg(cfg);

        for (let i = 0; i < 5; i++) {
            let bb = new BasicBlock();
            bb.setId(i);
            bbs.push(bb);
        }

        bbs[0].addStmtToFirst(startingStmt);
        cfg.setStartingStmt(startingStmt);

        bbs[0].addSuccessorBlock(bbs[1]);

        bbs[1].addPredecessorBlock(bbs[0]);
        bbs[1].addPredecessorBlock(bbs[3]);
        bbs[1].addSuccessorBlock(bbs[2]);
        bbs[1].addSuccessorBlock(bbs[3]);

        bbs[2].addPredecessorBlock(bbs[1]);
        bbs[2].addSuccessorBlock(bbs[3]);

        bbs[3].addPredecessorBlock(bbs[1]);
        bbs[3].addPredecessorBlock(bbs[2]);
        bbs[3].addSuccessorBlock(bbs[1]);
        bbs[3].addSuccessorBlock(bbs[4]);

        bbs[3].addStmt(new ArkIfStmt(new ArkConditionExpr(new Local('temp'), ValueUtil.getBooleanConstant(true), RelationalBinaryOperator.Equality)));

        bbs[4].addPredecessorBlock(bbs[3]);
        
        for (let i = 0; i < 5; i++) {
            cfg.addBlock(bbs[i]);
        }

        let afg = new AbstractFlowGraph(cfg);

        let order: number[] = [];
        afg.preOrder(afg.getEntry(), (block) => {
            if (block) {
                order.push(block?.getId());
            }
        })
        expect(order.join(',')).eq('0,1,2,3,4');
    });

    it('case4: structual analysis do-while', () => {
        let cfg = new Cfg();
        let bbs: BasicBlock[] = [];
        let startingStmt: Stmt = new ArkReturnVoidStmt();
        startingStmt.setCfg(cfg);

        for (let i = 0; i < 6; i++) {
            let bb = new BasicBlock();
            bb.setId(i);
            bbs.push(bb);
        }

        bbs[0].addStmtToFirst(startingStmt);
        cfg.setStartingStmt(startingStmt);

        bbs[0].addSuccessorBlock(bbs[1]);

        bbs[1].addPredecessorBlock(bbs[0]);
        bbs[1].addPredecessorBlock(bbs[2]);
        bbs[1].addSuccessorBlock(bbs[2]);
        bbs[1].addSuccessorBlock(bbs[4]);

        bbs[2].addPredecessorBlock(bbs[1]);
        bbs[2].addPredecessorBlock(bbs[5]);
        bbs[2].addSuccessorBlock(bbs[1]);
        bbs[2].addSuccessorBlock(bbs[3]);
        bbs[2].addStmt(new ArkIfStmt(new ArkConditionExpr(new Local('temp'), ValueUtil.getBooleanConstant(true), RelationalBinaryOperator.Equality)));

        bbs[3].addPredecessorBlock(bbs[2]);
        bbs[3].addPredecessorBlock(bbs[4]);

        bbs[4].addPredecessorBlock(bbs[1]);
        bbs[4].addSuccessorBlock(bbs[3]);
        bbs[4].addSuccessorBlock(bbs[5]);

        bbs[5].addPredecessorBlock(bbs[4]);
        bbs[5].addSuccessorBlock(bbs[2]);
        
        for (let i = 0; i < 6; i++) {
            cfg.addBlock(bbs[i]);
        }

        let afg = new AbstractFlowGraph(cfg);

        let order: number[] = [];
        afg.preOrder(afg.getEntry(), (block) => {
            if (block) {
                order.push(block?.getId());
            }
        })
        expect(order.join(',')).eq('0,1,4,5,2,3');
    });

    it('case5: structual analysis for', () => {
        let cfg = new Cfg();
        let bbs: BasicBlock[] = [];
        let startingStmt: Stmt = new ArkReturnVoidStmt();
        startingStmt.setCfg(cfg);

        for (let i = 0; i < 7; i++) {
            let bb = new BasicBlock();
            bb.setId(i);
            bbs.push(bb);
        }

        bbs[0].addStmtToFirst(startingStmt);
        cfg.setStartingStmt(startingStmt);
        bbs[0].addSuccessorBlock(bbs[1]);

        bbs[1].addPredecessorBlock(bbs[0]);
        bbs[1].addPredecessorBlock(bbs[6]);
        bbs[1].addSuccessorBlock(bbs[2]);
        bbs[1].addSuccessorBlock(bbs[4]);
        bbs[1].addStmt(new ArkIfStmt(new ArkConditionExpr(new Local('temp'), ValueUtil.getBooleanConstant(true), RelationalBinaryOperator.Equality)));

        bbs[2].addPredecessorBlock(bbs[1]);
        bbs[2].addSuccessorBlock(bbs[3]);
        bbs[2].addSuccessorBlock(bbs[6]);
        
        bbs[3].addPredecessorBlock(bbs[2]);
        bbs[3].addSuccessorBlock(bbs[4]);
        bbs[3].addSuccessorBlock(bbs[5]);
        
        bbs[4].addPredecessorBlock(bbs[1]);
        bbs[4].addPredecessorBlock(bbs[3]);

        bbs[5].addPredecessorBlock(bbs[3]);
        bbs[5].addSuccessorBlock(bbs[6]);

        bbs[6].addPredecessorBlock(bbs[2]);
        bbs[6].addPredecessorBlock(bbs[5]);
        bbs[6].addSuccessorBlock(bbs[1]);
        
        for (let i = 0; i < 7; i++) {
            cfg.addBlock(bbs[i]);
        }

        let afg = new AbstractFlowGraph(cfg);
        let order: number[] = [];
        afg.preOrder(afg.getEntry(), (block) => {
            if (block) {
                order.push(block?.getId());
            }
        })
        expect(order.join(',')).eq('0,1,2,3,5,6,4');
    });
});
