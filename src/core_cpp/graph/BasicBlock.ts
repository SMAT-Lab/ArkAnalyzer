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

import { ArkIfStmt, ArkReturnStmt, ArkReturnVoidStmt, Stmt } from '../base/Stmt';
import { ArkError, ArkErrorCode } from '../common/ArkError';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'BasicBlock');

/**
 * @category core/graph
 * A `BasicBlock` is composed of:
 * - ID: a **number** that uniquely identify the basic block, initialized as -1.
 * - Statements: an **array** of statements in the basic block.
 * - Predecessors:  an **array** of basic blocks in front of the current basic block. More accurately, these basic
 *     blocks can reach the current block through edges.
 * - Successors: an **array** of basic blocks after the current basic block. More accurately, the current block can
 *     reach these basic blocks through edges.
 */
export class BasicBlock {
    private id: number = -1;
    private stmts: Stmt[] = [];
    private predecessorBlocks: BasicBlock[] = [];
    private successorBlocks: BasicBlock[] = [];
    private exceptionalSuccessorBlocks?: BasicBlock[];

    constructor() {}

    public getId(): number {
        return this.id;
    }

    public setId(id: number): void {
        this.id = id;
    }

    /**
     * Returns an array of the statements in a basic block.
     * @returns An array of statements in a basic block.
     */
    public getStmts(): Stmt[] {
        return this.stmts;
    }

    public addStmt(stmt: Stmt): void {
        this.stmts.push(stmt);
    }

    /**
     * Adds the given stmt at the beginning of the basic block.
     * @param stmt
     */
    public addHead(stmt: Stmt | Stmt[]): void {
        if (stmt instanceof Stmt) {
            this.stmts.unshift(stmt);
        } else {
            this.stmts.unshift(...stmt);
        }
    }

    /**
     * Adds the given stmt at the end of the basic block.
     * @param stmt
     */
    public addTail(stmt: Stmt | Stmt[]): void {
        if (stmt instanceof Stmt) {
            this.stmts.push(stmt);
        } else {
            stmt.forEach(stmt => this.stmts.push(stmt));
        }
    }

    /**
     * Inserts toInsert in the basic block after point.
     * @param toInsert
     * @param point
     * @returns The number of successfully inserted statements
     */
    public insertAfter(toInsert: Stmt | Stmt[], point: Stmt): number {
        let index = this.stmts.indexOf(point);
        if (index < 0) {
            return 0;
        }
        return this.insertPos(index + 1, toInsert);
    }

    /**
     * Inserts toInsert in the basic block befor point.
     * @param toInsert
     * @param point
     * @returns The number of successfully inserted statements
     */
    public insertBefore(toInsert: Stmt | Stmt[], point: Stmt): number {
        let index = this.stmts.indexOf(point);
        if (index < 0) {
            return 0;
        }
        return this.insertPos(index, toInsert);
    }

    /**
     * Removes the given stmt from this basic block.
     * @param stmt
     * @returns
     */
    public remove(stmt: Stmt): void {
        let index = this.stmts.indexOf(stmt);
        if (index < 0) {
            return;
        }
        this.stmts.splice(index, 1);
    }

    /**
     * Removes the first stmt from this basic block.
     */
    public removeHead(): void {
        this.stmts.splice(0, 1);
    }

    /**
     * Removes the last stmt from this basic block.
     */
    public removeTail(): void {
        this.stmts.splice(this.stmts.length - 1, 1);
    }

    public getHead(): Stmt | null {
        if (this.stmts.length === 0) {
            return null;
        }
        return this.stmts[0];
    }

    public getTail(): Stmt | null {
        let size = this.stmts.length;
        if (size === 0) {
            return null;
        }
        return this.stmts[size - 1];
    }

    /**
     * Returns successors of the current basic block, whose types are also basic blocks (i.e.{@link BasicBlock}).
     * @returns Successors of the current basic block.
     * @example
     * 1. get block successors.

    ```typescript
    const body = arkMethod.getBody();
    const blocks = [...body.getCfg().getBlocks()]
    for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
        ...
        for (const next of block.getSuccessors()) {
        ...
        }
    } 
    ```
     */
    public getSuccessors(): BasicBlock[] {
        return this.successorBlocks;
    }

    /**
     * Returns predecessors of the current basic block, whose types are also basic blocks.
     * @returns An array of basic blocks.
     */
    public getPredecessors(): BasicBlock[] {
        return this.predecessorBlocks;
    }

    public addPredecessorBlock(block: BasicBlock): void {
        this.predecessorBlocks.push(block);
    }

    public setPredecessorBlock(idx: number, block: BasicBlock): boolean {
        if (idx < this.predecessorBlocks.length) {
            this.predecessorBlocks[idx] = block;
            return true;
        }
        return false;
    }

    public setSuccessorBlock(idx: number, block: BasicBlock): boolean {
        if (idx < this.successorBlocks.length) {
            this.successorBlocks[idx] = block;
            return true;
        }
        return false;
    }

    // Temp just for SSA
    public addStmtToFirst(stmt: Stmt): void {
        this.addHead(stmt);
    }

    // Temp just for SSA
    public addSuccessorBlock(block: BasicBlock): void {
        this.successorBlocks.push(block);
    }

    public removePredecessorBlock(block: BasicBlock): boolean {
        let index = this.predecessorBlocks.indexOf(block);
        if (index < 0) {
            return false;
        }
        this.predecessorBlocks.splice(index, 1);
        return true;
    }

    public removeSuccessorBlock(block: BasicBlock): boolean {
        let index = this.successorBlocks.indexOf(block);
        if (index < 0) {
            return false;
        }
        this.successorBlocks.splice(index, 1);
        return true;
    }

    public toString(): string {
        let strs: string[] = [];
        for (const stmt of this.stmts) {
            strs.push(stmt.toString() + '\n');
        }
        return strs.join('');
    }

    public validate(): ArkError {
        let branchStmts: Stmt[] = [];
        for (const stmt of this.stmts) {
            if (stmt instanceof ArkIfStmt || stmt instanceof ArkReturnStmt || stmt instanceof ArkReturnVoidStmt) {
                branchStmts.push(stmt);
            }
        }

        if (branchStmts.length > 1) {
            let errMsg = `More than one branch or return stmts in the block: ${branchStmts.map(value => value.toString()).join('\n')}`;
            logger.error(errMsg);
            return {
                errCode: ArkErrorCode.BB_MORE_THAN_ONE_BRANCH_RET_STMT,
                errMsg: errMsg,
            };
        }

        if (branchStmts.length === 1 && branchStmts[0] !== this.stmts[this.stmts.length - 1]) {
            let errMsg = `${branchStmts[0].toString()} not at the end of block.`;
            logger.error(errMsg);
            return {
                errCode: ArkErrorCode.BB_BRANCH_RET_STMT_NOT_AT_END,
                errMsg: errMsg,
            };
        }

        return { errCode: ArkErrorCode.OK };
    }

    private insertPos(index: number, toInsert: Stmt | Stmt[]): number {
        if (toInsert instanceof Stmt) {
            this.stmts.splice(index, 0, toInsert);
            return 1;
        }
        this.stmts.splice(index, 0, ...toInsert);
        return toInsert.length;
    }

    public getExceptionalSuccessorBlocks(): BasicBlock[] | undefined {
        return this.exceptionalSuccessorBlocks;
    }

    public addExceptionalSuccessorBlock(block: BasicBlock): void {
        if (!this.exceptionalSuccessorBlocks) {
            this.exceptionalSuccessorBlocks = [];
        }
        this.exceptionalSuccessorBlocks.push(block);
    }
}
