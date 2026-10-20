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
import { Local } from '../../base/Local';
import { UnknownType } from '../../base/Type';
import { FullPosition } from '../../base/Position';
import { TEMP_LOCAL_PREFIX } from '../../common/Const';
import { ValueUtil } from '../../common/ValueUtil';
import { Value } from '../../base/Value';
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
    private pendingFinallyPrunes: BasicBlock[][] = [];

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
        for (const finallyBlocks of this.pendingFinallyPrunes) {
            this.pruneOriginalFinallyIfUnreachable(finallyBlocks);
        }
        this.pendingFinallyPrunes = [];
        return traps;
    }

    public retainLiveTraps(traps: Trap[]): Trap[] {
        const liveTraps: Trap[] = [];
        for (const trap of traps) {
            const originalTryBlocks = trap.getTryBlocks();
            const tryBlocks: BasicBlock[] = [];
            for (const block of originalTryBlocks) {
                if (this.basicBlockSet.has(block)) {
                    tryBlocks.push(block);
                }
            }
            if (tryBlocks.length === 0) {
                continue;
            }
            const originalCatchBlocks = trap.getCatchBlocks();
            const catchBlocks: BasicBlock[] = [];
            for (const block of originalCatchBlocks) {
                if (this.basicBlockSet.has(block)) {
                    catchBlocks.push(block);
                }
            }
            if (catchBlocks.length === 0) {
                continue;
            }
            if (tryBlocks.length === originalTryBlocks.length && catchBlocks.length === originalCatchBlocks.length) {
                liveTraps.push(trap);
                continue;
            }
            liveTraps.push(new Trap(tryBlocks, catchBlocks));
        }
        return liveTraps;
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

        const catchResult = this.processCatchBlock(tryStmtBuilder, finallyBlockBuilder);
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
        tryStmtBuilder: TryStatementBuilder,
        finallyBlockBuilder?: BlockBuilder
    ): { traps: Trap[], bfsBlocks: BasicBlock[], tailBlocks: BasicBlock[] } {
        const catchBlockBuilder = tryStmtBuilder.catchStatement?.block;
        if (!catchBlockBuilder) {
            return { traps: [], bfsBlocks: [], tailBlocks: [] };
        }

        const result = this.buildTrapsRecursively(catchBlockBuilder, finallyBlockBuilder);
        const { bfsBlocks, tailBlocks } = this.getAllBlocksBFS(result.newStartBlockBuilder, finallyBlockBuilder);
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
        const fallThroughSources = [...dummyFinallyBlock.getPredecessors()];
        CfgBuilder.pruneBasicBlock(dummyFinallyBlock);
        this.basicBlockSet.delete(dummyFinallyBlock);
        const blockBuilderAfterFinally = dummyFinallyBlockBuilder.nexts[0];
        const mappedAfterFinally = blockBuilderAfterFinally ? this.blockBuilderToCfgBlock.get(blockBuilderAfterFinally) : undefined;
        const blockAfterFinally = mappedAfterFinally ?? this.findUniqueCatchTailTarget(catchTailBlocks);
        if (!this.blockBuilderToCfgBlock.has(dummyFinallyBlockBuilder)) {
            logger.error(`can't find basicBlock corresponding to the blockBuilder.`);
            return [];
        }
        if (blockAfterFinally) {
            for (const source of fallThroughSources) {
                if (!this.basicBlockSet.has(source) || source.getSuccessors().length !== 0 || this.isReturnTerminator(source) || this.endsWithThrow(source)) {
                    continue;
                }
                CfgBuilder.linkBasicBlock(source, blockAfterFinally);
            }
            for (const catchTailBlock of catchTailBlocks) {
                if (!this.endsWithThrow(catchTailBlock) && !catchTailBlock.getSuccessors().includes(blockAfterFinally)) {
                    CfgBuilder.linkBasicBlock(catchTailBlock, blockAfterFinally);
                }
            }
            for (const catchBlock of catchBfsBlocks) {
                if (!this.basicBlockSet.has(catchBlock) || catchBlock.getSuccessors().length !== 0 || 
                    this.isReturnTerminator(catchBlock) || this.endsWithThrow(catchBlock)) {
                    continue;
                }
                CfgBuilder.linkBasicBlock(catchBlock, blockAfterFinally);
            }
        }
        this.linkUnprotectedTails(tryTailBlocks, catchBfsBlocks[0]);
        return [new Trap(tryBfsBlocks, catchBfsBlocks)];
    }

    private findUniqueCatchTailTarget(catchTailBlocks: BasicBlock[]): BasicBlock | undefined {
        const targets = new Set<BasicBlock>();
        for (const catchTailBlock of catchTailBlocks) {
            if (this.isReturnTerminator(catchTailBlock) || this.endsWithThrow(catchTailBlock)) {
                continue;
            }
            for (const successor of catchTailBlock.getSuccessors()) {
                targets.add(successor);
            }
        }
        if (targets.size !== 1) {
            return undefined;
        }
        return [...targets][0];
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
                this.linkUnprotectedTails(tryTailBlocks, catchBfsBlocks[0]);
                traps.push(new Trap(tryBfsBlocks, catchBfsBlocks));
            }
            return traps;
        }
        const finallyEnd = endBlock ? this.blockBuilderToCfgBlock.get(endBlock) : undefined;
        const exceptionalFinally = this.copyFinallyBlocks(finallyBfsBlocks, finallyTailBlocks, finallyEnd);
        traps.push(
            ...this.connectExits(
                tryBfsBlocks,
                tryTailBlocks,
                catchBfsBlocks,
                catchTailBlocks,
                finallyBfsBlocks,
                finallyTailBlocks,
                finallyEnd,
                exceptionalFinally,
            ),
        );
        this.pendingFinallyPrunes.push(finallyBfsBlocks);
        return traps;
    }

    private connectExits(
        tryBfsBlocks: BasicBlock[],
        tryTailBlocks: BasicBlock[],
        catchBfsBlocks: BasicBlock[],
        catchTailBlocks: BasicBlock[],
        finallyBfsBlocks: BasicBlock[],
        finallyTailBlocks: BasicBlock[],
        finallyEnd: BasicBlock | undefined,
        exceptionalFinally: BasicBlock[],
    ): Trap[] {
        this.unlinkTryThrowFallThrough(tryBfsBlocks);
        const abortTails = this.spliceFinallyAfterAbort(
            tryTailBlocks,
            catchTailBlocks,
            finallyBfsBlocks,
            finallyTailBlocks,
            new Set<BasicBlock>([...tryBfsBlocks, ...catchBfsBlocks]),
            finallyEnd,
        );
        const tryBlocks = this.liveBlocks(tryBfsBlocks);
        const tryTails = this.liveBlocks(tryTailBlocks);
        const catchBlocks = this.liveBlocks(catchBfsBlocks);
        const catchTails = this.liveBlocks(catchTailBlocks);
        const sharedFinally = finallyBfsBlocks[0];
        const exceptionalHandler = exceptionalFinally[0];
        const traps: Trap[] = [];
        if (catchBlocks.length !== 0) {
            const fallThroughCatchTails: BasicBlock[] = [];
            for (const tail of catchTails) {
                if (!abortTails.has(tail) && !this.endsWithThrow(tail)) {
                    fallThroughCatchTails.push(tail);
                }
            }
            CfgBuilder.linkPredecessorsOfBasicBlock(sharedFinally, fallThroughCatchTails);
        }
        const tryHandler = catchBlocks.length !== 0 ? catchBlocks[0] : exceptionalHandler;
        const tryHandlerBlocks = catchBlocks.length !== 0 ? catchBlocks : exceptionalFinally;
        this.linkUnprotectedTails(tryTails, tryHandler);
        traps.push(new Trap(tryBlocks, tryHandlerBlocks));
        if (catchBlocks.length !== 0) {
            this.linkUnprotectedTails(catchTails, exceptionalHandler);
            traps.push(new Trap(catchBlocks, exceptionalFinally));
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
        const region = endBlockBuilder ? this.collectRegionBasicBlocks(startBlockBuilder, endBlockBuilder) : undefined;
        const sourceBlocks = new Set<BasicBlock>(this.blockBuilderToCfgBlock.values());
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
            const exceptionalSuccessors = currBlock.getExceptionalSuccessorBlocks();
            if (successors.length === 0 && (!exceptionalSuccessors || exceptionalSuccessors.length === 0)) {
                tailBlocks.push(currBlock);
            }
            for (const successor of successors) {
                if (!this.successorLeavesTryRegion(successor, endBlock, region, sourceBlocks)) {
                    queue.push(successor);
                    continue;
                }
                if (!tailBlocks.includes(currBlock)) {
                    tailBlocks.push(currBlock);
                }
            }
            if (exceptionalSuccessors) {
                for (const successor of exceptionalSuccessors) {
                    if (successor !== endBlock) {
                        queue.push(successor);
                        continue;
                    }
                    if (!tailBlocks.includes(currBlock)) {
                        tailBlocks.push(currBlock);
                    }
                }
            }
        }
        return { bfsBlocks, tailBlocks };
    }

    private linkUnprotectedTails(tails: BasicBlock[], handler: BasicBlock): void {
        for (const tail of tails) {
            if ((tail.getExceptionalSuccessorBlocks()?.length ?? 0) !== 0) {
                continue;
            }
            CfgBuilder.linkExceptionalBasicBlock(tail, handler);
        }
    }

    private collectRegionBasicBlocks(startBlockBuilder: BlockBuilder, endBlockBuilder: BlockBuilder): Set<BasicBlock> {
        const tentative = new Set<BlockBuilder>();
        const queue: BlockBuilder[] = [startBlockBuilder];
        while (queue.length !== 0) {
            const curr = queue.splice(0, 1)[0];
            if (tentative.has(curr) || curr === endBlockBuilder) {
                continue;
            }
            tentative.add(curr);
            for (const child of curr.nexts) {
                if (child !== endBlockBuilder) {
                    queue.push(child);
                }
            }
        }

        const region = new Set<BasicBlock>();
        for (const builder of tentative) {
            if (builder !== startBlockBuilder && this.hasPredecessorOutside(builder.lasts, tentative)) {
                continue;
            }
            const basicBlock = this.blockBuilderToCfgBlock.get(builder);
            if (basicBlock) {
                region.add(basicBlock);
            }
        }
        return region;
    }

    private successorLeavesTryRegion(
        successor: BasicBlock,
        endBlock: BasicBlock | undefined,
        region: Set<BasicBlock> | undefined,
        sourceBlocks: Set<BasicBlock>
    ): boolean {
        if (successor === endBlock) {
            return true;
        }
        if (!region || region.has(successor)) {
            return false;
        }
        return sourceBlocks.has(successor);
    }

    private liveBlocks(blocks: BasicBlock[]): BasicBlock[] {
        const live: BasicBlock[] = [];
        for (const block of blocks) {
            if (this.basicBlockSet.has(block)) {
                live.push(block);
            }
        }
        return live;
    }

    private hasPredecessorOutside(lasts: BlockBuilder[], tentative: Set<BlockBuilder>): boolean {
        for (const predecessor of lasts) {
            if (!tentative.has(predecessor)) {
                return true;
            }
        }
        return false;
    }

    private unlinkTryThrowFallThrough(tryBlocks: BasicBlock[]): void {
        for (const block of tryBlocks) {
            if (!this.basicBlockSet.has(block) || !this.endsWithThrow(block) || block.getSuccessors().length === 0) {
                continue;
            }
            CfgBuilder.unlinkSuccessorsOfBasicBlock(block);
        }
    }

    private spliceFinallyAfterAbort(
        tryTailBlocks: BasicBlock[],
        catchTailBlocks: BasicBlock[],
        finallyBfsBlocks: BasicBlock[],
        finallyTailBlocks: BasicBlock[],
        tryCatchRegion: Set<BasicBlock>,
        finallyEnd: BasicBlock | undefined
    ): Set<BasicBlock> {
        const abortTails = new Set<BasicBlock>();
        const finallyHead = finallyBfsBlocks[0];
        for (const tail of [...tryTailBlocks, ...catchTailBlocks]) {
            if (!this.isAbortTail(tail, finallyHead, tryCatchRegion)) {
                continue;
            }
            abortTails.add(tail);
            this.linkFinallyCopyAfter(tail, finallyBfsBlocks, finallyTailBlocks, finallyEnd);
        }
        return abortTails;
    }

    private isAbortTail(block: BasicBlock, finallyHead: BasicBlock, tryCatchRegion: Set<BasicBlock>): boolean {
        const successors = block.getSuccessors();
        if (successors.includes(finallyHead)) {
            return false;
        }
        if (successors.length === 0) {
            return this.isReturnTerminator(block);
        }
        for (const successor of successors) {
            if (tryCatchRegion.has(successor)) {
                return false;
            }
        }
        return true;
    }

    private isReturnTerminator(block: BasicBlock): boolean {
        const stmts = block.getStmts();
        if (stmts.length === 0) {
            return false;
        }
        const last = stmts[stmts.length - 1];
        return last instanceof ArkReturnStmt || last instanceof ArkReturnVoidStmt;
    }

    private endsWithThrow(block: BasicBlock): boolean {
        const stmts = block.getStmts();
        return stmts.length > 0 && stmts[stmts.length - 1] instanceof ArkThrowStmt;
    }

    private linkFinallyCopyAfter(
        abortTail: BasicBlock,
        finallyBfsBlocks: BasicBlock[],
        finallyTailBlocks: BasicBlock[],
        finallyEnd: BasicBlock | undefined
    ): void {
        const originalSuccessors = [...abortTail.getSuccessors()];
        CfgBuilder.unlinkSuccessorsOfBasicBlock(abortTail);
        const { blocks: copiedBlocks, tails: copiedTails } = this.duplicateFinally(finallyBfsBlocks, finallyTailBlocks, finallyEnd);
        const sourceReturn = this.takeReturnStmt(abortTail);
        const slot = sourceReturn ? this.returnValueSlot(abortTail, sourceReturn) : undefined;
        this.attachFinallyCopy(abortTail, copiedBlocks[0]);
        if (sourceReturn && slot) {
            this.placeReturnAfterFinally(copiedTails, copiedBlocks, slot, sourceReturn);
            return;
        }
        this.linkFallThrough(this.fallThroughCopies(copiedTails, copiedBlocks), originalSuccessors);
    }

    private attachFinallyCopy(abortTail: BasicBlock, copyHead: BasicBlock): void {
        if (abortTail.getStmts().length !== 0) {
            CfgBuilder.linkBasicBlock(abortTail, copyHead);
            return;
        }
        CfgBuilder.replaceBasicBlockInPredecessors(abortTail, copyHead);
        this.retargetBlock(abortTail, copyHead);
        this.basicBlockSet.delete(abortTail);
    }

    private retargetBlock(from: BasicBlock, to: BasicBlock): void {
        for (const [builder, block] of this.blockBuilderToCfgBlock) {
            if (block === from) {
                this.blockBuilderToCfgBlock.set(builder, to);
            }
        }
    }

    private takeReturnStmt(block: BasicBlock): ArkReturnStmt | ArkReturnVoidStmt | null {
        if (!this.isReturnTerminator(block)) {
            return null;
        }
        const last = block.getTail() as ArkReturnStmt | ArkReturnVoidStmt;
        block.removeTail();
        return last;
    }

    private returnValueSlot(block: BasicBlock, sourceReturn: ArkReturnStmt | ArkReturnVoidStmt): Local {
        if (sourceReturn instanceof ArkReturnStmt) {
            const operand = sourceReturn.getOp();
            if (operand instanceof Local && operand.getName().startsWith(TEMP_LOCAL_PREFIX)) {
                return operand;
            }
            return this.assignReturnSlot(block, operand, sourceReturn);
        }
        return this.assignReturnSlot(block, ValueUtil.getUndefinedConst(), sourceReturn);
    }

    private assignReturnSlot(block: BasicBlock, value: Value, sourceReturn: Stmt): Local {
        const { value: slot, stmts } = this.arkIRTransformer.generateAssignStmtForValue(value, this.returnPositions(sourceReturn));
        for (const stmt of stmts) {
            this.copyOriginPosition(sourceReturn, stmt);
            block.addStmt(stmt);
        }
        return slot as Local;
    }

    private duplicateFinally(
        sources: BasicBlock[],
        sourceTails: BasicBlock[],
        finallyEnd: BasicBlock | undefined
    ): { blocks: BasicBlock[]; tails: BasicBlock[] } {
        const blocks = this.copyBlocks(sources, finallyEnd);
        for (const block of blocks) {
            this.basicBlockSet.add(block);
        }
        return { blocks, tails: this.getCopiedTails(blocks, sources, sourceTails) };
    }

    private fallThroughCopies(tails: BasicBlock[], copiedBlocks: BasicBlock[]): BasicBlock[] {
        const copied = new Set(copiedBlocks);
        const fallThrough: BasicBlock[] = [];
        for (const tail of tails) {
            if (this.isReturnTerminator(tail) || tail.getTail() instanceof ArkThrowStmt) {
                continue;
            }
            const successors = tail.getSuccessors();
            let staysInCopy = true;
            for (const successor of successors) {
                if (!copied.has(successor)) {
                    staysInCopy = false;
                    break;
                }
            }
            if (staysInCopy) {
                fallThrough.push(tail);
            }
        }
        return fallThrough;
    }

    private linkFallThrough(tails: BasicBlock[], targets: BasicBlock[]): void {
        for (const target of targets) {
            CfgBuilder.linkPredecessorsOfBasicBlock(target, tails);
        }
    }

    private placeReturnAfterFinally(copiedTails: BasicBlock[], copiedBlocks: BasicBlock[], slot: Local, sourceReturn: Stmt): void {
        const aliveTails = this.fallThroughCopies(copiedTails, copiedBlocks);
        if (aliveTails.length === 0) {
            return;
        }
        const returnBlock = new BasicBlock();
        const returnStmt = new ArkReturnStmt(slot);
        this.copyOriginPosition(sourceReturn, returnStmt);
        const operandPositions = sourceReturn.getOperandOriginalPositions();
        if (operandPositions) {
            returnStmt.setOperandOriginalPositions(operandPositions);
        }
        returnBlock.addStmt(returnStmt);
        this.basicBlockSet.add(returnBlock);
        this.linkFallThrough(aliveTails, [returnBlock]);
    }

    private returnPositions(stmt: Stmt): FullPosition[] {
        const operandPositions = stmt.getOperandOriginalPositions();
        if (operandPositions && operandPositions.length > 0) {
            return operandPositions;
        }
        const origin = stmt.getOriginFullPosition();
        if (origin) {
            return [origin];
        }
        return [FullPosition.DEFAULT];
    }

    private getCopiedTails(copiedBlocks: BasicBlock[], sourceBlocks: BasicBlock[], sourceTails: BasicBlock[]): BasicBlock[] {
        const indexBySource = new Map<BasicBlock, number>();
        for (let index = 0; index < sourceBlocks.length; index++) {
            indexBySource.set(sourceBlocks[index], index);
        }
        const copiedTails: BasicBlock[] = [];
        for (const tail of sourceTails) {
            copiedTails.push(copiedBlocks[indexBySource.get(tail)!]);
        }
        return copiedTails;
    }

    private pruneOriginalFinallyIfUnreachable(finallyBfsBlocks: BasicBlock[]): void {
        if (finallyBfsBlocks.length === 0) {
            return;
        }
        const head = finallyBfsBlocks[0];
        if (head.getPredecessors().length > 0) {
            return;
        }
        const finallySet = new Set(finallyBfsBlocks);
        const outgoing: BasicBlock[] = [];
        for (const block of finallyBfsBlocks) {
            for (const successor of block.getSuccessors()) {
                if (!finallySet.has(successor)) {
                    outgoing.push(successor);
                }
            }
            CfgBuilder.unlinkPredecessorsAndSuccessorsOfBasicBlock(block);
            this.basicBlockSet.delete(block);
        }
        for (const successor of outgoing) {
            if (successor.getPredecessors().length === 0 && (successor.getExceptionalPredecessorBlocks()?.length ?? 0) === 0) {
                CfgBuilder.unlinkPredecessorsAndSuccessorsOfBasicBlock(successor);
                this.basicBlockSet.delete(successor);
            }
        }
    }

    private copyFinallyBlocks(finallyBfsBlocks: BasicBlock[], finallyTailBlocks: BasicBlock[], finallyEnd: BasicBlock | undefined): BasicBlock[] {
        const { blocks: copyFinallyBfsBlocks, tails: copiedTails } = this.duplicateFinally(finallyBfsBlocks, finallyTailBlocks, finallyEnd);
        const caughtExceptionRef = new ArkCaughtExceptionRef(UnknownType.getInstance());
        const {
            value: exceptionValue, stmts: exceptionAssignStmts,
        } = this.arkIRTransformer.generateAssignStmtForValue(caughtExceptionRef, [FullPosition.DEFAULT]);
        copyFinallyBfsBlocks[0].addHead(exceptionAssignStmts);
        CfgBuilder.unlinkPredecessorsOfBasicBlock(copyFinallyBfsBlocks[0]);
        const fallThroughTails = this.fallThroughCopies(copiedTails, copyFinallyBfsBlocks);
        if (fallThroughTails.length === 1 && fallThroughTails[0].getSuccessors().length === 0) {
            fallThroughTails[0].addStmt(new ArkThrowStmt(exceptionValue));
        } else if (fallThroughTails.length > 0) {
            const join = new BasicBlock();
            join.addStmt(new ArkThrowStmt(exceptionValue));
            this.basicBlockSet.add(join);
            this.linkFallThrough(fallThroughTails, [join]);
            copyFinallyBfsBlocks.push(join);
        }
        return copyFinallyBfsBlocks;
    }

    private copyBlocks(sourceBlocks: BasicBlock[], fallThroughTarget: BasicBlock | undefined): BasicBlock[] {
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
                if (targetPredecessor) {
                    targetBlock.addPredecessorBlock(targetPredecessor);
                }
            }
            for (const successor of sourceBlock.getSuccessors()) {
                const targetSuccessor = sourceToTarget.get(successor);
                if (targetSuccessor) {
                    targetBlock.addSuccessorBlock(targetSuccessor);
                } else if (successor !== fallThroughTarget) {
                    CfgBuilder.linkBasicBlock(targetBlock, successor);
                }
            }
            for (const exceptional of sourceBlock.getExceptionalSuccessorBlocks() ?? []) {
                const targetExceptional = sourceToTarget.get(exceptional);
                if (targetExceptional) {
                    CfgBuilder.linkExceptionalBasicBlock(targetBlock, targetExceptional);
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
