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
import { SceneOptions } from '../../Config';
import { FileUtils } from '../../utils/FileUtils';
import { ArkFile, Language } from '../../core/model/ArkFile';
import { buildArkFileFromFile } from '../../core/model/builder/ArkFileBuilder';
import { FrontendParseFailure, FrontendParseResult, LanguageFrontend } from '../LanguageFrontend';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { getAllFiles } from '../../utils/getAllFiles';
import { ModelUtils } from '../../core/common/ModelUtils';
import { SdkUtils } from '../../core/common/SdkUtils';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArktsFrontend');

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

    public parse(scene: Scene, config: SceneOptions): FrontendParseResult {
        const arkFiles: ArkFile[] = [];
        const failedFiles: FrontendParseFailure[] = [];
        for (const file of scene.getProjectFiles()) {
            const one = this.parseSingleFile(scene, file, config);
            arkFiles.push(...one.arkFiles);
            failedFiles.push(...one.failedFiles);
        }
        return { arkFiles, failedFiles };
    }

    public parseModuleFiles(scene: Scene, modulePath: string, supportFileExts: string[]): FrontendParseResult {
        const arkFiles: ArkFile[] = [];
        const failedFiles: FrontendParseFailure[] = [];
        const options = scene.getOptions();
        for (const file of getAllFiles(modulePath, supportFileExts, options.ignoreFileNames)) {
            const one = this.parseSingleFile(scene, file, options);
            arkFiles.push(...one.arkFiles);
            failedFiles.push(...one.failedFiles);
        }
        return { arkFiles, failedFiles };
    }

    public parseSingleFile(scene: Scene, filePath: string, _config: SceneOptions): FrontendParseResult {
        const language = FileUtils.getFileLanguage(filePath, scene.getFileLanguages());
        if (language === Language.CXX) {
            return { arkFiles: [], failedFiles: [] };
        }
        const arkFiles: ArkFile[] = [];
        const failedFiles: FrontendParseFailure[] = [];
        logger.trace('=== parse file:', filePath);
        try {
            const arkFile = new ArkFile(language);
            arkFile.setScene(scene);
            this.buildProjectFile(scene, filePath, arkFile);
            arkFiles.push(arkFile);
        } catch (error) {
            failedFiles.push({ filePath, reason: error });
        }
        return { arkFiles, failedFiles };
    }

    public runDependencyBuild(scene: Scene, _config: SceneOptions): void {
        scene.getProjectFiles().forEach(file => {
            if (FileUtils.getFileLanguage(file, scene.getFileLanguages()) === Language.CXX) {
                return;
            }
            scene.getDependencyFilesDeeply(file);
        });
    }

    public parseSdkFile(scene: Scene, filePath: string, sdkPath: string, sdkName: string, _config: SceneOptions): FrontendParseResult {
        const language = FileUtils.getFileLanguage(filePath, scene.getFileLanguages());
        if (language === Language.CXX) {
            return { arkFiles: [], failedFiles: [] };
        }
        logger.trace('=== parse sdk file:', filePath);
        const arkFiles: ArkFile[] = [];
        const failedFiles: FrontendParseFailure[] = [];
        try {
            const arkFile: ArkFile = new ArkFile(language);
            arkFile.setScene(scene);
            ArktsFrontend.buildArkFileFromSdkPath(filePath, sdkPath, arkFile, sdkName);
            ModelUtils.getAllClassesInFile(arkFile).forEach(cls => {
                cls.getDefaultArkMethod()?.buildBody();
                cls.getDefaultArkMethod()?.freeBodyBuilder();
            });
            SdkUtils.buildSdkImportMap(arkFile);
            SdkUtils.loadGlobalAPI(arkFile, scene.getSdkGlobalMap());
            arkFiles.push(arkFile);
        } catch (error) {
            failedFiles.push({ filePath, reason: error });
        }
        return { arkFiles, failedFiles };
    }

    public collectFiles(scene: Scene, _config: SceneOptions): string[] {
        return scene
            .getProjectFiles()
            .filter(f => FileUtils.getFileLanguage(f, scene.getFileLanguages()) !== Language.CXX);
    }
}
