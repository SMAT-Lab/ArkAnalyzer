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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Scene } from '../../src/Scene';
import { SceneConfig } from '../../src/Config';
import { ModuleAnalysisConfig } from '../../src/frontend/common/ModuleAnalysisConfig';
import { ModuleDepthLevel } from '../../src/frontend/common/ModuleDepth';
import { ArkModule, ModuleLoadState, ModuleType } from '../../src/core/model/ArkModule';
import { ModuleBuilder } from '../../src/frontend/common/ModuleBuilder';
import { ModelUtils } from '../../src/core/common/ModelUtils';
import { TypeInference } from '../../src/core/common/TypeInference';

/**
 * Create a temp project with 2 PROJECT modules (entry depends on library) and 1 OH_MODULES package.
 */
function createTestProject(tmpDir: string): void {
    // build-profile.json5 with entry and library modules
    fs.writeFileSync(
        path.join(tmpDir, 'build-profile.json5'),
        JSON.stringify({
            modules: [
                { name: 'entry', srcPath: './entry' },
                { name: 'library', srcPath: './library' },
            ],
        })
    );

    // entry module with dependency on library
    fs.mkdirSync(path.join(tmpDir, 'entry'), { recursive: true });
    fs.writeFileSync(
        path.join(tmpDir, 'entry', 'oh-package.json5'),
        JSON.stringify({
            name: '@ohos/entry',
            version: '1.0.0',
            dependencies: {
                library: '../library',
            },
        })
    );

    // library module (no dependencies)
    fs.mkdirSync(path.join(tmpDir, 'library'), { recursive: true });
    fs.writeFileSync(
        path.join(tmpDir, 'library', 'oh-package.json5'),
        JSON.stringify({
            name: '@ohos/library',
            version: '1.0.0',
        })
    );

    // oh_modules package
    fs.mkdirSync(path.join(tmpDir, 'oh_modules', 'some-pkg'), { recursive: true });
}

describe('analyseByModule integration tests', () => {
    let tmpDir: string;
    let realProjectDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'analyse-by-module-'));
        createTestProject(tmpDir);
        realProjectDir = fs.realpathSync(tmpDir);
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    /** Create a Scene configured with the test project. */
    function createScene(): Scene {
        const sceneConfig = new SceneConfig();
        sceneConfig.buildFromProjectDir(tmpDir);
        const scene = new Scene();
        scene.config(sceneConfig);
        return scene;
    }

    /** Create a config that includes PROJECT modules as targets. */
    function createProjectConfig(): ModuleAnalysisConfig {
        const config = new ModuleAnalysisConfig();
        config.setIncludeType(ModuleType.PROJECT, true);
        return config;
    }

    it('flow: prepareModules -> analyzeModuleDependencies -> buildSdkModules -> callback called in topo order', () => {
        const scene = createScene();

        const calledModules: ArkModule[] = [];
        scene.analyseByModule(module => {
            calledModules.push(module);
        }, createProjectConfig());

        // Verify preprocessing was done
        expect(scene.isModulesRegistered()).toBe(true);

        // Verify callback was called for exactly 2 PROJECT modules (OH_MODULES not included by default)
        expect(calledModules.length).toBe(2);

        // Verify all called modules are PROJECT
        const moduleTypes = calledModules.map(m => m.getModuleType());
        expect(moduleTypes.filter(t => t === ModuleType.PROJECT).length).toBe(2);
        expect(moduleTypes.filter(t => t === ModuleType.SDK).length).toBe(0);

        // Verify library comes before entry (dependency order)
        const entryPath = path.resolve(realProjectDir, 'entry');
        const libraryPath = path.resolve(realProjectDir, 'library');
        const entryIdx = calledModules.findIndex(m => m.getModulePath() === entryPath);
        const libraryIdx = calledModules.findIndex(m => m.getModulePath() === libraryPath);
        expect(libraryIdx).toBe(0);
        expect(entryIdx).toBe(1);
    });

    it('idempotent: second call does not repeat preprocessing', () => {
        const scene = createScene();

        // First call - does all preprocessing
        scene.analyseByModule(() => {}, createProjectConfig());

        expect(scene.isModulesRegistered()).toBe(true);

        // Spy on preprocessing methods on the prototype (analyseByModule creates its own builder).
        // Both prepareModules and analyzeModuleDependencies are guarded by modulesRegistered flag.
        const spyModules = vi.spyOn(ModuleBuilder.prototype, 'prepareModules');
        const spyDeps = vi.spyOn(ModuleBuilder.prototype, 'analyzeModuleDependencies');

        // Second call - both skipped (modulesRegistered is true)
        scene.analyseByModule(() => {}, createProjectConfig());

        expect(spyModules).toHaveBeenCalledTimes(0);
        expect(spyDeps).toHaveBeenCalledTimes(0);

        spyModules.mockRestore();
        spyDeps.mockRestore();
    });

    it('SDK modules: not in callback', () => {
        const scene = createScene();
        const builder = new ModuleBuilder(scene);

        // Register an SDK module before calling analyseByModule
        const sdkPath = path.join(realProjectDir, 'fake-sdk');
        fs.mkdirSync(sdkPath, { recursive: true });
        const sdkModule = builder.registerModule(sdkPath, 'fakeSdk');
        sdkModule.setModuleType(ModuleType.SDK);

        const calledModules: ArkModule[] = [];
        scene.analyseByModule(module => {
            calledModules.push(module);
        }, createProjectConfig());

        // Verify callback contains exactly 2 PROJECT modules (no SDK, OH_MODULES not included by default)
        expect(calledModules.length).toBe(2);

        // Verify called module paths do not include the SDK path
        const calledPaths = calledModules.map(m => m.getModulePath());
        expect(calledPaths).toEqual(expect.not.arrayContaining([sdkPath]));
    });

    it('target module filtering: only target PROJECT modules get callback', () => {
        const scene = createScene();
        const builder = new ModuleBuilder(scene);
        builder.prepareModules();

        const entryPath = path.resolve(realProjectDir, 'entry');
        const entryModule = builder.getModuleByPath(entryPath)!;
        const entryId = builder.getModuleId(entryModule);

        const config = new ModuleAnalysisConfig();
        config.setIncludeType(ModuleType.PROJECT, false);
        config.setIncludeType(ModuleType.OH_MODULES, false);
        config.addTargetModuleId(entryId);

        const calledModules: ArkModule[] = [];
        scene.analyseByModule(module => {
            calledModules.push(module);
        }, config);

        // Only the entry module should be in callback
        expect(calledModules.length).toBe(1);
        expect(calledModules[0].getModulePath()).toBe(entryPath);
    });

    it('no target config: all PROJECT modules get callback (OH_MODULES not included by default)', () => {
        const scene = createScene();

        const calledModules: ArkModule[] = [];
        scene.analyseByModule(module => {
            calledModules.push(module);
        }, createProjectConfig());

        // Only PROJECT modules are included by default (OH_MODULES excluded)
        const moduleTypes = calledModules.map(m => m.getModuleType());
        expect(moduleTypes.filter(t => t === ModuleType.PROJECT).length).toBe(2);
        expect(moduleTypes.filter(t => t === ModuleType.OH_MODULES).length).toBe(0);
        expect(moduleTypes.filter(t => t === ModuleType.SDK).length).toBe(0);
    });

    it('callback parameters: module and scene are correct', () => {
        const scene = createScene();

        scene.analyseByModule((module, scn) => {
            expect(module).toBeInstanceOf(ArkModule);
            expect(scn).toBe(scene);
        }, createProjectConfig());
    });

    it('modules are loaded before callback is called', () => {
        const scene = createScene();

        scene.analyseByModule(module => {
            // Every module passed to the callback must be loaded (default BODIES)
            expect(module.getLoadState()).toBe(ModuleLoadState.BODIES);
        }, createProjectConfig());
    });

    it('loadModule is called for all modules in topoOrder, including non-target dependencies', () => {
        const scene = createScene();
        const builder = new ModuleBuilder(scene);
        builder.prepareModules();

        const entryPath = path.resolve(realProjectDir, 'entry');
        const libraryPath = path.resolve(realProjectDir, 'library');
        const entryId = builder.getModuleId(builder.getModuleByPath(entryPath)!);

        const config = new ModuleAnalysisConfig();
        config.setIncludeType(ModuleType.PROJECT, false);
        config.setIncludeType(ModuleType.OH_MODULES, false);
        config.addTargetModuleId(entryId);

        let entryWasLoaded = false;
        scene.analyseByModule(module => {
            expect(module.getLoadState()).toBe(ModuleLoadState.BODIES);
            if (module.getModulePath() === entryPath) {
                entryWasLoaded = true;
                // The non-target dependency (library) must also be loaded at this point
                // Dependencies default to SIGNATURES level
                const libraryModule = builder.getModuleByPath(libraryPath)!;
                expect(libraryModule.getLoadState()).toBe(ModuleLoadState.SIGNATURES);
            }
        }, config);

        expect(entryWasLoaded).toBe(true);

        // After analyseByModule completes, modules persist in cache (not unloaded)
        const entryModule = builder.getModuleByPath(entryPath)!;
        expect(entryModule.getLoadState()).toBe(ModuleLoadState.BODIES);

        const libraryModule = builder.getModuleByPath(libraryPath)!;
        expect(libraryModule.getLoadState()).toBe(ModuleLoadState.SIGNATURES);
    });

    it('IMPORTS level: SDK and non-SDK modules have file dependency graphs', () => {
        // Add .ets source files to the entry and library modules so file dependency analysis
        // has something to analyze.
        fs.mkdirSync(path.join(tmpDir, 'entry', 'src'), { recursive: true });
        fs.writeFileSync(path.join(tmpDir, 'entry', 'src', 'a.ets'), "import { foo } from './b';\n");
        fs.writeFileSync(path.join(tmpDir, 'entry', 'src', 'b.ets'), 'export const foo = 1;\n');
        fs.mkdirSync(path.join(tmpDir, 'library', 'src'), { recursive: true });
        fs.writeFileSync(path.join(tmpDir, 'library', 'src', 'c.ets'), 'export const bar = 2;\n');

        const scene = createScene();
        const config = new ModuleAnalysisConfig();
        config.setIncludeType(ModuleType.PROJECT, true);
        config.setLoadLevel(ModuleDepthLevel.IMPORTS);

        const verifiedModules: ArkModule[] = [];
        scene.analyseByModule(module => {
            // PROJECT modules are loaded at IMPORTS level with source files, so they must have
            // file dependency graphs and a file topological order.
            if (module.getModuleType() === ModuleType.PROJECT) {
                expect(module.hasFileTopoOrder()).toBe(true);
                expect(module.getFileDepGraph()).toBeDefined();
                verifiedModules.push(module);
            }
        }, config);

        // Both PROJECT modules (entry and library) must have been verified.
        expect(verifiedModules.length).toBe(2);
    });

    it('SIGNATURES level: module signatures built without method bodies', () => {
        // Add a source file with a class + method to the entry module so signature building
        // has something to build.
        fs.mkdirSync(path.join(tmpDir, 'entry', 'src'), { recursive: true });
        fs.writeFileSync(path.join(tmpDir, 'entry', 'src', 'cls.ets'), 'export class MyClass {\n  foo(a: number): string { return a.toString(); }\n}\n');

        const scene = createScene();
        const config = new ModuleAnalysisConfig();
        config.setIncludeType(ModuleType.PROJECT, true);
        config.setLoadLevel(ModuleDepthLevel.SIGNATURES);

        const verifiedModules: ArkModule[] = [];
        scene.analyseByModule(module => {
            if (module.getModuleType() !== ModuleType.PROJECT) {
                return;
            }
            // Every PROJECT module is loaded to the SIGNATURES level (no longer capped to IMPORTS)
            expect(module.getLoadState()).toBe(ModuleLoadState.SIGNATURES);
            const clsFile = [...module.getFilesMap().values()].find(f => path.basename(f.getFilePath()) === 'cls.ets');
            if (clsFile) {
                // SIGNATURES builds namespace/class/method signatures ...
                const myClass = ModelUtils.getAllClassesInFile(clsFile).find(c => c.getName() === 'MyClass');
                expect(myClass).toBeDefined();
                const foo = myClass!.getMethods().find(m => m.getName() === 'foo');
                expect(foo).toBeDefined();
                // ... but the method body is NOT built
                expect(foo!.getBody()).toBeUndefined();
            }
            verifiedModules.push(module);
        }, config);

        // Both PROJECT modules (entry and library) reached the callback.
        expect(verifiedModules.length).toBe(2);
    });

    it('BODIES level: module method bodies built', () => {
        // Add a source file with a class + method to the entry module so body building
        // has something to build.
        fs.mkdirSync(path.join(tmpDir, 'entry', 'src'), { recursive: true });
        fs.writeFileSync(path.join(tmpDir, 'entry', 'src', 'cls.ets'), 'export class MyClass {\n  foo(a: number): string { return a.toString(); }\n}\n');

        const scene = createScene();
        const config = new ModuleAnalysisConfig();
        config.setIncludeType(ModuleType.PROJECT, true);
        config.setLoadLevel(ModuleDepthLevel.BODIES);

        const verifiedModules: ArkModule[] = [];
        scene.analyseByModule(module => {
            if (module.getModuleType() !== ModuleType.PROJECT) {
                return;
            }
            // Every PROJECT module is loaded to the BODIES level
            expect(module.getLoadState()).toBe(ModuleLoadState.BODIES);
            const clsFile = [...module.getFilesMap().values()].find(f => path.basename(f.getFilePath()) === 'cls.ets');
            if (clsFile) {
                // BODIES builds signatures AND method bodies (ArkBody/CFG/Stmt/Expr)
                const myClass = ModelUtils.getAllClassesInFile(clsFile).find(c => c.getName() === 'MyClass');
                expect(myClass).toBeDefined();
                const foo = myClass!.getMethods().find(m => m.getName() === 'foo');
                expect(foo).toBeDefined();
                // The method body IS built
                expect(foo!.getBody()).toBeDefined();
                expect(foo!.getBody()!.getCfg()).toBeDefined();
                // BodyBuilder has been freed after body building
                expect(foo!.getBodyBuilder()).toBeUndefined();
            }
            verifiedModules.push(module);
        }, config);

        // Both PROJECT modules (entry and library) reached the callback.
        expect(verifiedModules.length).toBe(2);
    });

    it('BODIES level with type inference: return type resolved', () => {
        // Method without explicit return type — inference should resolve it from the return stmt.
        fs.mkdirSync(path.join(tmpDir, 'entry', 'src'), { recursive: true });
        fs.writeFileSync(path.join(tmpDir, 'entry', 'src', 'cls.ets'), 'export class MyClass {\n  foo() { return 42; }\n}\n');

        const scene = createScene();
        const config = new ModuleAnalysisConfig();
        config.setIncludeType(ModuleType.PROJECT, true);
        config.setLoadLevel(ModuleDepthLevel.BODIES);

        const verifiedModules: ArkModule[] = [];
        scene.analyseByModule(module => {
            if (module.getModuleType() !== ModuleType.PROJECT) {
                return;
            }
            expect(module.getLoadState()).toBe(ModuleLoadState.BODIES);
            const clsFile = [...module.getFilesMap().values()].find(f => path.basename(f.getFilePath()) === 'cls.ets');
            if (clsFile) {
                const myClass = ModelUtils.getAllClassesInFile(clsFile).find(c => c.getName() === 'MyClass');
                expect(myClass).toBeDefined();
                const foo = myClass!.getMethods().find(m => m.getName() === 'foo');
                expect(foo).toBeDefined();
                // Method body is built
                expect(foo!.getBody()).toBeDefined();
                // Type inference resolved the return type (not unclear)
                const returnType = foo!.getImplementationSignature()?.getMethodSubSignature().getReturnType();
                expect(returnType).toBeDefined();
                expect(TypeInference.isUnclearType(returnType!)).toBe(false);
            }
            verifiedModules.push(module);
        }, config);

        expect(verifiedModules.length).toBe(2);
    });

    it('memory limit: modules evicted and reloaded correctly with small memoryLimitMB', () => {
        fs.mkdirSync(path.join(tmpDir, 'entry', 'src'), { recursive: true });
        fs.writeFileSync(path.join(tmpDir, 'entry', 'src', 'cls.ets'), 'export class MyClass {\n  foo(): number { return 42; }\n}\n');
        fs.mkdirSync(path.join(tmpDir, 'library', 'src'), { recursive: true });
        fs.writeFileSync(path.join(tmpDir, 'library', 'src', 'lib.ets'), 'export class LibClass {\n  bar(): string { return "hello"; }\n}\n');

        const sceneConfig = new SceneConfig();
        sceneConfig.buildFromProjectDir(tmpDir);
        const scene = new Scene();
        scene.config(sceneConfig);
        scene.getOptions().memoryLimitMB = 1;

        const config = new ModuleAnalysisConfig();
        config.setIncludeType(ModuleType.PROJECT, true);
        config.setLoadLevel(ModuleDepthLevel.SIGNATURES);

        const verifiedModules: ArkModule[] = [];
        scene.analyseByModule(module => {
            if (module.getModuleType() !== ModuleType.PROJECT) {
                return;
            }
            expect(module.getLoadState()).toBe(ModuleLoadState.SIGNATURES);
            for (const arkFile of module.getFilesMap().values()) {
                const classes = ModelUtils.getAllClassesInFile(arkFile);
                expect(classes.length).toBeGreaterThan(0);
            }
            verifiedModules.push(module);
        }, config);

        expect(verifiedModules.length).toBe(2);

        // With tiny memoryLimitMB, Phase 3 evicts protected dependencies as a last resort,
        // so earlier PROJECT modules are unloaded (NOT_LOADED) while the last-loaded remains.
        const projectModules = scene.getModules().filter(m => m.getModuleType() === ModuleType.PROJECT);
        expect(projectModules.length).toBe(2);
        expect(projectModules.some(m => m.getLoadState() === ModuleLoadState.NOT_LOADED)).toBe(true);
        expect(projectModules.some(m => m.getLoadState() === ModuleLoadState.SIGNATURES)).toBe(true);
    });
});
