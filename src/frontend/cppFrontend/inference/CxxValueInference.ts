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
        const newFieldSignature = CxxIRInference.generateNewFieldSignature(value, arkMethod.getDeclaringArkClass(), baseType);
        if (newFieldSignature) {
            value.setFieldSignature(newFieldSignature);
            if (newFieldSignature.isStatic()) {
                return new ArkStaticFieldRef(newFieldSignature);
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
