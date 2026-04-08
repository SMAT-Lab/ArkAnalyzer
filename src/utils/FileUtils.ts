/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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
import Logger, { LOG_MODULE_TYPE } from './logger';
import { transfer2UnixPath } from './pathTransfer';
import { OH_PACKAGE_JSON5, SCOPE_PREFIX } from '../core/common/EtsConst';
import { Language } from '../core/model/ArkFile';
import { getCxxSourceFileExtensionSet } from '../cpp_frontend/ast/const';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'FileUtils');

const CXX_EXTENSION_SET = getCxxSourceFileExtensionSet();

export class FileUtils {
    public static readonly FILE_FILTER = {
        ignores: ['.git', '.preview', '.hvigor', '.idea', 'test', 'ohosTest'],
        include: /(?<!\.d)\.(ets|ts|json5)$/,
    };

    private static readonly FILE_EXT = new Map<string, number>([['.ets', 0], ['.ts', 1], ['.d.ets', 2], ['.d.ts', 3], ['.js', 4]]);
    private static REAL_PATH = new Map<string, string>();

    public static dispose(): void {
        this.REAL_PATH.clear();
    }

    public static getIndexFileName(srcPath: string): string {
        for (const fileInDir of fs.readdirSync(srcPath, { withFileTypes: true })) {
            if (fileInDir.isFile() && /^index(\.d)?\.e?ts$/i.test(fileInDir.name)) {
                return fileInDir.name;
            }
        }
        return '';
    }

    public static isDirectory(srcPath: string): boolean {
        try {
            const stats = fs.statSync(srcPath, { throwIfNoEntry: false });
            return stats ? stats.isDirectory() : false;
        } catch (e) {
            logger.warn(srcPath + ' not found.');
        }
        return false;
    }

    public static isAbsolutePath(path: string): boolean {
        return /^(\/|\\|[A-Z]:\\)/.test(path);
    }

    /**
     * Get the real file path for a given source path, resolving file extensions and checking existence.
     * Results are cached for performance.
     * @param srcPath - The source path to resolve.
     * @returns The resolved real file path, or empty string if not found.
     */
    public static getFileRealPath(srcPath: string): string {
        let result = this.REAL_PATH.get(srcPath);
        if (result !== undefined) {
            return result;
        }
        if (srcPath.endsWith(OH_PACKAGE_JSON5)) {
            result = fs.realpathSync(srcPath);
            this.REAL_PATH.set(srcPath, result);
            return result;
        }
        try {
            const stats = fs.statSync(srcPath, { throwIfNoEntry: false });
            const dir = stats?.isDirectory() ? srcPath : path.dirname(srcPath);
            const baseName = stats?.isDirectory() ? 'index' : path.basename(srcPath);
            const files = fs.readdirSync(dir, { withFileTypes: true });
            let bestOrder = Number.POSITIVE_INFINITY;
            let bestName = '';
            const length = baseName.length;
            for (const file of files) {
                const name = file.name;
                const regex = new RegExp(`^${baseName}`, 'i');
                if (!regex.test(name)) {
                    continue;
                }
                const suffix = name.slice(length);
                if (suffix.length === 0) {
                    bestName = name;
                    break;
                }
                const order = this.FILE_EXT.get(suffix);
                if (order === undefined) {
                    continue;
                }
                if (order < bestOrder) {
                    bestOrder = order;
                    bestName = name;
                }
                if (order <= 1) {
                    break;
                }
            }
            if (bestName) {
                result = fs.realpathSync(path.join(dir, bestName));
            }
        } catch (e) {
            logger.warn(srcPath + ' not found.');
        }
        result = result ?? '';
        this.REAL_PATH.set(srcPath, result);
        return result;
    }

    /**
     * Generate a module map from oh-package.json5 content.
     * @param ohPkgContentMap - A map of oh-package.json5 file paths to their parsed content.
     * @returns A map of module names to their module paths.
     */
    public static generateModuleMap(ohPkgContentMap: Map<string, { [k: string]: unknown }>): Map<string, ModulePath> {
        const moduleMap: Map<string, ModulePath> = new Map();
        ohPkgContentMap.forEach((content, filePath) => {
            const moduleName = content.name as string;
            if (moduleName && moduleName.startsWith(SCOPE_PREFIX)) {
                const modulePath = path.dirname(filePath);
                moduleMap.set(moduleName, new ModulePath(modulePath, content.main ? path.resolve(modulePath, content.main as string) : ''));
            }
        });
        ohPkgContentMap.forEach((content, filePath) => {
            if (!content.dependencies) {
                return;
            }
            Object.entries(content.dependencies).forEach(([name, value]) => {
                if (moduleMap.get(name)) {
                    return;
                }
                const dir = path.dirname(filePath);
                let modulePath = path.resolve(dir, value.replace('file:', ''));
                let main = '';
                if (this.isDirectory(modulePath)) {
                    const target = ohPkgContentMap.get(path.resolve(modulePath, OH_PACKAGE_JSON5));
                    if (target?.main) {
                        main = path.resolve(modulePath, target.main as string);
                    }
                } else {
                    modulePath = path.resolve(dir, 'oh_modules', name);
                }
                moduleMap.set(name, new ModulePath(modulePath, main));
            });
        });
        return moduleMap;
    }

    public static getFileLanguage(file: string, fileTags?: Map<string, Language>): Language {
        if (fileTags && fileTags.has(file)) {
            return fileTags.get(file) as Language;
        }
        const extension = path.extname(file).toLowerCase();
        switch (extension) {
            case '.ts':
                return Language.TYPESCRIPT;
            case '.ets':
                return Language.ARKTS1_1;
            case '.js':
                return Language.JAVASCRIPT;
            default:
                if (CXX_EXTENSION_SET.has(extension)) {
                    return Language.CXX;
                }
                return Language.UNKNOWN;
        }
    }
}

export class ModulePath {
    path: string;
    main: string;

    constructor(path: string, main: string) {
        this.path = transfer2UnixPath(path);
        this.main = main ? transfer2UnixPath(main) : main;
    }
}

export function getFileRecursively(srcDir: string, fileName: string, visited: Set<string> = new Set<string>()): string {
    let res = '';
    if (!FileUtils.isDirectory(srcDir)) {
        logger.warn(`Input directory ${srcDir} is not exist`);
        return res;
    }

    const filesUnderThisDir = fs.readdirSync(srcDir, { withFileTypes: true });
    const realSrc = fs.realpathSync(srcDir);
    if (visited.has(realSrc)) {
        return res;
    }
    visited.add(realSrc);

    filesUnderThisDir.forEach(file => {
        if (res !== '') {
            return res;
        }
        if (file.name === fileName) {
            res = path.resolve(srcDir, file.name);
            return res;
        }
        const tmpDir = path.resolve(srcDir, '../');
        res = getFileRecursively(tmpDir, fileName, visited);
        return res;
    });
    return res;
}

/**
 * Try to combine each source path in the array with the relative path, returning the first absolute path that exists.
 * @param srcPathList Source path array (absolute or relative paths)
 * @param relativePath The relative path to concatenate
 * @returns The first concatenated absolute path that exists; otherwise returns an empty string
 */
export function getFileAbsPath(srcPathList: string[], relativePath: string): string {
    if (!srcPathList || srcPathList.length === 0 || !relativePath) {
        return '';
    }

    for (const srcPath of srcPathList) {
        const srcDir = path.dirname(path.resolve(srcPath));
        const absPath = path.resolve(srcDir, relativePath);
        if (fs.existsSync(absPath)) {
            return absPath;
        }
    }

    return '';
}
