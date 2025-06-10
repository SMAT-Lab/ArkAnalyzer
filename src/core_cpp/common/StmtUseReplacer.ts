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

import { AbstractExpr, AbstractInvokeExpr, ArkConditionExpr } from '../base/Expr';
import { AbstractRef } from '../base/Ref';
import { ArkAssignStmt, ArkIfStmt, ArkInvokeStmt, ArkReturnStmt, ArkThrowStmt, Stmt } from '../base/Stmt';
import { Value } from '../base/Value';
import { ExprUseReplacer } from './ExprUseReplacer';
import { RefUseReplacer } from './RefUseReplacer';
import { IRUtils } from './IRUtils';

/**
 * Replace old use(Value) of a Stmt inplace
 */
export class StmtUseReplacer {
    private oldUse: Value;
    private newUse: Value;

    constructor(oldUse: Value, newUse: Value) {
        this.oldUse = oldUse;
        this.newUse = newUse;
    }

    public caseStmt(stmt: Stmt): void {
        if (stmt instanceof ArkAssignStmt) {
            this.caseAssignStmt(stmt);
        } else if (stmt instanceof ArkInvokeStmt) {
            this.caseInvokeStmt(stmt);
        } else if (stmt instanceof ArkReturnStmt) {
            this.caseReturnStmt(stmt);
        } else if (stmt instanceof ArkIfStmt) {
            this.caseIfStmt(stmt);
        } else if (stmt instanceof ArkThrowStmt) {
            this.caseThrowStmt(stmt);
        }
    }

    private caseAssignStmt(stmt: ArkAssignStmt): void {
        const lValue = stmt.getLeftOp();
        if (lValue instanceof AbstractRef) {
            const refUseReplacer = new RefUseReplacer(this.oldUse, this.newUse);
            refUseReplacer.caseRef(lValue);
        }

        const rValue = stmt.getRightOp();
        if (rValue === this.oldUse) {
            IRUtils.adjustOperandOriginalPositions(stmt, this.oldUse, this.newUse);
            stmt.setRightOp(this.newUse);
        } else if (rValue instanceof AbstractRef) {
            const refUseReplacer = new RefUseReplacer(this.oldUse, this.newUse);
            refUseReplacer.caseRef(rValue);
        } else if (rValue instanceof AbstractExpr) {
            const exprUseReplacer = new ExprUseReplacer(this.oldUse, this.newUse);
            exprUseReplacer.caseExpr(rValue);
        }
    }

    private caseInvokeStmt(stmt: ArkInvokeStmt): void {
        const invokeExpr = stmt.getInvokeExpr();
        if (invokeExpr === this.oldUse) {
            if (this.newUse instanceof AbstractInvokeExpr) {
                IRUtils.adjustOperandOriginalPositions(stmt, this.oldUse, this.newUse);
                stmt.replaceInvokeExpr(this.newUse);
            }
        } else {
            let exprUseReplacer = new ExprUseReplacer(this.oldUse, this.newUse);
            exprUseReplacer.caseExpr(stmt.getInvokeExpr());
        }
    }

    private caseReturnStmt(stmt: ArkReturnStmt): void {
        if (stmt.getOp() === this.oldUse) {
            IRUtils.adjustOperandOriginalPositions(stmt, this.oldUse, this.newUse);
            stmt.setReturnValue(this.newUse);
        }
    }

    private caseIfStmt(stmt: ArkIfStmt): void {
        const conditionExpr = stmt.getConditionExpr();
        if (conditionExpr === this.oldUse) {
            if (this.newUse instanceof ArkConditionExpr) {
                IRUtils.adjustOperandOriginalPositions(stmt, this.oldUse, this.newUse);
                stmt.setConditionExpr(this.newUse);
            }
        } else {
            let exprUseReplacer = new ExprUseReplacer(this.oldUse, this.newUse);
            exprUseReplacer.caseExpr(stmt.getConditionExpr());
        }
    }

    private caseThrowStmt(stmt: ArkThrowStmt): void {
        if (stmt.getOp() === this.oldUse) {
            IRUtils.adjustOperandOriginalPositions(stmt, this.oldUse, this.newUse);
            stmt.setOp(this.newUse);
        }
    }
}
