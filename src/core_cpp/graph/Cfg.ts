/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

import { DefUseChain } from '../base/DefUseChain';
import { Local } from '../base/Local';
import { Stmt } from '../base/Stmt';
import { ArkError, ArkErrorCode } from '../common/ArkError';
import { ArkMethod } from '../model/ArkMethod';
import { BasicBlock } from './BasicBlock';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ArkStaticInvokeExpr } from '../base/Expr';
import { Value } from '../base/Value';
const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'BasicBlock');

/**
 * @category core/graph
 */
export class Cfg {
    private blocks: Set<BasicBlock> = new Set();
    private stmtToBlock: Map<Stmt, BasicBlock> = new Map();
    private startingStmt!: Stmt;

    private defUseChains: DefUseChain[] = [];
    private declaringMethod: ArkMethod = new ArkMethod();

    constructor() {}

    public getStmts(): Stmt[] {
        let stmts = new Array<Stmt>();
        for (const block of this.blocks) {
            block.getStmts().forEach(s => stmts.push(s));
        }
        return stmts;
    }

    /**
     * Inserts toInsert in the basic block in CFG after point.
     * @param toInsert
     * @param point
     * @returns The number of successfully inserted statements
     */
    public insertAfter(toInsert: Stmt | Stmt[], point: Stmt): number {
        const block = this.stmtToBlock.get(point);
        if (!block) {
            return 0;
        }

        this.updateStmt2BlockMap(block, toInsert);
        return block.insertAfter(toInsert, point);
    }

    /**
     * Inserts toInsert in the basic block in CFG befor point.
     * @param toInsert
     * @param point
     * @returns The number of successfully inserted statements
     */
    public insertBefore(toInsert: Stmt | Stmt[], point: Stmt): number {
        const block = this.stmtToBlock.get(point);
        if (!block) {
            return 0;
        }

        this.updateStmt2BlockMap(block, toInsert);
        return block.insertBefore(toInsert, point);
    }

    /**
     * Removes the given stmt from the basic block in CFG.
     * @param stmt
     * @returns
     */
    public remove(stmt: Stmt): void {
        const block = this.stmtToBlock.get(stmt);
        if (!block) {
            return;
        }
        this.stmtToBlock.delete(stmt);
        block.remove(stmt);
    }

    /**
     * Update stmtToBlock Map
     * @param block
     * @param changed
     */
    public updateStmt2BlockMap(block: BasicBlock, changed?: Stmt | Stmt[]): void {
        if (!changed) {
            for (const stmt of block.getStmts()) {
                this.stmtToBlock.set(stmt, block);
            }
        } else if (changed instanceof Stmt) {
            this.stmtToBlock.set(changed, block);
        } else {
            for (const insert of changed) {
                this.stmtToBlock.set(insert, block);
            }
        }
    }

    // TODO: 添加block之间的边
    public addBlock(block: BasicBlock): void {
        this.blocks.add(block);

        for (const stmt of block.getStmts()) {
            this.stmtToBlock.set(stmt, block);
        }
    }

    public getBlocks(): Set<BasicBlock> {
        return this.blocks;
    }

    public getStartingBlock(): BasicBlock | undefined {
        return this.stmtToBlock.get(this.startingStmt);
    }

    public getStartingStmt(): Stmt {
        return this.startingStmt;
    }

    public setStartingStmt(newStartingStmt: Stmt): void {
        this.startingStmt = newStartingStmt;
    }

    public getDeclaringMethod(): ArkMethod {
        return this.declaringMethod;
    }

    public setDeclaringMethod(method: ArkMethod): void {
        this.declaringMethod = method;
    }

    public getDefUseChains(): DefUseChain[] {
        return this.defUseChains;
    }

    // TODO: 整理成类似jimple的输出
    public toString(): string {
        return 'cfg';
    }

    public buildDefUseStmt(locals: Set<Local>): void {
        for (const block of this.blocks) {
            for (const stmt of block.getStmts()) {
                const defValue = stmt.getDef();
                if (defValue && defValue instanceof Local && defValue.getDeclaringStmt() === null) {
                    defValue.setDeclaringStmt(stmt);
                }
                for (const value of stmt.getUses()) {
                    this.buildUseStmt(value, locals, stmt);
                }
            }
        }
    }

    private buildUseStmt(value: Value, locals: Set<Local>, stmt: Stmt): void {
        if (value instanceof Local) {
            value.addUsedStmt(stmt);
        } else if (value instanceof ArkStaticInvokeExpr) {
            for (let local of locals) {
                if (local.getName() === value.getMethodSignature().getMethodSubSignature().getMethodName()) {
                    local.addUsedStmt(stmt);
                    return;
                }
            }
        }
    }

    private handleDefUseForValue(value: Value, block: BasicBlock, stmt: Stmt, stmtIndex: number): void {
        const name = value.toString();
        const defStmts: Stmt[] = [];
        // 判断本block之前有无对应def
        for (let i = stmtIndex - 1; i >= 0; i--) {
            const beforeStmt = block.getStmts()[i];
            if (beforeStmt.getDef() && beforeStmt.getDef()?.toString() === name) {
                defStmts.push(beforeStmt);
                break;
            }
        }
        // 本block有对应def直接结束,否则找所有的前序block
        if (defStmts.length !== 0) {
            this.defUseChains.push(new DefUseChain(value, defStmts[0], stmt));
            return;
        }
        const needWalkBlocks: BasicBlock[] = [...block.getPredecessors()];
        const walkedBlocks = new Set();
        while (needWalkBlocks.length > 0) {
            const predecessor = needWalkBlocks.pop();
            if (!predecessor) {
                return;
            }
            const predecessorStmts = predecessor.getStmts();
            let predecessorHasDef = false;
            for (let i = predecessorStmts.length - 1; i >= 0; i--) {
                const beforeStmt = predecessorStmts[i];
                if (beforeStmt.getDef() && beforeStmt.getDef()?.toString() === name) {
                    defStmts.push(beforeStmt);
                    predecessorHasDef = true;
                    break;
                }
            }
            walkedBlocks.add(predecessor);
            if (predecessorHasDef) {
                continue;
            }
            for (const morePredecessor of predecessor.getPredecessors()) {
                if (!walkedBlocks.has(morePredecessor) && !needWalkBlocks.includes(morePredecessor)) {
                    needWalkBlocks.unshift(morePredecessor);
                }
            }
        }
        for (const def of defStmts) {
            this.defUseChains.push(new DefUseChain(value, def, stmt));
        }
    }

    public buildDefUseChain(): void {
        for (const block of this.blocks) {
            for (let stmtIndex = 0; stmtIndex < block.getStmts().length; stmtIndex++) {
                const stmt = block.getStmts()[stmtIndex];
                for (const value of stmt.getUses()) {
                    this.handleDefUseForValue(value, block, stmt, stmtIndex);
                }
            }
        }
    }

    public getUnreachableBlocks(): Set<BasicBlock> {
        let unreachable = new Set<BasicBlock>();
        let startBB = this.getStartingBlock();
        if (!startBB) {
            return unreachable;
        }
        let postOrder = this.dfsPostOrder(startBB);
        for (const bb of this.blocks) {
            if (!postOrder.has(bb)) {
                unreachable.add(bb);
            }
        }
        return unreachable;
    }

    public validate(): ArkError {
        let startBB = this.getStartingBlock();
        if (!startBB) {
            let errMsg = `Not found starting block}`;
            logger.error(errMsg);
            return {
                errCode: ArkErrorCode.CFG_NOT_FOUND_START_BLOCK,
                errMsg: errMsg,
            };
        }

        let unreachable = this.getUnreachableBlocks();
        if (unreachable.size !== 0) {
            let errMsg = `Unreachable blocks: ${Array.from(unreachable)
                .map(value => value.toString())
                .join('\n')}`;
            logger.error(errMsg);
            return {
                errCode: ArkErrorCode.CFG_HAS_UNREACHABLE_BLOCK,
                errMsg: errMsg,
            };
        }

        return { errCode: ArkErrorCode.OK };
    }

    private dfsPostOrder(node: BasicBlock, visitor: Set<BasicBlock> = new Set(), postOrder: Set<BasicBlock> = new Set()): Set<BasicBlock> {
        visitor.add(node);
        for (const succ of node.getSuccessors()) {
            if (visitor.has(succ)) {
                continue;
            }
            this.dfsPostOrder(succ, visitor, postOrder);
        }
        postOrder.add(node);
        return postOrder;
    }
}
