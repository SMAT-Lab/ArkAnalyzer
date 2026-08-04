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

/**
 * Module data depth levels controlling how much data is retained for an {@link ArkModule}.
 * Higher levels are supersets of lower levels (incremental relationship).
 *
 * Valid direct load targets ({@link ModuleAnalysisConfig} / {@link ModuleBuilder.loadModule}):
 * {@link SIGNATURES} and {@link BODIES} only.
 *
 * {@link INDEX} is downgrade/fallback only: hollowed in-place ArkFile IR (export-reachable
 * shells kept so import/type/RTA lookup APIs still work). Passing it to setLoadLevel /
 * setDependencyLoadLevel / loadModule throws — do not use as a load target.
 *
 * @category core/model
 */
export enum ModuleDepthLevel {
    /**
     * Downgrade / fallback only: in-place hollow IR — bodies/AST/source stripped and
     * non-exported classes pruned; {@link ArkFile}/{@link ArkClass}/{@link ArkMethod}
     * shells remain queryable via the same Scene APIs as SIGNATURES.
     * Not a valid direct load target.
     */
    INDEX = 0,

    /**
     * Export/import info + namespaces/classes/method signatures (no method bodies).
     */
    SIGNATURES = 1,

    /**
     * SIGNATURES + method bodies (ArkBody, CFG, Stmt/Expr).
     */
    BODIES = 2,
}

/** Throws if `level` is {@link ModuleDepthLevel.INDEX} (downgrade-only). */
export function assertDirectLoadLevel(level: ModuleDepthLevel): void {
    if (level === ModuleDepthLevel.INDEX) {
        throw new Error('ModuleDepthLevel.INDEX is not a direct load target; use SIGNATURES or BODIES');
    }
}
