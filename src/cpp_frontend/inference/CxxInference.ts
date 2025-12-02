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

import { ClassInference, FileInference, ImportInfoInference, MethodInference, StmtInference } from '../../core/inference/ModelInference';
import { ArkFile } from '../../core/model/ArkFile';
import { IRInference } from '../common/IRInference';
import { ImportInfo } from '../../core/model/ArkImport';
import { findExportInfo, getArkFile, PatchRegistry, CxxModelUtils } from '../common/ModelUtils';
import { ArkClass } from '../../core/model/ArkClass';
import { TypeInference } from '../common/TypeInference';
import { ArkMethod } from '../../core/model/ArkMethod';
import { MethodSignature } from '../../core/model/ArkSignature';
import { InferenceBuilder } from '../../core/inference/InferenceBuilder';
import { ExportInfo } from '../../core/model/ArkExport';
import { ValueInference, InferLanguage } from '../../core/inference/ValueInference';
import { Value } from '../../core/base/Value';
import { ArkAliasTypeDefineStmt, Stmt } from '../../core/base/Stmt';
import { ModelUtils } from '../../core/common/ModelUtils';

class CxxFileInference extends FileInference {
    private isCxxPreprocessed: boolean = false;

    /**
     * Build Cxx Function
     * @param file
     */
    public preInfer(file: ArkFile): void {
        if (!this.isCxxPreprocessed) {
            const scene = file.getScene();
            IRInference.mapCxxDeclAndImpl(scene);
            this.isCxxPreprocessed = true;
        }
        PatchRegistry.patchMethod(ModelUtils, 'getArkExportInImportInfoWithName', CxxModelUtils.getArkExportInImportInfoWithName);
        PatchRegistry.patchMethod(ModelUtils, 'findPropertyInClass', CxxModelUtils.findPropertyInClass);
        file.getImportInfos().filter(i => i.getExportInfo() === undefined)
            .forEach(info => this.importInfoInference.doInfer(info));
    }

    public postInfer(file: ArkFile): void {
        super.postInfer(file);
        PatchRegistry.restoredMethod(ModelUtils, 'getArkExportInImportInfoWithName');
        PatchRegistry.restoredMethod(ModelUtils, 'findPropertyInClass');
    }
}

class CxxImportInference extends ImportInfoInference {
    /**
     * get arkFile and assign to from file
     * @param fromInfo
     */
    public preInfer(fromInfo: ImportInfo): void {
        this.fromFile = getArkFile(fromInfo) || null;
    }

    /**
     * do cxx inference
     * @param fromInfo
     */
    public infer(fromInfo: ImportInfo): ExportInfo | null {
        return findExportInfo(fromInfo, this.fromFile);
    }
}

class CxxClassInference extends ClassInference {
    /**
     * infer generic types in class and heritage classes
     * @param arkClass
     */
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

class CxxMethodInference extends MethodInference {
    /**
     * infer method signatures
     * @param arkMethod
     */
    public preInfer(arkMethod: ArkMethod): void {
        TypeInference.inferGenericType(arkMethod.getGenericTypes(), arkMethod.getDeclaringArkClass());
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
                    TypeInference.inferParameterType(p, arkMethod);
                });
            TypeInference.inferSignatureReturnType(s, arkMethod);
        });
    }
}

export class CxxStmtInference extends StmtInference {

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

}

export class CxxInferenceBuilder extends InferenceBuilder {

    public buildFileInference(): FileInference {
        return new CxxFileInference(this.buildImportInfoInference(), this.buildClassInference());
    }

    public buildImportInfoInference(): ImportInfoInference {
        return new CxxImportInference();
    }

    public buildClassInference(): ClassInference {
        return new CxxClassInference(this.buildMethodInference());
    }

    public buildMethodInference(): MethodInference {
        return new CxxMethodInference(this.buildStmtInference());
    }

    public buildStmtInference(): StmtInference {
        const valueInferences = this.getValueInferences(InferLanguage.COMMON);
        this.getValueInferences(InferLanguage.CXX).forEach(e => valueInferences.push(e));
        return new CxxStmtInference(valueInferences);
    }
}
