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

import fs from 'fs';
import path from 'path';

import { SceneConfig, SceneOptions, Sdk } from './Config';
import { ModelUtils } from './core/common/ModelUtils';
import { TypeInference } from './core/common/TypeInference';
import { VisibleValue } from './core/common/VisibleValue';
import { ArkClass } from './core/model/ArkClass';
import { ArkFile, Language } from './core/model/ArkFile';
import { ArkMethod } from './core/model/ArkMethod';
import { ArkModule, ModuleID } from './core/model/ArkModule';
import { ArkNamespace } from './core/model/ArkNamespace';
import { ClassSignature, FileSignature, MethodSignature, NamespaceSignature } from './core/model/ArkSignature';
import { ModuleAnalysisConfig, ModuleAnalysisCallback } from './frontend/common/ModuleAnalysisConfig';
import { ModuleBuilder } from './frontend/common/ModuleBuilder';
import { MemoryMonitor } from './frontend/common/MemoryMonitor';
import { ModuleCache } from './frontend/common/ModuleCache';
import Logger, { LOG_MODULE_TYPE } from './utils/logger';
import { Local } from './core/base/Local';
import { ArkExport, ExportType } from './core/model/ArkExport';
import { clearCxxTypeStringCache } from './frontend/cppFrontend/model/builder/builderUtils';
import { disposeClassMap } from './frontend/cppFrontend/model/builder/ArkFileBuilder';
import { DEFAULT_ARK_CLASS_NAME, STATIC_INIT_METHOD_NAME } from './core/common/Const';
import { CallGraph } from './callgraph/model/CallGraph';
import { CallGraphBuilder } from './callgraph/model/builder/CallGraphBuilder';
import { IRInference as CxxIRInference } from './frontend/cppFrontend/common/IRInference';
import { SceneBuilder } from './frontend/SceneBuilder';
import { SdkUtils } from './core/common/SdkUtils';
import { PointerAnalysisConfig } from './callgraph/pointerAnalysis/PointerAnalysisConfig';
import { ValueUtil } from './core/common/ValueUtil';
import { InferenceManager } from './core/inference/Inference';
import { IRInference } from './core/common/IRInference';
import { ModuleUtils } from './utils/ModuleUtils';
import { Canonicalizer } from './utils/Canonicalizer';
import { ModuleDepGraph } from './core/graph/ModuleDepGraph';
import { SignatureCanonicalizerRegistry } from './core/common/SignatureCanonicalizerRegistry';
import { CanonicalizerValidator } from './core/common/CanonicalizerValidator';
import { ArkSignatureBuilder } from './core/model/builder/ArkSignatureBuilder';
import { StageName, StageStatistics, StageStatisticsData } from './statistics/StageStatistics';
import { StageStatisticsReporter } from './statistics/StageStatisticsReporter';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'Scene');

// 枚举与 ModuleScene 已拆至 frontend 独立文件（解 Scene↔frontend 值导入循环），
// 此处 re-export 保持对外兼容。
export { SceneBuildStage } from './frontend/SceneBuildStage';
export { ModuleScene } from './frontend/ModuleScene';
import { SceneBuildStage } from './frontend/SceneBuildStage';
import { ModuleScene } from './frontend/ModuleScene';

/**
 * The Scene class includes everything in the analyzed project.
 * We should be able to re-generate the project's code based on this class.
 */
export class Scene {
    private projectName: string = '';
    private realProjectDir: string = '';
    private includeDirs: string[] = []; // Include directories that the C++ project depends on.
    private ccjsonPath: string = '';
    private cppAstPath: string = '';

    private moduleScenesMap: Map<string, ModuleScene> = new Map();
    private modulePath2NameMap: Map<string, string> = new Map<string, string>();

    private moduleSdkMap: Map<string, Sdk[]> = new Map();
    private projectSdkMap: Map<string, Sdk> = new Map();

    // values that are visible in curr scope
    private visibleValue: VisibleValue = new VisibleValue();

    private overRides: Map<string, string> = new Map();
    private overRideDependencyMap: Map<string, unknown> = new Map();

    private buildStage: SceneBuildStage = SceneBuildStage.BUILD_INIT;
    private fileLanguages: Map<string, Language> = new Map();

    private options!: SceneOptions;

    /** The SceneConfig used to build this scene, retained for later queries (e.g. SDK list). */
    private sceneConfig?: SceneConfig;

    /**
     * 构建期一次性上下文：完整构建路径的全部构建机械与工作态都在 {@link SceneBuilder} 上。
     * 构建入口创建/复用，构建结束由入口方法释放（置undefined，随 GC 回收）——构建工作态不再驻留 Scene。
     * 模块化增量路径（analyseByModule/loadModule）不经此上下文。
     */
    private activeBuilder?: SceneBuilder;

    /** Maps ArkModule objects to dense integer ModuleIDs via the objectIdentity strategy. */
    private moduleCanonicalizer: Canonicalizer<ArkModule> = new Canonicalizer<ArkModule>();

    /** Module dependency graph, used for SCCDetection. Built during dependency analysis. */
    private moduleDepGraph?: ModuleDepGraph;

    /** Whether module preparation has completed (prepareModules + analyzeModuleDependencies, idempotent). */
    private modulesRegistered: boolean = false;

    /** Persistent module cache for cross-call module reuse. */
    private moduleCache?: ModuleCache;

    /** Persistent memory monitor for cache eviction. */
    private memoryMonitor?: MemoryMonitor;

    /** Stage statistics collector (time + memory); undefined when disabled. */
    private stageStatistics?: StageStatistics;
    /** Exit hook handler for auto-output of statistics report. */
    private statsExitHandler?: () => void;
    /** Prevents duplicate report output (set by manual API or exit hook). */
    private statsReportWritten: boolean = false;

    private unhandledFilePaths: Set<string> = new Set<string>();
    private unhandledSdkFilePaths: string[] = [];

    /**
     * project 文件的构建完成序（setFile 时记录的 FileSigID 序列）。
     *
     * 构建走 {@link getDependencyFilesDeeply}（DFS）：每个文件在自己的全部 import/export 依赖构建完成之后才 setFile（后序）——因此本序列是严格的拓扑序（被依赖者在前）。
     * 这是推断期零排序遍历的事实源（见 {@link inferTypes}）。注意 FileSigID 本身的前序 intern 序不具拓扑性质（多入口/菱形场景依赖方可能晚于被依赖方 intern），不可用于排序。
     */
    private builtFileOrder: number[] = [];

    // --- Canonicalizers moved to SignatureCanonicalizerRegistry (global singleton) ---

    /** @internal Get the Registry singleton. */
    private get registry(): SignatureCanonicalizerRegistry {
        return SignatureCanonicalizerRegistry.getInstance();
    }

    // --- 构建期上下文（SceneBuilder）生命周期 ---

    /** @internal 惰性创建/复用构建期上下文（幂等：同一构建流程内共享工作态）。 */
    private getOrCreateSceneBuilder(sceneConfig?: SceneConfig): SceneBuilder {
        if (!this.activeBuilder) {
            const config = sceneConfig ?? this.sceneConfig;
            if (!config) {
                throw new Error('SceneBuilder requires a SceneConfig (call buildBasicInfo first).');
            }
            this.activeBuilder = new SceneBuilder(this, config);
        }
        return this.activeBuilder;
    }

    /** @internal 释放构建期上下文：在构建机械全部完成后调用，工作态随上下文被 GC 回收。*/
    private releaseSceneBuilder(): void {
        this.activeBuilder = undefined;
    }

    /** @internal 当前活跃构建上下文（无则 undefined）。ModuleScene 等构建通道使用。 */
    public getActiveSceneBuilder(): SceneBuilder | undefined {
        return this.activeBuilder;
    }

    /** @internal 模块路径 → 模块名映射（构建产物；SceneBuilder.parseBuildProfile 写入）。 */
    public getModulePath2NameMap(): Map<string, string> {
        return this.modulePath2NameMap;
    }

    constructor() {}

    /*
     * Set all static field to be null, then all related objects could be freed by GC.
     * This method could be called before drop Scene.
     */
    public dispose(): void {
        PointerAnalysisConfig.dispose();
        SdkUtils.dispose();
        ValueUtil.dispose();
        ModelUtils.dispose();
        clearCxxTypeStringCache();
        disposeClassMap();
        this.moduleCache = undefined;
        this.memoryMonitor = undefined;
        this.releaseSceneBuilder();
        this.builtFileOrder = [];
        this.moduleScenesMap.clear();
        this.modulePath2NameMap.clear();
        this.moduleSdkMap.clear();
        this.projectSdkMap.clear();
        if (this.statsExitHandler) {
            process.removeListener('exit', this.statsExitHandler);
            this.statsExitHandler = undefined;
        }
        this.stageStatistics?.finish();
        this.stageStatistics = undefined;
        SignatureCanonicalizerRegistry.dispose();
        // 组件名 stub 缓存随 Registry 同点清理（缓存实例的 temp symbol 属旧空间）。
        ArkSignatureBuilder.clearComponentStubCache();
    }

    /** @internal Get the formal FileSignature canonicalizer. */
    public getFileSigCanonicalizer() {
        return this.registry.fileSigCanonicalizer;
    }

    /** @internal Get the formal ClassSignature canonicalizer. */
    public getClassSigCanonicalizer() {
        return this.registry.classSigCanonicalizer;
    }

    /** @internal Get the formal MethodSignature canonicalizer. */
    public getMethodSigCanonicalizer() {
        return this.registry.methodSigCanonicalizer;
    }

    /** @internal Get the formal NamespaceSignature canonicalizer. */
    public getNamespaceSigCanonicalizer() {
        return this.registry.namespaceSigCanonicalizer;
    }

    /** @internal Get the formal FieldSignature canonicalizer. */
    public getFieldSigCanonicalizer() {
        return this.registry.fieldSigCanonicalizer;
    }

    public getOptions(): SceneOptions {
        return this.options;
    }

    public getBuildStage(): SceneBuildStage {
        return this.buildStage;
    }

    public getOverRides(): Map<string, string> {
        return this.overRides;
    }

    public getOverRideDependencyMap(): Map<string, unknown> {
        return this.overRideDependencyMap;
    }

    /** @deprecated Use {@link dispose} instead. */
    public clear(): void {
        this.dispose();
    }

    public getStage(): SceneBuildStage {
        return this.buildStage;
    }

    /**
     * Set the current {@link SceneBuildStage}. Used by module-level builders (e.g.
     * {@link FrontendBuilder.buildModuleMethodBody}) to temporarily open the
     * {@link buildClassDone} gate so that nested/anonymous method bodies are built
     * immediately during body construction, then restore the previous stage.
     */
    public setBuildStage(stage: SceneBuildStage): void {
        this.buildStage = stage;
    }

    /**
     * Build scene object according to the {@link SceneConfig}. This API implements 3 functions.
     * First is to build scene object from {@link SceneConfig}, second is to generate {@link ArkFile}s,
     * and the last is to collect project import infomation.
     * @param sceneConfig - a sceneConfig object, which is usally defined by user or Json file.
     * @example
     * 1. Build Scene object from scene config

     ```typescript
     // build config
     const projectDir = ... ...;
     const sceneConfig = new SceneConfig();
     sceneConfig.buildFromProjectDir(projectDir);

     // build scene
     const scene = new Scene();
     scene.buildSceneFromProjectDir(sceneConfig);
     ```
     */
    public buildSceneFromProjectDir(sceneConfig: SceneConfig): void {
        this.config(sceneConfig);
        this.stageStatistics?.start();
        this.stageStatistics?.startStage(StageName.Builder);
        this.buildBasicInfo(sceneConfig);
        this.genArkFiles();
        // 完整构建结束：释放构建期上下文（工作态随 GC 回收）。
        this.releaseSceneBuilder();
        this.stageStatistics?.endStage(StageName.Builder);
        // 签名空间快照（时点 1）：构建完成后的 formal/temp 数据进报告。
        this.stageStatistics?.recordSignatureStats('post-build');
    }

    public buildSceneFromFiles(sceneConfig: SceneConfig): void {
        this.config(sceneConfig);
        this.stageStatistics?.start();
        this.stageStatistics?.startStage(StageName.Builder);
        this.buildBasicInfo(sceneConfig);
        this.genArkFiles();
        // 完整构建结束：释放构建期上下文（工作态随 GC 回收）。
        this.releaseSceneBuilder();
        this.stageStatistics?.endStage(StageName.Builder);
        // 签名空间快照（时点 1）：构建完成后的 formal/temp 数据进报告。
        this.stageStatistics?.recordSignatureStats('post-build');
    }

    /**
     * Set the basic information of the scene using a config,
     * such as the project's name, real path and files.
     * @param sceneConfig - the config used to set the basic information of scene.
     */
    public buildBasicInfo(sceneConfig: SceneConfig): void {
        this.sceneConfig = sceneConfig;
        this.options = sceneConfig.getOptions();
        this.projectName = sceneConfig.getTargetProjectName();
        this.realProjectDir = fs.realpathSync(sceneConfig.getTargetProjectDirectory());
        this.includeDirs = sceneConfig.getIncludeDirs();
        this.ccjsonPath = sceneConfig.getCcjsonPath();
        this.cppAstPath = sceneConfig.getCppAstPath();

        const builder = this.getOrCreateSceneBuilder(sceneConfig);
        builder.parseProjectConfigs();
        builder.buildSdkStage();
    }

    private genArkFiles(): void {
        const builder = this.getOrCreateSceneBuilder();
        builder.buildProjectFiles();
        builder.buildAllMethodBodies();
    }

    /**
     * Build the scene for harmony project. It resolves the file path of the project first, and then fetches
     * dependencies from this file. Next, build a `ModuleScene` for this project to generate {@link ArkFile}. Finally,
     * it build bodies of all methods, generate extended classes, and add DefaultConstructors.
     */
    public buildScene4HarmonyProject(): void {
        this.getOrCreateSceneBuilder().buildScene4HarmonyProject();
        this.releaseSceneBuilder();
    }

    /**
     * 单模块构建（增量式入口，可连续调用构建多个模块）：ohpkg 依赖递归 + 模块 DFS + body 构建，全部经构建期上下文。此处不释放上下文（连续构建共享工作态）。
     */
    public buildModuleScene(moduleName: string, modulePath: string, supportFileExts: string[]): void {
        this.getOrCreateSceneBuilder().buildModuleScene(moduleName, modulePath, supportFileExts);
    }

    /**
     * Get the absolute path of current project.
     * @returns The real project's directiory.
     * @example
     * 1. get real project directory, such as:
     ```typescript
     let projectDir = projectScene.getRealProjectDir();
     ```
     */
    public getRealProjectDir(): string {
        return this.realProjectDir;
    }

    /**
     * Returns the {@link SceneConfig} used to build this scene, or undefined before
     * {@link buildBasicInfo} has been called.
     */
    public getSceneConfig(): SceneConfig | undefined {
        return this.sceneConfig;
    }

    /**
     * Save the {@link SceneConfig} into the scene for later module-level analysis.
     * Unlike {@link buildBasicInfo}, this method only stores the config (and derives
     * the real project directory) without building ArkFiles or performing type inference.
     * This is the lightweight entry point for {@link analyseByModule}.
     */
    public config(sceneConfig: SceneConfig): void {
        this.sceneConfig = sceneConfig;
        this.options = sceneConfig.getOptions();
        this.projectName = sceneConfig.getTargetProjectName();
        const dir = sceneConfig.getTargetProjectDirectory();
        if (dir) {
            this.realProjectDir = fs.realpathSync(dir);
        }
        this.fileLanguages = sceneConfig.getFileLanguages();
        if (this.options.enableStatistics && !this.stageStatistics) {
            this.stageStatistics = new StageStatistics(true);
            this.registerStatsExitHook();
        }
    }

    /** @internal 供构建期上下文（SceneBuilder）打点使用：返回统计收集器，未启用统计时为 undefined（各打点调用自动 no-op）。 */
    public getStageStatisticsCollector(): StageStatistics | undefined {
        return this.stageStatistics;
    }

    /**
     * Returns all registered {@link ArkModule} objects.
     */
    public getModules(): ArkModule[] {
        const result: ArkModule[] = [];
        for (let i = 0; i < this.moduleCanonicalizer.size(); i++) {
            const m = this.moduleCanonicalizer.get(i);
            if (m) {
                result.push(m);
            }
        }
        return result;
    }

    // --- Module query methods (Scene is a lightweight result container) ---

    /** The module dependency graph, or undefined before dependency analysis. */
    public getModuleDepGraph(): ModuleDepGraph | undefined {
        return this.moduleDepGraph;
    }

    /** Whether module preparation has completed. */
    public isModulesRegistered(): boolean {
        return this.modulesRegistered;
    }

    // --- Module cache management (persistent across analyseByModule calls) ---

    public getModuleCache(): ModuleCache | undefined {
        return this.moduleCache;
    }

    public setModuleCache(cache: ModuleCache): void {
        this.moduleCache = cache;
    }

    public getMemoryMonitor(): MemoryMonitor | undefined {
        return this.memoryMonitor;
    }

    public setMemoryMonitor(monitor: MemoryMonitor): void {
        this.memoryMonitor = monitor;
    }

    // --- Internal accessors used by ModuleBuilder to read/write persistent state ---

    /** Get a registered module by its ModuleID. Returns undefined when the id is out of bounds. */
    public getModule(id: ModuleID): ArkModule | undefined {
        return this.moduleCanonicalizer.get(id);
    }

    /** Get the ModuleID assigned to a registered ArkModule. */
    public getModuleId(module: ArkModule): ModuleID {
        return this.moduleCanonicalizer.getId(module);
    }

    /** Total number of registered modules. */
    public getModuleCount(): number {
        return this.moduleCanonicalizer.size();
    }

    /** Create a {@link ModuleDepGraph} sharing the internal module canonicalizer. */
    public createModuleDepGraph(): ModuleDepGraph {
        return new ModuleDepGraph(this.moduleCanonicalizer);
    }

    public setModuleDepGraph(graph: ModuleDepGraph): void {
        this.moduleDepGraph = graph;
    }

    public setModulesRegistered(value: boolean): void {
        this.modulesRegistered = value;
    }

    /**
     * Perform module-level analysis by iterating modules in topological order and invoking
     * the callback for each module.
     *
     * Flow: prepareModules → analyzeModuleDependencies → buildSdkModules (SDK loaded
     * inferred first) → resolveTargetModuleIds → computeModuleClosureByIds →
     * getFilteredTopoOrder → loadModule → callback.
     * Each step is idempotent; repeated calls do not repeat preprocessing.
     *
     * - SDK modules are registered and built in one fused step by {@link ModuleBuilder.buildSdkModules}
     *   before the topoOrder loop, so that global APIs are available when project/oh_modules modules
     *   are loaded. SDK modules are not in the module dependency graph and thus never appear in the
     *   topoOrder or callback.
     * - Target modules are resolved from the config's type filter, explicit include IDs, and
     *   explicit exclude IDs. The transitive closure (targets + dependencies) determines which
     *   modules are loaded. The callback is invoked only for target modules, not their dependencies.
     * - By default (no explicit selection), all PROJECT and OH_MODULES modules are targets.
     *
     * @param callback - Invoked for each target module with the module and the scene.
     * @param config - Optional configuration for target module selection and load levels.
     */
    public analyseByModule(callback: ModuleAnalysisCallback, config?: ModuleAnalysisConfig): void {
        const builder = new ModuleBuilder(this);
        // 1. Prepare modules + analyze dependencies (merged, guarded by modulesRegistered)
        if (!this.isModulesRegistered()) {
            builder.prepareModules();
            builder.analyzeModuleDependencies();
            this.setModulesRegistered(true);
        }
        // 2. Build SDK modules → fused registration + building (idempotent). SDK loaded FIRST so
        //    that global APIs are available when project/oh_modules modules are loaded.
        builder.buildSdkModules();
        // 3. Resolve target modules and compute closure (unified flow, no branching)
        const effectiveConfig = config ?? new ModuleAnalysisConfig();
        const targetIds = builder.resolveTargetModuleIds(effectiveConfig);
        const closure = builder.computeModuleClosureByIds(targetIds);
        const topoOrder = builder.getFilteredTopoOrder(closure);
        // 4. Initialize / update cache management (persistent ModuleCache + MemoryMonitor in Scene)
        builder.initCacheManagement(this.getOptions(), topoOrder, effectiveConfig.getDependencyLoadLevel());
        // 5. Pre-call cleanup: unload cached modules not in current topoOrder
        const cache = this.getModuleCache();
        if (cache) {
            const currentTopoSet = new Set(topoOrder);
            for (const moduleId of cache.getLoadedModules()) {
                if (!currentTopoSet.has(moduleId)) {
                    builder.unload(moduleId);
                    cache.unregister(moduleId);
                }
            }
        }
        // 6. Iterate topoOrder: loadModule internally handles cache eviction and registration
        const targetLevel = effectiveConfig.getLoadLevel();
        const depLevel = effectiveConfig.getDependencyLoadLevel();
        for (const moduleId of topoOrder) {
            const isTarget = targetIds.test(moduleId);
            builder.loadModule(moduleId, isTarget ? targetLevel : depLevel);
            if (!isTarget) {
                continue;
            }
            const module = builder.getModule(moduleId);
            if (!module) {
                continue;
            }
            callback(module, this);
        }
        // 7. No unload, no dispose → modules persist in cache for cross-call reuse
    }

    /**
     * Returns the **string** name of the project.
     * @returns The name of the project.
     */
    public getProjectName(): string {
        return this.projectName;
    }

    /** @deprecated Compatibility delegate only — no longer used internally. Use {@link SdkUtils.getSdkGlobal} instead. */
    public getSdkGlobal(globalName: string): ArkExport | null {
        return SdkUtils.getSdkGlobal(globalName);
    }

    /** @deprecated Compatibility delegate only — no longer used internally. Use `SignatureCanonicalizerRegistry.getInstance().sdkGlobalMap` instead. */
    public getSdkGlobalMap(): Map<string, ArkExport[]> {
        return SignatureCanonicalizerRegistry.getInstance().sdkGlobalMap;
    }

    /**
     * Returns the file based on its signature.
     * If no file can be found according to the input signature, **null** will be returned.
     * A typical {@link ArkFile} contains: file's name (i.e., its relative path), project's name,
     * project's dir, file's signature etc.
     * @param fileSignature - the signature of file.
     * @returns a file defined by ArkAnalyzer. **null** will be returned if no file could be found.
     * @example
     * 1. get ArkFile based on file signature.

     ```typescript
     if (...) {
     const fromSignature = new FileSignature();
     fromSignature.setProjectName(im.getDeclaringArkFile().getProjectName());
     fromSignature.setFileName(fileName);
     return scene.getFile(fromSignature);
     }
     ```
     */
    public getFile(fileSignature: FileSignature): ArkFile | null;
    public getFile(fileSigId: number): ArkFile | null;
    public getFile(fileSigOrId: FileSignature | number): ArkFile | null {
        if (typeof fileSigOrId === 'number') {
            return this.registry.fileSigCanonicalizer.getModel(fileSigOrId) ?? null;
        }
        return this.registry.fileSigCanonicalizer.getModel(this.registry.fileSigCanonicalizer.getExistingId(fileSigOrId)) ?? null;
    }

    /*
     * Returns the absolute file paths that cannot be handled currently.
     */
    public getUnhandledFilePaths(): string[] {
        return Array.from(this.unhandledFilePaths);
    }

    /** @internal 原始引用（Set）：构建期上下文作防环工作集复用（成功 delete、失败残留）。 */
    public getUnhandledFileSet(): Set<string> {
        return this.unhandledFilePaths;
    }

    /*
     * Returns the absolute sdk file paths that cannot be handled currently.
     */
    public getUnhandledSdkFilePaths(): string[] {
        return this.unhandledSdkFilePaths;
    }

    /** @internal 非用户 API。*/
    public setFile(file: ArkFile): void {
        file.setScene(this);
        file.setProjectFile(true);
        // 记录构建完成序（后序 = 拓扑序），见字段注释与 inferTypes。
        this.builtFileOrder.push(file.getFileSigID());
    }

    /** @internal project 文件的构建完成序（拓扑序：被依赖者在前）。推断期遍历事实源。 */
    public getBuiltFileOrder(): readonly number[] {
        return this.builtFileOrder;
    }

    /** @internal 非用户 API。*/
    public addSdkArkFile(arkFile: ArkFile): void {
        // 防御断言：边界已设置后不应再注册 SDK 文件（构建时序破坏，理论不可达）。
        if (this.registry.getFirstProjectFileSigID() !== -1) {
            logger.warn(`SDK file registered after the project/SDK ID boundary was marked: ${arkFile.getName()}`);
        }
        arkFile.setScene(this);

        arkFile.setProjectFile(false);
    }

    public hasSdkFile(fileSignature: FileSignature): boolean;
    public hasSdkFile(fileSigId: number): boolean;
    public hasSdkFile(fileSigOrId: FileSignature | number): boolean {
        let file: ArkFile | undefined;
        if (typeof fileSigOrId === 'number') {
            file = this.registry.fileSigCanonicalizer.getModel(fileSigOrId);
        } else {
            file = this.registry.fileSigCanonicalizer.getModel(this.registry.fileSigCanonicalizer.getExistingId(fileSigOrId));
        }
        return file !== undefined && !file.isProjectFile();
    }

    /**
     * 获取全部 project 文件（不含 SDK 文件）。
     */
    public getFiles(): ArkFile[] {
        const first = this.registry.getFirstProjectFileSigID();
        if (first === -1) {
            return [];
        }
        const size = this.registry.fileSigCanonicalizer.size();
        const result: ArkFile[] = [];
        for (let id = first; id < size; id++) {
            const model = this.registry.fileSigCanonicalizer.getModel(id);
            if (model !== undefined) {
                result.push(model);
            }
        }
        return result;
    }

    public getFileLanguages(): Map<string, Language> {
        return this.fileLanguages;
    }

    /** @internal 构建期上下文在 SDK 阶段末尾回填语言表（保持与迁移前一致的赋值时序）。 */
    public setFileLanguages(fileLanguages: Map<string, Language>): void {
        this.fileLanguages = fileLanguages;
    }

    /** 获取全部 SDK 文件。 */
    public getSdkArkFiles(): ArkFile[] {
        const first = this.registry.getFirstProjectFileSigID();
        if (first === -1) {
            return [];
        }
        const result: ArkFile[] = [];
        for (let id = 1; id < first; id++) {
            const model = this.registry.fileSigCanonicalizer.getModel(id);
            if (model !== undefined) {
                result.push(model);
            }
        }
        return result;
    }

    public getModuleSdkMap(): Map<string, Sdk[]> {
        return this.moduleSdkMap;
    }

    public getProjectSdkMap(): Map<string, Sdk> {
        return this.projectSdkMap;
    }

    /**
     * Returns the namespace according to the input namespace signature.
     * @param namespaceSignature - signature of the namespace to be obtained.
     * @returns A namespace, or null when the signature was never interned.
     */
    public getNamespace(namespaceSignature: NamespaceSignature): ArkNamespace | null {
        const id = this.registry.namespaceSigCanonicalizer.getExistingId(namespaceSignature);
        if (id === -1) {
            return null;
        }
        return this.registry.namespaceSigCanonicalizer.getModel(id) ?? null;
    }

    /** 获取全部 project 文件的 ArkNamespace（不含 SDK，含嵌套层级摊平）。*/
    public getNamespaces(): ArkNamespace[] {
        const reg = this.registry;
        const size = reg.namespaceSigCanonicalizer.size();
        const result: ArkNamespace[] = [];
        for (let id = 1; id < size; id++) {
            const ns = reg.namespaceSigCanonicalizer.getModel(id);
            if (ns === undefined) {
                continue;
            }
            if (!ns.getDeclaringArkFile().isProjectFile()) {
                continue;
            }
            result.push(ns);
        }
        return result;
    }

    /**
     * Returns the class according to the input class signature.
     * @param classSignature - signature of the class to be obtained.
     * @returns A class, or null when the signature was never interned.
     */
    public getClass(classSignature: ClassSignature): ArkClass | null {
        const id = this.registry.classSigCanonicalizer.getExistingId(classSignature);
        if (id === -1) {
            return null;
        }
        return this.registry.classSigCanonicalizer.getModel(id) ?? null;
    }

    public getCustomComponent(name: string): ClassSignature | undefined {
        return name ? this.registry.customComponentMap.get(name) : undefined;
    }

    public getCustomComponentMap(): Map<string, ClassSignature> {
        return this.registry.customComponentMap;
    }

    /** 获取全部 project 文件的 ArkClass（不含 SDK 类）。*/
    public getClasses(): ArkClass[] {
        const reg = this.registry;
        const size = reg.classSigCanonicalizer.size();
        const result: ArkClass[] = [];
        for (let id = 1; id < size; id++) {
            const cls = reg.classSigCanonicalizer.getModel(id);
            if (cls === undefined) {
                continue;
            }
            if (!cls.getDeclaringArkFile().isProjectFile()) {
                continue;
            }
            result.push(cls);
        }
        return result;
    }

    /**
     * Returns the method associated with the method signature (implementation or declaration).
     * @param methodSignature - the signature of method.
     * @returns The method associated with the method signature, or null if not found.
     */
    public getMethod(methodSignature: MethodSignature): ArkMethod | null;
    /**
     * @deprecated The `refresh` parameter has no effect and will be removed in a future release.
     * Use the single-argument form instead.
     */
    public getMethod(methodSignature: MethodSignature, refresh?: boolean): ArkMethod | null;
    public getMethod(methodSignature: MethodSignature, _refresh?: boolean): ArkMethod | null {
        // Fast path: O(1) model lookup (read-only, never interns the signature).
        const arkMethod = this.registry.getMethodBySig(methodSignature);
        if (arkMethod !== undefined) {
            return arkMethod;
        }
        // Fallback: closure-rebuilt signatures may not be registered as models yet —
        // resolve via the declaring class's local traversal (isMatch-based). Read-only:
        // no interning and no model back-fill (query paths must not write).
        return this.getClass(methodSignature.getDeclaringClassSignature())?.getMethod(methodSignature) ?? null;
    }

    /**
     * Returns the method associated with the method signature.
     * If no method is associated with this signature, **null** will be returned.
     * An {@link ArkMethod} includes:
     * - Name: the **string** name of method.
     * - Code: the **string** code of the method.
     * - Line: a **number** indicating the line location, initialized as -1.
     * - Column: a **number** indicating the column location, initialized as -1.
     * - Parameters & Types of parameters: the parameters of method and their types.
     * - View tree: the view tree of the method.
     * - ...
     *
     * @returns The method associated with the method signature.
     * @example
     * 1. get method from getMethod.

     ```typescript
     const methodSignatures = this.CHA.resolveCall(xxx, yyy);
     for (const methodSignature of methodSignatures) {
     const method = this.scene.getMethod(methodSignature);
     ... ...
     }
     ```
     */
    public getMethods(): ArkMethod[] {
        const methods: ArkMethod[] = [];
        for (const cls of this.getClasses()) {
            for (const method of cls.getMethods(true)) {
                methods.push(method);
            }
        }
        return methods;
    }

    /**
     * Dispose a module's data from all global indices.
     *
     * Removes the module's ArkFiles, ArkClasses, ArkMethods, and ArkNamespaces from the Scene's
     * global canonicalizers and clears
     * the oh-package.json5 content cache. After this call, the module's heavy data is no longer
     * reachable via Scene's global indices and can be garbage-collected.
     *
     * The global sdkGlobalMap is NOT cleaned (its keys are flat global names that cannot be
     * reverse-mapped to a module). SDK modules should not be disposed.
     *
     * @param module - The module whose data should be removed from global indices.
     */
    public disposeModule(module: ArkModule): void {
        for (const arkFile of module.getFilesMap().values()) {
            this.registry.removeFile(arkFile);
            for (const ns of arkFile.getAllNamespacesUnderThisFile()) {
                this.registry.removeNamespace(ns);
            }
            for (const cls of ModelUtils.getAllClassesInFile(arkFile)) {
                this.registry.removeClassModel(cls);
                for (const fld of cls.getFields()) {
                    this.registry.removeField(fld);
                }
                for (const mtd of cls.getMethods(true)) {
                    this.registry.removeMethod(mtd);
                    // Release heavy per-method IR (ArkBody/CFG/Stmt/Locals + ViewTree) so it can be
                    // GC'd on eviction, even if the ArkMethod/ArkFile skeleton is still referenced
                    // by residual back-edges. Bodies/viewTrees are rebuilt on reload.
                    mtd.clearBodyAndSupplementary();
                }
                // Sever back-references: remove this class from its base classes' extended classes,
                // otherwise base classes (e.g. SDK) keep evicted project classes alive (memory leak).
                for (const base of cls.getAllHeritageClasses()) {
                    base.removeExtendedClass(cls);
                }
            }
            // Release the TS AST (SourceFile) and cached source text; getCode() re-reads from disk.
            arkFile.setAST(null);
            arkFile.clearSourceCode();
        }
        // 驱逐模块的 oh-package 表项清理：经活跃构建上下文 best-effort（增量路径
        // 上下文通常已释放，此时无 DFS 消费该表，跳过安全）。
        this.getActiveSceneBuilder()?.getOhPkgContentMap().delete(module.getOhPkgPath());
    }

    public hasMainMethod(): boolean {
        return false;
    }

    //Get the set of entry points that are used to build the call graph.
    public getEntryPoints(): MethodSignature[] {
        return [];
    }

    /** get values that is visible in curr scope */
    public getVisibleValue(): VisibleValue {
        return this.visibleValue;
    }

    public makeCallGraphCHA(entryPoints: MethodSignature[]): CallGraph {
        let callGraph = new CallGraph(this);
        let callGraphBuilder = new CallGraphBuilder(callGraph, this);
        callGraphBuilder.buildClassHierarchyCallGraph(entryPoints);
        return callGraph;
    }

    public makeCallGraphRTA(entryPoints: MethodSignature[]): CallGraph {
        let callGraph = new CallGraph(this);
        let callGraphBuilder = new CallGraphBuilder(callGraph, this);
        callGraphBuilder.buildRapidTypeCallGraph(entryPoints);
        return callGraph;
    }

    /** Obtain the header file directories of the input C++ project dependencies. */
    public getIncludeDirs(): string[] {
        return this.includeDirs;
    }

    public getCcjsonPath(): string {
        return this.ccjsonPath;
    }

    public setCcjsonPath(ccjsonPath: string): void {
        this.ccjsonPath = ccjsonPath;
    }

    public getCppAstPath(): string {
        return this.cppAstPath;
    }

    /**
     * Infer type for each non-default method. It infers the type of each field/local/reference.
     * For example, the statement `let b = 5;`, the type of local `b` is `NumberType`; and for the statement `let s =
     * 'hello';`, the type of local `s` is `StringType`. The detailed types are defined in the Type.ts file.
     * @example
     * 1. Infer the type of each class field and method field.
     ```typescript
     const scene = new Scene();
     scene.buildSceneFromProjectDir(sceneConfig);
     scene.inferTypes();
     ```
     */
    public inferTypes(times: number = 1): void {
        if (times < 1) {
            return;
        } else if (times > 5) {
            times = 5;
        }
        while (times > 0) {
            this.stageStatistics?.startStage(StageName.InferTypes);
            for (const fileSigID of this.builtFileOrder) {
                const file = this.registry.fileSigCanonicalizer.getModel(fileSigID);
                if (file === undefined) {
                    continue;
                }
                InferenceManager.getInstance().getInference(file.getLanguage()).doInfer(file);
                this.stageStatistics?.recordMemoryCheckpoint();
            }
            this.stageStatistics?.endStage(StageName.InferTypes);
            times--;
        }
        this.stageStatistics?.startStage(StageName.InferTypesFinalize);
        if (this.buildStage < SceneBuildStage.TYPE_INFERRED) {
            this.buildStage = SceneBuildStage.TYPE_INFERRED;
        }
        this.checkTempSignatureCompleteness();
        if (this.getOptions().validateCanonicalizers === true) {
            CanonicalizerValidator.validateAll();
        }
        SdkUtils.dispose();
        ModuleUtils.dispose();
        ValueUtil.dispose();
        clearCxxTypeStringCache();
        this.stageStatistics?.endStage(StageName.InferTypesFinalize);
        // 签名空间快照（时点 2）：推导完成后的 formal/temp 数据进报告。
        this.stageStatistics?.recordSignatureStats('post-infer');
    }

    private checkTempSignatureCompleteness(): void {
        const stats = this.registry.getTempSpacesStats();
        const liveTotal = stats.class.liveCount + stats.method.liveCount + stats.field.liveCount;
        if (liveTotal > 0) {
            const brief = {
                class: { live: stats.class.liveCount, retired: stats.class.retiredCount },
                method: { live: stats.method.liveCount, retired: stats.method.retiredCount },
                field: { live: stats.field.liveCount, retired: stats.field.retiredCount },
            };
            logger.warn(`Unresolved signatures still alive after type inference (index-table exact stats): ${JSON.stringify(brief)}`);
        }
    }

    /**
     * @deprecated This method is deprecated and will be removed in the next major release.
     * Please use the new type inference system instead.
     *
     * Scheduled for removal: one month from deprecation date.
     */
    public inferTypesOld(): void {
        // CXXTodo: Building the mapping between declarations and implementations of C++ functions in cross-file scenarios.
        CxxIRInference.mapCxxDeclAndImpl(this);
        this.getFiles().forEach(file => {
            try {
                // CXXTodo: Distinguish between C++ and TS/ArkTS.
                file.getLanguage() === Language.CXX ? CxxIRInference.inferFile(file) : IRInference.inferFile(file);
            } catch (error) {
                logger.error('Error inferring types of project file:', file.getFileSignature(), error);
            }
        });
        if (this.buildStage < SceneBuildStage.TYPE_INFERRED) {
            this.buildStage = SceneBuildStage.TYPE_INFERRED;
        }
        SdkUtils.dispose();
    }

    /** @deprecated 请改用 {@link inferTypes}（完整类型推断含 simple type 推断能力）。 */
    public inferSimpleTypes(): void {
        for (let arkFile of this.getFiles()) {
            for (let arkClass of arkFile.getClasses()) {
                for (let arkMethod of arkClass.getMethods()) {
                    TypeInference.inferSimpleTypeInMethod(arkMethod);
                }
            }
        }
    }

    private addNSClasses(
        namespaceStack: ArkNamespace[],
        finalNamespaces: ArkNamespace[],
        classMap: Map<FileSignature | NamespaceSignature, ArkClass[]>,
        parentMap: Map<ArkNamespace, ArkNamespace | ArkFile>
    ): void {
        while (namespaceStack.length > 0) {
            const ns = namespaceStack.shift()!;
            const nsClass: ArkClass[] = [];
            for (const arkClass of ns.getClasses()) {
                nsClass.push(arkClass);
            }
            classMap.set(ns.getNamespaceSignature(), nsClass);
            if (ns.getNamespaces().length === 0) {
                finalNamespaces.push(ns);
            } else {
                for (const nsns of ns.getNamespaces()) {
                    namespaceStack.push(nsns);
                    parentMap.set(nsns, ns);
                }
            }
        }
    }

    private addNSExportedClasses(
        finalNamespaces: ArkNamespace[],
        classMap: Map<FileSignature | NamespaceSignature, ArkClass[]>,
        parentMap: Map<ArkNamespace, ArkNamespace | ArkFile>
    ): void {
        while (finalNamespaces.length > 0) {
            const finalNS = finalNamespaces.shift()!;
            const exportClass = [];
            for (const arkClass of finalNS.getClasses()) {
                if (arkClass.isExported()) {
                    exportClass.push(arkClass);
                }
            }
            const parent = parentMap.get(finalNS)!;
            if (parent instanceof ArkNamespace) {
                classMap.get(parent.getNamespaceSignature())?.push(...exportClass);
            } else if (parent instanceof ArkFile) {
                classMap.get(parent.getFileSignature())?.push(...exportClass);
            }
            let p = finalNS;
            while (!(parentMap.get(p) instanceof ArkFile) && p.isExported()) {
                const grandParent = parentMap.get(parentMap.get(p)! as ArkNamespace);
                if (grandParent instanceof ArkNamespace) {
                    classMap.get(grandParent.getNamespaceSignature())?.push(...exportClass);
                    p = parentMap.get(p)! as ArkNamespace;
                } else if (grandParent instanceof ArkFile) {
                    classMap.get(grandParent.getFileSignature())?.push(...exportClass);
                    break;
                }
            }
            if (parent instanceof ArkNamespace && !finalNamespaces.includes(parent)) {
                finalNamespaces.push(parent);
            }
        }
    }

    private addFileImportedClasses(file: ArkFile, classMap: Map<FileSignature | NamespaceSignature, ArkClass[]>): void {
        const importClasses: ArkClass[] = [];
        const importNameSpaces: ArkNamespace[] = [];
        for (const importInfo of file.getImportInfos()) {
            const importClass = ModelUtils.getClassInImportInfoWithName(importInfo.getImportClauseName(), file);
            if (importClass && !importClasses.includes(importClass)) {
                importClasses.push(importClass);
                continue;
            }
            const importNameSpace = ModelUtils.getNamespaceInImportInfoWithName(importInfo.getImportClauseName(), file);
            if (importNameSpace && !importNameSpaces.includes(importNameSpace)) {
                try {
                    // 遗留问题：只统计了项目文件的namespace，没统计sdk文件内部的引入
                    const importNameSpaceClasses = classMap.get(importNameSpace.getNamespaceSignature())!;
                    importClasses.push(...importNameSpaceClasses.filter(c => !importClasses.includes(c) && c.getName() !== DEFAULT_ARK_CLASS_NAME));
                } catch {}
            }
        }
        const fileClasses = classMap.get(file.getFileSignature())!;
        fileClasses.push(...importClasses.filter(c => !fileClasses.includes(c)));
        // 子节点加上父节点的class
        const namespaceStack = [...file.getNamespaces()];
        for (const ns of namespaceStack) {
            const nsClasses = classMap.get(ns.getNamespaceSignature())!;
            nsClasses.push(...fileClasses.filter(c => !nsClasses.includes(c) && c.getName() !== DEFAULT_ARK_CLASS_NAME));
        }
        while (namespaceStack.length > 0) {
            const ns = namespaceStack.shift()!;
            const nsClasses = classMap.get(ns.getNamespaceSignature())!;
            for (const nsns of ns.getNamespaces()) {
                const nsnsClasses = classMap.get(nsns.getNamespaceSignature())!;
                nsnsClasses.push(...nsClasses.filter(c => !nsnsClasses.includes(c) && c.getName() !== DEFAULT_ARK_CLASS_NAME));
                namespaceStack.push(nsns);
            }
        }
    }

    /** @deprecated 如需全部 project 类请使用 {@link getClasses}。*/
    public getClassMap(): Map<FileSignature | NamespaceSignature, ArkClass[]> {
        const classMap: Map<FileSignature | NamespaceSignature, ArkClass[]> = new Map();
        for (const file of this.getFiles()) {
            const fileClass: ArkClass[] = [];
            const namespaceStack: ArkNamespace[] = [];
            const parentMap: Map<ArkNamespace, ArkNamespace | ArkFile> = new Map();
            const finalNamespaces: ArkNamespace[] = [];
            for (const arkClass of file.getClasses()) {
                fileClass.push(arkClass);
            }
            for (const ns of file.getNamespaces()) {
                namespaceStack.push(ns);
                parentMap.set(ns, file);
            }

            classMap.set(file.getFileSignature(), fileClass);
            // 第一轮遍历，加上每个namespace自己的class
            this.addNSClasses(namespaceStack, finalNamespaces, classMap, parentMap);

            // 第二轮遍历，父节点加上子节点的export的class
            this.addNSExportedClasses(finalNamespaces, classMap, parentMap);
        }

        for (const file of this.getFiles()) {
            // 文件加上import的class，包括ns的
            this.addFileImportedClasses(file, classMap);
        }
        return classMap;
    }

    private addNSLocals(
        namespaceStack: ArkNamespace[],
        finalNamespaces: ArkNamespace[],
        parentMap: Map<ArkNamespace, ArkNamespace | ArkFile>,
        globalVariableMap: Map<FileSignature | NamespaceSignature, Local[]>
    ): void {
        while (namespaceStack.length > 0) {
            const ns = namespaceStack.shift()!;
            const nsGlobalLocals: Local[] = [];
            ns.getDefaultClass()
                .getDefaultArkMethod()!
                .getBody()
                ?.getLocals()
                .forEach(local => {
                    if (local.getDeclaringStmt() && local.getName() !== 'this' && local.getName()[0] !== '$') {
                        nsGlobalLocals.push(local);
                    }
                });
            globalVariableMap.set(ns.getNamespaceSignature(), nsGlobalLocals);
            if (ns.getNamespaces().length === 0) {
                finalNamespaces.push(ns);
            } else {
                for (const nsns of ns.getNamespaces()) {
                    namespaceStack.push(nsns);
                    parentMap.set(nsns, ns);
                }
            }
        }
    }

    private addNSExportedLocals(
        finalNamespaces: ArkNamespace[],
        globalVariableMap: Map<FileSignature | NamespaceSignature, Local[]>,
        parentMap: Map<ArkNamespace, ArkNamespace | ArkFile>
    ): void {
        while (finalNamespaces.length > 0) {
            const finalNS = finalNamespaces.shift()!;
            const exportLocal = [];
            for (const exportInfo of finalNS.getExportInfos()) {
                if (exportInfo.getExportClauseType() === ExportType.LOCAL && exportInfo.getArkExport()) {
                    exportLocal.push(exportInfo.getArkExport() as Local);
                }
            }
            const parent = parentMap.get(finalNS)!;
            if (parent instanceof ArkNamespace) {
                globalVariableMap.get(parent.getNamespaceSignature())?.push(...exportLocal);
            } else if (parent instanceof ArkFile) {
                globalVariableMap.get(parent.getFileSignature())?.push(...exportLocal);
            }
            let p = finalNS;
            while (!(parentMap.get(p) instanceof ArkFile) && p.isExported()) {
                const grandParent = parentMap.get(parentMap.get(p)! as ArkNamespace);
                if (grandParent instanceof ArkNamespace) {
                    globalVariableMap.get(grandParent.getNamespaceSignature())?.push(...exportLocal);
                    p = parentMap.get(p)! as ArkNamespace;
                } else if (grandParent instanceof ArkFile) {
                    globalVariableMap.get(grandParent.getFileSignature())?.push(...exportLocal);
                    break;
                }
            }
            if (parent instanceof ArkNamespace && !finalNamespaces.includes(parent)) {
                finalNamespaces.push(parent);
            }
        }
    }

    private addFileImportLocals(file: ArkFile, globalVariableMap: Map<FileSignature | NamespaceSignature, Local[]>): void {
        const importLocals: Local[] = [];
        const importNameSpaces: ArkNamespace[] = [];
        for (const importInfo of file.getImportInfos()) {
            const importLocal = ModelUtils.getLocalInImportInfoWithName(importInfo.getImportClauseName(), file);
            if (importLocal && !importLocals.includes(importLocal)) {
                importLocals.push(importLocal);
            }
            const importNameSpace = ModelUtils.getNamespaceInImportInfoWithName(importInfo.getImportClauseName(), file);
            if (importNameSpace && !importNameSpaces.includes(importNameSpace)) {
                try {
                    // 遗留问题：只统计了项目文件，没统计sdk文件内部的引入
                    const importNameSpaceClasses = globalVariableMap.get(importNameSpace.getNamespaceSignature())!;
                    importLocals.push(...importNameSpaceClasses.filter(c => !importLocals.includes(c) && c.getName() !== DEFAULT_ARK_CLASS_NAME));
                } catch {}
            }
        }
        const fileLocals = globalVariableMap.get(file.getFileSignature())!;
        fileLocals.push(...importLocals.filter(c => !fileLocals.includes(c)));
        // 子节点加上父节点的local
        const namespaceStack = [...file.getNamespaces()];
        for (const ns of namespaceStack) {
            const nsLocals = globalVariableMap.get(ns.getNamespaceSignature())!;
            const nsLocalNameSet = new Set<string>(nsLocals.map(item => item.getName()));
            for (const local of fileLocals) {
                if (!nsLocalNameSet.has(local.getName())) {
                    nsLocals.push(local);
                }
            }
        }
        while (namespaceStack.length > 0) {
            const ns = namespaceStack.shift()!;
            const nsLocals = globalVariableMap.get(ns.getNamespaceSignature())!;
            for (const nsns of ns.getNamespaces()) {
                this.handleNestedNSLocals(nsns, nsLocals, globalVariableMap);
                namespaceStack.push(nsns);
            }
        }
    }

    private handleNestedNSLocals(nsns: ArkNamespace, nsLocals: Local[], globalVariableMap: Map<FileSignature | NamespaceSignature, Local[]>): void {
        const nsnsLocals = globalVariableMap.get(nsns.getNamespaceSignature())!;
        const nsnsLocalNameSet = new Set<string>(nsnsLocals.map(item => item.getName()));
        for (const local of nsLocals) {
            if (!nsnsLocalNameSet.has(local.getName())) {
                nsnsLocals.push(local);
            }
        }
    }

    /** @deprecated 依赖 file→ns→class 结构骨架遍历，与 registry 事实源化的方向不一致。*/
    public getGlobalVariableMap(): Map<FileSignature | NamespaceSignature, Local[]> {
        const globalVariableMap: Map<FileSignature | NamespaceSignature, Local[]> = new Map();
        for (const file of this.getFiles()) {
            const namespaceStack: ArkNamespace[] = [];
            const parentMap: Map<ArkNamespace, ArkNamespace | ArkFile> = new Map();
            const finalNamespaces: ArkNamespace[] = [];
            const globalLocals: Local[] = [];
            file.getDefaultClass()
                ?.getDefaultArkMethod()!
                .getBody()
                ?.getLocals()
                .forEach(local => {
                    if (local.getDeclaringStmt() && local.getName() !== 'this' && local.getName()[0] !== '$') {
                        globalLocals.push(local);
                    }
                });
            globalVariableMap.set(file.getFileSignature(), globalLocals);
            for (const ns of file.getNamespaces()) {
                namespaceStack.push(ns);
                parentMap.set(ns, file);
            }
            // 第一轮遍历，加上每个namespace自己的local
            this.addNSLocals(namespaceStack, finalNamespaces, parentMap, globalVariableMap);

            // 第二轮遍历，父节点加上子节点的export的local
            this.addNSExportedLocals(finalNamespaces, globalVariableMap, parentMap);
        }

        for (const file of this.getFiles()) {
            // 文件加上import的local，包括ns的
            this.addFileImportLocals(file, globalVariableMap);
        }
        return globalVariableMap;
    }

    public getStaticInitMethods(): ArkMethod[] {
        const staticInitMethods: ArkMethod[] = [];
        for (const cls of this.getClasses()) {
            for (const method of cls.getMethods(true)) {
                if (method.getName() === STATIC_INIT_METHOD_NAME) {
                    staticInitMethods.push(method);
                }
            }
        }
        return staticInitMethods;
    }

    public buildClassDone(): boolean {
        return this.buildStage >= SceneBuildStage.CLASS_DONE;
    }

    public getModuleScene(moduleName: string): ModuleScene | undefined {
        return this.moduleScenesMap.get(moduleName);
    }

    public getModuleSceneMap(): Map<string, ModuleScene> {
        return this.moduleScenesMap;
    }

    /** tsconfig paths/baseUrl 配置产物快照（SceneBuilder.parseProjectConfigs 结束回填）。 */
    private tsConfigPathsSnapshot?: { [k: string]: string[] };
    private baseUrlSnapshot?: string;

    /** @internal 构建期上下文回填配置产物快照（构建后 getGlobalModule2PathMapping/getbaseUrl 可查）。 */
    public setTsConfigSnapshot(paths?: { [k: string]: string[] }, baseUrl?: string): void {
        this.tsConfigPathsSnapshot = paths;
        this.baseUrlSnapshot = baseUrl;
    }

    public getGlobalModule2PathMapping(): { [k: string]: string[] } | undefined {
        return this.tsConfigPathsSnapshot;
    }

    public getbaseUrl(): string | undefined {
        return this.baseUrlSnapshot;
    }

    /** 根 oh-package.json5 内容快照（SceneBuilder.parseOhPackage 结束回填）。 */
    private ohPkgContentSnapshot: { [k: string]: unknown } = {};

    /** @internal 构建期上下文回填根 oh-package 内容快照（构建后 getOhPkgContent 可查）。 */
    public setOhPkgContentSnapshot(content: { [k: string]: unknown }): void {
        this.ohPkgContentSnapshot = content;
    }

    /**
     * Get the parsed content of the project's root `oh-package.json5`.
     * Returns an empty object when the project has no oh-package.json5 or before the
     * scene is built.
     * @returns The oh-package.json5 content.
     */
    public getOhPkgContent(): { [p: string]: unknown } {
        return this.ohPkgContentSnapshot;
    }

    /**
     * Get the collected stage statistics data, or undefined if statistics is disabled.
     * Auto-finalizes the collector if still running.
     */
    public getStageStatistics(): StageStatisticsData | undefined {
        if (!this.stageStatistics) {
            return undefined;
        }
        return this.stageStatistics.getStatistics();
    }

    /**
     * Print stage statistics to the logger.
     */
    public printStageStatistics(): void {
        if (!this.stageStatistics) {
            return;
        }
        const data = this.stageStatistics.getStatistics();
        const report = StageStatisticsReporter.generateReport(data);
        logger.info(StageStatisticsReporter.exportToText(report));
        this.statsReportWritten = true;
    }

    /**
     * Export stage statistics as a text report to the given file path.
     * @returns true if the report was written, false if statistics is disabled.
     */
    public exportStageStatisticsReport(filePath: string): boolean {
        if (!this.stageStatistics) {
            return false;
        }
        const data = this.stageStatistics.getStatistics();
        const report = StageStatisticsReporter.generateReport(data);
        StageStatisticsReporter.saveReportToFile(report, filePath);
        this.statsReportWritten = true;
        return true;
    }

    /**
     * Register a process 'exit' hook that auto-writes the statistics report
     * when the process terminates, so users only need `enableStatistics: true`
     * without calling any output API manually.
     */
    private registerStatsExitHook(): void {
        if (this.statsExitHandler) {
            return;
        }
        this.statsExitHandler = () => {
            if (!this.stageStatistics || this.statsReportWritten) {
                return;
            }
            this.statsReportWritten = true;
            this.stageStatistics.finish();
            const data = this.stageStatistics.getStatistics();
            const report = StageStatisticsReporter.generateReport(data);
            const reportPath = this.getStatisticsReportPath();
            StageStatisticsReporter.saveReportToFile(report, reportPath);
            process.stdout.write(`Statistics report auto-saved to: ${reportPath}\n`);
        };
        process.on('exit', this.statsExitHandler);
    }

    /**
     * Resolve the default statistics report file path.
     * Uses `SceneOptions.statisticsOutputPath` if provided, otherwise
     * defaults to `out/<projectName>_statistics.txt` under the current working directory.
     */
    private getStatisticsReportPath(): string {
        const custom = this.options?.statisticsOutputPath;
        if (custom) {
            return custom;
        }
        const dir = path.join(process.cwd(), 'out');
        return path.join(dir, `${this.projectName || 'arkanalyzer'}_statistics.txt`);
    }
}
