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
import { ArkModule, ModuleLoadState, ModuleType } from '../../src/core/model/ArkModule';
import { ModuleManager } from '../../src/frontend/common/ModuleManager';

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

    /** Access the private moduleManager field for testing. */
    function getModuleManager(scene: Scene): ModuleManager {
        return (scene as unknown as { moduleManager: ModuleManager }).moduleManager;
    }

    it('flow: prepareSdkModules -> prepareModules -> analyzeModuleDependencies -> callback called in topo order', () => {
        const scene = createScene();
        const manager = getModuleManager(scene);

        const calledModules: ArkModule[] = [];
        scene.analyseByModule(module => {
            calledModules.push(module);
        });

        // Verify preprocessing was done
        expect(manager.isSdkBuilt()).toBe(true);
        expect(manager.isModulesPrepared()).toBe(true);
        expect(manager.hasTopoOrder()).toBe(true);

        // Verify callback was called for exactly 3 non-SDK modules (2 PROJECT + 1 OH_MODULES)
        expect(calledModules.length).toBe(3);

        // Verify all called modules are non-SDK
        const moduleTypes = calledModules.map(m => m.getModuleType());
        expect(moduleTypes).toEqual(expect.arrayContaining([ModuleType.PROJECT, ModuleType.OH_MODULES]));
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
        const manager = getModuleManager(scene);

        // First call - does all preprocessing
        scene.analyseByModule(() => {});

        expect(manager.isSdkBuilt()).toBe(true);
        expect(manager.isModulesPrepared()).toBe(true);
        expect(manager.hasTopoOrder()).toBe(true);

        // Spy on preprocessing methods after first call
        const spySdk = vi.spyOn(manager, 'prepareSdkModules');
        const spyModules = vi.spyOn(manager, 'prepareModules');
        const spyDeps = vi.spyOn(manager, 'analyzeModuleDependencies');

        // Second call - should skip all preprocessing
        scene.analyseByModule(() => {});

        expect(spySdk).toHaveBeenCalledTimes(0);
        expect(spyModules).toHaveBeenCalledTimes(0);
        expect(spyDeps).toHaveBeenCalledTimes(0);

        spySdk.mockRestore();
        spyModules.mockRestore();
        spyDeps.mockRestore();
    });

    it('SDK modules: not in callback', () => {
        const scene = createScene();
        const manager = getModuleManager(scene);

        // Register an SDK module before calling analyseByModule
        const sdkPath = path.join(realProjectDir, 'fake-sdk');
        fs.mkdirSync(sdkPath, { recursive: true });
        const sdkModule = manager.registerModule(sdkPath, 'fakeSdk');
        sdkModule.setModuleType(ModuleType.SDK);

        const calledModules: ArkModule[] = [];
        scene.analyseByModule(module => {
            calledModules.push(module);
        });

        // Verify callback contains exactly 3 non-SDK modules (no SDK module)
        expect(calledModules.length).toBe(3);

        // Verify called module paths do not include the SDK path
        const calledPaths = calledModules.map(m => m.getModulePath());
        expect(calledPaths).toEqual(expect.not.arrayContaining([sdkPath]));
    });

    it('target module filtering: only target PROJECT modules get callback', () => {
        const scene = createScene();

        // Get the entry module path
        const entryPath = path.resolve(realProjectDir, 'entry');

        const config = new ModuleAnalysisConfig();
        config.addTargetProjectModule(entryPath);

        const calledModules: ArkModule[] = [];
        scene.analyseByModule(module => {
            calledModules.push(module);
        }, config);

        // Only the entry module should be in callback
        expect(calledModules.length).toBe(1);
        expect(calledModules[0].getModulePath()).toBe(entryPath);
    });

    it('no target config: all PROJECT and OH_MODULES modules get callback', () => {
        const scene = createScene();

        const calledModules: ArkModule[] = [];
        scene.analyseByModule(module => {
            calledModules.push(module);
        });

        // All called modules should be PROJECT or OH_MODULES
        const moduleTypes = calledModules.map(m => m.getModuleType());
        expect(moduleTypes.filter(t => t === ModuleType.PROJECT).length).toBe(2);
        expect(moduleTypes.filter(t => t === ModuleType.OH_MODULES).length).toBe(1);
        expect(moduleTypes.filter(t => t === ModuleType.SDK).length).toBe(0);
    });

    it('callback parameters: module and scene are correct', () => {
        const scene = createScene();

        scene.analyseByModule((module, scn) => {
            expect(module).toBeInstanceOf(ArkModule);
            expect(scn).toBe(scene);
        });
    });

    it('modules are LOADED before callback is called', () => {
        const scene = createScene();

        scene.analyseByModule(module => {
            // Every module passed to the callback must already be in the LOADED state
            expect(module.getLoadState()).toBe(ModuleLoadState.LOADED);
        });
    });

    it('loadModule is called for all modules in topoOrder, including non-target dependencies', () => {
        const scene = createScene();
        const manager = getModuleManager(scene);

        const entryPath = path.resolve(realProjectDir, 'entry');
        const libraryPath = path.resolve(realProjectDir, 'library');

        const config = new ModuleAnalysisConfig();
        config.addTargetProjectModule(entryPath);

        scene.analyseByModule(() => {}, config);

        // The target (entry) must be LOADED
        const entryModule = manager.getModuleByPath(entryPath)!;
        expect(entryModule).toBeDefined();
        expect(entryModule.getLoadState()).toBe(ModuleLoadState.LOADED);

        // The non-target dependency (library) must also be LOADED, even though
        // the callback was not invoked for it.
        const libraryModule = manager.getModuleByPath(libraryPath)!;
        expect(libraryModule).toBeDefined();
        expect(libraryModule.getLoadState()).toBe(ModuleLoadState.LOADED);
    });
});
