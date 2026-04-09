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

import { BasicBlock } from '../../../../core/graph/BasicBlock';
import { CxxTrap } from '../../base/Trap';
import { BlockBuilder, TryStatementBuilder } from './CfgBuilder';
import Logger, { LOG_MODULE_TYPE } from '../../../../utils/logger';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'TrapBuilder');

/**
 * Builder for traps from try...catch
 */
export class CxxTrapBuilder {
    private processedBlockBuildersBeforeTry: Set<BlockBuilder>;
    private basicBlockSet: Set<BasicBlock>;
    private blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>;
    private blockBuildersBeforeTry: Set<BlockBuilder>;

    constructor(blockBuildersBeforeTry: Set<BlockBuilder>, blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        basicBlockSet: Set<BasicBlock>) {
        this.blockBuildersBeforeTry = blockBuildersBeforeTry;
        this.processedBlockBuildersBeforeTry = new Set();
        this.basicBlockSet = basicBlockSet;
        this.blockBuilderToCfgBlock = blockBuilderToCfgBlock;
    }

    public buildTraps(): CxxTrap[] {
        const traps: CxxTrap[] = [];
        const blockBuildersBeforeTry = Array.from(this.blockBuildersBeforeTry);
        for (const blockBuilderBeforeTry of blockBuildersBeforeTry) {
            traps.push(...this.buildTrapGroup(blockBuilderBeforeTry).traps);
        }
        return traps;
    }

    private buildTrapGroup(blockBuilderBeforeTry: BlockBuilder): {
        traps: CxxTrap[], headBlockBuilder: BlockBuilder | null
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
        const traps: CxxTrap[] = [];

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
            catchResult.bfsBlocks, // It is a two-dimensional array here now.
            catchResult.tailBlocks, // It is a two-dimensional array here now.
            finallyBlockBuilder,

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
        return blockBuilderBeforeTry.stmts[stmtsCnt - 1] as TryStatementBuilder;
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
    ): { traps: CxxTrap[], newStartBlockBuilder: BlockBuilder, bfsBlocks: BasicBlock[], tailBlocks: BasicBlock[] } {
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
    ): { traps: CxxTrap[], bfsBlocks: BasicBlock[][], tailBlocks: BasicBlock[][] } {
        const allCatchBfsBlocks: BasicBlock[][] = [];
        const allCatchTailBlocks: BasicBlock[][] = [];
        const allTraps: CxxTrap[] = [];

        // 处理每个 catch 块
        for (const catchStatement of tryStmtBuilder.catchStatement) {
            const catchBlockBuilder = catchStatement?.block;
            if (catchBlockBuilder) {
                const result = this.buildTrapsRecursively(catchBlockBuilder);
                const { bfsBlocks, tailBlocks } = this.getAllBlocksBFS(result.newStartBlockBuilder);
                allCatchBfsBlocks.push(bfsBlocks);
                allCatchTailBlocks.push(tailBlocks);
                allTraps.push(...result.traps);
            }
        }

        return {
            traps: allTraps,
            bfsBlocks: allCatchBfsBlocks,
            tailBlocks: allCatchTailBlocks
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
        catchBfsBlocks: BasicBlock[][],
        catchTailBlocks: BasicBlock[][],
        finallyBlockBuilder: BlockBuilder,
    ): CxxTrap[] {
        return this.buildTrapsIfNoFinally(
            tryBfsBlocks,
            tryTailBlocks,
            catchBfsBlocks,
            catchTailBlocks,
            finallyBlockBuilder,
        );
    }

    private buildTrapsRecursively(startBlockBuilder: BlockBuilder,
        endBlockBuilder?: BlockBuilder): {
            traps: CxxTrap[], newStartBlockBuilder: BlockBuilder
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
        const allTraps: CxxTrap[] = [];
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
        catchBfsBlocks: BasicBlock[][], // Two-dimensional array, each subarray represents a catch block group
        catchTailBlocks: BasicBlock[][],
        finallyBlockBuilder: BlockBuilder,
    ): CxxTrap[] {
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
            const finallyIndex = tryTailBlock.getSuccessors().findIndex(succ => succ === finallyBlock);
            tryTailBlock.setSuccessorBlock(finallyIndex, blockAfterFinally);
            blockAfterFinally.addPredecessorBlock(tryTailBlock);
        }
        this.basicBlockSet.delete(finallyBlock);

        // 连接所有catch块组到finally后的块
        for (let i = 0; i < catchBfsBlocks.length; i++) {
            const catchBfsBlockGroup = catchBfsBlocks[i];
            const catchTailBlockGroup = catchTailBlocks[i];

            for (const catchTailBlock of catchTailBlockGroup) {
                catchTailBlock.addSuccessorBlock(blockAfterFinally);
                blockAfterFinally.addPredecessorBlock(catchTailBlock);
            }

            // 建立try到每个catch块组的异常连接
            for (const tryTailBlock of tryTailBlocks) {
                tryTailBlock.addExceptionalSuccessorBlock(catchBfsBlockGroup[0]);
                catchBfsBlockGroup[0].addExceptionalPredecessorBlock(tryTailBlock);
            }
        }

        // 创建一个Trap，包含一个try块和多个catch块组
        return [new CxxTrap(tryBfsBlocks, catchBfsBlocks)];
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
}
