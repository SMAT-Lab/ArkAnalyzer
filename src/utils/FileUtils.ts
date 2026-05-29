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
import { Language } from '../core/model/ArkFile';
import { getCxxSourceFileExtensionSet } from '../frontend/cppFrontend/utils/cppUtils';
import { CryptoUtils } from './crypto_utils';
import { transfer2UnixPath } from './pathTransfer';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'FileUtils');

const CXX_EXTENSION_SET = getCxxSourceFileExtensionSet();

export class FileUtils {
    public static readonly FILE_FILTER = {
        ignores: ['.git', '.preview', '.hvigor', '.idea', 'test', 'ohosTest'],
        include: /(?<!\.d)\.(ets|ts|json5)$/,
    };

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

export function getFileSignatureMapKey(projectName: string, fileName: string): string {
    const normalizedFileName = transfer2UnixPath(fileName);
    const hashcode = CryptoUtils.hashcode(`@${projectName}/${normalizedFileName}: `);
    return `${hashcode}${path.basename(normalizedFileName)}`;
}
