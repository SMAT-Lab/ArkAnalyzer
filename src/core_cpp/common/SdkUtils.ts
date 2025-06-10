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

import { ArkFile } from '../model/ArkFile';
import { ArkExport, ExportInfo } from '../model/ArkExport';
import { COMPONENT_ATTRIBUTE } from './EtsConst';
import { GLOBAL_THIS_NAME, THIS_NAME } from './TSConst';
import { TEMP_LOCAL_PREFIX } from './Const';
import { ArkClass, ClassCategory } from '../model/ArkClass';
import { LocalSignature } from '../model/ArkSignature';
import { ModelUtils } from './ModelUtils';
import { Local } from '../base/Local';
import { ArkMethod } from '../model/ArkMethod';
import path from 'path';
import { ClassType } from '../base/Type';
import { AbstractFieldRef } from '../base/Ref';
import { ArkNamespace } from '../model/ArkNamespace';
import { TypeInference } from './TypeInference';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'SdkUtils');

export class SdkUtils {

    private static sdkImportMap: Map<string, ArkFile> = new Map<string, ArkFile>();

    public static buildSdkImportMap(file: ArkFile): void {
        const fileName = path.basename(file.getName());
        if (fileName.startsWith('@')) {
            this.sdkImportMap.set(fileName.replace(/\.d\.e?ts$/, ''), file);
        }
    }

    public static getImportSdkFile(from: string): ArkFile | undefined {
        return this.sdkImportMap.get(from);
    }

    public static buildGlobalMap(file: ArkFile, globalMap: Map<string, ArkExport>): void {
        const isGlobalPath = file
            .getScene()
            .getOptions()
            .sdkGlobalFolders?.find(x => file.getFilePath().includes(path.sep + x + path.sep));
        if (!isGlobalPath) {
            return;
        }
        ModelUtils.getAllClassesInFile(file).forEach(cls => {
            if (!cls.isAnonymousClass() && !cls.isDefaultArkClass()) {
                SdkUtils.loadClass(globalMap, cls);
            }
            if (cls.isDefaultArkClass()) {
                cls.getMethods()
                    .filter(mtd => !mtd.isDefaultArkMethod() && !mtd.isAnonymousMethod())
                    .forEach(mtd => globalMap.set(mtd.getName(), mtd));
            }
        });
        const defaultArkMethod = file.getDefaultClass().getDefaultArkMethod();
        if (defaultArkMethod) {
            TypeInference.inferTypeInMethod(defaultArkMethod);
        }
        defaultArkMethod
            ?.getBody()
            ?.getLocals()
            .forEach(local => {
                const name = local.getName();
                if (name !== THIS_NAME && !name.startsWith(TEMP_LOCAL_PREFIX)) {
                    this.loadGlobalLocal(local, defaultArkMethod, globalMap);
                }
            });
        defaultArkMethod
            ?.getBody()
            ?.getAliasTypeMap()
            ?.forEach(a => globalMap.set(a[0].getName(), a[0]));
        ModelUtils.getAllNamespacesInFile(file).forEach(ns => globalMap.set(ns.getName(), ns));
    }

    private static loadClass(globalMap: Map<string, ArkExport>, cls: ArkClass): void {
        const old = globalMap.get(cls.getName());
        if (old instanceof ArkClass && old.getDeclaringArkFile().getProjectName() === cls.getDeclaringArkFile().getProjectName()) {
            if (old.getCategory() === ClassCategory.CLASS) {
                this.copyMembers(cls, old);
            } else {
                this.copyMembers(old, cls);
                globalMap.delete(cls.getName());
                globalMap.set(cls.getName(), cls);
            }
        } else {
            if (old) {
                logger.error(`${old.getSignature()} is override`);
            }
            globalMap.set(cls.getName(), cls);
        }
    }

    private static loadGlobalLocal(local: Local, defaultArkMethod: ArkMethod, globalMap: Map<string, ArkExport>): void {
        const name = local.getName();
        local.setSignature(new LocalSignature(name, defaultArkMethod.getSignature()));
        const scene = defaultArkMethod.getDeclaringArkFile().getScene();
        if (scene.getOptions().isScanAbc) {
            const instance = globalMap.get(name + 'Interface');
            const attr = globalMap.get(name + COMPONENT_ATTRIBUTE);
            if (attr instanceof ArkClass && instance instanceof ArkClass) {
                this.copyMembers(instance, attr);
                globalMap.set(name, attr);
                return;
            }
        }
        const old = globalMap.get(name);
        if (!old) {
            globalMap.set(name, local);
        } else if (old instanceof ArkClass && local.getType() instanceof ClassType) {
            const localConstructor = scene.getClass((local.getType() as ClassType).getClassSignature());
            if (localConstructor) {
                this.copyMembers(localConstructor, old);
            }
        }
    }

    private static copyMembers(from: ArkClass, to: ArkClass): void {
        from.getMethods().forEach(method => {
            const dist = method.isStatic() ? to.getStaticMethodWithName(method.getName()) : to.getMethodWithName(method.getName());
            const distSignatures = dist?.getDeclareSignatures();
            if (distSignatures) {
                method.getDeclareSignatures()?.forEach(x => distSignatures.push(x));
            } else {
                to.addMethod(method);
            }
        });
        from.getFields().forEach(field => {
            const dist = field.isStatic() ? to.getStaticFieldWithName(field.getName()) : to.getFieldWithName(field.getName());
            if (!dist) {
                to.addField(field);
            }
        });
    }

    public static computeGlobalThis(leftOp: AbstractFieldRef, arkMethod: ArkMethod): void {
        const globalThis = arkMethod.getDeclaringArkFile().getScene().getSdkGlobal(GLOBAL_THIS_NAME);
        if (globalThis instanceof ArkNamespace) {
            const exportInfo = new ExportInfo.Builder()
                .exportClauseName(leftOp.getFieldName())
                .arkExport(new Local(leftOp.getFieldName(), leftOp.getType()))
                .build();
            globalThis.addExportInfo(exportInfo);
        }
    }
}
