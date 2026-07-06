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
import { FileDepGraph } from '../../core/graph/FileDepGraph';
import { BUILD_PROFILE_JSON5, OH_MODULES, MODULE_PREFIX, OH_PACKAGE_JSON5, OHPM } from '../../core/common/EtsConst';
import { OH_PKG_DEPENDENCIES, OH_PKG_DEV_DEPENDENCIES, OH_PKG_DYNAMIC_DEPENDENCIES } from '../../core/common/Const';
import { fetchDependenciesFromFile, parseJsonText } from '../../utils/json5parser';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ModuleDepthLevel } from './ModuleDepth';
import { ModuleAnalysisConfig } from './ModuleAnalysisConfig';
import { FrontendBuilder } from '../FrontendBuilder';
import { ArkFile } from '../../core/model/ArkFile';
import { FileUtils } from '../../utils/FileUtils';
import type { Scene } from '../../Scene';

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

    constructor(scene: Scene) {
        this.scene = scene;
        // Initialize pathToId from existing modules (supports idempotent calls)
        const canon = scene.getModuleCanonicalizer();
        for (const module of scene.getModules()) {
            this.pathToId.set(module.getModulePath(), canon.getId(module));
        }
    }

    // --- Module query methods (moved from Scene) ---

    /** Get a registered module by its ModuleID. Returns undefined when the id is out of bounds. */
    public getModule(id: ModuleID): ArkModule | undefined {
        return this.scene.getModuleCanonicalizer().get(id);
    }

    /** Look up a module by its absolute path using the pathToId cache. */
    public getModuleByPath(modulePath: string): ArkModule | undefined {
        const id = this.pathToId.get(modulePath);
        if (id === undefined) {
            return undefined;
        }
        return this.scene.getModuleCanonicalizer().get(id);
    }

    /** Total number of registered modules. */
    public getModuleCount(): number {
        return this.scene.getModuleCanonicalizer().size();
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

    /** Find the next non-DISPOSED module starting from the cursor. */
    private nextModule(cursor: { value: number }): IteratorResult<ArkModule> {
        const canon = this.scene.getModuleCanonicalizer();
        while (cursor.value < canon.size()) {
            const m = canon.get(cursor.value);
            cursor.value++;
            if (m && m.getLoadState() !== ModuleLoadState.DISPOSED) {
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
     * Compute the transitive closure of module IDs reachable from the given target module paths via
     * dependency edges (BFS over {@link ModuleDepGraph.getSuccModuleIds}).
     * SDK modules are never included in the closure.
     */
    public computeModuleClosure(targetModulePaths: Set<string>): Set<ModuleID> {
        const closure: Set<ModuleID> = new Set();
        const queue: ModuleID[] = [];

        for (const targetPath of targetModulePaths) {
            const id = this.pathToId.get(targetPath);
            if (id === undefined) {
                continue;
            }
            const module = this.scene.getModuleCanonicalizer().get(id);
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
            const graph = this.scene.getModuleDepGraph();
            const succIds = graph ? graph.getSuccModuleIds(currentId) : [];
            for (const depId of succIds) {
                if (closure.has(depId)) {
                    continue;
                }
                const depModule = this.scene.getModuleCanonicalizer().get(depId);
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

    /** Filter the topological order to only include module IDs present in the given closure. */
    public getFilteredTopoOrder(closure: Set<ModuleID>): ModuleID[] {
        const graph = this.scene.getModuleDepGraph();
        const topo = graph ? graph.getTopoOrder() : [];
        return topo.filter(id => closure.has(id));
    }

    /** The module Canonicalizer instance (shared with ModuleDepGraph). */
    public getModuleCanonicalizer(): Canonicalizer<ArkModule> {
        return this.scene.getModuleCanonicalizer();
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
        const canonicalizer = this.scene.getModuleCanonicalizer();
        const existingId = this.pathToId.get(modulePath);
        if (existingId !== undefined) {
            return canonicalizer.get(existingId)!;
        }

        const module = new ArkModule(this.scene);
        module.setModulePath(modulePath);
        module.setModuleName(moduleName);

        const id = canonicalizer.getId(module);
        this.pathToId.set(modulePath, id);

        return module;
    }

    // --- SDK and module preparation ---

    /**
     * Register SDK modules from the {@link SceneConfig}.
     *
     * Iterates the SDK list obtained from `Scene.getSceneConfig`, registering each
     * project-level SDK (those without a {@link Sdk.moduleName}) as an ArkModule with
     * moduleType=SDK. Only basic info (path, name) is registered — ArkFile building and
     * type inference are NOT performed by this method.
     *
     * Idempotent: if SDK modules have already been registered (`Scene.isSdkRegistered()` is
     * true), this method returns immediately.
     */
    public prepareSdkModules(): void {
        if (this.scene.isSdkRegistered()) {
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

        this.scene.setSdkRegistered(true);
    }

    /**
     * Prepare modules by discovering and registering project modules and oh_modules dependencies.
     *
     * Reads build-profile.json5 to discover project modules, then scans oh_modules directories
     * to discover third-party dependencies. Only basic info (paths) is registered —
     * oh-package.json5 is NOT read and no dependency graph is built.
     *
     * Idempotent: if module preparation has already completed (`Scene.isModulesRegistered()`
     * is true), this method returns immediately.
     */
    public prepareModules(): void {
        if (this.scene.isModulesRegistered()) {
            return;
        }

        this.registerProjectModules();
        this.registerOhModulesModules();

        this.scene.setModulesRegistered(true);
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
     * Idempotent: if dependency analysis has already completed
     * (`Scene.isModuleDependenciesAnalyzed()` is true), this method returns immediately.
     */
    public analyzeModuleDependencies(): void {
        if (this.scene.isModuleDependenciesAnalyzed()) {
            return;
        }

        this.updateModuleNamesFromOhPkg();
        this.buildDependencyGraph();

        const graph = this.scene.getModuleDepGraph()!;
        graph.refineSCCGroups(graph.getMaxSCCGroupSize());

        this.scene.setModuleDependenciesAnalyzed(true);
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
        const canonicalizer = this.scene.getModuleCanonicalizer();
        const graph = new ModuleDepGraph(canonicalizer);

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
                    const srcId = canonicalizer.getId(module);
                    const dstId = canonicalizer.getId(depModule);
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
        const canonicalizer = this.scene.getModuleCanonicalizer();

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
                return canonicalizer.get(id);
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
                return canonicalizer.get(id);
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
            if (typeof name === 'string') {
                module.setModuleName(name);
            }
        }
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
     * Load module data at the configured depth level.
     *
     * Flow:
     * 1. Determine the configured load level for this module type, then cap the effective build
     *    level at {@link ModuleDepthLevel.IMPORTS} (higher levels are not built in this phase).
     * 2. Idempotent: skip if the module's loadState already reaches the target load state.
     * 3. Set the target load state early to break cyclic dependency recursion (replaces the
     *    former `loadingModules` guard): when a module currently being loaded is encountered
     *    again, its loadState already meets the target, so the recursion stops immediately.
     * 4. Recursively load dependencies first (so dependees are available).
     * 5. Build ArkFile objects to the effective level (META scan always; IMPORTS adds import/export info).
     * 6. When the effective level reaches IMPORTS, analyze intra-module file dependencies.
     *
     * SDK modules are handled the same as other modules (no special early-return): they are built
     * to the effective level like any other module type.
     *
     * @param moduleId - ID of the module to load.
     * @param config - Optional configuration providing per-type load levels.
     */
    public loadModule(moduleId: ModuleID, config?: ModuleAnalysisConfig): void {
        const module = this.getModule(moduleId);
        if (!module) {
            return;
        }

        // Determine the configured load level and cap the effective level at IMPORTS
        const loadLevel = config?.getLoadLevel(module.getModuleType()) ?? ModuleDepthLevel.META;
        const effectiveLevel = Math.min(loadLevel, ModuleDepthLevel.IMPORTS);
        const targetLoadState = this.depthLevelToLoadState(effectiveLevel);

        // Idempotent: skip if already loaded to the target level
        if (module.getLoadState() >= targetLoadState) {
            return;
        }

        // Set target state early to break cyclic dependency recursion
        module.setLoadState(targetLoadState);

        // Recursively load dependencies first
        const depGraph = this.scene.getModuleDepGraph();
        const depIds = depGraph ? depGraph.getSuccModuleIds(moduleId) : [];
        for (const depId of depIds) {
            this.loadModule(depId, config);
        }

        // Build ArkFile objects to the effective level
        FrontendBuilder.buildModuleFilesToLevel(this.scene, module, effectiveLevel);

        // Analyze intra-module file dependencies when IMPORTS level was reached
        if (effectiveLevel >= ModuleDepthLevel.IMPORTS) {
            this.analyzeFileDependencies(module);
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
