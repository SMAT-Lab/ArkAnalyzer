import {Scene} from './../../Scene';
import Logger from "../../utils/logger";
import {AbstractInvokeExpr, ArkBinopExpr, ArkInstanceInvokeExpr, ArkNewExpr, ArkStaticInvokeExpr} from "../base/Expr";
import {Local} from "../base/Local";
import {AbstractFieldRef, ArkInstanceFieldRef, ArkParameterRef, ArkStaticFieldRef} from "../base/Ref";
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
import {ArkField} from '../model/ArkField';
import {ArkClass} from '../model/ArkClass';

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
                if (!(base instanceof Local)) {
                    logger.warn("invoke expr base is not local")
                    continue
                }
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
                            const defaultClass = arkNamespace.getClassWithName('_DEFAULT_ARK_CLASS');
                            const foundMethod = defaultClass?.getMethodWithName(methodName);
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
                                this.inferMethodReturnType(foundMethod)
                                if (stmt instanceof ArkAssignStmt) {
                                    const leftOp = stmt.getLeftOp()
                                    if (leftOp instanceof Local) {
                                        leftOp.setType(foundMethod.getReturnType)
                                    }
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
                // TODO: 对于taskpool.Task.constructor(), 其base类型为Task类，但是查询为空，导致函数签名无法解析
                const arkClass = this.scene.getClass(type.getClassSignature());
                if (arkClass == null) {
                    logger.warn(`class ${type.getClassSignature().getClassName()} does not exist`);
                    continue;
                }
                const methodSignature = expr.getMethodSignature();
                const methodName = methodSignature.getMethodSubSignature().getMethodName();
                const method = arkClass.getMethodWithName(methodName);
                if (method == null) {
                    logger.warn(`method ${methodName} does not exist`);
                    continue;
                }

                // infer return type
                this.inferMethodReturnType(method)
                if (stmt instanceof ArkAssignStmt) {
                    const leftOp = stmt.getLeftOp()
                    if (leftOp instanceof Local) {
                        leftOp.setType(method.getReturnType())
                    }
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
                let fieldType = this.handleClassField(use, arkMethod);
                if (stmt instanceof ArkAssignStmt && stmt.getLeftOp() instanceof Local && fieldType != undefined) {
                    if (fieldType instanceof ArkField) {
                        if (fieldType.getModifiers().has("StaticKeyword")) {
                            stmt.setRightOp(new ArkStaticFieldRef(fieldType.getSignature()))
                        } else {
                            // stmt.setRightOp(new ArkInstanceFieldRef(fieldType.getSignature()))
                            stmt.setRightOp(new ArkInstanceFieldRef(use.getBase(), fieldType.getSignature()));
                        }
                        (stmt.getLeftOp() as Local).setType(fieldType.getType())
                    } else if (fieldType instanceof ArkClass) {
                        (stmt.getLeftOp() as Local).setType(fieldType.getSignature())
                    }
                }
            }
        }
        const stmtDef = stmt.getDef()
        if (stmtDef && stmtDef instanceof ArkInstanceFieldRef) {
            let fieldType = this.handleClassField(stmtDef, arkMethod);
            if (fieldType instanceof ArkField) {
                let fieldRef: AbstractFieldRef
                if (fieldType.getModifiers().has("StaticKeyword")) {
                    fieldRef = new ArkStaticFieldRef(fieldType.getSignature())
                } else {
                    fieldRef = new ArkInstanceFieldRef(stmtDef.getBase(), fieldType.getSignature())
                }
                stmt.setDef(fieldRef)
                if (stmt instanceof ArkAssignStmt) {
                    // not sure
                    stmt.setLeftOp(fieldRef)
                }
            } else if (fieldType instanceof ArkClass) {
                // nothing to do?
            }
        }
    }

    private handleClassField(field: ArkInstanceFieldRef, arkMethod: ArkMethod): ArkClass | ArkField | null {
        const base = field.getBase()
        if (!(base instanceof Local)) {
            logger.warn("field ref base is not local")
            return null
        }
        const baseName = base.getName()
        const type = base.getType();
        const fieldName = field.getFieldName();
        let arkClass
        if (!(type instanceof ClassType)) {
            arkClass = ModelUtils.getClassWithName(baseName, arkMethod);
            if (!arkClass) {
                const nameSpace = ModelUtils.getNamespaceWithName(baseName, arkMethod);
                if (!nameSpace) {
                    logger.warn("Unclear Base");
                    return null;
                }
                const clas = nameSpace.getClassWithName(fieldName);
                return clas
            }
        } else {
            arkClass = this.scene.getClass(type.getClassSignature());
            if (arkClass == null) {
                logger.warn(`class ${type.getClassSignature().getClassName()} does not exist`);
                return null;
            }
        }

        const arkField = arkClass.getFieldWithName(fieldName);
        if (arkField == null) {
            logger.warn(`field ${fieldName} does not exist`);
            return null;
        }
        let fieldType = arkField.getType();
        if (fieldType instanceof UnclearReferenceType) {
            const fieldTypeName = fieldType.getName();
            const fieldTypeClass = ModelUtils.getClassWithName(fieldTypeName, arkMethod);
            if (fieldTypeClass) {
                fieldType = new ClassType(fieldTypeClass.getSignature());
            }
            arkField.setType(fieldType)
        }
        return arkField
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

    public inferMethodReturnType(method: ArkMethod) {
        let methodReturnType = method.getReturnType()
        if (methodReturnType instanceof UnclearReferenceType) {
            let returnInstance = ModelUtils.getClassWithName(
                methodReturnType.getName(),
                method);
            if (returnInstance == null) {
                logger.warn("can not get method return value type: " +
                    method.getSignature().toString() + ": " + methodReturnType.getName());
            } else {
                method.setReturnType(new ClassType(returnInstance.getSignature()));
            }
        }
    }
}