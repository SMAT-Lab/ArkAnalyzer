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
import { ArkIRTransformer, DummyStmt } from '../../common/ArkIRTransformer';
import { ArkAssignStmt, Stmt } from '../../base/Stmt';
import { Local } from '../../base/Local';
import { IRUtils } from '../../common/IRUtils';
import { BlockBuilder, CfgBuilder } from './CfgBuilder';
import { FullPosition } from '../../base/Position';

/**
 * Builder for condition in CFG
 */
export class ConditionBuilder {
    public rebuildBlocksContainConditionalOperator(
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        basicBlockSet: Set<BasicBlock>,
        isArkUIBuilder: boolean
    ): void {
        if (isArkUIBuilder) {
            this.deleteDummyConditionalOperatorStmt(basicBlockSet);
            return;
        }

        const blockPairsToSet: [BlockBuilder, BasicBlock][] = [];
        for (const [currBlockBuilder, currBasicBlock] of blockBuilderToCfgBlock) {
            const stmtsInCurrBasicBlock = Array.from(currBasicBlock.getStmts());
            const stmtsCnt = stmtsInCurrBasicBlock.length;
            let conditionalOperatorEndPos = -1;
            for (let i = stmtsCnt - 1; i >= 0; i--) {
                const stmt = stmtsInCurrBasicBlock[i];
                if (stmt instanceof DummyStmt && stmt.toString()?.startsWith(ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR_END_STMT)) {
                    conditionalOperatorEndPos = i;
                    break;
                }
            }
            if (conditionalOperatorEndPos === -1) {
                continue;
            }

            let {
                generatedTopBlock: generatedTopBlock, generatedBottomBlocks: generatedBottomBlocks,
            } = this.generateBlocksInConditionalOperatorGroup(
                stmtsInCurrBasicBlock.slice(0, conditionalOperatorEndPos + 1), basicBlockSet);

            if (conditionalOperatorEndPos !== stmtsCnt - 1) {
                // need create a new basic block for rest statements
                const { generatedTopBlock: extraBlock } = this.generateBlockOutConditionalOperator(
                    stmtsInCurrBasicBlock.slice(conditionalOperatorEndPos + 1)
                );
                CfgBuilder.linkPredecessorsOfBasicBlock(extraBlock, generatedBottomBlocks);
                basicBlockSet.add(extraBlock);
                generatedBottomBlocks = this.removeUnnecessaryBlocksInConditionalOperator(extraBlock, basicBlockSet);
            }
            this.updateBasicBlockInContainConditionalOperator(currBasicBlock, generatedTopBlock, generatedBottomBlocks);
            basicBlockSet.delete(currBasicBlock);
            blockPairsToSet.push([currBlockBuilder, generatedTopBlock]);
        }
        for (const [currBlockBuilder, generatedTopBlock] of blockPairsToSet) {
            blockBuilderToCfgBlock.set(currBlockBuilder, generatedTopBlock);
        }
    }

    private updateBasicBlockInContainConditionalOperator(
        currBasicBlock: BasicBlock,
        generatedTopBlock: BasicBlock,
        generatedBottomBlocks: BasicBlock[]
    ): void {
        CfgBuilder.replaceBasicBlockInPredecessors(currBasicBlock, generatedTopBlock);
        CfgBuilder.replaceBasicBlockInSuccessors(currBasicBlock, generatedBottomBlocks);
    }

    private generateBlocksInConditionalOperatorGroup(
        sourceStmts: Stmt[],
        basicBlockSet: Set<BasicBlock>
    ): {
        generatedTopBlock: BasicBlock;
        generatedBottomBlocks: BasicBlock[];
    } {
        const { firstEndPos: firstEndPos } = this.findFirstConditionalOperator(sourceStmts);
        if (firstEndPos === -1) {
            return this.generateBlockOutConditionalOperator(sourceStmts);
        }
        const {
            generatedTopBlock: firstGeneratedTopBlock,
            generatedBottomBlocks: firstGeneratedBottomBlocks,
            generatedAllBlocks: firstGeneratedAllBlocks,
        } = this.generateBlocksInSingleConditionalOperator(sourceStmts.slice(0, firstEndPos + 1));
        const generatedTopBlock = firstGeneratedTopBlock;
        let generatedBottomBlocks = firstGeneratedBottomBlocks;
        firstGeneratedAllBlocks.forEach(block => basicBlockSet.add(block));
        const stmtsCnt = sourceStmts.length;
        if (firstEndPos !== stmtsCnt - 1) {
            // need handle other conditional operators
            const { generatedTopBlock: restGeneratedTopBlock, generatedBottomBlocks: restGeneratedBottomBlocks } =
                this.generateBlocksInConditionalOperatorGroup(sourceStmts.slice(firstEndPos + 1, stmtsCnt),
                    basicBlockSet);
            CfgBuilder.linkPredecessorsOfBasicBlock(restGeneratedTopBlock, generatedBottomBlocks);
            restGeneratedBottomBlocks.forEach(block => basicBlockSet.add(block));
            this.removeUnnecessaryBlocksInConditionalOperator(restGeneratedTopBlock, basicBlockSet);
            generatedBottomBlocks = restGeneratedBottomBlocks;
        }
        return { generatedTopBlock, generatedBottomBlocks };
    }

    private generateBlocksInSingleConditionalOperator(sourceStmts: Stmt[]): {
        generatedTopBlock: BasicBlock;
        generatedBottomBlocks: BasicBlock[];
        generatedAllBlocks: BasicBlock[];
    } {
        const { firstIfTruePos: ifTruePos, firstIfFalsePos: ifFalsePos, firstEndPos: endPos } = this.findFirstConditionalOperator(sourceStmts);
        if (endPos === -1) {
            return this.generateBlockOutConditionalOperator(sourceStmts);
        }
        const {
            generatedTopBlock: generatedTopBlock, generatedAllBlocks: generatedAllBlocks,
        } = this.generateBlockOutConditionalOperator(
            sourceStmts.slice(0, ifTruePos)
        );
        let generatedBottomBlocks: BasicBlock[] = [];
        const {
            generatedTopBlock: generatedTopBlockOfTrueBranch,
            generatedBottomBlocks: generatedBottomBlocksOfTrueBranch,
            generatedAllBlocks: generatedAllBlocksOfTrueBranch,
        } = this.generateBlocksInSingleConditionalOperator(sourceStmts.slice(ifTruePos + 1, ifFalsePos));
        generatedBottomBlocks.push(...generatedBottomBlocksOfTrueBranch);
        generatedAllBlocks.push(...generatedAllBlocksOfTrueBranch);
        const {
            generatedTopBlock: generatedTopBlockOfFalseBranch,
            generatedBottomBlocks: generatedBottomBlocksOfFalseBranch,
            generatedAllBlocks: generatedAllBlocksOfFalseBranch,
        } = this.generateBlocksInSingleConditionalOperator(sourceStmts.slice(ifFalsePos + 1, endPos));
        generatedBottomBlocks.push(...generatedBottomBlocksOfFalseBranch);
        generatedAllBlocks.push(...generatedAllBlocksOfFalseBranch);

        CfgBuilder.linkSuccessorOfIfBasicBlock(generatedTopBlock, generatedTopBlockOfTrueBranch,
            generatedTopBlockOfFalseBranch);
        const stmtsCnt = sourceStmts.length;
        if (endPos !== stmtsCnt - 1) {
            // need create a new basic block for rest statements
            const { generatedTopBlock: extraBlock } = this.generateBlockOutConditionalOperator(
                sourceStmts.slice(endPos + 1));
            CfgBuilder.linkPredecessorsOfBasicBlock(extraBlock, generatedBottomBlocks);
            generatedBottomBlocks = [extraBlock];
            generatedAllBlocks.push(extraBlock);
        }
        return { generatedTopBlock, generatedBottomBlocks, generatedAllBlocks };
    }

    private generateBlockOutConditionalOperator(sourceStmts: Stmt[]): {
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

    private deleteDummyConditionalOperatorStmt(basicBlockSet: Set<BasicBlock>): void {
        for (const basicBlock of basicBlockSet) {
            const stmts = Array.from(basicBlock.getStmts());
            for (const stmt of stmts) {
                if (stmt instanceof DummyStmt && stmt.toString()?.startsWith(ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR)) {
                    basicBlock.remove(stmt);
                }
            }
        }
    }

    private findFirstConditionalOperator(stmts: Stmt[]): {
        firstIfTruePos: number;
        firstIfFalsePos: number;
        firstEndPos: number;
    } {
        let firstIfTruePos = -1;
        let firstIfFalsePos = -1;
        let firstEndPos = -1;
        let firstConditionalOperatorNo = '';
        for (let i = 0; i < stmts.length; i++) {
            const stmt = stmts[i];
            if (stmt instanceof DummyStmt) {
                if (stmt.toString().startsWith(ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR_IF_TRUE_STMT) && firstIfTruePos === -1) {
                    firstIfTruePos = i;
                    firstConditionalOperatorNo = stmt.toString().replace(ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR_IF_TRUE_STMT, '');
                } else if (stmt.toString() === ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR_IF_FALSE_STMT + firstConditionalOperatorNo) {
                    firstIfFalsePos = i;
                } else if (stmt.toString() === ArkIRTransformer.DUMMY_CONDITIONAL_OPERATOR_END_STMT + firstConditionalOperatorNo) {
                    firstEndPos = i;
                }
            }
        }
        return { firstIfTruePos, firstIfFalsePos, firstEndPos };
    }

    private removeUnnecessaryBlocksInConditionalOperator(bottomBlock: BasicBlock, allBlocks: Set<BasicBlock>): BasicBlock[] {
        const firstStmtInBottom = bottomBlock.getHead()!;
        if (!(firstStmtInBottom instanceof ArkAssignStmt)) {
            return [bottomBlock];
        }

        const targetValue = firstStmtInBottom.getLeftOp();
        const targetValuePosition = firstStmtInBottom.getOperandOriginalPosition(targetValue) ?? undefined;
        const tempResultValue = firstStmtInBottom.getRightOp();
        if (!(targetValue instanceof Local && IRUtils.isTempLocal(tempResultValue))) {
            return [bottomBlock];
        }
        const oldPredecessors = Array.from(bottomBlock.getPredecessors());
        const newPredecessors: BasicBlock[] = [];
        for (const predecessor of oldPredecessors) {
            newPredecessors.push(...this.replaceTempRecursively(predecessor, targetValue as Local, tempResultValue as Local, allBlocks, targetValuePosition));
        }

        CfgBuilder.unlinkPredecessorsOfBasicBlock(bottomBlock);
        bottomBlock.remove(firstStmtInBottom);
        if (bottomBlock.getStmts().length === 0) {
            // must be a new block without successors
            allBlocks.delete(bottomBlock);
            return newPredecessors;
        }

        CfgBuilder.linkPredecessorsOfBasicBlock(bottomBlock, newPredecessors);
        return [bottomBlock];
    }

    private replaceTempRecursively(
        currBottomBlock: BasicBlock,
        targetLocal: Local,
        tempResultLocal: Local,
        allBlocks: Set<BasicBlock>,
        targetValuePosition?: FullPosition
    ): BasicBlock[] {
        const stmts = currBottomBlock.getStmts();
        const stmtsCnt = stmts.length;
        let tempResultReassignStmt: Stmt | null = null;
        for (let i = stmtsCnt - 1; i >= 0; i--) {
            const stmt = stmts[i];
            if (!(stmt instanceof ArkAssignStmt) || stmt.getLeftOp() !== tempResultLocal) {
                continue;
            }
            if (IRUtils.isTempLocal(stmt.getRightOp())) {
                tempResultReassignStmt = stmt;
                continue;
            }
            stmt.setLeftOp(targetLocal);
            if (targetValuePosition) {
                const restPositions = stmt.getOperandOriginalPositions()?.slice(1);
                if (restPositions) {
                    stmt.setOperandOriginalPositions([targetValuePosition, ...restPositions]);
                }
            }
        }

        let newBottomBlocks: BasicBlock[] = [];
        if (tempResultReassignStmt) {
            const oldPredecessors = Array.from(currBottomBlock.getPredecessors());
            const newPredecessors: BasicBlock[] = [];
            const prevTempResultLocal = (tempResultReassignStmt as ArkAssignStmt).getRightOp() as Local;
            for (const predecessor of oldPredecessors) {
                newPredecessors.push(...this.replaceTempRecursively(predecessor, targetLocal, prevTempResultLocal, allBlocks, targetValuePosition));
            }

            CfgBuilder.unlinkPredecessorsOfBasicBlock(currBottomBlock);
            currBottomBlock.remove(tempResultReassignStmt);
            if (currBottomBlock.getStmts().length === 0) {
                // remove this block
                newBottomBlocks = newPredecessors;
                allBlocks.delete(currBottomBlock);
            } else {
                CfgBuilder.linkPredecessorsOfBasicBlock(currBottomBlock, newPredecessors);
                newBottomBlocks = [currBottomBlock];
            }
        } else {
            newBottomBlocks = [currBottomBlock];
        }
        return newBottomBlocks;
    }
}
