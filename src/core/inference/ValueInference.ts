/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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
import { ArkInstanceFieldRef, ArkParameterRef, ArkStaticFieldRef, ClosureFieldRef } from '../base/Ref';
import {
    AliasType,
    AnnotationNamespaceType,
    ArrayType,
    BooleanType,
    ClassType,
    FunctionType,
    LexicalEnvType,
    StringType,
    TupleType,
    Type,
    UnionType
} from '../base/Type';
import { TypeInference } from '../common/TypeInference';
import { IRInference } from '../common/IRInference';
import { ArkMethod } from '../model/ArkMethod';
import { EMPTY_STRING, ValueUtil } from '../common/ValueUtil';
import { CALL_SIGNATURE_NAME, NAME_PREFIX, UNKNOWN_CLASS_NAME } from '../common/Const';
import { CALL, CONSTRUCTOR_NAME, FUNCTION, IMPORT, SUPER_NAME, THIS_NAME } from '../common/TSConst';
import {
    AbstractInvokeExpr,
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
import { ArkClass } from '../model/ArkClass';
import { Constant } from '../base/Constant';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ClassSignature } from '../model/ArkSignature';
import { Builtin } from '../common/Builtin';

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
        const baseType = value.getBase().getType();
        const arkMethod = stmt.getCfg().getDeclaringMethod();
        // Generate updated field signature based on current context
        const result = IRInference.inferInstanceMember(baseType, value, arkMethod, IRInference.updateRefSignature);
        return !result || result === value ? undefined : result;
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
        const arkMethod = stmt.getCfg().getDeclaringMethod();
        const baseType = TypeInference.inferBaseType(baseName, arkMethod.getDeclaringArkClass());
        if (!baseType) {
            return undefined;
        }
        const result = IRInference.inferInstanceMember(baseType, value, arkMethod, IRInference.updateRefSignature);
        return !result || result === value ? undefined : result;
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
        const result = IRInference.inferInstanceMember(value.getBase().getType(), value, arkMethod, InstanceInvokeExprInference.inferInvokeExpr);
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

    public static inferInvokeExpr(baseType: Type, expr: AbstractInvokeExpr, arkMethod: ArkMethod): AbstractInvokeExpr | null {
        const methodName = expr.getMethodSignature().getMethodSubSignature().getMethodName();
        const scene = arkMethod.getDeclaringArkFile().getScene();
        if (baseType instanceof ArrayType || baseType instanceof TupleType) {
            const arrayInterface = scene.getSdkGlobal(Builtin.ARRAY);
            const realTypes = baseType instanceof ArrayType ? [baseType.getBaseType()] : undefined;
            if (arrayInterface instanceof ArkClass) {
                baseType = new ClassType(arrayInterface.getSignature(), realTypes);
            } else if (methodName === Builtin.ITERATOR_FUNCTION) {
                expr.getMethodSignature().getMethodSubSignature().setReturnType(Builtin.ITERATOR_CLASS_TYPE);
                expr.setRealGenericTypes(realTypes ?? expr.getRealGenericTypes());
                return expr;
            }
        }
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
        const result = baseType ? IRInference.inferInstanceMember(baseType, expr, arkMethod, InstanceInvokeExprInference.inferInvokeExpr) :
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
        let ptrType: Type | undefined = expr.getFuncPtrLocal().getType();
        if (ptrType instanceof UnionType) {
            const funType = ptrType.getTypes().find(t => t instanceof FunctionType);
            if (funType instanceof FunctionType) {
                ptrType = funType;
            } else {
                ptrType = ptrType.getTypes().find(t => t instanceof ClassType);
            }
        }
        let methodSignature;
        if (ptrType instanceof FunctionType) {
            methodSignature = ptrType.getMethodSignature();
        } else if (ptrType instanceof ClassType) {
            const methodName = ptrType.getClassSignature().getClassName() === FUNCTION ? CALL : CALL_SIGNATURE_NAME;
            const scene = stmt.getCfg().getDeclaringMethod().getDeclaringArkFile().getScene();
            const callback = scene.getClass(ptrType.getClassSignature())?.getMethodWithName(methodName);
            if (callback) {
                methodSignature = callback.getSignature();
            }
        }
        if (methodSignature) {
            expr.setMethodSignature(methodSignature);
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

