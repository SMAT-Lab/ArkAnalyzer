import { Scene } from "../../Scene";
import { ArkBinopExpr, ArkInstanceInvokeExpr, ArkNewExpr, ArkStaticInvokeExpr } from "../base/Expr";
import { Local } from "../base/Local";
import { ArkInstanceFieldRef, ArkParameterRef } from "../base/Ref";
import { ArkAssignStmt, Stmt } from "../base/Stmt";
import {
    AnnotationNamespaceType,
    AnnotationType,
    AnyType,
    BooleanType,
    ClassType,
    NeverType,
    NullType,
    NumberType,
    StringType,
    Type, UnclearReferenceType,
    UndefinedType,
    UnionType,
    UnknownType,
    VoidType
} from "../base/Type";
import { ArkMethod } from "../model/ArkMethod";
import { ModelUtils } from "./ModelUtils";

export class TypeInference {
    private scene: Scene;
    constructor(scene: Scene) {
        this.scene = scene;
    }


    public inferTypeInMethod(arkMethod: ArkMethod): void {
        const body = arkMethod.getBody();
        if (!body) {
            console.log('error: empty body');
            return;
        }
        const cfg = body.getCfg();
        for (const block of cfg.getBlocks()) {
            for (const stmt of block.getStmts()) {
                // console.log(stmt.toString())
                this.resolveSymbolInStmt(stmt, arkMethod);
                TypeInference.inferTypeInStmt(stmt, arkMethod);
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
                let type = base.getType();
                if (type instanceof UnknownType){
                    const arkClass = ModelUtils.getClassWithName(base.getName(), arkMethod);
                    if (arkClass){
                        type = new ClassType(arkClass.getSignature());
                        base.setType(type);
                    }
                    else {
                        const arkNamespace = ModelUtils.getNamespaceWithName(base.getName(), arkMethod);
                        if (arkNamespace){
                            const methodName = expr.getMethodSignature().getMethodSubSignature().getMethodName();
                            const defaultClass = arkNamespace.getClasses().find(cls => cls.getName() == '_DEFAULT_ARK_CLASS') || null;
                            const foundMethod = ModelUtils.getMethodInClassWithName(methodName, defaultClass!);
                            if (foundMethod){
                                expr.setMethodSignature(foundMethod.getSignature());
                                return;
                            }
                        }
                    }
                }
                if (!(type instanceof ClassType)) {
                    console.log(`error: type of base must be ClassType expr: ${expr.toString()}`);
                    continue;
                }
                const arkClass = ModelUtils.getClassWithClassSignature(type.getClassSignature(), this.scene);
                if (arkClass == null) {
                    console.log(`error: class ${type.getClassSignature().getClassName()} does not exist`);
                    continue;
                }
                const methodSignature = expr.getMethodSignature();
                const methodName = methodSignature.getMethodSubSignature().getMethodName();
                const method = ModelUtils.getMethodInClassWithName(methodName, arkClass);
                if (method == null) {
                    console.log(`error: method ${methodName} does not exist`);
                    continue;
                }
                expr.setMethodSignature(method.getSignature());
            } else if (expr instanceof ArkStaticInvokeExpr) {
                const methodSignature = expr.getMethodSignature();
                const methodName = methodSignature.getMethodSubSignature().getMethodName();
                const method = ModelUtils.getStaticMethodWithName(methodName, arkMethod);
                if (method == null) {
                    console.log(`error: method ${methodName} does not exist`);
                    continue;
                }
                expr.setMethodSignature(method.getSignature());
            }
        }

        for (const use of stmt.getUses()) {
            if (use instanceof ArkInstanceFieldRef) {
                const base = use.getBase();
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

                const fieldName = use.getFieldName();
                const arkField = ModelUtils.getFieldInClassWithName(fieldName, arkClass);
                if (arkField == null) {
                    console.log(`error: field ${fieldName} does not exist`);
                    continue;
                }
                use.setFieldSignature(arkField.getSignature());
            }
        }
    }

    public static inferTypeInStmt(stmt: Stmt, arkMethod: ArkMethod | null): void {
        if (stmt instanceof ArkAssignStmt) {
            const leftOp = stmt.getLeftOp();
            if (leftOp instanceof Local) {
                const leftOpType = leftOp.getType();
                if (leftOpType instanceof AnnotationType) {
                    if (arkMethod === null) {
                        return
                    }
                    let leftOpTypeString = leftOpType.getOriginType()
                    if (leftOpType instanceof AnnotationNamespaceType) {
                        let classSignature = ModelUtils.getClassWithName(leftOpTypeString, arkMethod)?.getSignature()
                        if (classSignature === undefined) {
                            leftOp.setType(stmt.getRightOp().getType())
                        } else {
                            leftOp.setType(new ClassType(classSignature))
                        }
                    }
                } else if (leftOpType instanceof UnknownType) {
                    const rightOp = stmt.getRightOp();
                    if (rightOp instanceof ArkParameterRef) {
                        let rightOpType = rightOp.getType()
                        if (rightOpType instanceof UnclearReferenceType) {
                            if (arkMethod == null)
                                return
                            let classSignature = ModelUtils.getClassWithName(rightOpType.getName(), arkMethod)?.getSignature();
                            if (classSignature === undefined) {
                                leftOp.setType(stmt.getRightOp().getType())
                            } else {
                                leftOp.setType(new ClassType(classSignature))
                            }
                        }
                    } else if (rightOp instanceof ArkInstanceFieldRef) {
                        if (arkMethod == null)
                            return;
                        if (!(rightOp.getBase().getType() instanceof ClassType)) {
                            return;
                        }
                        const classSignature = rightOp.getBase().getType() as ClassType
                        let classInstance = ModelUtils.getClassWithClassSignature(
                            classSignature.getClassSignature(), arkMethod.getDeclaringArkFile().getScene()
                        )
                        if (classInstance == null) {
                            console.log("Get Class Instance error")
                            return
                        }
                        let fieldInstance = ModelUtils.getFieldInClassWithName(
                            rightOp.getFieldName(), classInstance
                        )
                        if (fieldInstance == null) {
                            console.log("Get Field Instance error")
                            return
                        }
                        let fieldType = fieldInstance.getType();
                        if(fieldType instanceof UnclearReferenceType){
                            const fieldTypeName = fieldType.getName();
                            const arkClass = ModelUtils.getClassWithName(fieldTypeName,arkMethod);
                            if (arkClass){
                                fieldType = new ClassType(arkClass.getSignature());
                            }
                        }
                        leftOp.setType(fieldType)
                    } else {
                        leftOp.setType(rightOp.getType());
                    }
                } else if (leftOpType instanceof UnionType) {
                    const rightOp = stmt.getRightOp();
                    leftOpType.setCurrType(rightOp.getType());
                } else if (leftOpType instanceof UnclearReferenceType) {
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
        let op1Type = binopExpr.getOp1().getType();
        let op2Type = binopExpr.getOp2().getType();
        if (op1Type instanceof UnionType) {
            op1Type = op1Type.getCurrType();
        }
        if (op2Type instanceof UnionType) {
            op2Type = op2Type.getCurrType();
        }
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