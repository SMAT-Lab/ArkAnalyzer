import { Scene } from "../../Scene";
import { ArkBinopExpr, ArkInstanceInvokeExpr, ArkNewExpr, ArkStaticInvokeExpr } from "../base/Expr";
import { Local } from "../base/Local";
import { ArkInstanceFieldRef } from "../base/Ref";
import { ArkAssignStmt, Stmt } from "../base/Stmt";
import { AnyType, BooleanType, ClassType, NeverType, NullType, NumberType, StringType, Type, UndefinedType, UnknownType, VoidType } from "../base/Type";
import { ArkMethod } from "../model/ArkMethod";
import { ModelUtils } from "./ModelUtils";

export class TypeInference {
    private scene: Scene;
    constructor(scene: Scene) {
        this.scene = scene;
    }


    public inferTypeInMethod(arkMethod: ArkMethod): void {
        const cfg = arkMethod.getBody().getCfg();
        for (const block of cfg.getBlocks()) {
            for (const stmt of block.getStmts()) {
                this.resolveSymbolInStmt(stmt, arkMethod);
                this.inferTypeInStmt(stmt);
            }
        }
    }

    /** resolve symbol that is uncertain when build stmts, such as class' name and function's name */
    private resolveSymbolInStmt(stmt: Stmt, arkMethod: ArkMethod): void {
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
                const base = expr.getBase();
                const type = base.getType();
                if (!(type instanceof ClassType)) {
                    console.log('error: type of base must be ClassType');
                    continue;
                }
                const arkClass = ModelUtils.getClassWithClassSignature(type.getClassSignature(), this.scene);
                if (arkClass == null) {
                    console.log(`error: class ${type.getClassSignature().getClassName()} does not exist`);
                    continue;
                }
                const methodSignature = expr.getMethodSignature();
                const methodName = methodSignature.getMethodSubSignature().getMethodName();
                const arkMethod = ModelUtils.getMethodInClassWithName(methodName, arkClass);
                if (arkMethod == null) {
                    console.log(`error: method ${methodName} does not exist`);
                    continue;
                }
                expr.setMethodSignature(arkMethod.getSignature());
            } else if (expr instanceof ArkStaticInvokeExpr) {
            }


        }

        for (const ues of stmt.getUses()) {
            if (ues instanceof ArkInstanceFieldRef) {

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