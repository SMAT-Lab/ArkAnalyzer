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

import { ImportInfoInference, MethodInference, StmtInference } from '../ModelInference';
import { ImportInfo } from '../../model/ArkImport';
import { ModelUtils } from '../../common/ModelUtils';
import { ArkMethod } from '../../model/ArkMethod';
import { FileSignature, MethodSignature } from '../../model/ArkSignature';
import { InferenceBuilder } from '../InferenceBuilder';
import { SdkUtils } from '../../common/SdkUtils';
import { InferLanguage, ValueInference } from '../ValueInference';
import { Stmt } from '../../base/Stmt';
import { TypeInference } from '../../common/TypeInference';
import { Value } from '../../base/Value';
import { Type } from '../../base/Type';
import { Local } from '../../base/Local';
import { AbstractFieldRef, ArkParameterRef } from '../../base/Ref';
import { ArkTsStmtInference } from '../arkts/ArkTsInference';


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
        if (/^([^@]*\/)([^\/]*)$/.test(from)) {
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

    public transferRight2Left(leftOp: Value, rightType: Type, method: ArkMethod): Stmt[] | undefined {
        const projectName = method.getDeclaringArkFile().getProjectName();
        if (!TypeInference.isUnclearType(rightType) || !TypeInference.isAnonType(rightType, projectName)) {
            let leftType = leftOp.getType();
            if (TypeInference.isTypeCanBeOverride(leftType)) {
                leftType = rightType;
            } else {
                leftType = TypeInference.union(leftType, rightType);
            }
            if (leftOp.getType() !== leftType) {
                return ArkTsStmtInference.updateUnionType(leftOp, leftType, method);
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
            } else if (target instanceof AbstractFieldRef) {
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
