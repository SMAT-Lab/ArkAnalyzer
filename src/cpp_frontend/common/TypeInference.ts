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
import { AbstractExpr, ArkInstanceInvokeExpr, ArkPtrInvokeExpr, ArkStaticInvokeExpr } from '../../core/base/Expr';
import { Local } from '../../core/base/Local';
import { AbstractFieldRef, AbstractRef, ArkArrayRef, ArkInstanceFieldRef, ArkParameterRef, ArkStaticFieldRef, GlobalRef } from '../../core/base/Ref';
import { ArkAliasTypeDefineStmt, ArkAssignStmt, ArkInvokeStmt, ArkReturnStmt, Stmt } from '../../core/base/Stmt';
import {
    AliasType,
    AnnotationNamespaceType,
    AnyType,
    ArrayType,
    BooleanType,
    ClassType,
    CXXNumberType,
    CXXStringType,
    EnumValueType,
    FunctionType,
    GenericType,
    IntersectionType,
    NeverType,
    NullType,
    PointerType,
    ReferenceType,
    StringType,
    TupleType,
    Type,
    UnclearReferenceType,
    UndefinedType,
    UnionType,
    UnknownType,
    VoidType,
} from '../../core/base/Type';
import { ArkMethod } from '../../core/model/ArkMethod';
import { ArkExport } from '../../core/model/ArkExport';
import { ArkClass, ClassCategory } from '../../core/model/ArkClass';
import { ArkField } from '../../core/model/ArkField';
import { Value } from '../../core/base/Value';
import { Constant } from '../../core/base/Constant';
import { ArkNamespace } from '../../core/model/ArkNamespace';
import { ALL, CONSTRUCTOR_NAME, DEFAULT, GLOBAL_THIS_NAME, PROMISE, SUPER_NAME, THIS_NAME } from '../../core/common/TSConst';
import { ModelUtils } from '../../core/common/ModelUtils';
import { Builtin } from '../../core/common/Builtin';
import { MethodSignature, MethodSubSignature, NamespaceSignature } from '../../core/model/ArkSignature';
import { INSTANCE_INIT_METHOD_NAME, LEXICAL_ENV_NAME_PREFIX, UNKNOWN_FILE_NAME } from '../../core/common/Const';
import { EMPTY_STRING } from '../../core/common/ValueUtil';
import { ImportInfo } from '../../core/model/ArkImport';
import { MethodParameter } from '../../core/model/builder/ArkMethodBuilder';
import { IRInference } from './IRInference';
import { AbstractTypeExpr, KeyofTypeExpr, TypeQueryExpr } from '../../core/base/TypeExpr';
import { SdkUtils } from '../../core/common/SdkUtils';
import { ModifierType } from '../../core/model/ArkBaseModel';
import { BuiltinCxx } from './Builtin';
import { setTs2CxxFuncMapOfClass } from './ModelUtils';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'TypeInference');

export class TypeInference {
    public static inferTypeInArkField(arkField: ArkField): void {
        const arkClass = arkField.getDeclaringArkClass();
        const stmts = arkField.getInitializer();
        const method = arkClass.getMethodWithName(INSTANCE_INIT_METHOD_NAME) ?? arkClass.getMethodWithName(CONSTRUCTOR_NAME);
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
        if (leftOpType instanceof ClassType && leftOpType.getClassSignature().getDeclaringFileSignature().getFileName() === UNKNOWN_FILE_NAME) {
            type = TypeInference.inferUnclearRefName(leftOpType.getClassSignature().getClassName(), declaringArkClass);
        } else if (leftOpType instanceof UnionType || leftOpType instanceof IntersectionType || leftOpType instanceof TupleType) {
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
            let baseType = this.inferUnclearedType(leftOpType.getOriginalType(), declaringArkClass, visited);
            if (baseType) {
                leftOpType.setOriginalType(baseType);
                type = leftOpType;
            }
        } else if (leftOpType instanceof AnnotationNamespaceType) {
            type = this.inferBaseType(leftOpType.getOriginType(), declaringArkClass);
        } else if (leftOpType instanceof UnclearReferenceType) {
            type = this.inferUnclearRefType(leftOpType, declaringArkClass);
        }
        return type;
    }
    /**
     * Type information in inference method
     * @param arkMethod Ark method object for type inference
     */
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
            this.inferSignatureReturnType(s, arkMethod);
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

    /**
     * Parse statement and process various references and expressions within it
     * @param stmt Statement object to be parsed
     * @param arkMethod Current Ark method context
     */
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
                (stmt.containsInvokeExpr() &&
                    ((expr instanceof ArkInstanceInvokeExpr && newExpr instanceof ArkStaticInvokeExpr) || newExpr instanceof ArkPtrInvokeExpr)) ||
                (newExpr instanceof ArkInstanceInvokeExpr && BuiltinCxx.isBuiltinClass(newExpr.getMethodSignature().getDeclaringClassSignature()))
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
        // 处理ts2cxxFuncMap
        if (stmt instanceof ArkInvokeStmt) {
            const invokeExpr = stmt.getInvokeExpr();
            if (!(invokeExpr instanceof ArkInstanceInvokeExpr)) {
                return;
            }
            const instInvokeExpr = invokeExpr as ArkInstanceInvokeExpr;
            const invokeBaseType = instInvokeExpr.getBase().getType();
            if (invokeBaseType instanceof ClassType && invokeBaseType.getClassSignature().getClassName() === 'napi_property_descriptor') {
                setTs2CxxFuncMapOfClass(instInvokeExpr.getArgs(), false, stmt.getCfg().getDeclaringMethod());
            }
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
            const fieldRef = stmtDef.inferType(arkMethod);
            stmt.replaceDef(stmtDef, fieldRef);
        }
    }

    /**
     *Process field references, perform corresponding conversion processing according to the reference type and statement type,
     * process static field references, process instance field references and field references as array references,
     * and try to replace them with local variables when the index is a string constant
     *@ param use - abstract reference object, which may be a static field reference or an instance field reference
     *@ param stmt - statement object, used to replace references
     *@ param arkMethod - Ark method object, used to obtain method body information
     */
    private static processRef(use: AbstractRef | ArkInstanceFieldRef, stmt: Stmt, arkMethod: ArkMethod): void {
        const fieldRef = use.inferType(arkMethod);
        if (fieldRef instanceof ArkStaticFieldRef && stmt instanceof ArkAssignStmt) {
            stmt.replaceUse(use, fieldRef);
        } else if (use instanceof ArkInstanceFieldRef && fieldRef instanceof ArkArrayRef && stmt instanceof ArkAssignStmt) {
            const index = fieldRef.getIndex();
            if (index instanceof Constant && index.getType() instanceof StringType) {
                const local = arkMethod?.getBody()?.getLocals().get(index.getValue());
                if (local) {
                    fieldRef.setIndex(local);
                }
            }
            stmt.replaceUse(use, fieldRef);
        }
    }

    /**
     * Parse ArkExport object into corresponding Type
     * @param arkExport - The ArkExport object to parse, may be undefined or null
     * @returns The parsed Type object, or null if it cannot be parsed
     */
    public static parseArkExport2Type(arkExport: ArkExport | undefined | null): Type | null {
        if (!arkExport) {
            return null;
        }
        if (arkExport instanceof ArkClass) {
            return new ClassType(arkExport.getSignature(), arkExport.getGenericsTypes());
        } else if (arkExport instanceof ArkNamespace) {
            return AnnotationNamespaceType.getInstance(arkExport.getSignature());
        } else if (arkExport instanceof ArkMethod) {
            return new FunctionType(arkExport.getSignature());
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
        let baseType: Type | null | undefined;
        if (rightType instanceof PointerType || rightType instanceof ReferenceType) {
            baseType = rightType.getBaseType();
            if (this.isUnclearType(baseType)) {
                baseType = this.inferUnclearedType(baseType, arkClass);
                if (baseType) {
                    rightType.setBaseType(baseType);
                }
            }
        }
        if (this.isUnclearType(rightType)) {
            rightType = this.inferUnclearedType(rightType, arkClass);
            if (rightType) {
                this.setValueType(rightOp, rightType);
            }
        }
        TypeInference.resolveLeftOp(stmt, arkClass, rightType, arkMethod);
    }

    /**
     * Resolve type inference and setting for the left operand of an assignment statement
     *
     * @param stmt Assignment statement node
     * @param arkClass The current Ark class
     * @param rightType Type of the right-hand expression in the assignment
     * @param arkMethod The current Ark method
     */
    private static resolveLeftOp(stmt: ArkAssignStmt, arkClass: ArkClass, rightType: Type | null | undefined, arkMethod: ArkMethod): void {
        const leftOp = stmt.getLeftOp();
        let leftType = this.inferAssignLeftType(arkClass, rightType, leftOp, arkMethod, stmt);
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

    /**
     * Infer the type of the left operand in an assignment statement
     *
     * @param arkClass Current class object
     * @param rightType The type on the right side of the assignment statement
     * @param leftOp The operand on the left side of the assignment
     * @param arkMethod Current method object
     * @param stmt Assignment statement object
     * @returns The inferred left type, or null/undefined if it cannot be inferred
     */
    private static inferAssignLeftType(arkClass: ArkClass, rightType: Type | null | undefined, leftOp: Value | Local,
        arkMethod: ArkMethod, stmt: ArkAssignStmt): Type | null | undefined {
        let leftType: Type | null | undefined = leftOp.getType();
        let baseType: Type | null | undefined;
        if (leftType instanceof PointerType || leftType instanceof ReferenceType) {
            baseType = leftType.getBaseType();
            if (this.isUnclearType(baseType)) {
                baseType = this.inferUnclearedType(baseType, arkClass);
                if (!baseType && !this.isUnclearType(rightType)) {
                    leftType = rightType;
                } else if (baseType) {
                    leftType.setBaseType(baseType);
                }
            }
        } else if (this.isUnclearType(leftType)) {
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
        }
        return leftType;
    }

    /**
     * Set the type of value
     *
     * @param value The value object whose type needs to be set
     * @param type The type to be set
     */
    private static setValueType(value: Value, type: Type): void {
        if (value instanceof Local || value instanceof ArkParameterRef) {
            value.setType(type);
        } else if (value instanceof AbstractFieldRef) {
            value.getFieldSignature().setType(type);
        }
    }

    /**
     * Determine if the given type is an unclear type
     * @param type The type to check, which can be null or undefined
     * @returns true if the type is unclear, otherwise false
     */
    public static isUnclearType(type: Type | null | undefined): boolean {
        // TODO: For UnionType, IntersectionType and TupleType, it should recurse check every item of them.
        if (
            !type ||
            type instanceof UnknownType ||
            type instanceof UnclearReferenceType ||
            type instanceof NullType ||
            type instanceof UndefinedType ||
            type instanceof GenericType
        ) {
            return true;
        } else if (
            type instanceof ClassType &&
            (type.getClassSignature().getDeclaringFileSignature().getFileName() === UNKNOWN_FILE_NAME ||
                (type.getClassSignature().getClassName() === PROMISE && !type.getRealGenericTypes()) ||
                (type.getClassSignature().getDeclaringFileSignature().getFileName() === Builtin.DUMMY_FILE_NAME &&
                    type.getRealGenericTypes()?.find(t => t instanceof GenericType)))
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
            return this.isUnclearType(type.getType());
        }
        return false;
    }

    /**
     * This is the temporal function to check Type recursively and can be removed after typeInfer supports multiple candidate types.
     * @param type The type to check
     * @param check Condition checking function that takes a type parameter and returns a boolean
     * @param visited Set of visited types to prevent infinite recursion from circular references, defaults to empty set
     * @returns true if the type meets the condition, otherwise false
     */
    public static checkType(type: Type, check: (t: Type) => boolean, visited: Set<Type> = new Set()): boolean {
        if (visited.has(type)) {
            return false;
        } else {
            visited.add(type);
        }
        if (check(type)) {
            return true;
        } else if (type instanceof ClassType) {
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

    /**
     * Infer simple types in a statement
     * @param stmt The statement to perform type inference on
     */
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

    /**
     * Build corresponding Type object based on TypeScript type string
     * Deal only with simple situations
     * @param tsTypeStr TypeScript type string used to identify basic types
     * @param cxxTypeStr Optional C++ type string used for detailed type information of number and string types
     * @returns Returns the Type instance corresponding to the input string
     */
    public static buildTypeFromStr(tsTypeStr: string, cxxTypeStr?: string): Type {
        switch (tsTypeStr) {
            case 'boolean':
                return BooleanType.getInstance();
            case 'number':
                return CXXNumberType.getInstance(cxxTypeStr);
            case 'string':
                return CXXStringType.getInstance(cxxTypeStr);
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
            case 'RegularExpression': {
                const classSignature = Builtin.REGEXP_CLASS_SIGNATURE;
                return new ClassType(classSignature);
            }
            default:
                return new UnclearReferenceType(tsTypeStr);
        }
    }

    /**
     * Infer the type of value
     * @param value The value whose type needs to be inferred
     * @param arkMethod The current method context
     * @returns The inferred type, or null if it cannot be inferred
     */
    public static inferValueType(value: Value, arkMethod: ArkMethod): Type | null {
        if (value instanceof ArkInstanceFieldRef || value instanceof ArkInstanceInvokeExpr) {
            this.inferValueType(value.getBase(), arkMethod);
        }
        if (value instanceof AbstractRef || value instanceof AbstractExpr || value instanceof Local) {
            value.inferType(arkMethod);
        }
        return value.getType();
    }

    /**
     * Infer the type of method parameters and update the parameter's type information.
     *
     * @param param - The parameter object whose type needs to be inferred
     * @param arkMethod - The method object that the parameter belongs to
     */
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

    /**
     * Infer the return type of method signature and update the return type information in the signature.
     *
     * @param oldSignature - The method signature object whose return type needs to be inferred
     * @param arkMethod - The method object that corresponds to the signature
     */
    public static inferSignatureReturnType(oldSignature: MethodSignature, arkMethod: ArkMethod): void {
        if (oldSignature.getMethodSubSignature().getMethodName() === CONSTRUCTOR_NAME) {
            const newReturnType = new ClassType(oldSignature.getDeclaringClassSignature());
            oldSignature.getMethodSubSignature().setReturnType(newReturnType);
            return;
        }
        const currReturnType = oldSignature.getType();
        let retTypeWithoutPtrOrRef = currReturnType;
        if (retTypeWithoutPtrOrRef instanceof PointerType || retTypeWithoutPtrOrRef instanceof ReferenceType) {
            retTypeWithoutPtrOrRef = retTypeWithoutPtrOrRef.getBaseType();
        }
        if (!this.isUnclearType(retTypeWithoutPtrOrRef)) {
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

        let newReturnType = this.inferUnclearedType(retTypeWithoutPtrOrRef, arkMethod.getDeclaringArkClass());
        if (newReturnType && (currReturnType instanceof PointerType || currReturnType instanceof ReferenceType)) {
            currReturnType.setBaseType(newReturnType);
            newReturnType = currReturnType;
        }
        if (newReturnType) {
            oldSignature.getMethodSubSignature().setReturnType(newReturnType);
        } else if (arkMethod.getBody()) {
            const returnType = TypeInference.inferReturnType(arkMethod);
            if (returnType) {
                oldSignature.getMethodSubSignature().setReturnType(returnType);
            }
        }
    }

    /**
     * Infer the return type of method and update the return type information in the method.
     *
     * @param arkMethod - The method object whose return type needs to be inferred
     */
    private static inferReturnType(arkMethod: ArkMethod): Type | null {
        const typeMap: Map<string, Type> = new Map();
        for (let returnValue of arkMethod.getReturnValues()) {
            const type = returnValue.getType();
            if (type instanceof UnionType) {
                type.flatType()
                    .filter(t => !TypeInference.isUnclearType(t))
                    .forEach(t => typeMap.set(t.toString(), t));
            } else if (type instanceof PointerType || type instanceof ReferenceType) {
                if (!TypeInference.isUnclearType(type.getBaseType())) {
                    typeMap.set(type.toString(), type);
                }
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

    /**
     * Infer the type of generic type and update the generic type information.
     *
     * @param types - The generic type array that needs to be inferred
     * @param arkClass - The class object that the generic type belongs to
     */
    public static inferGenericType(types: GenericType[] | undefined, arkClass: ArkClass): void {
        types?.forEach(type => {
            const defaultType = type.getDefaultType();
            if (defaultType instanceof UnclearReferenceType) {
                const newDefaultType = TypeInference.inferUnclearRefName(defaultType.getName(), arkClass);
                if (newDefaultType) {
                    type.setDefaultType(this.replaceTypeWithReal(newDefaultType));
                }
            }
            const constraint = type.getConstraint();
            if (constraint instanceof UnclearReferenceType) {
                const newConstraint = TypeInference.inferUnclearRefName(constraint.getName(), arkClass);
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
        if (urType.getName() === Builtin.ARRAY) {
            return new ArrayType(realTypes[0] ?? AnyType.getInstance(), 1);
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
            const name = singleNames[i].replace(/<(\w+)>/, (match, group1) => {
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
     *Inferred field type
     *@ param baseType Base Type
     *@ param fieldName
     *@ param declareClass Declare the class
     *@ returns a tuple of attributes and types. If the inference fails, null is returned
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

    /**
     *Infer type information of class fields
     *@ param declareClass Declare the class object
     *@ param baseType Basic class type
     *@ param fieldName
     *@ returns a tuple containing property and type information. If it cannot be inferred, it returns null
     */
    private static inferClassFieldType(declareClass: ArkClass, baseType: ClassType, fieldName: string): [any, Type] | null {
        const arkClass = declareClass.getDeclaringArkFile().getScene().getClass(baseType.getClassSignature());
        if (!arkClass) {
            return null;
        }
        const property = ModelUtils.findPropertyInClass(fieldName, arkClass);
        let propertyType: Type | null = null;
        if (property instanceof ArkField) {
            if (arkClass.getCategory() === ClassCategory.ENUM) {
                let constant;
                const propertyInitializer = property.getInitializer();
                const lastStmt = propertyInitializer[propertyInitializer.length - 1];
                if (lastStmt instanceof ArkAssignStmt && lastStmt.getRightOp() instanceof Constant) {
                    constant = lastStmt.getRightOp() as Constant;
                }
                propertyType = new EnumValueType(property.getSignature(), constant);
            } else {
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

    /**
     *Infer Base Type
     *@ param baseName
     *@ param arkClass Ark class object
     *@ returns the inferred type. If it cannot be inferred, it returns null
     */
    public static inferBaseType(baseName: string, arkClass: ArkClass): Type | null {
        if (SUPER_NAME === baseName) {
            return this.parseArkExport2Type(arkClass.getSuperClass());
        } else if (DEFAULT === baseName) {
            return this.parseArkExport2Type(arkClass.getDeclaringArkFile().getExportInfoBy(DEFAULT)?.getArkExport());
        }
        const field = ModelUtils.getDefaultClass(arkClass)?.getDefaultArkMethod()?.getBody()?.getLocals()?.get(baseName);
        if (field && !this.isUnclearType(field.getType())) {
            return field.getType();
        }
        let arkExport: ArkExport | null =
            ModelUtils.getClassWithName(baseName, arkClass) ??
            ModelUtils.getDefaultClass(arkClass)?.getDefaultArkMethod()?.getBody()?.getAliasTypeByName(baseName) ??
            ModelUtils.getNamespaceWithName(baseName, arkClass) ??
            ModelUtils.getDefaultClass(arkClass)?.getMethodWithName(baseName) ??
            ModelUtils.getArkExportInImportInfoWithName(baseName, arkClass.getDeclaringArkFile());
        if (!arkExport && !arkClass.getDeclaringArkFile().getImportInfoBy(baseName)) {
            arkExport = arkClass.getDeclaringArkFile().getScene().getSdkGlobal(baseName);
        }
        return this.parseArkExport2Type(arkExport);
    }

    /**
     *Infer type information based on type name
     *@ param typeName - the type name to infer
     *@ param arkClass - the current Ark class object
     *@ returns The type object inferred. If it cannot be inferred, null is returned
     */
    public static inferTypeByName(typeName: string, arkClass: ArkClass): Type | null {
        let arkExport: ArkExport | null =
            ModelUtils.getClassWithName(typeName, arkClass) ??
            ModelUtils.getDefaultClass(arkClass)?.getDefaultArkMethod()?.getBody()?.getLocals()?.get(typeName) ??
            ModelUtils.getDefaultClass(arkClass)?.getDefaultArkMethod()?.getBody()?.getAliasTypeByName(typeName) ??
            ModelUtils.getArkExportInImportInfoWithName(typeName, arkClass.getDeclaringArkFile());
        if (!arkExport && !arkClass.getDeclaringArkFile().getImportInfoBy(typeName)) {
            arkExport = arkClass.getDeclaringArkFile().getScene().getSdkGlobal(typeName);
        }
        const type = this.parseArkExport2Type(arkExport);
        if (type instanceof ClassType || type instanceof AliasType) {
            return type;
        }
        return null;
    }

    /**
     *Get the corresponding type information according to the global name
     *@ param globalName - global name string
     *@ param arkMethod - Ark method object, used to obtain declaration file and scene information
     *@ returns the type object parsed. If it is not found, it returns null
     */
    public static getTypeByGlobalName(globalName: string, arkMethod: ArkMethod): Type | null {
        const arkExport: ArkExport | null = arkMethod.getDeclaringArkFile().getScene().getSdkGlobal(globalName);
        return this.parseArkExport2Type(arkExport);
    }

    /**
     * Infer real generic types
     *
     * This function iterates through the passed type array, infers unclear types,
     * and replaces the unclear types in the original array with the inferred concrete types.
     *
     * @param realTypes - Type array that may contain unclear types, returns directly if undefined
     * @param arkClass - ArkClass object used for type inference
     */
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

    /**
     *Infer type information of dynamic import
     *@ param from - import source path
     *@ param arkClass - Ark class information
     *@ returns The type information obtained by parsing. If it cannot be parsed, null is returned
     */
    public static inferDynamicImportType(from: string, arkClass: ArkClass): Type | null {
        const importInfo = new ImportInfo();
        importInfo.setNameBeforeAs(ALL);
        importInfo.setImportClauseName(ALL);
        importInfo.setImportFrom(from);
        importInfo.setDeclaringArkFile(arkClass.getDeclaringArkFile());
        return TypeInference.parseArkExport2Type(importInfo.getLazyExportInfo()?.getArkExport());
    }

    /**
     *Replace generic parameters in type with actual types
     *@ param type - the original type to be replaced
     *@ param realTypes - array of actual types, used to replace generic parameters
     *@ param visited - the accessed type collection, used to prevent circular references
     *@ returns The actual type after replacement
     */
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

    /**
     * Recursively replace generic parameters in types with actual types.
     *
     * @param type The original type to process
     * @param visited Set of visited types to prevent infinite recursion
     * @param realTypes List of actual types used to replace generic parameters
     * @returns The replaced type
     */
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

    /**
     * Replace alias types with their original types
     *
     * This function recursively resolves alias types by following the chain of type aliases
     * until it reaches the original underlying type. If the input type is an alias type,
     * it will trace through to the non-alias type.
     *
     * @param type - The type to be replaced, which may be an alias type
     * @returns Returns the resolved original type; if the input is not an alias type, it returns the original type directly
     */
    public static replaceAliasType(type: Type): Type {
        let aliasType = type;
        while (aliasType instanceof AliasType) {
            aliasType = aliasType.getOriginalType();
        }
        return aliasType;
    }

    /**
     * Infer function type for generic type inference
     * @param argType Function argument type
     * @param paramSubSignature Parameter sub-signature
     * @param realTypes Array of real types
     */
    public static inferFunctionType(argType: FunctionType, paramSubSignature: MethodSubSignature | undefined, realTypes: Type[] | undefined): void {
        const returnType = argType.getMethodSignature().getMethodSubSignature().getReturnType();
        const declareType = paramSubSignature?.getReturnType();
        if (
            declareType instanceof GenericType &&
            realTypes &&
            !realTypes[declareType.getIndex()] &&
            !this.isUnclearType(returnType) &&
            !(returnType instanceof VoidType)
        ) {
            realTypes[declareType.getIndex()] = returnType;
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

    /**
     * Resolve Ark return statement, perform type inference processing
     * @param stmt The statement object that needs to be parsed
     * @param arkMethod The current Ark method
     */
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
}
