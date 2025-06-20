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
import Logger, { LOG_MODULE_TYPE } from './logger';
import { transfer2UnixPath } from './pathTransfer';
import { OH_PACKAGE_JSON5 } from '../core/common/EtsConst';
import { Language } from '../core/model/ArkFile';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'FileUtils');

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
            return fs.statSync(srcPath).isDirectory();
        } catch (e) {}
        return false;
    }

    public static isAbsolutePath(path: string): boolean {
        return /^(\/|\\|[A-Z]:\\)/.test(path);
    }

    public static generateModuleMap(ohPkgContentMap: Map<string, { [k: string]: unknown }>): Map<string, ModulePath> {
        const moduleMap: Map<string, ModulePath> = new Map();
        ohPkgContentMap.forEach((content, filePath) => {
            const moduleName = content.name as string;
            if (moduleName && moduleName.startsWith('@')) {
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
                    path.resolve(dir, 'oh_modules', name);
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
    if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) {
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
