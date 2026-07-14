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

import { SparseBitVector } from '../../utils/SparseBitVector';
import { Canonicalizer } from '../../utils/Canonicalizer';
import { ArkModule, ModuleID, ModuleLoadState, ModuleType } from '../../core/model/ArkModule';
import { ModuleDepGraph, DependencyType } from '../../core/graph/ModuleDepGraph';
import { FileDepGraph } from '../../core/graph/FileDepGraph';
import { BUILD_PROFILE_JSON5, OH_MODULES, MODULE_PREFIX, OH_PACKAGE_JSON5, OHPM } from '../../core/common/EtsConst';
import { OH_PKG_DEPENDENCIES, OH_PKG_DEV_DEPENDENCIES, OH_PKG_DYNAMIC_DEPENDENCIES } from '../../core/common/Const';
import { fetchDependenciesFromFile, parseJsonText } from '../../utils/json5parser';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ModuleDepthLevel } from './ModuleDepth';
import { ModuleAnalysisConfig } from './ModuleAnalysisConfig';
import { MemoryMonitor } from './MemoryMonitor';
import { ModuleCache, HeapUsedEstimateState } from './ModuleCache';
import { FrontendBuilder } from '../FrontendBuilder';
import { ArkFile, Language } from '../../core/model/ArkFile';
import { InferenceManager } from '../../core/inference/Inference';
import { FileUtils } from '../../utils/FileUtils';
import { getAllFiles } from '../../utils/getAllFiles';
import { SdkUtils } from '../../core/common/SdkUtils';
import { ArktsFrontend } from '../arktsFrontend/ArktsFrontend';
import { ModelUtils } from '../../core/common/ModelUtils';
import { ModuleUtils, ModulePath } from '../../utils/ModuleUtils';
import { SceneBuildStage } from '../../Scene';
import type { Scene } from '../../Scene';
import type { SceneOptions } from '../../Config';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ModuleBuilder');

/**
 * ModuleBuilder holds the build logic for module-level analysis embedded in {@link Scene}.
 *
 * It is responsible for the build side of the module lifecycle: registration, SDK build, module
 * preparation, dependency graph construction and SCC analysis, and module loading. Persistent
 * state (the Canonicalizer, pathToId map, dependency graph, and progress flags) lives on the
 * owning {@link Scene}; this class reads and writes that state through the Scene accessors.
 *
 * Each module is identified by its absolute path and assigned a dense integer {@link ModuleID} via
 * the Scene's Canonicalizer using the objectIdentity strategy. The `pathToId` map on the Scene is
 * a persistent cache that survives graph construction, allowing runtime path-based lookups.
 *
 * @category core/model
 */
export class ModuleBuilder {
    private scene: Scene;

    /** Persistent map from absolute module path to ModuleID (survives graph construction). */
    private pathToId: Map<string, ModuleID> = new Map();

    /** Reference to Scene's persistent memory monitor; set by initCacheManagement. */
    private monitor?: MemoryMonitor;
    /** Reference to Scene's persistent module cache; set by initCacheManagement. */
    private cache?: ModuleCache;
    /** Topological order of the current call, used for protected-set computation and Phase 2/3 reverse-topo iteration. */
    private topoOrder: ModuleID[] = [];
    /** Map from moduleId to its index in topoOrder for O(1) lookup. */
    private topoOrderIndex?: Map<ModuleID, number>;

    /** Load level to which protected dependency modules are downgraded during eviction Phase 2. */
    private dependencyLoadLevel: ModuleDepthLevel = ModuleDepthLevel.SIGNATURES;

    /**
     * Estimated heapUsed bytes per file for each depth level, used for pre-load memory cost estimation.
     * Calibrated from scene_board_ext measurements (no-eviction, no GC runs):
     * - BODIES: P75 of per-module heapUsed-per-file at BODIES level = ~1.7MB/file
     * - SIGNATURES: P75 of per-module heapUsed-per-file at SIGNATURES level = ~700KB/file
     * - IMPORTS/META: negligible (metadata only).
     *
     * No-GC calibration matches production conditions (no forced GC). Without GC,
     * heapUsed increments include uncollected garbage from parsing and type inference,
     * which is several times larger than surviving data.
     *
     * Used for pre-load estimation (deciding whether eviction is needed before loading)
     * and as a fallback for unload estimation when the heapUsed table has no entry.
     */
    private static readonly HEAPUSED_PER_FILE: Map<ModuleDepthLevel, number> = new Map([
        [ModuleDepthLevel.META, 0],
        [ModuleDepthLevel.IMPORTS, 0],
        [ModuleDepthLevel.SIGNATURES, 700_000],
        [ModuleDepthLevel.BODIES, 1_700_000],
    ]);

    /**
     * Ratio of memory released by downgrading from BODIES to SIGNATURES, relative to
     * the BODIES-level heapUsed. Calibrated from GC trace test data:
     * downgrade releases ~60% of BODIES heapUsed (method bodies + AST + source code).
     */
    private static readonly DOWNGRADE_RELEASE_RATIO = 0.6;

    constructor(scene: Scene) {
        this.scene = scene;
        // Initialize pathToId from existing modules (supports idempotent calls)
        for (const module of scene.getModules()) {
            this.pathToId.set(module.getModulePath(), scene.getModuleId(module));
        }
    }

    // --- Module query methods (moved from Scene) ---

    /** Get a registered module by its ModuleID. Returns undefined when the id is out of bounds. */
    public getModule(id: ModuleID): ArkModule | undefined {
        return this.scene.getModule(id);
    }

    /** Look up a module by its absolute path using the pathToId cache. */
    public getModuleByPath(modulePath: string): ArkModule | undefined {
        const id = this.pathToId.get(modulePath);
        if (id === undefined) {
            return undefined;
        }
        return this.scene.getModule(id);
    }

    /** Total number of registered modules. */
    public getModuleCount(): number {
        return this.scene.getModuleCount();
    }

    /**
     * Iterate over all registered modules.
     * Iteration order follows ModuleID assignment order (0, 1, 2, ...).
     */
    public modulesIterator(): IterableIterator<ArkModule> {
        const cursor = { value: 0 };
        const iterator: IterableIterator<ArkModule> = {
            next: (): IteratorResult<ArkModule> => this.nextModule(cursor),
            [Symbol.iterator](): IterableIterator<ArkModule> {
                return this;
            },
        };
        return iterator;
    }

    /** Find the next module starting from the cursor. */
    private nextModule(cursor: { value: number }): IteratorResult<ArkModule> {
        while (cursor.value < this.scene.getModuleCount()) {
            const m = this.scene.getModule(cursor.value);
            cursor.value++;
            if (m) {
                return { value: m, done: false };
            }
        }
        return { value: undefined as unknown as ArkModule, done: true };
    }

    /** Topologically sorted module IDs (empty before dependency analysis completes). */
    public getTopoOrder(): ModuleID[] {
        const graph = this.scene.getModuleDepGraph();
        return graph ? graph.getTopoOrder() : [];
    }

    /**
     * Resolve a dependency alias within the scope of the given module.
     * Looks up the alias in the module's per-module alias map, then resolves the
     * resulting ModuleID back to the depended-on ArkModule.
     */
    public resolveAlias(moduleId: ModuleID, alias: string): ArkModule | undefined {
        const module = this.getModule(moduleId);
        if (!module) {
            return undefined;
        }
        const depId = module.resolveDependencyAlias(alias);
        if (depId === undefined) {
            return undefined;
        }
        return this.getModule(depId);
    }

    /**
     * Resolve the final set of target module IDs from the config's three selection dimensions.
     * Excluded IDs take precedence; type filter and explicit include IDs are unioned.
     */
    public resolveTargetModuleIds(config: ModuleAnalysisConfig): SparseBitVector {
        const targets = new SparseBitVector();
        const excluded = config.getExcludedModuleIds();
        const included = config.getTargetModuleIds();
        for (const module of this.modulesIterator()) {
            const id = this.scene.getModuleId(module);
            if (excluded.test(id)) {
                continue;
            }
            if (config.isTypeIncluded(module.getModuleType()) || included.test(id)) {
                targets.set(id);
            }
        }
        return targets;
    }

    /**
     * Compute transitive closure of module IDs reachable from the given target IDs via
     * dependency edges (BFS over {@link ModuleDepGraph.getSuccModuleIds}).
     * SDK modules are never included in the closure.
     */
    public computeModuleClosureByIds(targetIds: SparseBitVector): SparseBitVector {
        const closure = new SparseBitVector();
        const queue: ModuleID[] = [];

        for (const id of targetIds) {
            const module = this.scene.getModule(id);
            if (!module || module.getModuleType() === ModuleType.SDK) {
                continue;
            }
            if (!closure.test(id)) {
                closure.set(id);
                queue.push(id);
            }
        }

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const graph = this.scene.getModuleDepGraph();
            const succIds = graph ? graph.getSuccModuleIds(currentId) : [];
            for (const depId of succIds) {
                if (closure.test(depId)) {
                    continue;
                }
                const depModule = this.scene.getModule(depId);
                if (!depModule || depModule.getModuleType() === ModuleType.SDK) {
                    continue;
                }
                closure.set(depId);
                queue.push(depId);
            }
        }

        return closure;
    }

    /** Filter the topological order to only include module IDs present in the given closure. */
    public getFilteredTopoOrder(closure: SparseBitVector): ModuleID[] {
        const graph = this.scene.getModuleDepGraph();
        const topo = graph ? graph.getTopoOrder() : [];
        return topo.filter(id => closure.test(id));
    }

    /** Get the ModuleID assigned to a registered ArkModule. */
    public getModuleId(module: ArkModule): ModuleID {
        return this.scene.getModuleId(module);
    }

    /** Create a {@link ModuleDepGraph} sharing the scene's module canonicalizer. */
    public createModuleDepGraph(): ModuleDepGraph {
        return this.scene.createModuleDepGraph();
    }

    // --- Module registration ---

    /**
     * Register a module by its absolute path. If the same path has already been registered, the
     * existing {@link ArkModule} is returned unchanged. A new ModuleID is allocated via the
     * Scene's Canonicalizer for first-time registrations, and cached on the module.
     *
     * @param modulePath - Absolute path of the module (primary identifier).
     * @param moduleName - Optional module name (auxiliary field, e.g. "@ohos/entry").
     * @returns The registered ArkModule (newly created or previously registered).
     */
    public registerModule(modulePath: string, moduleName: string = ''): ArkModule {
        const existingId = this.pathToId.get(modulePath);
        if (existingId !== undefined) {
            return this.scene.getModule(existingId)!;
        }

        const module = new ArkModule(this.scene);
        module.setModulePath(modulePath);
        module.setModuleName(moduleName);

        const id = this.scene.getModuleId(module);
        this.pathToId.set(modulePath, id);

        return module;
    }

    // --- SDK and module preparation ---

    /**
     * Register and build SDK modules in one fused step. Each project-level SDK is treated as an
     * {@link ArkModule} (moduleType=SDK): its files are collected, parsed, and registered into the
     * module's `filesMap` as well as the scene's `sdkArkFilesMap`. SDK type inference and global
     * API merge run after all SDK files are built.
     *
     * This method merges the former `prepareSdkModules` (registration-only) and `SDKBuilder.buildSdks`
     * (building-only) into a single step — SDK modules are never just registered without being built.
     *
     * Module-level SDKs (those with `moduleName` set) are skipped entirely.
     *
     * Idempotent: guarded by {@link SceneBuildStage.SDK_INFERRED}.
     */
    public buildSdkModules(): void {
        if (this.scene.getBuildStage() >= SceneBuildStage.SDK_INFERRED) {
            return;
        }

        this.setEsVersionFromBuildProfile();

        const sceneConfig = this.scene.getSceneConfig();
        if (!sceneConfig) {
            logger.warn('SceneConfig is not set; skip SDK build.');
            return;
        }

        const sdks = sceneConfig.getSdksObj();
        const options = this.scene.getOptions();

        // Handle enableBuiltIn: prepend built-in SDK if not already present
        if (options.enableBuiltIn && !sdks.find(sdk => sdk.name === SdkUtils.BUILT_IN_NAME)) {
            sdks.unshift(SdkUtils.getBuiltInSdk());
        }

        // Register and build each SDK as a module (fused registration + building).
        // moduleName is ignored — all SDKs are treated as modules regardless.
        for (const sdk of sdks) {
            const sdkPath = path.normalize(sdk.path);
            const module = this.registerModule(sdkPath, sdk.name);
            module.setModuleType(ModuleType.SDK);
            this.buildSdkModuleFiles(module, sdk.name, sdkPath);
            this.scene.getProjectSdkMap().set(sdk.name, sdk);
        }

        // SDK type inference + global API merge
        const sdkArkFiles = this.scene.getSdkArkFiles();
        const sdkGlobalMap = this.scene.getSdkGlobalMap();
        for (const file of sdkArkFiles) {
            if (file.getLanguage() === Language.CXX) {
                continue;
            }
            InferenceManager.getInstance().getInference(file.getLanguage()).doInfer(file);
            SdkUtils.mergeGlobalAPI(file, sdkGlobalMap);
        }
        for (const file of sdkArkFiles) {
            SdkUtils.postInferredSdk(file, sdkGlobalMap);
        }

        this.scene.setBuildStage(SceneBuildStage.SDK_INFERRED);
        SdkUtils.extendArkUI(this.scene);
    }

    /**
     * Collect and build all source files for a single SDK module. Each file is parsed via
     * {@link ArktsFrontend.buildArkFileFromSdkPath} (using the SDK name as projectName), default
     * method bodies are built and all BodyBuilders freed, then the file is registered into both
     * the module's `filesMap` and the scene's `sdkArkFilesMap`. C++ SDK files are skipped.
     */
    private buildSdkModuleFiles(module: ArkModule, sdkName: string, sdkPath: string): void {
        const allFiles = this.collectSdkFiles(sdkName, sdkPath);
        for (const file of allFiles) {
            if (FileUtils.getFileLanguage(file, this.scene.getFileLanguages()) === Language.CXX) {
                continue;
            }
            this.parseAndRegisterSdkFile(module, file, sdkPath, sdkName);
        }
    }

    /**
     * Collect source file paths for an SDK.
     *
     * Built-in SDK uses {@link SdkUtils.fetchBuiltInFiles} (reference-based DFS over `lib.*.d.ts`);
     * other SDKs scan the directory with the scene's supported extensions and ignore patterns.
     */
    private collectSdkFiles(sdkName: string, sdkPath: string): string[] {
        if (sdkName === SdkUtils.BUILT_IN_NAME) {
            const builtInFiles = SdkUtils.fetchBuiltInFiles(sdkPath);
            if (builtInFiles.length > 0) {
                this.scene.getOptions().sdkGlobalFolders?.push(sdkPath);
            }
            return builtInFiles;
        }
        SdkUtils.loadSystemComponentsFromSdk(sdkPath);
        const options = this.scene.getOptions();
        const supportFileExts = options.supportFileExts ?? ['.ets', '.ts'];
        const ignoreFileNames = options.ignoreFileNames ?? [];
        return getAllFiles(sdkPath, supportFileExts, ignoreFileNames);
    }

    /**
     * Parse a single SDK source file into an ArkFile, build default method bodies, free all
     * BodyBuilders, and register the file in both the module's `filesMap` and the scene's
     * `sdkArkFilesMap`.
     */
    private parseAndRegisterSdkFile(module: ArkModule, file: string, sdkPath: string, sdkName: string): void {
        logger.trace('=== parse sdk file:', file);
        try {
            const arkFile: ArkFile = new ArkFile(FileUtils.getFileLanguage(file, this.scene.getFileLanguages()));
            arkFile.setScene(this.scene);
            ArktsFrontend.buildArkFileFromSdkPath(file, sdkPath, arkFile, sdkName);
            ModelUtils.getAllClassesInFile(arkFile).forEach(cls => {
                cls.getDefaultArkMethod()?.buildBody();
                cls.getDefaultArkMethod()?.freeBodyBuilder();
            });
            // Release all method builders in SDK file to avoid retaining AST/build context in memory.
            ModelUtils.getAllMethodsInFile(arkFile).forEach(method => {
                if (method.getDeclaringArkFile()?.getLanguage() === Language.CXX) {
                    method.freeCxxBodyBuilder();
                } else {
                    method.freeBodyBuilder();
                }
            });
            module.addFile(arkFile);
            this.scene.addSdkArkFile(arkFile);
            SdkUtils.buildSdkImportMap(arkFile);
            SdkUtils.loadGlobalAPI(arkFile, this.scene.getSdkGlobalMap());
        } catch (error) {
            logger.error('Error parsing file:', file, error);
            this.scene.getUnhandledSdkFilePaths().push(file);
        }
    }

    /**
     * Read `build-profile.json5` from the project root and call
     * {@link SdkUtils.setEsVersion} so that {@link SdkUtils.fetchBuiltInFiles} selects the correct
     * `lib.*.d.ts` entry.
     */
    private setEsVersionFromBuildProfile(): void {
        const buildProfilePath = path.join(this.scene.getRealProjectDir(), BUILD_PROFILE_JSON5);
        if (!fs.existsSync(buildProfilePath)) {
            return;
        }
        let configurationsText: string;
        try {
            configurationsText = fs.readFileSync(buildProfilePath, 'utf-8');
        } catch (error) {
            logger.error(`Error reading build-profile.json5: ${error}`);
            return;
        }
        const buildProfileJson = parseJsonText(configurationsText);
        SdkUtils.setEsVersion(buildProfileJson);
    }

    /**
     * Prepare modules by discovering and registering project modules and oh_modules dependencies.
     *
     * Reads build-profile.json5 to discover project modules, then scans oh_modules directories
     * to discover third-party dependencies. Only basic info (paths) is registered —
     * oh-package.json5 is NOT read and no dependency graph is built.
     *
     * Idempotent: if module preparation has already been completed via
     * `Scene.setModulesRegistered(true)`, this method returns immediately.
     * Note: this method does NOT set modulesRegistered — that is done by
     * `Scene.analyseByModule` after both prepareModules and analyzeModuleDependencies complete.
     */
    public prepareModules(): void {
        if (this.scene.isModulesRegistered()) {
            return;
        }

        this.registerProjectModules();
        this.registerOhModulesModules();
    }

    /**
     * Read build-profile.json5 from the project root and register each module as
     * ArkModule(moduleType=PROJECT). The module's srcPath is resolved to an absolute path
     * via path.resolve(projectDir, srcPath). oh-package.json5 is NOT read.
     */
    private registerProjectModules(): void {
        const projectDir = this.scene.getRealProjectDir();
        const buildProfilePath = path.join(projectDir, BUILD_PROFILE_JSON5);

        if (!fs.existsSync(buildProfilePath)) {
            logger.warn('There is no build-profile.json5 for this project.');
            return;
        }

        let configurationsText: string;
        try {
            configurationsText = fs.readFileSync(buildProfilePath, 'utf-8');
        } catch (error) {
            logger.error(`Error reading build-profile.json5: ${error}`);
            return;
        }

        const buildProfileJson = parseJsonText(configurationsText);
        const modules = buildProfileJson.modules;
        if (modules instanceof Array) {
            for (const module of modules) {
                const modulePath = path.resolve(projectDir, module.srcPath);
                this.registerModule(modulePath, module.name);
            }
        }
    }

    /**
     * Scan oh_modules directories and register third-party dependencies as
     * ArkModule(moduleType=OH_MODULES).
     *
     * Scans two types of oh_modules directories:
     * 1. The project-level oh_modules/ under the project root.
     * 2. The oh_modules/ under each registered PROJECT module's directory.
     *
     * A Set is used to avoid scanning the same directory twice.
     */
    private registerOhModulesModules(): void {
        const projectDir = this.scene.getRealProjectDir();
        const scannedDirs: Set<string> = new Set();

        // 1. Scan project-level oh_modules/
        const projectOhModulesDir = path.join(projectDir, OH_MODULES);
        if (fs.existsSync(projectOhModulesDir)) {
            scannedDirs.add(projectOhModulesDir);
            this.scanOhModulesDirectory(projectOhModulesDir);
        }

        // 2. Scan each PROJECT module's oh_modules/
        for (const module of this.modulesIterator()) {
            if (module.getModuleType() !== ModuleType.PROJECT) {
                continue;
            }

            const moduleOhModulesDir = path.join(module.getModulePath(), OH_MODULES);
            if (fs.existsSync(moduleOhModulesDir) && !scannedDirs.has(moduleOhModulesDir)) {
                scannedDirs.add(moduleOhModulesDir);
                this.scanOhModulesDirectory(moduleOhModulesDir);
            }
        }
    }

    /**
     * Recursively scan a single oh_modules directory, registering discovered packages as
     * ArkModule(moduleType=OH_MODULES).
     *
     * Directories starting with '@' (scoped packages) are recursed into.
     * Regular directories have their symlinks resolved via fs.realpathSync() and are
     * registered if not already present (deduplication by resolved real path).
     *
     * @param ohModulesDir - Absolute path of the oh_modules directory to scan.
     */
    private scanOhModulesDirectory(ohModulesDir: string): void {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(ohModulesDir, { withFileTypes: true });
        } catch (error) {
            logger.error(`Error reading oh_modules directory: ${ohModulesDir}`, error);
            return;
        }

        for (const entry of entries) {
            const entryPath = path.join(ohModulesDir, entry.name);
            // Accept both real directories and symlinks (which may point to directories).
            // Dirent.isDirectory() returns false for symlinks, so check isSymbolicLink() too.
            if (!entry.isDirectory() && !entry.isSymbolicLink()) {
                continue;
            }

            if (entry.name.startsWith('@')) {
                // Scoped package (e.g. @ohos/library): recurse into the scope directory
                this.scanOhModulesDirectory(entryPath);
            } else {
                // Regular package: resolve symlinks and register
                const realPath = fs.realpathSync(entryPath);
                if (this.getModuleByPath(realPath)) {
                    continue;
                }

                const module = this.registerModule(realPath, entry.name);
                module.setModuleType(ModuleType.OH_MODULES);
            }
        }
    }

    // --- Dependency analysis ---

    /**
     * Main entry point for module dependency analysis.
     *
     * Reads oh-package.json5 to update module names, builds the dependency graph,
     * runs SCC detection with post-processing refinement. The topological order and SCC groups
     * are stored inside the dependency graph on the Scene, accessed via `ModuleBuilder.getTopoOrder()`.
     *
     * Idempotent: if the dependency graph already exists on the Scene, this method returns immediately.
     */
    public analyzeModuleDependencies(): void {
        if (this.scene.getModuleDepGraph()) {
            return;
        }

        this.updateModuleNamesFromOhPkg();
        this.buildDependencyGraph();

        const graph = this.scene.getModuleDepGraph()!;
        graph.refineSCCGroups(graph.getMaxSCCGroupSize());
    }

    /**
     * Build the module dependency graph by reading each module's oh-package.json5.
     *
     * Creates a new {@link ModuleDepGraph} with the shared canonicalizer, adds all
     * registered modules as nodes, then resolves dependencies and adds edges.
     * Resolved dependencies create graph edges and update the module's alias map;
     * unresolved dependencies are recorded as unresolved dependencies. The built graph is
     * stored on the Scene via `Scene.setModuleDepGraph()`.
     */
    private buildDependencyGraph(): void {
        const graph = this.scene.createModuleDepGraph();

        // 1. Add all registered modules as graph nodes
        for (const module of this.modulesIterator()) {
            graph.addModule(module);
        }

        // 2. Read project-level overrides and overrideDependencyMap from the project root oh-package.json5
        const { overrides, overrideDependencyMap } = this.readProjectOverrides();

        // 3. Process inter-module dependencies via oh-package.json5
        for (const module of this.modulesIterator()) {
            const deps = module.readOhPkgContent();
            const depEntries = this.extractDependenciesWithValues(deps);

            for (const [alias, depValue, depType] of depEntries) {
                const depModule = this.resolveDepModule(alias, depValue, module.getModulePath(), overrides, overrideDependencyMap);
                if (depModule) {
                    const srcId = this.scene.getModuleId(module);
                    const dstId = this.scene.getModuleId(depModule);
                    graph.addDependencyEdge(srcId, dstId, depType);
                    module.addDependencyAlias(alias, dstId);
                } else {
                    module.addUnresolvedDependency(alias, depValue);
                }
            }
        }

        this.scene.setModuleDepGraph(graph);
    }

    /**
     * Read the project root oh-package.json5 and extract `overrides` and `overrideDependencyMap`.
     *
     * Both fields are optional dependency override configurations. `overrides` maps a dependency
     * alias to an override path (local path, file: path, or @module: reference).
     * `overrideDependencyMap` maps a dependency alias to an override file path. When a dependency
     * alias is present in either map, the override path is used instead of the original dependency
     * value during resolution (checked before normal resolution).
     *
     * @returns An object with `overrides` and `overrideDependencyMap` string maps (empty when absent).
     */
    private readProjectOverrides(): { overrides: { [k: string]: string }; overrideDependencyMap: { [k: string]: string } } {
        const empty: { [k: string]: string } = {};
        const projectDir = this.scene.getRealProjectDir();
        const ohPkgPath = path.join(projectDir, OH_PACKAGE_JSON5);
        if (!fs.existsSync(ohPkgPath)) {
            return { overrides: empty, overrideDependencyMap: empty };
        }

        let ohPkgContent: { [k: string]: unknown };
        try {
            ohPkgContent = fetchDependenciesFromFile(ohPkgPath);
        } catch (error) {
            logger.error(`Error reading project oh-package.json5: ${error}`);
            return { overrides: empty, overrideDependencyMap: empty };
        }

        const overrides = this.toStringMap(ohPkgContent.overrides);
        const overrideDependencyMap = this.toStringMap(ohPkgContent.overrideDependencyMap);
        return { overrides, overrideDependencyMap };
    }

    /**
     * Coerce a record value to a `{ [k: string]: string }` map, dropping non-string entries.
     */
    private toStringMap(value: unknown): { [k: string]: string } {
        const result: { [k: string]: string } = {};
        if (value instanceof Object) {
            for (const [k, v] of Object.entries(value)) {
                if (typeof v === 'string') {
                    result[k] = v;
                }
            }
        }
        return result;
    }

    /**
     * Extract dependency entries from oh-package.json5 content.
     *
     * Traverses dependencies (→ DEPENDENCIES), devDependencies (→ DEV_DEPENDENCIES),
     * and dynamicDependencies (→ DYNAMIC), returning a [alias, value, DependencyType]
     * triple for each entry. The DependencyType is used during SCC post-processing
     * to determine edge removal priority when splitting oversized groups.
     */
    private extractDependenciesWithValues(ohPkgContent: { [k: string]: unknown }): [string, string, DependencyType][] {
        const result: [string, string, DependencyType][] = [];
        const depKeyToType: [string, DependencyType][] = [
            [OH_PKG_DEPENDENCIES, DependencyType.DEPENDENCIES],
            [OH_PKG_DEV_DEPENDENCIES, DependencyType.DEV_DEPENDENCIES],
            [OH_PKG_DYNAMIC_DEPENDENCIES, DependencyType.DYNAMIC],
        ];
        for (const [key, depType] of depKeyToType) {
            const deps = ohPkgContent[key];
            if (deps instanceof Object) {
                for (const [k, v] of Object.entries(deps)) {
                    if (typeof v === 'string') {
                        result.push([k, v, depType]);
                    }
                }
            }
        }
        return result;
    }

    /**
     * Resolve a dependency declaration to its target {@link ArkModule}.
     *
     * Resolution priority:
     * 0. overrides / overrideDependencyMap — when the alias is present in either project-level
     *    override map, the override path replaces the original dependency value before resolution.
     * 1. {@link MODULE_PREFIX} prefix — find by moduleName among registered modules
     * 2. "./", "../", or "file:" prefix — resolve as local path relative to
     *    scopeModulePath, look up in pathToId
     * 3. Version number — look in oh_modules directories in priority order:
     *    a. current module's oh_modules (scopeModulePath/oh_modules/alias)
     *    b. project-level oh_modules (projectDir/oh_modules/alias)
     *    c. .ohpm cache (projectDir/oh_modules/.ohpm/<name>@<version>/oh_modules/<name>)
     *    Each candidate is verified as a directory, resolved via fs.realpathSync(), then looked
     *    up in pathToId. For .har dependencies inside the .ohpm cache, the current module's
     *    oh_modules base is recomputed from the enclosing oh_modules ancestor.
     *
     * @param alias - The dependency alias (key in oh-package.json5 dependencies).
     * @param depValue - The dependency value (path, version, or @module: reference).
     * @param scopeModulePath - The absolute path of the source module (for relative path resolution).
     * @param overrides - Optional project-level overrides map (alias -> override path).
     * @param overrideDependencyMap - Optional project-level overrideDependencyMap (alias -> override path).
     * @returns The target ArkModule if resolved, undefined otherwise.
     */
    private resolveDepModule(
        alias: string,
        depValue: string,
        scopeModulePath: string,
        overrides?: { [k: string]: string },
        overrideDependencyMap?: { [k: string]: string }
    ): ArkModule | undefined {
        // 0. Override handling: check overrides and overrideDependencyMap before normal resolution
        if (overrides && overrides[alias] !== undefined) {
            depValue = overrides[alias];
        } else if (overrideDependencyMap && overrideDependencyMap[alias] !== undefined) {
            depValue = overrideDependencyMap[alias];
        }

        // 1. Module reference dependency: "@module:Foo"
        if (depValue.startsWith(MODULE_PREFIX)) {
            const refName = depValue.slice(MODULE_PREFIX.length);
            for (const mod of this.modulesIterator()) {
                if (mod.getModuleName() === refName) {
                    return mod;
                }
            }
            return undefined;
        }

        // 2. Local path dependency: "./...", "../...", "file:..."
        if (depValue.startsWith('./') || depValue.startsWith('../') || depValue.startsWith('file:')) {
            const pathPart = depValue.startsWith('file:') ? depValue.slice('file:'.length) : depValue;
            const resolvedPath = path.resolve(scopeModulePath, pathPart);
            const id = this.pathToId.get(resolvedPath);
            if (id !== undefined) {
                return this.scene.getModule(id);
            }
            return undefined;
        }

        // 3. oh_modules dependency: version number like "^1.0.0"
        const projectDir = this.scene.getRealProjectDir();
        // For .har dependencies inside the .ohpm cache, recompute the oh_modules base from the
        // enclosing oh_modules ancestor (mirrors processDependency in ModuleUtils).
        const moduleBase =
            depValue.endsWith('.har') && scopeModulePath.includes(OHPM)
                ? scopeModulePath.substring(0, scopeModulePath.lastIndexOf(OH_MODULES))
                : scopeModulePath;
        const candidates = [
            path.resolve(moduleBase, OH_MODULES, alias),
            path.resolve(projectDir, OH_MODULES, alias),
            this.findModulePathInOHPM(projectDir, alias, depValue),
        ];
        for (const candidate of candidates) {
            if (!candidate || !FileUtils.isDirectory(candidate)) {
                continue;
            }
            const realPath = fs.realpathSync(candidate);
            const id = this.pathToId.get(realPath);
            if (id !== undefined) {
                return this.scene.getModule(id);
            }
        }

        return undefined;
    }

    /**
     * Find a module path in the .ohpm cache directory.
     *
     * Mirrors {@link ModuleUtils.findModulePathInOHPM}: the cache lives at
     * `<projectDir>/oh_modules/.ohpm` and stores packages as
     * `<moduleName.replace('/', '+')>@<version>/oh_modules/<moduleName>`. Exact versions are
     * matched directly; `^`-prefixed ranges pick the first directory whose version is not less
     * than the requested minimum.
     *
     * @param projectDir - The project root directory.
     * @param moduleName - The dependency alias / module name.
     * @param version - The dependency version value (exact or `^`-prefixed).
     * @returns The candidate directory path, or '' when not found.
     */
    private findModulePathInOHPM(projectDir: string, moduleName: string, version: string): string {
        const ohpmPath = path.resolve(projectDir, OH_MODULES, OHPM);
        const prefix = `${moduleName.replace('/', '+')}@`;
        // exact version match
        if (/^\d+(?:\.\d+){2}(?:-[0-9A-Za-z-]+)?$/.test(version)) {
            return path.resolve(ohpmPath, prefix + version, OH_MODULES, moduleName);
        }
        // try to find the best version
        try {
            const dirs = fs.readdirSync(ohpmPath, { withFileTypes: true }).filter(dir => dir.isDirectory() && dir.name.startsWith(prefix));
            for (const dir of dirs) {
                const dirName = dir.name;
                if (version.startsWith('^') && dirName.split('@')[1] < version.substring(1)) {
                    continue;
                }
                return path.resolve(ohpmPath, dirName, OH_MODULES, moduleName);
            }
        } catch (e) {
            logger.warn(`Cannot find module: ${moduleName} in ${ohpmPath}`);
        }
        return '';
    }

    /**
     * Read oh-package.json5 for each registered module and update moduleName.
     *
     * The "name" field in oh-package.json5 (e.g. "@ohos/entry") is the canonical
     * module name used for "@module:" reference resolution. This method populates
     * {@link ArkModule.moduleName} from oh-package.json5, overriding the short name
     * from build-profile.json5 set during registration.
     */
    private updateModuleNamesFromOhPkg(): void {
        for (const module of this.modulesIterator()) {
            const ohPkgContent = module.readOhPkgContent();
            const name = ohPkgContent.name;
            if (typeof name !== 'string') {
                continue;
            }
            module.setModuleName(name);
            this.registerModulePath(module, name, ohPkgContent);
        }
    }

    private registerModulePath(module: ArkModule, name: string, ohPkgContent: Record<string, unknown>): void {
        if (ModuleUtils.MODULES.has(name)) {
            return;
        }
        const modulePath = module.getModulePath();
        let entry = (ohPkgContent.types as string) || (ohPkgContent.main as string) || '';
        if (entry.endsWith('.js')) {
            entry = entry.substring(0, entry.length - '.js'.length);
        }
        const mainPath = entry ? path.resolve(modulePath, entry) : modulePath;
        ModuleUtils.MODULES.set(name, new ModulePath(modulePath, mainPath));
    }

    // --- Module loading ---

    /**
     * Map a {@link ModuleDepthLevel} to the corresponding {@link ModuleLoadState}.
     * Used by {@link loadModule} to translate the configured depth level into a load state.
     */
    private depthLevelToLoadState(level: ModuleDepthLevel): ModuleLoadState {
        switch (level) {
            case ModuleDepthLevel.META:
                return ModuleLoadState.META;
            case ModuleDepthLevel.IMPORTS:
                return ModuleLoadState.IMPORTS;
            case ModuleDepthLevel.SIGNATURES:
                return ModuleLoadState.SIGNATURES;
            case ModuleDepthLevel.BODIES:
                return ModuleLoadState.BODIES;
            default:
                return ModuleLoadState.META;
        }
    }

    /**
     * Reverse mapping of {@link depthLevelToLoadState}. Used to look up the heapUsed table
     * entry for a module's current load state.
     */
    private loadStateToDepthLevel(loadState: ModuleLoadState): ModuleDepthLevel {
        switch (loadState) {
            case ModuleLoadState.META:
                return ModuleDepthLevel.META;
            case ModuleLoadState.IMPORTS:
                return ModuleDepthLevel.IMPORTS;
            case ModuleLoadState.SIGNATURES:
                return ModuleDepthLevel.SIGNATURES;
            case ModuleLoadState.BODIES:
                return ModuleDepthLevel.BODIES;
            default:
                return ModuleDepthLevel.META;
        }
    }


    /**
     * Run type inference on the module's files, following the same pattern as
     * {@link Scene.inferTypes} but scoped to a single module.
     *
     * Reuses the file topological order already computed by {@link analyzeFileDependencies}
     * (stored in the module's {@link FileDepGraph}) so that depended-on files are inferred first.
     * Falls back to unsorted iteration when no file dependency graph is available (e.g. when this
     * method is called directly without a prior {@link loadModule}).
     *
     * At SIGNATURES level (no method bodies), only the `preInfer` phase is effective (generic
     * types, parameter types, signature return types, import/export resolution). At BODIES level,
     * full type inference runs (including stmt-level propagation and return type aggregation).
     *
     * Does NOT call {@link Scene.getMethodsMap}(true): rebuilding the global index would clear
     * caches for other modules. Does NOT set {@link Scene.buildStage} to TYPE_INFERRED: that is a
     * whole-scene flag. Does NOT call {@link SdkUtils.dispose} / {@link ModuleUtils.dispose} /
     * {@link ValueUtil.dispose}: the global caches are shared across modules and should be
     * released by the caller after all modules are processed.
     *
     * @param module - The module whose files are to be type-inferred.
     * @param times - Number of inference iterations (clamped to 1–5). Default 1.
     */
    public inferModuleTypes(module: ArkModule, times: number = 1): void {
        if (times < 1) {
            return;
        }
        if (times > 5) {
            times = 5;
        }

        // Reuse the file topological order computed by analyzeFileDependencies
        const fileDepGraph = module.getFileDepGraph();
        let sortedFiles: ArkFile[];
        if (fileDepGraph && fileDepGraph.getTopoOrder().length > 0) {
            sortedFiles = fileDepGraph
                .getTopoOrder()
                .map(id => fileDepGraph.tryGetNode(id))
                .filter((f): f is ArkFile => f !== undefined);
        } else {
            // Fallback: no file dep graph available (e.g. direct call without loadModule)
            sortedFiles = Array.from(module.getFilesMap().values());
        }

        while (times > 0) {
            for (const file of sortedFiles) {
                InferenceManager.getInstance().getInference(file.getLanguage()).doInfer(file);
            }
            times--;
        }
    }

    /**
     * Load module data at the specified depth level.
     *
     * Dependencies are NOT recursively loaded here — the caller (e.g.
     * {@link Scene.analyseByModule}) must iterate modules in topological order so that
     * depended-on modules are loaded before their dependents.
     *
     * When cache management has been initialized via {@link initCacheManagement}, this method
     * automatically checks memory before loading (evicting cached modules if over threshold)
     * and registers the module in the cache after loading.
     *
     * Flow:
     * 1. SDK modules are skipped — their file content is built by {@link buildSdkModules}, not here.
     * 2. Idempotent: skip if the module's loadState already reaches the target load state.
     * 3. Build module data to the effective level via {@link buildModuleToLevel}, which integrates
     *    intra-module file dependency analysis and topological-order parsing.
     * 4. When the effective level reaches BODIES, build method bodies (ArkBody/CFG/Stmt/Expr) via
     *    {@link FrontendBuilder.buildModuleMethodBody}, following the same two-phase pattern as
     *    {@link Scene.genArkFiles}.
     * 5. When the effective level reaches SIGNATURES, run type inference on the module's files
     *    via {@link inferModuleTypes}, referencing the logic of {@link Scene.inferTypes}.
     * 6. Set the load state to the target level (after successful build).
     *
     * @param moduleId - ID of the module to load.
     * @param depthLevel - The depth level to load the module to.
     */
    public loadModule(moduleId: ModuleID, depthLevel: ModuleDepthLevel = ModuleDepthLevel.META): void {
        const module = this.getModule(moduleId);
        if (!module) {
            return;
        }

        // Cache management: evict cached modules if memory is over target
        this.evictIfNeeded(moduleId, depthLevel);

        // SDK modules: file content is built by buildSdkModules, not loadModule
        if (module.getModuleType() === ModuleType.SDK) {
            return;
        }

        const targetLoadState = this.depthLevelToLoadState(depthLevel);

        // Idempotent: skip if already loaded to the target level, but ensure in cache
        if (module.getLoadState() >= targetLoadState) {
            this.cache?.register(moduleId);
            return;
        }

        // Record heapUsed before actual build (for heapUsed table population)
        const recordHeapUsed = this.monitor?.isEnabled() ?? false;
        const heapUsedBefore = recordHeapUsed ? this.monitor!.getCurrentHeapUsed() : 0;

        // Phase 1: build ArkFile objects to the effective level, with intra-module file
        // dependency analysis integrated (topological-order parsing for level > IMPORTS).
        this.buildModuleToLevel(module, depthLevel);

        // Phase 2: build method bodies when BODIES level was requested
        if (depthLevel >= ModuleDepthLevel.BODIES) {
            FrontendBuilder.buildModuleMethodBody(module);
        }

        // Phase 3: type inference when level >= SIGNATURES
        if (depthLevel >= ModuleDepthLevel.SIGNATURES) {
            this.inferModuleTypes(module);
        }

        // Set load state after successful build
        module.setLoadState(targetLoadState);

        // Record heapUsed increment in cache table (first load only — recordHeapUsed is a no-op if entry exists)
        if (recordHeapUsed) {
            const heapUsedAfter = this.monitor!.getCurrentHeapUsed();
            const heapUsedIncrement = Math.max(0, heapUsedAfter - heapUsedBefore);
            this.cache?.recordHeapUsed(moduleId, depthLevel, heapUsedIncrement);
        }

        // Register in cache after successful load
        this.cache?.register(moduleId);
    }

    /**
     * Unload a module's data, releasing heavy data and resetting to NOT_LOADED state.
     *
     * Clears the module's filesMap (releasing ArkFile/ArkClass/ArkMethod objects), resets the
     * file dependency graph (so that the next {@link loadModule} rebuilds IMPORTS from scratch),
     * and sets the load state to NOT_LOADED. After unloading, {@link loadModule} can rebuild
     * the module from scratch.
     *
     * SDK modules are not unloaded (their data is built by {@link buildSdkModules} and shared
     * globally).
     *
     * @param moduleId - ID of the module to unload.
     */
    public unload(moduleId: ModuleID): void {
        const module = this.getModule(moduleId);
        if (!module) {
            return;
        }
        if (module.getModuleType() === ModuleType.SDK) {
            return;
        }
        this.scene.disposeModule(module);
        this.breakInternalReferences(module);
        module.clearFilesMap();
        module.setFileDepGraph(undefined);
        module.setLoadState(ModuleLoadState.NOT_LOADED);
    }

    /**
     * Break all internal references between IR objects in a module's ArkFiles.
     * Called after {@link Scene.disposeModule} to ensure that IR objects (ArkClass, ArkMethod,
     * ArkBody, ArkField, ExportInfo, ImportInfo) do not retain each other through cross-references,
     * allowing V8 GC to reclaim them individually.
     */
    private breakInternalReferences(module: ArkModule): void {
        for (const arkFile of module.getFilesMap().values()) {
            arkFile.clearAllReferences();
        }
    }

    // --- Cache management ---

    /**
     * Initialize or update cache management for module loading.
     *
     * On the first call, creates a {@link ModuleCache} and {@link MemoryMonitor} and stores
     * them persistently in {@link Scene}. On subsequent calls, reuses the persistent instances
     * and only updates the per-call topological order.
     *
     * @param options - Scene options containing memoryLimitMB.
     * @param topoOrder - Topological order of modules to be loaded (dependees before dependents).
     * @param dependencyLoadLevel - Load level to downgrade protected dependencies to during eviction.
     */
    public initCacheManagement(options: SceneOptions, topoOrder: ModuleID[], dependencyLoadLevel: ModuleDepthLevel = ModuleDepthLevel.SIGNATURES): void {
        if (!this.scene.getModuleCache()) {
            this.scene.setModuleCache(new ModuleCache());
            this.scene.setMemoryMonitor(new MemoryMonitor(options));
        }
        this.monitor = this.scene.getMemoryMonitor();
        this.cache = this.scene.getModuleCache();
        this.topoOrder = topoOrder;
        this.dependencyLoadLevel = dependencyLoadLevel;
        this.topoOrderIndex = new Map();
        for (let i = 0; i < topoOrder.length; i++) {
            this.topoOrderIndex.set(topoOrder[i], i);
        }
    }

    /**
     * Check memory and evict cached modules if needed, before loading a new module.
     *
     * Estimates the heapUsed increment of the upcoming load (from the heapUsed table if available,
     * otherwise from HEAPUSED_PER_FILE), computes a heapUsed upper limit (heapUsedLimit - estimated
     * increment), takes one actual heapUsed measurement, and only proceeds with eviction if
     * heapUsed exceeds the upper limit.
     *
     * During eviction, the heapUsed estimate is tracked via {@link HeapUsedEstimateState},
     * decremented by the heapUsed table value of each unloaded/downgraded module.
     */
    private evictIfNeeded(moduleId: ModuleID, depthLevel: ModuleDepthLevel = ModuleDepthLevel.META): void {
        if (!this.monitor || !this.cache || !this.topoOrderIndex) {
            return;
        }
        if (!this.monitor.isEnabled()) {
            return;
        }
        const idx = this.topoOrderIndex.get(moduleId);
        if (idx === undefined) {
            return;
        }
        const module = this.getModule(moduleId);
        if (!module || module.getModuleType() === ModuleType.SDK) {
            return;
        }

        const estInc = this.estimateLoadHeapUsed(moduleId, module, depthLevel);
        const heapUsedUpperLimit = Math.max(0, this.monitor.getHeapUsedLimitBytes() - estInc);
        const heapUsedStart = this.monitor.getCurrentHeapUsed();
        if (heapUsedStart <= heapUsedUpperLimit) {
            return;
        }

        const heapUsedState: HeapUsedEstimateState = { estimate: heapUsedStart, limit: heapUsedUpperLimit };
        const depGraph = this.scene.getModuleDepGraph();
        const { hardProtected, softProtected } = this.computeProtectedSets(moduleId, idx, depGraph);
        const protectedDeps = new Set<ModuleID>([...hardProtected, ...softProtected]);
        protectedDeps.delete(moduleId);
        const reverseTopo = [...this.topoOrder].reverse();

        this.runPhase1Eviction(hardProtected, softProtected, depGraph, heapUsedState);
        this.runPhase2Downgrade(protectedDeps, reverseTopo, heapUsedState);
        this.runPhase3Eviction(protectedDeps, reverseTopo, heapUsedState);
    }

    private runPhase1Eviction(
        hardProtected: Set<ModuleID>,
        softProtected: Set<ModuleID>,
        depGraph: { getSuccModuleIds: (id: ModuleID) => ModuleID[]; getSCCGroups?: () => Map<ModuleID, ModuleID[]> | undefined } | undefined,
        heapUsedState: HeapUsedEstimateState
    ): void {
        this.cache?.evict(
            hardProtected, softProtected, this.monitor!,
            id => this.unload(id),
            depGraph?.getSCCGroups?.(),
            heapUsedState,
            id => this.estimateUnloadHeapUsedDecrease(id)
        );
    }

    private runPhase2Downgrade(protectedDeps: Set<ModuleID>, reverseTopo: ModuleID[], heapUsedState: HeapUsedEstimateState): void {
        if (heapUsedState.estimate <= heapUsedState.limit) {
            return;
        }
        const downgradeTarget = Math.max(this.dependencyLoadLevel, ModuleDepthLevel.SIGNATURES) as ModuleDepthLevel;
        const targetLoadState = this.depthLevelToLoadState(downgradeTarget);
        for (const id of reverseTopo) {
            if (heapUsedState.estimate <= heapUsedState.limit) {
                break;
            }
            if (!protectedDeps.has(id) || !this.cache?.has(id)) {
                continue;
            }
            const mod = this.getModule(id);
            if (!mod || mod.getLoadState() <= targetLoadState) {
                continue;
            }
            const decrease = this.estimateDowngradeHeapUsedDecrease(id, downgradeTarget);
            this.downgradeModule(id, downgradeTarget);
            heapUsedState.estimate -= decrease;
        }
    }

    private runPhase3Eviction(protectedDeps: Set<ModuleID>, reverseTopo: ModuleID[], heapUsedState: HeapUsedEstimateState): void {
        if (heapUsedState.estimate <= heapUsedState.limit) {
            return;
        }
        for (const id of reverseTopo) {
            if (heapUsedState.estimate <= heapUsedState.limit) {
                break;
            }
            if (protectedDeps.has(id) && this.cache?.has(id)) {
                const decrease = this.estimateUnloadHeapUsedDecrease(id);
                this.unload(id);
                this.cache.unregister(id);
                heapUsedState.estimate -= decrease;
            }
        }
    }

    /**
     * Estimate the memory cost of loading a module at the given depth level.
     * Used as a fallback when the heapUsed table has no entry for this module+level.
     */
    private estimateLoadCost(module: ArkModule, depthLevel: ModuleDepthLevel): number {
        const fileCount = this.getFileCount(module);
        const bytesPerFile = ModuleBuilder.HEAPUSED_PER_FILE.get(depthLevel) ?? 0;
        return fileCount * bytesPerFile;
    }

    /**
     * Estimate the heapUsed increment for loading a module at the given depth level.
     * Uses the heapUsed table value if available (from a prior first-load measurement),
     * otherwise falls back to {@link estimateLoadCost} (fileCount × HEAPUSED_PER_FILE).
     */
    private estimateLoadHeapUsed(moduleId: ModuleID, module: ArkModule, depthLevel: ModuleDepthLevel): number {
        const tableHeapUsed = this.cache?.getHeapUsed(moduleId, depthLevel);
        if (tableHeapUsed !== undefined) {
            return tableHeapUsed;
        }
        return this.estimateLoadCost(module, depthLevel);
    }

    /**
     * Estimate the heapUsed decrease from unloading a module (full unload).
     * Uses the heapUsed table value for the module's current load level,
     * or falls back to HEAPUSED_PER_FILE estimate.
     */
    private estimateUnloadHeapUsedDecrease(moduleId: ModuleID): number {
        const module = this.getModule(moduleId);
        if (!module) {
            return 0;
        }
        const currentLevel = this.loadStateToDepthLevel(module.getLoadState());
        const tableHeapUsed = this.cache?.getHeapUsed(moduleId, currentLevel);
        if (tableHeapUsed !== undefined) {
            return tableHeapUsed;
        }
        return this.estimateLoadCost(module, currentLevel);
    }

    /**
     * Estimate the heapUsed decrease from downgrading a module from its current level
     * to a target level. Uses a ratio-based approach: downgrade releases a fixed
     * proportion of the current-level heapUsed, avoiding the need for target-level
     * table entries (which are never populated since downgradeModule doesn't write
     * to the heapUsed table).
     */
    private estimateDowngradeHeapUsedDecrease(moduleId: ModuleID, _targetLevel: ModuleDepthLevel): number {
        const module = this.getModule(moduleId);
        if (!module) {
            return 0;
        }
        const currentLevel = this.loadStateToDepthLevel(module.getLoadState());
        const currentHeapUsed = this.cache?.getHeapUsed(moduleId, currentLevel) ??
            this.estimateLoadCost(module, currentLevel);
        return Math.max(0, Math.floor(currentHeapUsed * ModuleBuilder.DOWNGRADE_RELEASE_RATIO));
    }


    /**
     * Downgrade a module's loaded data to the given target level (min SIGNATURES), releasing the
     * heavy method-body/view-tree/AST data while keeping signatures (ArkClass/method signatures,
     * filesMap, Scene index maps) so dependents can still resolve types. No-op if already at or
     * below the target level. Used by eviction Phase 2.
     */
    private downgradeModule(moduleId: ModuleID, targetLevel: ModuleDepthLevel): void {
        const module = this.getModule(moduleId);
        if (!module || module.getModuleType() === ModuleType.SDK) {
            return;
        }
        const targetLoadState = this.depthLevelToLoadState(targetLevel);
        if (module.getLoadState() <= targetLoadState) {
            return;
        }
        for (const arkFile of module.getFilesMap().values()) {
            for (const cls of ModelUtils.getAllClassesInFile(arkFile)) {
                for (const mtd of cls.getMethods(true)) {
                    mtd.clearBodyAndSupplementary();
                }
                (cls as unknown as { viewTree: unknown }).viewTree = undefined;
                for (const field of cls.getFields()) {
                    field.setInitializer([]);
                }
            }
            arkFile.setAST(null);
            arkFile.clearSourceCode();
        }
        module.setLoadState(targetLoadState);
    }

    /**
     * Get the number of source files in a module. If the module's filesMap is empty
     * (not yet loaded), scans the module directory.
     */
    private getFileCount(module: ArkModule): number {
        if (module.getFilesMap().size > 0) {
            return module.getFilesMap().size;
        }
        const options = this.scene.getOptions();
        const supportFileExts = options?.supportFileExts ?? ['.ets', '.ts'];
        const ignoreFileNames = [...(options?.ignoreFileNames ?? []), OH_MODULES];
        return getAllFiles(module.getModulePath(), supportFileExts, ignoreFileNames).length;
    }

    /**
     * Compute the hard and soft protected sets for eviction.
     * - Hard: the current module and its direct dependencies (never evicted).
     * - Soft: direct dependencies of not-yet-loaded modules, plus already-cached modules
     *   at later topo positions (to avoid reload overhead).
     */
    private computeProtectedSets(
        moduleId: ModuleID,
        idx: number,
        depGraph?: { getSuccModuleIds: (id: ModuleID) => ModuleID[] }
    ): { hardProtected: Set<ModuleID>; softProtected: Set<ModuleID> } {
        const hardProtected = new Set<ModuleID>([moduleId]);
        const softProtected = new Set<ModuleID>();
        if (!depGraph || !this.cache) {
            return { hardProtected, softProtected };
        }
        // Hard-protect current module's direct dependencies
        for (const depId of depGraph.getSuccModuleIds(moduleId)) {
            if (this.cache.has(depId)) {
                hardProtected.add(depId);
            }
        }
        // Soft-protect direct dependencies of not-yet-loaded modules
        // and already-cached modules at later positions (avoid reload)
        for (let j = idx + 1; j < this.topoOrder.length; j++) {
            for (const depId of depGraph.getSuccModuleIds(this.topoOrder[j])) {
                if (this.cache.has(depId)) {
                    softProtected.add(depId);
                }
            }
            if (this.cache.has(this.topoOrder[j])) {
                softProtected.add(this.topoOrder[j]);
            }
        }
        return { hardProtected, softProtected };
    }

    /**
     * Build module data to the specified depth level, integrating intra-module file dependency
     * analysis into the build flow.
     *
     * Two-phase build for level > IMPORTS:
     * 1. Ensure ArkFile shells exist (create if filesMap is empty, reuse otherwise).
     * 2. Build all files to IMPORTS level (lightweight import/export parsing, no dependency on
     *    other files in the module).
     * 3. Analyze intra-module file dependencies → compute topological order (moved here from
     *    {@link loadModule} so it is part of the build-to-level flow).
     * 4. For level > IMPORTS: upgrade each file to the target level (SIGNATURES/BODIES) in
     *    topological order, so that depended-on files are parsed first.
     *
     * For level == META: only shells are created (no content).
     * For level == IMPORTS: steps 1-3 (topoOrder available for later type inference).
     * For level >= SIGNATURES: steps 1-4 (signatures built in topoOrder).
     *
     * The {@link ArkModule.hasFileTopoOrder} flag is used to detect whether IMPORTS was already
     * built (e.g. when upgrading from IMPORTS to SIGNATURES), avoiding redundant re-parsing.
     *
     * @param module - The module to build.
     * @param level - The target depth level.
     */
    public buildModuleToLevel(module: ArkModule, level: ModuleDepthLevel): void {
        // 1. Ensure ArkFile shells exist (reuse if already created, e.g. from a prior META load)
        let arkFiles: ArkFile[];
        if (module.getFilesMap().size === 0) {
            arkFiles = FrontendBuilder.createModuleFileShells(this.scene, module);
        } else {
            arkFiles = Array.from(module.getFilesMap().values());
        }

        // META: no content to build
        if (level <= ModuleDepthLevel.META) {
            return;
        }

        // 2. Build IMPORTS level (if not already done) + analyze file dependencies
        //    Use fileDepGraph existence as indicator that IMPORTS was already built.
        if (level >= ModuleDepthLevel.IMPORTS && !module.hasFileTopoOrder()) {
            for (const arkFile of arkFiles) {
                try {
                    FrontendBuilder.buildImports(arkFile, arkFile.getLanguage());
                } catch (error) {
                    logger.error(`Error building imports for ${arkFile.getFilePath()}: ${error}`);
                }
            }
            this.analyzeFileDependencies(module);
        }

        // 3. For level > IMPORTS: upgrade to target level in topological order
        if (level > ModuleDepthLevel.IMPORTS) {
            const fileDepGraph = module.getFileDepGraph();
            let sortedFiles: ArkFile[];
            if (fileDepGraph && fileDepGraph.getTopoOrder().length > 0) {
                sortedFiles = fileDepGraph
                    .getTopoOrder()
                    .map(id => fileDepGraph.tryGetNode(id))
                    .filter((f): f is ArkFile => f !== undefined);
            } else {
                // Fallback: no file dep graph available (e.g. empty module or analyzeFileDependencies produced no edges)
                sortedFiles = arkFiles;
            }
            for (const arkFile of sortedFiles) {
                try {
                    FrontendBuilder.upgradeArkFileToLevel(this.scene, arkFile, arkFile.getLanguage(), level);
                } catch (error) {
                    logger.error(`Error upgrading ArkFile ${arkFile.getFilePath()}: ${error}`);
                }
            }
        }
    }

    // --- Intra-module file dependency analysis ---

    /**
     * Analyze file-to-file dependencies within a module using the import/export `from` specifiers
     * populated at IMPORTS level.
     *
     * Builds a {@link FileDepGraph}, resolves relative `from` specifiers to file paths within the
     * same module, adds dependency edges, computes a topological order via SCC detection, and
     * stores the graph on the {@link ArkModule}. The topological order is retained inside the
     * FileDepGraph and queried via {@link ArkModule.hasFileTopoOrder}.
     *
     * - Only relative `from` specifiers (`./`, `../`) are resolved; bare specifiers are ignored.
     * - Resolution matches the specifier against already-existing ArkFile paths in the module's filesMap.
     * - Only files within the module (present in the module's filesMap) get edges; external files are ignored.
     *
     * @param module - The module whose files are analyzed.
     */
    public analyzeFileDependencies(module: ArkModule): void {
        const filesMap = module.getFilesMap();
        if (filesMap.size === 0) {
            return;
        }

        // Build a path-to-ArkFile lookup for this module
        const pathToFile: Map<string, ArkFile> = new Map();
        for (const arkFile of filesMap.values()) {
            pathToFile.set(arkFile.getFilePath(), arkFile);
        }

        // Create a canonicalizer for ArkFile <-> NodeID mapping
        const fileCanonicalizer = new Canonicalizer<ArkFile>();
        const fileDepGraph = new FileDepGraph(fileCanonicalizer);

        // Add all files as graph nodes
        for (const arkFile of filesMap.values()) {
            fileDepGraph.addFile(arkFile);
        }

        // Process import/export from specifiers to add dependency edges
        for (const arkFile of filesMap.values()) {
            const srcId = fileCanonicalizer.getId(arkFile);
            const fromSpecifiers = this.collectFromSpecifiers(arkFile);

            for (const from of fromSpecifiers) {
                // Only resolve relative specifiers
                if (!from.startsWith('./') && !from.startsWith('../')) {
                    continue;
                }

                const resolvedPath = this.resolveFromSpecifier(from, arkFile, pathToFile);
                if (!resolvedPath) {
                    continue;
                }

                const dstFile = pathToFile.get(resolvedPath);
                if (!dstFile) {
                    continue;
                }

                const dstId = fileCanonicalizer.getId(dstFile);
                fileDepGraph.addDependencyEdge(srcId, dstId);
            }
        }

        // Compute topological order (stored inside the FileDepGraph)
        fileDepGraph.computeTopoOrder();

        module.setFileDepGraph(fileDepGraph);
    }

    /**
     * Collect all `from` specifiers from an ArkFile's import and export infos.
     * Duplicate specifiers are deduplicated.
     */
    private collectFromSpecifiers(arkFile: ArkFile): Set<string> {
        const fromSet: Set<string> = new Set();
        for (const importInfo of arkFile.getImportInfos()) {
            const from = importInfo.getFrom();
            if (from) {
                fromSet.add(from);
            }
        }
        for (const exportInfo of arkFile.getExportInfos()) {
            const from = exportInfo.getFrom();
            if (from) {
                fromSet.add(from);
            }
        }
        return fromSet;
    }

    /**
     * Resolve a relative `from` specifier (e.g. `./b`, `../utils/helper`) to an absolute file path
     * that exists as an already-built ArkFile in the module.
     *
     * Resolution matches against the keys of {@link pathToFile} (the module's already-generated
     * ArkFile paths) instead of probing the filesystem:
     *
     * 1. The specifier as-is (may already include an extension).
     * 2. The specifier with each unique extension found among existing ArkFile paths appended.
     * 3. The specifier as a directory: look for an index file whose path is in {@link pathToFile}.
     *
     * @param from - The relative from specifier (starts with `./` or `../`).
     * @param arkFile - The file containing the import/export (base for relative resolution).
     * @param pathToFile - Map of already-built ArkFile paths in the module.
     * @returns The resolved absolute file path, or undefined if not found.
     */
    private resolveFromSpecifier(from: string, arkFile: ArkFile, pathToFile: Map<string, ArkFile>): string | undefined {
        const baseDir = path.dirname(arkFile.getFilePath());
        const resolvedPath = path.resolve(baseDir, from);

        // 1. Try as-is (specifier may already include an extension)
        if (pathToFile.has(resolvedPath)) {
            return resolvedPath;
        }

        // 2. Try appending extensions collected from existing files in the module
        const exts = new Set<string>();
        for (const filePath of pathToFile.keys()) {
            const ext = path.extname(filePath);
            if (ext) {
                exts.add(ext);
            }
        }
        for (const ext of exts) {
            const candidate = resolvedPath + ext;
            if (pathToFile.has(candidate)) {
                return candidate;
            }
        }

        // 3. Try as a directory with an index file
        try {
            const indexFileName = FileUtils.getIndexFileName(resolvedPath);
            if (indexFileName) {
                const indexPath = path.join(resolvedPath, indexFileName);
                if (pathToFile.has(indexPath)) {
                    return indexPath;
                }
            }
        } catch {
            // resolvedPath is not a readable directory; skip index file resolution
        }

        return undefined;
    }
}
