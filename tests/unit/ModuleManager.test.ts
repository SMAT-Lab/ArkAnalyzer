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

import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ModuleManager } from '../../src/frontend/common/ModuleManager';
import { ArkModule, ModuleID, ModuleLoadState, ModuleType } from '../../src/core/model/ArkModule';
import { ModuleDepGraph, DependencyType } from '../../src/core/graph/ModuleDepGraph';
import { ModuleDepthLevel } from '../../src/frontend/common/ModuleDepth';
import { ModuleAnalysisConfig } from '../../src/frontend/common/ModuleAnalysisConfig';
import { ArkFile } from '../../src/core/model/ArkFile';
import type { Scene } from '../../src/Scene';
import type { Sdk } from '../../src/Config';

const STUB_SCENE = {} as Scene;

/** Create a Scene stub whose getSceneConfig() returns a config with the given SDKs. */
function makeSdkSceneStub(sdks: Sdk[]): Scene {
    const sceneConfig = { getSdksObj: () => sdks };
    return { getSceneConfig: () => sceneConfig } as unknown as Scene;
}

/** Create a Scene stub whose getRealProjectDir() returns the given directory. */
function makeProjectSceneStub(projectDir: string): Scene {
    return { getRealProjectDir: () => projectDir } as unknown as Scene;
}

/**
 * Create a Scene stub suitable for loadModule tests: supports getOptions (supportFileExts,
 * ignoreFileNames), getFileLanguages, setFile, and getRealProjectDir.
 */
function makeLoadModuleSceneStub(): Scene {
    const filesMap = new Map<string, unknown>();
    return {
        getOptions: () => ({ supportFileExts: ['.ets', '.ts'], ignoreFileNames: [] }),
        getFileLanguages: () => new Map(),
        setFile: (file: ArkFile) => { filesMap.set(file.getFileSignature().toMapKey(), file); },
        getSceneConfig: () => undefined,
        getRealProjectDir: () => '',
    } as unknown as Scene;
}

/**
 * Build a ModuleDepGraph with the given dependency edges and inject it into the manager.
 * All currently-registered modules are added as graph nodes.
 */
function injectDepGraph(manager: ModuleManager, edges: Array<[ModuleID, ModuleID]>): ModuleDepGraph {
    const graph = new ModuleDepGraph(manager.getModuleCanonicalizer());
    for (const module of manager.modulesIterator()) {
        graph.addModule(module);
    }
    for (const [src, dst] of edges) {
        graph.addDependencyEdge(src, dst);
    }
    (manager as unknown as { depGraph: ModuleDepGraph }).depGraph = graph;
    return graph;
}

describe('ModuleManager tests', () => {
    describe('registerModule', () => {
        it('returns an ArkModule and increases the module count on first registration', () => {
            const manager = new ModuleManager(STUB_SCENE);
            expect(manager.getModuleCount()).toBe(0);
            const module = manager.registerModule('/project/entry', '@ohos/entry');
            expect(module).toBeInstanceOf(ArkModule);
            expect(module.getModulePath()).toBe('/project/entry');
            expect(module.getModuleName()).toBe('@ohos/entry');
            expect(manager.getModuleCount()).toBe(1);
        });

        it('returns the same ArkModule and does not increase the count for a duplicate path', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const first = manager.registerModule('/project/entry', '@ohos/entry');
            const second = manager.registerModule('/project/entry', 'ignored-name');
            expect(second).toBe(first);
            expect(manager.getModuleCount()).toBe(1);
            // The duplicate registration must not overwrite the stored module name.
            expect(second.getModuleName()).toBe('@ohos/entry');
        });

        it('assigns consecutive ModuleIDs across distinct paths', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const a = manager.registerModule('/project/a');
            const b = manager.registerModule('/project/b');
            const idA = manager.getModuleCanonicalizer().getId(a);
            const idB = manager.getModuleCanonicalizer().getId(b);
            expect(idB).toBe(idA + 1);
        });
    });

    describe('getModule', () => {
        it('returns the correct module for a registered ID', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const module = manager.registerModule('/project/entry');
            const id = manager.getModuleCanonicalizer().getId(module);
            expect(manager.getModule(id)).toBe(module);
        });

        it('returns undefined for a non-existent ID', () => {
            const manager = new ModuleManager(STUB_SCENE);
            expect(manager.getModule(999)).toBeUndefined();
        });
    });

    describe('getModuleByPath', () => {
        it('returns the correct module for a registered path', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const module = manager.registerModule('/project/entry');
            expect(manager.getModuleByPath('/project/entry')).toBe(module);
        });

        it('returns undefined for a non-existent path', () => {
            const manager = new ModuleManager(STUB_SCENE);
            expect(manager.getModuleByPath('/project/nonexistent')).toBeUndefined();
        });
    });

    describe('modulesIterator', () => {
        it('iterates over all registered modules in registration order', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const a = manager.registerModule('/project/a');
            const b = manager.registerModule('/project/b');
            const c = manager.registerModule('/project/c');
            const collected = [...manager.modulesIterator()];
            expect(collected).toEqual([a, b, c]);
        });

        it('skips modules whose loadState is DISPOSED', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const a = manager.registerModule('/project/a');
            const b = manager.registerModule('/project/b');
            const c = manager.registerModule('/project/c');
            b.setLoadState(ModuleLoadState.DISPOSED);
            const collected = [...manager.modulesIterator()];
            expect(collected).toEqual([a, c]);
        });
    });

    describe('resolveAlias', () => {
        it('resolves an alias to the depended-on module within the module scope', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const entry = manager.registerModule('/project/entry');
            const library = manager.registerModule('/project/library');
            const libraryId = manager.getModuleCanonicalizer().getId(library);
            const entryId = manager.getModuleCanonicalizer().getId(entry);
            entry.addDependencyAlias('@ohos/library', libraryId);

            expect(manager.resolveAlias(entryId, '@ohos/library')).toBe(library);
        });

        it('returns undefined for an unknown alias', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const entry = manager.registerModule('/project/entry');
            const entryId = manager.getModuleCanonicalizer().getId(entry);
            expect(manager.resolveAlias(entryId, '@ohos/unknown')).toBeUndefined();
        });

        it('returns undefined for a non-existent module ID', () => {
            const manager = new ModuleManager(STUB_SCENE);
            expect(manager.resolveAlias(999, '@ohos/library')).toBeUndefined();
        });

        it('resolves the same alias to different modules in different scopes', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const a = manager.registerModule('/project/a');
            const b = manager.registerModule('/project/b');
            const libA = manager.registerModule('/project/libA');
            const libB = manager.registerModule('/project/libB');
            const idA = manager.getModuleCanonicalizer().getId(a);
            const idB = manager.getModuleCanonicalizer().getId(b);
            const idLibA = manager.getModuleCanonicalizer().getId(libA);
            const idLibB = manager.getModuleCanonicalizer().getId(libB);
            a.addDependencyAlias('myLib', idLibA);
            b.addDependencyAlias('myLib', idLibB);
            expect(manager.resolveAlias(idA, 'myLib')).toBe(libA);
            expect(manager.resolveAlias(idB, 'myLib')).toBe(libB);
        });
    });

    describe('setMaxSCCGroupSize / getMaxSCCGroupSize', () => {
        it('defaults to 10', () => {
            const manager = new ModuleManager(STUB_SCENE);
            expect(manager.getMaxSCCGroupSize()).toBe(10);
        });

        it('stores and returns the configured value', () => {
            const manager = new ModuleManager(STUB_SCENE);
            manager.setMaxSCCGroupSize(25);
            expect(manager.getMaxSCCGroupSize()).toBe(25);
        });

        it('supports disabling post-processing via Number.MAX_SAFE_INTEGER', () => {
            const manager = new ModuleManager(STUB_SCENE);
            manager.setMaxSCCGroupSize(Number.MAX_SAFE_INTEGER);
            expect(manager.getMaxSCCGroupSize()).toBe(Number.MAX_SAFE_INTEGER);
        });
    });

    describe('computeModuleClosure', () => {
        it('includes the transitive closure for A -> B -> C starting from {A}', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const a = manager.registerModule('/project/a');
            const b = manager.registerModule('/project/b');
            const c = manager.registerModule('/project/c');
            const idA = manager.getModuleCanonicalizer().getId(a);
            const idB = manager.getModuleCanonicalizer().getId(b);
            const idC = manager.getModuleCanonicalizer().getId(c);
            injectDepGraph(manager, [[idA, idB], [idB, idC]]);

            const closure = manager.computeModuleClosure(new Set(['/project/a']));
            expect(closure.has(idA)).toBe(true);
            expect(closure.has(idB)).toBe(true);
            expect(closure.has(idC)).toBe(true);
            expect(closure.size).toBe(3);
        });

        it('unions the closures of multiple targets', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const a = manager.registerModule('/project/a');
            const b = manager.registerModule('/project/b');
            const c = manager.registerModule('/project/c');
            const d = manager.registerModule('/project/d');
            const e = manager.registerModule('/project/e');
            const idA = manager.getModuleCanonicalizer().getId(a);
            const idB = manager.getModuleCanonicalizer().getId(b);
            const idC = manager.getModuleCanonicalizer().getId(c);
            const idD = manager.getModuleCanonicalizer().getId(d);
            const idE = manager.getModuleCanonicalizer().getId(e);
            injectDepGraph(manager, [[idA, idB], [idB, idC], [idD, idE]]);

            const closure = manager.computeModuleClosure(new Set(['/project/a', '/project/d']));
            expect(closure.has(idA)).toBe(true);
            expect(closure.has(idB)).toBe(true);
            expect(closure.has(idC)).toBe(true);
            expect(closure.has(idD)).toBe(true);
            expect(closure.has(idE)).toBe(true);
            expect(closure.size).toBe(5);
        });

        it('skips non-existent paths without throwing', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const a = manager.registerModule('/project/a');
            const idA = manager.getModuleCanonicalizer().getId(a);
            const closure = manager.computeModuleClosure(new Set(['/project/a', '/project/nonexistent']));
            expect(closure.has(idA)).toBe(true);
            expect(closure.size).toBe(1);
        });

        it('does not include SDK modules in the closure', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const a = manager.registerModule('/project/a');
            const sdk = manager.registerModule('/sdk/ets');
            const idA = manager.getModuleCanonicalizer().getId(a);
            const idSdk = manager.getModuleCanonicalizer().getId(sdk);
            sdk.setModuleType(ModuleType.SDK);
            injectDepGraph(manager, [[idA, idSdk]]);

            const closure = manager.computeModuleClosure(new Set(['/project/a']));
            expect(closure.has(idA)).toBe(true);
            expect(closure.has(idSdk)).toBe(false);
            expect(closure.size).toBe(1);
        });

        it('handles cyclic dependencies without infinite recursion', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const a = manager.registerModule('/project/a');
            const b = manager.registerModule('/project/b');
            const idA = manager.getModuleCanonicalizer().getId(a);
            const idB = manager.getModuleCanonicalizer().getId(b);
            injectDepGraph(manager, [[idA, idB], [idB, idA]]);

            const closure = manager.computeModuleClosure(new Set(['/project/a']));
            expect(closure.has(idA)).toBe(true);
            expect(closure.has(idB)).toBe(true);
            expect(closure.size).toBe(2);
        });

        it('returns an empty set when no target path is registered', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const closure = manager.computeModuleClosure(new Set(['/project/nonexistent']));
            expect(closure.size).toBe(0);
        });
    });

    describe('getFilteredTopoOrder', () => {
        it('filters the topological order to only include IDs in the closure', () => {
            const manager = new ModuleManager(STUB_SCENE);
            manager.registerModule('/project/a');
            manager.registerModule('/project/b');
            manager.registerModule('/project/c');
            manager.registerModule('/project/d');
            const idA = manager.getModuleCanonicalizer().getId(manager.getModuleByPath('/project/a')!);
            const idB = manager.getModuleCanonicalizer().getId(manager.getModuleByPath('/project/b')!);
            const idC = manager.getModuleCanonicalizer().getId(manager.getModuleByPath('/project/c')!);
            const idD = manager.getModuleCanonicalizer().getId(manager.getModuleByPath('/project/d')!);
            // topoOrder is populated by refineSCCGroups inside analyzeModuleDependencies; inject a
            // depGraph with a preset topoOrder here so the filtering behavior can be verified in isolation.
            const graph = injectDepGraph(manager, []);
            (graph as unknown as { topoOrder: ModuleID[] }).topoOrder = [idA, idB, idC, idD];

            const filtered = manager.getFilteredTopoOrder(new Set<ModuleID>([idB, idD]));
            expect(filtered).toEqual([idB, idD]);
        });

        it('returns an empty array when the closure is empty', () => {
            const manager = new ModuleManager(STUB_SCENE);
            manager.registerModule('/project/a');
            const idA = manager.getModuleCanonicalizer().getId(manager.getModuleByPath('/project/a')!);
            const graph = injectDepGraph(manager, []);
            (graph as unknown as { topoOrder: ModuleID[] }).topoOrder = [idA];
            expect(manager.getFilteredTopoOrder(new Set<ModuleID>())).toEqual([]);
        });

        it('returns an empty array when topoOrder is empty', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const closure = new Set<ModuleID>([0, 1]);
            expect(manager.getFilteredTopoOrder(closure)).toEqual([]);
        });
    });

    describe('initial state flags', () => {
        it('reports false for isSdkBuilt, isModulesPrepared and hasTopoOrder before any build step', () => {
            const manager = new ModuleManager(STUB_SCENE);
            expect(manager.isSdkBuilt()).toBe(false);
            expect(manager.isModulesPrepared()).toBe(false);
            expect(manager.hasTopoOrder()).toBe(false);
        });

        it('returns an empty topological order and SCC groups before dependency analysis', () => {
            const manager = new ModuleManager(STUB_SCENE);
            expect(manager.getTopoOrder()).toEqual([]);
            expect(manager.getSCCGroups().size).toBe(0);
            expect(manager.getDepGraph()).toBeUndefined();
        });
    });

    describe('getModuleCanonicalizer', () => {
        it('returns the canonicalizer shared with registered modules', () => {
            const manager = new ModuleManager(STUB_SCENE);
            const module = manager.registerModule('/project/entry');
            const canonicalizer = manager.getModuleCanonicalizer();
            expect(canonicalizer.size()).toBe(1);
            expect(canonicalizer.get(0)).toBe(module);
        });
    });

    describe('prepareSdkModules', () => {
        it('registers SDK modules with moduleType=SDK', () => {
            const sdks: Sdk[] = [
                { name: 'etsSdk', path: '/sdk/ets', moduleName: '' },
                { name: 'hmsSdk', path: '/sdk/hms', moduleName: '' },
            ];
            const manager = new ModuleManager(makeSdkSceneStub(sdks));

            manager.prepareSdkModules();

            expect(manager.isSdkBuilt()).toBe(true);
            expect(manager.getModuleCount()).toBe(2);

            const etsModule = manager.getModuleByPath(path.normalize('/sdk/ets'));
            expect(etsModule).toBeDefined();
            expect(etsModule!.getModuleType()).toBe(ModuleType.SDK);
            expect(etsModule!.getModuleName()).toBe('etsSdk');

            const hmsModule = manager.getModuleByPath(path.normalize('/sdk/hms'));
            expect(hmsModule).toBeDefined();
            expect(hmsModule!.getModuleType()).toBe(ModuleType.SDK);
        });

        it('skips SDKs with moduleName set (module-level SDKs)', () => {
            const sdks: Sdk[] = [
                { name: 'etsSdk', path: '/sdk/ets', moduleName: '' },
                { name: 'moduleSdk', path: '/sdk/module', moduleName: 'entry' },
            ];
            const manager = new ModuleManager(makeSdkSceneStub(sdks));

            manager.prepareSdkModules();

            expect(manager.getModuleCount()).toBe(1);
            expect(manager.getModuleByPath(path.normalize('/sdk/ets'))).toBeDefined();
            expect(manager.getModuleByPath(path.normalize('/sdk/module'))).toBeUndefined();
        });

        it('does not build ArkFiles or perform type inference', () => {
            const sdks: Sdk[] = [{ name: 'etsSdk', path: '/sdk/ets', moduleName: '' }];
            const manager = new ModuleManager(makeSdkSceneStub(sdks));

            manager.prepareSdkModules();

            const sdkModule = manager.getModuleByPath(path.normalize('/sdk/ets'));
            expect(sdkModule).toBeDefined();
            expect(sdkModule!.getFilesMap().size).toBe(0);
            expect(sdkModule!.getLoadState()).toBe(ModuleLoadState.NOT_LOADED);
        });

        it('is idempotent — second call does not register additional modules', () => {
            const sdks: Sdk[] = [{ name: 'etsSdk', path: '/sdk/ets', moduleName: '' }];
            const manager = new ModuleManager(makeSdkSceneStub(sdks));

            manager.prepareSdkModules();
            expect(manager.getModuleCount()).toBe(1);

            manager.prepareSdkModules();
            expect(manager.getModuleCount()).toBe(1);
            expect(manager.isSdkBuilt()).toBe(true);
        });

        it('handles missing SceneConfig gracefully', () => {
            const scene = { getSceneConfig: () => undefined } as unknown as Scene;
            const manager = new ModuleManager(scene);

            manager.prepareSdkModules();

            expect(manager.isSdkBuilt()).toBe(true);
            expect(manager.getModuleCount()).toBe(0);
        });
    });

    describe('prepareModules', () => {
        it('registers PROJECT modules from build-profile.json5', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-project-'));
            try {
                fs.mkdirSync(path.join(tmpDir, 'entry'));
                fs.mkdirSync(path.join(tmpDir, 'library'));
                fs.writeFileSync(
                    path.join(tmpDir, 'build-profile.json5'),
                    JSON.stringify({
                        modules: [
                            { name: 'entry', srcPath: './entry' },
                            { name: 'library', srcPath: './library' },
                        ],
                    })
                );

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));

                manager.prepareModules();

                expect(manager.isModulesPrepared()).toBe(true);

                const entryPath = path.resolve(tmpDir, './entry');
                const libraryPath = path.resolve(tmpDir, './library');
                const entryModule = manager.getModuleByPath(entryPath);
                const libraryModule = manager.getModuleByPath(libraryPath);

                expect(entryModule).toBeDefined();
                expect(entryModule!.getModuleType()).toBe(ModuleType.PROJECT);
                expect(entryModule!.getModuleName()).toBe('entry');

                expect(libraryModule).toBeDefined();
                expect(libraryModule!.getModuleType()).toBe(ModuleType.PROJECT);
                expect(libraryModule!.getModuleName()).toBe('library');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('registers OH_MODULES modules from oh_modules directories', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-ohmod-'));
            try {
                fs.mkdirSync(path.join(tmpDir, 'entry'), { recursive: true });
                fs.writeFileSync(path.join(tmpDir, 'build-profile.json5'), JSON.stringify({ modules: [{ name: 'entry', srcPath: './entry' }] }));

                // project-level oh_modules with a package
                fs.mkdirSync(path.join(tmpDir, 'oh_modules', 'lodash'), { recursive: true });

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));

                manager.prepareModules();

                let ohModulesCount = 0;
                for (const module of manager.modulesIterator()) {
                    if (module.getModuleType() === ModuleType.OH_MODULES) {
                        ohModulesCount++;
                    }
                }
                expect(ohModulesCount).toBe(1);

                const realPath = fs.realpathSync(path.join(tmpDir, 'oh_modules', 'lodash'));
                const lodashModule = manager.getModuleByPath(realPath);
                expect(lodashModule).toBeDefined();
                expect(lodashModule!.getModuleType()).toBe(ModuleType.OH_MODULES);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('does not read oh-package.json5 (moduleName comes from build-profile, not oh-package)', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-noohpkg-'));
            try {
                fs.mkdirSync(path.join(tmpDir, 'entry'), { recursive: true });
                // Put an oh-package.json5 with a different name to verify it is NOT read
                fs.writeFileSync(path.join(tmpDir, 'entry', 'oh-package.json5'), JSON.stringify({ name: '@ohos/should-not-be-used', version: '1.0.0' }));
                fs.writeFileSync(path.join(tmpDir, 'build-profile.json5'), JSON.stringify({ modules: [{ name: 'entry', srcPath: './entry' }] }));

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));

                manager.prepareModules();

                const entryPath = path.resolve(tmpDir, './entry');
                const entryModule = manager.getModuleByPath(entryPath);
                expect(entryModule).toBeDefined();
                // moduleName should be 'entry' from build-profile, NOT '@ohos/should-not-be-used'
                expect(entryModule!.getModuleName()).toBe('entry');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('is idempotent — second call does not register additional modules', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-idem-'));
            try {
                fs.mkdirSync(path.join(tmpDir, 'entry'), { recursive: true });
                fs.writeFileSync(path.join(tmpDir, 'build-profile.json5'), JSON.stringify({ modules: [{ name: 'entry', srcPath: './entry' }] }));

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));

                manager.prepareModules();
                const countAfterFirst = manager.getModuleCount();
                expect(countAfterFirst).toBeGreaterThan(0);

                manager.prepareModules();
                expect(manager.getModuleCount()).toBe(countAfterFirst);
                expect(manager.isModulesPrepared()).toBe(true);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('deduplicates symlinks pointing to the same real directory', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-symlink-'));
            try {
                // Create a real package directory
                const realPkgDir = path.join(tmpDir, 'real-packages', 'shared-lib');
                fs.mkdirSync(realPkgDir, { recursive: true });

                // Project structure with one PROJECT module
                fs.mkdirSync(path.join(tmpDir, 'entry'), { recursive: true });
                fs.writeFileSync(path.join(tmpDir, 'build-profile.json5'), JSON.stringify({ modules: [{ name: 'entry', srcPath: './entry' }] }));

                // project-level oh_modules with a symlink to the real package
                fs.mkdirSync(path.join(tmpDir, 'oh_modules'), { recursive: true });
                fs.symlinkSync(realPkgDir, path.join(tmpDir, 'oh_modules', 'shared-lib'));

                // module-level oh_modules with a symlink to the same real package
                fs.mkdirSync(path.join(tmpDir, 'entry', 'oh_modules'), { recursive: true });
                fs.symlinkSync(realPkgDir, path.join(tmpDir, 'entry', 'oh_modules', 'shared-lib'));

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));

                manager.prepareModules();

                // The real path should only be registered once
                const sharedModule = manager.getModuleByPath(realPkgDir);
                expect(sharedModule).toBeDefined();
                expect(sharedModule!.getModuleType()).toBe(ModuleType.OH_MODULES);

                let ohModulesCount = 0;
                for (const module of manager.modulesIterator()) {
                    if (module.getModuleType() === ModuleType.OH_MODULES) {
                        ohModulesCount++;
                    }
                }
                expect(ohModulesCount).toBe(1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('recurses into scoped package directories starting with @', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-scoped-'));
            try {
                fs.mkdirSync(path.join(tmpDir, 'entry'), { recursive: true });
                fs.writeFileSync(path.join(tmpDir, 'build-profile.json5'), JSON.stringify({ modules: [{ name: 'entry', srcPath: './entry' }] }));

                // scoped package structure: oh_modules/@ohos/library
                fs.mkdirSync(path.join(tmpDir, 'oh_modules', '@ohos', 'library'), { recursive: true });

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));

                manager.prepareModules();

                const realPath = fs.realpathSync(path.join(tmpDir, 'oh_modules', '@ohos', 'library'));
                const libModule = manager.getModuleByPath(realPath);
                expect(libModule).toBeDefined();
                expect(libModule!.getModuleType()).toBe(ModuleType.OH_MODULES);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('logs a warning when build-profile.json5 does not exist', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-nobuildprofile-'));
            try {
                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));

                manager.prepareModules();

                // No PROJECT modules registered, no crash
                expect(manager.isModulesPrepared()).toBe(true);
                let projectCount = 0;
                for (const module of manager.modulesIterator()) {
                    if (module.getModuleType() === ModuleType.PROJECT) {
                        projectCount++;
                    }
                }
                expect(projectCount).toBe(0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });

    describe('analyzeModuleDependencies', () => {
        /**
         * Helper: create a temp project with a build-profile.json5 and module directories.
         * @param tmpDir - temp project root
         * @param modules - array of { name, srcPath, ohPkg } where srcPath is relative to tmpDir
         */
        function setupProject(tmpDir: string, modules: Array<{ name: string; srcPath: string; ohPkg: object }>): void {
            const buildProfileModules = modules.map(m => ({ name: m.name, srcPath: m.srcPath }));
            fs.writeFileSync(path.join(tmpDir, 'build-profile.json5'), JSON.stringify({ modules: buildProfileModules }));
            for (const m of modules) {
                const modDir = path.resolve(tmpDir, m.srcPath);
                fs.mkdirSync(modDir, { recursive: true });
                fs.writeFileSync(path.join(modDir, 'oh-package.json5'), JSON.stringify(m.ohPkg));
            }
        }

        it('builds the dependency graph and sets topoOrder', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-deps-'));
            try {
                setupProject(tmpDir, [
                    { name: 'a', srcPath: './a', ohPkg: { name: '@a', dependencies: { b: '../b' } } },
                    { name: 'b', srcPath: './b', ohPkg: { name: '@b', dependencies: { c: '../c' } } },
                    { name: 'c', srcPath: './c', ohPkg: { name: '@c', dependencies: {} } },
                ]);

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));
                manager.prepareModules();
                manager.analyzeModuleDependencies();

                expect(manager.hasTopoOrder()).toBe(true);
                expect(manager.getDepGraph()).toBeDefined();
                expect(manager.getTopoOrder().length).toBe(3);

                const idA = manager.getModuleCanonicalizer().getId(manager.getModuleByPath(path.resolve(tmpDir, './a'))!);
                const idB = manager.getModuleCanonicalizer().getId(manager.getModuleByPath(path.resolve(tmpDir, './b'))!);
                const idC = manager.getModuleCanonicalizer().getId(manager.getModuleByPath(path.resolve(tmpDir, './c'))!);

                // Topo order: depended-on first (c before b before a)
                const topo = manager.getTopoOrder();
                expect(topo.indexOf(idC)).toBeLessThan(topo.indexOf(idB));
                expect(topo.indexOf(idB)).toBeLessThan(topo.indexOf(idA));
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('hasTopoOrder returns true after analysis', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-topo-'));
            try {
                setupProject(tmpDir, [{ name: 'a', srcPath: './a', ohPkg: { name: '@a', dependencies: {} } }]);

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));
                manager.prepareModules();
                expect(manager.hasTopoOrder()).toBe(false);
                manager.analyzeModuleDependencies();
                expect(manager.hasTopoOrder()).toBe(true);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('resolves local path dependencies (./, ../, file:)', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-localpath-'));
            try {
                setupProject(tmpDir, [
                    {
                        name: 'entry',
                        srcPath: './entry',
                        ohPkg: { name: '@entry', dependencies: { lib1: './lib1', lib2: '../lib2', lib3: 'file:../lib3' } },
                    },
                    { name: 'lib1', srcPath: './entry/lib1', ohPkg: { name: '@lib1', dependencies: {} } },
                    { name: 'lib2', srcPath: './lib2', ohPkg: { name: '@lib2', dependencies: {} } },
                    { name: 'lib3', srcPath: './lib3', ohPkg: { name: '@lib3', dependencies: {} } },
                ]);

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));
                manager.prepareModules();
                manager.analyzeModuleDependencies();

                const entryPath = path.resolve(tmpDir, './entry');
                const entryModule = manager.getModuleByPath(entryPath)!;
                const entryId = manager.getModuleCanonicalizer().getId(entryModule);
                const graph = manager.getDepGraph()!;

                // ./lib1 resolves to entry/lib1
                const lib1Path = path.resolve(tmpDir, './entry/lib1');
                const lib1Module = manager.getModuleByPath(lib1Path)!;
                const lib1Id = manager.getModuleCanonicalizer().getId(lib1Module);
                expect(graph.hasDependencyEdge(entryId, lib1Id)).toBe(true);
                expect(manager.resolveAlias(entryId, 'lib1')).toBe(lib1Module);

                // ../lib2 resolves to lib2
                const lib2Path = path.resolve(tmpDir, './lib2');
                const lib2Module = manager.getModuleByPath(lib2Path)!;
                const lib2Id = manager.getModuleCanonicalizer().getId(lib2Module);
                expect(graph.hasDependencyEdge(entryId, lib2Id)).toBe(true);
                expect(manager.resolveAlias(entryId, 'lib2')).toBe(lib2Module);

                // file:../lib3 resolves to lib3
                const lib3Path = path.resolve(tmpDir, './lib3');
                const lib3Module = manager.getModuleByPath(lib3Path)!;
                const lib3Id = manager.getModuleCanonicalizer().getId(lib3Module);
                expect(graph.hasDependencyEdge(entryId, lib3Id)).toBe(true);
                expect(manager.resolveAlias(entryId, 'lib3')).toBe(lib3Module);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('resolves oh_modules dependencies by version number', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-ohmod-dep-'));
            try {
                fs.mkdirSync(path.join(tmpDir, 'entry'), { recursive: true });
                fs.writeFileSync(path.join(tmpDir, 'build-profile.json5'), JSON.stringify({ modules: [{ name: 'entry', srcPath: './entry' }] }));
                fs.writeFileSync(path.join(tmpDir, 'entry', 'oh-package.json5'), JSON.stringify({ name: '@entry', dependencies: { lodash: '^1.0.0' } }));

                // Create oh_modules/lodash as a real directory
                fs.mkdirSync(path.join(tmpDir, 'oh_modules', 'lodash'), { recursive: true });
                fs.writeFileSync(path.join(tmpDir, 'oh_modules', 'lodash', 'oh-package.json5'), JSON.stringify({ name: 'lodash', version: '1.0.0' }));

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));
                manager.prepareModules();
                manager.analyzeModuleDependencies();

                const entryPath = path.resolve(tmpDir, './entry');
                const entryModule = manager.getModuleByPath(entryPath)!;
                const entryId = manager.getModuleCanonicalizer().getId(entryModule);

                const lodashRealPath = fs.realpathSync(path.join(tmpDir, 'oh_modules', 'lodash'));
                const lodashModule = manager.getModuleByPath(lodashRealPath)!;
                const lodashId = manager.getModuleCanonicalizer().getId(lodashModule);

                expect(manager.getDepGraph()!.hasDependencyEdge(entryId, lodashId)).toBe(true);
                expect(manager.resolveAlias(entryId, 'lodash')).toBe(lodashModule);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('records unresolvable dependencies as unresolved dependencies', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-unresolvable-'));
            try {
                setupProject(tmpDir, [
                    {
                        name: 'entry',
                        srcPath: './entry',
                        ohPkg: { name: '@entry', dependencies: { '@nonexistent/pkg': '^2.0.0' } },
                    },
                ]);

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));
                manager.prepareModules();
                manager.analyzeModuleDependencies();

                const entryPath = path.resolve(tmpDir, './entry');
                const entryModule = manager.getModuleByPath(entryPath)!;
                const unresolvedDeps = entryModule.getUnresolvedDependencies();
                expect(unresolvedDeps.size).toBe(1);
                expect(unresolvedDeps.get('@nonexistent/pkg')).toBe('^2.0.0');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('passes edge type labels correctly (DEPENDENCIES, DEV_DEPENDENCIES, DYNAMIC)', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-edgetype-'));
            try {
                setupProject(tmpDir, [
                    {
                        name: 'src',
                        srcPath: './src',
                        ohPkg: {
                            name: '@src',
                            dependencies: { dep1: '../dep1' },
                            devDependencies: { dep2: '../dep2' },
                            dynamicDependencies: { dep3: '../dep3' },
                        },
                    },
                    { name: 'dep1', srcPath: './dep1', ohPkg: { name: '@dep1', dependencies: {} } },
                    { name: 'dep2', srcPath: './dep2', ohPkg: { name: '@dep2', dependencies: {} } },
                    { name: 'dep3', srcPath: './dep3', ohPkg: { name: '@dep3', dependencies: {} } },
                ]);

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));
                manager.prepareModules();
                manager.analyzeModuleDependencies();

                const graph = manager.getDepGraph()!;
                const srcId = manager.getModuleCanonicalizer().getId(manager.getModuleByPath(path.resolve(tmpDir, './src'))!);
                const dep1Id = manager.getModuleCanonicalizer().getId(manager.getModuleByPath(path.resolve(tmpDir, './dep1'))!);
                const dep2Id = manager.getModuleCanonicalizer().getId(manager.getModuleByPath(path.resolve(tmpDir, './dep2'))!);
                const dep3Id = manager.getModuleCanonicalizer().getId(manager.getModuleByPath(path.resolve(tmpDir, './dep3'))!);

                expect(graph.getEdgeType(srcId, dep1Id)).toBe(DependencyType.DEPENDENCIES);
                expect(graph.getEdgeType(srcId, dep2Id)).toBe(DependencyType.DEV_DEPENDENCIES);
                expect(graph.getEdgeType(srcId, dep3Id)).toBe(DependencyType.DYNAMIC);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('updates module names from oh-package.json5', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-names-'));
            try {
                setupProject(tmpDir, [{ name: 'entry', srcPath: './entry', ohPkg: { name: '@ohos/entry', dependencies: {} } }]);

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));
                manager.prepareModules();

                // Before analysis, moduleName comes from build-profile ('entry')
                const entryPath = path.resolve(tmpDir, './entry');
                const entryModule = manager.getModuleByPath(entryPath)!;
                expect(entryModule.getModuleName()).toBe('entry');

                manager.analyzeModuleDependencies();

                // After analysis, moduleName comes from oh-package.json5 ('@ohos/entry')
                expect(entryModule.getModuleName()).toBe('@ohos/entry');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('is idempotent — second call does not rebuild the graph', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-idem2-'));
            try {
                setupProject(tmpDir, [
                    { name: 'a', srcPath: './a', ohPkg: { name: '@a', dependencies: { b: '../b' } } },
                    { name: 'b', srcPath: './b', ohPkg: { name: '@b', dependencies: {} } },
                ]);

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));
                manager.prepareModules();
                manager.analyzeModuleDependencies();

                const topoAfterFirst = manager.getTopoOrder().slice();
                const graphAfterFirst = manager.getDepGraph();
                const sccSizeAfterFirst = manager.getSCCGroups().size;

                // Second call should be a no-op
                manager.analyzeModuleDependencies();

                expect(manager.getTopoOrder().slice()).toEqual(topoAfterFirst);
                expect(manager.getDepGraph()).toBe(graphAfterFirst);
                expect(manager.getSCCGroups().size).toBe(sccSizeAfterFirst);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('resolves @module: reference dependencies by moduleName', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-moduleref-'));
            try {
                setupProject(tmpDir, [
                    {
                        name: 'entry',
                        srcPath: './entry',
                        ohPkg: { name: '@entry', dependencies: { lib: '@module:@lib1' } },
                    },
                    { name: 'lib1', srcPath: './lib1', ohPkg: { name: '@lib1', dependencies: {} } },
                ]);

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));
                manager.prepareModules();
                manager.analyzeModuleDependencies();

                const entryPath = path.resolve(tmpDir, './entry');
                const entryModule = manager.getModuleByPath(entryPath)!;
                const entryId = manager.getModuleCanonicalizer().getId(entryModule);

                const lib1Path = path.resolve(tmpDir, './lib1');
                const lib1Module = manager.getModuleByPath(lib1Path)!;
                const lib1Id = manager.getModuleCanonicalizer().getId(lib1Module);

                // @module:@lib1 resolves to the module whose oh-package name is '@lib1'
                expect(manager.getDepGraph()!.hasDependencyEdge(entryId, lib1Id)).toBe(true);
                expect(manager.resolveAlias(entryId, 'lib')).toBe(lib1Module);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('handles cyclic dependencies (SCC detection)', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-cycle-'));
            try {
                setupProject(tmpDir, [
                    { name: 'a', srcPath: './a', ohPkg: { name: '@a', dependencies: { b: '../b' } } },
                    { name: 'b', srcPath: './b', ohPkg: { name: '@b', dependencies: { a: '../a' } } },
                    { name: 'c', srcPath: './c', ohPkg: { name: '@c', dependencies: {} } },
                ]);

                const manager = new ModuleManager(makeProjectSceneStub(tmpDir));
                manager.prepareModules();
                manager.analyzeModuleDependencies();

                const idA = manager.getModuleCanonicalizer().getId(manager.getModuleByPath(path.resolve(tmpDir, './a'))!);
                const idB = manager.getModuleCanonicalizer().getId(manager.getModuleByPath(path.resolve(tmpDir, './b'))!);

                // a and b are in the same SCC (cycle)
                const sccGroups = manager.getSCCGroups();
                expect(sccGroups.get(idA)).toBeDefined();
                expect(sccGroups.get(idB)).toBeDefined();
                expect(sccGroups.get(idA)).toEqual(sccGroups.get(idB));
                expect(sccGroups.get(idA)!.length).toBe(2);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('builds the dependency graph from the example project', () => {
            const projectDir = path.resolve(__dirname, '..', 'resources', 'dependency', 'exampleProject', 'MyApplication4Files');
            const manager = new ModuleManager(makeProjectSceneStub(projectDir));
            manager.prepareModules();
            manager.analyzeModuleDependencies();

            expect(manager.hasTopoOrder()).toBe(true);
            expect(manager.getDepGraph()).toBeDefined();
            const graph = manager.getDepGraph()!;

            // 6 PROJECT modules from build-profile.json5 + 2 OH_MODULES (@ohos/hypium, @ohos/model2)
            expect(manager.getTopoOrder().length).toBe(8);

            // model1 and model2 form a cycle (model1 → model2 → model1)
            const model1Module = manager.getModuleByPath(path.resolve(projectDir, './model1'))!;
            const model2Module = manager.getModuleByPath(path.resolve(projectDir, './model2'))!;
            const idModel1 = manager.getModuleCanonicalizer().getId(model1Module);
            const idModel2 = manager.getModuleCanonicalizer().getId(model2Module);

            expect(graph.hasDependencyEdge(idModel1, idModel2)).toBe(true);
            expect(graph.hasDependencyEdge(idModel2, idModel1)).toBe(true);

            const sccGroups = manager.getSCCGroups();
            expect(sccGroups.get(idModel1)).toEqual(sccGroups.get(idModel2));
            expect(sccGroups.get(idModel1)!.length).toBe(2);

            // Module names updated from oh-package.json5
            expect(model1Module.getModuleName()).toBe('@model1');
            expect(model2Module.getModuleName()).toBe('model2');

            const libbaseModule = manager.getModuleByPath(path.resolve(projectDir, './libbase'))!;
            const idLibbase = manager.getModuleCanonicalizer().getId(libbaseModule);
            expect(libbaseModule.getModuleName()).toBe('@libbase');

            // libbase depends on model2 (resolved via "../model2")
            expect(graph.hasDependencyEdge(idLibbase, idModel2)).toBe(true);

            // libbase's local deps (./lib1, ./log4js) resolve to unregistered subdirs → unresolved
            const unresolvedDeps = libbaseModule.getUnresolvedDependencies();
            expect(unresolvedDeps.size).toBe(2);
            expect(unresolvedDeps.has('@lib1')).toBe(true);
            expect(unresolvedDeps.has('@log4js')).toBe(true);
        });
    });

    describe('loadModule', () => {
        /** Create a temp module directory with the given source files. */
        function setupModuleDir(tmpDir: string, files: string[]): string {
            fs.mkdirSync(tmpDir, { recursive: true });
            for (const file of files) {
                const filePath = path.join(tmpDir, file);
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, '// stub source\n');
            }
            return tmpDir;
        }

        it('transitions module state from NOT_LOADED to LOADED', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-state-'));
            try {
                setupModuleDir(path.join(tmpDir, 'entry'), ['main.ets']);
                const manager = new ModuleManager(makeLoadModuleSceneStub());
                const module = manager.registerModule(path.join(tmpDir, 'entry'), '@ohos/entry');
                const moduleId = manager.getModuleCanonicalizer().getId(module);

                expect(module.getLoadState()).toBe(ModuleLoadState.NOT_LOADED);
                manager.loadModule(moduleId);
                expect(module.getLoadState()).toBe(ModuleLoadState.LOADED);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('is idempotent — second call does not rebuild files', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-idem-'));
            try {
                setupModuleDir(path.join(tmpDir, 'entry'), ['a.ets', 'b.ets']);
                const manager = new ModuleManager(makeLoadModuleSceneStub());
                const module = manager.registerModule(path.join(tmpDir, 'entry'), '@ohos/entry');
                const moduleId = manager.getModuleCanonicalizer().getId(module);

                manager.loadModule(moduleId);
                expect(module.getLoadState()).toBe(ModuleLoadState.LOADED);
                const fileCountAfterFirst = module.getFilesMap().size;

                // Second call should be a no-op
                manager.loadModule(moduleId);
                expect(module.getLoadState()).toBe(ModuleLoadState.LOADED);
                expect(module.getFilesMap().size).toBe(fileCountAfterFirst);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('SDK modules: just marks LOADED without building files', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-sdk-'));
            try {
                setupModuleDir(path.join(tmpDir, 'sdk'), ['api.ets']);
                const manager = new ModuleManager(makeLoadModuleSceneStub());
                const module = manager.registerModule(path.join(tmpDir, 'sdk'), 'etsSdk');
                module.setModuleType(ModuleType.SDK);
                const moduleId = manager.getModuleCanonicalizer().getId(module);

                manager.loadModule(moduleId);

                expect(module.getLoadState()).toBe(ModuleLoadState.LOADED);
                // SDK modules do not build ArkFiles in loadModule
                expect(module.getFilesMap().size).toBe(0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('creates ArkFile objects at META level (files exist but are not parsed)', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-meta-'));
            try {
                const modulePath = setupModuleDir(path.join(tmpDir, 'entry'), ['main.ets', 'utils.ts', 'index.ets']);
                const manager = new ModuleManager(makeLoadModuleSceneStub());
                const module = manager.registerModule(modulePath, '@ohos/entry');
                const moduleId = manager.getModuleCanonicalizer().getId(module);

                manager.loadModule(moduleId);

                // All three source files should be in the filesMap
                expect(module.getFilesMap().size).toBe(3);

                // Each ArkFile should have path info but no parsed content (no default class built)
                for (const arkFile of module.getFilesMap().values()) {
                    expect(arkFile).toBeInstanceOf(ArkFile);
                    expect(arkFile.getFilePath()).toBeTruthy();
                    expect(arkFile.getFilePath()).toMatch(/\.(ets|ts)$/);
                    // At META level, the file is not parsed — getCode would read from disk lazily,
                    // but no AST or default class is built.
                    expect(arkFile.getAST()).toBeNull();
                }
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('recursively loads dependencies before the module itself', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-deps-'));
            try {
                setupModuleDir(path.join(tmpDir, 'library'), ['lib.ets']);
                setupModuleDir(path.join(tmpDir, 'entry'), ['main.ets']);
                const manager = new ModuleManager(makeLoadModuleSceneStub());
                const entry = manager.registerModule(path.join(tmpDir, 'entry'), '@ohos/entry');
                const library = manager.registerModule(path.join(tmpDir, 'library'), '@ohos/library');
                const entryId = manager.getModuleCanonicalizer().getId(entry);
                const libraryId = manager.getModuleCanonicalizer().getId(library);
                injectDepGraph(manager, [[entryId, libraryId]]);

                // Load entry — should recursively load library first
                manager.loadModule(entryId);

                expect(library.getLoadState()).toBe(ModuleLoadState.LOADED);
                expect(entry.getLoadState()).toBe(ModuleLoadState.LOADED);
                expect(library.getFilesMap().size).toBe(1);
                expect(entry.getFilesMap().size).toBe(1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('handles cyclic dependencies without infinite recursion', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-cycle-'));
            try {
                setupModuleDir(path.join(tmpDir, 'a'), ['a.ets']);
                setupModuleDir(path.join(tmpDir, 'b'), ['b.ets']);
                const manager = new ModuleManager(makeLoadModuleSceneStub());
                const a = manager.registerModule(path.join(tmpDir, 'a'), '@a');
                const b = manager.registerModule(path.join(tmpDir, 'b'), '@b');
                const idA = manager.getModuleCanonicalizer().getId(a);
                const idB = manager.getModuleCanonicalizer().getId(b);
                injectDepGraph(manager, [[idA, idB], [idB, idA]]);

                manager.loadModule(idA);

                expect(a.getLoadState()).toBe(ModuleLoadState.LOADED);
                expect(b.getLoadState()).toBe(ModuleLoadState.LOADED);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('returns null for a non-existent module ID without throwing', () => {
            const manager = new ModuleManager(makeLoadModuleSceneStub());
            expect(() => manager.loadModule(999)).not.toThrow();
        });
    });

    describe('getRetainLevel', () => {
        it('returns the configured level after loadModule', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-retain-'));
            try {
                fs.mkdirSync(path.join(tmpDir, 'entry'), { recursive: true });
                fs.writeFileSync(path.join(tmpDir, 'entry', 'main.ets'), '// stub\n');
                const manager = new ModuleManager(makeLoadModuleSceneStub());
                const module = manager.registerModule(path.join(tmpDir, 'entry'), '@ohos/entry');
                const moduleId = manager.getModuleCanonicalizer().getId(module);

                const config = new ModuleAnalysisConfig();
                config.setLoadLevel(ModuleType.PROJECT, ModuleDepthLevel.BODIES);
                manager.loadModule(moduleId, config);

                expect(manager.getRetainLevel(moduleId)).toBe(ModuleDepthLevel.BODIES);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('defaults to META when no config is provided', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-retain-default-'));
            try {
                fs.mkdirSync(path.join(tmpDir, 'entry'), { recursive: true });
                fs.writeFileSync(path.join(tmpDir, 'entry', 'main.ets'), '// stub\n');
                const manager = new ModuleManager(makeLoadModuleSceneStub());
                const module = manager.registerModule(path.join(tmpDir, 'entry'), '@ohos/entry');
                const moduleId = manager.getModuleCanonicalizer().getId(module);

                manager.loadModule(moduleId);

                expect(manager.getRetainLevel(moduleId)).toBe(ModuleDepthLevel.META);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('defaults to META for an unloaded module', () => {
            const manager = new ModuleManager(makeLoadModuleSceneStub());
            expect(manager.getRetainLevel(999)).toBe(ModuleDepthLevel.META);
        });
    });
});
