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

import { SceneOptions } from '../Config';
import { Language } from '../core/model/ArkFile';
import { ModuleScene, Scene } from '../Scene';
import Logger, { LOG_MODULE_TYPE } from '../utils/logger';
import { ArktsFrontend } from './arktsFrontend/ArktsFrontend';
import { CppFrontend } from './cppFrontend/CppFrontend';
import { FrontendParseResult, LanguageFrontend } from './LanguageFrontend';
import { ArkFile } from '../core/model/ArkFile';

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
    public static run(scene: Scene): void {
        const config = this.loadFrontendConfig(scene);
        const frontends = this.createEnabledFrontends(config);
        for (const frontend of frontends) {
            const result = frontend.parse(scene, config);
            this.mergeResult(scene, result, frontend.id);
        }
    }

    public static runDependencyBuild(scene: Scene): void {
        const config = this.loadFrontendConfig(scene);
        const frontends = this.createEnabledFrontends(config);
        frontends.forEach(frontend => frontend.runDependencyBuild?.(scene, config));
    }

    public static runModuleScene(moduleScene: ModuleScene, supportFileExts: string[]): void {
        const scene = moduleScene.getProjectScene();
        const config = this.loadFrontendConfig(scene);
        const frontends = this.createEnabledFrontends(config);
        const modulePath = moduleScene.getModulePath();

        for (const frontend of frontends) {
            if (!frontend.parseModuleFiles) {
                continue;
            }
            const result = frontend.parseModuleFiles(scene, modulePath, supportFileExts);
            this.mergeModuleSceneResult(moduleScene, scene, result, frontend.id);
        }
    }

    public static runSingleFile(scene: Scene, filePath: string): FrontendParseResult {
        const config = this.loadFrontendConfig(scene);
        const frontends = this.createEnabledFrontends(config);
        const merged: FrontendParseResult = { arkFiles: [], failedFiles: [] };
        for (const frontend of frontends) {
            if (!frontend.parseSingleFile) {
                continue;
            }
            const result = frontend.parseSingleFile(scene, filePath, config);
            merged.arkFiles.push(...result.arkFiles);
            merged.failedFiles.push(...result.failedFiles);
        }
        return merged;
    }

    public static runSdkFile(scene: Scene, filePath: string, sdkPath: string, sdkName: string): FrontendParseResult {
        const config = this.loadFrontendConfig(scene);
        const frontends = this.createEnabledFrontends(config);
        const merged: FrontendParseResult = { arkFiles: [], failedFiles: [] };
        for (const frontend of frontends) {
            if (!frontend.parseSdkFile) {
                continue;
            }
            const result = frontend.parseSdkFile(scene, filePath, sdkPath, sdkName, config);
            merged.arkFiles.push(...result.arkFiles);
            merged.failedFiles.push(...result.failedFiles);
        }
        return merged;
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

    private static createEnabledFrontends(config: SceneOptions): LanguageFrontend[] {
        const out: LanguageFrontend[] = [];
        if (this.isArktsEnabled(config)) {
            out.push(new ArktsFrontend());
        }
        if (this.isCppEnabled(config)) {
            out.push(new CppFrontend());
        }
        return out;
    }

    private static isArktsEnabled(config: SceneOptions): boolean {
        return config.languages?.arkts?.enabled !== false;
    }

    private static isCppEnabled(config: SceneOptions): boolean {
        return config.languages?.cpp?.enabled !== false;
    }

    private static loadFrontendConfig(scene: Scene): SceneOptions {
        return scene.getOptions();
    }

    private static mergeResult(scene: Scene, result: FrontendParseResult, frontendId: string): void {
        result.arkFiles.forEach(file => scene.setFile(file));
        result.failedFiles.forEach(failed => {
            scene.addUnhandledFilePath(failed.filePath);
            logger.error(`[${frontendId}] Error parsing file:`, failed.filePath, failed.reason);
        });
    }

    private static mergeModuleSceneResult(moduleScene: ModuleScene, scene: Scene, result: FrontendParseResult, frontendId: string): void {
        result.arkFiles.forEach(file => {
            file.setModuleScene(moduleScene);
            moduleScene.addArkFile(file);
            scene.setFile(file);
        });
        result.failedFiles.forEach(failed => {
            scene.addUnhandledFilePath(failed.filePath);
            logger.error(`[${frontendId}] Error parsing file:`, failed.filePath, failed.reason);
        });
    }
}
