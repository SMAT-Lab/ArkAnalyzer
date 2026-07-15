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

import path from 'path';
import { fetchDependenciesFromFile } from './json5parser';
import { MODULE_PREFIX, OH_MODULES, OH_PACKAGE_JSON5, OHPM } from '../core/common/EtsConst';
import { FileUtils } from './FileUtils';
import { transfer2UnixPath } from './pathTransfer';
import fs from 'fs';
import Logger, { LOG_MODULE_TYPE } from './logger';
import { clearLRUCache, LRUCache } from './LRUCacheDecorator';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ModuleUtils');
const jsExt = '.js';

export class ModulePath {
    path: string;
    main: string;

    /**
     * Create a new ModulePath instance.
     * @param path - The module path.
     * @param main - The main entry file path of the module.
     */
    constructor(path: string, main: string) {
        this.path = transfer2UnixPath(path);
        this.main = transfer2UnixPath(main);
    }
}


export class ModuleUtils {
    private static readonly FILE_EXT = new Map<string, number>([['.ets', 0], ['.ts', 1], ['.d.ets', 2], ['.d.ts', 3], ['.js', 4]]);
    private static readonly OH_PACKAGE_DEPENDENCY_KEYS = ['dependencies', 'devDependencies', 'dynamicDependencies'];
    public static MODULES: Map<string, ModulePath> = new Map();

    /*
     * Set static field to be null, then all related objects could be freed by GC.
     * Class SdkUtils is only internally used by ArkAnalyzer type inference, the dispose method should be called at the end of type inference.
     */
    public static dispose(): void {
        clearLRUCache(ModuleUtils, 'getFileRealPath');
        this.MODULES.clear();
    }

    /**
     * Get the real file path for a given source path, resolving file extensions and checking existence.
     * Results are cached via LRU for performance.
     * @param srcPath - The source path to resolve, e.g.: /projectA/src/foo
     * @returns The resolved real file path, or empty string if not found.
     */
    @LRUCache()
    public static getFileRealPath(srcPath: string): string {
        if (srcPath.endsWith(OH_PACKAGE_JSON5)) {
            return fs.realpathSync(srcPath);
        }
        let result = '';
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
        return result;
    }

    /**
     * Generate a module map from oh-package.json5 content.
     * @param ohPkgContentMap - A map of oh-package.json5 file paths to their parsed content.
     * @returns A map of module names to their module paths.
     */
    public static generateModuleMap(ohPkgContentMap: Map<string, { [k: string]: unknown }>): Map<string, ModulePath> {
        if (ohPkgContentMap.size > 0 && this.MODULES.size === 0) {
            const pkgs = Array.from(ohPkgContentMap);
            const projectPkg = pkgs[0];
            const projectDir = path.dirname(projectPkg[0]);
            pkgs.reverse().forEach((entry) => {
                const filePath = entry[0];
                const content = entry[1];
                const moduleName = content.name as string ?? '';
                this.addDependModule(filePath, content, this.MODULES, moduleName, false, projectDir);
            });

            //process project oh-package.json5 override
            this.processDependency(projectPkg[1].overrides, projectDir, this.MODULES, true, projectDir);
            const overrideDependencyMap = projectPkg[1].overrideDependencyMap;
            if (overrideDependencyMap) {
                Object.entries(overrideDependencyMap).forEach(([name, value]) => {
                    const dFile = path.isAbsolute(value) ? value : path.resolve(projectDir, value);
                    const dFileContent = fetchDependenciesFromFile(dFile);
                    this.addDependModule(dFile, dFileContent, this.MODULES, name, true, projectDir);
                });
            }

        }
        return this.MODULES;
    }

    private static addDependModule(ohPkgFile: string, content: { [k: string]: unknown },
                                   ret: Map<string, ModulePath>, moduleName: string, override: boolean, projectDir: string): void {
        // skip duplicate module
        if (!override && ret.has(moduleName)) {
            return;
        }
        if (Object.keys(content).length === 0) {
            return;
        }
        const ohPkgFileRealPath = this.getFileRealPath(ohPkgFile);
        if (!ohPkgFileRealPath) {
            return;
        }
        const modulePath = path.dirname(ohPkgFileRealPath);
        if (moduleName) {
            let entry = content.types as string || content.main as string;
            if (!entry) {
                entry = '';
            } else if (entry.endsWith(jsExt)) {
                entry = entry.substring(0, entry.length - jsExt.length);
            }
            const main = this.getFileRealPath(path.resolve(modulePath, entry));
            ret.set(moduleName, new ModulePath(modulePath, main));
        }
        // process dependency items when not override
        if (!override) {
            this.OH_PACKAGE_DEPENDENCY_KEYS.forEach((dependencyKey) => this.processDependency(content[dependencyKey], modulePath, ret, override, projectDir));
        }
    }

    private static processDependency(dependencies: unknown, modulePath: string,
                                     ret: Map<string, ModulePath>, override: boolean, projectDir: string): void {
        if (!dependencies) {
            return;
        }
        Object.entries(dependencies).forEach(([name, value]) => {
            if (!override && ret.get(name)) {
                return;
            }
            if (this.handleModuleRefDependency(name, value, ret)) {
                return;
            }
            // order： 1. local module 2. current module oh_modules 3. project oh_modules 4. project oh_modules .ohpm
            const candidates = [
                path.resolve(modulePath, value.replace('file:', '')),
                path.resolve(value.endsWith('.har') && modulePath.includes(OHPM) ? modulePath.substring(0, modulePath.lastIndexOf(OH_MODULES)) : modulePath, OH_MODULES, name),
                path.resolve(projectDir, OH_MODULES, name),
                this.findModulePathInOHPM(projectDir, name, value),
            ];
            const dPath = candidates.find((candidate) => FileUtils.isDirectory(candidate));
            if (!dPath) {
                logger.warn(`Cannot find module: ${name} dependency in ${modulePath} ${OH_PACKAGE_JSON5}`);
                return;
            }
            const dFile = path.resolve(dPath, OH_PACKAGE_JSON5);
            const dFileContent = fetchDependenciesFromFile(dFile);
            this.addDependModule(dFile, dFileContent, ret, name, override, projectDir);
        });
    }

    /**
     * Handle "foo_test": "@module:Foo" dependency.
     */
    private static handleModuleRefDependency(name: string, value: string, ret: Map<string, ModulePath>): boolean {
        if (!value.startsWith(MODULE_PREFIX)) {
            return false;
        }
        const moduleRef = ret.get(value.slice(MODULE_PREFIX.length));
        if (moduleRef) {
            ret.set(name, moduleRef);
            return true;
        }
        logger.warn(`Cannot find module: ${name}`);
        return false;
    }

    private static findModulePathInOHPM(projectDir: string, moduleName: string, value: string): string {
        const OHPMPath = path.resolve(projectDir, OH_MODULES, OHPM);
        const prefix = `${moduleName.replace('/', '+')}@`;
        // fix version
        if (/^\d+(?:\.\d+){2}(?:-[0-9A-Za-z-]+)?$/.test(value)) {
            return path.resolve(OHPMPath, prefix + value, OH_MODULES, moduleName);
        }
        // try to find the best version
        try {
            const dirs = fs.readdirSync(OHPMPath, { withFileTypes: true })
                .filter((dir) => dir.isDirectory() && dir.name.startsWith(prefix));
            for (const dir of dirs) {
                const dirName = dir.name;
                if (value.startsWith('^') && dirName.split('@')[1] < value.substring(1)) {
                    continue;
                }
                return path.resolve(OHPMPath, dirName, OH_MODULES, moduleName);
            }
        } catch (e) {
            logger.warn(`Cannot find module: ${moduleName} in ${OHPMPath}`);
        }
        return '';
    }


}