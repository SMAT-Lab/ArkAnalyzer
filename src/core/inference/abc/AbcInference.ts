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

import { ImportInfoInference, MethodInference, StmtInference } from '../ModelInference';
import { ImportInfo } from '../../model/ArkImport';
import { ModelUtils } from '../../common/ModelUtils';
import { ArkMethod } from '../../model/ArkMethod';
import {
    AliasTypeSignature,
    ClassSignature,
    FieldSignature,
    FileSignature,
    MethodSignature
} from '../../model/ArkSignature';
import { InferenceBuilder } from '../InferenceBuilder';
import { SdkUtils } from '../../common/SdkUtils';
import { Bind, FieldRefInference, InferLanguage, InstanceInvokeExprInference, ValueInference } from '../ValueInference';
import { Stmt } from '../../base/Stmt';
import { TypeInference } from '../../common/TypeInference';
import { Value } from '../../base/Value';
import { ClassType, GenericType, Type, UnknownType } from '../../base/Type';
import { Local } from '../../base/Local';
import {
    AbstractFieldRef,
    ArkCaughtExceptionRef,
    ArkInstanceFieldRef,
    ArkParameterRef,
    GlobalRef
} from '../../base/Ref';
import { ANONYMOUS_CLASS_PREFIX } from '../../common/Const';
import path from 'path';
import { ArkField } from '../../model/ArkField';
import { AbstractInvokeExpr, ArkInstanceInvokeExpr } from '../../base/Expr';
import { IRInference } from '../../common/IRInference';
import { ArkClass } from '../../model/ArkClass';
import { BUSINESS_ERROR, OHOS_BASE_FILE } from '../../common/EtsConst';


class AbcImportInference extends ImportInfoInference {
    /**
     * get arkFile and assign to from file
     * @param fromInfo
     */
    public preInfer(fromInfo: ImportInfo): void {
        const from = fromInfo.getFrom();
        if (!from) {
            return;
        }
        let file;
        if (path.isAbsolute(from)) {
            const scene = fromInfo.getDeclaringArkFile().getScene();
            file = scene.getFile(new FileSignature(fromInfo.getDeclaringArkFile().getProjectName(), from));
        } else {
            //sdk path
            file = SdkUtils.getImportSdkFile(from);
        }
        if (file) {
            this.fromFile = file;
        }
    }
}


export class AbcMethodInference extends MethodInference {

    public preInfer(arkMethod: ArkMethod): void {

        const implSignature = arkMethod.getImplementationSignature();
        if (implSignature) {
            this.inferArkUIComponentLifeCycleMethod(arkMethod, implSignature);
        }
    }

    private inferArkUIComponentLifeCycleMethod(arkMethod: ArkMethod, impl: MethodSignature): void {
        const arkClass = arkMethod.getDeclaringArkClass();
        const scene = arkClass.getDeclaringArkFile().getScene();
        const classes = arkClass
            .getAllHeritageClasses()
            .filter(cls => scene.getProjectSdkMap().has(cls.getSignature().getDeclaringFileSignature().getProjectName()));
        for (const sdkClass of classes) {
            // findPropertyInClass function will check all super classes recursely to find the method
            const sdkMethod = ModelUtils.findPropertyInClass(arkMethod.getName(), sdkClass);
            if (!sdkMethod || !(sdkMethod instanceof ArkMethod)) {
                continue;
            }
            const sdkDeclareSigs = sdkMethod.getDeclareSignatures();
            // It is difficult to get the exactly declare signature when there are more than 1 declare signatures.
            // So currently only match the SDK with no override.
            if (!sdkDeclareSigs || sdkDeclareSigs.length !== 1) {
                continue;
            }
            const params = impl.getMethodSubSignature().getParameters();
            const sdkMethodSig = sdkDeclareSigs[0];
            const sdkParams = sdkMethodSig.getMethodSubSignature().getParameters();
            params.forEach((param, index) => {
                if (index < sdkParams.length) {
                    param.setType(sdkParams[index].getType());
                }
            });
            impl.getMethodSubSignature().setReturnType(sdkMethodSig.getMethodSubSignature().getReturnType());
            return;
        }
    }
}

class AbcStmtInference extends StmtInference {

    constructor(valueInferences: ValueInference<Value>[]) {
        super(valueInferences);
    }


    public static updateUnionType(target: Value, srcType: Type, method: ArkMethod): Stmt[] | undefined {
        if (target instanceof Local) {
            target.setType(srcType);
            const globalRef = method.getBody()?.getUsedGlobals()?.get(target.getName());
            let result;
            if (globalRef instanceof GlobalRef) {
                result = this.updateGlobalRef(globalRef.getRef(), srcType);
            }
            return result ? result : target.getUsedStmts();
        } else if (target instanceof AbstractFieldRef) {
            target.getFieldSignature().setType(srcType);
        } else if (target instanceof ArkParameterRef) {
            target.setType(srcType);
        }
        return undefined;
    }

    public static updateGlobalRef(ref: Value | null, srcType: Type): Stmt[] | undefined {
        if (ref instanceof Local) {
            let leftType = ref.getType();
            if (TypeInference.isTypeCanBeOverride(leftType)) {
                leftType = srcType;
            } else {
                leftType = TypeInference.union(leftType, srcType);
            }
            if (ref.getType() !== leftType) {
                ref.setType(leftType);
                return ref.getUsedStmts();
            }
        }
        return undefined;
    }

    public transferRight2Left(leftOp: Value, rightType: Type, method: ArkMethod): Stmt[] | undefined {
        const projectName = method.getDeclaringArkFile().getProjectName();
        if (!TypeInference.isUnclearType(rightType) || rightType instanceof GenericType || !TypeInference.isAnonType(rightType, projectName)) {
            let leftType = leftOp.getType();
            if (TypeInference.isTypeCanBeOverride(leftType)) {
                leftType = rightType;
            } else {
                leftType = TypeInference.union(leftType, rightType);
            }
            if (leftOp.getType() !== leftType) {
                return AbcStmtInference.updateUnionType(leftOp, leftType, method);
            }
        }
        return undefined;
    }

    public updateValueType(target: Value, srcType: Type, method: ArkMethod): Stmt[] | undefined {
        const type = target.getType();
        const projectName = method.getDeclaringArkFile().getProjectName();
        if (type !== srcType && (TypeInference.isUnclearType(type) || !TypeInference.isAnonType(type, projectName))) {
            if (target instanceof Local) {
                target.setType(srcType);
                return target.getUsedStmts();
            } else if (target instanceof AbstractFieldRef && projectName === target.getFieldSignature().getDeclaringSignature()
                .getDeclaringFileSignature().getProjectName()) {
                target.getFieldSignature().setType(srcType);
            } else if (target instanceof ArkParameterRef) {
                target.setType(srcType);
            }
        }
        return undefined;
    }

}

export class AbcInferenceBuilder extends InferenceBuilder {

    public buildImportInfoInference(): ImportInfoInference {
        return new AbcImportInference();
    }

    public buildMethodInference(): MethodInference {
        return new AbcMethodInference(this.buildStmtInference());
    }

    public buildStmtInference(): StmtInference {
        const valueInferences = this.getValueInferences(InferLanguage.COMMON);
        this.getValueInferences(InferLanguage.ABC).forEach(e => valueInferences.push(e));
        return new AbcStmtInference(valueInferences);
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
        const signature = value.getFieldSignature().getDeclaringSignature();
        if (signature instanceof ClassSignature && signature.getClassName().startsWith(ANONYMOUS_CLASS_PREFIX)) {
            return true;
        }
        return super.preInfer(value, stmt);
    }

    public infer(value: ArkInstanceFieldRef, stmt: Stmt): Value | undefined {
        const result = super.infer(value, stmt);
        if (!result && value.getType() instanceof UnknownType) {
            const signature = value.getFieldSignature().getDeclaringSignature();
            const scene = stmt.getCfg().getDeclaringMethod().getDeclaringArkFile().getScene();
            if (signature instanceof ClassSignature && signature.getDeclaringFileSignature().getProjectName() === scene.getProjectName()) {
                const cls = scene.getClass(signature);
                if (cls) {
                    const field = new ArkField();
                    field.setDeclaringArkClass(cls);
                    const fieldSignature = new FieldSignature(value.getFieldSignature().getFieldName(), cls.getSignature(), UnknownType.getInstance());
                    field.setSignature(fieldSignature);
                    cls.addField(field);
                    value.setFieldSignature(fieldSignature);
                }
            }
        }
        return result;
    }
}

@Bind(InferLanguage.ABC)
export class AbcInstanceInvokeExprInference extends InstanceInvokeExprInference {
    private static readonly CONTEXT = 'Context';

    /**
     * Performs inference on an instance invocation expression within the context of a statement
     * Enhances the base implementation with real generic type inference and extension function support
     * @param {ArkInstanceInvokeExpr} value - The invocation expression to infer
     * @param {Stmt} stmt - The statement containing the invocation
     * @returns {Value | undefined} Returns a new expression if transformed, undefined otherwise
     */
    public infer(value: ArkInstanceInvokeExpr, stmt: Stmt): Value | undefined {
        const arkMethod = stmt.getCfg().getDeclaringMethod();
        const result =
            IRInference.inferInstanceMember(value.getBase().getType(), value, arkMethod, InstanceInvokeExprInference.inferInvokeExpr) ??
            this.processExtendFunc(value, arkMethod);
        return !result || result === value ? undefined : result;
    }

    /**
     * process Context function
     * @param value
     * @param arkMethod
     */
    private processExtendFunc(value: ArkInstanceInvokeExpr, arkMethod: ArkMethod): AbstractInvokeExpr | null {
        if (value.getBase().getName() === AbcInstanceInvokeExprInference.CONTEXT) {
            const scene = arkMethod.getDeclaringArkFile().getScene();
            const signature = scene.getSdkGlobal(AbcInstanceInvokeExprInference.CONTEXT)?.getSignature();
            if (signature instanceof AliasTypeSignature) {
                const cls = scene.getMethod(signature.getDeclaringMethodSignature())?.getDeclaringArkClass();
                if (cls) {
                    return IRInference.inferInstanceMember(new ClassType(cls.getSignature(), cls.getGenericsTypes()),
                        value, arkMethod, InstanceInvokeExprInference.inferInvokeExpr);
                }
            }
        }
        return null;
    }
}

@Bind(InferLanguage.ABC)
export class AbcExceptionRefInference extends ValueInference<ArkCaughtExceptionRef> {
    private static ERROR_TYPE: ClassType | null = null;

    public getValueName(): string {
        return 'ArkCaughtExceptionRef';
    }

    public preInfer(value: ArkCaughtExceptionRef, stmt: Stmt): boolean {
        return TypeInference.isUnclearType(value.getType());
    }

    public infer(value: ArkCaughtExceptionRef, stmt: Stmt): Value | undefined {
        if (!AbcExceptionRefInference.ERROR_TYPE) {
            const scene = stmt.getCfg().getDeclaringMethod().getDeclaringArkFile().getScene();
            const err = scene.getSdkArkFiles().find(e => e.getName().endsWith(OHOS_BASE_FILE))?.getClassWithName(BUSINESS_ERROR);
            if (err instanceof ArkClass) {
                AbcExceptionRefInference.ERROR_TYPE = new ClassType(err.getSignature(), err.getGenericsTypes());
                value.setType(AbcExceptionRefInference.ERROR_TYPE);
            }
        } else {
            value.setType(AbcExceptionRefInference.ERROR_TYPE);
        }
        return undefined;
    }
}