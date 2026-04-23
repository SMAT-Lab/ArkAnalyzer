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

import { Scene } from '../../Scene';
import { ArkFile } from '../../core/model/ArkFile';
import { buildArkFileFromFile } from '../../core/model/builder/ArkFileBuilder';
import { LanguageFrontend } from '../LanguageFrontend';


/**
 * ArkTS/TS/JS: builds {@link ArkFile}s using the core TS/ArkTS pipeline (see {@link buildArkFileFromFile}).
 */
export class ArktsFrontend implements LanguageFrontend {
    public readonly id: string = 'arkts';

    /** Fills a project {@link ArkFile} from a source file; delegates to {@link buildArkFileFromFile}. */
    public buildProjectFile(scene: Scene, filePath: string, arkFile: ArkFile): void {
        buildArkFileFromFile(filePath, scene.getRealProjectDir(), arkFile, scene.getProjectName());
    }

    /**
     * Non-project SDK file load (e.g. OpenHarmony SDK sources); mirrors the former {@link Scene} path for SDK files.
     */
    public static buildArkFileFromSdkPath(absoluteFilePath: string, sdkPath: string, arkFile: ArkFile, sdkName: string): void {
        buildArkFileFromFile(absoluteFilePath, sdkPath, arkFile, sdkName);
    }
}
