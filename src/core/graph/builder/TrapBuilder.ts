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
import { ArkIRTransformer } from '../../common/ArkIRTransformer';
import { Trap } from '../../base/Trap';
import { ArkCaughtExceptionRef } from '../../base/Ref';
import { UnknownType } from '../../base/Type';
import { FullPosition } from '../../base/Position';
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
import { BlockBuilder, CfgBuilder, TryStatementBuilder } from './CfgBuilder';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'TrapBuilder');

/**
 * Builder for traps from try...catch
 */
export class TrapBuilder {
    private processedBlockBuildersBeforeTry: Set<BlockBuilder>;
    private arkIRTransformer: ArkIRTransformer;
    private basicBlockSet: Set<BasicBlock>;
    private blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>;
    private blockBuildersBeforeTry: Set<BlockBuilder>;

    constructor(blockBuildersBeforeTry: Set<BlockBuilder>, blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        arkIRTransformer: ArkIRTransformer,
        basicBlockSet: Set<BasicBlock>) {
        this.blockBuildersBeforeTry = blockBuildersBeforeTry;
        this.processedBlockBuildersBeforeTry = new Set();
        this.arkIRTransformer = arkIRTransformer;
        this.basicBlockSet = basicBlockSet;
        this.blockBuilderToCfgBlock = blockBuilderToCfgBlock;
    }

    public buildTraps(): Trap[] {
        const traps: Trap[] = [];
        const blockBuildersBeforeTry = Array.from(this.blockBuildersBeforeTry);
        for (const blockBuilderBeforeTry of blockBuildersBeforeTry) {
            traps.push(...this.buildTrapGroup(blockBuilderBeforeTry).traps);
        }
        return traps;
    }

    private buildTrapGroup(blockBuilderBeforeTry: BlockBuilder): {
        traps: Trap[], headBlockBuilder: BlockBuilder | null
    } {
        if (this.shouldSkipProcessing(blockBuilderBeforeTry)) {
            return { traps: [], headBlockBuilder: null };
        }

        const tryStmtBuilder = this.getTryStatementBuilder(blockBuilderBeforeTry);
        if (!tryStmtBuilder) {
            return { traps: [], headBlockBuilder: null };
        }

        if (!tryStmtBuilder.tryFirst || tryStmtBuilder.tryFirst.type.includes('Exit')) {
            return this.handleEmptyTryBody(tryStmtBuilder, blockBuilderBeforeTry);
        }

        const finallyBlockBuilder = this.getFinallyBlock(tryStmtBuilder);
        if (!finallyBlockBuilder) {
            return { traps: [], headBlockBuilder: null };
        }

        const headBlockBuilderWithinTry = this.prepareHeadBlock(blockBuilderBeforeTry);
        const traps: Trap[] = [];

        const tryResult = this.processTryBlock(headBlockBuilderWithinTry, finallyBlockBuilder);
        traps.push(...tryResult.traps);
        const updatedHeadBlock = tryResult.newStartBlockBuilder;

        const catchResult = this.processCatchBlock(tryStmtBuilder);
        traps.push(...catchResult.traps);

        const blockBuilderAfterFinally = this.getAfterFinallyBlock(tryStmtBuilder);

        const singleTraps = this.buildSingleTraps(
            tryResult.bfsBlocks,
            tryResult.tailBlocks,
            catchResult.bfsBlocks,
            catchResult.tailBlocks,
            finallyBlockBuilder,
            blockBuilderAfterFinally,
        );
        traps.push(...singleTraps);

        return { traps, headBlockBuilder: updatedHeadBlock };
    }

    private shouldSkipProcessing(blockBuilderBeforeTry: BlockBuilder): boolean {
        if (this.processedBlockBuildersBeforeTry.has(blockBuilderBeforeTry)) {
            return true;
        }
        this.processedBlockBuildersBeforeTry.add(blockBuilderBeforeTry);

        if (blockBuilderBeforeTry.nexts.length === 0) {
            logger.error(`can't find try block.`);
            return true;
        }
        return false;
    }

    private handleEmptyTryBody(
        tryStmtBuilder: TryStatementBuilder,
        blockBuilderBeforeTry: BlockBuilder
    ): { traps: Trap[], headBlockBuilder: BlockBuilder | null } {
        if (this.shouldRemoveEmptyBlockBeforeTry(blockBuilderBeforeTry)) {
            const nextBlockBuilder = blockBuilderBeforeTry.nexts[0];
            this.removeEmptyBlockBeforeTry(blockBuilderBeforeTry);
            return { traps: [], headBlockBuilder: nextBlockBuilder };
        }
        return { traps: [], headBlockBuilder: null };
    }

    private getTryStatementBuilder(blockBuilderBeforeTry: BlockBuilder): TryStatementBuilder | null {
        const stmtsCnt = blockBuilderBeforeTry.stmts.length;
        const tryStmtBuilder = blockBuilderBeforeTry.stmts[stmtsCnt - 1] as TryStatementBuilder;
        return tryStmtBuilder;
    }

    private getFinallyBlock(tryStmtBuilder: TryStatementBuilder): BlockBuilder | null {
        const finallyBlockBuilder = tryStmtBuilder.finallyStatement?.block;
        if (!finallyBlockBuilder) {
            logger.error(`can't find finally block or dummy finally block.`);
            return null;
        }
        return finallyBlockBuilder;
    }

    private prepareHeadBlock(blockBuilderBeforeTry: BlockBuilder): BlockBuilder {
        const headBlockBuilderWithinTry = blockBuilderBeforeTry.nexts[0];
        this.removeEmptyBlockBeforeTry(blockBuilderBeforeTry);
        return headBlockBuilderWithinTry;
    }

    private processTryBlock(
        headBlockBuilderWithinTry: BlockBuilder,
        finallyBlockBuilder: BlockBuilder
    ): { traps: Trap[], newStartBlockBuilder: BlockBuilder, bfsBlocks: BasicBlock[], tailBlocks: BasicBlock[] } {
        const result = this.buildTrapsRecursively(headBlockBuilderWithinTry, finallyBlockBuilder);
        const { bfsBlocks, tailBlocks } = this.getAllBlocksBFS(
            result.newStartBlockBuilder,
            finallyBlockBuilder
        );
        return {
            traps: result.traps,
            newStartBlockBuilder: result.newStartBlockBuilder,
            bfsBlocks,
            tailBlocks
        };
    }

    private processCatchBlock(
        tryStmtBuilder: TryStatementBuilder
    ): { traps: Trap[], bfsBlocks: BasicBlock[], tailBlocks: BasicBlock[] } {
        const catchBlockBuilder = tryStmtBuilder.catchStatement?.block;
        if (!catchBlockBuilder) {
            return { traps: [], bfsBlocks: [], tailBlocks: [] };
        }

        const result = this.buildTrapsRecursively(catchBlockBuilder);
        const { bfsBlocks, tailBlocks } = this.getAllBlocksBFS(result.newStartBlockBuilder);
        return {
            traps: result.traps,
            bfsBlocks,
            tailBlocks
        };
    }

    private getAfterFinallyBlock(tryStmtBuilder: TryStatementBuilder): BlockBuilder | null {
        const blockBuilderAfterFinally = tryStmtBuilder.afterFinal?.block;
        if (!blockBuilderAfterFinally) {
            return null;
        }
        return blockBuilderAfterFinally;
    }

    private buildSingleTraps(
        tryBfsBlocks: BasicBlock[],
        tryTailBlocks: BasicBlock[],
        catchBfsBlocks: BasicBlock[],
        catchTailBlocks: BasicBlock[],
        finallyBlockBuilder: BlockBuilder,
        blockBuilderAfterFinally: BlockBuilder | null,
    ): Trap[] {
        const finallyStmts = finallyBlockBuilder.stmts;
        if (finallyStmts.length === 1 && finallyStmts[0].code === 'dummyFinally') {
            return this.buildTrapsIfNoFinally(
                tryBfsBlocks,
                tryTailBlocks,
                catchBfsBlocks,
                catchTailBlocks,
                finallyBlockBuilder
            );
        } else {
            return this.buildTrapsIfFinallyExist(
                tryBfsBlocks,
                tryTailBlocks,
                catchBfsBlocks,
                catchTailBlocks,
                finallyBlockBuilder,
                blockBuilderAfterFinally
            );
        }
    }

    private buildTrapsRecursively(startBlockBuilder: BlockBuilder,
        endBlockBuilder?: BlockBuilder): {
            traps: Trap[], newStartBlockBuilder: BlockBuilder
        } {
        const queue: BlockBuilder[] = [];
        const visitedBlockBuilders = new Set<BlockBuilder>();
        queue.push(startBlockBuilder);
        while (queue.length !== 0) {
            const currBlockBuilder = queue.splice(0, 1)[0];
            if (visitedBlockBuilders.has(currBlockBuilder)) {
                continue;
            }
            visitedBlockBuilders.add(currBlockBuilder);

            const childList = currBlockBuilder.nexts;
            for (const child of childList) {
                if (child !== endBlockBuilder) {
                    queue.push(child);
                }
            }
        }
        const allTraps: Trap[] = [];
        for (const blockBuilder of visitedBlockBuilders) {
            if (this.blockBuildersBeforeTry.has(blockBuilder)) {
                const { traps, headBlockBuilder } = this.buildTrapGroup(blockBuilder);
                allTraps.push(...traps);
                if (blockBuilder === startBlockBuilder && headBlockBuilder && this.shouldRemoveEmptyBlockBeforeTry(blockBuilder)) {
                    startBlockBuilder = headBlockBuilder;
                }
            }
        }
        return { traps: allTraps, newStartBlockBuilder: startBlockBuilder };
    }

    private removeEmptyBlockBeforeTry(blockBuilderBeforeTry: BlockBuilder): void {
        if (!this.shouldRemoveEmptyBlockBeforeTry(blockBuilderBeforeTry)) {
            return;
        }

        const blockBeforeTry = this.blockBuilderToCfgBlock.get(blockBuilderBeforeTry)!;
        CfgBuilder.pruneBlockBuilder(blockBuilderBeforeTry);
        CfgBuilder.pruneBasicBlock(blockBeforeTry);
        this.basicBlockSet.delete(this.blockBuilderToCfgBlock.get(blockBuilderBeforeTry)!);
        this.blockBuilderToCfgBlock.delete(blockBuilderBeforeTry);
    }

    private shouldRemoveEmptyBlockBeforeTry(blockBuilderBeforeTry: BlockBuilder): boolean {
        const stmtsCnt = blockBuilderBeforeTry.stmts.length;
        // This BlockBuilder contains only one redundant TryStatementBuilder, so the BlockBuilder can be deleted.
        return stmtsCnt === 1;
    }

    private buildTrapsIfNoFinally(
        tryBfsBlocks: BasicBlock[],
        tryTailBlocks: BasicBlock[],
        catchBfsBlocks: BasicBlock[],
        catchTailBlocks: BasicBlock[],
        dummyFinallyBlockBuilder: BlockBuilder,
    ): Trap[] {
        if (catchBfsBlocks.length === 0) {
            logger.error(`catch block expected.`);
            return [];
        }

        const dummyFinallyBlock = this.blockBuilderToCfgBlock.get(dummyFinallyBlockBuilder)!;
        CfgBuilder.pruneBasicBlock(dummyFinallyBlock);
        this.basicBlockSet.delete(dummyFinallyBlock);

        const blockBuilderAfterFinally = dummyFinallyBlockBuilder.nexts[0];
        let blockAfterFinally: BasicBlock | undefined = this.blockBuilderToCfgBlock.get(blockBuilderAfterFinally);
        if (!this.blockBuilderToCfgBlock.has(dummyFinallyBlockBuilder)) {
            logger.error(`can't find basicBlock corresponding to the blockBuilder.`);
            return [];
        }
        if (blockAfterFinally) {
            for (const catchTailBlock of catchTailBlocks) {
                CfgBuilder.linkBasicBlock(catchTailBlock, blockAfterFinally);
            }
        }
        for (const tryTailBlock of tryTailBlocks) {
            CfgBuilder.linkExceptionalBasicBlock(tryTailBlock, catchBfsBlocks[0]);
        }
        return [new Trap(tryBfsBlocks, catchBfsBlocks)];
    }

    private buildTrapsIfFinallyExist(
        tryBfsBlocks: BasicBlock[],
        tryTailBlocks: BasicBlock[],
        catchBfsBlocks: BasicBlock[],
        catchTailBlocks: BasicBlock[],
        finallyBlockBuilder: BlockBuilder,
        blockBuilderAfterFinally: BlockBuilder | null,
    ): Trap[] {
        const traps: Trap[] = [];
        const endBlock = blockBuilderAfterFinally ?? undefined;
        const {
            traps: trapsInFinally, newStartBlockBuilder: newStartBlockBuilder,
        } = this.buildTrapsRecursively(finallyBlockBuilder, endBlock);
        traps.push(...trapsInFinally);
        // May update head blockBuilder with catch statement.
        finallyBlockBuilder = newStartBlockBuilder;

        const { bfsBlocks: finallyBfsBlocks, tailBlocks: finallyTailBlocks } = this.getAllBlocksBFS(
            finallyBlockBuilder,
            endBlock
        );
        if (finallyBfsBlocks.length === 0) {
            if (catchBfsBlocks.length !== 0) {
                for (const tryTailBlock of tryTailBlocks) {
                    CfgBuilder.linkExceptionalBasicBlock(tryTailBlock, catchBfsBlocks[0]);
                }
                traps.push(new Trap(tryBfsBlocks, catchBfsBlocks));
            }
            return traps;
        }
        const copyFinallyBfsBlocks = this.copyFinallyBlocks(finallyBfsBlocks, finallyTailBlocks);
        if (catchBfsBlocks.length !== 0) {
            for (const catchTailBlock of catchTailBlocks) {
                CfgBuilder.linkBasicBlock(catchTailBlock, finallyBfsBlocks[0]);
            }

            // try -> catch trap
            for (const tryTailBlock of tryTailBlocks) {
                CfgBuilder.linkExceptionalBasicBlock(tryTailBlock, catchBfsBlocks[0]);
            }
            traps.push(new Trap(tryBfsBlocks, catchBfsBlocks));

            // catch -> finally trap
            for (const catchTailBlock of catchTailBlocks) {
                CfgBuilder.linkExceptionalBasicBlock(catchTailBlock, copyFinallyBfsBlocks[0]);
            }
            traps.push(new Trap(catchBfsBlocks, copyFinallyBfsBlocks));
        } else {
            // try -> finally trap
            for (const tryTailBlock of tryTailBlocks) {
                CfgBuilder.linkExceptionalBasicBlock(tryTailBlock, copyFinallyBfsBlocks[0]);
            }
            traps.push(new Trap(tryBfsBlocks, copyFinallyBfsBlocks));
        }
        return traps;
    }

    private getAllBlocksBFS(
        startBlockBuilder: BlockBuilder,
        endBlockBuilder?: BlockBuilder
    ): { bfsBlocks: BasicBlock[]; tailBlocks: BasicBlock[] } {
        const bfsBlocks: BasicBlock[] = [];
        const tailBlocks: BasicBlock[] = [];
        const startBlock = this.blockBuilderToCfgBlock.get(startBlockBuilder);
        if (!startBlock) {
            return { bfsBlocks, tailBlocks };
        }
        const endBlock = endBlockBuilder ? this.blockBuilderToCfgBlock.get(endBlockBuilder) : undefined;
        const queue: BasicBlock[] = [];
        const visitedBlocks = new Set<BasicBlock>();
        queue.push(startBlock);
        while (queue.length !== 0) {
            const currBlock = queue.splice(0, 1)[0];
            if (visitedBlocks.has(currBlock)) {
                continue;
            }
            visitedBlocks.add(currBlock);
            bfsBlocks.push(currBlock);
            const successors = currBlock.getSuccessors();
            if (successors.length !== 0) {
                for (const successor of successors) {
                    if (successor === endBlock) {
                        tailBlocks.push(currBlock);
                    } else {
                        // A tail block's successor may be within the traversal range
                        queue.push(successor);
                    }
                }
            } else {
                tailBlocks.push(currBlock);
            }
        }
        return { bfsBlocks, tailBlocks };
    }

    private copyFinallyBlocks(finallyBfsBlocks: BasicBlock[], finallyTailBlocks: BasicBlock[]): BasicBlock[] {
        const copyFinallyBfsBlocks = this.copyBlocks(finallyBfsBlocks);
        const caughtExceptionRef = new ArkCaughtExceptionRef(UnknownType.getInstance());
        const {
            value: exceptionValue, stmts: exceptionAssignStmts,
        } = this.arkIRTransformer.generateAssignStmtForValue(caughtExceptionRef, [FullPosition.DEFAULT]);
        copyFinallyBfsBlocks[0].addHead(exceptionAssignStmts);
        CfgBuilder.unlinkPredecessorsOfBasicBlock(copyFinallyBfsBlocks[0]);
        const throwStmt = new ArkThrowStmt(exceptionValue);
        let copyFinallyTailBlocks = copyFinallyBfsBlocks.splice(copyFinallyBfsBlocks.length - finallyTailBlocks.length, finallyTailBlocks.length);
        if (copyFinallyTailBlocks.length > 1) {
            const newCopyFinallyTailBlock = new BasicBlock();
            copyFinallyTailBlocks.forEach((copyFinallyTailBlock: BasicBlock) => {
                CfgBuilder.linkBasicBlock(copyFinallyTailBlock, newCopyFinallyTailBlock);
            });
            copyFinallyBfsBlocks.push(...copyFinallyTailBlocks);
            copyFinallyTailBlocks = [newCopyFinallyTailBlock];
        }
        copyFinallyTailBlocks[0].addStmt(throwStmt);
        copyFinallyBfsBlocks.push(...copyFinallyTailBlocks);
        copyFinallyBfsBlocks.forEach((copyFinallyBfsBlock: BasicBlock) => {
            this.basicBlockSet.add(copyFinallyBfsBlock);
        });
        return copyFinallyBfsBlocks;
    }

    private copyBlocks(sourceBlocks: BasicBlock[]): BasicBlock[] {
        const sourceToTarget = new Map<BasicBlock, BasicBlock>();
        const targetBlocks: BasicBlock[] = [];
        for (const sourceBlock of sourceBlocks) {
            const targetBlock = new BasicBlock();
            for (const stmt of sourceBlock.getStmts()) {
                targetBlock.addStmt(this.copyStmt(stmt)!);
            }
            sourceToTarget.set(sourceBlock, targetBlock);
            targetBlocks.push(targetBlock);
        }
        for (const sourceBlock of sourceBlocks) {
            const targetBlock = sourceToTarget.get(sourceBlock)!;
            for (const predecessor of sourceBlock.getPredecessors()) {
                const targetPredecessor = sourceToTarget.get(predecessor);
                // Only include blocks within the copy range, so that predecessor and successor relationships to
                // external blocks can be trimmed
                if (targetPredecessor) {
                    targetBlock.addPredecessorBlock(targetPredecessor);
                }

            }
            for (const successor of sourceBlock.getSuccessors()) {
                const targetSuccessor = sourceToTarget.get(successor);
                if (targetSuccessor) {
                    targetBlock.addSuccessorBlock(targetSuccessor);
                }
            }
        }
        return targetBlocks;
    }

    private copyStmt(sourceStmt: Stmt): Stmt | null {
        if (sourceStmt instanceof ArkAssignStmt) {
            const target = new ArkAssignStmt(sourceStmt.getLeftOp(), sourceStmt.getRightOp());
            this.copyOriginPosition(sourceStmt, target);
            return target;
        } else if (sourceStmt instanceof ArkInvokeStmt) {
            const target = new ArkInvokeStmt(sourceStmt.getInvokeExpr());
            this.copyOriginPosition(sourceStmt, target);
            return target;
        } else if (sourceStmt instanceof ArkIfStmt) {
            const target = new ArkIfStmt(sourceStmt.getConditionExpr());
            this.copyOriginPosition(sourceStmt, target);
            return target;
        } else if (sourceStmt instanceof ArkReturnStmt) {
            const target = new ArkReturnStmt(sourceStmt.getOp());
            this.copyOriginPosition(sourceStmt, target);
            return target;
        } else if (sourceStmt instanceof ArkReturnVoidStmt) {
            const target = new ArkReturnVoidStmt();
            this.copyOriginPosition(sourceStmt, target);
            return target;
        } else if (sourceStmt instanceof ArkThrowStmt) {
            const target = new ArkThrowStmt(sourceStmt.getOp());
            this.copyOriginPosition(sourceStmt, target);
            return target;
        } else if (sourceStmt instanceof ArkAliasTypeDefineStmt) {
            const target = new ArkAliasTypeDefineStmt(sourceStmt.getAliasType(), sourceStmt.getAliasTypeExpr());
            this.copyOriginPosition(sourceStmt, target);
            return target;
        } else {
            logger.error(`unsupported statement type`);
            return null;
        }
    }

    private copyOriginPosition(source: Stmt, target: Stmt): void {
        const originPos = source.getOriginFullPosition();
        if (originPos) {
            target.setOriginFullPosition(originPos);
        }
    }
}
