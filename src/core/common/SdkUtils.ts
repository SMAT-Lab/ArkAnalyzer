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
import { Local } from '../base/Local';
import { ArkMethod } from '../model/ArkMethod';
import path from 'path';
import { ClassType } from '../base/Type';
import { AbstractFieldRef } from '../base/Ref';
import { ArkNamespace } from '../model/ArkNamespace';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { Sdk } from '../../Config';
import ts from 'ohos-typescript';
import fs from 'fs';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'SdkUtils');

export class SdkUtils {
    private static esVersion: string = 'ES2017';
    private static esVersionMap: Map<string, string> = new Map<string, string>([
        ['ES2017', 'lib.es2020.d.ts'],
        ['ES2021', 'lib.es2021.d.ts']
    ]);

    private static sdkImportMap: Map<string, ArkFile> = new Map<string, ArkFile>();
    public static BUILT_IN_NAME = 'built-in';
    private static BUILT_IN_PATH = 'node_modules/ohos-typescript/lib';

    public static setEsVersion(buildProfile: any): void {
        const accessChain = 'buildOption.arkOptions.tscConfig.targetESVersion';
        const version = accessChain.split('.').reduce((acc, key) => acc?.[key], buildProfile);
        if (version && this.esVersionMap.has(version)) {
            this.esVersion = version;
        }
    }

    public static getBuiltInSdk(): Sdk {
        let builtInPath;
        try {
            // If arkanalyzer is used as dependency by other project, the base directory should be the module path.
            const moduleRoot = path.dirname(path.dirname(require.resolve('arkanalyzer')));
            builtInPath = path.join(moduleRoot, this.BUILT_IN_PATH);
            logger.debug(`arkanalyzer is used as dependency, so using builtin sdk file in ${builtInPath}.`);
        } catch {
            builtInPath = path.resolve(this.BUILT_IN_PATH);
            logger.debug(`use builtin sdk file in ${builtInPath}.`);
        }
        return {
            moduleName: '',
            name: this.BUILT_IN_NAME,
            path: builtInPath
        };
    }

    public static fetchBuiltInFiles(builtInPath: string): string[] {
        const filePath = path.resolve(builtInPath, this.esVersionMap.get(this.esVersion) ?? '');
        if (!fs.existsSync(filePath)) {
            logger.error(`built in directory ${filePath} is not exist, please check!`);
            return [];
        }
        const result = new Set<string>();
        this.dfsFiles(filePath, result);
        return Array.from(result);
    }

    private static dfsFiles(filePath: string, files: Set<string>): void {
        const sourceFile = ts.createSourceFile(filePath, fs.readFileSync(filePath, 'utf8'), ts.ScriptTarget.Latest);
        const references = sourceFile.libReferenceDirectives;
        references.forEach(ref => {
            this.dfsFiles(path.join(path.dirname(filePath), `lib.${ref.fileName}.d.ts`), files);
        });
        files.add(filePath);
    }

    /*
     * Set static field to be null, then all related objects could be freed by GC.
     * Class SdkUtils is only internally used by ArkAnalyzer type inference, the dispose method should be called at the end of type inference.
     */
    public static dispose(): void {
        this.sdkImportMap.clear();
    }

    public static buildSdkImportMap(file: ArkFile): void {
        const fileName = path.basename(file.getName());
        if (fileName.startsWith('@')) {
            this.sdkImportMap.set(fileName.replace(/\.d\.e?ts$/, ''), file);
        }
    }

    public static getImportSdkFile(from: string): ArkFile | undefined {
        return this.sdkImportMap.get(from);
    }

    private static isGlobalPath(file: ArkFile): boolean {
        return !!file.getScene().getOptions().sdkGlobalFolders?.find(x => {
            if (path.isAbsolute(x)) {
                return file.getFilePath().startsWith(x);
            } else {
                return file.getFilePath().includes(path.sep + x + path.sep);
            }
        });
    }

    public static loadGlobalAPI(file: ArkFile, globalMap: Map<string, ArkExport>): void {
        if (!this.isGlobalPath(file)) {
            return;
        }
        file.getClasses().forEach(cls => {
            if (!cls.isAnonymousClass() && !cls.isDefaultArkClass()) {
                this.loadAPI(cls, globalMap);
            }
            if (cls.isDefaultArkClass()) {
                cls.getMethods()
                    .filter(mtd => !mtd.isDefaultArkMethod() && !mtd.isAnonymousMethod())
                    .forEach(mtd => this.loadAPI(mtd, globalMap));
            }
        });
        file.getDefaultClass().getDefaultArkMethod()
            ?.getBody()
            ?.getAliasTypeMap()
            ?.forEach(a => this.loadAPI(a[0], globalMap, true));
        file.getNamespaces().forEach(ns => this.loadAPI(ns, globalMap));
    }

    public static mergeGlobalAPI(file: ArkFile, globalMap: Map<string, ArkExport>): void {
        if (!this.isGlobalPath(file)) {
            return;
        }
        file.getClasses().forEach(cls => {
            if (!cls.isAnonymousClass() && !cls.isDefaultArkClass()) {
                this.loadClass(globalMap, cls);
            }
        });
    }

    public static loadAPI(api: ArkExport, globalMap: Map<string, ArkExport>, override: boolean = false): void {
        const old = globalMap.get(api.getName());
        if (!old) {
            globalMap.set(api.getName(), api);
        } else if (override) {
            logger.trace(`${old.getSignature()} is override`);
            globalMap.set(api.getName(), api);
        } else {
            logger.trace(`duplicated api: ${api.getSignature()}`);
        }
    }

    public static postInferredSdk(file: ArkFile, globalMap: Map<string, ArkExport>): void {
        if (!this.isGlobalPath(file)) {
            return;
        }
        const defaultArkMethod = file.getDefaultClass().getDefaultArkMethod();
        defaultArkMethod
            ?.getBody()
            ?.getLocals()
            .forEach(local => {
                const name = local.getName();
                if (name !== THIS_NAME && !name.startsWith(TEMP_LOCAL_PREFIX)) {
                    this.loadGlobalLocal(local, defaultArkMethod, globalMap);
                }
            });
    }

    private static loadClass(globalMap: Map<string, ArkExport>, cls: ArkClass): void {
        const old = globalMap.get(cls.getName());
        if (cls === old) {
            return;
        } else if (old instanceof ArkClass && old.getDeclaringArkFile().getProjectName() === cls.getDeclaringArkFile().getProjectName()) {
            if (old.getCategory() === ClassCategory.CLASS || old.getCategory() === ClassCategory.INTERFACE) {
                this.copyMembers(cls, old);
            } else {
                this.copyMembers(old, cls);
                globalMap.delete(cls.getName());
                this.loadAPI(cls, globalMap, true);
            }
        } else {
            this.loadAPI(cls, globalMap, true);
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
        if (old instanceof ArkClass && local.getType() instanceof ClassType) {
            const localConstructor = globalMap.get((local.getType() as ClassType).getClassSignature().getClassName());
            if (localConstructor instanceof ArkClass) {
                this.copyMembers(localConstructor, old);
            } else {
                this.loadAPI(local, globalMap, true);
            }
        } else {
            this.loadAPI(local, globalMap, true);
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
