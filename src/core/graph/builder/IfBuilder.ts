/*
 * Copyright (c) 2025-2026 Huawei Device Co., Ltd.
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
import {
    ArkAliasTypeDefineStmt,
    ArkAssignStmt,
    ArkIfStmt,
    ArkInvokeStmt,
    ArkReturnStmt,
    ArkReturnVoidStmt,
    ArkThrowStmt,
    Stmt,
} from '../../base/Stmt';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { BlockBuilder, CfgBuilder, ConditionStatementBuilder } from './CfgBuilder';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'IfBuilder');

/**
 * Builder for if statement in CFG when the condition contains || or &&.
 */
export class IfBuilder {
    private cfgBlockToBlockBuilder: Map<BasicBlock, BlockBuilder> = new Map();

    public rebuildIf(basicBlockSet: Set<BasicBlock>, blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>): void {
        this.cfgBlockToBlockBuilder = new Map();
        for (const [blockBuilder, cfgBlock] of blockBuilderToCfgBlock) {
            this.cfgBlockToBlockBuilder.set(cfgBlock, blockBuilder);
        }
        for (const basicBlock of basicBlockSet) {
            const stmts = Array.from(basicBlock.getStmts());
            const stmtsCnt = stmts.length;
            const stmt = stmts[stmtsCnt - 1];
            if (stmt instanceof DummyStmt && stmt.toString()?.startsWith(ArkIRTransformer.DUMMY_IF_OPERATOR_END)) {
                this.generateBlocksForComplexBooleanExpr(basicBlock, basicBlockSet);
            }
        }
    }

    private generateBlocksForComplexBooleanExpr(block: BasicBlock, basicBlockSet: Set<BasicBlock>, isOnlyIf?: boolean): void {
        const successorCount = block.getSuccessors().length;
        if (successorCount !== 2 && successorCount !== 1) {
            logger.error('the ifStmt build failed');
            return;
        }
        const resolvedIsOnlyIf = isOnlyIf ?? (successorCount === 1 ? true : this.isOnlyIf(block));
        const { firstOrSignalPos, firstOrEndPos: orEndPos } = this.findOrOperator(block.getStmts());
        if (firstOrSignalPos !== -1) {
            this.generateBlocksForOrExpr(block, basicBlockSet, firstOrSignalPos, orEndPos, resolvedIsOnlyIf);
            return;
        }
        const { firstAndSignalPos, firstAndEndPos: andEndPos } = this.findAndOperator(block.getStmts());
        if (firstAndSignalPos !== -1) {
            this.generateBlocksForAndExpr(block, basicBlockSet, firstAndSignalPos, andEndPos, resolvedIsOnlyIf);
        }
    }

    /**
     * Generate the corresponding control flow basic block for a logical OR (||) expression.
     */
    private generateBlocksForOrExpr(block: BasicBlock, basicBlockSet: Set<BasicBlock>, firstOrSignalPos: number, orEndPos: number, isOnlyIf: boolean): void {
        const sourceStmts = block.getStmts();
        const secondBlock = this.generateBlock(sourceStmts.slice(firstOrSignalPos + 1, orEndPos));
        sourceStmts.splice(firstOrSignalPos);
        const successors = block.getSuccessors();
        const trueBlock = successors[0];
        const falseBlock = successors.length >= 2 ? successors[1] : successors[0];

        block.getSuccessors().length = 0;
        falseBlock.removePredecessorBlock(block);
        if (trueBlock !== falseBlock) {
            trueBlock.removePredecessorBlock(block);
        }

        const newTrueBlock = this.copyBlock(trueBlock);

        CfgBuilder.linkBasicBlock(block, newTrueBlock);
        CfgBuilder.linkBasicBlock(block, secondBlock);

        CfgBuilder.linkBasicBlock(secondBlock, trueBlock);
        CfgBuilder.linkBasicBlock(secondBlock, falseBlock);
        basicBlockSet.add(newTrueBlock);

        basicBlockSet.add(secondBlock);
        this.generateBlocksForComplexBooleanExpr(block, basicBlockSet, isOnlyIf);
        this.generateBlocksForComplexBooleanExpr(secondBlock, basicBlockSet, isOnlyIf);
    }

    /**
     * Generate the corresponding control flow basic block for a logical AND (&&) expression.
     */
    private generateBlocksForAndExpr(
        block: BasicBlock,
        basicBlockSet: Set<BasicBlock>,
        firstAndSignalPos: number,
        andEndPos: number,
        isOnlyIf: boolean
    ): void {
        const sourceStmts = block.getStmts();
        const secondBlock = this.generateBlock(sourceStmts.slice(firstAndSignalPos + 1, andEndPos));
        sourceStmts.splice(firstAndSignalPos);
        const successors = block.getSuccessors();
        const trueBlock = successors[0];
        const falseBlock = successors.length >= 2 ? successors[1] : successors[0];

        block.getSuccessors().length = 0;
        trueBlock.removePredecessorBlock(block);
        if (trueBlock !== falseBlock) {
            falseBlock.removePredecessorBlock(block);
        }

        CfgBuilder.linkBasicBlock(block, secondBlock);

        if (!isOnlyIf) {
            const newFalseBlock = this.copyBlock(falseBlock);
            CfgBuilder.linkBasicBlock(block, newFalseBlock);
            basicBlockSet.add(newFalseBlock);
        } else {
            CfgBuilder.linkBasicBlock(block, falseBlock);
        }

        CfgBuilder.linkBasicBlock(secondBlock, trueBlock);
        CfgBuilder.linkBasicBlock(secondBlock, falseBlock);

        basicBlockSet.add(secondBlock);
        this.generateBlocksForComplexBooleanExpr(block, basicBlockSet, isOnlyIf);
        this.generateBlocksForComplexBooleanExpr(secondBlock, basicBlockSet, isOnlyIf);
    }

    private findOrOperator(stmts: Stmt[]): {
        firstOrSignalPos: number;
        firstOrEndPos: number;
    } {
        let firstOrSignalPos = -1;
        let firstOrEndPos = -1;
        let firstConditionalOperatorNo = '';
        for (let i = stmts.length - 1; i >= 0; i--) {
            const stmt = stmts[i];
            if (stmt instanceof DummyStmt) {
                if (stmt.toString().startsWith(ArkIRTransformer.DUMMY_IF_OPERATOR_END) && firstOrEndPos === -1) {
                    firstOrEndPos = i;
                    firstConditionalOperatorNo = stmt.toString().replace(ArkIRTransformer.DUMMY_IF_OPERATOR_END, '');
                } else if (stmt.toString() === ArkIRTransformer.DUMMY_IF_OPERATOR_OR_SIGNAL + firstConditionalOperatorNo) {
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
        for (let i = stmts.length - 1; i >= 0; i--) {
            const stmt = stmts[i];
            if (stmt instanceof DummyStmt) {
                if (stmt.toString().startsWith(ArkIRTransformer.DUMMY_IF_OPERATOR_END) && firstAndEndPos === -1) {
                    firstAndEndPos = i;
                    firstConditionalOperatorNo = stmt.toString().replace(ArkIRTransformer.DUMMY_IF_OPERATOR_END, '');
                } else if (stmt.toString() === ArkIRTransformer.DUMMY_IF_OPERATOR_AND_SIGNAL + firstConditionalOperatorNo) {
                    firstAndSignalPos = i;
                }
            }
        }
        return { firstAndSignalPos, firstAndEndPos };
    }

    private generateBlock(sourceStmts: Stmt[]): BasicBlock {
        const generatedBlock = new BasicBlock();
        sourceStmts.forEach(stmt => generatedBlock.addStmt(stmt));
        return generatedBlock;
    }

    private copyBlock(block: BasicBlock): BasicBlock {
        const generatedBlock = new BasicBlock();
        block.getStmts().forEach(stmt => {
            const newStmt = this.copyStmt(stmt);
            if (newStmt) {
                generatedBlock.addStmt(newStmt);
            }
        });
        block.getSuccessors().forEach(successor => generatedBlock.addSuccessorBlock(successor));
        return generatedBlock;
    }

    /**
     * Determine whether it represents if logic (not if else).
     * Loop conditions and if-without-else merge blocks share the false branch directly;
     * if-else keeps a distinct else entry whose only predecessor is the condition block.
     */
    private isOnlyIf(block: BasicBlock): boolean {
        if (this.isLoopConditionBlock(block)) {
            return true;
        }
        const falseBranch = block.getSuccessors()[1];
        return falseBranch.getPredecessors().some(predecessor => predecessor !== block);
    }

    private isLoopConditionBlock(block: BasicBlock): boolean {
        const blockBuilder = this.cfgBlockToBlockBuilder.get(block);
        if (!blockBuilder) {
            return false;
        }
        return blockBuilder.stmts.some(
            stmt => stmt instanceof ConditionStatementBuilder && stmt.type === 'loopStatement'
        );
    }

    private copyStmt(sourceStmt: Stmt): Stmt | null {
        if (sourceStmt instanceof ArkAssignStmt) {
            return new ArkAssignStmt(sourceStmt.getLeftOp(), sourceStmt.getRightOp());
        }
        if (sourceStmt instanceof ArkInvokeStmt) {
            return new ArkInvokeStmt(sourceStmt.getInvokeExpr());
        }
        if (sourceStmt instanceof ArkIfStmt) {
            return new ArkIfStmt(sourceStmt.getConditionExpr());
        }
        if (sourceStmt instanceof ArkReturnStmt) {
            return new ArkReturnStmt(sourceStmt.getOp());
        }
        if (sourceStmt instanceof ArkReturnVoidStmt) {
            return new ArkReturnVoidStmt();
        }
        if (sourceStmt instanceof ArkThrowStmt) {
            return new ArkThrowStmt(sourceStmt.getOp());
        }
        if (sourceStmt instanceof ArkAliasTypeDefineStmt) {
            return new ArkAliasTypeDefineStmt(sourceStmt.getAliasType(), sourceStmt.getAliasTypeExpr());
        }
        if (sourceStmt instanceof DummyStmt) {
            return new DummyStmt(sourceStmt.toString());
        }
        logger.warn(`unsupported statement type`);
        return null;
    }
}
