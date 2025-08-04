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

import { ArkInstanceInvokeExpr } from '../../core/base/Expr';
import { Local } from '../../core/base/Local';
import { ArkAssignStmt, ArkIfStmt, ArkInvokeStmt, Stmt } from '../../core/base/Stmt';
import { BasicBlock } from '../../core/graph/BasicBlock';
import { ArkBody } from '../../core/model/ArkBody';
import { ArkMethod } from '../../core/model/ArkMethod';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ArkCodeBuffer } from '../ArkStream';
import {
    SourceBreakStmt,
    SourceCatchStmt,
    SourceCompoundEndStmt,
    SourceContinueStmt,
    SourceDoStmt,
    SourceDoWhileStmt,
    SourceElseStmt,
    SourceFinallyStmt,
    SourceForStmt,
    SourceIfStmt,
    SourceStmt,
    SourceTryStmt,
    SourceWhileStmt,
    stmt2SourceStmt,
    StmtPrinterContext,
} from './SourceStmt';
import { AbstractFlowGraph, CodeBlockType } from '../../utils/CfgStructualAnalysis';
import { ArkClass } from '../../core/model/ArkClass';
import { ArkFile } from '../../core/model/ArkFile';
import { ClassSignature, MethodSignature } from '../../core/model/ArkSignature';
import { ModelUtils } from '../../core/common/ModelUtils';
import { PrinterUtils } from '../base/PrinterUtils';
import { ArkNamespace } from '../../core/model/ArkNamespace';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'SourceBody');

export class SourceBody implements StmtPrinterContext {
    protected printer: ArkCodeBuffer;
    private arkBody: ArkBody;
    private stmts: SourceStmt[] = [];
    private method: ArkMethod;
    private cfgUtils: AbstractFlowGraph;
    private tempCodeMap: Map<string, string>;
    private tempVisitor: Set<string>;
    private skipStmts: Set<Stmt>;
    private stmtReader: StmtReader;
    private definedLocals: Set<Local>;
    private inBuilder: boolean;
    private lastStmt: Stmt;

    public constructor(indent: string, method: ArkMethod, inBuilder: boolean) {
        this.printer = new ArkCodeBuffer(indent);
        this.method = method;
        this.arkBody = method.getBody()!;
        this.cfgUtils = new AbstractFlowGraph(method.getCfg()!, this.arkBody.getTraps());
        this.tempCodeMap = new Map();
        this.tempVisitor = new Set();
        this.definedLocals = new Set();
        this.inBuilder = inBuilder;
        this.skipStmts = new Set();
        this.stmtReader = new StmtReader([]);
        this.lastStmt = this.arkBody.getCfg().getStartingStmt();
        this.buildSourceStmt();
    }
    setSkipStmt(stmt: Stmt): void {
        this.skipStmts.add(stmt);
    }

    isInBuilderMethod(): boolean {
        return this.inBuilder;
    }
    isInDefaultMethod(): boolean {
        return this.method.isDefaultArkMethod();
    }
    public getArkFile(): ArkFile {
        return this.method.getDeclaringArkFile();
    }

    public getDeclaringArkNamespace(): ArkNamespace | undefined {
        return this.method.getDeclaringArkClass().getDeclaringArkNamespace();
    }

    public getMethod(signature: MethodSignature): ArkMethod | null {
        let method = this.method.getDeclaringArkFile().getScene().getMethod(signature);
        if (method) {
            return method;
        }
        return this.method.getDeclaringArkClass().getMethodWithName(signature.getMethodSubSignature().getMethodName());
    }

    public getClass(signature: ClassSignature): ArkClass | null {
        return ModelUtils.getClass(this.method, signature);
    }

    public getLocals(): Map<string, Local> {
        return this.arkBody.getLocals();
    }

    public defineLocal(local: Local): void {
        this.definedLocals.add(local);
    }

    public isLocalDefined(local: Local): boolean {
        return this.definedLocals.has(local);
    }

    public getStmtReader(): StmtReader {
        return this.stmtReader;
    }

    public setTempCode(temp: string, code: string): void {
        this.tempCodeMap.set(temp, code);
    }

    public transTemp2Code(temp: Local, isLeftOp: boolean = false): string {
        // if the temp local is not the left op of ArkAssignStmt, it should get the actual text from tempCodeMap
        if (!isLeftOp && this.tempCodeMap.has(temp.getName()) && PrinterUtils.isTemp(temp.getName())) {
            this.tempVisitor.add(temp.getName());
            return this.tempCodeMap.get(temp.getName())!;
        }

        return temp.getName();
    }

    public getTempCodeMap(): Map<string, string> {
        return this.tempCodeMap;
    }

    public hasTempVisit(temp: string): boolean {
        return this.tempVisitor.has(temp);
    }

    public setTempVisit(temp: string): void {
        this.tempVisitor.add(temp);
    }

    public getPrinter(): ArkCodeBuffer {
        return this.printer;
    }

    public dump(): string {
        this.printStmts();
        return this.printer.toString();
    }

    private buildSourceStmt(): void {
        this.cfgUtils.preOrder(this.cfgUtils.getEntry(), (block, type) => {
            this.buildBasicBlock(block, type);
        });
    }

    private buildBasicBlock(block: BasicBlock | undefined, type: CodeBlockType): void {
        if (type === CodeBlockType.BREAK) {
            this.pushStmt(new SourceBreakStmt(this, this.lastStmt));
            return;
        } else if (type === CodeBlockType.CONTINUE) {
            this.pushStmt(new SourceContinueStmt(this, this.lastStmt));
        } else if (type === CodeBlockType.COMPOUND_END) {
            this.pushStmt(new SourceCompoundEndStmt(this, this.lastStmt, '}'));
        } else if (type === CodeBlockType.ELSE) {
            this.pushStmt(new SourceElseStmt(this, this.lastStmt));
        } else if (type === CodeBlockType.DO) {
            this.pushStmt(new SourceDoStmt(this, this.lastStmt));
        } else if (type === CodeBlockType.TRY) {
            this.pushStmt(new SourceTryStmt(this, this.lastStmt));
        } else if (type === CodeBlockType.CATCH) {
            this.pushStmt(new SourceCatchStmt(this, this.lastStmt, block));
            // catch need read block first stmt, using return to void walk block twice.
            return;
        } else if (type === CodeBlockType.FINALLY) {
            this.pushStmt(new SourceFinallyStmt(this, this.lastStmt));
        }

        if (!block) {
            return;
        }

        let originalStmts: Stmt[] = this.sortStmt(block.getStmts());
        this.stmtReader = new StmtReader(originalStmts);
        while (this.stmtReader.hasNext()) {
            let stmt = this.stmtReader.next();
            if (this.skipStmts.has(stmt)) {
                continue;
            }
            if (stmt instanceof ArkIfStmt) {
                if (type === CodeBlockType.IF) {
                    this.pushStmt(new SourceIfStmt(this, stmt));
                } else if (type === CodeBlockType.WHILE) {
                    this.pushStmt(new SourceWhileStmt(this, stmt, block));
                } else if (type === CodeBlockType.FOR) {
                    let inc = this.cfgUtils.getForIncBlock(block)!;
                    this.pushStmt(new SourceForStmt(this, stmt, block, inc));
                } else if (type === CodeBlockType.DO_WHILE) {
                    this.pushStmt(new SourceDoWhileStmt(this, stmt, block));
                }
            } else {
                this.pushStmt(stmt2SourceStmt(this, stmt));
            }
            this.lastStmt = stmt;
        }
    }

    private printStmts(): void {
        for (let stmt of this.stmts) {
            if (this.skipStmts.has(stmt.original)) {
                continue;
            }
            this.printer.write(stmt.dump());
        }
    }

    public getStmts(): SourceStmt[] {
        return this.stmts.filter(value => !this.skipStmts.has(value.original));
    }

    public pushStmt(stmt: SourceStmt): void {
        let lastLine = this.getLastLine();
        if (stmt.getLine() < lastLine) {
            stmt.setLine(lastLine + 0.1);
        }
        stmt.transfer2ts();
        this.stmts.push(stmt);
    }

    private getLastLine(): number {
        if (this.stmts.length > 0) {
            return this.stmts[this.stmts.length - 1].getLine();
        }

        return 0;
    }

    /*
     * temp9 = new <>.<>();                            temp10 = new Array<number>(3);
     * temp10 = new Array<number>(3);                  temp10[0] = 'Cat';
     * temp10[0] = 'Cat';                        ==>   temp10[1] = 'Dog';
     * temp10[1] = 'Dog';                              temp10[2] = 'Hamster';
     * temp10[2] = 'Hamster';                          temp9 = new <>.<>();
     * temp9.constructor(temp10);                      temp9.constructor(temp10);
     */
    private sortStmt(stmts: Stmt[]): Stmt[] {
        for (let i = stmts.length - 1; i > 0; i--) {
            if (stmts[i] instanceof ArkInvokeStmt && (stmts[i].getInvokeExpr() as ArkInstanceInvokeExpr)) {
                let instanceInvokeExpr = stmts[i].getInvokeExpr() as ArkInstanceInvokeExpr;
                if ('constructor' !== instanceInvokeExpr.getMethodSignature().getMethodSubSignature().getMethodName()) {
                    continue;
                }
                let localName = instanceInvokeExpr.getBase().getName();
                let newExprIdx = findNewExpr(i, localName);
                if (newExprIdx >= 0 && newExprIdx < i - 1) {
                    moveStmt(i, newExprIdx);
                }
            }
        }
        return stmts;

        function findNewExpr(constructorIdx: number, name: string): number {
            for (let j = constructorIdx - 1; j >= 0; j--) {
                if (!(stmts[j] instanceof ArkAssignStmt)) {
                    continue;
                }
                const leftOp = (stmts[j] as ArkAssignStmt).getLeftOp();
                if (leftOp instanceof Local && leftOp.getName() === name) {
                    return j;
                }
            }
            return -1;
        }

        function moveStmt(constructorIdx: number, newExprIdx: number): void {
            let back = stmts[newExprIdx];
            for (let i = newExprIdx; i < constructorIdx - 1; i++) {
                stmts[i] = stmts[i + 1];
            }
            stmts[constructorIdx - 1] = back;
        }
    }
}

export class StmtReader {
    private stmts: Stmt[] = [];
    private pos: number;

    constructor(stmts: Stmt[]) {
        this.stmts = stmts;
        this.pos = 0;
    }

    first(): Stmt {
        return this.stmts[0];
    }

    hasNext(): boolean {
        return this.pos < this.stmts.length;
    }

    next(): Stmt {
        if (!this.hasNext()) {
            logger.error('SourceBody: StmtReader->next No more stmt.');
            throw new Error('No more stmt.');
        }
        let stmt = this.stmts[this.pos];
        this.pos++;
        return stmt;
    }

    rollback(): void {
        if (this.pos === 0) {
            logger.error('SourceBody: StmtReader->rollback No more stmt to rollback.');
            throw new Error('No more stmt to rollback.');
        }
        this.pos--;
    }
}
