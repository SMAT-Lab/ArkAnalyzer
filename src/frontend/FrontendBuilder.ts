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

import { Language } from '../core/model/ArkFile';
import { ModuleScene, Scene } from '../Scene';
import { ArktsFrontend } from './arktsFrontend/ArktsFrontend';
import { CppFrontend } from './cppFrontend/CppFrontend';
import { ArkFile } from '../core/model/ArkFile';
import { FileUtils } from '../utils/FileUtils';
import Logger, { LOG_MODULE_TYPE } from '../utils/logger';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'FrontendBuilder');

export interface FrontendParseFailure {
    filePath: string;
    reason: unknown;
}

export interface FrontendParseResult {
    arkFiles: ArkFile[];
    failedFiles: FrontendParseFailure[];
}

/**
 * Dispatches language front-ends and exposes a single build entry for {@link Scene} so the scene no longer
 * branches on {@link Language} to pick {@link import('../core/model/builder/ArkFileBuilder').buildArkFileFromFile}
 * vs the C++ builder.
 */
export class FrontendBuilder {
    private static partitionFilePaths(scene: Scene, filePaths: string[]): { cppFiles: string[]; arktsFiles: string[] } {
        const cppFiles: string[] = [];
        const arktsFiles: string[] = [];
        for (const filePath of filePaths) {
            if (FileUtils.getFileLanguage(filePath, scene.getFileLanguages()) === Language.CXX) {
                cppFiles.push(filePath);
            } else {
                arktsFiles.push(filePath);
            }
        }
        return { cppFiles, arktsFiles };
    }

    private static collectFailedFilePaths(scene: Scene, failedFiles: { filePath: string; reason: unknown }[]): void {
        for (const failed of failedFiles) {
            logger.error('Error parsing file:', failed.filePath, failed.reason);
            scene.addUnhandledFilePath(failed.filePath);
        }
    }

    public static buildFilesIntoArkFiles(scene: Scene, filePaths: string[]): void {
        const { cppFiles, arktsFiles } = this.partitionFilePaths(scene, filePaths);
        const arktsFrontend = new ArktsFrontend();
        const cppFrontend = new CppFrontend();
        const arktsResult = arktsFrontend.buildProjectFiles(scene, arktsFiles);
        const cppResult = cppFrontend.buildProjectFiles(scene, cppFiles);
        arktsResult.arkFiles.forEach(file => scene.setFile(file));
        cppResult.arkFiles.forEach(file => scene.setFile(file));
        this.collectFailedFilePaths(scene, [...arktsResult.failedFiles, ...cppResult.failedFiles]);
    }

    public static buildModuleFilesIntoArkFiles(moduleScene: ModuleScene, filePaths: string[]): void {
        const scene = moduleScene.getProjectScene();
        const { cppFiles, arktsFiles } = this.partitionFilePaths(scene, filePaths);
        const arktsFrontend = new ArktsFrontend();
        const cppFrontend = new CppFrontend();
        const arktsResult = arktsFrontend.buildProjectFiles(scene, arktsFiles);
        const cppResult = cppFrontend.buildProjectFiles(scene, cppFiles);
        [...arktsResult.arkFiles, ...cppResult.arkFiles].forEach(file => {
            file.setModuleScene(moduleScene);
            moduleScene.addArkFile(file);
            scene.setFile(file);
        });
        this.collectFailedFilePaths(scene, [...arktsResult.failedFiles, ...cppResult.failedFiles]);
    }

    /**
     * Builds a single project file into a pre-allocated {@link ArkFile} (the former `if (CXX) … else …` in `Scene`).
     */
    public static buildProjectFileIntoArkFile(scene: Scene, filePath: string, arkFile: ArkFile): void {
        if (arkFile.getLanguage() === Language.CXX) {
            new CppFrontend().buildProjectFile(scene, filePath, arkFile);
        } else {
            new ArktsFrontend().buildProjectFile(scene, filePath, arkFile);
        }
    }
}
