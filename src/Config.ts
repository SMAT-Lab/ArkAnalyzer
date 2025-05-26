/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
import Logger, { LOG_MODULE_TYPE } from './utils/logger';
import { getAllFiles } from './utils/getAllFiles';
import { Language } from './core/model/ArkFile';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'Config');

export interface Sdk {
    name: string;
    path: string;
    moduleName: string;
}

export interface TsConfig {
    extends?: string;
    compilerOptions?: {
        baseUrl?: string;
        paths?: {
            [key: string]: string[];
        };
    };
}

export type SceneOptionsValue = string | number | boolean | (string | number)[] | string[] | null | undefined;
export interface SceneOptions {
    supportFileExts?: string[];
    ignoreFileNames?: string[];
    enableLeadingComments?: boolean;
    enableTrailingComments?: boolean;
    tsconfig?: string;
    isScanAbc?: boolean;
    sdkGlobalFolders?: string[];
    [option: string]: SceneOptionsValue;
}
const CONFIG_FILENAME = 'arkanalyzer.json';
const DEFAULT_CONFIG_FILE = path.join(__dirname, '../config', CONFIG_FILENAME);

export class SceneConfig {
    private targetProjectName: string = '';
    private targetProjectDirectory: string = '';

    private etsSdkPath: string = '';
    private sdksObj: Sdk[] = [];

    private sdkFiles: string[] = [];
    private sdkFilesMap: Map<string[], string> = new Map<string[], string>();

    private projectFiles: string[] = [];
    private fileLanguages: Map<string, Language> = new Map();

    private options: SceneOptions;

    constructor(options?: SceneOptions) {
        this.options = { supportFileExts: ['.ets', '.ts'] };
        this.loadDefaultConfig(options);
    }

    public getOptions(): SceneOptions {
        return this.options;
    }

    /**
     * Set the scene's config,
     * such as  the target project's name, the used sdks and the full path.
     * @param targetProjectName - the target project's name.
     * @param targetProjectDirectory - the target project's directory.
     * @param sdks - sdks used in this scene.
     * @param fullFilePath - the full file path.
     */
    public buildConfig(targetProjectName: string, targetProjectDirectory: string, sdks: Sdk[], fullFilePath?: string[]): void {
        this.targetProjectName = targetProjectName;
        this.targetProjectDirectory = targetProjectDirectory;
        this.projectFiles = getAllFiles(targetProjectDirectory, this.options.supportFileExts!, this.options.ignoreFileNames);
        this.sdksObj = sdks;
        if (fullFilePath) {
            this.projectFiles.push(...fullFilePath);
        }
    }

    /**
     * Create a sceneConfig object for a specified project path and set the target project directory to the
     * targetProjectDirectory property of the sceneConfig object.
     * @param targetProjectDirectory - the target project directory, such as xxx/xxx/xxx, started from project
     *     directory.
     * @example
     * 1. build a sceneConfig object.
    ```typescript
    const projectDir = 'xxx/xxx/xxx';
    const sceneConfig: SceneConfig = new SceneConfig();
    sceneConfig.buildFromProjectDir(projectDir);
    ```
     */
    public buildFromProjectDir(targetProjectDirectory: string): void {
        this.targetProjectDirectory = targetProjectDirectory;
        this.targetProjectName = path.basename(targetProjectDirectory);
        this.projectFiles = getAllFiles(targetProjectDirectory, this.options.supportFileExts!, this.options.ignoreFileNames);
    }

    public buildFromProjectFiles(
        projectName: string,
        projectDir: string,
        filesAndDirectorys: string[],
        sdks?: Sdk[],
        languageTags?: Map<string, Language>
    ): void {
        if (sdks) {
            this.sdksObj = sdks;
        }
        this.targetProjectDirectory = projectDir;
        this.targetProjectName = projectName;
        if (filesAndDirectorys.length === 0) {
            logger.error('no files for build scene!');
            return;
        }
        filesAndDirectorys.forEach(fileOrDirectory => this.processFilePaths(fileOrDirectory, projectDir));
        languageTags?.forEach((languageTag, fileOrDirectory) => {
            this.setLanguageTagForFiles(fileOrDirectory, projectDir, languageTag);
        });
    }

    private processFilePaths(fileOrDirectory: string, projectDir: string): void {
        let absoluteFilePath = '';
        if (path.isAbsolute(fileOrDirectory)) {
            absoluteFilePath = fileOrDirectory;
        } else {
            absoluteFilePath = path.join(projectDir, fileOrDirectory);
        }
        if (fs.statSync(absoluteFilePath).isDirectory()) {
            getAllFiles(absoluteFilePath, this.getOptions().supportFileExts!, this.options.ignoreFileNames).forEach(filePath => {
                if (!this.projectFiles.includes(filePath)) {
                    this.projectFiles.push(filePath);
                }
            });
        } else {
            this.projectFiles.push(absoluteFilePath);
        }
    }

    private setLanguageTagForFiles(fileOrDirectory: string, projectDir: string, languageTag: Language): void {
        let absoluteFilePath = '';
        if (path.isAbsolute(fileOrDirectory)) {
            absoluteFilePath = fileOrDirectory;
        } else {
            absoluteFilePath = path.join(projectDir, fileOrDirectory);
        }
        if (fs.statSync(absoluteFilePath).isDirectory()) {
            getAllFiles(absoluteFilePath, this.getOptions().supportFileExts!, this.options.ignoreFileNames).forEach(filePath => {
                this.fileLanguages.set(filePath, languageTag);
            });
        } else {
            this.fileLanguages.set(absoluteFilePath, languageTag);
        }
    }

    public buildFromJson(configJsonPath: string): void {
        if (fs.existsSync(configJsonPath)) {
            let configurationsText: string;
            try {
                configurationsText = fs.readFileSync(configJsonPath, 'utf-8');
            } catch (error) {
                logger.error(`Error reading file: ${error}`);
                return;
            }

            logger.info(configurationsText);
            let configurations: any;
            try {
                configurations = JSON.parse(configurationsText);
            } catch (error) {
                logger.error(`Error parsing JSON: ${error}`);
                return;
            }

            const targetProjectName: string = configurations.targetProjectName ? configurations.targetProjectName : '';
            const targetProjectDirectory: string = configurations.targetProjectDirectory ? configurations.targetProjectDirectory : '';
            const sdks: Sdk[] = configurations.sdks ? configurations.sdks : [];

            if (configurations.options) {
                this.options = { ...this.options, ...configurations.options };
            }

            this.buildConfig(targetProjectName, targetProjectDirectory, sdks);
        } else {
            logger.error(`Your configJsonPath: "${configJsonPath}" is not exist.`);
        }
    }

    public getTargetProjectName(): string {
        return this.targetProjectName;
    }

    public getTargetProjectDirectory(): string {
        return this.targetProjectDirectory;
    }

    public getProjectFiles(): string[] {
        return this.projectFiles;
    }

    public getFileLanguages(): Map<string, Language> {
        return this.fileLanguages;
    }

    public getSdkFiles(): string[] {
        return this.sdkFiles;
    }

    public getSdkFilesMap(): Map<string[], string> {
        return this.sdkFilesMap;
    }

    public getEtsSdkPath(): string {
        return this.etsSdkPath;
    }

    public getSdksObj(): Sdk[] {
        return this.sdksObj;
    }

    private getDefaultConfigPath(): string {
        try {
            const moduleRoot = path.dirname(path.dirname(require.resolve('arkanalyzer')));
            return path.join(moduleRoot, 'config', CONFIG_FILENAME);
        } catch (e) {
            logger.info(`Failed to resolve default config file from dependency path with error: ${e}`);
            let configFile = DEFAULT_CONFIG_FILE;
            if (!fs.existsSync(configFile)) {
                logger.debug(`default config file '${DEFAULT_CONFIG_FILE}' not found.`);
                configFile = path.join(__dirname, 'config', CONFIG_FILENAME);
                logger.debug(`use new config file '${configFile}'.`);
            } else {
                logger.debug(`default config file '${DEFAULT_CONFIG_FILE}' found, use it.`);
            }
            return configFile;
        }
    }

    private loadDefaultConfig(options?: SceneOptions): void {
        const configFile = this.getDefaultConfigPath();
        logger.debug(`try to parse config file ${configFile}`);
        try {
            this.options = { ...this.options, ...JSON.parse(fs.readFileSync(configFile, 'utf-8')) };
        } catch (error) {
            logger.error(`Failed to parse config file with error: ${error}`);
        }
        if (options) {
            this.options = { ...this.options, ...options };
        }
    }
}
