import { ArkBinopExpr, ArkInstanceInvokeExpr, ArkNewExpr, ArkStaticInvokeExpr } from "../base/Expr";
import { Local } from "../base/Local";
import { ArkInstanceFieldRef } from "../base/Ref";
import { ArkAssignStmt, Stmt } from "../base/Stmt";
import { AnyType, BooleanType, ClassType, NeverType, NullType, NumberType, StringType, Type, UndefinedType, UnknownType, VoidType } from "../base/Type";
import { ArkMethod } from "../model/ArkMethod";
import { ModelUtils } from "./ModelUtils";

export class TypeInference {
    public inferTypeInMethod(arkMethod: ArkMethod): void {
        const cfg = arkMethod.getBody().getCfg();
        for (const block of cfg.getBlocks()) {
            for (const stmt of block.getStmts()) {
                this.resolveSymbolStmt(stmt, arkMethod);
                this.inferTypeInStmt(stmt);
            }
        }
    }

    private resolveSymbolStmt(stmt: Stmt, arkMethod: ArkMethod): void {
        const exprs = stmt.getExprs();
        for (const expr of exprs) {
            if (expr instanceof ArkNewExpr) {
                let classType = expr.getType() as ClassType;
                const className = classType.getClassSignature().getClassName();
                const arkClass = ModelUtils.getClassWithName(className, arkMethod);
                if (arkClass) {
                    classType.setClassSignature(arkClass.getSignature());
                }
            } else if (expr instanceof ArkInstanceInvokeExpr) {
                 
            } else if (expr instanceof ArkStaticInvokeExpr) {
            }


        }

        for (const ues of stmt.getUses()) {
            if(ues instanceof ArkInstanceFieldRef){

            }
        }
    }

    private inferTypeInStmt(stmt: Stmt): void {
        if (stmt instanceof ArkAssignStmt) {
            const leftOp = stmt.getLeftOp();
            if (leftOp instanceof Local) {
                if (leftOp.getType() == UnknownType.getInstance()) {
                    const rightOp = stmt.getRightOp();
                    leftOp.setType(rightOp.getType());
                }
            }
        }
    }

    // Deal only with simple situations
    public static buildTypeFromStr(typeStr: string): Type {
        switch (typeStr) {
            case 'boolean':
                return BooleanType.getInstance();
            case 'number':
                return NumberType.getInstance();
            case 'string':
                return StringType.getInstance();
            case 'undefined':
                return UndefinedType.getInstance();
            case 'null':
                return NullType.getInstance();
            case 'any':
                return AnyType.getInstance();
            case 'void':
                return VoidType.getInstance();
            case 'never':
                return NeverType.getInstance();
            default:
                return UnknownType.getInstance();
        }
    }

    public static inferTypeOfBinopExpr(binopExpr: ArkBinopExpr): Type {
        const operator = binopExpr.getOperator();
        const op1Type = binopExpr.getOp1().getType();
        const op2Type = binopExpr.getOp2().getType();
        switch (operator) {
            case "+":
                if (op1Type === StringType.getInstance() || op2Type === StringType.getInstance()) {
                    return StringType.getInstance();
                }
                if (op1Type === NumberType.getInstance() && op2Type === NumberType.getInstance()) {
                    return NumberType.getInstance();
                }
                break;
            case "-":
            case "*":
            case "/":
            case "%":
                if (op1Type === NumberType.getInstance() && op2Type === NumberType.getInstance()) {
                    return NumberType.getInstance();
                }
                break;
            case "<":
            case "<=":
            case ">":
            case ">=":
            case "==":
            case "!=":
            case "===":
            case "!==":
            case "&&":
            case "||":
                return BooleanType.getInstance();
            case "&":
            case "|":
            case "^":
            case "<<":
            case ">>":
            case ">>>":
                if (op1Type === NumberType.getInstance() && op2Type === NumberType.getInstance()) {
                    return NumberType.getInstance();
                }
                break;
        }
        return UnknownType.getInstance();
    }
}