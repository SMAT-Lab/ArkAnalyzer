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
    public buildTraps(
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        blockBuildersBeforeTry: Set<BlockBuilder>,
        arkIRTransformer: ArkIRTransformer,
        basicBlockSet: Set<BasicBlock>
    ): Trap[] {
        const traps: Trap[] = [];
        for (const blockBuilderBeforeTry of blockBuildersBeforeTry) {
            if (blockBuilderBeforeTry.nexts.length === 0) {
                logger.error(`can't find try block.`);
                continue;
            }
            const blockBuilderContainTry = blockBuilderBeforeTry.nexts[0];
            const stmtsCnt = blockBuilderBeforeTry.stmts.length;
            const tryStmtBuilder = blockBuilderBeforeTry.stmts[stmtsCnt - 1] as TryStatementBuilder;
            const finallyBlockBuilder = tryStmtBuilder.finallyStatement?.block;
            if (!finallyBlockBuilder) {
                logger.error(`can't find finally block or dummy finally block.`);
                continue;
            }
            const { bfsBlocks: tryBfsBlocks, tailBlocks: tryTailBlocks } = this.getAllBlocksBFS(
                blockBuilderToCfgBlock,
                blockBuilderContainTry,
                finallyBlockBuilder
            );
            let catchBfsBlocks: BasicBlock[] = [];
            let catchTailBlocks: BasicBlock[] = [];
            const catchBlockBuilder = tryStmtBuilder.catchStatement?.block;
            if (catchBlockBuilder) {
                ({ bfsBlocks: catchBfsBlocks, tailBlocks: catchTailBlocks } = this.getAllBlocksBFS(blockBuilderToCfgBlock, catchBlockBuilder));
            }
            const finallyStmts = finallyBlockBuilder.stmts;
            const blockBuilderAfterFinally = tryStmtBuilder.afterFinal?.block;
            if (!blockBuilderAfterFinally) {
                logger.error(`can't find block after try...catch.`);
                continue;
            }
            if (finallyStmts.length === 1 && finallyStmts[0].code === 'dummyFinally') {
                // no finally block
                const trapsIfNoFinally = this.buildTrapsIfNoFinally(
                    tryBfsBlocks,
                    tryTailBlocks,
                    catchBfsBlocks,
                    catchTailBlocks,
                    finallyBlockBuilder,
                    blockBuilderAfterFinally,
                    basicBlockSet,
                    blockBuilderToCfgBlock
                );
                if (trapsIfNoFinally) {
                    traps.push(...trapsIfNoFinally);
                }
            } else {
                const trapsIfFinallyExist = this.buildTrapsIfFinallyExist(
                    tryBfsBlocks,
                    tryTailBlocks,
                    catchBfsBlocks,
                    catchTailBlocks,
                    finallyBlockBuilder,
                    blockBuilderAfterFinally,
                    basicBlockSet,
                    arkIRTransformer,
                    blockBuilderToCfgBlock
                );
                traps.push(...trapsIfFinallyExist);
            }
        }
        return traps;
    }

    private buildTrapsIfNoFinally(
        tryBfsBlocks: BasicBlock[],
        tryTailBlocks: BasicBlock[],
        catchBfsBlocks: BasicBlock[],
        catchTailBlocks: BasicBlock[],
        finallyBlockBuilder: BlockBuilder,
        blockBuilderAfterFinally: BlockBuilder,
        basicBlockSet: Set<BasicBlock>,
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>
    ): Trap[] | null {
        if (catchBfsBlocks.length === 0) {
            logger.error(`catch block expected.`);
            return null;
        }
        if (!blockBuilderToCfgBlock.has(blockBuilderAfterFinally)) {
            logger.error(`can't find basicBlock corresponding to the blockBuilder.`);
            return null;
        }
        let blockAfterFinally: BasicBlock = blockBuilderToCfgBlock.get(blockBuilderAfterFinally)!;
        if (!blockBuilderToCfgBlock.has(finallyBlockBuilder)) {
            logger.error(`can't find basicBlock corresponding to the blockBuilder.`);
            return null;
        }
        const finallyBlock = blockBuilderToCfgBlock.get(finallyBlockBuilder)!;
        let dummyFinallyIdxInPredecessors = -1;
        for (let i = 0; i < blockAfterFinally.getPredecessors().length; i++) {
            if (blockAfterFinally.getPredecessors()[i] === finallyBlock) {
                dummyFinallyIdxInPredecessors = i;
                break;
            }
        }
        if (dummyFinallyIdxInPredecessors === -1) {
            return null;
        }
        blockAfterFinally.getPredecessors().splice(dummyFinallyIdxInPredecessors, 1);
        for (const tryTailBlock of tryTailBlocks) {
            tryTailBlock.setSuccessorBlock(0, blockAfterFinally);
            blockAfterFinally.addPredecessorBlock(tryTailBlock);
        }
        basicBlockSet.delete(finallyBlock);

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
        basicBlockSet: Set<BasicBlock>,
        arkIRTransformer: ArkIRTransformer,
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>
    ): Trap[] {
        const { bfsBlocks: finallyBfsBlocks, tailBlocks: finallyTailBlocks } = this.getAllBlocksBFS(
            blockBuilderToCfgBlock,
            finallyBlockBuilder,
            blockBuilderAfterFinally
        );
        const copyFinallyBfsBlocks = this.copyFinallyBlocks(finallyBfsBlocks, finallyTailBlocks, basicBlockSet, arkIRTransformer, blockBuilderToCfgBlock);
        const traps: Trap[] = [];
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
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        startBlockBuilder: BlockBuilder,
        endBlockBuilder?: BlockBuilder
    ): { bfsBlocks: BasicBlock[]; tailBlocks: BasicBlock[] } {
        const bfsBlocks: BasicBlock[] = [];
        const tailBlocks: BasicBlock[] = [];
        const queue: BlockBuilder[] = [];
        const visitedBlockBuilders = new Set<BlockBuilder>();
        queue.push(startBlockBuilder);
        while (queue.length !== 0) {
            const currBlockBuilder = queue.splice(0, 1)[0];
            if (visitedBlockBuilders.has(currBlockBuilder)) {
                continue;
            }
            visitedBlockBuilders.add(currBlockBuilder);
            if (!blockBuilderToCfgBlock.has(currBlockBuilder)) {
                logger.error(`can't find basicBlock corresponding to the blockBuilder.`);
                continue;
            }
            const currBlock = blockBuilderToCfgBlock.get(currBlockBuilder)!;
            bfsBlocks.push(currBlock);

            const childList = currBlockBuilder.nexts;
            if (childList.length !== 0) {
                for (const child of childList) {
                    // A tail block's successor may be within the traversal range
                    if (child === endBlockBuilder) {
                        tailBlocks.push(currBlock);
                    } else {
                        queue.push(child);
                    }
                }
            } else {
                tailBlocks.push(currBlock);
            }
        }
        return { bfsBlocks, tailBlocks };
    }

    private copyFinallyBlocks(
        finallyBfsBlocks: BasicBlock[],
        finallyTailBlocks: BasicBlock[],
        basicBlockSet: Set<BasicBlock>,
        arkIRTransformer: ArkIRTransformer,
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>
    ): BasicBlock[] {
        const copyFinallyBfsBlocks = this.copyBlocks(finallyBfsBlocks);
        const caughtExceptionRef = new ArkCaughtExceptionRef(UnknownType.getInstance());
        const { value: exceptionValue, stmts: exceptionAssignStmts } = arkIRTransformer.generateAssignStmtForValue(caughtExceptionRef, [FullPosition.DEFAULT]);
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
            basicBlockSet.add(copyFinallyBfsBlock);
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
