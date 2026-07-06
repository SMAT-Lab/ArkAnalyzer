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

import path from 'path';

import { Language } from '../core/model/ArkFile';
import { ModuleScene, Scene } from '../Scene';
import { ArktsFrontend } from './arktsFrontend/ArktsFrontend';
import { CppFrontend } from './cppFrontend/CppFrontend';
import { ArkFile } from '../core/model/ArkFile';
import { ArkModule } from '../core/model/ArkModule';
import { FileSignature } from '../core/model/ArkSignature';
import { FileUtils } from '../utils/FileUtils';
import { getAllFiles } from '../utils/getAllFiles';
import Logger, { LOG_MODULE_TYPE } from '../utils/logger';
import { ModuleDepthLevel } from './common/ModuleDepth';

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

    /**
     * Build all source files of an {@link ArkModule} up to the given {@link ModuleDepthLevel}.
     *
     * Scans the module directory for source files using scene options
     * (supportFileExts / ignoreFileNames), creates an {@link ArkFile} for each file, registers it
     * with the module and scene, and builds it to the requested level. Errors on individual files
     * are logged and do not abort the loop.
     *
     * @param scene - The owning {@link Scene}.
     * @param module - The module whose files are built.
     * @param level - The target depth level.
     */
    public static buildModuleFilesToLevel(scene: Scene, module: ArkModule, level: ModuleDepthLevel): void {
        const modulePath = module.getModulePath();
        const options = scene.getOptions();
        const supportFileExts = options?.supportFileExts ?? ['.ets', '.ts'];
        const ignoreFileNames = options?.ignoreFileNames ?? [];
        const filePaths = getAllFiles(modulePath, supportFileExts, ignoreFileNames);

        for (const filePath of filePaths) {
            try {
                FrontendBuilder.buildSingleModuleFile(scene, module, filePath, level);
            } catch (error) {
                logger.error(`Error building ArkFile for ${filePath}: ${error}`);
            }
        }
    }

    /**
     * Create an ArkFile for a single module file, register it, and build it to the given level.
     */
    private static buildSingleModuleFile(
        scene: Scene,
        module: ArkModule,
        filePath: string,
        level: ModuleDepthLevel
    ): void {
        const language = FileUtils.getFileLanguage(filePath, scene.getFileLanguages());
        const arkFile = new ArkFile(language);
        arkFile.setScene(scene);
        arkFile.setFilePath(filePath);
        arkFile.setProjectDir(module.getModulePath());

        const fileSignature = new FileSignature(scene.getProjectName(), path.relative(module.getModulePath(), filePath));
        arkFile.setFileSignature(fileSignature);

        module.addFile(arkFile);
        scene.setFile(arkFile);

        FrontendBuilder.buildArkFileToLevel(scene, filePath, arkFile, language, level);
    }

    /**
     * Dispatch level-aware building to the appropriate frontend.
     * SIGNATURES and BODIES are capped at IMPORTS (not yet implemented).
     */
    private static buildArkFileToLevel(
        scene: Scene,
        filePath: string,
        arkFile: ArkFile,
        language: Language,
        level: ModuleDepthLevel
    ): void {
        if (level <= ModuleDepthLevel.META) {
            return;
        }
        // Cap at IMPORTS: SIGNATURES/BODIES are treated as IMPORTS for now
        FrontendBuilder.buildImports(arkFile, language);
    }

    /**
     * IMPORTS level: lightweight import/export parsing only.
     */
    private static buildImports(arkFile: ArkFile, language: Language): void {
        if (language === Language.CXX) {
            new CppFrontend().buildProjectFileForImports(arkFile);
        } else {
            new ArktsFrontend().buildProjectFileForImports(arkFile);
        }
    }
}
