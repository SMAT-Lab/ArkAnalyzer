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

import { ArkStaticInvokeExpr, ArkNewExpr, ArkInstanceInvokeExpr } from '../../../core/base/Expr';
import { ArkInstanceFieldRef, ArkStaticFieldRef } from '../../../core/base/Ref';
import { Stmt } from '../../../core/base/Stmt';
import { Type, AliasType, ClassType, AnnotationNamespaceType, FunctionType } from '../../../core/base/Type';
import { Value } from '../../../core/base/Value';
import { ValueInference, FieldRefInference, InstanceInvokeExprInference } from '../../../core/inference/ValueInference';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { IRInference } from '../../../core/common/IRInference';
import { ModelUtils } from '../../../core/common/ModelUtils';
import { TypeInference } from '../../../core/common/TypeInference';
import { Local } from '../../../core/base/Local';
import { FieldSignature } from '../../../core/model/ArkSignature';
import { SignatureCanonicalizerRegistry } from '../../../core/common/SignatureCanonicalizerRegistry';
import { TypeInference as CxxTypeInference } from '../common/TypeInference';
import { IRInference as CxxIRInference } from '../common/IRInference';
import { CxxModelUtils } from '../common/ModelUtils';
import { PointerType, ReferenceType } from '../base/Type';

export class CxxFieldRefInference extends FieldRefInference {
    public getValueName(): string {
        return 'ArkCxxInstanceFieldRef';
    }

    public infer(value: ArkInstanceFieldRef, stmt: Stmt): Value | undefined {
        const baseType = CxxTypeInference.replaceAliasType(value.getBase().getType());
        const arkMethod = stmt.getCfg().getDeclaringMethod();
        // A2 推广（cpp）：判别联合消费——保持原语义顺序（先更新 value 再判 static）。
        const resolution = CxxIRInference.generateNewFieldSignature(value, arkMethod.getDeclaringArkClass(), baseType);
        if (resolution !== null) {
            if ('formalId' in resolution) {
                if (resolution.formalId > 0) {
                    value.graduateToFormal(resolution.formalId);
                    if (resolution.staticFlag) {
                        // 替换埋葬（round27）：graduateToFormal 已 retire（formal 分支
                        // 本就正确）——此处返回的 static ref 产物为 canonical。
                        const canonical = SignatureCanonicalizerRegistry.getInstance().fieldSigCanonicalizer.get(resolution.formalId);
                        return new ArkStaticFieldRef(canonical!);
                    }
                }
            } else {
                const params = resolution;
                value.updateFieldSignature(params.fieldName, params.declaringOrID, params.type, params.staticFlag, params.namespaceDeclared);
                if (params.staticFlag) {
                    // 替换埋葬：static params 形态——value 的 temp 行已被 update
                    // （就地演进保持），但 value 即将被返回的 static ref 替换（IR 层
                    // 替换）——纯 retire（params 值非 formal，无归宿记录）。
                    value.retireTemp();
                    let staticSig: FieldSignature;
                    if (typeof params.declaringOrID === 'number') {
                        staticSig = params.namespaceDeclared
                            ? new FieldSignature(params.fieldName, params.declaringOrID, params.type, params.staticFlag, true)
                            : new FieldSignature(params.fieldName, params.declaringOrID, params.type, params.staticFlag);
                    } else {
                        staticSig = new FieldSignature(params.fieldName, params.declaringOrID, params.type, params.staticFlag);
                    }
                    return new ArkStaticFieldRef(staticSig);
                }
            }
        }
        return undefined;
    }
}

export class CxxInstanceInvokeExprInference extends InstanceInvokeExprInference {
    public preInfer(value: ArkInstanceInvokeExpr, stmt?: Stmt): boolean {
        const needBySignature =
            value.getArgs().length !== value.getMethodSignature().getParamLength() ||
            value.getMethodSignature().getMethodSubSignature().getParameterTypes().some(t => TypeInference.isUnclearType(t));
        return needBySignature || super.preInfer(value, stmt);
    }

    public infer(value: ArkInstanceInvokeExpr, stmt: Stmt): Value | undefined {
        const arkMethod = stmt.getCfg().getDeclaringMethod();
        let baseType = value.getBase().getType();
        if (baseType instanceof PointerType || baseType instanceof ReferenceType) {
            baseType = baseType.getBaseType();
        }
        const methodName = this.getMethodName(value, arkMethod);
        const result = InstanceInvokeExprInference.inferInvokeExpr(baseType, value, arkMethod) ??
            CxxTypeInference.inferMethodFromImportNamespace(baseType, value, arkMethod, methodName);

        if (!result && baseType instanceof AnnotationNamespaceType) {
            const namespace = arkMethod.getDeclaringArkFile().getScene().getNamespace(baseType.getNamespaceSignature());
            if (namespace) {
                const foundMethod = CxxModelUtils.findPropertyInNamespace(methodName, namespace);
                if (foundMethod instanceof ArkMethod) {
                    const signature = foundMethod.matchMethodSignature(value.getArgs());
                    CxxTypeInference.inferSignatureReturnType(signature, foundMethod);
                    value.setMethodSignature(signature);
                    return new ArkStaticInvokeExpr(signature, value.getArgs(), value.getRealGenericTypes());
                }
            }
        }
        return !result || result === value ? undefined : result;
    }
}

export class CxxArkNewExprInference extends ValueInference<ArkNewExpr> {
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
            type = CxxTypeInference.inferUnclearRefName(className, arkMethod.getDeclaringArkClass());
        }
        if (type instanceof AliasType) {
            const originType = TypeInference.replaceAliasType(type);
            if (originType instanceof FunctionType) {
                type = originType.getMethodSignature().getMethodSubSignature().getReturnType();
            } else if (originType instanceof PointerType) {
                const baseType = originType.getBaseType();
                if (baseType instanceof FunctionType) {
                    type = baseType.getMethodSignature().getMethodSubSignature().getReturnType();
                } else {
                    type = originType;
                }
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

export function getCxxValueInferences(): ValueInference<Value>[] {
    return [
        new CxxFieldRefInference(),
        new CxxInstanceInvokeExprInference(),
        new CxxArkNewExprInference(),
    ];
}
