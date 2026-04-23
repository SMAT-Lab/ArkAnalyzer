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

import { ArkFile } from '../core/model/ArkFile';
import type { Scene } from '../Scene';

export interface FrontendParseFailure {
    filePath: string;
    reason: unknown;
}

export interface FrontendParseResult {
    arkFiles: ArkFile[];
    failedFiles: FrontendParseFailure[];
}

/**
 * A language frontend is responsible for collecting and parsing files of one language.
 * High-level {@link Scene} flows can delegate to {@link FrontendBuilder} to avoid branching on file language inside
 * the scene.
 */
export interface LanguageFrontend {
    readonly id: string;

}
