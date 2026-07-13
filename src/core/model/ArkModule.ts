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
import { fetchDependenciesFromFile } from '../../utils/json5parser';
import type { ArkFile } from './ArkFile';
import type { FileDepGraph } from '../graph/FileDepGraph';
import type { Scene } from '../../Scene';

/**
 * Numeric identifier for an {@link ArkModule}, allocated by the module Canonicalizer.
 */
export type ModuleID = number;

/**
 * Lifecycle state of an {@link ArkModule}. Stored in the low 3 bits of {@link ArkModule.tags}.
 *
 * The states form an incremental progression: each state is a superset of the previous one,
 * matching the {@link ModuleDepthLevel} data depth levels. {@link DISPOSED} releases heavy data.
 */
export enum ModuleLoadState {
    /** No data loaded yet. */
    NOT_LOADED = 0,
    /** Module metadata + dependency topology + ArkFile path-only basic info. */
    META = 1,
    /** META + export/import info for all ArkFiles + intra-module file dependencies. */
    IMPORTS = 2,
    /** IMPORTS + ArkFile content excluding method bodies (namespaces, classes, signatures). */
    SIGNATURES = 3,
    /** SIGNATURES + method bodies (ArkBody, CFG, Stmt/Expr). */
    BODIES = 4,
    /** Unloaded; heavy data released via {@link ArkModule.clearFilesMap}. */
    DISPOSED = 5,
}

/**
 * Category of an {@link ArkModule}. Stored in bits 3-4 of {@link ArkModule.tags}.
 */
export enum ModuleType {
    /** In-project module (HAP/HSP/HAR) from build-profile.json5. */
    PROJECT = 0,
    /** SDK sub-module from the SDK directory (e.g. openharmony/ets/api, ets/kits). */
    SDK = 1,
    /** Third-party dependency module under oh_modules. */
    OH_MODULES = 2,
}

// Bit-field layout of `tags` (modeled after ArkBaseModel.tags):
//   bits 0-2: ModuleLoadState (3 bits, mask 0b111, values 0-5)
//   bits 3-4: ModuleType      (2 bits, mask 0b11 << 3, values 0-2)
const MODULE_LOAD_STATE_MASK = 0b111;
const MODULE_LOAD_STATE_SHIFT = 0;
const MODULE_TYPE_MASK = 0b11 << 3;
const MODULE_TYPE_SHIFT = 3;

/**
 * ArkModule is the new layer between {@link Scene} and {@link ArkFile}, corresponding to a single
 * module (HAP/HSP/HAR) of an OpenHarmony application.
 *
 * `loadState` and `moduleType` share a single `number` bit-field (`tags`), read/written via
 * {@link setTagValue}/{@link getTagValue}, following the pattern in `ArkBaseModel.tags`.
 * The default `tags` value `0` means `ModuleLoadState.NOT_LOADED | ModuleType.PROJECT`.
 *
 * @category core/model
 */
export class ArkModule {
    /** Absolute path of the module (primary identifier). */
    private modulePath: string = '';
    /** Module name from oh-package.json5 (e.g. "@ohos/entry"); auxiliary field. */
    private moduleName: string = '';

    /** key: {@link FileSignature.toMapKey} */
    private filesMap: Map<string, ArkFile> = new Map();

    /**
     * Alias-to-id mapping for dependencies, defined at the use site.
     * key: alias in this module's oh-package.json5 dependencies (e.g. "@ohos/library").
     * value: ModuleID of the depended-on module.
     */
    private dependencyAliasToId: Map<string, ModuleID> = new Map();

    /**
     * Unresolved dependencies (not participating in inter-module topological sort).
     * key: alias, value: version or path.
     */
    private unresolvedDependencies: Map<string, string> = new Map();

    /**
     * Intra-module file dependency graph, built during file dependency analysis
     * (IMPORTS level). Undefined until {@link analyzeFileDependencies} has run.
     */
    private fileDepGraph?: FileDepGraph;

    /**
     * Bit-field encoding loadState (bits 0-2) and moduleType (bits 3-4).
     * Default 0 = ModuleLoadState.NOT_LOADED | ModuleType.PROJECT.
     */
    private tags: number = 0;

    /** Back reference to the owning Scene. */
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /** Returns the owning {@link Scene} of this module. */
    public getScene(): Scene {
        return this.scene;
    }

    // --- Bit-field helpers (modeled after ArkBaseModel.setTagValue/getTagValue) ---

    private setTagValue(mask: number, shift: number, value: number): void {
        this.tags = (this.tags & ~mask) | ((value << shift) & mask);
    }

    private getTagValue(mask: number, shift: number): number {
        return (this.tags & mask) >>> shift;
    }

    // --- getters/setters ---

    public getModulePath(): string {
        return this.modulePath;
    }

    public setModulePath(modulePath: string): void {
        this.modulePath = modulePath;
    }

    public getModuleName(): string {
        return this.moduleName;
    }

    public setModuleName(moduleName: string): void {
        this.moduleName = moduleName;
    }

    public getFilesMap(): Map<string, ArkFile> {
        return this.filesMap;
    }

    public getLoadState(): ModuleLoadState {
        return this.getTagValue(MODULE_LOAD_STATE_MASK, MODULE_LOAD_STATE_SHIFT);
    }

    public setLoadState(state: ModuleLoadState): void {
        this.setTagValue(MODULE_LOAD_STATE_MASK, MODULE_LOAD_STATE_SHIFT, state);
    }

    public getModuleType(): ModuleType {
        return this.getTagValue(MODULE_TYPE_MASK, MODULE_TYPE_SHIFT);
    }

    public setModuleType(type: ModuleType): void {
        this.setTagValue(MODULE_TYPE_MASK, MODULE_TYPE_SHIFT, type);
    }

    // --- Dependency queries ---

    /**
     * Returns the list of modules this module directly depends on (successor dependencies).
     * Reads from the module dependency graph maintained by the Scene.
     * Returns an empty array when the dependency graph has not been built yet.
     */
    public getDependencies(): ArkModule[] {
        const depGraph = this.scene.getModuleDepGraph();
        if (!depGraph) {
            return [];
        }
        const moduleId = depGraph.tryGetNodeID(this);
        if (moduleId === undefined) {
            return [];
        }
        const succIds = depGraph.getSuccModuleIds(moduleId);
        const result: ArkModule[] = [];
        for (const succId of succIds) {
            const mod = depGraph.tryGetNode(succId);
            if (mod) {
                result.push(mod);
            }
        }
        return result;
    }

    /**
     * Returns the list of modules that directly depend on this module (predecessor dependents).
     * Reads from the module dependency graph maintained by the Scene.
     * Returns an empty array when the dependency graph has not been built yet.
     */
    public getDependents(): ArkModule[] {
        const depGraph = this.scene.getModuleDepGraph();
        if (!depGraph) {
            return [];
        }
        const moduleId = depGraph.tryGetNodeID(this);
        if (moduleId === undefined) {
            return [];
        }
        const predIds = depGraph.getPredModuleIds(moduleId);
        const result: ArkModule[] = [];
        for (const predId of predIds) {
            const mod = depGraph.tryGetNode(predId);
            if (mod) {
                result.push(mod);
            }
        }
        return result;
    }

    // --- Dependency management ---

    /**
     * Record an alias for a depended-on module within this module.
     * For example, given dependencies: { "@ohos/library": "file:../library" } in oh-package.json5,
     * alias = "@ohos/library", depId = ModuleID of the library module.
     */
    public addDependencyAlias(alias: string, depId: ModuleID): void {
        this.dependencyAliasToId.set(alias, depId);
    }

    /**
     * Resolve the ModuleID of a depended-on module by its alias defined in this module.
     */
    public resolveDependencyAlias(alias: string): ModuleID | undefined {
        return this.dependencyAliasToId.get(alias);
    }

    public getDependencyAliasToId(): Map<string, ModuleID> {
        return this.dependencyAliasToId;
    }

    // --- Unresolved dependencies ---

    public addUnresolvedDependency(alias: string, value: string): void {
        this.unresolvedDependencies.set(alias, value);
    }

    public getUnresolvedDependencies(): Map<string, string> {
        return this.unresolvedDependencies;
    }

    // --- File dependency analysis ---

    /** The intra-module file dependency graph, or undefined before analysis. */
    public getFileDepGraph(): FileDepGraph | undefined {
        return this.fileDepGraph;
    }

    public setFileDepGraph(graph: FileDepGraph): void {
        this.fileDepGraph = graph;
    }

    /** Whether file dependency analysis has produced a topological order. */
    public hasFileTopoOrder(): boolean {
        return this.fileDepGraph !== undefined && this.fileDepGraph.getTopoOrder().length > 0;
    }

    // --- File management ---

    public addFile(arkFile: ArkFile): void {
        this.filesMap.set(arkFile.getFileSignature().toMapKey(), arkFile);
    }

    public clearFilesMap(): void {
        this.filesMap.clear();
    }

    // --- oh-package.json5 reading ---

    /**
     * Returns the absolute path of this module's oh-package.json5.
     * Derived from the module path, not stored persistently.
     */
    public getOhPkgPath(): string {
        return path.join(this.modulePath, 'oh-package.json5');
    }

    /**
     * Reads and parses oh-package.json5 on demand (not stored persistently).
     * Used only during the build phase. Returns `{}` if the file does not exist.
     */
    public readOhPkgContent(): { [k: string]: unknown } {
        const ohPkgPath = this.getOhPkgPath();
        if (!fs.existsSync(ohPkgPath)) {
            return {};
        }
        return fetchDependenciesFromFile(ohPkgPath);
    }
}
