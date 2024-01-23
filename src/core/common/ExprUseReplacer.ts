import { AbstractExpr, ArkBinopExpr, ArkCastExpr, ArkInstanceOfExpr, ArkInvokeExpr, ArkLengthExpr, ArkNewArrayExpr, ArkTypeOfExpr } from "../base/Expr";
import { Local } from "../base/Local";
import { Value } from "../base/Value";

/**
 * Replace old use of a Expr inplace
 */
export class ExprUseReplacer {
    private oldUse: Value;
    private newUse: Value;

    constructor(oldUse: Value, newUse: Value) {
        this.oldUse = oldUse
        this.newUse = newUse;
    }

    // TODO:是否将该逻辑移Expr具体类中，利用多态实现
    public caseExpr(expr: AbstractExpr): void {
        if (expr instanceof ArkBinopExpr) {

        } else if (expr instanceof ArkInvokeExpr) {
            this.caseInvokeExpr(expr);
        } else if (expr instanceof ArkNewArrayExpr) {
            this.caseNewArrayExpr(expr);
        } else if (expr instanceof ArkBinopExpr) {
            this.caseBinopExpr(expr);
        } else if (expr instanceof ArkTypeOfExpr) {
            this.caseTypeOfExpr(expr);
        } else if (expr instanceof ArkInstanceOfExpr) {
            this.caseInstanceOfExpr(expr);
        } else if (expr instanceof ArkLengthExpr) {
            this.caseLengthExpr(expr);
        } else if (expr instanceof ArkCastExpr) {
            this.caseCastExpr(expr);
        }
    }

    private caseInvokeExpr(expr: ArkInvokeExpr): void {
        let args = expr.getArgs();
        for (let i = 0; i < args.length; i++) {
            if (args[i] == this.oldUse) {
                args[i] = this.newUse;
            }
        }

        if (expr.getBase() == this.oldUse) {
            expr.setBase(<Local>this.newUse);
        }
    }

    private caseNewArrayExpr(expr: ArkNewArrayExpr): void {
        if (expr.getSize() == this.oldUse) {
            expr.setSize(this.newUse);
        }
    }

    private caseBinopExpr(expr: ArkBinopExpr): void {
        if (expr.getOp1() == this.oldUse) {
            expr.setOp1(this.newUse);
        }
        if (expr.getOp2() == this.oldUse) {
            expr.setOp2(this.newUse);
        }
    }

    private caseTypeOfExpr(expr: ArkTypeOfExpr): void {
        if (expr.getOp() == this.oldUse) {
            expr.setOp(this.newUse);
        }
    }

    private caseInstanceOfExpr(expr: ArkInstanceOfExpr): void {
        if (expr.getOp() == this.oldUse) {
            expr.setOp(this.newUse);
        }
    }

    private caseLengthExpr(expr: ArkLengthExpr): void {
        if (expr.getOp() == this.oldUse) {
            expr.setOp(this.newUse);
        }
    }

    private caseCastExpr(expr: ArkCastExpr): void {
        if (expr.getOp() == this.oldUse) {
            expr.setOp(this.newUse);
        }
    }
}