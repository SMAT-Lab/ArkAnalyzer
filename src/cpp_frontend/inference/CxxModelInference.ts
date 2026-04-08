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
import { findExportInfo, getArkFile } from '../common/ModelUtils';
import { ArkClass } from '../../core/model/ArkClass';
import { TypeInference as CxxTypeInference } from '../common/TypeInference';
import { ArkMethod } from '../../core/model/ArkMethod';
import { MethodSignature } from '../../core/model/ArkSignature';
import { ExportInfo } from '../../core/model/ArkExport';
import { ValueInference } from '../../core/inference/ValueInference';
import { Value } from '../../core/base/Value';
import { ArkAliasTypeDefineStmt, Stmt } from '../../core/base/Stmt';

export class CxxFileInference extends FileInference {
    private preprocessedProjectName: string = '';

    public preInfer(file: ArkFile): void {
        const scene = file.getScene();
        if (this.preprocessedProjectName !== scene.getProjectName()) {
            IRInference.mapCxxDeclAndImpl(scene);
            this.preprocessedProjectName = scene.getProjectName();
        }
        file.getImportInfos().filter(i => i.getExportInfo() === undefined)
            .forEach(info => this.importInfoInference.doInfer(info));
    }
}

export class CxxImportInference extends ImportInfoInference {
    public preInfer(fromInfo: ImportInfo): void {
        this.fromFile = getArkFile(fromInfo) || null;
    }

    public infer(fromInfo: ImportInfo): ExportInfo | null {
        return findExportInfo(fromInfo, this.fromFile);
    }
}

export class CxxClassInference extends ClassInference {
    public preInfer(arkClass: ArkClass): void {
        super.preInfer(arkClass);
        CxxTypeInference.inferGenericType(arkClass.getGenericsTypes(), arkClass);
        arkClass.getFields()
            .filter(p => CxxTypeInference.isUnclearType(p.getType()))
            .forEach(f => {
                const newType = CxxTypeInference.inferUnclearedType(f.getType(), arkClass);
                if (newType) {
                    f.getSignature().setType(newType);
                }
            });
    }
}

export class CxxMethodInference extends MethodInference {
    public preInfer(arkMethod: ArkMethod): void {
        CxxTypeInference.inferGenericType(arkMethod.getGenericTypes(), arkMethod.getDeclaringArkClass());
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
                    CxxTypeInference.inferParameterType(p, arkMethod);
                });
            CxxTypeInference.inferSignatureReturnType(s, arkMethod);
        });
    }
}

export class CxxStmtInference extends StmtInference {
    constructor(valueInferences: ValueInference<Value>[]) {
        super(valueInferences);
    }

    public typeSpread(stmt: Stmt, method: ArkMethod): Set<Stmt> {
        if (stmt instanceof ArkAliasTypeDefineStmt && CxxTypeInference.isUnclearType(stmt.getAliasType().getOriginalType())) {
            const originalType = stmt.getAliasTypeExpr().getOriginalType();
            if (originalType) {
                stmt.getAliasType().setOriginalType(originalType);
            }
        }
        return super.typeSpread(stmt, method);
    }
}
