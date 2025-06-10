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

/**
 * Builder for condition in CFG
 */
export class ConditionBuilder {
    public rebuildBlocksContainConditionalOperator(basicBlockSet: Set<BasicBlock>, isArkUIBuilder: boolean): void {
        if (isArkUIBuilder) {
            this.deleteDummyConditionalOperatorStmt(basicBlockSet);
            return;
        }

        const currBasicBlocks = Array.from(basicBlockSet);
        for (const currBasicBlock of currBasicBlocks) {
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

            let { generatedTopBlock: generatedTopBlock, generatedBottomBlocks: generatedBottomBlocks } = this.generateBlocksContainConditionalOperatorGroup(
                stmtsInCurrBasicBlock.slice(0, conditionalOperatorEndPos + 1),
                basicBlockSet
            );

            if (conditionalOperatorEndPos !== stmtsCnt - 1) {
                // need create a new basic block for rest statements
                const { generatedTopBlock: extraBlock } = this.generateBlockWithoutConditionalOperator(
                    stmtsInCurrBasicBlock.slice(conditionalOperatorEndPos + 1)
                );
                generatedBottomBlocks.forEach(generatedBottomBlock => {
                    generatedBottomBlock.addSuccessorBlock(extraBlock);
                    extraBlock.addPredecessorBlock(generatedBottomBlock);
                });
                basicBlockSet.add(extraBlock);
                generatedBottomBlocks = this.removeUnnecessaryBlocksInConditionalOperator(extraBlock, basicBlockSet);
            }
            this.relinkPrevAndSuccOfBlockContainConditionalOperator(currBasicBlock, generatedTopBlock, generatedBottomBlocks);
            basicBlockSet.delete(currBasicBlock);
        }
    }

    private relinkPrevAndSuccOfBlockContainConditionalOperator(
        currBasicBlock: BasicBlock,
        generatedTopBlock: BasicBlock,
        generatedBottomBlocks: BasicBlock[]
    ): void {
        const predecessorsOfCurrBasicBlock = Array.from(currBasicBlock.getPredecessors());
        predecessorsOfCurrBasicBlock.forEach(predecessor => {
            predecessor.removeSuccessorBlock(currBasicBlock);
            currBasicBlock.removePredecessorBlock(predecessor);
            generatedTopBlock.addPredecessorBlock(predecessor);
            predecessor.addSuccessorBlock(generatedTopBlock);
        });
        const successorsOfCurrBasicBlock = Array.from(currBasicBlock.getSuccessors());
        successorsOfCurrBasicBlock.forEach(successor => {
            successor.removePredecessorBlock(currBasicBlock);
            currBasicBlock.removeSuccessorBlock(successor);
            generatedBottomBlocks.forEach(generatedBottomBlock => {
                generatedBottomBlock.addSuccessorBlock(successor);
                successor.addPredecessorBlock(generatedBottomBlock);
            });
        });
    }

    private generateBlocksContainConditionalOperatorGroup(
        sourceStmts: Stmt[],
        basicBlockSet: Set<BasicBlock>
    ): {
        generatedTopBlock: BasicBlock;
        generatedBottomBlocks: BasicBlock[];
    } {
        const { firstEndPos: firstEndPos } = this.findFirstConditionalOperator(sourceStmts);
        if (firstEndPos === -1) {
            return this.generateBlockWithoutConditionalOperator(sourceStmts);
        }
        const {
            generatedTopBlock: firstGeneratedTopBlock,
            generatedBottomBlocks: firstGeneratedBottomBlocks,
            generatedAllBlocks: firstGeneratedAllBlocks,
        } = this.generateBlocksContainSingleConditionalOperator(sourceStmts.slice(0, firstEndPos + 1));
        const generatedTopBlock = firstGeneratedTopBlock;
        let generatedBottomBlocks = firstGeneratedBottomBlocks;
        firstGeneratedAllBlocks.forEach(block => basicBlockSet.add(block));
        const stmtsCnt = sourceStmts.length;
        if (firstEndPos !== stmtsCnt - 1) {
            // need handle other conditional operators
            const { generatedTopBlock: restGeneratedTopBlock, generatedBottomBlocks: restGeneratedBottomBlocks } =
                this.generateBlocksContainConditionalOperatorGroup(sourceStmts.slice(firstEndPos + 1, stmtsCnt), basicBlockSet);
            firstGeneratedBottomBlocks.forEach(firstGeneratedBottomBlock => {
                firstGeneratedBottomBlock.addSuccessorBlock(restGeneratedTopBlock);
                restGeneratedTopBlock.addPredecessorBlock(firstGeneratedBottomBlock);
            });
            restGeneratedBottomBlocks.forEach(block => basicBlockSet.add(block));
            this.removeUnnecessaryBlocksInConditionalOperator(restGeneratedTopBlock, basicBlockSet);
            generatedBottomBlocks = restGeneratedBottomBlocks;
        }
        return { generatedTopBlock, generatedBottomBlocks };
    }

    private generateBlocksContainSingleConditionalOperator(sourceStmts: Stmt[]): {
        generatedTopBlock: BasicBlock;
        generatedBottomBlocks: BasicBlock[];
        generatedAllBlocks: BasicBlock[];
    } {
        const { firstIfTruePos: ifTruePos, firstIfFalsePos: ifFalsePos, firstEndPos: endPos } = this.findFirstConditionalOperator(sourceStmts);
        if (endPos === -1) {
            return this.generateBlockWithoutConditionalOperator(sourceStmts);
        }
        const { generatedTopBlock: generatedTopBlock, generatedAllBlocks: generatedAllBlocks } = this.generateBlockWithoutConditionalOperator(
            sourceStmts.slice(0, ifTruePos)
        );
        let generatedBottomBlocks: BasicBlock[] = [];
        const {
            generatedTopBlock: generatedTopBlockOfTrueBranch,
            generatedBottomBlocks: generatedBottomBlocksOfTrueBranch,
            generatedAllBlocks: generatedAllBlocksOfTrueBranch,
        } = this.generateBlocksContainSingleConditionalOperator(sourceStmts.slice(ifTruePos + 1, ifFalsePos));
        generatedBottomBlocks.push(...generatedBottomBlocksOfTrueBranch);
        generatedAllBlocks.push(...generatedAllBlocksOfTrueBranch);
        const {
            generatedTopBlock: generatedTopBlockOfFalseBranch,
            generatedBottomBlocks: generatedBottomBlocksOfFalseBranch,
            generatedAllBlocks: generatedAllBlocksOfFalseBranch,
        } = this.generateBlocksContainSingleConditionalOperator(sourceStmts.slice(ifFalsePos + 1, endPos));
        generatedBottomBlocks.push(...generatedBottomBlocksOfFalseBranch);
        generatedAllBlocks.push(...generatedAllBlocksOfFalseBranch);

        generatedTopBlock.addSuccessorBlock(generatedTopBlockOfTrueBranch);
        generatedTopBlockOfTrueBranch.addPredecessorBlock(generatedTopBlock);
        generatedTopBlock.addSuccessorBlock(generatedTopBlockOfFalseBranch);
        generatedTopBlockOfFalseBranch.addPredecessorBlock(generatedTopBlock);
        const stmtsCnt = sourceStmts.length;
        if (endPos !== stmtsCnt - 1) {
            // need create a new basic block for rest statements
            const { generatedTopBlock: extraBlock } = this.generateBlockWithoutConditionalOperator(sourceStmts.slice(endPos + 1));
            generatedBottomBlocks.forEach(generatedBottomBlock => {
                generatedBottomBlock.addSuccessorBlock(extraBlock);
                extraBlock.addPredecessorBlock(generatedBottomBlock);
            });
            generatedBottomBlocks = [extraBlock];
            generatedAllBlocks.push(extraBlock);
        }
        return { generatedTopBlock, generatedBottomBlocks, generatedAllBlocks };
    }

    private generateBlockWithoutConditionalOperator(sourceStmts: Stmt[]): {
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
        const firstStmtInBottom = bottomBlock.getStmts()[0];
        if (!(firstStmtInBottom instanceof ArkAssignStmt)) {
            return [bottomBlock];
        }

        const targetValue = firstStmtInBottom.getLeftOp();
        const tempResultValue = firstStmtInBottom.getRightOp();
        if (!(targetValue instanceof Local && IRUtils.isTempLocal(tempResultValue))) {
            return [bottomBlock];
        }
        const oldPredecessors = Array.from(bottomBlock.getPredecessors());
        const newPredecessors: BasicBlock[] = [];
        for (const predecessor of oldPredecessors) {
            predecessor.removeSuccessorBlock(bottomBlock);
            newPredecessors.push(...this.replaceTempRecursively(predecessor, targetValue as Local, tempResultValue as Local, allBlocks));
        }

        bottomBlock.remove(firstStmtInBottom);
        if (bottomBlock.getStmts().length === 0) {
            // must be a new block without successors
            allBlocks.delete(bottomBlock);
            return newPredecessors;
        }

        oldPredecessors.forEach(oldPredecessor => {
            bottomBlock.removePredecessorBlock(oldPredecessor);
        });
        newPredecessors.forEach(newPredecessor => {
            bottomBlock.addPredecessorBlock(newPredecessor);
            newPredecessor.addSuccessorBlock(bottomBlock);
        });
        return [bottomBlock];
    }

    private replaceTempRecursively(currBottomBlock: BasicBlock, targetLocal: Local, tempResultLocal: Local, allBlocks: Set<BasicBlock>): BasicBlock[] {
        const stmts = currBottomBlock.getStmts();
        const stmtsCnt = stmts.length;
        let tempResultReassignStmt: Stmt | null = null;
        for (let i = stmtsCnt - 1; i >= 0; i--) {
            const stmt = stmts[i];
            if (stmt instanceof ArkAssignStmt && stmt.getLeftOp() === tempResultLocal) {
                if (IRUtils.isTempLocal(stmt.getRightOp())) {
                    tempResultReassignStmt = stmt;
                } else {
                    stmt.setLeftOp(targetLocal);
                }
            }
        }

        let newBottomBlocks: BasicBlock[] = [];
        if (tempResultReassignStmt) {
            const oldPredecessors = currBottomBlock.getPredecessors();
            const newPredecessors: BasicBlock[] = [];
            const prevTempResultLocal = (tempResultReassignStmt as ArkAssignStmt).getRightOp() as Local;
            for (const predecessor of oldPredecessors) {
                predecessor.removeSuccessorBlock(currBottomBlock);
                newPredecessors.push(...this.replaceTempRecursively(predecessor, targetLocal, prevTempResultLocal, allBlocks));
            }

            currBottomBlock.remove(tempResultReassignStmt);
            if (currBottomBlock.getStmts().length === 0) {
                // remove this block
                newBottomBlocks = newPredecessors;
                allBlocks.delete(currBottomBlock);
            } else {
                currBottomBlock.getPredecessors().splice(0, oldPredecessors.length, ...newPredecessors);
                newPredecessors.forEach(newPredecessor => {
                    newPredecessor.addSuccessorBlock(currBottomBlock);
                });
                newBottomBlocks = [currBottomBlock];
            }
        } else {
            newBottomBlocks = [currBottomBlock];
        }
        return newBottomBlocks;
    }
}
