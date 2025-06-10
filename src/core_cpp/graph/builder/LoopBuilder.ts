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
import { ArkAssignStmt, ArkIfStmt, Stmt } from '../../base/Stmt';
import { AbstractInvokeExpr } from '../../base/Expr';
import { Builtin } from '../../common/Builtin';
import { ArkIRTransformer } from '../../common/ArkIRTransformer';
import { BlockBuilder } from './CfgBuilder';

/**
 * Builder for loop in CFG
 */
export class LoopBuilder {
    public rebuildBlocksInLoop(
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        blocksContainLoopCondition: Set<BlockBuilder>,
        basicBlockSet: Set<BasicBlock>,
        blockBuilders: BlockBuilder[]
    ): void {
        for (const blockBuilder of blocksContainLoopCondition) {
            if (!blockBuilderToCfgBlock.get(blockBuilder)) {
                continue;
            }
            const block = blockBuilderToCfgBlock.get(blockBuilder) as BasicBlock;

            const blockId = block.getId();
            const stmts = block.getStmts();
            const stmtsCnt = stmts.length;
            const { ifStmtIdx, iteratorNextStmtIdx, dummyInitializerStmtIdx } = this.findIteratorIdx(stmts);
            if (iteratorNextStmtIdx !== -1 || dummyInitializerStmtIdx !== -1) {
                const lastStmtIdxBeforeCondition = iteratorNextStmtIdx !== -1 ? iteratorNextStmtIdx : dummyInitializerStmtIdx;
                const stmtsInsertBeforeCondition = stmts.slice(0, lastStmtIdxBeforeCondition);

                // If the loop body is empty, the loop conditional block should contain its own
                const emptyLoopBody = blockBuilder.nexts.length === 1;
                if (emptyLoopBody) {
                    blockBuilder.nexts.splice(0, 0, blockBuilder);
                    blockBuilder.lasts.push(blockBuilder);
                    block.getSuccessors().splice(0, 0, block);
                    block.addPredecessorBlock(block);
                }

                let prevBlockBuilderContainsLoop = this.doesPrevBlockBuilderContainLoop(blockBuilder, blockId, blocksContainLoopCondition);
                if (prevBlockBuilderContainsLoop) {
                    // should create an extra block when previous block contains loop condition
                    this.insertBeforeConditionBlockBuilder(
                        blockBuilderToCfgBlock,
                        blockBuilder,
                        stmtsInsertBeforeCondition,
                        false,
                        basicBlockSet,
                        blockBuilders
                    );
                } else {
                    const blockBuilderBeforeCondition = blockBuilder.lasts[0];
                    const blockBeforeCondition = blockBuilderToCfgBlock.get(blockBuilderBeforeCondition) as BasicBlock;
                    stmtsInsertBeforeCondition.forEach(stmt => blockBeforeCondition?.getStmts().push(stmt));
                }
                if (dummyInitializerStmtIdx !== -1 && ifStmtIdx !== stmtsCnt - 1) {
                    // put incrementor statements into block which reenters condition
                    this.adjustIncrementorStmts(
                        stmts,
                        ifStmtIdx,
                        blockBuilder,
                        blockId,
                        blockBuilderToCfgBlock,
                        blocksContainLoopCondition,
                        basicBlockSet,
                        emptyLoopBody,
                        blockBuilders
                    );
                } else if (iteratorNextStmtIdx !== -1) {
                    // put statements which get value of iterator into block after condition
                    const blockBuilderAfterCondition = blockBuilder.nexts[0];
                    const blockAfterCondition = blockBuilderToCfgBlock.get(blockBuilderAfterCondition) as BasicBlock;
                    const stmtsAfterCondition = stmts.slice(ifStmtIdx + 1);
                    blockAfterCondition?.getStmts().splice(0, 0, ...stmtsAfterCondition);
                }
                // remove statements which should not in condition
                const firstStmtIdxInCondition = iteratorNextStmtIdx !== -1 ? iteratorNextStmtIdx : dummyInitializerStmtIdx + 1;
                stmts.splice(0, firstStmtIdxInCondition);
                stmts.splice(ifStmtIdx - firstStmtIdxInCondition + 1);
            }
        }
    }

    private doesPrevBlockBuilderContainLoop(currBlockBuilder: BlockBuilder, currBlockId: number, blocksContainLoopCondition: Set<BlockBuilder>): boolean {
        let prevBlockBuilderContainsLoop = false;
        for (const prevBlockBuilder of currBlockBuilder.lasts) {
            if (prevBlockBuilder.id < currBlockId && blocksContainLoopCondition.has(prevBlockBuilder)) {
                prevBlockBuilderContainsLoop = true;
                break;
            }
        }
        return prevBlockBuilderContainsLoop;
    }

    private insertBeforeConditionBlockBuilder(
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        conditionBlockBuilder: BlockBuilder,
        stmtsInsertBeforeCondition: Stmt[],
        collectReenter: Boolean,
        basicBlockSet: Set<BasicBlock>,
        blockBuilders: BlockBuilder[]
    ): void {
        if (stmtsInsertBeforeCondition.length === 0) {
            return;
        }
        const blockId = conditionBlockBuilder.id;
        const block = this.getBlockFromMap(blockBuilderToCfgBlock, conditionBlockBuilder);
        const { blockBuildersBeforeCondition, blocksBeforeCondition, blockBuildersReenterCondition, blocksReenterCondition } =
            this.collectBlocksBeforeAndReenter(blockBuilderToCfgBlock, conditionBlockBuilder, blockId);

        const { collectedBlockBuilders, collectedBlocks } = this.getCollectedBlocks(
            collectReenter,
            blockBuildersBeforeCondition,
            blocksBeforeCondition,
            blockBuildersReenterCondition,
            blocksReenterCondition
        );

        const { blockBuilderInsertBeforeCondition, blockInsertBeforeCondition } = this.createAndLinkBlocks(
            collectedBlockBuilders,
            collectedBlocks,
            conditionBlockBuilder,
            stmtsInsertBeforeCondition,
            block
        );

        this.updatePredecessors(
            collectedBlockBuilders,
            blockBuilderToCfgBlock,
            conditionBlockBuilder,
            blockBuilderInsertBeforeCondition,
            blockInsertBeforeCondition
        );

        const { newPrevBlockBuildersBeforeCondition, newPrevBlocksBeforeCondition } = this.getNewPrevBlocks(
            collectReenter,
            blockBuildersBeforeCondition,
            blocksBeforeCondition,
            blockBuilderInsertBeforeCondition,
            blockInsertBeforeCondition,
            blockBuildersReenterCondition,
            blocksReenterCondition
        );

        this.updateConditionBlockBuilder(conditionBlockBuilder, newPrevBlockBuildersBeforeCondition, block, newPrevBlocksBeforeCondition);

        this.finalizeInsertion(blockBuilderInsertBeforeCondition, blockInsertBeforeCondition, basicBlockSet, blockBuilderToCfgBlock, blockBuilders);
    }

    private getBlockFromMap(blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>, conditionBlockBuilder: BlockBuilder): BasicBlock {
        return blockBuilderToCfgBlock.get(conditionBlockBuilder) as BasicBlock;
    }

    private collectBlocksBeforeAndReenter(
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        conditionBlockBuilder: BlockBuilder,
        blockId: number
    ): {
        blockBuildersBeforeCondition: BlockBuilder[];
        blocksBeforeCondition: BasicBlock[];
        blockBuildersReenterCondition: BlockBuilder[];
        blocksReenterCondition: BasicBlock[];
    } {
        const blockBuildersBeforeCondition: BlockBuilder[] = [];
        const blocksBeforeCondition: BasicBlock[] = [];
        const blockBuildersReenterCondition: BlockBuilder[] = [];
        const blocksReenterCondition: BasicBlock[] = [];
        for (const prevBlockBuilder of conditionBlockBuilder.lasts) {
            const prevBlock = blockBuilderToCfgBlock.get(prevBlockBuilder) as BasicBlock;
            if (prevBlock.getId() < blockId) {
                blockBuildersBeforeCondition.push(prevBlockBuilder);
                blocksBeforeCondition.push(prevBlock);
            } else {
                blockBuildersReenterCondition.push(prevBlockBuilder);
                blocksReenterCondition.push(prevBlock);
            }
        }
        return {
            blockBuildersBeforeCondition,
            blocksBeforeCondition,
            blockBuildersReenterCondition,
            blocksReenterCondition,
        };
    }

    private getCollectedBlocks(
        collectReenter: Boolean,
        blockBuildersBeforeCondition: BlockBuilder[],
        blocksBeforeCondition: BasicBlock[],
        blockBuildersReenterCondition: BlockBuilder[],
        blocksReenterCondition: BasicBlock[]
    ): { collectedBlockBuilders: BlockBuilder[]; collectedBlocks: BasicBlock[] } {
        let collectedBlockBuilders: BlockBuilder[] = [];
        let collectedBlocks: BasicBlock[] = [];
        if (collectReenter) {
            collectedBlockBuilders = blockBuildersReenterCondition;
            collectedBlocks = blocksReenterCondition;
        } else {
            collectedBlockBuilders = blockBuildersBeforeCondition;
            collectedBlocks = blocksBeforeCondition;
        }
        return { collectedBlockBuilders, collectedBlocks };
    }

    private createAndLinkBlocks(
        collectedBlockBuilders: BlockBuilder[],
        collectedBlocks: BasicBlock[],
        conditionBlockBuilder: BlockBuilder,
        stmtsInsertBeforeCondition: Stmt[],
        block: BasicBlock
    ): {
        blockBuilderInsertBeforeCondition: BlockBuilder;
        blockInsertBeforeCondition: BasicBlock;
    } {
        const blockBuilderInsertBeforeCondition = new BlockBuilder(-1, []);
        blockBuilderInsertBeforeCondition.lasts.push(...collectedBlockBuilders);
        blockBuilderInsertBeforeCondition.nexts.push(conditionBlockBuilder);
        const blockInsertBeforeCondition = new BasicBlock();
        stmtsInsertBeforeCondition.forEach(stmt => blockInsertBeforeCondition.getStmts().push(stmt));
        blockInsertBeforeCondition.getPredecessors().push(...collectedBlocks);
        blockInsertBeforeCondition.addSuccessorBlock(block);
        return { blockBuilderInsertBeforeCondition, blockInsertBeforeCondition };
    }

    private updatePredecessors(
        collectedBlockBuilders: BlockBuilder[],
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        conditionBlockBuilder: BlockBuilder,
        blockBuilderInsertBeforeCondition: BlockBuilder,
        blockInsertBeforeCondition: BasicBlock
    ): void {
        for (const prevBlockBuilder of collectedBlockBuilders) {
            const prevBlock = blockBuilderToCfgBlock.get(prevBlockBuilder) as BasicBlock;
            for (let j = 0; j < prevBlockBuilder.nexts.length; j++) {
                if (prevBlockBuilder.nexts[j] === conditionBlockBuilder) {
                    prevBlockBuilder.nexts[j] = blockBuilderInsertBeforeCondition;
                    prevBlock.setSuccessorBlock(j, blockInsertBeforeCondition);
                    break;
                }
            }
        }
    }

    private getNewPrevBlocks(
        collectReenter: Boolean,
        blockBuildersBeforeCondition: BlockBuilder[],
        blocksBeforeCondition: BasicBlock[],
        blockBuilderInsertBeforeCondition: BlockBuilder,
        blockInsertBeforeCondition: BasicBlock,
        blockBuildersReenterCondition: BlockBuilder[],
        blocksReenterCondition: BasicBlock[]
    ): {
        newPrevBlockBuildersBeforeCondition: BlockBuilder[];
        newPrevBlocksBeforeCondition: BasicBlock[];
    } {
        let newPrevBlockBuildersBeforeCondition: BlockBuilder[] = [];
        let newPrevBlocksBeforeCondition: BasicBlock[] = [];
        if (collectReenter) {
            newPrevBlockBuildersBeforeCondition = [...blockBuildersBeforeCondition, blockBuilderInsertBeforeCondition];
            newPrevBlocksBeforeCondition = [...blocksBeforeCondition, blockInsertBeforeCondition];
        } else {
            newPrevBlockBuildersBeforeCondition = [blockBuilderInsertBeforeCondition, ...blockBuildersReenterCondition];
            newPrevBlocksBeforeCondition = [blockInsertBeforeCondition, ...blocksReenterCondition];
        }
        return {
            newPrevBlockBuildersBeforeCondition,
            newPrevBlocksBeforeCondition,
        };
    }

    private updateConditionBlockBuilder(
        conditionBlockBuilder: BlockBuilder,
        newPrevBlockBuildersBeforeCondition: BlockBuilder[],
        block: BasicBlock,
        newPrevBlocksBeforeCondition: BasicBlock[]
    ): void {
        conditionBlockBuilder.lasts = newPrevBlockBuildersBeforeCondition;
        const predecessorsCnt = block.getPredecessors().length;
        block.getPredecessors().splice(0, predecessorsCnt, ...newPrevBlocksBeforeCondition);
    }

    private finalizeInsertion(
        blockBuilderInsertBeforeCondition: BlockBuilder,
        blockInsertBeforeCondition: BasicBlock,
        basicBlockSet: Set<BasicBlock>,
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        blockBuilders: BlockBuilder[]
    ): void {
        blockBuilders.push(blockBuilderInsertBeforeCondition);
        basicBlockSet.add(blockInsertBeforeCondition);
        blockBuilderToCfgBlock.set(blockBuilderInsertBeforeCondition, blockInsertBeforeCondition);
    }

    private findIteratorIdx(stmts: Stmt[]): {
        ifStmtIdx: number;
        iteratorNextStmtIdx: number;
        dummyInitializerStmtIdx: number;
    } {
        let ifStmtIdx = -1;
        let iteratorNextStmtIdx = -1;
        let dummyInitializerStmtIdx = -1;
        const stmtsCnt = stmts.length;
        for (let i = 0; i < stmtsCnt; i++) {
            const stmt = stmts[i];
            if (stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof AbstractInvokeExpr) {
                const invokeExpr = stmt.getRightOp() as AbstractInvokeExpr;
                if (invokeExpr.getMethodSignature().getMethodSubSignature().getMethodName() === Builtin.ITERATOR_NEXT) {
                    iteratorNextStmtIdx = i;
                    continue;
                }
            }
            if (stmt.toString() === ArkIRTransformer.DUMMY_LOOP_INITIALIZER_STMT) {
                dummyInitializerStmtIdx = i;
                continue;
            }
            if (stmt instanceof ArkIfStmt) {
                ifStmtIdx = i;
                break;
            }
        }
        return {
            ifStmtIdx: ifStmtIdx,
            iteratorNextStmtIdx: iteratorNextStmtIdx,
            dummyInitializerStmtIdx: dummyInitializerStmtIdx,
        };
    }

    private adjustIncrementorStmts(
        stmts: Stmt[],
        ifStmtIdx: number,
        currBlockBuilder: BlockBuilder,
        currBlockId: number,
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        blocksContainLoopCondition: Set<BlockBuilder>,
        basicBlockSet: Set<BasicBlock>,
        emptyLoopBody: boolean,
        blockBuilders: BlockBuilder[]
    ): void {
        const stmtsReenterCondition = stmts.slice(ifStmtIdx + 1);
        if (emptyLoopBody) {
            const incrementorBlockBuilder = new BlockBuilder(-1, []);
            incrementorBlockBuilder.lasts.push(currBlockBuilder);
            currBlockBuilder.nexts[0] = incrementorBlockBuilder;
            incrementorBlockBuilder.nexts.push(currBlockBuilder);
            currBlockBuilder.lasts[1] = incrementorBlockBuilder;
            const incrementorBlock = new BasicBlock();
            blockBuilderToCfgBlock.set(incrementorBlockBuilder, incrementorBlock);
            stmtsReenterCondition.forEach(stmt => incrementorBlock.getStmts().push(stmt));
            const currBlock = blockBuilderToCfgBlock.get(currBlockBuilder) as BasicBlock;
            incrementorBlock.getPredecessors().push(currBlock);
            currBlock.setPredecessorBlock(1, incrementorBlock);
            incrementorBlock.addSuccessorBlock(currBlock);
            currBlock.setSuccessorBlock(0, incrementorBlock);
            basicBlockSet.add(incrementorBlock);
            return;
        }

        const blockBuildersReenterCondition: BlockBuilder[] = [];
        for (const prevBlockBuilder of currBlockBuilder.lasts) {
            const prevBlock = blockBuilderToCfgBlock.get(prevBlockBuilder) as BasicBlock;

            if (prevBlock.getId() > currBlockId) {
                blockBuildersReenterCondition.push(prevBlockBuilder);
            }
        }

        if (blockBuildersReenterCondition.length > 1 || blocksContainLoopCondition.has(blockBuildersReenterCondition[0])) {
            // put incrementor statements into an extra block
            this.insertBeforeConditionBlockBuilder(blockBuilderToCfgBlock, currBlockBuilder, stmtsReenterCondition, true, basicBlockSet, blockBuilders);
        } else {
            // put incrementor statements into prev reenter block
            const blockReenterCondition = blockBuilderToCfgBlock.get(blockBuildersReenterCondition[0]) as BasicBlock;
            stmtsReenterCondition.forEach(stmt => blockReenterCondition?.getStmts().push(stmt));
        }
    }
}
