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

import fs from 'fs';
import path from 'path';
import { ArkFile } from '../core/model/ArkFile';
import { OH_PACKAGE_JSON5 } from '../core/common/EtsConst';
import { fetchDependenciesFromFile } from '../utils/json5parser';
import { getAllFiles } from '../utils/getAllFiles';
import Logger, { LOG_MODULE_TYPE } from '../utils/logger';
import type { Scene } from '../Scene';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ModuleScene');

/**
 * Module-scoped view over a harmony project module (extracted from Scene.ts during the
 * build-machinery migration into frontend; Scene.ts re-exports it for compatibility).
 *
 * Holds the module's name/path, its oh-package.json5 content, and its files
 * (keyed by FileSigID). File building itself delegates to the project Scene's DFS
 * ({@link Scene.getDependencyFilesDeeply}); the module association of each file is
 * performed inside that DFS via addArkFile2ModuleScene — therefore a ModuleScene
 * instance must be registered in the Scene's moduleScenesMap *before* its files
 * are built.
 */
export class ModuleScene {
    private projectScene: Scene;
    private moduleName: string = '';
    private modulePath: string = '';
    private moduleFileMap: Map<number, ArkFile> = new Map();

    private moduleOhPkgFilePath: string = '';
    private ohPkgContent: { [k: string]: unknown } = {};

    constructor(projectScene: Scene) {
        this.projectScene = projectScene;
    }

    public getProjectScene(): Scene {
        return this.projectScene;
    }

    public ModuleSceneBuilder(moduleName: string, modulePath: string, supportFileExts: string[], recursively: boolean = false): void {
        this.moduleName = moduleName;
        this.modulePath = modulePath;

        this.getModuleOhPkgFilePath();

        if (this.moduleOhPkgFilePath) {
            this.ohPkgContent = fetchDependenciesFromFile(this.moduleOhPkgFilePath);
        } else {
            logger.warn('This module has no oh-package.json5!');
        }
        this.genArkFiles(supportFileExts);
    }

    public ModuleScenePartiallyBuilder(moduleName: string, modulePath: string): void {
        this.moduleName = moduleName;
        this.modulePath = modulePath;
        if (this.moduleOhPkgFilePath) {
            this.ohPkgContent = fetchDependenciesFromFile(this.moduleOhPkgFilePath);
        } else {
            logger.warn('This module has no oh-package.json5!');
        }
    }

    /**
     * get oh-package.json5
     */
    private getModuleOhPkgFilePath(): void {
        const moduleOhPkgFilePath = path.resolve(this.projectScene.getRealProjectDir(), path.join(this.modulePath, OH_PACKAGE_JSON5));
        if (fs.existsSync(moduleOhPkgFilePath)) {
            this.moduleOhPkgFilePath = moduleOhPkgFilePath;
        }
    }

    /**
     * get nodule name
     * @returns return module name
     */
    public getModuleName(): string {
        return this.moduleName;
    }

    public getModulePath(): string {
        return this.modulePath;
    }

    public getOhPkgFilePath(): string {
        return this.moduleOhPkgFilePath;
    }

    public getOhPkgContent(): { [p: string]: unknown } {
        return this.ohPkgContent;
    }

    public getModuleFilesMap(): Map<number, ArkFile> {
        return this.moduleFileMap;
    }

    public addArkFile(arkFile: ArkFile): void {
        this.moduleFileMap.set(arkFile.getFileSigID(), arkFile);
    }

    private genArkFiles(supportFileExts: string[]): void {
        const filePaths = getAllFiles(this.modulePath, supportFileExts, this.projectScene.getOptions().ignoreFileNames);
        // 统一走 projectScene 的构建期上下文（SceneBuilder DFS，反拓扑 ID 编号的
        // 唯一排序执行方法）；本模块文件的归属由 DFS 内 addArkFile2ModuleScene 依据
        // moduleScenesMap 完成，因此本 ModuleScene 实例必须已注册（见
        // buildScene4HarmonyProject / buildModuleScene）。
        const builder = this.projectScene.getActiveSceneBuilder();
        if (!builder) {
            logger.warn(`ModuleScene ${this.moduleName}: no active SceneBuilder (call buildBasicInfo first); skip ${filePaths.length} files`);
            return;
        }
        for (const filePath of filePaths) {
            builder.getDependencyFilesDeeply(filePath);
        }
    }
}
