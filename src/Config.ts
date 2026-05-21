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
import { FileUtils } from './utils/FileUtils';

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

function collectSdksFromOhosSdkHome(explicitHome?: string): Sdk[] {
    const sdkHome = explicitHome || process.env.OHOS_SDK_HOME;
    if (!sdkHome) {
        return [];
    }
    const candidates = [
        { name: 'etsSdk', path: path.join(sdkHome, 'openharmony', 'ets') },
        { name: 'hmsSdk', path: path.join(sdkHome, 'hms', 'ets') },
    ];
    const sdks: Sdk[] = [];
    for (const c of candidates) {
        if (fs.existsSync(c.path)) {
            sdks.push({ moduleName: '', name: c.name, path: c.path });
        }
    }
    return sdks;
}

/**
 * Build a SceneConfig from a project directory and optional OHOS SDK home.
 *
 * SDK resolution order:
 * 1) explicit `ohosSdkHome` (must contain at least one valid SDK directory:
 *    `<ohosSdkHome>/openharmony/ets` or `<ohosSdkHome>/hms/ets`)
 * 2) environment variable `OHOS_SDK_HOME`
 *
 * @param project Project root directory path.
 * @param ohosSdkHome Optional OHOS SDK home path.
 * @param options Optional SceneOptions.
 * @returns SceneConfig initialized with project files and discovered SDKs.
 */
export function buildSceneConfigFromProject(project: string, ohosSdkHome?: string, options?: SceneOptions): SceneConfig {
    const config = new SceneConfig(options);
    const sdks = collectSdksFromOhosSdkHome(ohosSdkHome);
    config.buildConfig(path.basename(project), project, sdks);
    return config;
}

/**
 * Per-language switch and optional file extension list (for tooling and front-end selection; extension lists are
 * normalized for discovery and future use).
 */
export interface LanguageOptions {
    enabled?: boolean;
    extensions?: string[];
}

export interface CppLanguageOptions extends LanguageOptions {
    sourceExtensions?: string[];
    headerExtensions?: string[];
    /** Max concurrent C++ AST worker processes; `-1` means auto (same semantics as `CppFrontend`). */
    maxParallelProcesses?: number;
    /** Max AST results in flight before back-pressure; `-1` or omission uses defaults aligned with `CppFrontend`. */
    maxPendingAstResults?: number;
    /** Log per-TU AST payload stats (bytes, node count, etc.) after successful decode. */
    logAstInfo?: boolean;
}

export interface SceneLanguagesOptions {
    arkts?: LanguageOptions;
    cpp?: CppLanguageOptions;
    [option: string]: LanguageOptions | undefined;
}

export type SceneOptionsValue =
    | string
    | number
    | boolean
    | (string | number)[]
    | string[]
    | SceneLanguagesOptions
    | null
    | undefined;

export interface SceneOptions {
    supportFileExts?: string[];
    ignoreFileNames?: string[];
    /** Whether to save source code text in ArkFile by default during IR construction. */
    saveSourceCodeByDefault?: boolean;
    enableLeadingComments?: boolean;
    enableTrailingComments?: boolean;
    enableJSDoc?: boolean;
    enableBuiltIn?: boolean;
    tsconfig?: string;
    isScanAbc?: boolean;
    sdkGlobalFolders?: string[];
    /** Optional multi-language front-end section; defaults are merged in {@link SceneConfig} construction. */
    languages?: SceneLanguagesOptions;
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
    private includeDirs: string[] = []; // Include directories that the C++ project depends on.
    private fileLanguages: Map<string, Language> = new Map();
    private ccjsonPath: string = '';
    private cppAstPath: string = '';

    private options: SceneOptions;

    constructor(options?: SceneOptions) {
        // Seed defaults before merging `config/arkanalyzer.json`. Same values remain if that file is missing or invalid.
        this.options = { supportFileExts: ['.ets', '.ts'] };
        this.loadDefaultConfig(options);
        this.normalizeLanguageOptions();
        this.mergeEnabledLanguageExtensionsIntoSupportFileExts();
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
     * @param includeDirs - Header file directories that the CXX project depends on.
     * @example
     * 1. build a sceneConfig object.
    ```typescript
    const projectDir = 'xxx/xxx/xxx';
    const sceneConfig: SceneConfig = new SceneConfig();
    sceneConfig.buildFromProjectDir(projectDir);
    ```
     */
    public buildFromProjectDir(targetProjectDirectory: string, includeDirs: string[] = []): void {
        this.targetProjectDirectory = targetProjectDirectory;
        // Callers should prefer passing de-duplicated includeDirs to avoid redundant work in hot paths.
        // Keep this defensive, order-preserving de-duplication as a fallback and reuse the target array.
        // Intentionally avoid Set allocation here.
        this.includeDirs.length = 0;
        for (const includeDir of includeDirs) {
            if (!this.includeDirs.includes(includeDir)) {
                this.includeDirs.push(includeDir);
            }
        }
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
        if (FileUtils.isDirectory(absoluteFilePath)) {
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
        if (FileUtils.isDirectory(absoluteFilePath)) {
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
            this.normalizeLanguageOptions();
            this.mergeEnabledLanguageExtensionsIntoSupportFileExts();

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

    /** Obtain the header file directories of the input C++ project dependencies. */
    public getIncludeDirs(): string[] {
        return this.includeDirs;
    }

    public setCcjsonPath(ccjsonPath: string): void {
        this.ccjsonPath = ccjsonPath;
    }

    /**
     * Returns compile_commands.json path configured by the project.
     *
     * If ccjson is not configured, this value is empty initially. Before AST generation,
     * astUtils may auto-discover a compile database near source files (for DevEco projects
     * that load compilation databases). The discovered path is used directly by Scene and is
     * not backfilled into this config field.
     */
    public getCcjsonPath(): string {
        return this.ccjsonPath;
    }

    public setCppAstPath(cppAstPath: string): void {
        this.cppAstPath = cppAstPath;
    }

    public getCppAstPath(): string {
        return this.cppAstPath;
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

    private normalizeLanguageOptions(): void {
        const from = this.options.languages;
        if (!from) {
            return;
        }
        const normalized: SceneLanguagesOptions = {};
        if (from.arkts) {
            normalized.arkts = {
                ...from.arkts,
                extensions: this.uniqueFileExtensions(from.arkts.extensions ?? []),
            };
        }
        if (from.cpp) {
            normalized.cpp = {
                ...from.cpp,
                extensions: this.uniqueFileExtensions(from.cpp.extensions ?? []),
                sourceExtensions: this.uniqueFileExtensions(from.cpp.sourceExtensions ?? []),
                headerExtensions: this.uniqueFileExtensions(from.cpp.headerExtensions ?? []),
            };
        }
        this.options.languages = normalized;
    }

    private mergeEnabledLanguageExtensionsIntoSupportFileExts(): void {
        const languages = this.options.languages;
        if (!languages) {
            return;
        }
        const merged = [...(this.options.supportFileExts ?? [])];
        if (languages.arkts?.enabled === true) {
            merged.push(...(languages.arkts.extensions ?? []));
        }
        if (languages.cpp?.enabled === true) {
            merged.push(...(languages.cpp.extensions ?? []));
            merged.push(...(languages.cpp.sourceExtensions ?? []));
            merged.push(...(languages.cpp.headerExtensions ?? []));
        }
        this.options.supportFileExts = this.uniqueFileExtensions(merged);
    }

    private uniqueFileExtensions(extensions: string[]): string[] {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const ext of extensions) {
            const normalized = ext.toLowerCase();
            if (!seen.has(normalized)) {
                seen.add(normalized);
                out.push(normalized);
            }
        }
        return out;
    }
}
