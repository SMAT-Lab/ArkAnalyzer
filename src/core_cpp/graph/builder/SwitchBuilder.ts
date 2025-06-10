/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { BasicBlock } from '../BasicBlock';
import { ArkIRTransformer, ValueAndStmts } from '../../common/ArkIRTransformer';
import { Stmt } from '../../base/Stmt';
import { BlockBuilder, SwitchStatementBuilder } from './CfgBuilder';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'SwitchBuilder');

/**
 * Builder for switch statement in CFG
 */
export class SwitchBuilder {
    public buildSwitch(
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        blockBuildersContainSwitch: BlockBuilder[],
        valueAndStmtsOfSwitchAndCasesAll: ValueAndStmts[][],
        arkIRTransformer: ArkIRTransformer,
        basicBlockSet: Set<BasicBlock>
    ): void {
        for (let i = 0; i < blockBuildersContainSwitch.length; i++) {
            const blockBuilderContainSwitch = blockBuildersContainSwitch[i];

            if (!blockBuilderToCfgBlock.has(blockBuilderContainSwitch)) {
                logger.error(`can't find basicBlock corresponding to the blockBuilder.`);
                continue;
            }

            const blockContainSwitch = blockBuilderToCfgBlock.get(blockBuilderContainSwitch)!;
            const valueAndStmtsOfSwitch = valueAndStmtsOfSwitchAndCasesAll[i][0];
            const stmtsOfSwitch = valueAndStmtsOfSwitch.stmts;
            stmtsOfSwitch.forEach((stmt: Stmt) => {
                blockContainSwitch.addStmt(stmt);
            });

            const stmtsCnt = blockBuilderContainSwitch.stmts.length;
            const switchStmtBuilder = blockBuilderContainSwitch.stmts[stmtsCnt - 1] as SwitchStatementBuilder;
            const cases = switchStmtBuilder.cases;
            let nonEmptyCaseCnt = 0;
            for (const currCase of cases) {
                if (currCase.stmt.block) {
                    // there are stmts after this case
                    nonEmptyCaseCnt++;
                }
            }
            if (nonEmptyCaseCnt === 0) {
                continue;
            }

            const caseCnt = cases.length;
            const caseIfBlocks = this.generateIfBlocksForCases(
                valueAndStmtsOfSwitchAndCasesAll[i],
                caseCnt,
                blockContainSwitch,
                basicBlockSet,
                arkIRTransformer
            );
            this.linkIfBlockAndCaseBlock(blockContainSwitch, caseIfBlocks, switchStmtBuilder, blockBuilderToCfgBlock);
        }
    }

    private generateIfBlocksForCases(
        valueAndStmtsOfSwitchAndCases: ValueAndStmts[],
        caseCnt: number,
        blockContainSwitch: BasicBlock,
        basicBlockSet: Set<BasicBlock>,
        arkIRTransformer: ArkIRTransformer
    ): BasicBlock[] {
        const valueAndStmtsOfSwitch = valueAndStmtsOfSwitchAndCases[0];
        const valueOfSwitch = valueAndStmtsOfSwitch.value;
        const caseIfBlocks: BasicBlock[] = [];

        for (let j = 0; j < caseCnt; j++) {
            let caseIfBlock: BasicBlock;
            if (j === 0) {
                caseIfBlock = blockContainSwitch;
            } else {
                caseIfBlock = new BasicBlock();
                basicBlockSet.add(caseIfBlock);
            }
            caseIfBlocks.push(caseIfBlock);

            const caseValueAndStmts = valueAndStmtsOfSwitchAndCases[j + 1];
            const caseValue = caseValueAndStmts.value;
            const caseStmts = caseValueAndStmts.stmts;
            caseStmts.forEach((stmt: Stmt) => {
                caseIfBlock.addStmt(stmt);
            });
            const caseIfStmts = arkIRTransformer.generateIfStmtForValues(
                valueOfSwitch,
                valueAndStmtsOfSwitch.valueOriginalPositions,
                caseValue,
                caseValueAndStmts.valueOriginalPositions
            );
            caseIfStmts.forEach((stmt: Stmt) => {
                caseIfBlock.addStmt(stmt);
            });
        }
        return caseIfBlocks;
    }

    private linkIfBlockAndCaseBlock(
        blockContainSwitch: BasicBlock,
        caseIfBlocks: BasicBlock[],
        switchStmtBuilder: SwitchStatementBuilder,
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>
    ): boolean {
        const successorsOfBlockContainSwitch = Array.from(blockContainSwitch.getSuccessors());
        const expectedSuccessorsOfCaseIfBlock: BasicBlock[] = [];
        const defaultStmtBuilder = switchStmtBuilder.default;
        if (defaultStmtBuilder && defaultStmtBuilder.block) {
            expectedSuccessorsOfCaseIfBlock.push(...successorsOfBlockContainSwitch.splice(-1, 1));
        } else {
            const afterSwitchStmtBuilder = switchStmtBuilder.afterSwitch;
            const afterSwitchBlockBuilder = afterSwitchStmtBuilder?.block;
            if (!afterSwitchBlockBuilder || !blockBuilderToCfgBlock.has(afterSwitchBlockBuilder)) {
                logger.error(`can't find basicBlock corresponding to the blockBuilder.`);
                return false;
            }
            expectedSuccessorsOfCaseIfBlock.push(blockBuilderToCfgBlock.get(afterSwitchBlockBuilder)!);
        }
        const caseCnt = switchStmtBuilder.cases.length;
        for (let i = caseCnt - 1; i >= 0; i--) {
            const currCase = switchStmtBuilder.cases[i];
            if (currCase.stmt.block) {
                expectedSuccessorsOfCaseIfBlock.push(...successorsOfBlockContainSwitch.splice(-1, 1));
            } else {
                // if there are no stmts after this case, reuse the successor of the next case
                expectedSuccessorsOfCaseIfBlock.push(...expectedSuccessorsOfCaseIfBlock.slice(-1));
            }
        }
        expectedSuccessorsOfCaseIfBlock.reverse();

        blockContainSwitch.getSuccessors().forEach(successor => {
            successor.getPredecessors().splice(0, 1);
        });
        blockContainSwitch.getSuccessors().splice(0);
        for (let j = 0; j < caseCnt; j++) {
            const caseIfBlock = caseIfBlocks[j];
            caseIfBlock.addSuccessorBlock(expectedSuccessorsOfCaseIfBlock[j]);
            expectedSuccessorsOfCaseIfBlock[j].addPredecessorBlock(caseIfBlock);
            if (j === caseCnt - 1) {
                // the false branch of last case should be default or block after switch statement
                caseIfBlock.addSuccessorBlock(expectedSuccessorsOfCaseIfBlock[j + 1]);
                expectedSuccessorsOfCaseIfBlock[j + 1].addPredecessorBlock(caseIfBlock);
            } else {
                caseIfBlock.addSuccessorBlock(caseIfBlocks[j + 1]);
                caseIfBlocks[j + 1].addPredecessorBlock(caseIfBlock);
            }
        }
        return true;
    }
}
