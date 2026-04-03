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

import { BasicBlock } from '../../../core/graph/BasicBlock';
import { DummyStmt } from '../../../core/common/ArkIRTransformer';
import { Stmt } from '../../../core/base/Stmt';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { ArkCxxIRTransformer } from '../../common/ArkIRTransformer';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'SwitchBuilder');

/**
 * Builder for if statement in CFG
 * This is a scenario where the processing criteria include | | or &&
 */
export class CxxIfBuilder {
    public rebuildIf(
        basicBlockSet: Set<BasicBlock>,
    ): void {
        for (const basicBlock of basicBlockSet) {
            const stmts = Array.from(basicBlock.getStmts());
            const stmtsCnt = stmts.length;
            const stmt = stmts[stmtsCnt - 1];
            if (stmt instanceof DummyStmt && (stmt.toString()?.startsWith(ArkCxxIRTransformer.DUMMY_IF_OPERATOR_END))) {
                this.generateBlocksForComplexBooleanExpr(basicBlock, basicBlockSet);
            }
        }
    }


    private generateBlocksForComplexBooleanExpr(block: BasicBlock, basicBlockSet: Set<BasicBlock>): void {
        if (block.getSuccessors().length !== 2) {
            logger.error('the ifStmt build failed');
            return;
        }
        const { firstOrSignalPos: firstOrSignalPos, firstOrEndPos: OrEndPos } = this.findOrOperator(block.getStmts());
        if (firstOrSignalPos !== -1) {
            this.generateBlocksForOrExpr(block, basicBlockSet, firstOrSignalPos, OrEndPos);
            return;
        }
        const {
            firstAndSignalPos: firstAndSignalPos,
            firstAndEndPos: AndEndPos,
        } = this.findAndOperator(block.getStmts());
        if (firstAndSignalPos !== -1) {
            this.generateBlocksForAndExpr(block, basicBlockSet, firstAndSignalPos, AndEndPos);
        }
    }

    private generateBlocksForOrExpr(block: BasicBlock, basicBlockSet: Set<BasicBlock>, firstOrSignalPos: number, OrEndPos: number): void {
        const sourceStmts = block.getStmts();
        const { generatedTopBlock: secondBlock } = this.generateBlock(
            sourceStmts.slice(firstOrSignalPos + 1, OrEndPos),
        );
        sourceStmts.splice(firstOrSignalPos);
        const falseBlock = block.getSuccessors()[1];
        const trueBlock = block.getSuccessors()[0];
        block.removeSuccessorBlock(falseBlock);
        falseBlock.removePredecessorBlock(block);
        block.addSuccessorBlock(secondBlock);
        secondBlock.addPredecessorBlock(block);
        secondBlock.addSuccessorBlock(trueBlock);
        trueBlock.addPredecessorBlock(secondBlock);
        secondBlock.addSuccessorBlock(falseBlock);
        falseBlock.addPredecessorBlock(secondBlock);
        basicBlockSet.add(secondBlock);
        this.generateBlocksForComplexBooleanExpr(block, basicBlockSet);
        this.generateBlocksForComplexBooleanExpr(secondBlock, basicBlockSet);
    }

    private generateBlocksForAndExpr(block: BasicBlock, basicBlockSet: Set<BasicBlock>, firstOrSignalPos: number, OrEndPos: number): void {
        const sourceStmts = block.getStmts();
        const { generatedTopBlock: secondBlock } = this.generateBlock(
            sourceStmts.slice(firstOrSignalPos + 1, OrEndPos),
        );
        sourceStmts.splice(firstOrSignalPos);
        // Need to check if it is the default rule
        const falseBlock = block.getSuccessors()[1];
        const trueBlock = block.getSuccessors()[0];
        block.removeSuccessorBlock(trueBlock);
        trueBlock.removePredecessorBlock(block);
        const successesBlock = block.getSuccessors();
        successesBlock.unshift(secondBlock);
        secondBlock.addPredecessorBlock(block);
        secondBlock.addSuccessorBlock(trueBlock);
        trueBlock.addPredecessorBlock(secondBlock);
        secondBlock.addSuccessorBlock(falseBlock);
        falseBlock.addPredecessorBlock(secondBlock);
        basicBlockSet.add(secondBlock);
        this.generateBlocksForComplexBooleanExpr(block, basicBlockSet);
        this.generateBlocksForComplexBooleanExpr(secondBlock, basicBlockSet);
    }

    private findOrOperator(stmts: Stmt[]): {
        firstOrSignalPos: number;
        firstOrEndPos: number;
    } {
        let firstOrSignalPos = -1;
        let firstOrEndPos = -1;
        let firstConditionalOperatorNo = '';
        for (let i = stmts.length; i >= 0; i--) {
            const stmt = stmts[i];
            if (stmt instanceof DummyStmt) {
                if (stmt.toString().startsWith(ArkCxxIRTransformer.DUMMY_IF_OPERATOR_END) && firstOrEndPos === -1) {
                    firstOrEndPos = i;
                    firstConditionalOperatorNo = stmt.toString().replace(ArkCxxIRTransformer.DUMMY_IF_OPERATOR_END, '');
                } else if (stmt.toString() === ArkCxxIRTransformer.DUMMY_IF_OPERATOR_OR_SIGNAL + firstConditionalOperatorNo) {
                    firstOrSignalPos = i;
                }
            }
        }
        return { firstOrSignalPos, firstOrEndPos };
    }

    private findAndOperator(stmts: Stmt[]): {
        firstAndSignalPos: number;
        firstAndEndPos: number;
    } {
        let firstAndSignalPos = -1;
        let firstAndEndPos = -1;
        let firstConditionalOperatorNo = '';
        for (let i = stmts.length; i >= 0; i--) {
            const stmt = stmts[i];
            if (stmt instanceof DummyStmt) {
                if (stmt.toString().startsWith(ArkCxxIRTransformer.DUMMY_IF_OPERATOR_END) && firstAndEndPos === -1) {
                    firstAndEndPos = i;
                    firstConditionalOperatorNo = stmt.toString().replace(ArkCxxIRTransformer.DUMMY_IF_OPERATOR_END, '');
                } else if (stmt.toString() === ArkCxxIRTransformer.DUMMY_IF_OPERATOR_AND_SIGNAL + firstConditionalOperatorNo) {
                    firstAndSignalPos = i;
                }
            }
        }
        return { firstAndSignalPos, firstAndEndPos };
    }

    private generateBlock(sourceStmts: Stmt[]): {
        generatedTopBlock: BasicBlock;
        generatedBottomBlocks: BasicBlock[];
        generatedAllBlocks: BasicBlock[];
    } {
        const generatedBlock = new BasicBlock();
        sourceStmts.forEach(stmt => generatedBlock.addStmt(stmt));
        return {
            generatedTopBlock: generatedBlock,
            generatedBottomBlocks: [generatedBlock],
            generatedAllBlocks: [generatedBlock],
        };
    }

}
