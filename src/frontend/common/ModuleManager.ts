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

import { Canonicalizer } from '../../utils/Canonicalizer';
import { ArkModule, ModuleID, ModuleLoadState, ModuleType } from '../../core/model/ArkModule';
import { ModuleDepGraph, DependencyType } from '../../core/graph/ModuleDepGraph';
import { BUILD_PROFILE_JSON5, OH_MODULES, MODULE_PREFIX, OH_PACKAGE_JSON5, OHPM } from '../../core/common/EtsConst';
import { OH_PKG_DEPENDENCIES, OH_PKG_DEV_DEPENDENCIES, OH_PKG_DYNAMIC_DEPENDENCIES } from '../../core/common/Const';
import { fetchDependenciesFromFile, parseJsonText } from '../../utils/json5parser';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ModuleDepthLevel } from './ModuleDepth';
import { ModuleAnalysisConfig } from './ModuleAnalysisConfig';
import { ArkFile } from '../../core/model/ArkFile';
import { FileSignature } from '../../core/model/ArkSignature';
import { FileUtils } from '../../utils/FileUtils';
import { getAllFiles } from '../../utils/getAllFiles';
import type { Scene } from '../../Scene';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ModuleManager');

/**
 * ModuleManager is the core management class embedded in {@link Scene}, responsible for the full
 * lifecycle of modules: registration, SDK build, module preparation, dependency graph construction
 * and SCC analysis, module load/unload, and cache management.
 *
 * Each module is identified by its absolute path and assigned a dense integer {@link ModuleID} via
 * a {@link Canonicalizer} using the objectIdentity strategy. The `pathToId` map is a persistent
 * cache that survives graph construction, allowing runtime path-based lookups.
 *
 * @category core/model
 */
export class ModuleManager {
    private scene: Scene;

    /** Maps ArkModule objects to dense integer ModuleIDs via the objectIdentity strategy. */
    private moduleCanonicalizer: Canonicalizer<ArkModule> = new Canonicalizer<ArkModule>();

    /** Persistent map from absolute module path to ModuleID (survives graph construction). */
    private pathToId: Map<string, ModuleID> = new Map();

    /** Module dependency graph, used for SCCDetection. Built during dependency analysis. */
    private depGraph?: ModuleDepGraph;

    /** SCC groups: ModuleID -> all ModuleIDs in the same SCC. */
    private sccGroups: Map<ModuleID, ModuleID[]> = new Map();

    /**
     * SCC post-processing threshold: the maximum allowed number of modules in a group; SCCs
     * exceeding this size are split. Default 3; set to Number.MAX_SAFE_INTEGER to disable.
     */
    private maxSCCGroupSize: number = 3;

    /** Whether SDK modules have been registered (set true after prepareSdkModules, idempotent). */
    private sdkRegistered: boolean = false;

    /** Whether module preparation has completed (set true after prepareModules, idempotent). */
    private modulesPrepared: boolean = false;

    /** Whether module dependency analysis has completed (set true after analyzeModuleDependencies). */
    private dependenciesAnalyzed: boolean = false;

    /** Per-module retain level (configured load level) recorded during loadModule. */
    private retainLevels: Map<ModuleID, ModuleDepthLevel> = new Map();

    /** Modules currently being loaded, used to break recursion in cyclic dependencies. */
    private loadingModules: Set<ModuleID> = new Set();

    constructor(scene: Scene) {
        this.scene = scene;
    }

    // --- Module registration ---

    /**
     * Register a module by its absolute path. If the same path has already been registered, the
     * existing {@link ArkModule} is returned unchanged. A new ModuleID is allocated via the
     * Canonicalizer for first-time registrations.
     *
     * @param modulePath - Absolute path of the module (primary identifier).
     * @param moduleName - Optional module name (auxiliary field, e.g. "@ohos/entry").
     * @returns The registered ArkModule (newly created or previously registered).
     */
    public registerModule(modulePath: string, moduleName: string = ''): ArkModule {
        const existingId = this.pathToId.get(modulePath);
        if (existingId !== undefined) {
            return this.moduleCanonicalizer.get(existingId)!;
        }

        const module = new ArkModule(this);
        module.setModulePath(modulePath);
        module.setModuleName(moduleName);

        const id = this.moduleCanonicalizer.getId(module);
        this.pathToId.set(modulePath, id);

        return module;
    }

    /**
     * Get a registered module by its ModuleID.
     * @returns The ArkModule, or undefined when the id is out of bounds.
     */
    public getModule(id: ModuleID): ArkModule | undefined {
        return this.moduleCanonicalizer.get(id);
    }

    /**
     * Look up a module by its absolute path using the persistent pathToId cache.
     * @returns The ArkModule, or undefined when the path has not been registered.
     */
    public getModuleByPath(modulePath: string): ArkModule | undefined {
        const id = this.pathToId.get(modulePath);
        if (id === undefined) {
            return undefined;
        }
        return this.moduleCanonicalizer.get(id);
    }

    /** Total number of registered modules. */
    public getModuleCount(): number {
        return this.moduleCanonicalizer.size();
    }

    /**
     * Iterate over all registered modules, skipping modules whose loadState is DISPOSED.
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

    /**
     * Find the next non-DISPOSED module starting from the cursor.
     * Advances the cursor past any skipped (DISPOSED) modules.
     */
    private nextModule(cursor: { value: number }): IteratorResult<ArkModule> {
        while (cursor.value < this.moduleCanonicalizer.size()) {
            const m = this.moduleCanonicalizer.get(cursor.value);
            cursor.value++;
            if (m && m.getLoadState() !== ModuleLoadState.DISPOSED) {
                return { value: m, done: false };
            }
        }
        return { value: undefined as unknown as ArkModule, done: true };
    }

    /** The module Canonicalizer instance (shared with ModuleDepGraph). */
    public getModuleCanonicalizer(): Canonicalizer<ArkModule> {
        return this.moduleCanonicalizer;
    }

    // --- Query methods ---

    /** The module dependency graph, or undefined before dependency analysis. */
    public getDepGraph(): ModuleDepGraph | undefined {
        return this.depGraph;
    }

    /** Topologically sorted module IDs (empty before dependency analysis completes). */
    public getTopoOrder(): ModuleID[] {
        return this.depGraph ? this.depGraph.getTopoOrder() : [];
    }

    /** SCC groups map: ModuleID -> all ModuleIDs in the same SCC. */
    public getSCCGroups(): Map<ModuleID, ModuleID[]> {
        return this.sccGroups;
    }

    /** Whether the topological order is available (dependency analysis has completed). */
    public hasTopoOrder(): boolean {
        return this.dependenciesAnalyzed;
    }

    /** Whether SDK modules have been registered. */
    public isSdkRegistered(): boolean {
        return this.sdkRegistered;
    }

    /** Whether module preparation has completed. */
    public isModulesPrepared(): boolean {
        return this.modulesPrepared;
    }

    /**
     * Set the SCC post-processing threshold. SCCs larger than this size are split.
     * Set to Number.MAX_SAFE_INTEGER to disable post-processing.
     */
    public setMaxSCCGroupSize(maxGroupSize: number): void {
        this.maxSCCGroupSize = maxGroupSize;
    }

    /** Current SCC post-processing threshold. */
    public getMaxSCCGroupSize(): number {
        return this.maxSCCGroupSize;
    }

    // --- SDK and module preparation ---

    /**
     * Register SDK modules from the {@link SceneConfig}.
     *
     * Iterates the SDK list obtained from {@link Scene.getSceneConfig}, registering each
     * project-level SDK (those without a {@link Sdk.moduleName}) as an ArkModule with
     * moduleType=SDK. Only basic info (path, name) is registered — ArkFile building and
     * type inference are NOT performed by this method.
     *
     * Idempotent: if SDK modules have already been registered ({@link isSdkRegistered} is true), this
     * method returns immediately.
     */
    public prepareSdkModules(): void {
        if (this.sdkRegistered) {
            return;
        }

        const sdks = this.scene.getSceneConfig()?.getSdksObj() ?? [];
        for (const sdk of sdks) {
            if (sdk.moduleName) {
                continue; // skip module-level SDKs
            }

            const sdkPath = path.normalize(sdk.path);
            const module = this.registerModule(sdkPath, sdk.name);
            module.setModuleType(ModuleType.SDK);
        }

        this.sdkRegistered = true;
    }

    /**
     * Prepare modules by discovering and registering project modules and oh_modules dependencies.
     *
     * Reads build-profile.json5 to discover project modules, then scans oh_modules directories
     * to discover third-party dependencies. Only basic info (paths) is registered —
     * oh-package.json5 is NOT read and no dependency graph is built.
     *
     * Idempotent: if module preparation has already completed ({@link isModulesPrepared} is
     * true), this method returns immediately.
     */
    public prepareModules(): void {
        if (this.modulesPrepared) {
            return;
        }

        this.registerProjectModules();
        this.registerOhModulesModules();

        this.modulesPrepared = true;
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
     * runs SCC detection with post-processing refinement. The topological order is
     * populated inside refineSCCGroups and accessed via {@link getTopoOrder}.
     *
     * Idempotent: if dependency analysis has already completed ({@link hasTopoOrder}
     * is true), this method returns immediately.
     */
    public analyzeModuleDependencies(): void {
        if (this.dependenciesAnalyzed) {
            return;
        }

        this.updateModuleNamesFromOhPkg();
        this.buildDependencyGraph();

        this.sccGroups = this.depGraph!.refineSCCGroups(this.maxSCCGroupSize);

        this.dependenciesAnalyzed = true;
    }

    /**
     * Build the module dependency graph by reading each module's oh-package.json5.
     *
     * Creates a new {@link ModuleDepGraph} with the shared canonicalizer, adds all
     * registered modules as nodes, then resolves dependencies and adds edges.
     * Resolved dependencies create graph edges and update the module's alias map;
     * unresolved dependencies are recorded as unresolved dependencies.
     */
    private buildDependencyGraph(): void {
        this.depGraph = new ModuleDepGraph(this.moduleCanonicalizer);

        // 1. Add all registered modules as graph nodes
        for (const module of this.modulesIterator()) {
            this.depGraph.addModule(module);
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
                    const srcId = this.moduleCanonicalizer.getId(module);
                    const dstId = this.moduleCanonicalizer.getId(depModule);
                    this.depGraph.addDependencyEdge(srcId, dstId, depType);
                    module.addDependencyAlias(alias, dstId);
                } else {
                    module.addUnresolvedDependency(alias, depValue);
                }
            }
        }
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
    private resolveDepModule(alias: string, depValue: string, scopeModulePath: string,
        overrides?: { [k: string]: string }, overrideDependencyMap?: { [k: string]: string }): ArkModule | undefined {
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
                return this.moduleCanonicalizer.get(id);
            }
            return undefined;
        }

        // 3. oh_modules dependency: version number like "^1.0.0"
        const projectDir = this.scene.getRealProjectDir();
        // For .har dependencies inside the .ohpm cache, recompute the oh_modules base from the
        // enclosing oh_modules ancestor (mirrors processDependency in ModuleUtils).
        const moduleBase = depValue.endsWith('.har') && scopeModulePath.includes(OHPM)
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
                return this.moduleCanonicalizer.get(id);
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
            const dirs = fs.readdirSync(ohpmPath, { withFileTypes: true })
                .filter((dir) => dir.isDirectory() && dir.name.startsWith(prefix));
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
            if (typeof name === 'string') {
                module.setModuleName(name);
            }
        }
    }

    // --- Alias resolution ---

    /**
     * Resolve a dependency alias within the scope of the given module.
     *
     * Looks up the alias in the module's per-module alias map (dependencyAliasToId), then resolves
     * the resulting ModuleID back to the depended-on ArkModule.
     *
     * @param moduleId - ID of the module whose scope the alias is resolved in.
     * @param alias - Alias defined in the module's oh-package.json5 dependencies.
     * @returns The depended-on ArkModule, or undefined when the module or alias is unknown.
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

    // --- Module closure computation ---

    /**
     * Compute the transitive closure of module IDs reachable from the given target module paths via
     * dependency edges (BFS over {@link ModuleDepGraph.getSuccModuleIds}).
     *
     * Behavior:
     * 1. Each target path is resolved to a ModuleID via the persistent pathToId map.
     * 2. BFS: for each module in the closure, its successor dependency IDs (from the dependency
     *    graph) are added to the closure. When the dependency graph has not been built yet, only
     *    the target modules themselves are included.
     * 3. Paths not present in pathToId (unregistered) are silently skipped.
     * 4. SDK modules are never included in the closure; they are always handled separately by
     *    buildSdkModules and remain resident in memory throughout analysis.
     *
     * @param targetModulePaths - Absolute paths of the modules to start the closure from.
     * @returns Set of ModuleIDs in the transitive closure (excluding SDK modules).
     */
    public computeModuleClosure(targetModulePaths: Set<string>): Set<ModuleID> {
        const closure: Set<ModuleID> = new Set();
        const queue: ModuleID[] = [];

        for (const targetPath of targetModulePaths) {
            const id = this.pathToId.get(targetPath);
            if (id === undefined) {
                continue;
            }
            const module = this.moduleCanonicalizer.get(id);
            if (!module) {
                continue;
            }
            if (module.getModuleType() === ModuleType.SDK) {
                continue;
            }
            if (!closure.has(id)) {
                closure.add(id);
                queue.push(id);
            }
        }

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const succIds = this.depGraph ? this.depGraph.getSuccModuleIds(currentId) : [];
            for (const depId of succIds) {
                if (closure.has(depId)) {
                    continue;
                }
                const depModule = this.moduleCanonicalizer.get(depId);
                if (!depModule) {
                    continue;
                }
                if (depModule.getModuleType() === ModuleType.SDK) {
                    continue;
                }
                closure.add(depId);
                queue.push(depId);
            }
        }

        return closure;
    }

    /**
     * Filter the topological order to only include module IDs present in the given closure.
     *
     * @param closure - Set of ModuleIDs to retain.
     * @returns A new array containing topoOrder entries that are in the closure, preserving order.
     */
    public getFilteredTopoOrder(closure: Set<ModuleID>): ModuleID[] {
        const topo = this.depGraph ? this.depGraph.getTopoOrder() : [];
        return topo.filter(id => closure.has(id));
    }

    // --- Module loading ---

    /**
     * Load module data at the configured depth level.
     *
     * Flow:
     * 1. Idempotent: skip if the module is already LOADED.
     * 2. Recursively load dependencies first (so dependees are available).
     * 3. SDK modules are just marked LOADED (already built in prepareSdkModules).
     * 4. Build ArkFile objects to the configured level (current phase: META only).
     * 5. Record the configured retain level and set state to LOADED.
     *
     * Cyclic dependencies are handled via the {@link loadingModules} guard: when a module
     * currently being loaded is encountered again, the recursion stops immediately.
     *
     * @param moduleId - ID of the module to load.
     * @param config - Optional configuration providing per-type load levels.
     */
    public loadModule(moduleId: ModuleID, config?: ModuleAnalysisConfig): void {
        const module = this.getModule(moduleId);
        if (!module) {
            return;
        }
        if (module.getLoadState() === ModuleLoadState.LOADED) {
            return;
        }
        if (this.loadingModules.has(moduleId)) {
            return;
        }

        this.loadingModules.add(moduleId);
        try {
            // Recursively load dependencies first
            const depIds = this.depGraph ? this.depGraph.getSuccModuleIds(moduleId) : [];
            for (const depId of depIds) {
                this.loadModule(depId, config);
            }

            // Determine the configured load level for this module type
            const loadLevel = config?.getLoadLevel(module.getModuleType()) ?? ModuleDepthLevel.META;

            // Current phase: regardless of the configured depth, always build to META level only.
            // Higher levels (IMPORTS/SIGNATURES/BODIES) are not yet implemented and fall back to META.
            this.buildArkFileToLevel(module, ModuleDepthLevel.META);

            // Record the configured retain level (even though only META is built for now)
            this.retainLevels.set(moduleId, loadLevel);

            module.setLoadState(ModuleLoadState.LOADED);
        } finally {
            this.loadingModules.delete(moduleId);
        }
    }

    /**
     * Build ArkFile objects for a module at the given depth level.
     *
     * META level (current phase, the only implemented level):
     * - Scans the module directory for source files using scene options
     *   (supportFileExts / ignoreFileNames).
     * - For each file, creates an ArkFile with path basic info only (no parsing).
     * - Index files (index.ets/index.ts) should eventually include export/import info;
     *   for now they are treated the same as regular files (TODO).
     *
     * @param module - The module whose files are built.
     * @param level - The target depth level.
     */
    private buildArkFileToLevel(module: ArkModule, level: ModuleDepthLevel): void {
        // Current phase: only META is implemented. Higher levels fall back to META.
        const effectiveLevel = level <= ModuleDepthLevel.META ? level : ModuleDepthLevel.META;
        if (effectiveLevel === ModuleDepthLevel.META) {
            const modulePath = module.getModulePath();
            const options = this.scene.getOptions();
            const supportFileExts = options?.supportFileExts ?? ['.ets', '.ts'];
            const ignoreFileNames = options?.ignoreFileNames ?? [];
            const filePaths = getAllFiles(modulePath, supportFileExts, ignoreFileNames);

            for (const filePath of filePaths) {
                const arkFile = this.buildArkFile(filePath, module);
                if (arkFile) {
                    // TODO: For index files (index.ets/index.ts), the ArkFile should eventually
                    // include export/import info. For now, only path basic info is set (no parsing).
                    module.addFile(arkFile);
                    this.scene.setFile(arkFile);
                }
            }
        }
    }

    /**
     * Create an ArkFile with basic info only (no parsing).
     *
     * Sets the language (from FileUtils), scene, file path, project directory, and file
     * signature. The file content is NOT read or parsed.
     *
     * @param filePath - Absolute path of the source file.
     * @param module - The owning ArkModule (provides project dir and module name).
     * @returns The created ArkFile, or null on error.
     */
    private buildArkFile(filePath: string, module: ArkModule): ArkFile | null {
        try {
            const language = FileUtils.getFileLanguage(filePath, this.scene.getFileLanguages());
            const arkFile = new ArkFile(language);
            arkFile.setScene(this.scene);
            arkFile.setFilePath(filePath);
            arkFile.setProjectDir(module.getModulePath());

            const projectName = module.getModuleName() || module.getModulePath();
            const fileSignature = new FileSignature(projectName, path.relative(module.getModulePath(), filePath));
            arkFile.setFileSignature(fileSignature);

            return arkFile;
        } catch (error) {
            logger.error(`Error building ArkFile for ${filePath}: ${error}`);
            return null;
        }
    }

    /**
     * Get the configured retain level for a module.
     *
     * The retain level is the configured load level (from {@link ModuleAnalysisConfig}) recorded
     * during {@link loadModule}. Falls back to {@link ModuleDepthLevel.META} when the module has
     * not been loaded or has no explicit level configured.
     *
     * @param moduleId - ID of the module to query.
     * @returns The retain level (defaults to META).
     */
    public getRetainLevel(moduleId: ModuleID): ModuleDepthLevel {
        return this.retainLevels.get(moduleId) ?? ModuleDepthLevel.META;
    }
}
