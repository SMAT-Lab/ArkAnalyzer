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

import { ClassInference, ImportInfoInference, MethodInference, StmtInference } from '../ModelInference';
import { ImportInfo } from '../../model/ArkImport';
import { getArkFile } from '../../common/ModelUtils';
import { ArkClass } from '../../model/ArkClass';
import { TypeInference } from '../../common/TypeInference';
import { ArkMethod } from '../../model/ArkMethod';
import { MethodSignature } from '../../model/ArkSignature';
import { InferenceBuilder } from '../InferenceBuilder';
import { InferLanguage, ValueInference } from '../ValueInference';
import { ArkAliasTypeDefineStmt, Stmt } from '../../base/Stmt';
import { Value } from '../../base/Value';
import { Type } from '../../base/Type';
import { AbstractFieldRef, ArkParameterRef, GlobalRef } from '../../base/Ref';
import { Local } from '../../base/Local';
import { AbcMethodInference } from '../abc/AbcInference';

class ArkTsImportInference extends ImportInfoInference {
    /**
     * get arkFile and assign to from file
     * @param fromInfo
     */
    public preInfer(fromInfo: ImportInfo): void {
        this.fromFile = getArkFile(fromInfo) || null;
    }
}

class ArkTsClassInference extends ClassInference {
    public preInfer(arkClass: ArkClass): void {
        super.preInfer(arkClass);
        TypeInference.inferGenericType(arkClass.getGenericsTypes(), arkClass);
        arkClass.getFields()
            .filter(p => TypeInference.isUnclearType(p.getType()))
            .forEach(f => {
                const newType = TypeInference.inferUnclearedType(f.getType(), arkClass);
                if (newType) {
                    f.getSignature().setType(newType);
                }
            });
    }
}

class ArkTsMethodInference extends MethodInference {

    public preInfer(arkMethod: ArkMethod): void {
        TypeInference.inferGenericType(arkMethod.getGenericTypes(), arkMethod.getDeclaringArkClass());
        arkMethod.getDeclareSignatures()?.forEach(x => this.inferMethodSignature(x, arkMethod));
        const implSignature = arkMethod.getImplementationSignature();
        if (implSignature) {
            this.inferMethodSignature(implSignature, arkMethod);
        }
    }

    private inferMethodSignature(ms: MethodSignature, arkMethod: ArkMethod): void {
        ms.getMethodSubSignature().getParameters().forEach(p => TypeInference.inferParameterType(p, arkMethod));
        TypeInference.inferSignatureReturnType(ms, arkMethod);
    }
}

export class ArkTsStmtInference extends StmtInference {

    constructor(valueInferences: ValueInference<Value>[]) {
        super(valueInferences);
    }

    public typeSpread(stmt: Stmt, method: ArkMethod): Set<Stmt> {
        if (stmt instanceof ArkAliasTypeDefineStmt && TypeInference.isUnclearType(stmt.getAliasType().getOriginalType())) {
            const originalType = stmt.getAliasTypeExpr().getOriginalType();
            if (originalType) {
                stmt.getAliasType().setOriginalType(originalType);
            }
        }
        return super.typeSpread(stmt, method);
    }

    public transferRight2Left(leftOp: Value, rightType: Type, method: ArkMethod): Stmt[] | undefined {
        const projectName = method.getDeclaringArkFile().getProjectName();
        if (!TypeInference.isUnclearType(rightType) || TypeInference.isDummyClassType(rightType)) {
            let leftType = leftOp.getType();
            if (TypeInference.isTypeCanBeOverride(leftType) || TypeInference.isAnonType(leftType, projectName)) {
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

}


export class ArkTsInferenceBuilder extends InferenceBuilder {

    public buildImportInfoInference(): ImportInfoInference {
        return new ArkTsImportInference();
    }

    public buildClassInference(): ClassInference {
        return new ArkTsClassInference(this.buildMethodInference());
    }

    public buildMethodInference(): MethodInference {
        return new ArkTsMethodInference(this.buildStmtInference());
    }

    public buildStmtInference(): StmtInference {
        const valueInferences = this.getValueInferences(InferLanguage.COMMON);
        this.getValueInferences(InferLanguage.ARK_TS1_1).forEach(e => valueInferences.push(e));
        return new ArkTsStmtInference(valueInferences);
    }
}

export class ArkTs2InferenceBuilder extends ArkTsInferenceBuilder {

}

export class JsInferenceBuilder extends InferenceBuilder {

    public buildImportInfoInference(): ImportInfoInference {
        return new ArkTsImportInference();
    }

    public buildMethodInference(): MethodInference {
        return new AbcMethodInference(this.buildStmtInference());
    }

    public buildStmtInference(): StmtInference {
        const valueInferences = this.getValueInferences(InferLanguage.COMMON);
        return new ArkTsStmtInference(valueInferences);
    }
}