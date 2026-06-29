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
 * Module data depth levels controlling how much data is built for ArkFile objects.
 * Higher levels are supersets of lower levels (incremental relationship).
 *
 * @category core/model
 */
export enum ModuleDepthLevel {
    /**
     * Level 0: Module metadata + dependency topology + ArkFile (path-only basic info).
     * Index files (index.ets/index.ts) are exceptions: their ArkFile includes export/import info.
     * Other files are NOT read or parsed.
     */
    META = 0,

    /**
     * Level 1: META + export/import info for ALL ArkFiles + intra-module file dependencies.
     */
    IMPORTS = 1,

    /**
     * Level 2: IMPORTS + ArkFile content excluding method bodies
     * (namespaces, classes, method signatures, parameters, return types).
     */
    SIGNATURES = 2,

    /**
     * Level 3: SIGNATURES + method bodies (ArkBody, CFG, Stmt/Expr).
     */
    BODIES = 3,
}
