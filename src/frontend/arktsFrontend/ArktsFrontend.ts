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
import { buildArkFileFromFile, buildArkFileSignaturesFromFile, buildImportExportInfoFromFile } from '../../core/model/builder/ArkFileBuilder';
import { FrontendParseFailure, FrontendParseResult } from '../FrontendBuilder';
import { FileUtils } from '../../utils/FileUtils';

/**
 * ArkTS/TS/JS: builds {@link ArkFile}s using the core TS/ArkTS pipeline (see {@link buildArkFileFromFile}).
 */
export class ArktsFrontend {
    /** Fills a project {@link ArkFile} from a source file; delegates to {@link buildArkFileFromFile}. */
    public buildProjectFile(scene: Scene, filePath: string, arkFile: ArkFile): void {
        buildArkFileFromFile(filePath, scene.getRealProjectDir(), arkFile, scene.getProjectName());
    }

    /**
     * Imports-only build for a single ArkTS file: fills ImportInfo/ExportInfo
     * without building ArkClass/ArkMethod/ArkBody.
     */
    public buildProjectFileForImports(arkFile: ArkFile): void {
        buildImportExportInfoFromFile(arkFile);
    }

    /**
     * Signatures-only upgrade for a single ArkTS file whose ImportInfo/ExportInfo were already
     * populated by {@link buildProjectFileForImports}. Builds ArkClass/ArkMethod/ArkNamespace
     * signatures on top, skipping the import/export branches to avoid duplicating `export *`.
     */
    public buildProjectFileForSignatures(arkFile: ArkFile): void {
        buildArkFileSignaturesFromFile(arkFile);
    }

    /**
     * Non-project SDK file load (e.g. OpenHarmony SDK sources); mirrors the former {@link Scene} path for SDK files.
     */
    public static buildArkFileFromSdkPath(absoluteFilePath: string, sdkPath: string, arkFile: ArkFile, sdkName: string): void {
        buildArkFileFromFile(absoluteFilePath, sdkPath, arkFile, sdkName);
    }

    public buildProjectFiles(scene: Scene, filePaths: string[]): FrontendParseResult {
        const arkFiles: ArkFile[] = [];
        const failedFiles: FrontendParseFailure[] = [];
        for (const filePath of filePaths) {
            try {
                const arkFile = new ArkFile(FileUtils.getFileLanguage(filePath, scene.getFileLanguages()));
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
