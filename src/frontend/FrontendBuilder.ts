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

/**
 * Options for routing project-file build (must stay aligned with legacy `Scene` C++ `compile_commands` handling).
 * @public
 */
export type BuildProjectFileOptions = {
    /**
     * When `true`, refresh `compile_commands.json` path from the source file, matching former `Scene.genArkFiles`
     * C++ only. `false` matches dependency-traversal and module-scene paths.
     */
    refreshCompileDatabasePath: boolean;
};

/**
 * Dispatches language front-ends and exposes a single build entry for {@link Scene} so the scene no longer
 * branches on {@link Language} to pick {@link import('../core/model/builder/ArkFileBuilder').buildArkFileFromFile}
 * vs the C++ builder.
 */
export class FrontendBuilder {
    public static buildFilesIntoArkFiles(scene: Scene, filePaths: string[], options: BuildProjectFileOptions): void {
        for (const filePath of filePaths) {
            logger.trace('=== parse file:', filePath);
            try {
                const arkFile = new ArkFile(FileUtils.getFileLanguage(filePath, scene.getFileLanguages()));
                arkFile.setScene(scene);
                this.buildProjectFileIntoArkFile(scene, filePath, arkFile, options);
                scene.setFile(arkFile);
            } catch (error) {
                logger.error('Error parsing file:', filePath, error);
                scene.addUnhandledFilePath(filePath);
            }
        }
    }

    public static buildModuleFilesIntoArkFiles(moduleScene: ModuleScene, filePaths: string[]): void {
        const scene = moduleScene.getProjectScene();
        for (const filePath of filePaths) {
            logger.trace('=== parse file:', filePath);
            try {
                const arkFile = new ArkFile(FileUtils.getFileLanguage(filePath, scene.getFileLanguages()));
                arkFile.setScene(scene);
                arkFile.setModuleScene(moduleScene);
                this.buildProjectFileIntoArkFile(scene, filePath, arkFile, { refreshCompileDatabasePath: false });
                moduleScene.addArkFile(arkFile);
                scene.setFile(arkFile);
            } catch (error) {
                logger.error('Error parsing file:', filePath, error);
                scene.addUnhandledFilePath(filePath);
            }
        }
    }

    /**
     * Builds a single project file into a pre-allocated {@link ArkFile} (the former `if (CXX) … else …` in `Scene`).
     */
    public static buildProjectFileIntoArkFile(scene: Scene, filePath: string, arkFile: ArkFile, options: BuildProjectFileOptions): void {
        if (arkFile.getLanguage() === Language.CXX) {
            new CppFrontend().buildProjectFile(scene, filePath, arkFile, { refreshCompileDatabasePath: options.refreshCompileDatabasePath });
        } else {
            new ArktsFrontend().buildProjectFile(scene, filePath, arkFile);
        }
    }
}
