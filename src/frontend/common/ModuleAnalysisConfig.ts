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

import * as path from 'path';
import { ModuleType } from '../../core/model/ArkModule';
import { ModuleDepthLevel } from './ModuleDepth';
import type { ArkModule } from '../../core/model/ArkModule';
import type { Scene } from '../../Scene';

/**
 * Callback invoked for each analyzed {@link ArkModule} within a {@link Scene}.
 */
export type ModuleAnalysisCallback = (module: ArkModule, scene: Scene) => void;

/**
 * ModuleAnalysisConfig configures target project module selection and per-module-type load
 * levels for module-level analysis.
 *
 * Target project module paths are stored as absolute paths: relative inputs are normalized via
 * `path.resolve` so that equality comparisons remain stable. Load levels ({@link ModuleDepthLevel})
 * control how much data is built for ArkFile objects of each {@link ModuleType}; all module types
 * default to {@link ModuleDepthLevel.META} and can be overridden via {@link ModuleAnalysisConfig.setLoadLevel}.
 *
 * @category core/model
 */
export class ModuleAnalysisConfig {
    private targetProjectModules: Set<string> = new Set();
    private loadLevels: Map<ModuleType, ModuleDepthLevel> = new Map();

    constructor() {
        this.loadLevels.set(ModuleType.SDK, ModuleDepthLevel.META);
        this.loadLevels.set(ModuleType.OH_MODULES, ModuleDepthLevel.META);
        this.loadLevels.set(ModuleType.PROJECT, ModuleDepthLevel.META);
    }

    /**
     * Replace the current target project module set with the given paths.
     * Relative paths are normalized to absolute paths via `path.resolve`.
     */
    public setTargetProjectModules(modulePaths: string[]): ModuleAnalysisConfig {
        this.targetProjectModules = new Set();
        for (const p of modulePaths) {
            this.targetProjectModules.add(path.isAbsolute(p) ? p : path.resolve(p));
        }
        return this;
    }

    /**
     * Append a single target project module path. Relative paths are normalized to absolute
     * paths via `path.resolve`.
     */
    public addTargetProjectModule(modulePath: string): ModuleAnalysisConfig {
        this.targetProjectModules.add(path.isAbsolute(modulePath) ? modulePath : path.resolve(modulePath));
        return this;
    }

    public getTargetProjectModules(): Set<string> {
        return this.targetProjectModules;
    }

    public hasTargetProjectModules(): boolean {
        return this.targetProjectModules.size > 0;
    }

    /**
     * Set the {@link ModuleDepthLevel} for a given {@link ModuleType}.
     * Returns this config to allow chaining.
     */
    public setLoadLevel(type: ModuleType, level: ModuleDepthLevel): ModuleAnalysisConfig {
        this.loadLevels.set(type, level);
        return this;
    }

    /**
     * Get the {@link ModuleDepthLevel} for a given {@link ModuleType}.
     * Falls back to {@link ModuleDepthLevel.META} when the type has no explicit level set.
     */
    public getLoadLevel(type: ModuleType): ModuleDepthLevel {
        return this.loadLevels.get(type) ?? ModuleDepthLevel.META;
    }
}
