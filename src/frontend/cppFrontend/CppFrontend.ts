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

import { Language } from '../../core/model/ArkFile';
import { Scene } from '../../Scene';
import { ArkFile } from '../../core/model/ArkFile';
import { buildArkFileFromFile } from './model/builder/ArkFileBuilder';
import { FrontendParseFailure, FrontendParseResult } from '../LanguageFrontend';

/**
 * C++ language frontend. Matches the former {@link Scene} branches for {@link Language#CXX}.
 */
export class CppFrontend {

    public buildProjectFile(scene: Scene, filePath: string, arkFile: ArkFile): void {
        buildArkFileFromFile(filePath, scene.getRealProjectDir(), arkFile, scene.getProjectName(), scene.getIncludeDirs());
    }

    public buildProjectFiles(scene: Scene, filePaths: string[]): FrontendParseResult {
        const arkFiles: ArkFile[] = [];
        const failedFiles: FrontendParseFailure[] = [];
        for (const filePath of filePaths) {
            try {
                const arkFile = new ArkFile(Language.CXX);
                arkFile.setScene(scene);
                this.buildProjectFile(scene, filePath, arkFile);
                arkFiles.push(arkFile);
            } catch (error) {
                failedFiles.push({ filePath, reason: error });
            }
        }
        return { arkFiles, failedFiles };
    }
}
