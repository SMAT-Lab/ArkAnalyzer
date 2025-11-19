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


import { Stmt } from '../base/Stmt';
import { Value } from '../base/Value';
import { Inference, InferenceFlow } from './Inference';
import { ArkArrayRef, ArkInstanceFieldRef, ArkParameterRef, ArkStaticFieldRef, ClosureFieldRef } from '../base/Ref';
import {
    AliasType,
    AnnotationNamespaceType,
    AnyType,
    ArrayType,
    BooleanType,
    ClassType,
    FunctionType,
    GenericType,
    LexicalEnvType,
    NullType,
    NumberType,
    StringType,
    Type,
    UndefinedType,
    UnionType
} from '../base/Type';
import { TypeInference } from '../common/TypeInference';
import { IRInference } from '../common/IRInference';
import { ArkMethod } from '../model/ArkMethod';
import { EMPTY_STRING, ValueUtil } from '../common/ValueUtil';
import { ANONYMOUS_CLASS_PREFIX, INSTANCE_INIT_METHOD_NAME, NAME_PREFIX, UNKNOWN_CLASS_NAME } from '../common/Const';
import { CONSTRUCTOR_NAME, IMPORT, SUPER_NAME, THIS_NAME } from '../common/TSConst';
import {
    AbstractInvokeExpr,
    AliasTypeExpr,
    ArkCastExpr,
    ArkConditionExpr,
    ArkInstanceInvokeExpr,
    ArkInstanceOfExpr,
    ArkNewArrayExpr,
    ArkNewExpr,
    ArkNormalBinopExpr,
    ArkPtrInvokeExpr,
    ArkStaticInvokeExpr,
    RelationalBinaryOperator
} from '../base/Expr';
import { ModelUtils } from '../common/ModelUtils';
import { Local } from '../base/Local';
import { Builtin } from '../common/Builtin';
import { ArkClass } from '../model/ArkClass';
import { Constant } from '../base/Constant';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ClassSignature } from '../model/ArkSignature';
import { ImportInfo } from '../model/ArkImport';
import { ArkField } from '../model/ArkField';
import { Scene } from '../../Scene';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ValueInference');

export enum InferLanguage {
    UNKNOWN = -1,
    COMMON = 0,
    ARK_TS1_1 = 1,
    ARK_TS1_2 = 2,
    JAVA_SCRIPT = 3,
    CXX = 21,
    ABC = 51
}

export const valueCtors: Map<Function, InferLanguage> = new Map<Function, InferLanguage>();

export function Bind(lang: InferLanguage = InferLanguage.COMMON): Function {
    return (constructor: new () => ValueInference<Value>) => {
        valueCtors.set(constructor, lang);
        logger.info('the ValueInference %s registered.', constructor.name);
        return constructor;
    };
}

/**
 * Abstract base class for value-specific inference operations
 * @template T - Type parameter that must extend the Value base class
 */
export abstract class ValueInference<T extends Value> implements Inference, InferenceFlow {
    /**
     * Returns the name of the value being inferred
     * @returns Name identifier for the value
     */
    public abstract getValueName(): string;

    /**
     * Prepares for inference operation
     * @param value - The value to prepare for inference
     * @param stmt - The statement where the value is located
     * @returns True if inference should proceed, false otherwise
     */
    public abstract preInfer(value: T, stmt?: Stmt): boolean;

    /**
     * Performs the actual inference operation
     * @param value - The value to perform inference on
     * @param stmt - The statement where the value is located
     * @returns New inferred value or undefined if no changes
     */
    public abstract infer(value: T, stmt?: Stmt): Value | undefined;

    /**
     * Main inference workflow implementation
     * Orchestrates the preInfer → infer → postInfer sequence
     * @param value - The value to perform inference on
     * @param stmt - The statement where the value is located
     */
    public doInfer(value: T, stmt?: Stmt): void {
        try {
            // Only proceed if pre-inference checks pass
            if (this.preInfer(value, stmt)) {
                // Perform the core inference operation
                const newValue = this.infer(value, stmt);
                // Handle post-inference updates
                this.postInfer(value, newValue, stmt);
            }
        } catch (error) {
            logger.warn('infer value failed:' + (error as Error).message + ' from' + stmt?.toString());
        }
    }

    /**
     * Handles updates after inference completes
     * Replaces values in statements if new values are inferred
     * @param value - The original value that was inferred
     * @param newValue - The new inferred value
     * @param stmt - The statement where the value is located
     */
    public postInfer(value: T, newValue?: Value, stmt?: Stmt): void {
        if (newValue && stmt) {
            if (stmt.getDef() === value) {
                stmt.replaceDef(value, newValue);
            } else {
                stmt.replaceUse(value, newValue);
            }
        }
    }
}

/**
 * Parameter reference inference implementation for ArkParameterRef values
 * Handles type inference and resolution for parameter references in the IR
 */
@Bind()
export class ParameterRefInference extends ValueInference<ArkParameterRef> {
    public getValueName(): string {
        return 'ArkParameterRef';
    }

    /**
     * Determines if pre-inference should be performed on the given parameter reference
     * Checks if the parameter type requires inference (lexical environment types or unclear types)
     * @param {ArkParameterRef} value - The parameter reference to evaluate
     * @returns {boolean} True if pre-inference should be performed, false otherwise
     */
    public preInfer(value: ArkParameterRef): boolean {
        const type = value.getType();
        return type instanceof LexicalEnvType || TypeInference.isUnclearType(type);
    }

    /**
     * Performs inference on a parameter reference within the context of a statement
     * Resolves the parameter reference using the method's declaration context
     * @param {ArkParameterRef} value - The parameter reference to infer
     * @param {Stmt} stmt - The statement containing the parameter reference
     * @returns {Value | undefined} Always returns undefined as parameter references are resolved in-place
     */
    public infer(value: ArkParameterRef, stmt: Stmt): Value | undefined {
        IRInference.inferParameterRef(value, stmt.getCfg().getDeclaringMethod());
        return undefined;
    }
}

/**
 * Closure field reference inference implementation for ClosureFieldRef values
 * Handles type inference and resolution for closure field references in the IR
 */
@Bind()
export class ClosureFieldRefInference extends ValueInference<ClosureFieldRef> {
    public getValueName(): string {
        return 'ClosureFieldRef';
    }

    /**
     * Determines if pre-inference should be performed on the given closure field reference
     * Checks if the closure field type requires inference (unclear types)
     * @param {ClosureFieldRef} value - The closure field reference to evaluate
     * @returns {boolean} True if pre-inference should be performed, false otherwise
     */
    public preInfer(value: ClosureFieldRef): boolean {
        const type = value.getType();
        return TypeInference.isUnclearType(type);
    }

    /**
     * Performs inference on a closure field reference
     * Resolves the closure field type by looking up the field in the lexical environment's closures
     * @param {ClosureFieldRef} value - The closure field reference to infer
     * @returns {Value | undefined} Always returns undefined as closure field references are resolved in-place
     */
    public infer(value: ClosureFieldRef): Value | undefined {
        const type = value.getBase().getType();
        if (type instanceof LexicalEnvType) {
            let newType = type.getClosures().find(c => c.getName() === value.getFieldName())?.getType();
            if (newType && !TypeInference.isUnclearType(newType)) {
                value.setType(newType);
            }
        }
        return undefined;
    }
}

@Bind()
export class FieldRefInference extends ValueInference<ArkInstanceFieldRef> {
    public getValueName(): string {
        return 'ArkInstanceFieldRef';
    }

    /**
     * Determines if pre-inference should be performed on the given field reference
     * Checks if the field requires inference based on declaring signature, type clarity, or static status
     * @param {ArkInstanceFieldRef} value - The field reference to evaluate
     * @param {Stmt} [stmt] - Optional statement context for the evaluation
     * @returns {boolean} True if pre-inference should be performed, false otherwise
     */
    public preInfer(value: ArkInstanceFieldRef, stmt?: Stmt): boolean {
        return IRInference.needInfer(value.getFieldSignature().getDeclaringSignature().getDeclaringFileSignature()) ||
            TypeInference.isUnclearType(value.getType()) || value.getFieldSignature().isStatic();
    }

    /**
     * Performs inference on a field reference within the context of a statement
     * Handles special cases for array types and dynamic field access, and generates updated field signatures
     * @param {ArkInstanceFieldRef} value - The field reference to infer
     * @param {Stmt} stmt - The statement containing the field reference
     * @returns {Value | undefined} Returns a new ArkArrayRef for array types, ArkStaticFieldRef for static fields,
     *          or undefined for regular instance fields
     */
    public infer(value: ArkInstanceFieldRef, stmt: Stmt): Value | undefined {
        const baseType = TypeInference.replaceAliasType(value.getBase().getType());
        const arkMethod = stmt.getCfg().getDeclaringMethod();
        // Special handling for array types with dynamic field access
        if (baseType instanceof ArrayType && value.isDynamic()) {
            const index = TypeInference.getLocalFromMethodBody(value.getFieldName(), arkMethod);
            if (index) {
                return new ArkArrayRef(value.getBase(), index);
            } else {
                return new ArkArrayRef(value.getBase(), ValueUtil.createConst(value.getFieldName()));
            }
        }
        // Generate updated field signature based on current context
        const newFieldSignature = IRInference.generateNewFieldSignature(value, arkMethod.getDeclaringArkClass(), baseType);
        if (newFieldSignature) {
            value.setFieldSignature(newFieldSignature);
            if (newFieldSignature.isStatic()) {
                return new ArkStaticFieldRef(newFieldSignature);
            }
        }
        return undefined;
    }
}

@Bind()
export class StaticFieldRefInference extends ValueInference<ArkStaticFieldRef> {
    public getValueName(): string {
        return 'ArkStaticFieldRef';
    }

    /**
     * Determines if pre-inference should be performed on the given static field reference
     * Checks if the field requires inference based on declaring signature or type clarity
     * @param {ArkStaticFieldRef} value - The static field reference to evaluate
     * @param {Stmt} [stmt] - Optional statement context for the evaluation
     * @returns {boolean} True if pre-inference should be performed, false otherwise
     */
    public preInfer(value: ArkStaticFieldRef, stmt?: Stmt): boolean {
        return IRInference.needInfer(value.getFieldSignature().getDeclaringSignature().getDeclaringFileSignature()) ||
            TypeInference.isUnclearType(value.getType());
    }

    /**
     * Performs inference on a static field reference within the context of a statement
     * Resolves the base type and generates updated field signatures, maintaining static field semantics
     * @param {ArkStaticFieldRef} value - The static field reference to infer
     * @param {Stmt} stmt - The statement containing the static field reference
     * @returns {Value | undefined} Returns a new ArkStaticFieldRef with updated signature, or undefined if no changes
     */
    public infer(value: ArkStaticFieldRef, stmt: Stmt): Value | undefined {
        const baseSignature = value.getFieldSignature().getDeclaringSignature();
        const baseName = baseSignature instanceof ClassSignature ? baseSignature.getClassName() : baseSignature.getNamespaceName();
        const arkClass = stmt.getCfg().getDeclaringMethod().getDeclaringArkClass();
        const baseType = TypeInference.inferBaseType(baseName, arkClass);
        if (!baseType) {
            return undefined;
        }
        const newFieldSignature = IRInference.generateNewFieldSignature(value, arkClass, baseType);
        if (newFieldSignature) {
            value.setFieldSignature(newFieldSignature);
            if (newFieldSignature.isStatic()) {
                return new ArkStaticFieldRef(newFieldSignature);
            }
        }
        return undefined;
    }
}


@Bind()
export class InstanceInvokeExprInference extends ValueInference<ArkInstanceInvokeExpr> {

    public getValueName(): string {
        return 'ArkInstanceInvokeExpr';
    }

    /**
     * Determines if pre-inference should be performed on the given invocation expression
     * Checks if the method requires inference based on declaring signature or type clarity
     * @param {ArkInstanceInvokeExpr} value - The invocation expression to evaluate
     * @param {Stmt} [stmt] - Optional statement context for the evaluation
     * @returns {boolean} True if pre-inference should be performed, false otherwise
     */
    public preInfer(value: ArkInstanceInvokeExpr, stmt: Stmt | undefined): boolean {
        return IRInference.needInfer(value.getMethodSignature().getDeclaringClassSignature().getDeclaringFileSignature()) ||
            TypeInference.isUnclearType(value.getType());
    }

    /**
     * Performs inference on an instance invocation expression within the context of a statement
     * Resolves the base type and method signature, handling various base type scenarios
     * @param {ArkInstanceInvokeExpr} value - The invocation expression to infer
     * @param {Stmt} stmt - The statement containing the invocation
     * @returns {Value | undefined} Returns a new invocation expression if transformed, undefined otherwise
     */
    public infer(value: ArkInstanceInvokeExpr, stmt: Stmt): Value | undefined {
        const arkMethod = stmt.getCfg().getDeclaringMethod();
        const result = InstanceInvokeExprInference.inferInvokeExpr(value.getBase().getType(), value, arkMethod, this.getMethodName(value, arkMethod));
        return !result || result === value ? undefined : result;
    }

    /**
     * Performs post-inference processing on invocation expressions
     * Handles special case for super() calls by replacing the base with 'this' local
     * @param {ArkInstanceInvokeExpr} value - The original invocation expression
     * @param {Value} newValue - The new value after inference
     * @param {Stmt} stmt - The statement containing the invocation
     */
    public postInfer(value: ArkInstanceInvokeExpr, newValue: Value, stmt: Stmt): void {
        if (value instanceof ArkInstanceInvokeExpr && value.getBase().getName() === SUPER_NAME) {
            const thisLocal = stmt.getCfg().getDeclaringMethod().getBody()?.getLocals().get(THIS_NAME);
            if (thisLocal) {
                value.setBase(thisLocal);
                thisLocal.addUsedStmt(stmt);
            }
        }
        super.postInfer(value, newValue, stmt);
    }

    public getMethodName(expr: AbstractInvokeExpr, arkMethod: ArkMethod): string {
        return expr.getMethodSignature().getMethodSubSignature().getMethodName();
    }

    public static inferInvokeExpr(baseType: Type, expr: AbstractInvokeExpr, arkMethod: ArkMethod, methodName: string): AbstractInvokeExpr | null {
        // Handle baseType
        if (baseType instanceof AliasType) {
            baseType = TypeInference.replaceAliasType(baseType);
        } else if (baseType instanceof UnionType) {
            for (let type of baseType.flatType()) {
                if (type instanceof UndefinedType || type instanceof NullType) {
                    continue;
                }
                let result = this.inferInvokeExpr(type, expr, arkMethod, methodName);
                if (result) {
                    return result;
                }
            }
        } else if (baseType instanceof ArrayType) {
            const arrayClass = arkMethod.getDeclaringArkFile().getScene().getSdkGlobal(Builtin.ARRAY);
            if (arrayClass instanceof ArkClass) {
                baseType = new ClassType(arrayClass.getSignature(), [baseType.getBaseType()]);
            }
        } else if (baseType instanceof GenericType) {
            const newType = baseType.getDefaultType() ?? baseType.getConstraint();
            if (!newType) {
                return null;
            }
            return this.inferInvokeExpr(newType, expr, arkMethod, methodName);
        } else if (baseType instanceof StringType || baseType instanceof NumberType || baseType instanceof BooleanType) {
            // Convert primitive types to their wrapper class types
            const name = baseType.getName();
            const className = name.charAt(0).toUpperCase() + name.slice(1);
            const arrayClass = arkMethod.getDeclaringArkFile().getScene().getSdkGlobal(className);
            if (arrayClass instanceof ArkClass) {
                baseType = new ClassType(arrayClass.getSignature());
            }
        }
        const scene = arkMethod.getDeclaringArkFile().getScene();
        return this.inferMethodFromBase(baseType, expr, scene, methodName);
    }

    public static inferMethodFromBase(baseType: Type, expr: AbstractInvokeExpr, scene: Scene, methodName: string): AbstractInvokeExpr | null {
        // Dispatch to appropriate inference method based on resolved base type
        if (baseType instanceof ClassType) {
            return IRInference.inferInvokeExprWithDeclaredClass(expr, baseType, methodName, scene);
        } else if (baseType instanceof AnnotationNamespaceType) {
            const namespace = scene.getNamespace(baseType.getNamespaceSignature());
            if (namespace) {
                const foundMethod = ModelUtils.findPropertyInNamespace(methodName, namespace);
                if (foundMethod instanceof ArkMethod) {
                    let signature = foundMethod.matchMethodSignature(expr.getArgs());
                    TypeInference.inferSignatureReturnType(signature, foundMethod);
                    expr.setMethodSignature(signature);
                    return expr instanceof ArkInstanceInvokeExpr ? new ArkStaticInvokeExpr(signature, expr.getArgs(), expr.getRealGenericTypes()) : expr;
                }
            }
        } else if (baseType instanceof FunctionType) {
            return IRInference.inferInvokeExprWithFunction(methodName, expr, baseType, scene);
        } else if (baseType instanceof ArrayType) {
            return IRInference.inferInvokeExprWithArray(methodName, expr, baseType, scene);
        }
        return null;
    }
}

@Bind()
export class StaticInvokeExprInference extends InstanceInvokeExprInference {

    public getValueName(): string {
        return 'ArkStaticInvokeExpr';
    }

    public preInfer(value: ArkStaticInvokeExpr, stmt: Stmt | undefined): boolean {
        return IRInference.needInfer(value.getMethodSignature().getDeclaringClassSignature().getDeclaringFileSignature());
    }

    public infer(expr: ArkStaticInvokeExpr, stmt: Stmt): Value | undefined {
        const arkMethod = stmt.getCfg().getDeclaringMethod();
        const methodName = this.getMethodName(expr, arkMethod);
        // special case process
        if (methodName === IMPORT) {
            const arg = expr.getArg(0);
            let type;
            if (arg instanceof Constant) {
                type = TypeInference.inferDynamicImportType(arg.getValue(), arkMethod.getDeclaringArkClass());
            }
            if (type) {
                expr.getMethodSignature().getMethodSubSignature().setReturnType(type);
            }
            return undefined;
        } else if (methodName === SUPER_NAME) {
            const superCtor = arkMethod.getDeclaringArkClass().getSuperClass()?.getMethodWithName(CONSTRUCTOR_NAME);
            if (superCtor) {
                expr.setMethodSignature(superCtor.getSignature());
            }
            return undefined;
        }
        const baseType = this.getBaseType(expr, arkMethod);
        const result = baseType ? InstanceInvokeExprInference.inferInvokeExpr(baseType, expr, arkMethod, methodName) :
            IRInference.inferStaticInvokeExprByMethodName(methodName, arkMethod, expr);
        return !result || result === expr ? undefined : result;
    }

    private getBaseType(expr: ArkStaticInvokeExpr, arkMethod: ArkMethod): Type | null {
        const className = expr.getMethodSignature().getDeclaringClassSignature().getClassName();
        if (className && className !== UNKNOWN_CLASS_NAME) {
            return TypeInference.inferBaseType(className, arkMethod.getDeclaringArkClass());
        }
        return null;
    }
}

@Bind()
export class ArkPtrInvokeExprInference extends StaticInvokeExprInference {
    public getValueName(): string {
        return 'ArkPtrInvokeExpr';
    }

    public infer(expr: ArkPtrInvokeExpr, stmt: Stmt): Value | undefined {
        const ptrType = expr.getFuncPtrLocal().getType();
        if (ptrType instanceof FunctionType) {
            expr.setMethodSignature(ptrType.getMethodSignature());
        }
        super.infer(expr, stmt);
        return undefined;
    }
}


@Bind()
export class ArkNewExprInference extends ValueInference<ArkNewExpr> {
    public getValueName(): string {
        return 'ArkNewExpr';
    }

    public preInfer(value: ArkNewExpr): boolean {
        return IRInference.needInfer(value.getClassType().getClassSignature().getDeclaringFileSignature());
    }

    public infer(value: ArkNewExpr, stmt: Stmt): Value | undefined {
        const className = value.getClassType().getClassSignature().getClassName();
        const arkMethod = stmt.getCfg().getDeclaringMethod();
        let type: Type | undefined | null = ModelUtils.findDeclaredLocal(new Local(className), arkMethod, 1)?.getType();
        if (TypeInference.isUnclearType(type)) {
            type = TypeInference.inferUnclearRefName(className, arkMethod.getDeclaringArkClass());
        }
        if (type instanceof AliasType) {
            const originType = TypeInference.replaceAliasType(type);
            if (originType instanceof FunctionType) {
                type = originType.getMethodSignature().getMethodSubSignature().getReturnType();
            } else {
                type = originType;
            }
        }
        if (type && type instanceof ClassType) {
            value.getClassType().setClassSignature(type.getClassSignature());
            TypeInference.inferRealGenericTypes(value.getClassType().getRealGenericTypes(), arkMethod.getDeclaringArkClass());
        }
        return undefined;
    }
}

@Bind()
export class ArkNewArrayExprInference extends ValueInference<ArkNewArrayExpr> {
    public getValueName(): string {
        return 'ArkNewArrayExpr';
    }

    public preInfer(value: ArkNewArrayExpr): boolean {
        return TypeInference.isUnclearType(value.getBaseType());
    }

    public infer(value: ArkNewArrayExpr, stmt: Stmt): Value | undefined {
        const type = TypeInference.inferUnclearedType(value.getBaseType(), stmt.getCfg().getDeclaringMethod().getDeclaringArkClass());
        if (type) {
            value.setBaseType(type);
        }
        return undefined;
    }
}


@Bind()
export class ArkNormalBinOpExprInference extends ValueInference<ArkNormalBinopExpr> {
    public getValueName(): string {
        return 'ArkNormalBinopExpr';
    }

    public preInfer(value: ArkNormalBinopExpr): boolean {
        return TypeInference.isUnclearType(value.getType());
    }

    public infer(value: ArkNormalBinopExpr): Value | undefined {
        value.setType();
        return undefined;
    }
}

@Bind()
export class ArkConditionExprInference extends ArkNormalBinOpExprInference {
    public getValueName(): string {
        return 'ArkConditionExpr';
    }

    public preInfer(value: ArkConditionExpr): boolean {
        return true;
    }

    public infer(value: ArkConditionExpr): Value | undefined {
        if (value.getOperator() === RelationalBinaryOperator.InEquality && value.getOp2() === ValueUtil.getOrCreateNumberConst(0)) {
            const op1Type = value.getOp1().getType();
            if (op1Type instanceof StringType) {
                value.setOp2(ValueUtil.createStringConst(EMPTY_STRING));
            } else if (op1Type instanceof BooleanType) {
                value.setOp2(ValueUtil.getBooleanConstant(false));
            } else if (op1Type instanceof ClassType) {
                value.setOp2(ValueUtil.getUndefinedConst());
            }
        }
        value.fillType();
        return undefined;
    }
}


@Bind()
export class ArkInstanceOfExprInference extends ValueInference<ArkInstanceOfExpr> {
    public getValueName(): string {
        return 'ArkInstanceOfExpr';
    }

    public preInfer(value: ArkInstanceOfExpr): boolean {
        return TypeInference.isUnclearType(value.getCheckType());
    }

    public infer(value: ArkInstanceOfExpr, stmt: Stmt): Value | undefined {
        const type = TypeInference.inferUnclearedType(value.getCheckType(), stmt.getCfg().getDeclaringMethod().getDeclaringArkClass());
        if (type) {
            value.setCheckType(type);
        }
        return undefined;
    }
}

@Bind()
export class ArkCastExprInference extends ValueInference<ArkCastExpr> {
    public getValueName(): string {
        return 'ArkCastExpr';
    }

    public preInfer(value: ArkCastExpr): boolean {
        return TypeInference.isUnclearType(value.getType());
    }

    public infer(value: ArkCastExpr, stmt: Stmt): Value | undefined {
        const arkClass = stmt.getCfg().getDeclaringMethod().getDeclaringArkClass();
        const type = TypeInference.inferUnclearedType(value.getType(), arkClass);
        if (type && !TypeInference.isUnclearType(type)) {
            IRInference.inferRightWithSdkType(type, value.getOp().getType(), arkClass);
            value.setType(type);
        } else if (!TypeInference.isUnclearType(value.getOp().getType())) {
            value.setType(value.getOp().getType());
        }
        return undefined;
    }
}


@Bind()
export class LocalInference extends ValueInference<Local> {
    public getValueName(): string {
        return 'Local';
    }

    public preInfer(value: Local): boolean {
        return TypeInference.isUnclearType(value.getType());
    }

    public infer(value: Local, stmt: Stmt): Value | undefined {
        const name = value.getName();
        const arkClass = stmt.getCfg().getDeclaringMethod().getDeclaringArkClass();
        // Special handling for 'this' reference - set to current class type
        if (name === THIS_NAME) {
            value.setType(new ClassType(arkClass.getSignature(), arkClass.getRealTypes()));
            return undefined;
        }
        let newType;
        // Skip temporary variables (those with name prefix) and look for declared locals
        if (!name.startsWith(NAME_PREFIX)) {
            newType = ModelUtils.findDeclaredLocal(value, stmt.getCfg().getDeclaringMethod(), 1)?.getType() ??
                TypeInference.inferBaseType(name, arkClass);
        }
        if (newType) {
            value.setType(newType);
        }
        return undefined;
    }
}


@Bind(InferLanguage.ARK_TS1_1)
export class ArkTSFieldRefInference extends FieldRefInference {
    public preInfer(value: ArkInstanceFieldRef, stmt: Stmt): boolean {
        if (stmt.getDef() === value && this.isAnonClassThisRef(value, stmt.getCfg().getDeclaringMethod())) {
            return false;
        }
        return super.preInfer(value);
    }

    /**
     * Checks if a value represents an anonymous class 'this' field reference
     * Identifies field references that access fields directly on 'this' in anonymous class constructors
     * @param {Value} stmtDef - The value to check (typically a field reference)
     * @param {ArkMethod} arkMethod - The method containing the value
     * @returns {boolean} True if the value is an anonymous class 'this' field reference
     */
    private isAnonClassThisRef(stmtDef: Value, arkMethod: ArkMethod): boolean {
        return (arkMethod.getName() === INSTANCE_INIT_METHOD_NAME || arkMethod.getName() === CONSTRUCTOR_NAME) &&
            stmtDef instanceof ArkInstanceFieldRef &&
            stmtDef.getBase().getName() === THIS_NAME &&
            arkMethod.getDeclaringArkClass().isAnonymousClass() &&
            stmtDef.getFieldName().indexOf('.') === -1;
    }
}


@Bind(InferLanguage.ARK_TS1_1)
export class ArkTsInstanceInvokeExprInference extends InstanceInvokeExprInference {
    /**
     * Performs inference on an instance invocation expression within the context of a statement
     * Enhances the base implementation with real generic type inference and extension function support
     * @param {ArkInstanceInvokeExpr} value - The invocation expression to infer
     * @param {Stmt} stmt - The statement containing the invocation
     * @returns {Value | undefined} Returns a new expression if transformed, undefined otherwise
     */
    public infer(value: ArkInstanceInvokeExpr, stmt: Stmt): Value | undefined {
        const arkMethod = stmt.getCfg().getDeclaringMethod();
        TypeInference.inferRealGenericTypes(value.getRealGenericTypes(), arkMethod.getDeclaringArkClass());
        const result =
            InstanceInvokeExprInference.inferInvokeExpr(value.getBase().getType(), value, arkMethod, super.getMethodName(value, arkMethod)) ??
            IRInference.processExtendFunc(value, arkMethod, super.getMethodName(value, arkMethod));
        return !result || result === value ? undefined : result;
    }
}


@Bind(InferLanguage.ARK_TS1_1)
export class AliasTypeExprInference extends ValueInference<AliasTypeExpr> {
    public getValueName(): string {
        return 'AliasTypeExpr';
    }

    public preInfer(value: AliasTypeExpr): boolean {
        return value.getOriginalType() === undefined;
    }

    public infer(value: AliasTypeExpr, stmt: Stmt): Value | undefined {
        let originalObject = value.getOriginalObject();
        const arkMethod = stmt.getCfg().getDeclaringMethod();

        let type;
        let originalLocal;
        if (originalObject instanceof Local) {
            originalLocal = ModelUtils.findArkModelByRefName(originalObject.getName(), arkMethod.getDeclaringArkClass());
            if (AliasTypeExpr.isAliasTypeOriginalModel(originalLocal)) {
                originalObject = originalLocal;
            }
        }
        if (originalObject instanceof ImportInfo) {
            const arkExport = originalObject.getLazyExportInfo()?.getArkExport();
            const importClauseName = originalObject.getImportClauseName();
            if (importClauseName.includes('.') && arkExport instanceof ArkClass) {
                type = TypeInference.inferUnclearRefName(importClauseName, arkExport);
            } else if (arkExport) {
                type = TypeInference.parseArkExport2Type(arkExport);
            }
        } else if (originalObject instanceof Type) {
            type = TypeInference.inferUnclearedType(originalObject, arkMethod.getDeclaringArkClass());
        } else if (originalObject instanceof ArkField) {
            type = originalObject.getType();
        } else {
            type = TypeInference.parseArkExport2Type(originalObject);
        }
        if (type) {
            const realGenericTypes = value.getRealGenericTypes();
            if (TypeInference.checkType(type, t => t instanceof GenericType || t instanceof AnyType) && realGenericTypes && realGenericTypes.length > 0) {
                TypeInference.inferRealGenericTypes(realGenericTypes, arkMethod.getDeclaringArkClass());
                type = TypeInference.replaceTypeWithReal(type, realGenericTypes);
            }
            value.setOriginalType(type);
            if (AliasTypeExpr.isAliasTypeOriginalModel(originalLocal)) {
                value.setOriginalObject(originalLocal);
            }
        }
        return undefined;
    }
}


@Bind(InferLanguage.ARK_TS1_1)
export class ArkTSLocalInference extends LocalInference {
    public getValueName(): string {
        return 'Local';
    }

    public preInfer(value: Local): boolean {
        const type = value.getType();
        if (value.getName() === THIS_NAME && type instanceof ClassType &&
            type.getClassSignature().getClassName().startsWith(ANONYMOUS_CLASS_PREFIX)) {
            return true;
        } else if (type instanceof FunctionType) {
            return true;
        }
        return super.preInfer(value);
    }

    public infer(value: Local, stmt: Stmt): Value | undefined {
        const name = value.getName();
        const type = value.getType();
        const arkMethod = stmt.getCfg().getDeclaringMethod();
        let newType;
        if (name === THIS_NAME) {
            newType = IRInference.inferThisLocal(arkMethod)?.getType();
            if (newType) {
                value.setType(newType);
            }
            return undefined;
        } else if (type instanceof FunctionType) {
            const methodSignature = type.getMethodSignature();
            methodSignature.getMethodSubSignature().getParameters().forEach(p => TypeInference.inferParameterType(p, arkMethod));
            TypeInference.inferSignatureReturnType(methodSignature, arkMethod);
            return undefined;
        } else {
            newType = TypeInference.inferUnclearedType(type, arkMethod.getDeclaringArkClass());
        }
        if (newType) {
            value.setType(newType);
            return undefined;
        }
        return super.infer(value, stmt);
    }
}

@Bind(InferLanguage.ABC)
export class AbcFieldRefInference extends FieldRefInference {
    public getValueName(): string {
        return 'ArkInstanceFieldRef';
    }

    public preInfer(value: ArkInstanceFieldRef, stmt: Stmt): boolean {
        const type = value.getType();
        const projectName = stmt.getCfg().getDeclaringMethod().getDeclaringArkFile().getProjectName();
        if (TypeInference.isAnonType(type, projectName)) {
            const baseType = value.getBase().getType();
            if (!TypeInference.isUnclearType(baseType) && !TypeInference.isAnonType(baseType, projectName)) {
                return true;
            }
        }
        return super.preInfer(value, stmt);
    }
}