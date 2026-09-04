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

import { ArkFile } from '../model/ArkFile';
import { ArkExport, ExportInfo } from '../model/ArkExport';
import {
    addSystemComponent,
    BUILDIN_SYSTEM_COMPONENT,
    COMMON_METHOD,
    COMPONENT_ATTRIBUTE,
    COMPONENT_POP_FUNCTION,
    DEFAULT_COMPONENTS,
    SCOPE_PREFIX,
} from './EtsConst';
import { GLOBAL_THIS_NAME, THIS_NAME } from './TSConst';
import { DEFAULT_ARK_METHOD_NAME, TEMP_LOCAL_PREFIX } from './Const';
import { ArkClass, ClassCategory } from '../model/ArkClass';
import { LocalSignature, MethodSignature, MethodSubSignature } from '../model/ArkSignature';
import { Local } from '../base/Local';
import { ArkMethod } from '../model/ArkMethod';
import path from 'path';
import { ClassType, VoidType } from '../base/Type';
import { AbstractFieldRef } from '../base/Ref';
import { ArkNamespace } from '../model/ArkNamespace';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { Sdk } from '../../Config';
import ts from 'ohos-typescript';
import fs from 'fs';
import { Scene } from '../../Scene';
import { SignatureCanonicalizerRegistry } from './SignatureCanonicalizerRegistry';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'SdkUtils');

const DEFAULT_ES_VERSION = 'ES2021';

export class SdkUtils {
    private static esVersion: string = DEFAULT_ES_VERSION;
    private static esVersionMap: Map<string, string> = new Map<string, string>([
        ['ES2017', 'lib.es2020.d.ts'],
        ['ES2021', 'lib.es2021.d.ts'],
    ]);

    private static sdkImportMap: Map<string, number> = new Map<string, number>();
    public static BUILT_IN_NAME = 'built-in';
    private static BUILT_IN_PATHS = ['lib/node_modules/ohos-typescript/lib', 'node_modules/ohos-typescript/lib'];

    public static setEsVersion(buildProfile: any): void {
        const products = buildProfile?.app?.products;
        let version;
        if (Array.isArray(products)) {
            const defaultProduct = products.find(p => p?.name === 'default');
            const accessChain = 'buildOption.arkOptions.tscConfig.targetESVersion';
            if (defaultProduct) {
                version = accessChain.split('.').reduce((acc, key) => acc?.[key], defaultProduct);
            }
            // Fall back to the first product with a targetESVersion
            if (!version) {
                version = products.find(product => accessChain.split('.').reduce((acc, key) => acc?.[key], product));
            }
        }
        if (!version) {
            version = DEFAULT_ES_VERSION;
        }
        if (this.esVersionMap.has(version)) {
            this.esVersion = version;
        }
    }

    public static getBuiltInSdk(): Sdk {
        let builtInPath;
        try {
            // If arkanalyzer is used as dependency by other project, the base directory should be the module path.
            const moduleRoot = path.dirname(path.dirname(require.resolve('arkanalyzer')));
            const candidatePaths = this.BUILT_IN_PATHS.map(item => path.join(moduleRoot, item));
            builtInPath = candidatePaths.find(item => fs.existsSync(item)) ?? candidatePaths[0];
            logger.debug(`arkanalyzer is used as dependency, so using builtin sdk file in ${builtInPath}.`);
        } catch {
            const candidatePaths = this.BUILT_IN_PATHS.map(item => path.resolve(item));
            builtInPath = candidatePaths.find(item => fs.existsSync(item)) ?? candidatePaths[0];
            logger.debug(`use builtin sdk file in ${builtInPath}.`);
        }
        return {
            moduleName: '',
            name: this.BUILT_IN_NAME,
            path: builtInPath,
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
        const fileSigID = file.getFileSigID();
        if (fileName.startsWith(SCOPE_PREFIX)) {
            this.sdkImportMap.set(fileName.replace(/\.d\.e?ts$/, ''), fileSigID);
        } else if (file.getName().startsWith('api')) {
            this.sdkImportMap.set(file.getName().replace(/^api[/\\]|\.d\.e?ts$/g, ''), fileSigID);
        }
    }

    public static getImportSdkFile(from: string): ArkFile | undefined {
        const fileSigID = this.sdkImportMap.get(from);
        if (fileSigID === undefined) {
            return undefined;
        }
        return SignatureCanonicalizerRegistry.getInstance().getArkFileById(fileSigID);
    }

    private static isGlobalPath(file: ArkFile): boolean {
        return !!file
            .getScene()
            .getOptions()
            .sdkGlobalFolders?.find(x => {
                if (path.isAbsolute(x)) {
                    return file.getFilePath().startsWith(x);
                } else {
                    return file.getFilePath().includes(path.sep + x + path.sep);
                }
            });
    }

    // --- 多值登记 helpers（单值视图兼容语义） ---
    // globalMap 为多值主存（名字 → 实体列表，登记序）。单值视图 = 列表 [0]：
    // appendGlobal 保持首实体不变（旧 first-win 语义）；promoteGlobal 移至头部
    //（旧 override 覆盖语义）。

    /** @internal 取名字下的首实体（单值视图语义）。 */
    private static getFirstGlobal(globalMap: Map<string, ArkExport[]>, name: string): ArkExport | undefined {
        return globalMap.get(name)?.[0];
    }

    /** @internal first-win 登记：append 到列表尾部（首实体不变）。 */
    private static appendGlobal(globalMap: Map<string, ArkExport[]>, name: string, entity: ArkExport): void {
        const list = globalMap.get(name);
        if (!list) {
            globalMap.set(name, [entity]);
            return;
        }
        if (!list.includes(entity)) {
            list.push(entity);
        }
    }

    /** @internal override 登记：移到列表头部（等价旧单值覆盖语义）。 */
    private static promoteGlobal(globalMap: Map<string, ArkExport[]>, name: string, entity: ArkExport): void {
        const list = globalMap.get(name);
        if (!list) {
            globalMap.set(name, [entity]);
            return;
        }
        const idx = list.indexOf(entity);
        if (idx >= 0) {
            list.splice(idx, 1);
        }
        list.unshift(entity);
    }

    public static loadGlobalAPI(file: ArkFile, globalMap: Map<string, ArkExport[]>): void {
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
        file.getDefaultClass()
            .getDefaultArkMethod()
            ?.getBody()
            ?.getAliasTypeMap()
            ?.forEach(a => this.loadAPI(a[0], globalMap, true));
        file.getNamespaces().forEach(ns => this.loadAPI(ns, globalMap));
    }

    public static mergeGlobalAPI(file: ArkFile, globalMap: Map<string, ArkExport[]>): void {
        if (!this.isGlobalPath(file)) {
            return;
        }
        file.getClasses().forEach(cls => {
            if (!cls.isAnonymousClass() && !cls.isDefaultArkClass()) {
                this.loadClass(globalMap, cls);
            }
        });
        // 跨文件同名 namespace 不再合并（copyNamespace 退役）：ns 实体已在阶段 1
        // 多值登记（各文件的实体共存），成员可见性由探测层承担——
        // ModelUtils.findPropertyInNamespaces 逐实体探测（%dflt locals / ns 内类 /
        // 嵌套 ns / export），成员签名归属真实声明文件。
    }

    public static loadAPI(api: ArkExport, globalMap: Map<string, ArkExport[]>, override: boolean = false): void {
        const old = this.getFirstGlobal(globalMap, api.getName());
        if (!old) {
            this.appendGlobal(globalMap, api.getName(), api);
        } else if (override) {
            logger.trace(`${old.getSignature()} is override`);
            this.promoteGlobal(globalMap, api.getName(), api);
        } else {
            // first-win（单值视图保持首实体），但后续同名实体仍多值登记（append 尾部）
            //——同名多声明（跨文件 interface 增补等）的成员探测依赖完整实体列表。
            logger.trace(`duplicated api: ${api.getSignature()}`);
            this.appendGlobal(globalMap, api.getName(), api);
        }
    }

    public static postInferredSdk(file: ArkFile, globalMap: Map<string, ArkExport[]>): void {
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

    private static loadClass(globalMap: Map<string, ArkExport[]>, cls: ArkClass): void {
        const old = this.getFirstGlobal(globalMap, cls.getName());
        if (cls === old) {
            return;
        } else if (old instanceof ArkClass && old.getDeclaringArkFile().getProjectName() === cls.getDeclaringArkFile().getProjectName()) {
            if (old.getCategory() === ClassCategory.CLASS || old.getCategory() === ClassCategory.INTERFACE) {
                // 同名 interface 跨文件增补（TS 语义为同一实体）：不再 copyMembers 灌
                // 入首实体——各文件的实体共存在多值列表（阶段1已登记），成员留在
                // 声明类，探测层逐实体查找（成员签名归属真实声明文件）。
                return;
            } else {
                // 类别冲突（旧 enum 等 vs 新 interface/class）：不再 copyMembers(old, cls)
                //——两实体共存多值（cls 提升为单值视图，与旧 delete+override 语义
                // 一致），成员探测并集可见。
                this.promoteGlobal(globalMap, cls.getName(), cls);
            }
        } else {
            this.loadAPI(cls, globalMap, true);
        }
    }

    private static loadGlobalLocal(local: Local, defaultArkMethod: ArkMethod, globalMap: Map<string, ArkExport[]>): void {
        const name = local.getName();
        local.setSignature(new LocalSignature(name, defaultArkMethod.getSignature()));
        const scene = defaultArkMethod.getDeclaringArkFile().getScene();
        if (scene.getOptions().isScanAbc) {
            const instance = this.getFirstGlobal(globalMap, name + 'Interface');
            const attr = this.getFirstGlobal(globalMap, name + COMPONENT_ATTRIBUTE);
            if (attr instanceof ArkClass && instance instanceof ArkClass) {
                // abc 场景不再 copyMembers 合并（挂载分裂来源）：attr 提升为单值视图
                //（与旧 set 语义一致），成员留在各自声明类，由探测层逐实体查找。
                this.promoteGlobal(globalMap, name, attr);
                return;
            }
        }
        const old = this.getFirstGlobal(globalMap, name);
        if (old instanceof ArkClass && local.getType() instanceof ClassType) {
            const localConstructor = this.getFirstGlobal(globalMap, (local.getType() as ClassType).getClassSignature().getClassName());
            if (localConstructor instanceof ArkClass) {
                // var 侧不再 copyMembers 灌入 interface（TS 语义本就是两个声明）：
                // local（类型即 XConstructor）登记为多值候选——探测层经它命中构造器
                // 侧实体，成员签名自然归属真实声明类。
                //（曾设 canonical 主定义实体表——"var 声明同文件 interface"规则——
                // 实测 Promise 例外（var 文件无 interface 主体）且多数场景 canonical
                // == 首实体，防御价值不抵一张表，已删。）
                this.appendGlobal(globalMap, name, local);
            } else {
                this.loadAPI(local, globalMap, true);
            }
        } else {
            this.loadAPI(local, globalMap, true);
        }
    }

    public static copyMembers(from: ArkClass, to: ArkClass): void {
        from.getMethods().forEach(method => {
            const dist = method.isStatic() ? to.getStaticMethodWithName(method.getName()) : to.getMethodWithName(method.getName());
            const distSignatures = dist?.getDeclareSignatures();
            if (distSignatures) {
                // getDeclareSignatures() returns a rebuilt copy — write the merged list back explicitly.
                const merged = [...distSignatures];
                method.getDeclareSignatures()?.forEach(x => merged.push(x));
                dist!.setDeclareSignatures(merged);
            } else if (method.getName() === DEFAULT_ARK_METHOD_NAME && dist) {
                method
                    .getBody()
                    ?.getLocals()
                    .forEach(local => dist.getBody()?.getLocals().set(local.getName(), local));
                method
                    .getBody()
                    ?.getAliasTypeMap()
                    ?.forEach(type => dist.getBody()?.getAliasTypeMap()?.set(type[0].getName(), type));
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
        const globalThis = SignatureCanonicalizerRegistry.getSdkGlobal(GLOBAL_THIS_NAME);
        if (globalThis instanceof ArkNamespace) {
            const exportInfo = new ExportInfo.Builder()
                .exportClauseName(leftOp.getFieldName())
                .arkExport(new Local(leftOp.getFieldName(), leftOp.getType()))
                .build();
            globalThis.addExportInfo(exportInfo);
        }
    }

    public static extendArkUI(scene: Scene): void {
        const cls = SignatureCanonicalizerRegistry.getSdkGlobal(COMMON_METHOD);
        if (cls instanceof ArkClass) {
            const methodSubSignature = new MethodSubSignature(COMPONENT_POP_FUNCTION, [], VoidType.getInstance(), false);
            const mtd = new ArkMethod(cls.getClassSigID(), undefined, new MethodSignature(cls.getClassSigID(), methodSubSignature));
            mtd.setIsGeneratedFlag(true);
            cls.addMethod(mtd);
        }
        if (BUILDIN_SYSTEM_COMPONENT.size < DEFAULT_COMPONENTS.length) {
            addSystemComponent(DEFAULT_COMPONENTS);
            logger.error('System component not found, fall back to default component. Please check sdk setting.');
        }
    }

    public static loadSystemComponentsFromSdk(sdkPath: string): void {
        const componentsDir = path.join(sdkPath, 'build-tools', 'ets-loader', 'components');
        if (!fs.existsSync(componentsDir)) {
            return;
        }
        const componentFiles = fs.readdirSync(componentsDir).filter(file => file.endsWith('.json'));
        const componentNames: string[] = [];
        componentFiles.forEach(file => {
            const filePath = path.join(componentsDir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const componentData = JSON.parse(content);
                if (componentData && typeof componentData.name === 'string') {
                    componentNames.push(componentData.name);
                }
            } catch (error) {
                logger.error(`Failed to parse component file: ${filePath}`, error);
            }
        });
        if (componentNames.length > 0) {
            addSystemComponent(componentNames);
        }
    }
}
