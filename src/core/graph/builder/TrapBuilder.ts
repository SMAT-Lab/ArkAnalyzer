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
    ArkAssignStmt,
    ArkIfStmt,
    ArkInvokeStmt,
    ArkReturnStmt,
    ArkReturnVoidStmt,
    ArkThrowStmt,
    Stmt,
} from '../../base/Stmt';
import { BlockBuilder, TryStatementBuilder } from './CfgBuilder';
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
        if (!blockBuilderAfterFinally) {
            return { traps: [], headBlockBuilder: null };
        }

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
            logger.error(`can't find block after try...catch.`);
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
        blockBuilderAfterFinally: BlockBuilder,
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
                if (blockBuilder === startBlockBuilder && this.shouldRemoveEmptyBlockBeforeTry(blockBuilder)) {
                    startBlockBuilder = headBlockBuilder!;
                }
            }
        }
        return { traps: allTraps, newStartBlockBuilder: startBlockBuilder };
    }

    private removeEmptyBlockBeforeTry(blockBuilderBeforeTry: BlockBuilder): void {
        if (!this.shouldRemoveEmptyBlockBeforeTry(blockBuilderBeforeTry)) {
            return;
        }

        const headBlockBuilderWithinTry = blockBuilderBeforeTry.nexts[0];
        const headBlockWithinTry = this.blockBuilderToCfgBlock.get(headBlockBuilderWithinTry)!;
        headBlockWithinTry.getPredecessors().splice(0, 1);
        const prevsOfBlockBuilderBeforeTry = blockBuilderBeforeTry.lasts;
        for (const prevBlockBuilder of prevsOfBlockBuilderBeforeTry) {
            const prevBlock = this.blockBuilderToCfgBlock.get(prevBlockBuilder)!;
            for (let j = 0; j < prevBlockBuilder.nexts.length; j++) {
                if (prevBlockBuilder.nexts[j] === blockBuilderBeforeTry) {
                    prevBlockBuilder.nexts[j] = headBlockBuilderWithinTry;
                    prevBlock.setSuccessorBlock(j, headBlockWithinTry);
                    break;
                }
            }
            headBlockWithinTry.addPredecessorBlock(prevBlock);
        }
        headBlockBuilderWithinTry.lasts.splice(0, 1, ...prevsOfBlockBuilderBeforeTry);
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
        finallyBlockBuilder: BlockBuilder,
    ): Trap[] {
        if (catchBfsBlocks.length === 0) {
            logger.error(`catch block expected.`);
            return [];
        }
        const blockBuilderAfterFinally = finallyBlockBuilder.nexts[0];
        let blockAfterFinally: BasicBlock = this.blockBuilderToCfgBlock.get(blockBuilderAfterFinally)!;
        if (!this.blockBuilderToCfgBlock.has(finallyBlockBuilder)) {
            logger.error(`can't find basicBlock corresponding to the blockBuilder.`);
            return [];
        }
        const finallyBlock = this.blockBuilderToCfgBlock.get(finallyBlockBuilder)!;
        let dummyFinallyIdxInPredecessors = -1;
        for (let i = 0; i < blockAfterFinally.getPredecessors().length; i++) {
            if (blockAfterFinally.getPredecessors()[i] === finallyBlock) {
                dummyFinallyIdxInPredecessors = i;
                break;
            }
        }
        if (dummyFinallyIdxInPredecessors === -1) {
            logger.error(`Dummy finally block isn't a predecessor of block after finally block.`);
            return [];
        }
        blockAfterFinally.getPredecessors().splice(dummyFinallyIdxInPredecessors, 1);
        for (const tryTailBlock of tryTailBlocks) {
            tryTailBlock.setSuccessorBlock(0, blockAfterFinally);
            blockAfterFinally.addPredecessorBlock(tryTailBlock);
        }
        this.basicBlockSet.delete(finallyBlock);

        for (const catchTailBlock of catchTailBlocks) {
            catchTailBlock.addSuccessorBlock(blockAfterFinally);
            blockAfterFinally.addPredecessorBlock(catchTailBlock);
        }
        for (const tryTailBlock of tryTailBlocks) {
            tryTailBlock.addExceptionalSuccessorBlock(catchBfsBlocks[0]);
        }
        return [new Trap(tryBfsBlocks, catchBfsBlocks)];
    }

    private buildTrapsIfFinallyExist(
        tryBfsBlocks: BasicBlock[],
        tryTailBlocks: BasicBlock[],
        catchBfsBlocks: BasicBlock[],
        catchTailBlocks: BasicBlock[],
        finallyBlockBuilder: BlockBuilder,
        blockBuilderAfterFinally: BlockBuilder,
    ): Trap[] {
        const traps: Trap[] = [];
        const {
            traps: trapsInFinally, newStartBlockBuilder: newStartBlockBuilder,
        } = this.buildTrapsRecursively(finallyBlockBuilder, blockBuilderAfterFinally);
        traps.push(...trapsInFinally);
        // May update head blockBuilder with catch statement.
        finallyBlockBuilder = newStartBlockBuilder;

        const { bfsBlocks: finallyBfsBlocks, tailBlocks: finallyTailBlocks } = this.getAllBlocksBFS(
            finallyBlockBuilder,
            blockBuilderAfterFinally
        );
        const copyFinallyBfsBlocks = this.copyFinallyBlocks(finallyBfsBlocks, finallyTailBlocks);
        if (catchBfsBlocks.length !== 0) {
            for (const catchTailBlock of catchTailBlocks) {
                catchTailBlock.addSuccessorBlock(finallyBfsBlocks[0]);
                finallyBfsBlocks[0].addPredecessorBlock(catchTailBlock);
            }
            // try -> catch trap
            for (const tryTailBlock of tryTailBlocks) {
                tryTailBlock.addExceptionalSuccessorBlock(catchBfsBlocks[0]);
            }
            traps.push(new Trap(tryBfsBlocks, catchBfsBlocks));
            // catch -> finally trap
            for (const catchTailBlock of catchTailBlocks) {
                catchTailBlock.addExceptionalSuccessorBlock(copyFinallyBfsBlocks[0]);
            }
            traps.push(new Trap(catchBfsBlocks, copyFinallyBfsBlocks));
        } else {
            // try -> finally trap
            for (const tryTailBlock of tryTailBlocks) {
                tryTailBlock.addExceptionalSuccessorBlock(copyFinallyBfsBlocks[0]);
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
        const startBlock = this.blockBuilderToCfgBlock.get(startBlockBuilder)!;
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
        const finallyPredecessorsCnt = copyFinallyBfsBlocks[0].getPredecessors().length;
        copyFinallyBfsBlocks[0].getPredecessors().splice(0, finallyPredecessorsCnt);
        const throwStmt = new ArkThrowStmt(exceptionValue);
        let copyFinallyTailBlocks = copyFinallyBfsBlocks.splice(copyFinallyBfsBlocks.length - finallyTailBlocks.length, finallyTailBlocks.length);
        if (copyFinallyTailBlocks.length > 1) {
            const newCopyFinallyTailBlock = new BasicBlock();
            copyFinallyTailBlocks.forEach((copyFinallyTailBlock: BasicBlock) => {
                copyFinallyTailBlock.addSuccessorBlock(newCopyFinallyTailBlock);
                newCopyFinallyTailBlock.addPredecessorBlock(copyFinallyTailBlock);
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
            return new ArkAssignStmt(sourceStmt.getLeftOp(), sourceStmt.getRightOp());
        } else if (sourceStmt instanceof ArkInvokeStmt) {
            return new ArkInvokeStmt(sourceStmt.getInvokeExpr());
        } else if (sourceStmt instanceof ArkIfStmt) {
            return new ArkIfStmt(sourceStmt.getConditionExpr());
        } else if (sourceStmt instanceof ArkReturnStmt) {
            return new ArkReturnStmt(sourceStmt.getOp());
        } else if (sourceStmt instanceof ArkReturnVoidStmt) {
            return new ArkReturnVoidStmt();
        } else if (sourceStmt instanceof ArkThrowStmt) {
            return new ArkThrowStmt(sourceStmt.getOp());
        }
        return null;
    }
}
