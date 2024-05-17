import { AbstractExpr } from "../base/Expr";
import { Local } from "../base/Local";
import { AbstractRef } from "../base/Ref";
import { ArkAssignStmt, ArkIfStmt, ArkInvokeStmt, ArkReturnStmt, Stmt } from "../base/Stmt";
import { Value } from "../base/Value";
import { ExprUseReplacer } from "./ExprUseReplacer";
import { RefUseReplacer } from "./RefUseReplacer";

/**
 * Replace old use(Value) of a Stmt inplace
 */
export class StmtUseReplacer {
    private oldUse: Value;
    private newUse: Value;

    constructor(oldUse: Value, newUse: Value) {
        this.oldUse = oldUse
        this.newUse = newUse;
    }

    // TODO:是否将该逻辑移Stmt具体类中，利用多态实现
    public caseStmt(stmt: Stmt): void {
        if (stmt instanceof ArkAssignStmt) {
            this.caseAssignStmt(stmt);
        } else if (stmt instanceof ArkInvokeStmt) {
            this.caseInvokeStmt(stmt);
        } else if (stmt instanceof ArkReturnStmt) {
            this.caseReturnStmt(stmt);
        } else if (stmt instanceof ArkIfStmt) {
            this.caseIfStmt(stmt);
        }
    }

    private caseAssignStmt(stmt: ArkAssignStmt): void {
        let rValue = stmt.getRightOp();
        if (rValue == this.oldUse) {
            stmt.setRightOp(this.newUse);
        } else if (rValue instanceof Local) {
            if (rValue == this.oldUse) {
                stmt.setRightOp(this.newUse);
            }
        } else if (rValue instanceof AbstractRef) {
            if (rValue == this.oldUse) {
                stmt.setRightOp(this.newUse);
            } else {
                let refUseReplacer = new RefUseReplacer(this.oldUse, this.newUse);
                refUseReplacer.caseRef(rValue);
            }
        } else if (rValue instanceof AbstractExpr) {
            if (rValue == this.oldUse) {
                stmt.setRightOp(this.newUse);
            } else {
                let exprUseReplacer = new ExprUseReplacer(this.oldUse, this.newUse);
                exprUseReplacer.caseExpr(rValue);
            }
        }
    }

    private caseInvokeStmt(stmt: ArkInvokeStmt): void {
        let exprUseReplacer = new ExprUseReplacer(this.oldUse, this.newUse);
        exprUseReplacer.caseExpr(stmt.getInvokeExpr());
    }

    private caseReturnStmt(stmt: ArkReturnStmt): void {
        stmt.setReturnValue(this.newUse);
    }

    private caseIfStmt(stmt: ArkIfStmt): void {
        let exprUseReplacer = new ExprUseReplacer(this.oldUse, this.newUse);
        exprUseReplacer.caseExpr(stmt.getConditionExprExpr());
    }
}