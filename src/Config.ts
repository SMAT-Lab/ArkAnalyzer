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
    enableBuiltIn?: boolean;
    tsconfig?: string;
    isScanAbc?: boolean;
    sdkGlobalFolders?: string[];
    [option: string]: SceneOptionsValue;
}
const CONFIG_FILENAME = 'arkanalyzer.json';
const DEFAULT_CONFIG_FILE = path.join(__dirname, '../config', CONFIG_FILENAME);

// Extract set variable definition: set (VAR value)
function extractSetVar(line: string): [string, string] | null {
    const m = line.match(/^\s*set\s*\(\s*([A-Za-z_0-9]+)\s+(.+?)\s*\)$/);
    if (m) {
        const [, varName, value] = m;
        return [varName, value];
    }
    return null;
}

// Recursive parsing of variables, only supports set variables in this file
function resolveCMakeVar(val: string, varTable: Record<string, string>, depth = 0): string {
    if (depth > 10) {
        return val;
    }
    return val.replace(/\$\{([A-Za-z_0-9]+)\}/g, (m, varName) => {
        if (varTable[varName] !== undefined) {
            return resolveCMakeVar(varTable[varName], varTable, depth + 1);
        }
        // Unable to parse, returns as is (reserved for subsequent filtering)
        return m;
    });
}

/**
 *Determine whether the current row is the starting point of incle_rectifiers or target_include-directies,
 *If so, enter the collection state and process the scene where a single line is immediately closed.
 *Return the new collecting status, funcType, and buffer (supporting multiple line parameters).
 */
function tryStartCollectingIncludeDirs(
    line: string,
    results: string[][]
): {
    collecting: boolean;
    funcType: 'include' | 'target' | null;
    buffer: string[];
} {
    if (line.startsWith('include_directories(')) {
        let collecting = true;
        let funcType: 'include' | 'target' | null = 'include';
        let buffer = [line];
        if (line.includes(')')) {
            collecting = false;
            results.push(parseCMakeArgs(buffer, false));
            buffer = [];
            funcType = null;
        }
        return { collecting, funcType, buffer };
    } else if (line.startsWith('target_include_directories(')) {
        let collecting = true;
        let funcType: 'include' | 'target' | null = 'target';
        let buffer = [line];
        if (line.includes(')')) {
            collecting = false;
            results.push(parseCMakeArgs(buffer, true));
            buffer = [];
            funcType = null;
        }
        return { collecting, funcType, buffer };
    } else {
        // Not in collection mode
        return { collecting: false, funcType: null, buffer: [] };
    }
}

function extractAllIncludeDirs(lines: string[]): string[][] {
    const results: string[][] = [];
    let collecting = false;
    let buffer: string[] = [];
    let funcType: 'include' | 'target' | null = null;

    for (const lineOrig of lines) {
        // Remove comments
        const line = lineOrig.replace(/#.*$/, '').trim();
        if (!collecting) {
            const state = tryStartCollectingIncludeDirs(line, results);
            collecting = state.collecting;
            funcType = state.funcType;
            buffer = state.buffer;
        } else {
            buffer.push(line);
            if (line.includes(')')) {
                collecting = false;
                results.push(parseCMakeArgs(buffer, funcType === 'target'));
                buffer = [];
                funcType = null;
            }
        }
    }
    return results;
}

// ----------- Parameter segmentation and target parameter skipping-----------
function parseCMakeArgs(buffer: string[], isTarget: boolean): string[] {
    // Form a line and remove unnecessary line breaks and whitespace
    let line = buffer.join(' ').replace(/\s+/g, ' ');
    // Remove leading command
    const lidx = line.indexOf('(');
    const ridx = line.lastIndexOf(')');
    if (lidx === -1 || ridx === -1) {
        return [];
    }
    line = line.substring(lidx + 1, ridx).trim();
    // Split parameters by quotes and spaces
    const args: string[] = [];
    let curr = '';
    let inQuote = false;
    for (let i = 0; i < line.length; ++i) {
        const c = line[i];
        // uniformly handle quotes
        if (c === '"') {
            if (inQuote) {
                inQuote = false;
                args.push(curr);
                curr = '';
            } else {
                inQuote = true;
            }
            continue;
        }
        // In quotes: literal append
        if (inQuote) {
            curr += c;
            continue;
        }
        // Not in quotes: space separated, otherwise literal append
        if (/\s/.test(c)) {
            if (curr.length > 0) {
                args.push(curr);
                curr = '';
            }
            continue;
        }
        curr += c;
    }
    if (curr.length > 0) {
        args.push(curr);
    }
    if (isTarget) {
        // Skip target name and PUBLIC/PRIVATE/INTERFACE keywords
        const idx = args.findIndex(a => ['PUBLIC', 'PRIVATE', 'INTERFACE'].includes(a.toUpperCase()));
        if (args.length < 3 || (idx < 1 || idx + 1 >= args.length)) {
            return [];
        }
        return args.slice(idx + 1);
    } else {
        return args;
    }
}

function scanCMakeIncludeDirsOnly(dir: string): string[] {
    const result: string[] = [];

    const cmakePath = path.join(dir, 'CMakeLists.txt');
    if (!fs.existsSync(cmakePath)) {
        // Return early, only recursively process subdirectories
        const subdirs = fs
            .readdirSync(dir, { withFileTypes: true })
            .filter(f => f.isDirectory())
            .map(f => path.join(dir, f.name));

        return subdirs.flatMap(subdir => scanCMakeIncludeDirsOnly(subdir));
    }

    // Normal processing flow with CMakeLists.txt
    const varTable: Record<string, string> = {
        CMAKE_CURRENT_SOURCE_DIR: dir.replace(/\\/g, '/'),
        PROJECT_SOURCE_DIR: dir.replace(/\\/g, '/'),
    };

    const lines = fs.readFileSync(cmakePath, 'utf-8').split(/\r?\n/);

    for (const line of lines) {
        const s = extractSetVar(line);
        if (s) {
            const [name, val] = s;
            varTable[name] = resolveCMakeVar(val, varTable);
        }
    }

    const allIncludeArgArrs = extractAllIncludeDirs(lines);
    for (const argArr of allIncludeArgArrs) {
        for (let raw of argArr) {
            let resolved = resolveCMakeVar(raw, varTable);
            if (/\$\{[A-Za-z_0-9]+\}/.test(resolved)) {
                continue;
            }
            if (!path.isAbsolute(resolved)) {
                resolved = path.resolve(dir, resolved);
            }
            result.push(resolved);
        }
    }

    // 仍然递归子目录
    const subdirs = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter(f => f.isDirectory())
        .map(f => path.join(dir, f.name));

    for (const subdir of subdirs) {
        result.push(...scanCMakeIncludeDirsOnly(subdir));
    }

    return result;
}

export class SceneConfig {
    private targetProjectName: string = '';
    private targetProjectDirectory: string = '';

    private etsSdkPath: string = '';
    private sdksObj: Sdk[] = [];

    private sdkFiles: string[] = [];
    private sdkFilesMap: Map<string[], string> = new Map<string[], string>();

    private projectFiles: string[] = [];
    private includeDirs: string[] = [];
    private fileLanguages: Map<string, Language> = new Map();

    private options: SceneOptions;

    constructor(options?: SceneOptions) {
        this.options = { supportFileExts: ['.ets', '.cpp', '.c', '.h', '.hpp', '.ts'] };
        this.loadDefaultConfig(options);
    }

    public getOptions(): SceneOptions {
        return this.options;
    }

    public setOptions(options: string[]): void {
        this.options = { supportFileExts: options };
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
    public buildFromProjectDir(targetProjectDirectory: string, includeDirs: string[] = []): void {
        this.targetProjectDirectory = targetProjectDirectory;
        const resolvedDir = path.resolve(targetProjectDirectory);
        const cmakeIncludeDirs = scanCMakeIncludeDirsOnly(resolvedDir);
        // Add project root path to includeDirs
        cmakeIncludeDirs.push(resolvedDir);
        this.includeDirs = Array.from(new Set([...cmakeIncludeDirs, ...includeDirs]));
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

    public getIncludeDirs(): string[] {
        return this.includeDirs;
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
