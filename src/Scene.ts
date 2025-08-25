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
import path, { normalize } from 'path';

import { SceneConfig, SceneOptions, Sdk, TsConfig } from './Config';
import { initModulePathMap, ModelUtils } from './core/common/ModelUtils';
import { TypeInference } from './core/common/TypeInference';
import { VisibleValue } from './core/common/VisibleValue';
import { ArkClass } from './core/model/ArkClass';
import { ArkFile, Language } from './core/model/ArkFile';
import { ArkMethod } from './core/model/ArkMethod';
import { ArkNamespace } from './core/model/ArkNamespace';
import { ClassSignature, FileSignature, MethodSignature, NamespaceSignature } from './core/model/ArkSignature';
import Logger, { LOG_MODULE_TYPE } from './utils/logger';
import { Local } from './core/base/Local';
import { buildArkFileFromFile } from './core/model/builder/ArkFileBuilder';
import { fetchDependenciesFromFile, parseJsonText } from './utils/json5parser';
import { getAllFiles } from './utils/getAllFiles';
import { FileUtils, getFileRecursively, getFileAbsPath } from './utils/FileUtils';
import { ArkExport, ExportInfo, ExportType } from './core/model/ArkExport';
import { addInitInConstructor, buildDefaultConstructor, replaceSuper2Constructor } from './core/model/builder/ArkMethodBuilder';
import { addInitInConstructor as addCxxInitInConstructor } from './cpp_frontend/model/builder/ArkMethodBuilder';
import { DEFAULT_ARK_CLASS_NAME, INSTANCE_INIT_METHOD_NAME, STATIC_INIT_METHOD_NAME } from './core/common/Const';
import { CallGraph } from './callgraph/model/CallGraph';
import { CallGraphBuilder } from './callgraph/model/builder/CallGraphBuilder';
import { buildArkFileFromFile as buildArkCxxFileFromFile } from './cpp_frontend/model/builder/ArkFileBuilder';

import { IRInference } from './core/common/IRInference';
import { IRInference as CxxIRInference } from './cpp_frontend/common/IRInference';
import { ImportInfo } from './core/model/ArkImport';
import { ALL, CONSTRUCTOR_NAME, TSCONFIG_JSON } from './core/common/TSConst';
import { BUILD_PROFILE_JSON5, OH_PACKAGE_JSON5 } from './core/common/EtsConst';
import { SdkUtils } from './core/common/SdkUtils';
import { PointerAnalysisConfig } from './callgraph/pointerAnalysis/PointerAnalysisConfig';
import { ValueUtil } from './core/common/ValueUtil';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'Scene');

enum SceneBuildStage {
    BUILD_INIT,
    SDK_INFERRED,
    CLASS_DONE,
    METHOD_DONE,
    CLASS_COLLECTED,
    METHOD_COLLECTED,
    TYPE_INFERRED,
}

/**
 * The Scene class includes everything in the analyzed project.
 * We should be able to re-generate the project's code based on this class.
 */
export class Scene {
    private projectName: string = '';
    private projectFiles: string[] = [];
    private realProjectDir: string = '';
    private includeDirs: string[] = [];

    private moduleScenesMap: Map<string, ModuleScene> = new Map();
    private modulePath2NameMap: Map<string, string> = new Map<string, string>();

    private moduleSdkMap: Map<string, Sdk[]> = new Map();
    private projectSdkMap: Map<string, Sdk> = new Map();

    // values that are visible in curr scope
    private visibleValue: VisibleValue = new VisibleValue();

    // signature string to model
    private filesMap: Map<string, ArkFile> = new Map();
    private namespacesMap: Map<string, ArkNamespace> = new Map();
    private classesMap: Map<string, ArkClass> = new Map();
    private methodsMap: Map<string, ArkMethod> = new Map();
    // TODO: type of key should be signature object
    private sdkArkFilesMap: Map<string, ArkFile> = new Map();
    private sdkGlobalMap: Map<string, ArkExport> = new Map<string, ArkExport>();
    private ohPkgContentMap: Map<string, { [k: string]: unknown }> = new Map<string, { [k: string]: unknown }>();
    private ohPkgFilePath: string = '';
    private ohPkgContent: { [k: string]: unknown } = {};
    private overRides: Map<string, string> = new Map();
    private overRideDependencyMap: Map<string, unknown> = new Map();
    private globalModule2PathMapping?: { [k: string]: string[] } | undefined;
    private baseUrl?: string | undefined;

    private buildStage: SceneBuildStage = SceneBuildStage.BUILD_INIT;
    private fileLanguages: Map<string, Language> = new Map();

    private options!: SceneOptions;

    private unhandledFilePaths: Set<string> = new Set<string>();
    private unhandledSdkFilePaths: string[] = [];

    constructor() {}

    /*
     * Set all static field to be null, then all related objects could be freed by GC.
     * This method could be called before drop Scene.
     */
    public dispose(): void {
        PointerAnalysisConfig.dispose();
        SdkUtils.dispose();
        ValueUtil.dispose();
        ModelUtils.dispose();
    }

    public getOptions(): SceneOptions {
        return this.options;
    }

    public getOverRides(): Map<string, string> {
        return this.overRides;
    }

    public getOverRideDependencyMap(): Map<string, unknown> {
        return this.overRideDependencyMap;
    }

    public clear(): void {
        this.projectFiles = [];

        this.moduleScenesMap.clear();
        this.modulePath2NameMap.clear();

        this.moduleSdkMap.clear();
        this.projectSdkMap.clear();

        this.filesMap.clear();
        this.namespacesMap.clear();
        this.classesMap.clear();
        this.methodsMap.clear();

        this.sdkArkFilesMap.clear();
        this.sdkGlobalMap.clear();
        this.ohPkgContentMap.clear();
        this.ohPkgContent = {};
    }

    public getStage(): SceneBuildStage {
        return this.buildStage;
    }

    /**
     * Build scene object according to the {@link SceneConfig}. This API implements 3 functions.
     * First is to build scene object from {@link SceneConfig}, second is to generate {@link ArkFile}s,
     * and the last is to collect project import infomation.
     * @param sceneConfig - a sceneConfig object, which is usally defined by user or Json file.
     * @example
     * 1. Build Scene object from scene config

     ```typescript
     // build config
     const projectDir = ... ...;
     const sceneConfig = new SceneConfig();
     sceneConfig.buildFromProjectDir(projectDir);

     // build scene
     const scene = new Scene();
     scene.buildSceneFromProjectDir(sceneConfig);
     ```
     */
    public buildSceneFromProjectDir(sceneConfig: SceneConfig): void {
        this.buildBasicInfo(sceneConfig);
        this.genArkFiles();
    }

    public buildSceneFromFiles(sceneConfig: SceneConfig): void {
        this.buildBasicInfo(sceneConfig);
        this.buildOhPkgContentMap();
        initModulePathMap(this.ohPkgContentMap);
        this.getFilesOrderByDependency();
    }

    /**
     * Set the basic information of the scene using a config,
     * such as the project's name, real path and files.
     * @param sceneConfig - the config used to set the basic information of scene.
     */
    public buildBasicInfo(sceneConfig: SceneConfig): void {
        this.options = sceneConfig.getOptions();
        this.projectName = sceneConfig.getTargetProjectName();
        this.realProjectDir = fs.realpathSync(sceneConfig.getTargetProjectDirectory());
        this.projectFiles = sceneConfig.getProjectFiles();
        this.includeDirs = sceneConfig.getIncludeDirs();

        this.parseBuildProfile();

        this.parseOhPackage();
        let tsConfigFilePath;
        if (this.options.tsconfig) {
            tsConfigFilePath = path.join(sceneConfig.getTargetProjectDirectory(), this.options.tsconfig);
        } else {
            tsConfigFilePath = path.join(sceneConfig.getTargetProjectDirectory(), TSCONFIG_JSON);
        }
        if (fs.existsSync(tsConfigFilePath)) {
            const tsConfigObj: TsConfig = fetchDependenciesFromFile(tsConfigFilePath);
            this.findTsConfigInfoDeeply(tsConfigObj, tsConfigFilePath);
        } else {
            logger.warn('This project has no tsconfig.json!');
        }

        // handle sdks
        if (this.options.enableBuiltIn && !sceneConfig.getSdksObj().find(sdk => sdk.name === SdkUtils.BUILT_IN_NAME)) {
            sceneConfig.getSdksObj().unshift(SdkUtils.getBuiltInSdk());
        }
        sceneConfig.getSdksObj()?.forEach(sdk => {
            if (!sdk.moduleName) {
                this.buildSdk(sdk.name, sdk.path);
                this.projectSdkMap.set(sdk.name, sdk);
            } else {
                let moduleSdks = this.moduleSdkMap.get(sdk.moduleName);
                if (moduleSdks) {
                    moduleSdks.push(sdk);
                } else {
                    this.moduleSdkMap.set(sdk.moduleName, [sdk]);
                }
            }
        });
        // If the SDK inference phase has not been completed, execute the type inference and global API merge of the SDK file
        if (this.buildStage < SceneBuildStage.SDK_INFERRED) {
            this.sdkArkFilesMap.forEach(file => {
                IRInference.inferFile(file);
                SdkUtils.mergeGlobalAPI(file, this.sdkGlobalMap);
            });
            this.sdkArkFilesMap.forEach(file => {
                SdkUtils.postInferredSdk(file, this.sdkGlobalMap);
            });
            this.buildStage = SceneBuildStage.SDK_INFERRED;
        }
        this.fileLanguages = sceneConfig.getFileLanguages();
    }

    private parseBuildProfile(): void {
        const buildProfile = path.join(this.realProjectDir, BUILD_PROFILE_JSON5);
        if (fs.existsSync(buildProfile)) {
            let configurationsText: string;
            try {
                configurationsText = fs.readFileSync(buildProfile, 'utf-8');
            } catch (error) {
                logger.error(`Error reading file: ${error}`);
                return;
            }
            const buildProfileJson = parseJsonText(configurationsText);
            SdkUtils.setEsVersion(buildProfileJson);
            const modules = buildProfileJson.modules;
            if (modules instanceof Array) {
                modules.forEach(module => {
                    this.modulePath2NameMap.set(path.resolve(this.realProjectDir, path.join(module.srcPath)), module.name);
                });
            }
        } else {
            logger.warn('There is no build-profile.json5 for this project.');
        }
    }

    private parseOhPackage(): void {
        const OhPkgFilePath = path.join(this.realProjectDir, OH_PACKAGE_JSON5);
        if (fs.existsSync(OhPkgFilePath)) {
            this.ohPkgFilePath = OhPkgFilePath;
            this.ohPkgContent = fetchDependenciesFromFile(this.ohPkgFilePath);
            this.ohPkgContentMap.set(OhPkgFilePath, this.ohPkgContent);
            if (this.ohPkgContent.overrides) {
                let overRides = this.ohPkgContent.overrides as { [k: string]: unknown };
                for (const [key, value] of Object.entries(overRides)) {
                    this.overRides.set(key, value as string);
                }
            }
            if (this.ohPkgContent.overrideDependencyMap) {
                let globalOverRideDependencyMap = this.ohPkgContent.overrideDependencyMap as { [k: string]: unknown };
                for (const [key, value] of Object.entries(globalOverRideDependencyMap)) {
                    let globalDependency = fetchDependenciesFromFile(value as string);
                    this.overRideDependencyMap.set(key, globalDependency);
                }
            }
        } else {
            logger.warn('This project has no oh-package.json5!');
        }
    }

    private findTsConfigInfoDeeply(tsConfigObj: TsConfig, tsConfigFilePath: string): void {
        if (tsConfigObj.extends) {
            const extTsConfigObj: TsConfig = fetchDependenciesFromFile(path.join(path.dirname(tsConfigFilePath), tsConfigObj.extends));
            this.findTsConfigInfoDeeply(extTsConfigObj, tsConfigFilePath);
            if (!this.baseUrl && !this.globalModule2PathMapping) {
                this.addTsConfigInfo(extTsConfigObj);
            }
        }
        if (!this.baseUrl && !this.globalModule2PathMapping) {
            this.addTsConfigInfo(tsConfigObj);
        }
    }

    private addTsConfigInfo(tsConfigObj: TsConfig): void {
        if (tsConfigObj.compilerOptions && tsConfigObj.compilerOptions.paths) {
            const paths = tsConfigObj.compilerOptions.paths;
            if (paths) {
                this.globalModule2PathMapping = paths;
            }
        }
        if (tsConfigObj.compilerOptions && tsConfigObj.compilerOptions.baseUrl) {
            this.baseUrl = tsConfigObj.compilerOptions.baseUrl;
        }
    }

    /**
     * Update or add default constructors for all classes in the scene.
     *
     * This function iterates through all files and classes in the scene,
     * builds default constructors for each class, and processes existing constructors
     * by replacing super constructor calls and adding initialization logic.
     *
     * @returns {void}
     */
    private updateOrAddDefaultConstructors(): void {
        for (const file of this.getFiles()) {
            const isCxxFile = file.getLanguage() === Language.CXX;
            for (const cls of ModelUtils.getAllClassesInFile(file)) {
                buildDefaultConstructor(cls);
                const constructors = cls.getAllMethodsWithName(CONSTRUCTOR_NAME);
                if (constructors.length === 0) {
                    continue;
                }
                // Select the appropriate initialization function based on file type
                const initInConstructorFn = isCxxFile ? addCxxInitInConstructor : addInitInConstructor;
                constructors.forEach(constructor => {
                    replaceSuper2Constructor(constructor);
                    initInConstructorFn(constructor);
                });
            }
        }
    }

    private buildAllMethodBody(): void {
        this.buildStage = SceneBuildStage.CLASS_DONE;
        const methods: ArkMethod[] = [];
        for (const file of this.getFiles()) {
            for (const cls of file.getClasses()) {
                for (const method of cls.getMethods(true)) {
                    methods.push(method);
                }
            }
        }
        for (const namespace of this.getNamespacesMap().values()) {
            for (const cls of namespace.getClasses()) {
                for (const method of cls.getMethods(true)) {
                    methods.push(method);
                }
            }
        }

        for (const method of methods) {
            const isCxxFile = method.getDeclaringArkFile()?.getLanguage() === Language.CXX;
            try {
                if (isCxxFile) {
                    method.getCxxBodyBuilder()?.buildBody();
                } else {
                    method.buildBody();
                }
            } catch (error) {
                logger.error('Error building body:', method.getSignature(), error);
            } finally {
                if (isCxxFile) {
                    method.freeCxxBodyBuilder();
                } else {
                    method.freeBodyBuilder();
                }
            }
        }

        ModelUtils.dispose();
        this.buildStage = SceneBuildStage.METHOD_DONE;
    }

    private genArkFiles(): void {
        this.projectFiles.forEach(file => {
            logger.trace('=== parse file:', file);
            try {
                const arkFile: ArkFile = new ArkFile(FileUtils.getFileLanguage(file, this.fileLanguages));
                arkFile.setScene(this);
                // Call different builder functions based on file language
                if (arkFile.getLanguage() === Language.CXX) {
                    buildArkCxxFileFromFile(file, this.realProjectDir, arkFile, this.projectName, this.includeDirs);
                } else {
                    buildArkFileFromFile(file, this.realProjectDir, arkFile, this.projectName);
                }
                this.setFile(arkFile);
            } catch (error) {
                logger.error('Error parsing file:', file, error);
                this.unhandledFilePaths.add(file);
                return;
            }
        });
        this.buildAllMethodBody();
        this.updateOrAddDefaultConstructors();
    }

    private getFilesOrderByDependency(): void {
        for (const projectFile of this.projectFiles) {
            this.getDependencyFilesDeeply(projectFile);
        }
        this.buildAllMethodBody();
        this.updateOrAddDefaultConstructors();
    }

    private getDependencyFilesDeeply(projectFile: string): void {
        if (!this.options.supportFileExts!.includes(path.extname(projectFile))) {
            return;
        }
        const fileSignature = new FileSignature(this.getProjectName(), path.relative(this.getRealProjectDir(), projectFile));
        if (this.filesMap.has(fileSignature.toMapKey()) || this.isRepeatBuildFile(projectFile) || this.unhandledFilePaths.has(projectFile)) {
            return;
        }
        // Here use unhandledFilePaths to temporarily store current file until add it to fileMaps to avoid recursively import issue.
        this.unhandledFilePaths.add(projectFile);
        try {
            const arkFile = new ArkFile(FileUtils.getFileLanguage(projectFile, this.fileLanguages));
            arkFile.setScene(this);
            if (arkFile.getLanguage() === Language.CXX) {
                buildArkCxxFileFromFile(projectFile, this.getRealProjectDir(), arkFile, this.getProjectName(), this.includeDirs);
            } else {
                buildArkFileFromFile(projectFile, this.getRealProjectDir(), arkFile, this.getProjectName());
            }
            for (const [modulePath, moduleName] of this.modulePath2NameMap) {
                if (arkFile.getFilePath().startsWith(modulePath)) {
                    this.addArkFile2ModuleScene(modulePath, moduleName, arkFile);
                    break;
                }
            }
            const importInfos = arkFile.getImportInfos();
            const repeatFroms: string[] = [];
            this.findDependencyFiles(importInfos, arkFile, repeatFroms);

            const exportInfos = arkFile.getExportInfos();
            this.findDependencyFiles(exportInfos, arkFile, repeatFroms);

            // add currently file to files map after adding all its dependencies, and remove it from unhandledFilePaths
            this.setFile(arkFile);
            this.unhandledFilePaths.delete(projectFile);
        } catch (error) {
            logger.error('Error parsing file:', projectFile, error);
            return;
        }
    }

    private isRepeatBuildFile(projectFile: string): boolean {
        for (const [key, file] of this.filesMap) {
            if (key && file.getFilePath().toLowerCase() === projectFile.toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    private addArkFile2ModuleScene(modulePath: string, moduleName: string, arkFile: ArkFile): void {
        if (this.moduleScenesMap.has(moduleName)) {
            let curModuleScene = this.moduleScenesMap.get(moduleName);
            if (curModuleScene) {
                curModuleScene.addArkFile(arkFile);
                arkFile.setModuleScene(curModuleScene);
            }
        } else {
            let moduleScene = new ModuleScene(this);
            moduleScene.ModuleScenePartiallyBuilder(moduleName, modulePath);
            moduleScene.addArkFile(arkFile);
            this.moduleScenesMap.set(moduleName, moduleScene);
            arkFile.setModuleScene(moduleScene);
        }
    }

    private findDependencyFiles(importOrExportInfos: ImportInfo[] | ExportInfo[], arkFile: ArkFile, repeatFroms: string[]): void {
        for (const importOrExportInfo of importOrExportInfos) {
            const from = importOrExportInfo.getFrom();
            if (from && !repeatFroms.includes(from)) {
                this.parseFrom(from, arkFile);
                repeatFroms.push(from);
            }
        }
    }

    private parseFrom(from: string, arkFile: ArkFile): void {
        if (/^@[a-z|\-]+?\/?/.test(from) || /^[a-z][a-z0-9._-]*[a-z0-9]$/.test(from)) {
            // TODO: if there are more than one modules with the same name e.g. @lib1, here may got the wrong dependency
            // It is better to loop all oh pkg with priority rather than the map key order. But it should be very complicated.
            // Currently it is ok because it's with low probability and order error only affects type accuracy but has no other impact.
            for (const [ohPkgContentPath, ohPkgContent] of this.ohPkgContentMap) {
                this.findDependenciesByOhPkg(ohPkgContentPath, ohPkgContent, from);
            }
        } else if (/^([^@]*\/)([^\/]*)$/.test(from) || /^[\.\./|\.\.]+$/.test(from)) {
            this.findRelativeDependenciesByOhPkg(from, arkFile);
        } else if (/^[@a-zA-Z0-9]+(\/[a-zA-Z0-9]+)*$/.test(from)) {
            this.findDependenciesByTsConfig(from);
        }
    }

    private findDependenciesByTsConfig(from: string): void {
        if (this.globalModule2PathMapping) {
            const paths: { [k: string]: string[] } = this.globalModule2PathMapping;
            Object.keys(paths).forEach(key => this.parseTsConfigParms(paths, key, from));
        }
    }

    private parseTsConfigParms(paths: { [k: string]: string[] }, key: string, from: string): void {
        const module2pathMapping = paths[key];
        if (key.includes(ALL)) {
            this.processFuzzyMapping(key, from, module2pathMapping);
        } else if (from.startsWith(key)) {
            let tail = from.substring(key.length, from.length);
            module2pathMapping.forEach(pathMapping => {
                let originPath = path.join(this.getRealProjectDir(), pathMapping, tail);
                if (this.baseUrl) {
                    originPath = path.resolve(this.baseUrl, originPath);
                }
                this.findDependenciesByRule(originPath);
            });
        }
    }

    private processFuzzyMapping(key: string, from: string, module2pathMapping: string[]): void {
        key = key.substring(0, key.indexOf(ALL) - 1);
        if (from.substring(0, key.indexOf(ALL) - 1) === key) {
            let tail = from.substring(key.indexOf(ALL) - 1, from.length);
            module2pathMapping.forEach(pathMapping => {
                pathMapping = pathMapping.substring(0, pathMapping.indexOf(ALL) - 1);
                let originPath = path.join(this.getRealProjectDir(), pathMapping, tail);
                if (this.baseUrl) {
                    originPath = path.join(this.baseUrl, originPath);
                }
                this.findDependenciesByRule(originPath);
            });
        }
    }

    private findDependenciesByRule(originPath: string): void {
        if (!this.findFilesByPathArray(originPath) && !this.findFilesByExtNameArray(originPath, this.options.supportFileExts!)) {
            logger.trace(originPath + 'module mapperInfo is not found!');
        }
    }

    private findFilesByPathArray(originPath: string): boolean {
        if (!fs.existsSync(originPath)) {
            return false;
        }
        const dirname = path.dirname(originPath);
        const indexFileName = FileUtils.getIndexFileName(dirname);
        if (indexFileName === '') {
            return false;
        }
        const curPath = path.join(dirname, indexFileName);
        if (!this.isRepeatBuildFile(curPath)) {
            this.addFileNode2DependencyGrap(curPath);
            return true;
        }
        return false;
    }

    private findFilesByExtNameArray(originPath: string, pathArray: string[]): boolean {
        for (const pathInfo of pathArray) {
            const curPath = originPath + pathInfo;
            if (fs.existsSync(curPath) && !this.isRepeatBuildFile(curPath)) {
                this.addFileNode2DependencyGrap(curPath);
                return true;
            }
        }
        return false;
    }

    private findRelativeDependenciesByOhPkg(from: string, arkFile: ArkFile): void {
        //relative path ../from  ./from
        //order
        //1. ../from/oh-package.json5 -> [[name]] -> overRides/overRideDependencyMap? ->
        //[[main]] -> file path ->dependencies(priority)+devDependencies? dynamicDependencies(not support) ->
        //key overRides/overRideDependencyMap?
        //2. ../from/index.ets(ts)
        //3. ../from/index.d.ets(ts)
        //4. ../from.ets(ts)
        //5. ../from.d.ets(ts)
        //2.3.4.5 random order
        let originPath = this.getOriginPath(from, arkFile);
        if (fs.existsSync(path.join(originPath, OH_PACKAGE_JSON5))) {
            for (const [ohPkgContentPath, ohPkgContent] of this.ohPkgContentMap) {
                this.findDependenciesByOhPkg(ohPkgContentPath, ohPkgContent, from);
            }
        }
        this.findDependenciesByRule(originPath);
    }

    private findDependenciesByOhPkg(
        ohPkgContentPath: string,
        ohPkgContentInfo: {
            [k: string]: unknown;
        },
        from: string
    ): void {
        //module name @ohos/from
        const ohPkgContent: { [k: string]: unknown } | undefined = ohPkgContentInfo;
        //module main name is must be
        if (ohPkgContent && ohPkgContent.name && from.startsWith(ohPkgContent.name.toString())) {
            let originPath = ohPkgContentPath.toString().replace(OH_PACKAGE_JSON5, '');
            if (ohPkgContent.main) {
                originPath = path.join(ohPkgContentPath.toString().replace(OH_PACKAGE_JSON5, ''), ohPkgContent.main.toString());
                if (ohPkgContent.dependencies) {
                    this.getDependenciesMapping(ohPkgContent.dependencies, ohPkgContentPath, from);
                } else if (ohPkgContent.devDependencies) {
                    this.getDependenciesMapping(ohPkgContent.devDependencies, ohPkgContentPath, from);
                } else if (ohPkgContent.dynamicDependencies) {
                    // dynamicDependencies not support
                }
                this.addFileNode2DependencyGrap(originPath);
            }
            if (!this.findFilesByPathArray(originPath)) {
                logger.trace(originPath + 'module mapperInfo is not found!');
            }
        }
    }

    private getDependenciesMapping(dependencies: object, ohPkgContentPath: string, from: string): void {
        for (let [moduleName, modulePath] of Object.entries(dependencies)) {
            logger.debug('dependencies:' + moduleName);
            if (modulePath.startsWith('file:')) {
                modulePath = modulePath.replace(/^file:/, '');
            }
            const innerOhpackagePath = path.join(ohPkgContentPath.replace(OH_PACKAGE_JSON5, ''), modulePath.toString(), OH_PACKAGE_JSON5);
            if (!this.ohPkgContentMap.has(innerOhpackagePath)) {
                const innerModuleOhPkgContent = fetchDependenciesFromFile(innerOhpackagePath);
                this.findDependenciesByOhPkg(innerOhpackagePath, innerModuleOhPkgContent, from);
            }
        }
    }

    private getOriginPath(from: string, arkFile: ArkFile): string {
        const parentPath = /^\.{1,2}\//.test(from) ? path.dirname(arkFile.getFilePath()) : arkFile.getProjectDir();
        return path.resolve(parentPath, from);
    }

    private addFileNode2DependencyGrap(filePath: string): void {
        this.getDependencyFilesDeeply(filePath);
    }

    private buildSdk(sdkName: string, sdkPath: string): void {
        let allFiles;
        if (sdkName === SdkUtils.BUILT_IN_NAME) {
            allFiles = SdkUtils.fetchBuiltInFiles(sdkPath);
            if (allFiles.length > 0) {
                this.getOptions().sdkGlobalFolders?.push(sdkPath);
            }
        } else {
            allFiles = getAllFiles(sdkPath, this.options.supportFileExts!, this.options.ignoreFileNames);
        }
        allFiles.forEach(file => {
            logger.trace('=== parse sdk file:', file);
            try {
                const arkFile: ArkFile = new ArkFile(FileUtils.getFileLanguage(file, this.fileLanguages));
                arkFile.setScene(this);
                buildArkFileFromFile(file, path.normalize(sdkPath), arkFile, sdkName);
                ModelUtils.getAllClassesInFile(arkFile).forEach(cls => {
                    cls.getDefaultArkMethod()?.buildBody();
                    cls.getDefaultArkMethod()?.freeBodyBuilder();
                });
                const fileSig = arkFile.getFileSignature().toMapKey();
                this.sdkArkFilesMap.set(fileSig, arkFile);
                SdkUtils.buildSdkImportMap(arkFile);
                SdkUtils.loadGlobalAPI(arkFile, this.sdkGlobalMap);
            } catch (error) {
                logger.error('Error parsing file:', file, error);
                this.unhandledSdkFilePaths.push(file);
                return;
            }
        });
    }

    /**
     * Build the scene for harmony project. It resolves the file path of the project first, and then fetches
     * dependencies from this file. Next, build a `ModuleScene` for this project to generate {@link ArkFile}. Finally,
     * it build bodies of all methods, generate extended classes, and add DefaultConstructors.
     */
    public buildScene4HarmonyProject(): void {
        this.buildOhPkgContentMap();
        this.modulePath2NameMap.forEach((value, key) => {
            let moduleScene = new ModuleScene(this);
            moduleScene.ModuleSceneBuilder(value, key, this.options.supportFileExts!);
            this.moduleScenesMap.set(value, moduleScene);
        });
        initModulePathMap(this.ohPkgContentMap);
        this.buildAllMethodBody();
        this.updateOrAddDefaultConstructors();
    }

    private buildOhPkgContentMap(): void {
        this.modulePath2NameMap.forEach((value, key) => {
            const moduleOhPkgFilePath = path.resolve(key, OH_PACKAGE_JSON5);
            if (fs.existsSync(moduleOhPkgFilePath)) {
                const moduleOhPkgContent = fetchDependenciesFromFile(moduleOhPkgFilePath);
                this.ohPkgContentMap.set(moduleOhPkgFilePath, moduleOhPkgContent);
            }
        });
    }

    public buildModuleScene(moduleName: string, modulePath: string, supportFileExts: string[]): void {
        if (this.moduleScenesMap.get(moduleName)) {
            return;
        }

        // get oh-package.json5
        const moduleOhPkgFilePath = path.resolve(this.realProjectDir, path.join(modulePath, OH_PACKAGE_JSON5));
        if (fs.existsSync(moduleOhPkgFilePath)) {
            const moduleOhPkgContent = fetchDependenciesFromFile(moduleOhPkgFilePath);
            this.ohPkgContentMap.set(moduleOhPkgFilePath, moduleOhPkgContent);
        } else {
            logger.warn('Module: ', moduleName, 'has no oh-package.json5.');
        }

        // parse moduleOhPkgContent, get dependencies and build dependent module
        const moduleOhPkgContent = this.ohPkgContentMap.get(moduleOhPkgFilePath);
        if (moduleOhPkgContent) {
            if (moduleOhPkgContent.dependencies instanceof Object) {
                this.processModuleOhPkgContent(moduleOhPkgContent.dependencies, moduleOhPkgFilePath, supportFileExts);
            }
        }

        let moduleScene = new ModuleScene(this);
        moduleScene.ModuleSceneBuilder(moduleName, modulePath, supportFileExts);
        this.moduleScenesMap.set(moduleName, moduleScene);

        this.buildAllMethodBody();
    }

    private processModuleOhPkgContent(dependencies: Object, moduleOhPkgFilePath: string, supportFileExts: string[]): void {
        Object.entries(dependencies).forEach(([k, v]) => {
            const pattern = new RegExp('^(\\.\\.\\/\|\\.\\/)');
            if (typeof v === 'string') {
                let dependencyModulePath: string = '';
                if (pattern.test(v)) {
                    dependencyModulePath = path.join(moduleOhPkgFilePath, v);
                } else if (v.startsWith('file:')) {
                    const dependencyFilePath = path.join(moduleOhPkgFilePath, v.replace(/^file:/, ''));
                    const dependencyOhPkgPath = getFileRecursively(path.dirname(dependencyFilePath), OH_PACKAGE_JSON5);
                    dependencyModulePath = path.dirname(dependencyOhPkgPath);
                }
                const dependencyModuleName = this.modulePath2NameMap.get(dependencyModulePath);
                if (dependencyModuleName) {
                    this.buildModuleScene(dependencyModuleName, dependencyModulePath, supportFileExts);
                }
            }
        });
    }

    /**
     * Get the absolute path of current project.
     * @returns The real project's directiory.
     * @example
     * 1. get real project directory, such as:
     ```typescript
     let projectDir = projectScene.getRealProjectDir();
     ```
     */
    public getRealProjectDir(): string {
        return this.realProjectDir;
    }

    /**
     * Returns the **string** name of the project.
     * @returns The name of the project.
     */
    public getProjectName(): string {
        return this.projectName;
    }

    public getProjectFiles(): string[] {
        return this.projectFiles;
    }

    public getSdkGlobal(globalName: string): ArkExport | null {
        return this.sdkGlobalMap.get(globalName) || null;
    }

    /**
     * Returns the file based on its signature.
     * If no file can be found according to the input signature, **null** will be returned.
     * A typical {@link ArkFile} contains: file's name (i.e., its relative path), project's name,
     * project's dir, file's signature etc.
     * @param fileSignature - the signature of file.
     * @returns a file defined by ArkAnalyzer. **null** will be returned if no file could be found.
     * @example
     * 1. get ArkFile based on file signature.

     ```typescript
     if (...) {
     const fromSignature = new FileSignature();
     fromSignature.setProjectName(im.getDeclaringArkFile().getProjectName());
     fromSignature.setFileName(fileName);
     return scene.getFile(fromSignature);
     }
     ```
     */
    public getFile(fileSignature: FileSignature): ArkFile | null {
        if (this.projectName === fileSignature.getProjectName()) {
            return this.filesMap.get(fileSignature.toMapKey()) || null;
        } else {
            return this.sdkArkFilesMap.get(fileSignature.toMapKey()) || null;
        }
    }

    /*
     * Returns the absolute file paths that cannot be handled currently.
     */
    public getUnhandledFilePaths(): string[] {
        return Array.from(this.unhandledFilePaths);
    }

    /*
     * Returns the absolute sdk file paths that cannot be handled currently.
     */
    public getUnhandledSdkFilePaths(): string[] {
        return this.unhandledSdkFilePaths;
    }

    public setFile(file: ArkFile): void {
        this.filesMap.set(file.getFileSignature().toMapKey(), file);
    }

    public hasSdkFile(fileSignature: FileSignature): boolean {
        return this.sdkArkFilesMap.has(fileSignature.toMapKey());
    }

    /**
     * Get files of a {@link Scene}. Generally, a project includes several ets/ts files that define the different
     * class. We need to generate {@link ArkFile} objects from these ets/ts files.
     * @returns The array of {@link ArkFile} from `scene.filesMap.values()`.
     * @example
     * 1. In inferSimpleTypes() to check arkClass and arkMethod.
     * ```typescript
     * public inferSimpleTypes(): void {
     *   for (let arkFile of this.getFiles()) {
     *       for (let arkClass of arkFile.getClasses()) {
     *           for (let arkMethod of arkClass.getMethods()) {
     *           // ... ...;
     *           }
     *       }
     *   }
     * }
     * ```
     * 2. To iterate each method
     * ```typescript
     * for (const file of this.getFiles()) {
     *     for (const cls of file.getClasses()) {
     *         for (const method of cls.getMethods()) {
     *             // ... ...
     *         }
     *     }
     * }
     *```
     */
    public getFiles(): ArkFile[] {
        return Array.from(this.filesMap.values());
    }

    public getFileLanguages(): Map<string, Language> {
        return this.fileLanguages;
    }

    public getSdkArkFiles(): ArkFile[] {
        return Array.from(this.sdkArkFilesMap.values());
    }

    public getModuleSdkMap(): Map<string, Sdk[]> {
        return this.moduleSdkMap;
    }

    public getProjectSdkMap(): Map<string, Sdk> {
        return this.projectSdkMap;
    }

    public getNamespace(namespaceSignature: NamespaceSignature): ArkNamespace | null {
        const isProject = this.projectName === namespaceSignature.getDeclaringFileSignature().getProjectName();
        let namespace;
        if (isProject) {
            namespace = this.namespacesMap.get(namespaceSignature.toMapKey());
        }
        if (namespace) {
            return namespace;
        }
        namespace = this.getNamespaceBySignature(namespaceSignature);
        if (isProject && namespace) {
            this.namespacesMap.set(namespaceSignature.toMapKey(), namespace);
        }
        return namespace || null;
    }

    private getNamespaceBySignature(signature: NamespaceSignature): ArkNamespace | null {
        const parentSignature = signature.getDeclaringNamespaceSignature();
        if (parentSignature) {
            const parentNamespace = this.getNamespaceBySignature(parentSignature);
            return parentNamespace?.getNamespace(signature) || null;
        } else {
            const arkFile = this.getFile(signature.getDeclaringFileSignature());
            return arkFile?.getNamespace(signature) || null;
        }
    }

    private getNamespacesMap(): Map<string, ArkNamespace> {
        if (this.buildStage === SceneBuildStage.CLASS_DONE) {
            for (const file of this.getFiles()) {
                ModelUtils.getAllNamespacesInFile(file).forEach(namespace => {
                    this.namespacesMap.set(namespace.getNamespaceSignature().toMapKey(), namespace);
                });
            }
        }
        return this.namespacesMap;
    }

    public getNamespaces(): ArkNamespace[] {
        return Array.from(this.getNamespacesMap().values());
    }

    /**
     * Returns the class according to the input class signature.
     * @param classSignature - signature of the class to be obtained.
     * @returns A class.
     */
    public getClass(classSignature: ClassSignature): ArkClass | null {
        const isProject = this.projectName === classSignature.getDeclaringFileSignature().getProjectName();
        let arkClass;
        if (isProject) {
            arkClass = this.classesMap.get(classSignature.toMapKey());
        }
        if (arkClass) {
            return arkClass;
        }
        const namespaceSignature = classSignature.getDeclaringNamespaceSignature();
        if (namespaceSignature) {
            arkClass = this.getNamespaceBySignature(namespaceSignature)?.getClass(classSignature) || null;
        } else {
            const arkFile = this.getFile(classSignature.getDeclaringFileSignature());
            arkClass = arkFile?.getClass(classSignature);
        }
        if (isProject && arkClass) {
            this.classesMap.set(classSignature.toMapKey(), arkClass);
        }
        return arkClass || null;
    }

    private getClassesMap(refresh?: boolean): Map<string, ArkClass> {
        if (refresh || this.buildStage === SceneBuildStage.METHOD_DONE) {
            this.classesMap.clear();
            for (const file of this.getFiles()) {
                for (const cls of file.getClasses()) {
                    this.classesMap.set(cls.getSignature().toMapKey(), cls);
                }
            }
            for (const namespace of this.getNamespacesMap().values()) {
                for (const cls of namespace.getClasses()) {
                    this.classesMap.set(cls.getSignature().toMapKey(), cls);
                }
            }
            if (this.buildStage < SceneBuildStage.CLASS_COLLECTED) {
                this.buildStage = SceneBuildStage.CLASS_COLLECTED;
            }
        }
        return this.classesMap;
    }

    public getClasses(): ArkClass[] {
        return Array.from(this.getClassesMap().values());
    }

    public getMethod(methodSignature: MethodSignature, refresh?: boolean): ArkMethod | null {
        const isProject = this.projectName === methodSignature.getDeclaringClassSignature().getDeclaringFileSignature().getProjectName();
        let arkMethod;
        if (isProject) {
            arkMethod = this.methodsMap.get(methodSignature.toMapKey());
        }
        if (arkMethod) {
            return arkMethod;
        }
        arkMethod = this.getClass(methodSignature.getDeclaringClassSignature())?.getMethod(methodSignature);
        if (isProject && arkMethod) {
            this.methodsMap.set(methodSignature.toMapKey(), arkMethod);
        }
        return arkMethod || null;
    }

    /**
     * Retrieve an Ark C++ method object based on its method signature.
     *
     * @param methodSignature - The method signature used to locate the specific method
     * @param refresh - Optional parameter to indicate whether to refresh the cache, defaults to false
     * @returns The corresponding ArkMethod object if found, otherwise null
     */
    public getArkCxxMethod(methodSignature: MethodSignature, refresh?: boolean): ArkMethod | null {
        if (this.projectName === methodSignature.getDeclaringClassSignature().getDeclaringFileSignature().getProjectName()) {
            return this.getCxxMethodsMap(refresh).get(methodSignature.toMapKey()) || null;
        } else {
            return this.getClass(methodSignature.getDeclaringClassSignature())?.getMethod(methodSignature) || null;
        }
    }

    private getMethodsMap(refresh?: boolean): Map<string, ArkMethod> {
        if (refresh || (this.buildStage >= SceneBuildStage.METHOD_DONE && this.buildStage < SceneBuildStage.METHOD_COLLECTED)) {
            this.methodsMap.clear();
            for (const cls of this.getClassesMap(refresh).values()) {
                for (const method of cls.getMethods(true)) {
                    this.methodsMap.set(method.getSignature().toMapKey(), method);
                }
            }
            if (this.buildStage < SceneBuildStage.METHOD_COLLECTED) {
                this.buildStage = SceneBuildStage.METHOD_COLLECTED;
            }
        }
        return this.methodsMap;
    }

    /**
     * Get the C++ methods map
     * @param refresh - Whether to force refresh the map, defaults to false
     * @returns Returns a Map containing all C++ methods, with method signatures as keys and ArkMethod objects as values
     */
    private getCxxMethodsMap(refresh?: boolean): Map<string, ArkMethod> {
        if (refresh || (this.methodsMap.size === 0 && this.buildStage >= SceneBuildStage.METHOD_DONE)) {
            this.methodsMap.clear();
            for (const cls of this.getClassesMap().values()) {
                for (const method of cls.getMethods(true)) {
                    this.methodsMap.set(method.getSignature().toMapKey(), method);
                }
            }
        }
        return this.methodsMap;
    }

    /**
     * Returns the method associated with the method signature.
     * If no method is associated with this signature, **null** will be returned.
     * An {@link ArkMethod} includes:
     * - Name: the **string** name of method.
     * - Code: the **string** code of the method.
     * - Line: a **number** indicating the line location, initialized as -1.
     * - Column: a **number** indicating the column location, initialized as -1.
     * - Parameters & Types of parameters: the parameters of method and their types.
     * - View tree: the view tree of the method.
     * - ...
     *
     * @param methodSignature - the signature of method.
     * @returns The method associated with the method signature.
     * @example
     * 1. get method from getMethod.

     ```typescript
     const methodSignatures = this.CHA.resolveCall(xxx, yyy);
     for (const methodSignature of methodSignatures) {
     const method = this.scene.getMethod(methodSignature);
     ... ...
     }
     ```
     */
    public getMethods(): ArkMethod[] {
        return Array.from(this.getMethodsMap().values());
    }

    public addToMethodsMap(method: ArkMethod): void {
        this.methodsMap.set(method.getSignature().toMapKey(), method);
    }

    public removeMethod(method: ArkMethod): boolean {
        return this.methodsMap.delete(method.getSignature().toMapKey());
    }

    public removeClass(arkClass: ArkClass): boolean {
        return this.classesMap.delete(arkClass.getSignature().toMapKey());
    }

    public removeNamespace(namespace: ArkNamespace): boolean {
        return this.namespacesMap.delete(namespace.getSignature().toMapKey());
    }

    public removeFile(file: ArkFile): boolean {
        return this.filesMap.delete(file.getFileSignature().toMapKey());
    }

    public hasMainMethod(): boolean {
        return false;
    }

    //Get the set of entry points that are used to build the call graph.
    public getEntryPoints(): MethodSignature[] {
        return [];
    }

    /** get values that is visible in curr scope */
    public getVisibleValue(): VisibleValue {
        return this.visibleValue;
    }

    public getOhPkgContent(): { [p: string]: unknown } {
        return this.ohPkgContent;
    }

    public getOhPkgContentMap(): Map<string, { [p: string]: unknown }> {
        return this.ohPkgContentMap;
    }

    public getOhPkgFilePath(): string {
        return this.ohPkgFilePath;
    }

    public makeCallGraphCHA(entryPoints: MethodSignature[]): CallGraph {
        let callGraph = new CallGraph(this);
        let callGraphBuilder = new CallGraphBuilder(callGraph, this);
        callGraphBuilder.buildClassHierarchyCallGraph(entryPoints);
        return callGraph;
    }

    public makeCallGraphRTA(entryPoints: MethodSignature[]): CallGraph {
        let callGraph = new CallGraph(this);
        let callGraphBuilder = new CallGraphBuilder(callGraph, this);
        callGraphBuilder.buildRapidTypeCallGraph(entryPoints);
        return callGraph;
    }

    /**
     * Infer type for each non-default method. It infers the type of each field/local/reference.
     * For example, the statement `let b = 5;`, the type of local `b` is `NumberType`; and for the statement `let s =
     * 'hello';`, the type of local `s` is `StringType`. The detailed types are defined in the Type.ts file.
     * @example
     * 1. Infer the type of each class field and method field.
     ```typescript
     const scene = new Scene();
     scene.buildSceneFromProjectDir(sceneConfig);
     scene.inferTypes();
     ```
     */
    public inferTypes(): void {
        this.buildCxxFuncMap();
        this.filesMap.forEach(file => {
            try {
                file.getLanguage() === Language.CXX ? CxxIRInference.inferFile(file) : IRInference.inferFile(file);
            } catch (error) {
                logger.error('Error inferring types of project file:', file.getFileSignature(), error);
            }
        });
        if (this.buildStage < SceneBuildStage.TYPE_INFERRED) {
            this.getMethodsMap(true);
            this.buildStage = SceneBuildStage.TYPE_INFERRED;
        }
        SdkUtils.dispose();
    }

    /**
     *Build C++function mapping table
     *
     *This function traverses all C++header files to find the corresponding implementation file for each class's method,
     *And establish the mapping relationship between methods and implementation files
     */
    private buildCxxFuncMap(): void {
        const headerFileRefMap = this.getCxxHeaderFileRefMap();
        for (const [headerPath, refFiles] of headerFileRefMap) {
            const headerArkFile = this.getFile(new FileSignature(this.projectName, path.relative(this.realProjectDir, headerPath)));
            if (!headerArkFile) {
                continue;
            }
            const sortedRefFiles = this.sortRefFiles(headerPath, refFiles);
            for (const cls of headerArkFile.getClasses()) {
                for (const mtd of cls.getMethods(true)) {
                    this.findMtdImpl(mtd, headerPath, sortedRefFiles);
                }
            }
        }
    }

    /**
     *Implementation method of search method
     *@ param mtd - Ark method object
     *@ param headerPath - Header file path
     *@ param sortedRefFiles - sorted reference file array
     */
    private findMtdImpl(mtd: ArkMethod, headerPath: string, sortedRefFiles: string[]): void {
        const isFuncImpl = mtd.getImplementationSignature();
        if (isFuncImpl || mtd.isDefaultArkMethod() || mtd.getName() === INSTANCE_INIT_METHOD_NAME || mtd.getName() === STATIC_INIT_METHOD_NAME) {
            return;
        }
        this.mapHeaderToSource(mtd, headerPath, sortedRefFiles);
    }

    /**
     *Get the C++header file reference mapping table
     *
     *This function traverses all files and filters out C++source files (.cpp ,.c,.cxx),
     *Then analyze the import information in these source files, and establish the reference relationship mapping from the header file to the source file.
     *
     *@ returns Map<string, string []>The mapping from the header file path to the source file path array that references the header file
     */
    private getCxxHeaderFileRefMap(): Map<string, string[]> {
        const headerFileRefMap = new Map<string, string[]>();
        const cxxSuffixes = ['.cpp', '.c', '.cxx'];
        this.filesMap.forEach(file => {
            const filePath = normalize(file.getFilePath());
            const extension = path.extname(filePath).toLowerCase();
            if (!cxxSuffixes.some(suffix => extension === suffix)) {
                return;
            }
            const importInfos = file.getImportInfos();
            importInfos.forEach(im => {
                this.processImportInfo(im, filePath, headerFileRefMap);
            });
        });

        return headerFileRefMap;
    }

    /**
     *Process import information and establish header file reference relationship mapping
     *@ param im Import information object, including imported module information
     *@ param filePath Path of the current file
     *@ param headerFileRefMap header file reference relationship mapping table, used to record which files are referenced by each header file
     */
    private processImportInfo(im: ImportInfo, filePath: string, headerFileRefMap: Map<string, string[]>): void {
        let imFrom = im.getFrom();
        if (!imFrom) {
            return;
        }
        if (!fs.existsSync(imFrom)) {
            // If the path does not exist, try to use includeDirs to find the relative path
            imFrom = getFileAbsPath(this.includeDirs, imFrom);
            if (!imFrom) {
                return;
            }
        }
        if (!headerFileRefMap.has(imFrom)) {
            headerFileRefMap.set(imFrom, []);
        }
        headerFileRefMap.get(imFrom)!.push(filePath);
    }

    /**
     *Sort the reference file array, and prioritize the reference files with the same name as the target file
     *@ param headerFilePath Destination header file path
     *@ param refFiles Array of reference file paths to be sorted
     *@ returns The array of reference file paths sorted, with files with the same name first and other files second
     */
    private sortRefFiles(headerFilePath: string, refFiles: string[]): string[] {
        const targetFileName = path.parse(headerFilePath).name;
        const prioritized: string[] = [];
        const others: string[] = [];
        for (const refFile of refFiles) {
            if (path.parse(refFile).name === targetFileName) {
                prioritized.push(refFile);
            } else {
                others.push(refFile);
            }
        }
        return [...prioritized, ...others];
    }

    /**
     *Map the method declaration to the corresponding source code implementation
     *Find the corresponding method implementation in the reference file by matching the method signature, and establish the association between declaration and implementation
     *
     *@ param mtdDecl - target method declaration object, used to obtain declaration information and set implementation signature
     *@ param headerFile - Header file path, as one of the reference files
     *@ param refFiles - reference file list, used to search method implementation
     */
    private mapHeaderToSource(mtdDecl: ArkMethod, headerFile: string, refFiles: string[]): void {
        const tgtClsName = mtdDecl.getDeclaringArkClass().getName();
        const tgtMtdSubSig = mtdDecl.getSubSignature();
        const matchKey = `${tgtMtdSubSig.getReturnType().toString()} ${tgtClsName}::${tgtMtdSubSig.toString()}`;
        for (const refFile of refFiles) {
            const refArkFile = this.getFile(new FileSignature(this.projectName, path.relative(this.realProjectDir, refFile)));
            if (!refArkFile) {
                continue;
            }
            const refArkClass = refArkFile.getClassWithName(tgtClsName);
            if (!refArkClass) {
                continue;
            }
            const nameMatchingMtds = refArkClass.getAllMethodsWithName(mtdDecl.getName());
            for (const mtd of nameMatchingMtds) {
                const nameMatchingMtdSubSig = mtd.getSubSignature();
                const mtdSubSigStr = `${nameMatchingMtdSubSig.getReturnType().toString()} ${tgtClsName}::${nameMatchingMtdSubSig.toString()}`;
                if (mtdSubSigStr === matchKey) {
                    // Set the signature of the function implementation corresponding to the current function declaration
                    mtdDecl.setImplementationSignature(mtd.getSignature());
                    // The function implementation may be missing the existing modifiers (such as static) in the function declaration. Here we add
                    mtd.setModifiers(mtdDecl.getModifiers() | mtd.getModifiers());
                    return;
                }
            }
        }
    }

    /**
     * Iterate all assignment statements in methods,
     * and set the type of left operand based on the type of right operand
     * if the left operand is a local variable as well as an unknown.
     * @Deprecated
     * @example
     * 1. Infer simple type when scene building.

     ```typescript
     let scene = new Scene();
     scene.buildSceneFromProjectDir(config);
     scene.inferSimpleTypes();
     ```
     */
    public inferSimpleTypes(): void {
        for (let arkFile of this.getFiles()) {
            for (let arkClass of arkFile.getClasses()) {
                for (let arkMethod of arkClass.getMethods()) {
                    TypeInference.inferSimpleTypeInMethod(arkMethod);
                }
            }
        }
    }

    private addNSClasses(
        namespaceStack: ArkNamespace[],
        finalNamespaces: ArkNamespace[],
        classMap: Map<FileSignature | NamespaceSignature, ArkClass[]>,
        parentMap: Map<ArkNamespace, ArkNamespace | ArkFile>
    ): void {
        while (namespaceStack.length > 0) {
            const ns = namespaceStack.shift()!;
            const nsClass: ArkClass[] = [];
            for (const arkClass of ns.getClasses()) {
                nsClass.push(arkClass);
            }
            classMap.set(ns.getNamespaceSignature(), nsClass);
            if (ns.getNamespaces().length === 0) {
                finalNamespaces.push(ns);
            } else {
                for (const nsns of ns.getNamespaces()) {
                    namespaceStack.push(nsns);
                    parentMap.set(nsns, ns);
                }
            }
        }
    }

    private addNSExportedClasses(
        finalNamespaces: ArkNamespace[],
        classMap: Map<FileSignature | NamespaceSignature, ArkClass[]>,
        parentMap: Map<ArkNamespace, ArkNamespace | ArkFile>
    ): void {
        while (finalNamespaces.length > 0) {
            const finalNS = finalNamespaces.shift()!;
            const exportClass = [];
            for (const arkClass of finalNS.getClasses()) {
                if (arkClass.isExported()) {
                    exportClass.push(arkClass);
                }
            }
            const parent = parentMap.get(finalNS)!;
            if (parent instanceof ArkNamespace) {
                classMap.get(parent.getNamespaceSignature())?.push(...exportClass);
            } else if (parent instanceof ArkFile) {
                classMap.get(parent.getFileSignature())?.push(...exportClass);
            }
            let p = finalNS;
            while (!(parentMap.get(p) instanceof ArkFile) && p.isExported()) {
                const grandParent = parentMap.get(parentMap.get(p)! as ArkNamespace);
                if (grandParent instanceof ArkNamespace) {
                    classMap.get(grandParent.getNamespaceSignature())?.push(...exportClass);
                    p = parentMap.get(p)! as ArkNamespace;
                } else if (grandParent instanceof ArkFile) {
                    classMap.get(grandParent.getFileSignature())?.push(...exportClass);
                    break;
                }
            }
            if (parent instanceof ArkNamespace && !finalNamespaces.includes(parent)) {
                finalNamespaces.push(parent);
            }
        }
    }

    private addFileImportedClasses(file: ArkFile, classMap: Map<FileSignature | NamespaceSignature, ArkClass[]>): void {
        const importClasses: ArkClass[] = [];
        const importNameSpaces: ArkNamespace[] = [];
        for (const importInfo of file.getImportInfos()) {
            const importClass = ModelUtils.getClassInImportInfoWithName(importInfo.getImportClauseName(), file);
            if (importClass && !importClasses.includes(importClass)) {
                importClasses.push(importClass);
                continue;
            }
            const importNameSpace = ModelUtils.getNamespaceInImportInfoWithName(importInfo.getImportClauseName(), file);
            if (importNameSpace && !importNameSpaces.includes(importNameSpace)) {
                try {
                    // Legacy issue: only counted project file namespaces, not internal SDK file imports
                    const importNameSpaceClasses = classMap.get(importNameSpace.getNamespaceSignature())!;
                    importClasses.push(...importNameSpaceClasses.filter(c => !importClasses.includes(c) && c.getName() !== DEFAULT_ARK_CLASS_NAME));
                } catch {}
            }
        }
        const fileClasses = classMap.get(file.getFileSignature())!;
        fileClasses.push(...importClasses.filter(c => !fileClasses.includes(c)));
        // Child nodes add parent node's classes
        const namespaceStack = [...file.getNamespaces()];
        for (const ns of namespaceStack) {
            const nsClasses = classMap.get(ns.getNamespaceSignature())!;
            nsClasses.push(...fileClasses.filter(c => !nsClasses.includes(c) && c.getName() !== DEFAULT_ARK_CLASS_NAME));
        }
        while (namespaceStack.length > 0) {
            const ns = namespaceStack.shift()!;
            const nsClasses = classMap.get(ns.getNamespaceSignature())!;
            for (const nsns of ns.getNamespaces()) {
                const nsnsClasses = classMap.get(nsns.getNamespaceSignature())!;
                nsnsClasses.push(...nsClasses.filter(c => !nsnsClasses.includes(c) && c.getName() !== DEFAULT_ARK_CLASS_NAME));
                namespaceStack.push(nsns);
            }
        }
    }

    public getClassMap(): Map<FileSignature | NamespaceSignature, ArkClass[]> {
        const classMap: Map<FileSignature | NamespaceSignature, ArkClass[]> = new Map();
        for (const file of this.getFiles()) {
            const fileClass: ArkClass[] = [];
            const namespaceStack: ArkNamespace[] = [];
            const parentMap: Map<ArkNamespace, ArkNamespace | ArkFile> = new Map();
            const finalNamespaces: ArkNamespace[] = [];
            for (const arkClass of file.getClasses()) {
                fileClass.push(arkClass);
            }
            for (const ns of file.getNamespaces()) {
                namespaceStack.push(ns);
                parentMap.set(ns, file);
            }

            classMap.set(file.getFileSignature(), fileClass);
            // The first round of traversal, adding each namespace's own class
            this.addNSClasses(namespaceStack, finalNamespaces, classMap, parentMap);

            // The second round of traversal involves adding the export class of the parent node and the child node
            this.addNSExportedClasses(finalNamespaces, classMap, parentMap);
        }

        for (const file of this.getFiles()) {
            // Add the imported class to the file, including ns
            this.addFileImportedClasses(file, classMap);
        }
        return classMap;
    }

    private addNSLocals(
        namespaceStack: ArkNamespace[],
        finalNamespaces: ArkNamespace[],
        parentMap: Map<ArkNamespace, ArkNamespace | ArkFile>,
        globalVariableMap: Map<FileSignature | NamespaceSignature, Local[]>
    ): void {
        while (namespaceStack.length > 0) {
            const ns = namespaceStack.shift()!;
            const nsGlobalLocals: Local[] = [];
            ns.getDefaultClass()
                .getDefaultArkMethod()!
                .getBody()
                ?.getLocals()
                .forEach(local => {
                    if (local.getDeclaringStmt() && local.getName() !== 'this' && local.getName()[0] !== '$') {
                        nsGlobalLocals.push(local);
                    }
                });
            globalVariableMap.set(ns.getNamespaceSignature(), nsGlobalLocals);
            if (ns.getNamespaces().length === 0) {
                finalNamespaces.push(ns);
            } else {
                for (const nsns of ns.getNamespaces()) {
                    namespaceStack.push(nsns);
                    parentMap.set(nsns, ns);
                }
            }
        }
    }

    private addNSExportedLocals(
        finalNamespaces: ArkNamespace[],
        globalVariableMap: Map<FileSignature | NamespaceSignature, Local[]>,
        parentMap: Map<ArkNamespace, ArkNamespace | ArkFile>
    ): void {
        while (finalNamespaces.length > 0) {
            const finalNS = finalNamespaces.shift()!;
            const exportLocal = [];
            for (const exportInfo of finalNS.getExportInfos()) {
                if (exportInfo.getExportClauseType() === ExportType.LOCAL && exportInfo.getArkExport()) {
                    exportLocal.push(exportInfo.getArkExport() as Local);
                }
            }
            const parent = parentMap.get(finalNS)!;
            if (parent instanceof ArkNamespace) {
                globalVariableMap.get(parent.getNamespaceSignature())?.push(...exportLocal);
            } else if (parent instanceof ArkFile) {
                globalVariableMap.get(parent.getFileSignature())?.push(...exportLocal);
            }
            let p = finalNS;
            while (!(parentMap.get(p) instanceof ArkFile) && p.isExported()) {
                const grandParent = parentMap.get(parentMap.get(p)! as ArkNamespace);
                if (grandParent instanceof ArkNamespace) {
                    globalVariableMap.get(grandParent.getNamespaceSignature())?.push(...exportLocal);
                    p = parentMap.get(p)! as ArkNamespace;
                } else if (grandParent instanceof ArkFile) {
                    globalVariableMap.get(grandParent.getFileSignature())?.push(...exportLocal);
                    break;
                }
            }
            if (parent instanceof ArkNamespace && !finalNamespaces.includes(parent)) {
                finalNamespaces.push(parent);
            }
        }
    }

    private addFileImportLocals(file: ArkFile, globalVariableMap: Map<FileSignature | NamespaceSignature, Local[]>): void {
        const importLocals: Local[] = [];
        const importNameSpaces: ArkNamespace[] = [];
        for (const importInfo of file.getImportInfos()) {
            const importLocal = ModelUtils.getLocalInImportInfoWithName(importInfo.getImportClauseName(), file);
            if (importLocal && !importLocals.includes(importLocal)) {
                importLocals.push(importLocal);
            }
            const importNameSpace = ModelUtils.getNamespaceInImportInfoWithName(importInfo.getImportClauseName(), file);
            if (importNameSpace && !importNameSpaces.includes(importNameSpace)) {
                try {
                    // Legacy issue: only counted project files, not internal SDK file imports
                    const importNameSpaceClasses = globalVariableMap.get(importNameSpace.getNamespaceSignature())!;
                    importLocals.push(...importNameSpaceClasses.filter(c => !importLocals.includes(c) && c.getName() !== DEFAULT_ARK_CLASS_NAME));
                } catch {}
            }
        }
        const fileLocals = globalVariableMap.get(file.getFileSignature())!;
        fileLocals.push(...importLocals.filter(c => !fileLocals.includes(c)));
        // Child node plus local of parent node
        const namespaceStack = [...file.getNamespaces()];
        for (const ns of namespaceStack) {
            const nsLocals = globalVariableMap.get(ns.getNamespaceSignature())!;
            const nsLocalNameSet = new Set<string>(nsLocals.map(item => item.getName()));
            for (const local of fileLocals) {
                if (!nsLocalNameSet.has(local.getName())) {
                    nsLocals.push(local);
                }
            }
        }
        while (namespaceStack.length > 0) {
            const ns = namespaceStack.shift()!;
            const nsLocals = globalVariableMap.get(ns.getNamespaceSignature())!;
            for (const nsns of ns.getNamespaces()) {
                this.handleNestedNSLocals(nsns, nsLocals, globalVariableMap);
                namespaceStack.push(nsns);
            }
        }
    }

    private handleNestedNSLocals(nsns: ArkNamespace, nsLocals: Local[], globalVariableMap: Map<FileSignature | NamespaceSignature, Local[]>): void {
        const nsnsLocals = globalVariableMap.get(nsns.getNamespaceSignature())!;
        const nsnsLocalNameSet = new Set<string>(nsnsLocals.map(item => item.getName()));
        for (const local of nsLocals) {
            if (!nsnsLocalNameSet.has(local.getName())) {
                nsnsLocals.push(local);
            }
        }
    }

    public getGlobalVariableMap(): Map<FileSignature | NamespaceSignature, Local[]> {
        const globalVariableMap: Map<FileSignature | NamespaceSignature, Local[]> = new Map();
        for (const file of this.getFiles()) {
            const namespaceStack: ArkNamespace[] = [];
            const parentMap: Map<ArkNamespace, ArkNamespace | ArkFile> = new Map();
            const finalNamespaces: ArkNamespace[] = [];
            const globalLocals: Local[] = [];
            file.getDefaultClass()
                ?.getDefaultArkMethod()!
                .getBody()
                ?.getLocals()
                .forEach(local => {
                    if (local.getDeclaringStmt() && local.getName() !== 'this' && local.getName()[0] !== '$') {
                        globalLocals.push(local);
                    }
                });
            globalVariableMap.set(file.getFileSignature(), globalLocals);
            for (const ns of file.getNamespaces()) {
                namespaceStack.push(ns);
                parentMap.set(ns, file);
            }
            // The first round of traversal, plus each namespace's own local
            this.addNSLocals(namespaceStack, finalNamespaces, parentMap, globalVariableMap);

            // The second round of traversal includes the local export of the parent node and the child node
            this.addNSExportedLocals(finalNamespaces, globalVariableMap, parentMap);
        }

        for (const file of this.getFiles()) {
            // File adds imported locals, including namespaces
            this.addFileImportLocals(file, globalVariableMap);
        }
        return globalVariableMap;
    }

    public getStaticInitMethods(): ArkMethod[] {
        const staticInitMethods: ArkMethod[] = [];
        for (const method of Array.from(this.getMethodsMap(true).values())) {
            if (method.getName() === STATIC_INIT_METHOD_NAME) {
                staticInitMethods.push(method);
            }
        }
        return staticInitMethods;
    }

    public buildClassDone(): boolean {
        return this.buildStage >= SceneBuildStage.CLASS_DONE;
    }

    public getModuleScene(moduleName: string): ModuleScene | undefined {
        return this.moduleScenesMap.get(moduleName);
    }

    public getModuleSceneMap(): Map<string, ModuleScene> {
        return this.moduleScenesMap;
    }

    public getGlobalModule2PathMapping(): { [k: string]: string[] } | undefined {
        return this.globalModule2PathMapping;
    }

    public getbaseUrl(): string | undefined {
        return this.baseUrl;
    }
}

export class ModuleScene {
    private projectScene: Scene;
    private moduleName: string = '';
    private modulePath: string = '';
    private moduleFileMap: Map<string, ArkFile> = new Map();

    private moduleOhPkgFilePath: string = '';
    private ohPkgContent: { [k: string]: unknown } = {};

    constructor(projectScene: Scene) {
        this.projectScene = projectScene;
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

    public getModuleFilesMap(): Map<string, ArkFile> {
        return this.moduleFileMap;
    }

    public addArkFile(arkFile: ArkFile): void {
        this.moduleFileMap.set(arkFile.getFileSignature().toMapKey(), arkFile);
    }

    private genArkFiles(supportFileExts: string[]): void {
        getAllFiles(this.modulePath, supportFileExts, this.projectScene.getOptions().ignoreFileNames).forEach(file => {
            logger.trace('=== parse file:', file);
            try {
                const arkFile: ArkFile = new ArkFile(FileUtils.getFileLanguage(file, this.projectScene.getFileLanguages()));
                arkFile.setScene(this.projectScene);
                arkFile.setModuleScene(this);
                buildArkFileFromFile(file, this.projectScene.getRealProjectDir(), arkFile, this.projectScene.getProjectName());
                this.projectScene.setFile(arkFile);
            } catch (error) {
                logger.error('Error parsing file:', file, error);
                this.projectScene.getUnhandledFilePaths().push(file);
                return;
            }
        });
    }
}
