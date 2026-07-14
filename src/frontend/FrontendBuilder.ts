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

import path from 'path';

import { Language } from '../core/model/ArkFile';
import { ModuleScene, Scene, SceneBuildStage } from '../Scene';
import { ArktsFrontend } from './arktsFrontend/ArktsFrontend';
import { CppFrontend } from './cppFrontend/CppFrontend';
import { ArkFile } from '../core/model/ArkFile';
import { ArkModule } from '../core/model/ArkModule';
import { ArkMethod } from '../core/model/ArkMethod';
import { FileSignature } from '../core/model/ArkSignature';
import { ModelUtils } from '../core/common/ModelUtils';
import { FileUtils } from '../utils/FileUtils';
import { getAllFiles } from '../utils/getAllFiles';
import Logger, { LOG_MODULE_TYPE } from '../utils/logger';
import { ModuleDepthLevel } from './common/ModuleDepth';
import { addInitInConstructor, buildDefaultConstructor, replaceSuper2Constructor } from '../core/model/builder/ArkMethodBuilder';
import { addInitInConstructor as addCxxInitInConstructor } from './cppFrontend/model/builder/ArkMethodBuilder';
import { CONSTRUCTOR_NAME } from '../core/common/TSConst';
import { OH_MODULES } from '../core/common/EtsConst';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'FrontendBuilder');

export interface FrontendParseFailure {
    filePath: string;
    reason: unknown;
}

export interface FrontendParseResult {
    arkFiles: ArkFile[];
    failedFiles: FrontendParseFailure[];
}

/**
 * Dispatches language front-ends and exposes a single build entry for {@link Scene} so the scene no longer
 * branches on {@link Language} to pick {@link import('../core/model/builder/ArkFileBuilder').buildArkFileFromFile}
 * vs the C++ builder.
 */
export class FrontendBuilder {
    private static partitionFilePaths(scene: Scene, filePaths: string[]): { cppFiles: string[]; arktsFiles: string[] } {
        const cppFiles: string[] = [];
        const arktsFiles: string[] = [];
        for (const filePath of filePaths) {
            if (FileUtils.getFileLanguage(filePath, scene.getFileLanguages()) === Language.CXX) {
                cppFiles.push(filePath);
            } else {
                arktsFiles.push(filePath);
            }
        }
        return { cppFiles, arktsFiles };
    }

    private static collectFailedFilePaths(scene: Scene, failedFiles: { filePath: string; reason: unknown }[]): void {
        for (const failed of failedFiles) {
            logger.error('Error parsing file:', failed.filePath, failed.reason);
            scene.addUnhandledFilePath(failed.filePath);
        }
    }

    public static buildFilesIntoArkFiles(scene: Scene, filePaths: string[]): void {
        const { cppFiles, arktsFiles } = this.partitionFilePaths(scene, filePaths);
        const arktsFrontend = new ArktsFrontend();
        const cppFrontend = new CppFrontend();
        const arktsResult = arktsFrontend.buildProjectFiles(scene, arktsFiles);
        const cppResult = cppFrontend.buildProjectFiles(scene, cppFiles);
        arktsResult.arkFiles.forEach(file => scene.setFile(file));
        cppResult.arkFiles.forEach(file => scene.setFile(file));
        this.collectFailedFilePaths(scene, [...arktsResult.failedFiles, ...cppResult.failedFiles]);
    }

    public static buildModuleFilesIntoArkFiles(moduleScene: ModuleScene, filePaths: string[]): void {
        const scene = moduleScene.getProjectScene();
        const { cppFiles, arktsFiles } = this.partitionFilePaths(scene, filePaths);
        const arktsFrontend = new ArktsFrontend();
        const cppFrontend = new CppFrontend();
        const arktsResult = arktsFrontend.buildProjectFiles(scene, arktsFiles);
        const cppResult = cppFrontend.buildProjectFiles(scene, cppFiles);
        [...arktsResult.arkFiles, ...cppResult.arkFiles].forEach(file => {
            file.setModuleScene(moduleScene);
            moduleScene.addArkFile(file);
            scene.setFile(file);
        });
        this.collectFailedFilePaths(scene, [...arktsResult.failedFiles, ...cppResult.failedFiles]);
    }

    /**
     * Builds a single project file into a pre-allocated {@link ArkFile} (the former `if (CXX) … else …` in `Scene`).
     */
    public static buildProjectFileIntoArkFile(scene: Scene, filePath: string, arkFile: ArkFile): void {
        if (arkFile.getLanguage() === Language.CXX) {
            new CppFrontend().buildProjectFile(scene, filePath, arkFile);
        } else {
            new ArktsFrontend().buildProjectFile(scene, filePath, arkFile);
        }
    }

    /**
     * Build all source files of an {@link ArkModule} up to the given {@link ModuleDepthLevel}.
     *
     * Scans the module directory for source files using scene options
     * (supportFileExts / ignoreFileNames), creates an {@link ArkFile} for each file, registers it
     * with the module and scene, and builds it to the requested level. Errors on individual files
     * are logged and do not abort the loop.
     *
     * @param scene - The owning {@link Scene}.
     * @param module - The module whose files are built.
     * @param level - The target depth level.
     */
    public static buildModuleFilesToLevel(scene: Scene, module: ArkModule, level: ModuleDepthLevel): void {
        const arkFiles = FrontendBuilder.createModuleFileShells(scene, module);
        for (const arkFile of arkFiles) {
            try {
                FrontendBuilder.buildArkFileToLevel(scene, arkFile.getFilePath(), arkFile, arkFile.getLanguage(), level);
            } catch (error) {
                logger.error(`Error building ArkFile for ${arkFile.getFilePath()}: ${error}`);
            }
        }
    }

    /**
     * Scan the module directory and create path-only {@link ArkFile} shells (no content parsed),
     * registering each with the module and scene.
     *
     * Each shell has language, filePath, projectDir, and fileSignature set, but no ImportInfo /
     * ExportInfo / ArkClass / ArkMethod. This is the META-level baseline; callers subsequently
     * build content via {@link buildArkFileToLevel} (IMPORTS) or {@link upgradeArkFileToLevel}
     * (SIGNATURES / BODIES).
     *
     * @param scene - The owning {@link Scene}.
     * @param module - The module whose directory is scanned.
     * @returns Array of created (and registered) ArkFile shells.
     */
    public static createModuleFileShells(scene: Scene, module: ArkModule): ArkFile[] {
        const modulePath = module.getModulePath();
        const options = scene.getOptions();
        const supportFileExts = options?.supportFileExts ?? ['.ets', '.ts'];
        // Always skip 'oh_modules' subdirectories within a module to avoid duplicate scanning
        // via symlinks: oh_modules packages are registered as separate modules by
        // registerOhModulesModules (which uses fs.readdirSync directly, not getAllFiles).
        const ignoreFileNames = [...(options?.ignoreFileNames ?? []), OH_MODULES];
        const filePaths = getAllFiles(modulePath, supportFileExts, ignoreFileNames);

        const arkFiles: ArkFile[] = [];
        for (const filePath of filePaths) {
            try {
                const language = FileUtils.getFileLanguage(filePath, scene.getFileLanguages());
                const arkFile = new ArkFile(language);
                arkFile.setScene(scene);
                arkFile.setFilePath(filePath);
                arkFile.setProjectDir(scene.getRealProjectDir());
                const fileSignature = new FileSignature(scene.getProjectName(), path.relative(scene.getRealProjectDir(), filePath));
                arkFile.setFileSignature(fileSignature);
                module.addFile(arkFile);
                arkFile.setArkModule(module);
                scene.setFile(arkFile);
                arkFiles.push(arkFile);
            } catch (error) {
                logger.error(`Error creating ArkFile shell for ${filePath}: ${error}`);
            }
        }
        return arkFiles;
    }

    /**
     * Dispatch level-aware building to the appropriate frontend.
     *
     * - META: no content is built (only the ArkFile path/basic info created by the caller).
     * - IMPORTS: lightweight import/export parsing only.
     * - SIGNATURES: full namespace/class/method signatures are built (parameters, return types)
     *   without method bodies, reusing {@link buildProjectFileIntoArkFile}. The mounted
     *   BodyBuilders are released here so the ArkFile holds signatures only (no ArkBody/CFG).
     * - BODIES: same as SIGNATURES but the mounted BodyBuilders are **retained** (not released)
     *   so that {@link buildModuleMethodBody} can build method bodies in a subsequent phase.
     */
    private static buildArkFileToLevel(scene: Scene, filePath: string, arkFile: ArkFile, language: Language, level: ModuleDepthLevel): void {
        if (level <= ModuleDepthLevel.META) {
            return;
        }
        if (level === ModuleDepthLevel.IMPORTS) {
            FrontendBuilder.buildImports(arkFile, language);
            return;
        }
        // SIGNATURES and BODIES: reuse the full file builder to build signatures and mount
        // BodyBuilders on each method implementation.
        FrontendBuilder.buildProjectFileIntoArkFile(scene, filePath, arkFile);
        if (level < ModuleDepthLevel.BODIES) {
            // SIGNATURES: release BodyBuilders so only signatures remain (no ArkBody/CFG).
            FrontendBuilder.freeBodyBuildersInFile(arkFile);
        }
        // BODIES: keep BodyBuilders mounted for phase 2 (body building in buildModuleMethodBody).
    }

    /**
     * IMPORTS level: lightweight import/export parsing only.
     */
    public static buildImports(arkFile: ArkFile, language: Language): void {
        if (language === Language.CXX) {
            new CppFrontend().buildProjectFileForImports(arkFile);
        } else {
            new ArktsFrontend().buildProjectFileForImports(arkFile);
        }
    }

    /**
     * Upgrade an existing ArkFile (whose ImportInfo/ExportInfo were already populated at IMPORTS
     * level) to SIGNATURES or BODIES by building class/method/namespace signatures on top.
     *
     * For ArkTS files, this calls {@link ArktsFrontend.buildProjectFileForSignatures} which builds
     * signatures with `skipImportExport = true`, preserving existing import/export data and
     * avoiding duplication of `export *` re-export entries (whose temp clause keys are
     * process-level auto-increment and cannot be overwritten by `Map.set`).
     *
     * For C++ files, {@link CppFrontend.buildProjectFile} is safe to re-call: C++ ImportInfo uses
     * stable clause keys (`#include "..."` / namespace names) that are overwritten by `Map.set`,
     * and C++ ExportInfo is not produced during the IMPORTS-only phase, so no duplication occurs.
     *
     * After signature building, BodyBuilders are released when the target level is SIGNATURES
     * (no ArkBody/CFG retained). For BODIES, BodyBuilders are retained so that
     * {@link buildModuleMethodBody} can build method bodies in a subsequent phase.
     *
     * @param scene - The owning {@link Scene}.
     * @param arkFile - The ArkFile to upgrade (must already have ImportInfo/ExportInfo).
     * @param language - The language of the file.
     * @param targetLevel - The target depth level (must be > IMPORTS).
     */
    public static upgradeArkFileToLevel(scene: Scene, arkFile: ArkFile, language: Language, targetLevel: ModuleDepthLevel): void {
        if (language === Language.CXX) {
            new CppFrontend().buildProjectFile(scene, arkFile.getFilePath(), arkFile);
        } else {
            new ArktsFrontend().buildProjectFileForSignatures(arkFile);
        }
        if (targetLevel < ModuleDepthLevel.BODIES) {
            FrontendBuilder.freeBodyBuildersInFile(arkFile);
        }
    }

    /**
     * Release the BodyBuilder (or CxxBodyBuilder) mounted on a method, freeing the AST/build
     * context.
     */
    private static freeMethodBodyBuilder(method: ArkMethod): void {
        const isCxxFile = method.getDeclaringArkFile()?.getLanguage() === Language.CXX;
        if (isCxxFile) {
            method.freeCxxBodyBuilder();
        } else {
            method.freeBodyBuilder();
        }
    }

    /**
     * Release the BodyBuilders mounted during signature building so the ArkFile retains only
     * signatures (no ArkBody/CFG) and does not retain AST/build context in memory. Mirrors the
     * release pattern in {@link Scene.parseAndRegisterSdkFile}.
     */
    private static freeBodyBuildersInFile(arkFile: ArkFile): void {
        for (const method of ModelUtils.getAllMethodsInFile(arkFile)) {
            FrontendBuilder.freeMethodBodyBuilder(method);
        }
    }

    /**
     * Build method bodies (ArkBody/CFG/Stmt/Expr) for all ArkFiles in the given module, then
     * run default-constructor post-processing. This is the module-scoped equivalent of
     * {@link Scene.buildAllMethodBody} + {@link Scene.updateOrAddDefaultConstructors}, following
     * the same two-phase pattern as {@link Scene.genArkFiles}.
     *
     * Phase 1 (signatures + mounted BodyBuilders) is performed earlier by
     * {@link buildModuleFilesToLevel} at {@link ModuleDepthLevel.BODIES}, which retains the
     * mounted BodyBuilders. This method performs phase 2:
     *
     * 1. Set {@link Scene.buildStage} to {@link SceneBuildStage.CLASS_DONE} (opening the
     *    {@link Scene.buildClassDone} gate) so that when BodyBuilder encounters nested/anonymous
     *    methods during body construction, their {@link ArkMethod.setBodyBuilder} calls
     *    immediately trigger {@link ArkMethod.buildBody} — recursively building nested method
     *    bodies. The previous buildStage is restored afterwards so that subsequent SIGNATURES-
     *    level module loading is unaffected.
     * 2. Collect all methods in the module's files.
     * 3. Call {@link ArkMethod.buildBody} on each (executes the retained BodyBuilder), then free
     *    the BodyBuilder to release AST/build context.
     * 4. Run {@link buildDefaultConstructor} / {@link replaceSuper2Constructor} /
     *    {@link addInitInConstructor} on the module's files (gate still open).
     *
     * Calls {@link ModelUtils.dispose} after each module's method bodies are built to release
     * global caches (implicitArkUIBuilderMethods, popMethodSignatureCache) that accumulate during
     * body building.
     *
     * @param module - The module whose files' method bodies are to be built.
     */
    public static buildModuleMethodBody(module: ArkModule): void {
        const scene = module.getScene();
        const prevStage = scene.getStage();
        scene.setBuildStage(SceneBuildStage.CLASS_DONE);
        try {
            // Phase 2a: build method bodies for all methods in the module's files.
            const methods: ArkMethod[] = [];
            for (const arkFile of module.getFilesMap().values()) {
                methods.push(...ModelUtils.getAllMethodsInFile(arkFile));
            }
            for (const method of methods) {
                try {
                    method.buildBody();
                } catch (error) {
                    logger.error('Error building body:', method.getSignature(), error);
                } finally {
                    FrontendBuilder.freeMethodBodyBuilder(method);
                }
            }

            // Phase 2b: default-constructor post-processing for the module's files.
            for (const arkFile of module.getFilesMap().values()) {
                FrontendBuilder.processDefaultConstructors(arkFile);
            }
        } finally {
            scene.setBuildStage(prevStage);
            ModelUtils.dispose();
        }
    }

    /**
     * Run {@link buildDefaultConstructor} / {@link replaceSuper2Constructor} /
     * {@link addInitInConstructor} on all classes in a file. These create/modify constructors;
     * {@link buildDefaultConstructor} builds bodies directly (without BodyBuilder), and the
     * other two only modify already-built bodies.
     */
    private static processDefaultConstructors(arkFile: ArkFile): void {
        const initInConstructorFn = arkFile.getLanguage() === Language.CXX ? addCxxInitInConstructor : addInitInConstructor;
        for (const cls of ModelUtils.getAllClassesInFile(arkFile)) {
            buildDefaultConstructor(cls);
            if (cls.isDefaultArkClass()) {
                continue;
            }
            const constructors = cls.getAllMethodsWithName(CONSTRUCTOR_NAME);
            constructors.forEach(constructor => {
                replaceSuper2Constructor(constructor);
                initInConstructorFn(constructor);
            });
        }
    }
}
