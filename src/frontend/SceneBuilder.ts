/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import fs from 'fs';
import path from 'path';
import { SceneConfig, TsConfig } from '../Config';
import { Scene } from '../Scene';
import { ArkFile, Language } from '../core/model/ArkFile';
import { ArkMethod } from '../core/model/ArkMethod';
import { FileSignature } from '../core/model/ArkSignature';
import { ImportInfo } from '../core/model/ArkImport';
import { ExportInfo } from '../core/model/ArkExport';
import { ModuleScene } from './ModuleScene';
import { FrontendBuilder } from './FrontendBuilder';
import { ArktsFrontend } from './arktsFrontend/ArktsFrontend';
import { ModuleUtils } from '../utils/ModuleUtils';
import { fetchDependenciesFromFile, parseJsonText } from '../utils/json5parser';
import { getAllFiles } from '../utils/getAllFiles';
import { FileUtils, getFileRecursively } from '../utils/FileUtils';
import { ALL, CONSTRUCTOR_NAME, TSCONFIG_JSON } from '../core/common/TSConst';
import { BUILD_PROFILE_JSON5, OH_MODULES, OH_PACKAGE_JSON5 } from '../core/common/EtsConst';
import { SdkUtils } from '../core/common/SdkUtils';
import { ModelUtils } from '../core/common/ModelUtils';
import { InferenceManager } from '../core/inference/Inference';
import { addInitInConstructor, buildDefaultConstructor, replaceSuper2Constructor } from '../core/model/builder/ArkMethodBuilder';
import { addInitInConstructor as addCxxInitInConstructor } from './cppFrontend/model/builder/ArkMethodBuilder';
import { SignatureCanonicalizerRegistry } from '../core/common/SignatureCanonicalizerRegistry';
import { SceneBuildStage } from './SceneBuildStage';
import { StageName } from '../statistics/StageStatistics';
import Logger, { LOG_MODULE_TYPE } from '../utils/logger';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'SceneBuilder');

/**
 * 完整构建路径的一次性构建上下文（BuildContext）。
 *
 * P2 迁移（frontend 化）：承接原先散落在 Scene 上的构建机械与构建期工作态——
 * 配置解析族（build-profile / oh-package / tsconfig）与 project 文件 DFS 族
 * （getDependencyFilesDeeply 及全部依赖发现辅助）。
 *
 * 生命周期：由 Scene 在构建入口创建并持有（scene.activeBuilder），构建结束由
 * 入口方法释放（置 undefined）——工作态随本实例被 GC 回收，不再驻留 Scene。
 * Scene 仅保留构建产物（builtFileOrder / moduleScenesMap / overRides / 失败文件
 * 摘要等）与查询侧状态。
 *
 * 注意：本类不承载模块化增量路径（analyseByModule/loadModule 走 ModuleBuilder，
 * 其构建态常驻 Scene，不受本上下文生命周期影响）。
 */
export class SceneBuilder {
    private readonly scene: Scene;
    private readonly sceneConfig: SceneConfig;
    private readonly registry: SignatureCanonicalizerRegistry;

    // --- 构建期工作态（构建结束随本实例回收，不回填 Scene）---

    /** oh-package.json5 内容表（绝对路径 → 内容），依赖解析（parseFrom 族）的输入。 */
    private ohPkgContentMap: Map<string, { [k: string]: unknown }> = new Map();
    private ohPkgFilePath: string = '';
    private ohPkgContent: { [k: string]: unknown } = {};
    /** tsconfig paths 映射（import 名 → 候选路径），DFS 的 tsconfig 依赖发现输入。 */
    private globalModule2PathMapping?: { [k: string]: string[] };
    private baseUrl?: string;
    /**
     * 构建失败/进行中文件集。直接复用 Scene 的集合引用（同一 Set）：
     * DFS 期间作防环工作集（成功文件 delete、失败文件残留），构建结束后
     * Scene.getUnhandledFilePaths() 恰好暴露失败文件摘要。
     */
    private readonly unhandledFilePaths: Set<string>;
    /**
     * from → 直接解析出的物理文件路径列表（性能缓存）。key 精确对齐
     * {@link getOriginPath} 的解析语义：相对形式（`./`、`../`）带声明文件
     * 所在目录前缀（`dirname + '\x00' + from`——同目录文件的相同相对 from
     * 才允许共享）；模块名形式（`@ohos/xxx`、裸名）用 from 本身（解析只走
     * ohPkgContentMap / projectDir / tsconfig 全局映射，与声明文件位置无关）。
     * 空数组也缓存（负缓存——解析失败的 from 原先每次都要走完全部分支才失败）。
     * **只缓存纯函数结果（from → paths），绝不缓存"文件要不要构建"的决策**——
     * 后者依赖 filesMap/unhandledFilePaths 等可变状态，命中后必须逐个经
     * {@link getDependencyFilesDeeply} 的三重防重入入口重新仲裁。
     */
    private fromResolutionCache: Map<string, string[]> = new Map();
    /**
     * 解析产出收集栈（嵌套隔离）：parseFrom 未命中时 push 新槽，嵌套递归构建
     * 触发的 parseFrom 各归各的槽；pop 时整槽写入 fromResolutionCache——
     * 条目只含该 from 的"直接"产出，不含递归依赖自身的解析结果。
     */
    private fromResolutionStack: string[][] = [];
    /**
     * inner oh-package 内容缓存（兜底）：不同 from 首次解析触达同一 inner
     * oh-package 的残余重复读盘。独立于 ohPkgContentMap——后者正被
     * for...of 遍历，遍历中插入 key 会改变迭代行为（JS Map 迭代可见新增项）。
     */
    private resolvedOhPkgCache: Map<string, { [k: string]: unknown }> = new Map();

    constructor(scene: Scene, sceneConfig: SceneConfig) {
        this.scene = scene;
        this.sceneConfig = sceneConfig;
        this.registry = SignatureCanonicalizerRegistry.getInstance();
        this.unhandledFilePaths = scene.getUnhandledFileSet();
    }

    // --- 配置解析族（原 Scene.parseBuildProfile / parseOhPackage / tsconfig 族 / buildOhPkgContentMap）---

    /**
     * 解析项目配置：build-profile.json5（ES 版本 + 模块表）、oh-package.json5
     * （含 overrides）、tsconfig（paths/baseUrl，extends 链递归）、模块 oh-package 表，
     * 最后生成模块映射（ModuleUtils.generateModuleMap）。
     */
    public parseProjectConfigs(): void {
        this.scene.getStageStatisticsCollector()?.startStage(StageName.BuilderParseConfigs);
        this.parseBuildProfile();
        this.parseOhPackage();
        const tsConfigOption: string = this.scene.getOptions().tsconfig ?? TSCONFIG_JSON;
        const tsConfigFilePath = path.join(this.sceneConfig.getTargetProjectDirectory(), tsConfigOption);
        if (fs.existsSync(tsConfigFilePath)) {
            const tsConfigObj: TsConfig = fetchDependenciesFromFile(tsConfigFilePath);
            this.findTsConfigInfoDeeply(tsConfigObj, tsConfigFilePath);
        } else {
            logger.warn('This project has no tsconfig.json!');
        }
        this.buildOhPkgContentMap();
        ModuleUtils.generateModuleMap(this.ohPkgContentMap);
        // 配置产物快照回填（tsconfig paths/baseUrl 构建后仍可查询）。
        this.scene.setTsConfigSnapshot(this.globalModule2PathMapping, this.baseUrl);
        this.scene.getStageStatisticsCollector()?.endStage(StageName.BuilderParseConfigs);
    }

    /** @internal 供 Scene.buildBasicInfo 的 SDK 阶段读取（P3 迁移后内化）。 */
    public getOhPkgContentMap(): Map<string, { [k: string]: unknown }> {
        return this.ohPkgContentMap;
    }

    /** @internal 追加模块 oh-package 内容（Scene.buildModuleScene 的依赖解析输入，P3 迁移后内化）。 */
    public addOhPkgContent(ohPkgFilePath: string, content: { [k: string]: unknown }): void {
        this.ohPkgContentMap.set(ohPkgFilePath, content);
    }

    /** @internal tsconfig baseUrl（构建期值；仅在活跃构建上下文中可查）。 */
    public getBaseUrl(): string | undefined {
        return this.baseUrl;
    }

    private parseBuildProfile(): void {
        const buildProfile = path.join(this.scene.getRealProjectDir(), BUILD_PROFILE_JSON5);
        if (fs.existsSync(buildProfile)) {
            let configurationsText: string;
            try {
                configurationsText = fs.readFileSync(buildProfile, 'utf-8');
            } catch (error) {
                logger.error(`Error reading file: ${error}`);
                return;
            }
            const buildProfileJson = parseJsonText(configurationsText);
            SdkUtils.setEsVersion(buildProfileJson);
            const modules = buildProfileJson.modules;
            if (modules instanceof Array) {
                modules.forEach(module => {
                    this.scene.getModulePath2NameMap().set(path.resolve(this.scene.getRealProjectDir(), path.join(module.srcPath)), module.name);
                });
            }
        } else {
            logger.warn('There is no build-profile.json5 for this project.');
        }
    }

    private parseOhPackage(): void {
        const OhPkgFilePath = path.join(this.scene.getRealProjectDir(), OH_PACKAGE_JSON5);
        if (fs.existsSync(OhPkgFilePath)) {
            this.ohPkgFilePath = OhPkgFilePath;
            this.ohPkgContent = fetchDependenciesFromFile(this.ohPkgFilePath);
            this.ohPkgContentMap.set(OhPkgFilePath, this.ohPkgContent);
            if (this.ohPkgContent.overrides) {
                let overRides = this.ohPkgContent.overrides as { [k: string]: unknown };
                for (const [key, value] of Object.entries(overRides)) {
                    this.scene.getOverRides().set(key, value as string);
                }
            }
            if (this.ohPkgContent.overrideDependencyMap) {
                let globalOverRideDependencyMap = this.ohPkgContent.overrideDependencyMap as { [k: string]: unknown };
                for (const [key, value] of Object.entries(globalOverRideDependencyMap)) {
                    let globalDependency = fetchDependenciesFromFile(value as string);
                    this.scene.getOverRideDependencyMap().set(key, globalDependency);
                }
            }
        } else {
            logger.warn('This project has no oh-package.json5!');
        }
        // 配置产物快照回填（对齐 setTsConfigSnapshot 模式）：根 oh-package 内容在
        // 构建结束后仍可经 Scene.getOhPkgContent() 查询（构建期上下文已释放）。
        this.scene.setOhPkgContentSnapshot(this.ohPkgContent);
    }

    private findTsConfigInfoDeeply(tsConfigObj: TsConfig, tsConfigFilePath: string): void {
        if (tsConfigObj.extends) {
            const extTsConfigFilePath = path.join(path.dirname(tsConfigFilePath), tsConfigObj.extends);
            const extTsConfigObj: TsConfig = fetchDependenciesFromFile(extTsConfigFilePath);
            this.findTsConfigInfoDeeply(extTsConfigObj, extTsConfigFilePath);
            if (!this.baseUrl && !this.globalModule2PathMapping) {
                this.addTsConfigInfo(extTsConfigObj);
            }
        }
        if (!this.baseUrl && !this.globalModule2PathMapping) {
            this.addTsConfigInfo(tsConfigObj);
        }
    }

    private addTsConfigInfo(tsConfigObj: TsConfig): void {
        if (tsConfigObj.compilerOptions && tsConfigObj.compilerOptions.paths) {
            const paths = tsConfigObj.compilerOptions.paths;
            if (paths) {
                this.globalModule2PathMapping = paths;
            }
        }
        if (tsConfigObj.compilerOptions && tsConfigObj.compilerOptions.baseUrl) {
            this.baseUrl = tsConfigObj.compilerOptions.baseUrl;
        }
    }

    private buildOhPkgContentMap(): void {
        this.scene.getModulePath2NameMap().forEach((value, key) => {
            const moduleOhPkgFilePath = path.resolve(key, OH_PACKAGE_JSON5);
            if (fs.existsSync(moduleOhPkgFilePath)) {
                const moduleOhPkgContent = fetchDependenciesFromFile(moduleOhPkgFilePath);
                this.ohPkgContentMap.set(moduleOhPkgFilePath, moduleOhPkgContent);
            }
        });
    }

    // --- project 文件 DFS 族（原 Scene.getDependencyFilesDeeply 及依赖发现辅助）---

    /**
     * 对每个 projectFile 执行 {@link getDependencyFilesDeeply}（DFS）：
     * 完整构建自己（intern FileSigID）→ 递归拉入 import/export 依赖 → 全部依赖
     * 完成后 setFile。**setFile 后序 = 严格拓扑序**（被依赖者在前），由 Scene 的
     * builtFileOrder 记录，推断期按其正序遍历即零排序。
     */
    public buildProjectFiles(): void {
        this.scene.getStageStatisticsCollector()?.startStage(StageName.BuilderFiles);
        for (const projectFile of this.sceneConfig.getProjectFiles()) {
            this.getDependencyFilesDeeply(projectFile);
            this.scene.getStageStatisticsCollector()?.recordMemoryCheckpoint();
        }
        this.scene.getStageStatisticsCollector()?.endStage(StageName.BuilderFiles);
    }

    public getDependencyFilesDeeply(projectFile: string): void {
        if (!this.scene.getOptions().supportFileExts!.includes(path.extname(projectFile))) {
            return;
        }
        // 范围守卫：只构建/递归项目目录内的文件。越界文件（tsconfig paths、ohpkg
        // 外部链等解析出的绝对路径）不属本 Scene 的 project 文件——其
        // FileSignature 将产生 "../../../xxx" 畸形相对名，且目录扫描原生语义
        // 本就只覆盖项目目录。
        const relativeToProject = path.relative(this.scene.getRealProjectDir(), projectFile);
        if (relativeToProject.startsWith('..') || path.isAbsolute(relativeToProject)) {
            return;
        }
        const fileSignature = new FileSignature(this.scene.getProjectName(), relativeToProject);
        const existingId = this.registry.fileSigCanonicalizer.getExistingId(fileSignature);
        // 注意：早退基于全局 registry model（单 Scene 单次构建生命周期下 registry
        // 内条目均属本次构建）。共享 registry 的二次构建为不支持场景——不做
        // 场景归属判定适配；遇该场景的测试应自行 dispose 隔离。
        if (
            (existingId !== -1 && this.registry.fileSigCanonicalizer.getModel(existingId) !== undefined) ||
            this.isRepeatBuildFile(projectFile) ||
            this.unhandledFilePaths.has(projectFile)
        ) {
            return;
        }
        // Here use unhandledFilePaths to temporarily store current file until add it to fileMaps to avoid recursively import issue.
        this.unhandledFilePaths.add(projectFile);
        try {
            const arkFile = new ArkFile(FileUtils.getFileLanguage(projectFile, this.scene.getFileLanguages()));
            arkFile.setScene(this.scene);
            FrontendBuilder.buildProjectFileIntoArkFile(this.scene, projectFile, arkFile);
            for (const [modulePath, moduleName] of this.scene.getModulePath2NameMap()) {
                if (arkFile.getFilePath().startsWith(modulePath)) {
                    this.addArkFile2ModuleScene(modulePath, moduleName, arkFile);
                    break;
                }
            }
            const importInfos = arkFile.getImportInfos();
            const repeatFroms: string[] = [];
            this.findDependencyFiles(importInfos, arkFile, repeatFroms);

            const exportInfos = arkFile.getExportInfos();
            this.findDependencyFiles(exportInfos, arkFile, repeatFroms);

            // add currently file to files map after adding all its dependencies, and remove it from unhandledFilePaths
            this.scene.setFile(arkFile);
            this.unhandledFilePaths.delete(projectFile);
        } catch (error) {
            logger.error('Error parsing file:', projectFile, error);
            return;
        }
    }

    private isRepeatBuildFile(projectFile: string): boolean {
        const relativePath = path.relative(this.scene.getRealProjectDir(), projectFile);
        if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
            const fileSig = new FileSignature(this.scene.getProjectName(), relativePath);
            const id = this.registry.fileSigCanonicalizer.getExistingId(fileSig);
            return id !== -1 && this.registry.fileSigCanonicalizer.getModel(id) !== undefined;
        }
        return false;
    }

    private addArkFile2ModuleScene(modulePath: string, moduleName: string, arkFile: ArkFile): void {
        const moduleScenesMap = this.scene.getModuleSceneMap();
        if (moduleScenesMap.has(moduleName)) {
            let curModuleScene = moduleScenesMap.get(moduleName);
            if (curModuleScene) {
                curModuleScene.addArkFile(arkFile);
                arkFile.setModuleScene(curModuleScene);
            }
        } else {
            let moduleScene = new ModuleScene(this.scene);
            moduleScene.ModuleScenePartiallyBuilder(moduleName, modulePath);
            moduleScene.addArkFile(arkFile);
            moduleScenesMap.set(moduleName, moduleScene);
            arkFile.setModuleScene(moduleScene);
        }
    }

    private findDependencyFiles(importOrExportInfos: ImportInfo[] | ExportInfo[], arkFile: ArkFile, repeatFroms: string[]): void {
        for (const importOrExportInfo of importOrExportInfos) {
            const from = importOrExportInfo.getFrom();
            if (from && !repeatFroms.includes(from)) {
                this.parseFrom(from, arkFile);
                repeatFroms.push(from);
            }
        }
    }

    private parseFrom(from: string, arkFile: ArkFile): void {
        // from 解析缓存（性能优化，行为等价）：相同 (上下文, from) 的定位链
        // （全量 ohPkgContentMap 遍历 + existsSync + 目录枚举 + 可能的 JSON5
        // 读盘）只执行一次，重复 from 以 O(1) Map 查找复用解析结果。键设计
        // 对齐 getOriginPath 的语义（相对 from 依赖声明文件目录，模块名形式
        // 全项目一致）——勿改动该判定正则。命中后必须逐个经
        // getDependencyFilesDeeply 重新仲裁（不缓存构建决策，防 disposeModule
        // 等状态变化下静默丢构建）。
        const isRelative = /^\.{1,2}\//.test(from);
        const cacheKey = isRelative ? path.dirname(arkFile.getFilePath()) + '\x00' + from : from;
        const cached = this.fromResolutionCache.get(cacheKey);
        if (cached) {
            for (const resolvedPath of cached) {
                this.getDependencyFilesDeeply(resolvedPath);
            }
            return;
        }
        const resolvedPaths: string[] = [];
        this.fromResolutionStack.push(resolvedPaths);
        try {
            // —— 以下为原有三分支逻辑，逐字保留，不做任何修改 ——
            if (/^@[a-z|\-]+?\/?/.test(from) || /^[a-z][a-z0-9._-]*[a-z0-9]$/.test(from)) {
                // TODO: if there are more than one modules with the same name e.g. @lib1, here may got the wrong dependency
                // It is better to loop all oh pkg with priority rather than the map key order. But it should be very complicated.
                // Currently it is ok because it's with low probability and order error only affects type accuracy but has no other impact.
                for (const [ohPkgContentPath, ohPkgContent] of this.ohPkgContentMap) {
                    this.findDependenciesByOhPkg(ohPkgContentPath, ohPkgContent, from);
                }
            } else if (/^([^@]*\/)([^\/]*)$/.test(from) || /^[\.\./|\.\.]+$/.test(from)) {
                this.findRelativeDependenciesByOhPkg(from, arkFile);
            } else if (/^[@a-zA-Z0-9]+(\/[a-zA-Z0-9]+)*$/.test(from)) {
                this.findDependenciesByTsConfig(from);
            }
            // —— 原有逻辑结束 ——
        } finally {
            this.fromResolutionStack.pop();
        }
        this.fromResolutionCache.set(cacheKey, resolvedPaths);
    }

    private findDependenciesByTsConfig(from: string): void {
        if (this.globalModule2PathMapping) {
            const paths: { [k: string]: string[] } = this.globalModule2PathMapping;
            Object.keys(paths).forEach(key => this.parseTsConfigParms(paths, key, from));
        }
    }

    private parseTsConfigParms(paths: { [k: string]: string[] }, key: string, from: string): void {
        const module2pathMapping = paths[key];
        if (key.includes(ALL)) {
            this.processFuzzyMapping(key, from, module2pathMapping);
        } else if (from.startsWith(key)) {
            let tail = from.substring(key.length, from.length);
            module2pathMapping.forEach(pathMapping => {
                let originPath = path.join(this.scene.getRealProjectDir(), pathMapping, tail);
                if (this.baseUrl) {
                    originPath = path.resolve(this.baseUrl, originPath);
                }
                this.findDependenciesByRule(originPath);
            });
        }
    }

    private processFuzzyMapping(key: string, from: string, module2pathMapping: string[]): void {
        key = key.substring(0, key.indexOf(ALL) - 1);
        if (from.substring(0, key.indexOf(ALL) - 1) === key) {
            let tail = from.substring(key.indexOf(ALL) - 1, from.length);
            module2pathMapping.forEach(pathMapping => {
                pathMapping = pathMapping.substring(0, pathMapping.indexOf(ALL) - 1);
                let originPath = path.join(this.scene.getRealProjectDir(), pathMapping, tail);
                if (this.baseUrl) {
                    originPath = path.join(this.baseUrl, originPath);
                }
                this.findDependenciesByRule(originPath);
            });
        }
    }

    private findDependenciesByRule(originPath: string): void {
        if (!this.findFilesByPathArray(originPath) && !this.findFilesByExtNameArray(originPath, this.scene.getOptions().supportFileExts!)) {
            logger.trace(originPath + 'module mapperInfo is not found!');
        }
    }

    private findFilesByPathArray(originPath: string): boolean {
        if (!fs.existsSync(originPath)) {
            return false;
        }
        const dirname = path.dirname(originPath);
        const indexFileName = FileUtils.getIndexFileName(dirname);
        if (indexFileName === '') {
            return false;
        }
        const curPath = path.join(dirname, indexFileName);
        if (!this.isRepeatBuildFile(curPath)) {
            this.addFileNode2DependencyGrap(curPath);
            return true;
        }
        return false;
    }

    private findFilesByExtNameArray(originPath: string, pathArray: string[]): boolean {
        for (const pathInfo of pathArray) {
            const curPath = originPath + pathInfo;
            if (fs.existsSync(curPath) && !this.isRepeatBuildFile(curPath)) {
                this.addFileNode2DependencyGrap(curPath);
                return true;
            }
        }
        return false;
    }

    private findRelativeDependenciesByOhPkg(from: string, arkFile: ArkFile): void {
        //relative path ../from  ./from
        //order
        //1. ../from/oh-package.json5 -> [[name]] -> overRides/overRideDependencyMap? ->
        //[[main]] -> file path ->dependencies(priority)+devDependencies? dynamicDependencies(not support) ->
        //key overRides/overRideDependencyMap?
        //2. ../from/index.ets(ts)
        //3. ../from/index.d.ets(ts)
        //4. ../from.ets(ts)
        //5. ../from.d.ets(ts)
        //2.3.4.5 random order
        let originPath = this.getOriginPath(from, arkFile);
        if (fs.existsSync(path.join(originPath, OH_PACKAGE_JSON5))) {
            for (const [ohPkgContentPath, ohPkgContent] of this.ohPkgContentMap) {
                this.findDependenciesByOhPkg(ohPkgContentPath, ohPkgContent, from);
            }
        }
        this.findDependenciesByRule(originPath);
    }

    private findDependenciesByOhPkg(
        ohPkgContentPath: string,
        ohPkgContentInfo: {
            [k: string]: unknown;
        },
        from: string
    ): void {
        //module name @ohos/from
        const ohPkgContent: { [k: string]: unknown } | undefined = ohPkgContentInfo;
        //module main name is must be
        if (ohPkgContent && ohPkgContent.name && from.startsWith(ohPkgContent.name.toString())) {
            let originPath = ohPkgContentPath.toString().replace(OH_PACKAGE_JSON5, '');
            if (ohPkgContent.main) {
                originPath = path.join(ohPkgContentPath.toString().replace(OH_PACKAGE_JSON5, ''), ohPkgContent.main.toString());
                if (ohPkgContent.dependencies) {
                    this.getDependenciesMapping(ohPkgContent.dependencies, ohPkgContentPath, from);
                } else if (ohPkgContent.devDependencies) {
                    this.getDependenciesMapping(ohPkgContent.devDependencies, ohPkgContentPath, from);
                } else if (ohPkgContent.dynamicDependencies) {
                    // dynamicDependencies not support
                }
                this.addFileNode2DependencyGrap(originPath);
            }
            if (!this.findFilesByPathArray(originPath)) {
                logger.trace(originPath + 'module mapperInfo is not found!');
            }
        }
    }

    private getDependenciesMapping(dependencies: object, ohPkgContentPath: string, from: string): void {
        for (let [moduleName, modulePath] of Object.entries(dependencies)) {
            logger.debug('dependencies:' + moduleName);
            if (modulePath.startsWith('file:')) {
                modulePath = modulePath.replace(/^file:/, '');
            }
            const innerOhpackagePath = path.join(ohPkgContentPath.replace(OH_PACKAGE_JSON5, ''), modulePath.toString(), OH_PACKAGE_JSON5);
            if (!this.ohPkgContentMap.has(innerOhpackagePath)) {
                // inner oh-package 内容缓存（同步读盘 + JSON5 解析只做一次）。
                // 特意不写回 ohPkgContentMap——parseFrom/findRelativeDependenciesByOhPkg
                // 正在 for...of 遍历它，遍历中插入 key 会改变迭代行为；独立 Map 零风险。
                let innerModuleOhPkgContent = this.resolvedOhPkgCache.get(innerOhpackagePath);
                if (!innerModuleOhPkgContent) {
                    innerModuleOhPkgContent = fetchDependenciesFromFile(innerOhpackagePath);
                    this.resolvedOhPkgCache.set(innerOhpackagePath, innerModuleOhPkgContent);
                }
                this.findDependenciesByOhPkg(innerOhpackagePath, innerModuleOhPkgContent, from);
            }
        }
    }

    private getOriginPath(from: string, arkFile: ArkFile): string {
        const parentPath = /^\.{1,2}\//.test(from) ? path.dirname(arkFile.getFilePath()) : arkFile.getProjectDir();
        return path.resolve(parentPath, from);
    }

    private addFileNode2DependencyGrap(filePath: string): void {
        // 汇点收集：三个解析产出路径（findFilesByPathArray / findFilesByExtNameArray /
        // findDependenciesByOhPkg）都经过本方法——当前 parseFrom 槽（若在解析中）
        // 记录产出供缓存条目。getDependencyFilesDeeply 照常执行（构建决策与
        // 缓存收集正交，命中路径在 parseFrom 内直接调用它）。
        const current = this.fromResolutionStack[this.fromResolutionStack.length - 1];
        if (current) {
            current.push(filePath);
        }
        this.getDependencyFilesDeeply(filePath);
    }

    // --- SDK 构建族（原 Scene.buildBasicInfo 的 SDK 段 + buildSdk 族，P3 迁移）---

    /**
     * SDK 阶段（原 buildBasicInfo 后半）：注册/构建全部 SDK 源、SDK 推断 +
     * global API 合并、记录语言表、extendArkUI、标记 project/SDK ID 边界。
     * 顺序语义与迁移前逐行一致（含 fileLanguages 在 SDK 构建之后才生效的历史顺序）。
     */
    public buildSdkStage(): void {
        this.scene.getStageStatisticsCollector()?.startStage(StageName.BuilderSdk);
        const scene = this.scene;
        const sceneConfig = this.sceneConfig;
        // 子阶段 1：SDK 源文件注册构建（逐文件解析 + 注册 formal 空间）。
        this.scene.getStageStatisticsCollector()?.startStage(StageName.BuilderSdkFiles);
        // handle sdks
        if (scene.getOptions().enableBuiltIn && !sceneConfig.getSdksObj().find(sdk => sdk.name === SdkUtils.BUILT_IN_NAME)) {
            sceneConfig.getSdksObj().unshift(SdkUtils.getBuiltInSdk());
        }
        sceneConfig.getSdksObj()?.forEach(sdk => {
            if (!sdk.moduleName) {
                this.buildSdk(sdk.name, path.normalize(sdk.path));
                scene.getProjectSdkMap().set(sdk.name, sdk);
            } else {
                let moduleSdks = scene.getModuleSdkMap().get(sdk.moduleName);
                if (moduleSdks) {
                    moduleSdks.push(sdk);
                } else {
                    scene.getModuleSdkMap().set(sdk.moduleName, [sdk]);
                }
            }
        });
        this.scene.getStageStatisticsCollector()?.endStage(StageName.BuilderSdkFiles);
        // 子阶段 2：SDK 类型推导与 global API 合并。
        this.scene.getStageStatisticsCollector()?.startStage(StageName.BuilderSdkInfer);
        if (scene.getBuildStage() < SceneBuildStage.SDK_INFERRED) {
            this.registry.fileSigCanonicalizer
                .getModels()
                .filter(f => !f.isProjectFile())
                .forEach(file => {
                    // CXXTodo: C++ does not handle SDK files.
                    if (file.getLanguage() === Language.CXX) {
                        return;
                    }
                    InferenceManager.getInstance().getInference(file.getLanguage()).doInfer(file);
                    SdkUtils.mergeGlobalAPI(file, SignatureCanonicalizerRegistry.getInstance().sdkGlobalMap);
                });
            this.registry.fileSigCanonicalizer
                .getModels()
                .filter(f => !f.isProjectFile())
                .forEach(file => {
                    SdkUtils.postInferredSdk(file, SignatureCanonicalizerRegistry.getInstance().sdkGlobalMap);
                });
            scene.setBuildStage(SceneBuildStage.SDK_INFERRED);
        }
        this.scene.getStageStatisticsCollector()?.endStage(StageName.BuilderSdkInfer);
        scene.setFileLanguages(sceneConfig.getFileLanguages());
        SdkUtils.extendArkUI(scene);
        // SDK 阶段结束：标记 project/SDK FileSigID 边界，此后注册的文件均为 project 文件。
        this.registry.markProjectFileBoundary();
        this.scene.getStageStatisticsCollector()?.endStage(StageName.BuilderSdk);
    }

    /**
     * Loads SDK sources into the scene. C++ SDK files are intentionally skipped: they are not parsed or registered
     * here (only non-C++ SDK sources are processed).
     */
    private buildSdk(sdkName: string, sdkPath: string): void {
        const allFiles = this.collectSdkFiles(sdkName, sdkPath);
        allFiles.forEach(file => {
            if (FileUtils.getFileLanguage(file, this.scene.getFileLanguages()) === Language.CXX) {
                return;
            }
            this.parseAndRegisterSdkFile(file, sdkPath, sdkName);
        });
    }

    private collectSdkFiles(sdkName: string, sdkPath: string): string[] {
        if (sdkName === SdkUtils.BUILT_IN_NAME) {
            const builtInFiles = SdkUtils.fetchBuiltInFiles(sdkPath);
            if (builtInFiles.length > 0) {
                this.scene.getOptions().sdkGlobalFolders?.push(sdkPath);
            }
            return builtInFiles;
        }
        SdkUtils.loadSystemComponentsFromSdk(sdkPath);
        return getAllFiles(sdkPath, this.scene.getOptions().supportFileExts!, this.scene.getOptions().ignoreFileNames!);
    }

    private parseAndRegisterSdkFile(file: string, sdkPath: string, sdkName: string): void {
        logger.trace('=== parse sdk file:', file);
        try {
            const arkFile: ArkFile = new ArkFile(FileUtils.getFileLanguage(file, this.scene.getFileLanguages()));
            arkFile.setScene(this.scene);
            ArktsFrontend.buildArkFileFromSdkPath(file, sdkPath, arkFile, sdkName);
            const allClasses = ModelUtils.getAllClassesInFile(arkFile);
            for (let i = 0; i < allClasses.length; i++) {
                const cls = allClasses[i];
                cls.getDefaultArkMethod()?.buildBody();
                cls.getDefaultArkMethod()?.freeBodyBuilder();
            }
            // Release all method builders in SDK file to avoid retaining AST/build context in memory.
            ModelUtils.getAllMethodsInFile(arkFile).forEach(method => {
                if (method.getDeclaringArkFile()?.getLanguage() === Language.CXX) {
                    method.freeCxxBodyBuilder();
                } else {
                    method.freeBodyBuilder();
                }
            });
            arkFile.setProjectFile(false);
            SdkUtils.buildSdkImportMap(arkFile);
            SdkUtils.loadGlobalAPI(arkFile, SignatureCanonicalizerRegistry.getInstance().sdkGlobalMap);
        } catch (error) {
            logger.error('Error parsing file:', file, error);
            this.scene.getUnhandledSdkFilePaths().push(file);
        }
    }

    // --- body 构建族（原 Scene.buildAllMethodBody 族，P3 迁移）---

    /**
     * 方法体构建段（原 genArkFiles 尾段）：enableMethodBodyBuild 分支——
     * 全量 buildBody + 默认构造器补全，或仅释放 builder。
     */
    public buildAllMethodBodies(): void {
        this.scene.getStageStatisticsCollector()?.startStage(StageName.BuilderBodies);
        if (this.scene.getOptions().enableMethodBodyBuild ?? true) {
            this.buildAllMethodBody();
            this.updateOrAddDefaultConstructors();
        } else {
            this.freeAllBodyBuilders();
            ModelUtils.dispose();
            this.scene.setBuildStage(SceneBuildStage.METHOD_DONE);
        }
        this.scene.getStageStatisticsCollector()?.endStage(StageName.BuilderBodies);
    }

    /**
     * Update or add default constructors for all classes in the scene.
     */
    private updateOrAddDefaultConstructors(): void {
        // 直接遍历 getClasses()（registry 平面遍历，project 类全量），语言判定随之
        // 移到类级别（类可能来自不同语言的文件）。顺序从结构序变为 classSigID 升序。
        for (const cls of this.scene.getClasses()) {
            // CXXTodo: Select the appropriate initialization function based on file type
            const initInConstructorFn = cls.getDeclaringArkFile().getLanguage() === Language.CXX ? addCxxInitInConstructor : addInitInConstructor;
            buildDefaultConstructor(cls);
            // CXXTodo: Use the interface 'getAllMethodsWithName' for obtaining all methods with the same name.
            const constructors = cls.getAllMethodsWithName(CONSTRUCTOR_NAME);
            if (cls.isDefaultArkClass()) {
                continue;
            }
            constructors.forEach(constructor => {
                replaceSuper2Constructor(constructor);
                initInConstructorFn(constructor);
            });
        }
    }

    /**
     * 遍历全部 project 文件的 ArkMethod（不含 SDK 方法），逐个回调处理。
     *
     * 直接平面遍历 methodSigCanonicalizer（registry 为事实源），过滤规则：
     * ① getModel(id) 为 undefined 跳过——declare-only 方法（无 model）及
     *    BodyBuilder/JsonSerialization 重签名产生的无 model 条目；
     * ② 非 project 文件跳过（SDK 文件，按 file 的 projectFile 标志判定）；
     * ③ !enableOhModulesBody 时，oh_modules 文件仅保留 defaultArkMethod。
     * 处理顺序为 methodSigID 升序（buildBody 逐方法独立、无序敏感）。
     */
    private forEachProjectMethod(callback: (method: ArkMethod) => void): void {
        const size = this.registry.methodSigCanonicalizer.size();
        for (let id = 1; id < size; id++) {
            const method = this.registry.methodSigCanonicalizer.getModel(id);
            if (method === undefined) {
                continue;
            }
            const file = method.getDeclaringArkFile();
            if (!file.isProjectFile()) {
                continue;
            }
            if (!this.scene.getOptions().enableOhModulesBody && file.getName().includes(OH_MODULES)) {
                if (method !== method.getDeclaringArkClass().getDefaultArkMethod()) {
                    continue;
                }
            }
            callback(method);
        }
    }

    private static freeMethodBodyBuilder(method: ArkMethod): void {
        const isCxxFile = method.getDeclaringArkFile()?.getLanguage() === Language.CXX;
        if (isCxxFile) {
            method.freeCxxBodyBuilder();
        } else {
            method.freeBodyBuilder();
        }
    }

    private buildAllMethodBody(): void {
        this.scene.setBuildStage(SceneBuildStage.CLASS_DONE);
        this.forEachProjectMethod(method => {
            try {
                method.buildBody();
                this.scene.getStageStatisticsCollector()?.recordMemoryCheckpoint();
            } catch (error) {
                logger.error('Error building body:', method.getSignature(), error);
            } finally {
                SceneBuilder.freeMethodBodyBuilder(method);
            }
        });

        ModelUtils.dispose();
        this.scene.setBuildStage(SceneBuildStage.METHOD_DONE);
    }

    private freeAllBodyBuilders(): void {
        this.forEachProjectMethod(method => {
            SceneBuilder.freeMethodBodyBuilder(method);
        });
    }

    // --- harmony 模块构建族（原 Scene.buildScene4HarmonyProject / buildModuleScene，P3 迁移）---

    /**
     * harmony 项目构建（原 buildScene4HarmonyProject 主体）：逐模块注册
     * ModuleScene（先注册后构建，保证 DFS 归属正确）→ 模块文件 DFS → body 构建。
     */
    public buildScene4HarmonyProject(): void {
        this.scene.getModulePath2NameMap().forEach((value, key) => {
            // 先注册（复用其他模块 DFS 依赖递归期可能已创建的 partial 实例）：
            // 构建期 addArkFile2ModuleScene 依据 moduleScenesMap 归属文件，
            // 注册必须先于 genArkFiles 的 DFS，否则文件会归属到被覆盖的孤儿实例。
            let moduleScene = this.scene.getModuleSceneMap().get(value);
            if (!moduleScene) {
                moduleScene = new ModuleScene(this.scene);
                this.scene.getModuleSceneMap().set(value, moduleScene);
            }
            moduleScene.ModuleSceneBuilder(value, key, this.scene.getOptions().supportFileExts!);
        });

        this.buildAllMethodBodies();
    }

    /**
     * 单模块构建（原 buildModuleScene 主体，增量式入口）：ohpkg 依赖递归 + 模块
     * DFS + body 构建。可能被连续调用构建多个模块——不释放构建上下文（释放交给
     * clear / 完整构建入口）。
     */
    public buildModuleScene(moduleName: string, modulePath: string, supportFileExts: string[]): void {
        const moduleScenesMap = this.scene.getModuleSceneMap();
        if (moduleScenesMap.get(moduleName)) {
            return;
        }

        // 先注册：构建期 addArkFile2ModuleScene 依据 moduleScenesMap 归属文件，
        // 注册必须先于 ModuleSceneBuilder 内的 DFS；同时兼作 ohpkg 依赖环的递归终止
        // （构建中即已注册，环上重入直接命中上方守卫）。
        const moduleScene = new ModuleScene(this.scene);
        moduleScenesMap.set(moduleName, moduleScene);

        // get oh-package.json5
        const moduleOhPkgFilePath = path.resolve(this.scene.getRealProjectDir(), path.join(modulePath, OH_PACKAGE_JSON5));
        if (fs.existsSync(moduleOhPkgFilePath)) {
            const moduleOhPkgContent = fetchDependenciesFromFile(moduleOhPkgFilePath);
            this.addOhPkgContent(moduleOhPkgFilePath, moduleOhPkgContent);
        } else {
            logger.warn('Module: ', moduleName, 'has no oh-package.json5.');
        }

        // parse moduleOhPkgContent, get dependencies and build dependent module
        const moduleOhPkgContent = this.ohPkgContentMap.get(moduleOhPkgFilePath);
        if (moduleOhPkgContent) {
            if (moduleOhPkgContent.dependencies instanceof Object) {
                this.processModuleOhPkgContent(moduleOhPkgContent.dependencies, moduleOhPkgFilePath, supportFileExts);
            }
        }

        moduleScene.ModuleSceneBuilder(moduleName, modulePath, supportFileExts);

        this.buildAllMethodBodies();
    }

    private processModuleOhPkgContent(dependencies: Object, moduleOhPkgFilePath: string, supportFileExts: string[]): void {
        Object.entries(dependencies).forEach(([k, v]) => {
            const pattern = new RegExp('^(\\.\\.\\/|\\.\\/)');
            if (typeof v === 'string') {
                let dependencyModulePath: string = '';
                if (pattern.test(v)) {
                    dependencyModulePath = path.join(moduleOhPkgFilePath, v);
                } else if (v.startsWith('file:')) {
                    const dependencyFilePath = path.join(moduleOhPkgFilePath, v.replace(/^file:/, ''));
                    const dependencyOhPkgPath = getFileRecursively(path.dirname(dependencyFilePath), OH_PACKAGE_JSON5);
                    dependencyModulePath = path.dirname(dependencyOhPkgPath);
                }
                const dependencyModuleName = this.scene.getModulePath2NameMap().get(dependencyModulePath);
                if (dependencyModuleName) {
                    this.buildModuleScene(dependencyModuleName, dependencyModulePath, supportFileExts);
                }
            }
        });
    }
}
