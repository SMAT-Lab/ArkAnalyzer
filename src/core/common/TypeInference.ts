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

import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { AbstractExpr, ArkInstanceInvokeExpr, ArkPtrInvokeExpr, ArkStaticInvokeExpr } from '../base/Expr';
import { Local } from '../base/Local';
import {
    AbstractFieldRef,
    AbstractRef,
    ArkArrayRef,
    ArkInstanceFieldRef,
    ArkParameterRef,
    ArkStaticFieldRef,
    GlobalRef
} from '../base/Ref';
import { ArkAliasTypeDefineStmt, ArkAssignStmt, ArkReturnStmt, Stmt } from '../base/Stmt';
import {
    AliasType,
    AnnotationNamespaceType,
    AnyType,
    ArrayType,
    BigIntType,
    BooleanType,
    ClassType,
    EnumValueType,
    FunctionType,
    GenericType,
    IntersectionType, LiteralType,
    NeverType,
    NullType,
    NumberType,
    StringType,
    TupleType,
    Type,
    UnclearReferenceType,
    UndefinedType,
    UnionType,
    UnknownType,
    VoidType,
} from '../base/Type';
import { ArkMethod } from '../model/ArkMethod';
import { ArkExport } from '../model/ArkExport';
import { ArkClass, ClassCategory } from '../model/ArkClass';
import { ArkField, FieldCategory } from '../model/ArkField';
import { Value } from '../base/Value';
import { Constant } from '../base/Constant';
import { ArkNamespace } from '../model/ArkNamespace';
import {
    ALL,
    ANY_KEYWORD,
    BIGINT_KEYWORD,
    BOOLEAN_KEYWORD,
    CONSTRUCTOR_NAME,
    DEFAULT,
    GLOBAL_THIS_NAME,
    NEVER_KEYWORD,
    NULL_KEYWORD,
    NUMBER_KEYWORD,
    PROMISE,
    STRING_KEYWORD,
    SUPER_NAME,
    THIS_NAME,
    UNDEFINED_KEYWORD,
    VOID_KEYWORD,
} from './TSConst';
import { ModelUtils } from './ModelUtils';
import { Builtin } from './Builtin';
import { MethodSignature, MethodSubSignature, NamespaceSignature } from '../model/ArkSignature';
import {
    ANONYMOUS_CLASS_PREFIX,
    ANONYMOUS_METHOD_PREFIX,
    INSTANCE_INIT_METHOD_NAME,
    LEXICAL_ENV_NAME_PREFIX,
    STATIC_INIT_METHOD_NAME,
    UNKNOWN_FILE_NAME
} from './Const';
import { EMPTY_STRING } from './ValueUtil';
import { ImportInfo } from '../model/ArkImport';
import { MethodParameter } from '../model/builder/ArkMethodBuilder';
import { IRInference } from './IRInference';
import { AbstractTypeExpr, KeyofTypeExpr, TypeQueryExpr } from '../base/TypeExpr';
import { SdkUtils } from './SdkUtils';
import { ModifierType } from '../model/ArkBaseModel';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'TypeInference');
const unknownFileName: string[] = [UNKNOWN_FILE_NAME, Builtin.DUMMY_FILE_NAME];

export class TypeInference {
    public static inferTypeInArkField(arkField: ArkField): void {
        const arkClass = arkField.getDeclaringArkClass();
        const stmts = arkField.getInitializer();
        const method = arkClass.getMethodWithName(INSTANCE_INIT_METHOD_NAME) ??
            arkClass.getMethodWithName(STATIC_INIT_METHOD_NAME) ??
            arkClass.getMethodWithName(CONSTRUCTOR_NAME);
        for (const stmt of stmts) {
            if (method) {
                this.resolveStmt(stmt, method);
            }
        }
        const beforeType = arkField.getType();
        if (!this.isUnclearType(beforeType)) {
            return;
        }
        let rightType: Type | undefined;
        let fieldRef: ArkInstanceFieldRef | undefined;
        const lastStmt = stmts[stmts.length - 1];
        if (lastStmt instanceof ArkAssignStmt) {
            rightType = lastStmt.getRightOp().getType();
            if (lastStmt.getLeftOp() instanceof ArkInstanceFieldRef) {
                fieldRef = lastStmt.getLeftOp() as ArkInstanceFieldRef;
            }
        }
        let fieldType;
        if (beforeType) {
            fieldType = this.inferUnclearedType(beforeType, arkClass);
        }
        if (fieldType) {
            arkField.getSignature().setType(fieldType);
            fieldRef?.setFieldSignature(arkField.getSignature());
        } else if (rightType && this.isUnclearType(beforeType) && !this.isUnclearType(rightType)) {
            arkField.getSignature().setType(rightType);
            fieldRef?.setFieldSignature(arkField.getSignature());
        }
    }

    /**
     * Infer type for a given unclear type.
     * It returns an array with 2 items, original object and original type.
     * The original object is null if there is no object, or it failed to find the object.
     * The original type is null if failed to infer the type.
     * @param leftOpType
     * @param declaringArkClass
     * @param visited
     * @returns
     */
    public static inferUnclearedType(leftOpType: Type, declaringArkClass: ArkClass, visited: Set<Type> = new Set()): Type | null | undefined {
        if (visited.has(leftOpType)) {
            return leftOpType;
        } else {
            visited.add(leftOpType);
        }
        let type;
        if (leftOpType instanceof ClassType && unknownFileName.includes(leftOpType.getClassSignature().getDeclaringFileSignature().getFileName())) {
            const realTypes = leftOpType.getRealGenericTypes();
            this.inferRealGenericTypes(realTypes, declaringArkClass);
            let newType = TypeInference.inferUnclearRefName(leftOpType.getClassSignature().getClassName(), declaringArkClass);
            type = newType ? this.replaceTypeWithReal(newType, realTypes) : null;
        } else if (leftOpType instanceof TypeQueryExpr) {
            this.inferRealGenericTypes(leftOpType.getGenerateTypes(), declaringArkClass);
            type = leftOpType;
        } else if (leftOpType instanceof TupleType) {
            this.inferRealGenericTypes(leftOpType.getTypes(), declaringArkClass);
            type = leftOpType;
        } else if (leftOpType instanceof GenericType) {
            this.inferGenericType([leftOpType], declaringArkClass);
            type = leftOpType;
        } else if (leftOpType instanceof AnnotationNamespaceType) {
            type = this.inferBaseType(leftOpType.getOriginType(), declaringArkClass);
        } else if (leftOpType instanceof UnclearReferenceType) {
            type = this.inferUnclearRefType(leftOpType, declaringArkClass);
        }
        if (type) {
            return type;
        }
        return TypeInference.inferUnclearComplexType(leftOpType, declaringArkClass, visited);
    }

    private static inferUnclearComplexType(leftOpType: Type, declaringArkClass: ArkClass, visited: Set<Type>): Type | undefined {
        let type;
        if (leftOpType instanceof UnionType || leftOpType instanceof IntersectionType || leftOpType instanceof TupleType) {
            let types = leftOpType.getTypes();
            for (let i = 0; i < types.length; i++) {
                let newType = this.inferUnclearedType(types[i], declaringArkClass, visited);
                if (newType) {
                    types[i] = newType;
                }
            }
            type = leftOpType;
        } else if (leftOpType instanceof ArrayType) {
            let baseType = this.inferUnclearedType(leftOpType.getBaseType(), declaringArkClass, visited);
            if (baseType) {
                leftOpType.setBaseType(baseType);
                type = leftOpType;
            }
        } else if (leftOpType instanceof AliasType) {
            const defArkClass = declaringArkClass.getDeclaringArkFile().getScene().getMethod(
                leftOpType.getSignature().getDeclaringMethodSignature())?.getDeclaringArkClass();
            let baseType = this.inferUnclearedType(leftOpType.getOriginalType(), defArkClass ?? declaringArkClass, visited);
            if (baseType) {
                leftOpType.setOriginalType(baseType);
                type = leftOpType;
            }
        } else if (leftOpType instanceof KeyofTypeExpr) {
            let baseType = this.inferUnclearedType(leftOpType.getOpType(), declaringArkClass, visited);
            if (baseType) {
                leftOpType.setOpType(baseType);
                type = leftOpType;
            }
        }
        return type;
    }

    public static inferTypeInMethod(arkMethod: ArkMethod): void {
        const arkClass = arkMethod.getDeclaringArkClass();
        this.inferGenericType(arkMethod.getGenericTypes(), arkClass);
        const signatures: MethodSignature[] = [];
        arkMethod.getDeclareSignatures()?.forEach(m => signatures.push(m));
        const impl = arkMethod.getImplementationSignature();
        if (impl) {
            signatures.push(impl);
        }
        signatures.forEach(s => {
            s.getMethodSubSignature()
                .getParameters()
                .forEach(p => {
                    this.inferParameterType(p, arkMethod);
                });
        });
        const body = arkMethod.getBody();
        if (!body) {
            signatures.forEach(s => this.inferSignatureReturnType(s, arkMethod));
            return;
        }
        body.getUsedGlobals()?.forEach((value, key) => {
            if (value instanceof GlobalRef && !value.getRef()) {
                const arkExport = ModelUtils.findGlobalRef(key, arkMethod);
                if (arkExport instanceof Local) {
                    arkExport.getUsedStmts().push(...value.getUsedStmts());
                    value.setRef(arkExport);
                }
            }
        });
        const cfg = body.getCfg();
        for (const block of cfg.getBlocks()) {
            for (const stmt of block.getStmts()) {
                this.resolveStmt(stmt, arkMethod);
            }
        }
        signatures.forEach(s => this.inferSignatureReturnType(s, arkMethod));
    }

    private static resolveStmt(stmt: Stmt, arkMethod: ArkMethod): void {
        try {
            this.resolveTypeExprsInStmt(stmt, arkMethod);
            this.resolveExprsInStmt(stmt, arkMethod);
            this.resolveFieldRefsInStmt(stmt, arkMethod);
            this.resolveArkAssignStmt(stmt, arkMethod);
            this.resolveArkReturnStmt(stmt, arkMethod);
        } catch (e) {
            logger.warn('stmt is not correct: ' + stmt.toString());
        }
    }

    /**
     * @Deprecated
     * @param arkMethod
     */
    public static inferSimpleTypeInMethod(arkMethod: ArkMethod): void {
        const body = arkMethod.getBody();
        if (!body) {
            logger.warn('empty body');
            return;
        }
        const cfg = body.getCfg();
        if (!cfg) {
            logger.warn('empty cfg');
            return;
        }
        for (const block of cfg.getBlocks()) {
            for (const stmt of block.getStmts()) {
                TypeInference.inferSimpleTypeInStmt(stmt);
            }
        }
    }

    /**
     * infer type for Exprs in stmt which invoke method.
     * such as ArkInstanceInvokeExpr ArkStaticInvokeExpr ArkNewExpr
     */
    private static resolveExprsInStmt(stmt: Stmt, arkMethod: ArkMethod): void {
        for (const expr of stmt.getExprs()) {
            const newExpr = expr.inferType(arkMethod);
            if (
                stmt.containsInvokeExpr() &&
                ((expr instanceof ArkInstanceInvokeExpr && newExpr instanceof ArkStaticInvokeExpr) || newExpr instanceof ArkPtrInvokeExpr)
            ) {
                stmt.replaceUse(expr, newExpr);
            }
            // After infer the invoke method, it should replace the super.foo() to this.foo() while the foo is with super class as declaring class.
            if (newExpr instanceof ArkInstanceInvokeExpr && newExpr.getBase().getName() === SUPER_NAME) {
                const thisLocal = arkMethod.getBody()?.getLocals().get(THIS_NAME);
                if (thisLocal) {
                    newExpr.setBase(thisLocal);
                    thisLocal.addUsedStmt(stmt);
                }
            }
        }
        if (stmt instanceof ArkAliasTypeDefineStmt && this.isUnclearType(stmt.getAliasType().getOriginalType())) {
            stmt.getAliasType().setOriginalType(stmt.getAliasTypeExpr().getType());
        }
    }

    /**
     * infer value type for TypeExprs in stmt which specify the type such as TypeQueryExpr
     */
    private static resolveTypeExprsInStmt(stmt: Stmt, arkMethod: ArkMethod): void {
        for (let typeExpr of stmt.getTypeExprs()) {
            typeExpr.inferType(arkMethod);
        }
    }

    /**
     * infer type for fieldRefs in stmt.
     */
    private static resolveFieldRefsInStmt(stmt: Stmt, arkMethod: ArkMethod): void {
        for (const use of stmt.getUses()) {
            if (use instanceof AbstractRef) {
                this.processRef(use, stmt, arkMethod);
            }
        }
        const stmtDef = stmt.getDef();
        if (stmtDef && stmtDef instanceof AbstractRef) {
            if (
                arkMethod.getName() === INSTANCE_INIT_METHOD_NAME &&
                stmtDef instanceof ArkInstanceFieldRef &&
                stmtDef.getBase().getName() === THIS_NAME &&
                arkMethod.getDeclaringArkClass().isAnonymousClass() &&
                stmtDef.getFieldName().indexOf('.') === -1
            ) {
                return;
            }
            this.processRef(stmtDef, stmt, arkMethod, false);
        }
    }

    private static processRef(use: AbstractRef | ArkInstanceFieldRef, stmt: Stmt, arkMethod: ArkMethod, replaceUse: boolean = true): void {
        const fieldRef = use.inferType(arkMethod);
        if (fieldRef instanceof ArkStaticFieldRef && stmt instanceof ArkAssignStmt) {
            if (replaceUse) {
                stmt.replaceUse(use, fieldRef);
            } else {
                stmt.replaceDef(use, fieldRef);
            }
        } else if (use instanceof ArkInstanceFieldRef && fieldRef instanceof ArkArrayRef && stmt instanceof ArkAssignStmt) {
            const index = fieldRef.getIndex();
            if (index instanceof Constant && index.getType() instanceof StringType) {
                const local = this.getLocalFromMethodBody(index.getValue(), arkMethod);
                if (local) {
                    fieldRef.setIndex(local);
                }
            }
            if (replaceUse) {
                stmt.replaceUse(use, fieldRef);
            } else {
                stmt.replaceDef(use, fieldRef);
            }
        }
    }

    public static getLocalFromMethodBody(name: string, arkMethod: ArkMethod): Local | null {
        const local = arkMethod?.getBody()?.getLocals().get(name);
        if (local) {
            return local;
        }
        const globalRef = arkMethod?.getBody()?.getUsedGlobals()?.get(name);
        if (globalRef === undefined || !(globalRef instanceof GlobalRef)) {
            return null;
        }
        const ref = globalRef.getRef();
        if (ref !== null && ref instanceof Local) {
            return ref;
        }
        return null;
    }

    public static parseArkExport2Type(arkExport: ArkExport | undefined | null): Type | null {
        if (!arkExport) {
            return null;
        }
        if (arkExport instanceof ArkClass) {
            return new ClassType(arkExport.getSignature(), arkExport.getGenericsTypes());
        } else if (arkExport instanceof ArkNamespace) {
            return AnnotationNamespaceType.getInstance(arkExport.getSignature());
        } else if (arkExport instanceof ArkMethod) {
            return new FunctionType(arkExport.getSignature(), arkExport.getGenericTypes());
        } else if (arkExport instanceof Local) {
            if (arkExport.getType() instanceof UnknownType || arkExport.getType() instanceof UnclearReferenceType) {
                return null;
            }
            return arkExport.getType();
        } else if (arkExport instanceof AliasType) {
            return arkExport;
        } else {
            return null;
        }
    }

    /**
     * infer and pass type for ArkAssignStmt right and left
     * @param stmt
     * @param arkMethod
     */
    public static resolveArkAssignStmt(stmt: Stmt, arkMethod: ArkMethod): void {
        if (!(stmt instanceof ArkAssignStmt)) {
            return;
        }
        const arkClass = arkMethod.getDeclaringArkClass();
        const rightOp = stmt.getRightOp();
        if (rightOp instanceof Local && rightOp.getType() instanceof UnknownType) {
            IRInference.inferLocal(rightOp, arkMethod);
        }
        let rightType: Type | null | undefined = rightOp.getType();
        if (this.isUnclearType(rightType)) {
            rightType = this.inferUnclearedType(rightType, arkClass);
            if (rightType) {
                this.setValueType(rightOp, rightType);
            }
        }
        TypeInference.resolveLeftOp(stmt, arkClass, rightType, arkMethod);
    }

    private static resolveLeftOp(stmt: ArkAssignStmt, arkClass: ArkClass, rightType: Type | null | undefined, arkMethod: ArkMethod): void {
        let leftType = this.inferLeftOpType(stmt, arkClass, rightType, arkMethod);
        const leftOp = stmt.getLeftOp();
        if (leftType && !this.isUnclearType(leftType)) {
            this.setValueType(leftOp, leftType);
            if (leftOp instanceof Local && stmt.getOriginalText()?.startsWith(leftOp.getName())) {
                let localDef = ModelUtils.findDeclaredLocal(leftOp, arkMethod);
                if (localDef && this.isUnclearType(localDef.getType())) {
                    localDef.setType(leftType);
                }
            }
            if (rightType) {
                IRInference.inferRightWithSdkType(leftType, rightType, arkClass);
            }
            if (leftOp instanceof AbstractFieldRef) {
                const declaringSignature = leftOp.getFieldSignature().getDeclaringSignature();
                if (declaringSignature instanceof NamespaceSignature && declaringSignature.getNamespaceName() === GLOBAL_THIS_NAME) {
                    SdkUtils.computeGlobalThis(leftOp, arkMethod);
                }
            }
        }
    }

    private static inferLeftOpType(stmt: ArkAssignStmt, arkClass: ArkClass, rightType: Type | null | undefined, arkMethod: ArkMethod): Type | null {
        const leftOp = stmt.getLeftOp();
        let leftType: Type | null | undefined = leftOp.getType();
        if (this.isUnclearType(leftType)) {
            const newLeftType = this.inferUnclearedType(leftType, arkClass);
            if (!newLeftType && !this.isUnclearType(rightType)) {
                leftType = rightType;
            } else if (newLeftType) {
                leftType = newLeftType;
            }
        } else if (leftOp instanceof Local && leftOp.getName() === THIS_NAME) {
            const thisLocal = IRInference.inferThisLocal(arkMethod);
            if (thisLocal) {
                stmt.setLeftOp(thisLocal);
            } else {
                leftType = rightType;
            }
        } else if (leftType instanceof FunctionType && !this.isUnclearType(rightType) &&
            leftType.getMethodSignature().getMethodSubSignature().getMethodName().startsWith(ANONYMOUS_METHOD_PREFIX)) {
            leftType = rightType;
        }
        return leftType || null;
    }

    public static setValueType(value: Value, type: Type): void {
        if (value instanceof Local || value instanceof ArkParameterRef) {
            value.setType(type);
        } else if (value instanceof AbstractFieldRef) {
            value.getFieldSignature().setType(type);
        }
    }

    public static isUnclearType(type: Type | null | undefined): boolean {
        // TODO: For UnionType, IntersectionType and TupleType, it should recurse check every item of them.
        if (!type || type instanceof UnknownType || type instanceof UnclearReferenceType || type instanceof NullType ||
            type instanceof UndefinedType || type instanceof GenericType) {
            return true;
        } else if (
            type instanceof ClassType &&
            (unknownFileName.includes(type.getClassSignature().getDeclaringFileSignature().getFileName()) ||
                (type.getClassSignature().getClassName() === PROMISE && !type.getRealGenericTypes()))
        ) {
            return true;
        } else if (type instanceof UnionType || type instanceof IntersectionType || type instanceof TupleType) {
            return !!type.getTypes().find(t => this.checkType(t, e => e instanceof UnclearReferenceType || e instanceof GenericType));
        } else if (type instanceof ArrayType) {
            const baseType = type.getBaseType();
            return this.checkType(baseType, t => t instanceof UnclearReferenceType || baseType instanceof GenericType);
        } else if (type instanceof AliasType) {
            return this.isUnclearType(type.getOriginalType());
        } else if (type instanceof KeyofTypeExpr) {
            return this.isUnclearType(type.getOpType());
        } else if (type instanceof TypeQueryExpr) {
            return this.isUnclearType(type.getType()) ||
                !!type.getGenerateTypes()?.find(t => this.checkType(t, e => e instanceof UnclearReferenceType || e instanceof GenericType));
        }
        return false;
    }

    // This is the temporal function to check Type recursively and can be removed after typeInfer supports multiple candidate types.
    public static checkType(type: Type,
                            check: (t: Type) => boolean,
                            visited: Set<Type> = new Set()): boolean {
        if (visited.has(type)) {
            return false;
        } else {
            visited.add(type);
        }
        if (check(type)) {
            return true;
        } else if (type instanceof ClassType || type instanceof FunctionType) {
            return !!type.getRealGenericTypes()?.find(t => this.checkType(t, check, visited));
        } else if (type instanceof UnionType || type instanceof IntersectionType || type instanceof TupleType) {
            return !!type.getTypes().find(t => this.checkType(t, check, visited));
        } else if (type instanceof ArrayType) {
            return this.checkType(type.getBaseType(), check, visited);
        } else if (type instanceof AliasType) {
            return this.checkType(type.getOriginalType(), check, visited);
        } else if (type instanceof KeyofTypeExpr) {
            return this.checkType(type.getOpType(), check, visited);
        } else if (type instanceof TypeQueryExpr) {
            return this.checkType(type.getType(), check, visited);
        }
        return false;
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
            case BOOLEAN_KEYWORD:
                return BooleanType.getInstance();
            case NUMBER_KEYWORD:
                return NumberType.getInstance();
            case STRING_KEYWORD:
                return StringType.getInstance();
            case UNDEFINED_KEYWORD:
                return UndefinedType.getInstance();
            case NULL_KEYWORD:
                return NullType.getInstance();
            case ANY_KEYWORD:
                return AnyType.getInstance();
            case VOID_KEYWORD:
                return VoidType.getInstance();
            case NEVER_KEYWORD:
                return NeverType.getInstance();
            case BIGINT_KEYWORD:
                return BigIntType.getInstance();
            case 'RegularExpression': {
                const classSignature = Builtin.REGEXP_CLASS_SIGNATURE;
                return new ClassType(classSignature);
            }
            default:
                return new UnclearReferenceType(typeStr);
        }
    }

    public static inferValueType(value: Value, arkMethod: ArkMethod): Type | null {
        if (value instanceof ArkInstanceFieldRef || value instanceof ArkInstanceInvokeExpr) {
            this.inferValueType(value.getBase(), arkMethod);
        }
        if (value instanceof AbstractRef || value instanceof AbstractExpr || value instanceof Local) {
            value.inferType(arkMethod);
        }
        return value.getType();
    }

    public static inferParameterType(param: MethodParameter, arkMethod: ArkMethod): void {
        let pType = param.getType();
        const arkClass = arkMethod.getDeclaringArkClass();
        let type;
        if (pType instanceof AbstractTypeExpr) {
            pType.inferType(arkMethod);
        } else if (param.getName() === 'value' && arkClass.hasComponentDecorator() && arkMethod.getName() === CONSTRUCTOR_NAME) {
            type = this.parseArkExport2Type(arkClass);
        } else {
            type = TypeInference.inferUnclearedType(pType, arkClass);
        }
        if (type) {
            param.setType(type);
        }
    }

    public static inferSignatureReturnType(oldSignature: MethodSignature, arkMethod: ArkMethod): void {
        if (oldSignature.getMethodSubSignature().getMethodName() === CONSTRUCTOR_NAME) {
            const newReturnType = new ClassType(oldSignature.getDeclaringClassSignature());
            oldSignature.getMethodSubSignature().setReturnType(newReturnType);
            return;
        }
        const currReturnType = oldSignature.getType();
        if (!this.isUnclearType(currReturnType)) {
            return;
        }

        if (currReturnType instanceof AbstractTypeExpr) {
            currReturnType.inferType(arkMethod);
            return;
        }

        if (currReturnType instanceof ArrayType && currReturnType.getBaseType() instanceof AbstractTypeExpr) {
            (currReturnType.getBaseType() as AbstractTypeExpr).inferType(arkMethod);
            return;
        }

        const newReturnType = this.inferUnclearedType(currReturnType, arkMethod.getDeclaringArkClass());
        if (newReturnType) {
            oldSignature.getMethodSubSignature().setReturnType(newReturnType);
        }
    }

    public static inferReturnType(arkMethod: ArkMethod): Type | null {
        const typeMap: Map<string, Type> = new Map();
        for (let returnValue of arkMethod.getReturnValues()) {
            const type = returnValue.getType();
            if (type instanceof UnionType) {
                type.flatType()
                    .filter(t => !TypeInference.isUnclearType(t))
                    .forEach(t => typeMap.set(t.toString(), t));
            } else if (!TypeInference.isUnclearType(type)) {
                typeMap.set(type.toString(), type);
            }
        }
        if (typeMap.size > 0) {
            const types: Type[] = Array.from(typeMap.values());
            let returnType = types.length === 1 ? types[0] : new UnionType(types);
            if (arkMethod.containsModifier(ModifierType.ASYNC)) {
                const promise = arkMethod.getDeclaringArkFile().getScene().getSdkGlobal(PROMISE);
                if (promise instanceof ArkClass) {
                    returnType = new ClassType(promise.getSignature(), [returnType]);
                }
            }
            return returnType;
        }
        return null;
    }

    public static inferGenericType(types: GenericType[] | undefined, arkClass: ArkClass): void {
        types?.forEach(type => {
            const defaultType = type.getDefaultType();
            if (defaultType && this.isUnclearType(defaultType)) {
                const newDefaultType = TypeInference.inferUnclearedType(defaultType, arkClass);
                if (newDefaultType) {
                    type.setDefaultType(this.replaceTypeWithReal(newDefaultType));
                }
            }
            const constraint = type.getConstraint();
            if (constraint && this.isUnclearType(constraint)) {
                const newConstraint = TypeInference.inferUnclearedType(constraint, arkClass);
                if (newConstraint) {
                    type.setConstraint(this.replaceTypeWithReal(newConstraint));
                }
            }
        });
    }

    /**
     * Infer type for a given {@link UnclearReferenceType} type.
     * It returns original type.
     * The original type is null if it failed to infer the type.
     * @param urType
     * @param arkClass
     * @returns
     */
    public static inferUnclearRefType(urType: UnclearReferenceType, arkClass: ArkClass): Type | null {
        const realTypes = urType.getGenericTypes();
        this.inferRealGenericTypes(realTypes, arkClass);
        if (urType.getName() === Builtin.ARRAY && realTypes.length > 0) {
            return new ArrayType(realTypes[0], 1);
        }
        const type = this.inferUnclearRefName(urType.getName(), arkClass);
        return type ? this.replaceTypeWithReal(type, realTypes) : null;
    }

    /**
     * Find out the original object and type for a given unclear reference type name.
     * It returns original type.
     * The original type is null if it failed to infer the type.
     * @param refName
     * @param arkClass
     * @returns
     */
    public static inferUnclearRefName(refName: string, arkClass: ArkClass): Type | null {
        if (!refName) {
            return null;
        }
        //split and iterate to infer each type
        const singleNames = refName.split('.');
        let type = null;
        for (let i = 0; i < singleNames.length; i++) {
            let genericName: string = EMPTY_STRING;
            const name = singleNames[i].replace(/<(.+)>/, (match, group1) => {
                genericName = group1;
                return EMPTY_STRING;
            });
            if (i === 0) {
                type = singleNames.length > 1 ? this.inferBaseType(name, arkClass) : this.inferTypeByName(name, arkClass);
            } else if (type) {
                type = this.inferFieldType(type, name, arkClass)?.[1];
            }
            if (!type) {
                return null;
            }
            if (genericName) {
                const realTypes = genericName.split(',').map(generic => {
                    const realType = this.inferUnclearRefName(generic, arkClass);
                    return realType ?? new UnclearReferenceType(generic);
                });
                if (type instanceof ClassType) {
                    type = new ClassType(type.getClassSignature(), realTypes);
                } else if (type instanceof FunctionType) {
                    type = new FunctionType(type.getMethodSignature(), realTypes);
                }
            }
        }
        return type;
    }

    /**
     * Find out the original object and type for a given base type and the field name.
     * It returns an array with 2 items, original object and original type.
     * The original object is null if there is no object, or it failed to find the object.
     * The original type is null if it failed to infer the type.
     * @param baseType
     * @param fieldName
     * @param declareClass
     * @returns
     */
    public static inferFieldType(baseType: Type, fieldName: string, declareClass: ArkClass): [any, Type] | null {
        if (baseType instanceof AliasType) {
            baseType = baseType.getOriginalType();
        } else if (baseType instanceof UnionType && baseType.getCurrType()) {
            baseType = baseType.getCurrType();
        }
        let propertyAndType: [any, Type] | null = null;
        if (baseType instanceof ClassType) {
            if (
                fieldName === Builtin.ITERATOR_RESULT_VALUE &&
                baseType.getClassSignature().getDeclaringFileSignature().getProjectName() === Builtin.DUMMY_PROJECT_NAME
            ) {
                const types = baseType.getRealGenericTypes();
                if (types && types.length > 0) {
                    return [null, types[0]];
                }
                return null;
            }
            propertyAndType = this.inferClassFieldType(declareClass, baseType, fieldName);
        } else if (baseType instanceof ArrayType) {
            propertyAndType = this.inferArrayFieldType(declareClass, fieldName);
        } else if (baseType instanceof AnnotationNamespaceType) {
            const namespace = declareClass.getDeclaringArkFile().getScene().getNamespace(baseType.getNamespaceSignature());
            if (namespace) {
                const property = ModelUtils.findPropertyInNamespace(fieldName, namespace);
                const propertyType = this.parseArkExport2Type(property);
                if (propertyType) {
                    propertyAndType = [property, propertyType];
                }
            }
        } else {
            logger.warn('infer unclear reference type fail: ' + fieldName);
        }
        return propertyAndType;
    }

    private static inferClassFieldType(declareClass: ArkClass, baseType: ClassType, fieldName: string): [any, Type] | null {
        const arkClass = declareClass.getDeclaringArkFile().getScene().getClass(baseType.getClassSignature());
        if (!arkClass) {
            return null;
        }
        const property = ModelUtils.findPropertyInClass(fieldName, arkClass);
        let propertyType: Type | null = null;
        if (property instanceof ArkField) {
            if (arkClass.getCategory() === ClassCategory.ENUM) {
                propertyType = this.getEnumValueType(property);
            } else {
                this.repairFieldType(property, arkClass);
                propertyType = this.replaceTypeWithReal(property.getType(), baseType.getRealGenericTypes());
            }
        } else if (property) {
            propertyType = this.parseArkExport2Type(property);
        }
        if (propertyType) {
            return [property, propertyType];
        } else if (arkClass.isAnonymousClass()) {
            const fieldType = this.inferUnclearRefName(fieldName, arkClass);
            return fieldType ? [null, fieldType] : null;
        }
        return null;
    }

    private static repairFieldType(property: ArkField, arkClass: ArkClass): void {
        const propertyType = property.getType();
        if (TypeInference.isUnclearType(propertyType)) {
            const newType = TypeInference.inferUnclearedType(propertyType, arkClass);
            if (newType) {
                property.getSignature().setType(newType);
            }
        }
    }

    public static getEnumValueType(property: ArkField): EnumValueType | null {
        if (property.getCategory() !== FieldCategory.ENUM_MEMBER) {
            return null;
        }
        const type = property.getType();
        if (type instanceof EnumValueType) {
            return type;
        }
        const initStmts = property.getInitializer();
        const lastStmt = initStmts[initStmts.length - 1];
        let constant;
        if (lastStmt instanceof ArkAssignStmt) {
            const rightOp = lastStmt.getRightOp();
            constant = rightOp instanceof Constant ? rightOp : new Constant('unknown', rightOp.getType());
        }
        const enumValueType = new EnumValueType(property.getSignature(), constant);
        property.getSignature().setType(enumValueType);
        return enumValueType;
    }

    private static inferArrayFieldType(declareClass: ArkClass, fieldName: string): [ArkField, Type] | null {
        const arrayClass = declareClass.getDeclaringArkFile().getScene().getSdkGlobal(Builtin.ARRAY);
        if (arrayClass instanceof ArkClass) {
            const property = ModelUtils.findPropertyInClass(fieldName, arrayClass);
            if (property instanceof ArkField) {
                return [property, property.getType()];
            }
            return null;
        }
        return null;
    }

    /**
     * Find out the original object and type for a given base name.
     * It returns original type.
     * The original type is null if failed to infer the type.
     * @param baseName
     * @param arkClass
     * @returns
     */
    public static inferBaseType(baseName: string, arkClass: ArkClass): Type | null {
        if (SUPER_NAME === baseName) {
            return this.parseArkExport2Type(arkClass.getSuperClass());
        } else if (DEFAULT === baseName) {
            return this.parseArkExport2Type(arkClass.getDeclaringArkFile().getExportInfoBy(DEFAULT)?.getArkExport());
        }
        let arkExport: ArkExport | null =
            ModelUtils.findSymbolInFileWithName(baseName, arkClass) ??
            ModelUtils.getArkExportInImportInfoWithName(baseName, arkClass.getDeclaringArkFile());
        if (!arkExport && !arkClass.getDeclaringArkFile().getImportInfoBy(baseName)) {
            arkExport = arkClass.getDeclaringArkFile().getScene().getSdkGlobal(baseName);
        }
        return this.parseArkExport2Type(arkExport);
    }

    public static inferTypeByName(typeName: string, arkClass: ArkClass): Type | null {
        //look up from declared file, if not found then from imports
        const declaredArkFile = arkClass.getDeclaringArkFile();
        let arkExport: ArkExport | null =
            ModelUtils.findSymbolInFileWithName(typeName, arkClass, true) ??
            ModelUtils.getArkExportInImportInfoWithName(typeName, declaredArkFile);
        //if not found or local in built-in then look up global in sdks
        if ((!arkExport || (arkExport instanceof Local && declaredArkFile.getProjectName() === SdkUtils.BUILT_IN_NAME)) &&
            !declaredArkFile.getImportInfoBy(typeName)) {
            const globalVal = arkClass.getDeclaringArkFile().getScene().getSdkGlobal(typeName);
            if (globalVal) {
                arkExport = globalVal;
            }
        }
        const type = this.parseArkExport2Type(arkExport);
        if (type instanceof ClassType || type instanceof AliasType) {
            return type;
        }
        return arkClass.getGenericsTypes()?.find(g => g.getName() === typeName) || null;
    }

    public static getTypeByGlobalName(globalName: string, arkMethod: ArkMethod): Type | null {
        const arkExport: ArkExport | null = arkMethod.getDeclaringArkFile().getScene().getSdkGlobal(globalName);
        return this.parseArkExport2Type(arkExport);
    }

    public static inferRealGenericTypes(realTypes: Type[] | undefined, arkClass: ArkClass): void {
        if (!realTypes) {
            return;
        }
        for (let i = 0; i < realTypes.length; i++) {
            const mayType = realTypes[i];
            if (this.isUnclearType(mayType)) {
                const newType = this.inferUnclearedType(mayType, arkClass);
                if (newType) {
                    realTypes[i] = newType;
                }
            }
        }
    }

    public static inferDynamicImportType(from: string, arkClass: ArkClass): Type | null {
        const importInfo = new ImportInfo();
        importInfo.setNameBeforeAs(ALL);
        importInfo.setImportClauseName(ALL);
        importInfo.setImportFrom(from);
        importInfo.setDeclaringArkFile(arkClass.getDeclaringArkFile());
        return TypeInference.parseArkExport2Type(importInfo.getLazyExportInfo()?.getArkExport());
    }

    public static replaceTypeWithReal(type: Type, realTypes?: Type[], visited: Set<Type> = new Set()): Type {
        if (visited.has(type)) {
            return type;
        } else {
            visited.add(type);
        }
        if (type instanceof GenericType) {
            const realType = realTypes?.[type.getIndex()] ?? type.getDefaultType() ?? type.getConstraint();
            return realType ?? type;
        } else if (type instanceof AnyType) {
            const realType = realTypes?.[0];
            return realType ?? type;
        }
        return this.replaceRecursiveType(type, visited, realTypes);
    }

    public static replaceRecursiveType(type: Type, visited: Set<Type>, realTypes?: Type[]): Type {
        if (type instanceof ClassType) {
            const replacedTypes = type.getRealGenericTypes()?.map(g => this.replaceTypeWithReal(g, realTypes, visited)) ?? realTypes;
            return replacedTypes && replacedTypes.length > 0 ? new ClassType(type.getClassSignature(), replacedTypes) : type;
        } else if (type instanceof FunctionType) {
            const replacedTypes = type.getRealGenericTypes()?.map(g => this.replaceTypeWithReal(g, realTypes, visited)) ?? realTypes;
            return replacedTypes && replacedTypes.length > 0 ? new FunctionType(type.getMethodSignature(), replacedTypes) : type;
        } else if (type instanceof AliasType && realTypes) {
            const newObjectType = this.replaceTypeWithReal(type.getOriginalType(), realTypes, visited);
            const replacedTypes = type.getRealGenericTypes()?.map(g => this.replaceTypeWithReal(g, realTypes, visited)) ?? realTypes;
            if (replacedTypes.length > 0) {
                const newAliasType = new AliasType(type.getName(), newObjectType, type.getSignature(), type.getGenericTypes());
                newAliasType.setRealGenericTypes(replacedTypes);
                return newAliasType;
            }
        } else if (type instanceof UnionType && realTypes) {
            const types: Type[] = [];
            type.flatType().forEach(t => types.push(this.replaceTypeWithReal(t, realTypes, visited)));
            return new UnionType(types, this.replaceTypeWithReal(type.getCurrType(), realTypes, visited));
        } else if (type instanceof IntersectionType && realTypes) {
            const types: Type[] = [];
            type.getTypes().forEach(t => types.push(this.replaceTypeWithReal(t, realTypes, visited)));
            return new IntersectionType(types);
        } else if (type instanceof ArrayType && realTypes) {
            const replacedBaseType = this.replaceTypeWithReal(type.getBaseType(), realTypes, visited);
            return new ArrayType(replacedBaseType, type.getDimension());
        } else if (type instanceof TupleType && realTypes) {
            let replacedTypes: Type[] = [];
            type.getTypes().forEach(t => replacedTypes.push(this.replaceTypeWithReal(t, realTypes, visited)));
            return new TupleType(replacedTypes);
        }
        return type;
    }

    public static replaceAliasType(type: Type): Type {
        let aliasType = type;
        while (aliasType instanceof AliasType) {
            aliasType = aliasType.getOriginalType();
        }
        return aliasType;
    }

    public static inferFunctionType(argType: FunctionType, paramSubSignature: MethodSubSignature | undefined, realTypes: Type[] | undefined): void {
        const returnType = argType.getMethodSignature().getMethodSubSignature().getReturnType();
        const declareType = paramSubSignature?.getReturnType();
        if (this.isUnclearType(returnType) && declareType && !this.isUnclearType(declareType)) {
            argType.getMethodSignature().getMethodSubSignature().setReturnType(declareType);
        }
        const params = paramSubSignature?.getParameters();
        if (!params) {
            return;
        }
        argType
            .getMethodSignature()
            .getMethodSubSignature()
            .getParameters()
            .filter(p => !p.getName().startsWith(LEXICAL_ENV_NAME_PREFIX))
            .forEach((p, i) => {
                if (this.isUnclearType(p.getType())) {
                    let type = params?.[i]?.getType();
                    if (type instanceof GenericType && realTypes) {
                        type = realTypes?.[type.getIndex()];
                    }
                    if (type) {
                        p.setType(type);
                    }
                }
            });
    }

    private static resolveArkReturnStmt(stmt: Stmt, arkMethod: ArkMethod): void {
        if (!(stmt instanceof ArkReturnStmt)) {
            return;
        }
        this.inferValueType(stmt.getOp(), arkMethod);
        let returnType: Type | undefined = arkMethod.getSignature().getType();
        if (returnType instanceof ClassType && returnType.getClassSignature().getClassName() === PROMISE) {
            returnType = returnType.getRealGenericTypes()?.[0];
        }
        if (returnType) {
            IRInference.inferRightWithSdkType(returnType, stmt.getOp().getType(), arkMethod.getDeclaringArkClass());
        }
    }


    public static isAnonType(argType: Type, projectName: string): boolean {
        const isAnonClassType = argType instanceof ClassType &&
            argType.getClassSignature().getClassName().startsWith(ANONYMOUS_CLASS_PREFIX) &&
            argType.getClassSignature().getDeclaringFileSignature().getProjectName() === projectName;
        if (isAnonClassType) {
            return true;
        }
        return argType instanceof FunctionType &&
            argType.getMethodSignature().getMethodSubSignature().getMethodName().startsWith(ANONYMOUS_METHOD_PREFIX) &&
            argType.getMethodSignature().getDeclaringClassSignature().getDeclaringFileSignature().getProjectName() === projectName;
    }

    public static isDummyClassType(rightType: Type): boolean {
        return rightType instanceof ClassType &&
            rightType.getClassSignature().getDeclaringFileSignature().getFileName() === Builtin.DUMMY_FILE_NAME &&
            !!rightType.getRealGenericTypes()?.find(t => !(t instanceof GenericType));
    }


    public static isTypeCanBeOverride(type: Type): boolean {
        if (type instanceof UnknownType || type instanceof NullType || type instanceof UndefinedType ||
            type instanceof UnclearReferenceType || type instanceof GenericType) {
            return true;
        } else if (type instanceof ClassType) {
            return !!type.getRealGenericTypes()?.find(r => this.isTypeCanBeOverride(r));
        } else if (type instanceof AliasType) {
            return this.isTypeCanBeOverride(type.getOriginalType()) || !!type.getRealGenericTypes()?.find(r => this.isTypeCanBeOverride(r));
        } else if (type instanceof ArrayType) {
            return TypeInference.checkType(type.getBaseType(), t => t instanceof UnclearReferenceType || t instanceof GenericType);
        }
        return false;
    }

    public static union(type1: Type, type2: Type): Type {
        const leftType = TypeInference.replaceAliasType(type1);
        const rightType = TypeInference.replaceAliasType(type2);
        if (this.isSameType(leftType, rightType) || TypeInference.checkType(rightType, t => t instanceof AnyType ||
            (rightType instanceof ClassType && rightType.getClassSignature().getClassName().startsWith(ANONYMOUS_CLASS_PREFIX)))) {
            return type1;
        } else if (leftType instanceof FunctionType) {
            return type1;
        } else if (leftType instanceof UnionType) {
            const isExist = leftType.getTypes().find(t => this.isSameType(t, rightType));
            if (!isExist) {
                leftType.getTypes().push(type2);
            }
            return type1;
        } else if (leftType instanceof IntersectionType) {
            const isExist = leftType.getTypes().find(t => !this.isSameType(t, rightType));
            if (!isExist) {
                return type1;
            }
        }
        return new UnionType([type1, type2]);
    }

    public static isSameType(type1: Type, type2: Type): boolean {
        if (type1 instanceof ClassType && type2 instanceof ClassType) {
            return type1.getClassSignature() === type2.getClassSignature();
        } else if (type1 instanceof LiteralType) {
            return typeof type1.getLiteralName() === type2.toString();
        } else if (type1 instanceof KeyofTypeExpr) {
            return type2 instanceof KeyofTypeExpr || type2 instanceof StringType;
        } else if (type1 instanceof TupleType) {
            return type2 instanceof TupleType || type2 instanceof ArrayType;
        }
        return type1.constructor === type2.constructor;
    }
}
