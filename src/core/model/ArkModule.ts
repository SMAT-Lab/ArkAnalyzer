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
import { fetchDependenciesFromFile } from '../../utils/json5parser';
import type { ArkFile } from './ArkFile';
import type { ModuleScene, Scene } from '../../Scene';

/**
 * Numeric identifier for an {@link ArkModule}, allocated by the module Canonicalizer.
 */
export type ModuleID = number;

/**
 * Lifecycle state of an {@link ArkModule}. Stored in the low 2 bits of {@link ArkModule.tags}.
 */
export enum ModuleLoadState {
    /** Only metadata is present, no ArkFile loaded yet. */
    NOT_LOADED = 0,
    /** ArkFile objects have been built into memory. */
    LOADED = 1,
    /** Analysis has completed. */
    ANALYZED = 2,
    /** Unloaded; heavy data released via {@link ArkModule.clearFilesMap}. */
    DISPOSED = 3,
}

/**
 * Category of an {@link ArkModule}. Stored in bits 2-3 of {@link ArkModule.tags}.
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
//   bits 0-1: ModuleLoadState (2 bits, values 0-3)
//   bits 2-3: ModuleType      (2 bits, values 0-2)
const MODULE_LOAD_STATE_MASK = 0b11;
const MODULE_LOAD_STATE_SHIFT = 0;
const MODULE_TYPE_MASK = 0b11 << 2;
const MODULE_TYPE_SHIFT = 2;

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
    /** IDs of modules this module directly depends on. */
    private dependencyIds: SparseBitVector = new SparseBitVector();
    /** IDs of modules that depend on this module. */
    private dependentIds: SparseBitVector = new SparseBitVector();

    /**
     * Alias-to-id mapping for dependencies, defined at the use site.
     * key: alias in this module's oh-package.json5 dependencies (e.g. "@ohos/library").
     * value: ModuleID of the depended-on module.
     */
    private dependencyAliasToId: Map<string, ModuleID> = new Map();

    /**
     * oh_modules external dependencies (not participating in inter-module topological sort).
     * key: alias, value: version or path.
     */
    private externalDependencies: Map<string, string> = new Map();

    /**
     * Bit-field encoding loadState (bits 0-1) and moduleType (bits 2-3).
     * Default 0 = ModuleLoadState.NOT_LOADED | ModuleType.PROJECT.
     */
    private tags: number = 0;

    /** Back reference to the owning scene. */
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
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

    public getScene(): Scene {
        return this.scene;
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

    public addDependency(depId: ModuleID): void {
        this.dependencyIds.set(depId);
    }

    public hasDependency(depId: ModuleID): boolean {
        return this.dependencyIds.test(depId);
    }

    public getDependencyIds(): SparseBitVector {
        return this.dependencyIds;
    }

    public addDependent(depId: ModuleID): void {
        this.dependentIds.set(depId);
    }

    public hasDependent(depId: ModuleID): boolean {
        return this.dependentIds.test(depId);
    }

    public getDependentIds(): SparseBitVector {
        return this.dependentIds;
    }

    // --- External dependencies ---

    public addExternalDependency(alias: string, value: string): void {
        this.externalDependencies.set(alias, value);
    }

    public getExternalDependencies(): Map<string, string> {
        return this.externalDependencies;
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

    // --- Compatibility ---

    /**
     * Construct an ArkModule from an existing ModuleScene (for migration).
     * The ID is allocated by ModuleManager.registerModule via the Canonicalizer;
     * fromModuleScene only migrates data from the existing ModuleScene.
     * The alias mapping (dependencyAliasToId) is intentionally NOT migrated here;
     * it is filled later by buildDependencyGraph based on oh-package.json5 dependencies.
     */
    public static fromModuleScene(ms: ModuleScene, scene: Scene): ArkModule {
        const module = new ArkModule(scene);
        module.setModulePath(ms.getModulePath());
        module.setModuleName(ms.getModuleName());
        for (const [, file] of ms.getModuleFilesMap()) {
            module.addFile(file);
        }
        return module;
    }
}
