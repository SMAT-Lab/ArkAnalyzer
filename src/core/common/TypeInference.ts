import {Scene} from './../../Scene';
import Logger from "../../utils/logger";
import {AbstractInvokeExpr, ArkBinopExpr, ArkInstanceInvokeExpr, ArkNewExpr, ArkStaticInvokeExpr} from "../base/Expr";
import {Local} from "../base/Local";
import {ArkInstanceFieldRef, ArkParameterRef} from "../base/Ref";
import {ArkAssignStmt, ArkInvokeStmt, Stmt} from "../base/Stmt";
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
import {ArkMethod} from "../model/ArkMethod";
import {ClassSignature} from "../model/ArkSignature";
import {ModelUtils} from "./ModelUtils";

const logger = Logger.getLogger();

export class TypeInference {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    public inferTypeInMethod(arkMethod: ArkMethod): void {
        const body = arkMethod.getBody();
        if (!body) {
            logger.warn('empty body');
            return;
        }
        const cfg = body.getCfg();
        for (const block of cfg.getBlocks()) {
            for (const stmt of block.getStmts()) {
                this.resolveSymbolInStmt(stmt, arkMethod);
                TypeInference.inferTypeInStmt(stmt, arkMethod);
            }
        }
    }

    public inferSimpleTypeInMethod(arkMethod: ArkMethod): void {
        const body = arkMethod.getBody();
        if (!body) {
            logger.warn('empty body');
            return;
        }
        const cfg = body.getCfg();
        for (const block of cfg.getBlocks()) {
            for (const stmt of block.getStmts()) {
                TypeInference.inferSimpleTypeInStmt(stmt);
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
                if (type instanceof UnknownType) {
                    const arkClass = ModelUtils.getClassWithName(base.getName(), arkMethod);
                    if (arkClass) {
                        type = new ClassType(arkClass.getSignature());
                        base.setType(type);
                    } else {
                        const arkNamespace = ModelUtils.getNamespaceWithName(base.getName(), arkMethod);
                        if (arkNamespace) {
                            const methodName = expr.getMethodSignature().getMethodSubSignature().getMethodName();
                            const defaultClass = arkNamespace.getClasses().find(cls => cls.getName() == '_DEFAULT_ARK_CLASS') || null;
                            const foundMethod = ModelUtils.getMethodInClassWithName(methodName, defaultClass!);
                            if (foundMethod) {
                                let replaceStaticInvokeExpr = new ArkStaticInvokeExpr(foundMethod.getSignature(), expr.getArgs())
                                if (stmt.containsInvokeExpr()) {
                                    if (stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof ArkInstanceInvokeExpr) {
                                        stmt.setRightOp(replaceStaticInvokeExpr)
                                    } else if (stmt instanceof ArkInvokeStmt) {
                                        stmt.replaceInvokeExpr(replaceStaticInvokeExpr)
                                    }
                                    stmt.setText(stmt.toString().replace(/^instanceInvoke/, "staticinvoke"))
                                }
                                return;
                            }
                        }
                    }
                }
                if (!(type instanceof ClassType)) {
                    logger.warn(`type of base must be ClassType expr: ${expr.toString()}`);
                    continue;
                }
                const arkClass = ModelUtils.getClassWithClassSignature(type.getClassSignature(), this.scene);
                if (arkClass == null) {
                    logger.warn(`class ${type.getClassSignature().getClassName()} does not exist`);
                    continue;
                }
                const methodSignature = expr.getMethodSignature();
                const methodName = methodSignature.getMethodSubSignature().getMethodName();
                const method = ModelUtils.getMethodInClassWithName(methodName, arkClass);
                if (method == null) {
                    logger.warn(`method ${methodName} does not exist`);
                    continue;
                }
                expr.setMethodSignature(method.getSignature());
                if (method.getModifiers().has("StaticKeyword")) {
                    let replaceStaticInvokeExpr = new ArkStaticInvokeExpr(method.getSignature(), expr.getArgs())
                    if (stmt.containsInvokeExpr()) {
                        stmt.replaceInvokeExpr(replaceStaticInvokeExpr)
                        if (stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof ArkInstanceInvokeExpr) {
                            stmt.setRightOp(replaceStaticInvokeExpr)
                        } else if (stmt instanceof ArkInvokeStmt) {
                            stmt.replaceInvokeExpr(replaceStaticInvokeExpr)
                        }
                    }
                }
            } else if (expr instanceof ArkStaticInvokeExpr) {
                const methodSignature = expr.getMethodSignature();
                const methodName = methodSignature.getMethodSubSignature().getMethodName();
                const method = ModelUtils.getStaticMethodWithName(methodName, arkMethod);
                if (method == null) {
                    logger.warn(`method ${methodName} does not exist`);
                    continue;
                }
                expr.setMethodSignature(method.getSignature());
            }
        }

        for (const use of stmt.getUses()) {
            if (use instanceof ArkInstanceFieldRef) {
                this.handleClassField(use);
            }
        }
        const stmtDef = stmt.getDef()
        if (stmtDef && stmtDef instanceof ArkInstanceFieldRef) {
            this.handleClassField(stmtDef);
        }
    }

    private handleClassField(field: ArkInstanceFieldRef) {
        const base = field.getBase();
        const type = base.getType();
        if (!(type instanceof ClassType)) {
            logger.warn('type of base must be ClassType');
            return;
        }
        const arkClass = ModelUtils.getClassWithClassSignature(type.getClassSignature(), this.scene);
        if (arkClass == null) {
            logger.warn(`class ${type.getClassSignature().getClassName()} does not exist`);
            return;
        }

        const fieldName = field.getFieldName();
        const arkField = ModelUtils.getFieldInClassWithName(fieldName, arkClass);
        if (arkField == null) {
            logger.warn(`field ${fieldName} does not exist`);
            return;
        }
        field.setFieldSignature(arkField.getSignature());
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
                        if (arkMethod == null || (!(rightOp.getBase().getType() instanceof ClassType)))
                            return;
                        const classSignature = rightOp.getBase().getType() as ClassType
                        let classInstance = ModelUtils.getClassWithClassSignature(
                            classSignature.getClassSignature(), arkMethod.getDeclaringArkFile().getScene()
                        )
                        if (classInstance == null) {
                            logger.warn("getting Class Instance: " + rightOp.getBase().getName())
                            return
                        }
                        let fieldInstance = ModelUtils.getFieldInClassWithName(
                            rightOp.getFieldName(), classInstance
                        )
                        if (fieldInstance == null) {
                            logger.warn("getting Field Instance error: " + rightOp.getFieldName())
                            return
                        }
                        let fieldType = fieldInstance.getType();
                        if (fieldType instanceof UnclearReferenceType) {
                            const fieldTypeName = fieldType.getName();
                            const arkClass = ModelUtils.getClassWithName(fieldTypeName, arkMethod);
                            if (arkClass) {
                                fieldType = new ClassType(arkClass.getSignature());
                            }
                        }
                        leftOp.setType(fieldType)
                    } else if (rightOp instanceof AbstractInvokeExpr) {
                        // 函数调用返回值解析
                        if (arkMethod === null) {
                            return
                        }
                        let invokeExpr = stmt.getInvokeExpr()!
                        let methodSignature = invokeExpr.getMethodSignature()
                        const arkClass = ModelUtils.getClassWithClassSignature(
                            methodSignature.getDeclaringClassSignature(),
                            arkMethod.getDeclaringArkFile().getScene());
                        if (arkClass == null) {
                            return
                        }
                        const method = ModelUtils.getMethodInClassWithName(
                            methodSignature?.getMethodSubSignature().getMethodName()!,
                            arkClass);
                        if (method == null) {
                            return
                        }
                        let methodReturnType = method.getReturnType()
                        if (methodReturnType instanceof UnclearReferenceType) {
                            let returnType = ModelUtils.getClassWithName(
                                methodReturnType.getName(),
                                method)
                            if (returnType == null) {
                                logger.warn("can not get method return value type: " +
                                    method.getSignature().toString() + ": " + methodReturnType.getName())
                                return
                            }
                            leftOp.setType(new ClassType(returnType.getSignature()))
                        } else {
                            leftOp.setType(methodReturnType)
                        }
                    } else {
                        leftOp.setType(rightOp.getType());
                    }
                } else if (leftOpType instanceof UnionType) {
                    const rightOp = stmt.getRightOp();
                    leftOpType.setCurrType(rightOp.getType());
                } else if (leftOpType instanceof UnclearReferenceType) {
                    if (stmt.containsInvokeExpr()) {
                    }
                }
            } else if (leftOp instanceof ArkInstanceFieldRef) {
                // 对应赋值语句左值进行了取属性操作
            }
        }
    }

    public static inferSimpleTypeInStmt(stmt: Stmt): void {
        if (stmt instanceof ArkAssignStmt) {
            const leftOp = stmt.getLeftOp();
            if (leftOp instanceof Local) {
                const leftOpType = leftOp.getType();
                if (leftOpType instanceof UnknownType) {
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
            case 'RegularExpression':
                const classSignature = new ClassSignature();
                classSignature.setClassName('RegExp');
                return new ClassType(classSignature);
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