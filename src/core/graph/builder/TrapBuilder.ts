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
        const tryCatchRegion = new Set<BasicBlock>([...tryBfsBlocks, ...catchBfsBlocks]);
        const abortTails = this.spliceFinallyAfterAbort(
            tryTailBlocks,
            catchTailBlocks,
            finallyBfsBlocks,
            finallyTailBlocks,
            tryCatchRegion,
            copyFinallyBfsBlocks,
        );
        const liveTryBlocks = this.liveBlocks(tryBfsBlocks);
        const liveTryTails = this.liveBlocks(tryTailBlocks);
        const liveCatchBlocks = this.liveBlocks(catchBfsBlocks);
        const liveCatchTails = this.liveBlocks(catchTailBlocks);
        if (liveCatchBlocks.length !== 0) {
            for (const catchTailBlock of liveCatchTails) {
                if (!abortTails.has(catchTailBlock)) {
                    CfgBuilder.linkBasicBlock(catchTailBlock, finallyBfsBlocks[0]);
                }
            }

            // try -> catch trap
            for (const tryTailBlock of liveTryTails) {
                CfgBuilder.linkExceptionalBasicBlock(tryTailBlock, liveCatchBlocks[0]);
            }
            traps.push(new Trap(liveTryBlocks, liveCatchBlocks));

            // catch -> finally trap
            for (const catchTailBlock of liveCatchTails) {
                CfgBuilder.linkExceptionalBasicBlock(catchTailBlock, copyFinallyBfsBlocks[0]);
            }
            traps.push(new Trap(liveCatchBlocks, copyFinallyBfsBlocks));
        } else {
            // try -> finally trap
            for (const tryTailBlock of liveTryTails) {
                CfgBuilder.linkExceptionalBasicBlock(tryTailBlock, copyFinallyBfsBlocks[0]);
            }
            traps.push(new Trap(liveTryBlocks, copyFinallyBfsBlocks));
        }
        this.pruneOriginalFinallyIfUnreachable(finallyBfsBlocks);
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
            if (successors.length !== 0) {
                for (const successor of successors) {
                    if (this.successorLeavesTryRegion(successor, endBlock, region, sourceBlocks)) {
                        if (!tailBlocks.includes(currBlock)) {
                            tailBlocks.push(currBlock);
                        }
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
            const hasExternalPredecessor = builder !== startBlockBuilder && builder.lasts.some(predecessor => !tentative.has(predecessor));
            if (hasExternalPredecessor) {
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
        return blocks.filter(block => this.basicBlockSet.has(block));
    }

    private spliceFinallyAfterAbort(
        tryTailBlocks: BasicBlock[],
        catchTailBlocks: BasicBlock[],
        finallyBfsBlocks: BasicBlock[],
        finallyTailBlocks: BasicBlock[],
        tryCatchRegion: Set<BasicBlock>,
        exceptionalFinallyCopies: BasicBlock[]
    ): Set<BasicBlock> {
        const abortTails = new Set<BasicBlock>();
        const finallyHead = finallyBfsBlocks[0];
        for (const tail of [...tryTailBlocks, ...catchTailBlocks]) {
            if (!this.isAbortTail(tail, finallyHead, tryCatchRegion)) {
                continue;
            }
            abortTails.add(tail);
            this.linkFinallyCopyAfter(tail, finallyBfsBlocks, finallyTailBlocks);
        }
        const excluded = new Set<BasicBlock>([...finallyBfsBlocks, ...exceptionalFinallyCopies, ...abortTails]);
        for (const tail of this.exceptionalReturnExits(tryCatchRegion, excluded)) {
            abortTails.add(tail);
            this.linkFinallyCopyAfter(tail, finallyBfsBlocks, finallyTailBlocks);
        }
        return abortTails;
    }

    private isAbortTail(block: BasicBlock, finallyHead: BasicBlock, tryCatchRegion: Set<BasicBlock>): boolean {
        const successors = block.getSuccessors();
        if (successors.includes(finallyHead)) {
            return false;
        }
        if (this.isReturnTerminator(block) && successors.length === 0) {
            return true;
        }
        if (successors.length === 0) {
            return false;
        }
        return successors.every(successor => successor !== finallyHead && !tryCatchRegion.has(successor));
    }

    private exceptionalReturnExits(tryCatchRegion: Set<BasicBlock>, excluded: Set<BasicBlock>): BasicBlock[] {
        const found: BasicBlock[] = [];
        const visited = new Set<BasicBlock>();
        const queue = [...tryCatchRegion];
        while (queue.length !== 0) {
            const block = queue.shift()!;
            if (visited.has(block) || excluded.has(block)) {
                continue;
            }
            visited.add(block);
            if (this.isReturnTerminator(block) && block.getSuccessors().length === 0) {
                found.push(block);
            }
            for (const exceptionalSuccessor of block.getExceptionalSuccessorBlocks() ?? []) {
                if (!excluded.has(exceptionalSuccessor)) {
                    queue.push(exceptionalSuccessor);
                }
            }
        }
        return found;
    }

    private isReturnTerminator(block: BasicBlock): boolean {
        const stmts = block.getStmts();
        if (stmts.length === 0) {
            return false;
        }
        const last = stmts[stmts.length - 1];
        return last instanceof ArkReturnStmt || last instanceof ArkReturnVoidStmt;
    }

    private linkFinallyCopyAfter(abortTail: BasicBlock, finallyBfsBlocks: BasicBlock[], finallyTailBlocks: BasicBlock[]): void {
        const originalSuccessors = [...abortTail.getSuccessors()];
        for (const successor of originalSuccessors) {
            CfgBuilder.unlinkBasicBlock(abortTail, successor);
        }
        const copiedBlocks = this.copyBlocks(finallyBfsBlocks);
        copiedBlocks.forEach(block => this.basicBlockSet.add(block));
        const copiedTails = this.getCopiedTails(copiedBlocks, finallyBfsBlocks, finallyTailBlocks);
        const sourceReturn = this.takeReturnStmt(abortTail);
        if (sourceReturn) {
            const slot = this.returnValueSlot(abortTail, sourceReturn);
            if (abortTail.getStmts().length === 0) {
                this.relinkPredecessors(abortTail, copiedBlocks[0]);
                this.basicBlockSet.delete(abortTail);
            } else {
                CfgBuilder.linkBasicBlock(abortTail, copiedBlocks[0]);
            }
            this.placeReturnAfterFinally(copiedTails, slot, sourceReturn);
            return;
        }
        CfgBuilder.linkBasicBlock(abortTail, copiedBlocks[0]);
        for (const tail of copiedTails) {
            if (this.isReturnTerminator(tail)) {
                continue;
            }
            for (const successor of originalSuccessors) {
                CfgBuilder.linkBasicBlock(tail, successor);
            }
        }
    }

    private relinkPredecessors(block: BasicBlock, successor: BasicBlock): void {
        const predecessors = [...block.getPredecessors()];
        for (const predecessor of predecessors) {
            CfgBuilder.unlinkBasicBlock(predecessor, block);
            CfgBuilder.linkBasicBlock(predecessor, successor);
        }
    }

    private takeReturnStmt(block: BasicBlock): ArkReturnStmt | ArkReturnVoidStmt | null {
        const stmts = block.getStmts();
        if (stmts.length === 0) {
            return null;
        }
        const last = stmts[stmts.length - 1];
        if (!(last instanceof ArkReturnStmt || last instanceof ArkReturnVoidStmt)) {
            return null;
        }
        block.remove(last);
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

    private placeReturnAfterFinally(copiedTails: BasicBlock[], slot: Local, sourceReturn: Stmt): void {
        const aliveTails = copiedTails.filter(tail => !this.isReturnTerminator(tail) && !this.isThrowTerminator(tail));
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
        for (const tail of aliveTails) {
            CfgBuilder.linkBasicBlock(tail, returnBlock);
        }
    }

    private isThrowTerminator(block: BasicBlock): boolean {
        const stmts = block.getStmts();
        if (stmts.length === 0) {
            return false;
        }
        return stmts[stmts.length - 1] instanceof ArkThrowStmt;
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
        sourceBlocks.forEach((block, index) => indexBySource.set(block, index));
        return sourceTails.map(tail => copiedBlocks[indexBySource.get(tail)!]);
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
        if (!this.isReturnTerminator(copyFinallyTailBlocks[0])) {
            copyFinallyTailBlocks[0].addStmt(throwStmt);
        }
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
