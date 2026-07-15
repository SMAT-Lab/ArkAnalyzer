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

import { SparseBitVector } from '../../utils/SparseBitVector';
import { ModuleType } from '../../core/model/ArkModule';
import { ModuleDepthLevel } from './ModuleDepth';
import type { ModuleID } from '../../core/model/ArkModule';
import type { ArkModule } from '../../core/model/ArkModule';
import type { Scene } from '../../Scene';

/**
 * Callback invoked for each analyzed {@link ArkModule} within a {@link Scene}.
 */
export type ModuleAnalysisCallback = (module: ArkModule, scene: Scene) => void;

/**
 * ModuleAnalysisConfig configures target module selection and load levels
 * for module-level analysis.
 *
 * Target module selection uses three dimensions combined as:
 * ```
 * module is target ⟺ !excludedModuleIds.has(id)
 *                    && (includedTypes.has(type) || targetModuleIds.has(id))
 * ```
 * Priority: exclude > type filter / ID include (union).
 *
 * All three dimensions use {@link SparseBitVector} for efficient O(1) membership tests.
 * Bit indices are {@link ModuleID} (for ID include/exclude) or {@link ModuleType} enum values
 * (for type filter).
 *
 * Load levels ({@link ModuleDepthLevel}) control how much data is built for ArkFile objects:
 * - {@link loadLevel} applies to target modules (default {@link ModuleDepthLevel.BODIES}).
 * - {@link dependencyLoadLevel} applies to dependency modules — modules in the closure but
 *   not targets (default {@link ModuleDepthLevel.SIGNATURES}).
 *
 * @category core/model
 */
export class ModuleAnalysisConfig {
    /** Type filter: bit index = ModuleType enum value (0=PROJECT, 1=SDK, 2=OH_MODULES). */
    private includedTypes: SparseBitVector = new SparseBitVector();
    /** Explicit include IDs: bit index = ModuleID (additive to type filter). */
    private targetModuleIds: SparseBitVector = new SparseBitVector();
    /** Explicit exclude IDs: bit index = ModuleID (highest priority, overrides everything). */
    private excludedModuleIds: SparseBitVector = new SparseBitVector();
    /** Load level for target modules. Default BODIES. */
    private loadLevel: ModuleDepthLevel = ModuleDepthLevel.BODIES;
    /** Load level for dependency modules (in closure but not targets). Default SIGNATURES. */
    private dependencyLoadLevel: ModuleDepthLevel = ModuleDepthLevel.SIGNATURES;

    constructor() {}

    // --- Type filter ---

    /**
     * Set whether all modules of the given type are included as targets.
     * Returns this config to allow chaining.
     */
    public setIncludeType(type: ModuleType, include: boolean): ModuleAnalysisConfig {
        if (include) {
            this.includedTypes.set(type);
        } else {
            this.includedTypes.reset(type);
        }
        return this;
    }

    /** Check whether modules of the given type are included by the type filter. */
    public isTypeIncluded(type: ModuleType): boolean {
        return this.includedTypes.test(type);
    }

    // --- ID include (additive to type filter) ---

    /**
     * Replace the current explicit include ID set with the given IDs.
     * Returns this config to allow chaining.
     */
    public setTargetModuleIds(ids: ModuleID[]): ModuleAnalysisConfig {
        this.targetModuleIds.clear();
        ids.forEach(id => this.targetModuleIds.set(id));
        return this;
    }

    /**
     * Add a single module ID to the explicit include set.
     * Returns this config to allow chaining.
     */
    public addTargetModuleId(id: ModuleID): ModuleAnalysisConfig {
        this.targetModuleIds.set(id);
        return this;
    }

    /** Returns the explicit include ID set as a {@link SparseBitVector} (read-only, do not modify). */
    public getTargetModuleIds(): SparseBitVector {
        return this.targetModuleIds;
    }

    // --- ID exclude (highest priority) ---

    /**
     * Replace the current explicit exclude ID set with the given IDs.
     * Returns this config to allow chaining.
     */
    public setExcludedModuleIds(ids: ModuleID[]): ModuleAnalysisConfig {
        this.excludedModuleIds.clear();
        ids.forEach(id => this.excludedModuleIds.set(id));
        return this;
    }

    /**
     * Add a single module ID to the explicit exclude set.
     * Excluded modules are never targets, regardless of type filter or explicit include.
     * Returns this config to allow chaining.
     */
    public excludeModuleId(id: ModuleID): ModuleAnalysisConfig {
        this.excludedModuleIds.set(id);
        return this;
    }

    /** Returns the explicit exclude ID set as a {@link SparseBitVector} (read-only, do not modify). */
    public getExcludedModuleIds(): SparseBitVector {
        return this.excludedModuleIds;
    }

    // --- Load levels ---

    /**
     * Set the {@link ModuleDepthLevel} for target modules.
     * Returns this config to allow chaining.
     */
    public setLoadLevel(level: ModuleDepthLevel): ModuleAnalysisConfig {
        this.loadLevel = level;
        return this;
    }

    /** Get the {@link ModuleDepthLevel} for target modules. Default {@link ModuleDepthLevel.BODIES}. */
    public getLoadLevel(): ModuleDepthLevel {
        return this.loadLevel;
    }

    /**
     * Set the {@link ModuleDepthLevel} for dependency modules (in closure but not targets).
     * Returns this config to allow chaining.
     */
    public setDependencyLoadLevel(level: ModuleDepthLevel): ModuleAnalysisConfig {
        this.dependencyLoadLevel = level;
        return this;
    }

    /** Get the {@link ModuleDepthLevel} for dependency modules. Default {@link ModuleDepthLevel.SIGNATURES}. */
    public getDependencyLoadLevel(): ModuleDepthLevel {
        return this.dependencyLoadLevel;
    }
}
