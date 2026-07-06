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
import { ModuleBuilder } from '../../src/frontend/common/ModuleBuilder';
import { ArkModule, ModuleID, ModuleLoadState, ModuleType } from '../../src/core/model/ArkModule';
import { ModuleDepGraph, DependencyType } from '../../src/core/graph/ModuleDepGraph';
import { ModuleDepthLevel } from '../../src/frontend/common/ModuleDepth';
import { ModuleAnalysisConfig } from '../../src/frontend/common/ModuleAnalysisConfig';
import { ArkFile } from '../../src/core/model/ArkFile';
import { Scene } from '../../src/Scene';
import { Canonicalizer } from '../../src/utils/Canonicalizer';
import type { Sdk } from '../../src/Config';

/** Create a real Scene. */
function makeScene(): Scene {
    return new Scene();
}

/** Create a Scene whose getSceneConfig() returns a config with the given SDKs. */
function makeSdkSceneStub(sdks: Sdk[]): Scene {
    const scene = new Scene();
    (scene as unknown as { getSceneConfig: () => unknown }).getSceneConfig = () => ({ getSdksObj: () => sdks });
    return scene;
}

/** Create a Scene whose getRealProjectDir() returns the given directory. */
function makeProjectSceneStub(projectDir: string): Scene {
    const scene = new Scene();
    (scene as unknown as { getRealProjectDir: () => string }).getRealProjectDir = () => projectDir;
    return scene;
}

/**
 * Create a Scene suitable for loadModule tests: supports getOptions (supportFileExts,
 * ignoreFileNames), getFileLanguages, setFile, and getRealProjectDir.
 */
function makeLoadModuleSceneStub(): Scene {
    const scene = new Scene();
    const filesMap = new Map<string, unknown>();
    (scene as unknown as { getOptions: () => unknown }).getOptions = () => ({ supportFileExts: ['.ets', '.ts'], ignoreFileNames: [] });
    (scene as unknown as { getFileLanguages: () => Map<string, unknown> }).getFileLanguages = () => new Map();
    (scene as unknown as { getProjectName: () => string }).getProjectName = () => 'test-project';
    (scene as unknown as { setFile: (file: ArkFile) => void }).setFile = (file: ArkFile) => {
        filesMap.set(file.getFileSignature().toMapKey(), file);
    };
    (scene as unknown as { getSceneConfig: () => undefined }).getSceneConfig = () => undefined;
    (scene as unknown as { getRealProjectDir: () => string }).getRealProjectDir = () => '';
    return scene;
}

/**
 * Build a ModuleDepGraph with the given dependency edges and inject it into the scene.
 * All currently-registered modules are added as graph nodes.
 */
function injectDepGraph(scene: Scene, builder: ModuleBuilder, edges: Array<[ModuleID, ModuleID]>): ModuleDepGraph {
    const graph = new ModuleDepGraph(builder.getModuleCanonicalizer());
    for (const module of builder.modulesIterator()) {
        graph.addModule(module);
    }
    for (const [src, dst] of edges) {
        graph.addDependencyEdge(src, dst);
    }
    scene.setModuleDepGraph(graph);
    return graph;
}

describe('ModuleBuilder tests', () => {
    describe('registerModule', () => {
        it('returns an ArkModule and increases the module count on first registration', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            expect(builder.getModuleCount()).toBe(0);
            const module = builder.registerModule('/project/entry', '@ohos/entry');
            expect(module).toBeInstanceOf(ArkModule);
            expect(module.getModulePath()).toBe('/project/entry');
            expect(module.getModuleName()).toBe('@ohos/entry');
            expect(builder.getModuleCount()).toBe(1);
        });

        it('returns the same ArkModule and does not increase the count for a duplicate path', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const first = builder.registerModule('/project/entry', '@ohos/entry');
            const second = builder.registerModule('/project/entry', 'ignored-name');
            expect(second).toBe(first);
            expect(builder.getModuleCount()).toBe(1);
            // The duplicate registration must not overwrite the stored module name.
            expect(second.getModuleName()).toBe('@ohos/entry');
        });

        it('assigns consecutive ModuleIDs across distinct paths', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const a = builder.registerModule('/project/a');
            const b = builder.registerModule('/project/b');
            const idA = builder.getModuleCanonicalizer().getId(a);
            const idB = builder.getModuleCanonicalizer().getId(b);
            expect(idB).toBe(idA + 1);
        });
    });

    describe('getModule', () => {
        it('returns the correct module for a registered ID', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const module = builder.registerModule('/project/entry');
            const id = builder.getModuleCanonicalizer().getId(module);
            expect(builder.getModule(id)).toBe(module);
        });

        it('returns undefined for a non-existent ID', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            expect(builder.getModule(999)).toBeUndefined();
        });
    });

    describe('getModuleByPath', () => {
        it('returns the correct module for a registered path', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const module = builder.registerModule('/project/entry');
            expect(builder.getModuleByPath('/project/entry')).toBe(module);
        });

        it('returns undefined for a non-existent path', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            expect(builder.getModuleByPath('/project/nonexistent')).toBeUndefined();
        });
    });

    describe('modulesIterator', () => {
        it('iterates over all registered modules in registration order', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const a = builder.registerModule('/project/a');
            const b = builder.registerModule('/project/b');
            const c = builder.registerModule('/project/c');
            const collected = [...builder.modulesIterator()];
            expect(collected).toEqual([a, b, c]);
        });

        it('skips modules whose loadState is DISPOSED', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const a = builder.registerModule('/project/a');
            const b = builder.registerModule('/project/b');
            const c = builder.registerModule('/project/c');
            b.setLoadState(ModuleLoadState.DISPOSED);
            const collected = [...builder.modulesIterator()];
            expect(collected).toEqual([a, c]);
        });
    });

    describe('resolveAlias', () => {
        it('resolves an alias to the depended-on module within the module scope', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const entry = builder.registerModule('/project/entry');
            const library = builder.registerModule('/project/library');
            const libraryId = builder.getModuleCanonicalizer().getId(library);
            const entryId = builder.getModuleCanonicalizer().getId(entry);
            entry.addDependencyAlias('@ohos/library', libraryId);

            expect(builder.resolveAlias(entryId, '@ohos/library')).toBe(library);
        });

        it('returns undefined for an unknown alias', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const entry = builder.registerModule('/project/entry');
            const entryId = builder.getModuleCanonicalizer().getId(entry);
            expect(builder.resolveAlias(entryId, '@ohos/unknown')).toBeUndefined();
        });

        it('returns undefined for a non-existent module ID', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            expect(builder.resolveAlias(999, '@ohos/library')).toBeUndefined();
        });

        it('resolves the same alias to different modules in different scopes', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const a = builder.registerModule('/project/a');
            const b = builder.registerModule('/project/b');
            const libA = builder.registerModule('/project/libA');
            const libB = builder.registerModule('/project/libB');
            const idA = builder.getModuleCanonicalizer().getId(a);
            const idB = builder.getModuleCanonicalizer().getId(b);
            const idLibA = builder.getModuleCanonicalizer().getId(libA);
            const idLibB = builder.getModuleCanonicalizer().getId(libB);
            a.addDependencyAlias('myLib', idLibA);
            b.addDependencyAlias('myLib', idLibB);
            expect(builder.resolveAlias(idA, 'myLib')).toBe(libA);
            expect(builder.resolveAlias(idB, 'myLib')).toBe(libB);
        });
    });

    describe('setMaxSCCGroupSize / getMaxSCCGroupSize', () => {
        it('defaults to 3', () => {
            const graph = new ModuleDepGraph(new Canonicalizer<ArkModule>());
            expect(graph.getMaxSCCGroupSize()).toBe(3);
        });

        it('stores and returns the configured value', () => {
            const graph = new ModuleDepGraph(new Canonicalizer<ArkModule>());
            graph.setMaxSCCGroupSize(25);
            expect(graph.getMaxSCCGroupSize()).toBe(25);
        });

        it('supports disabling post-processing via Number.MAX_SAFE_INTEGER', () => {
            const graph = new ModuleDepGraph(new Canonicalizer<ArkModule>());
            graph.setMaxSCCGroupSize(Number.MAX_SAFE_INTEGER);
            expect(graph.getMaxSCCGroupSize()).toBe(Number.MAX_SAFE_INTEGER);
        });
    });

    describe('computeModuleClosure', () => {
        it('includes the transitive closure for A -> B -> C starting from {A}', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const a = builder.registerModule('/project/a');
            const b = builder.registerModule('/project/b');
            const c = builder.registerModule('/project/c');
            const idA = builder.getModuleCanonicalizer().getId(a);
            const idB = builder.getModuleCanonicalizer().getId(b);
            const idC = builder.getModuleCanonicalizer().getId(c);
            injectDepGraph(scene, builder, [
                [idA, idB],
                [idB, idC],
            ]);

            const closure = builder.computeModuleClosure(new Set(['/project/a']));
            expect(closure.has(idA)).toBe(true);
            expect(closure.has(idB)).toBe(true);
            expect(closure.has(idC)).toBe(true);
            expect(closure.size).toBe(3);
        });

        it('unions the closures of multiple targets', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const a = builder.registerModule('/project/a');
            const b = builder.registerModule('/project/b');
            const c = builder.registerModule('/project/c');
            const d = builder.registerModule('/project/d');
            const e = builder.registerModule('/project/e');
            const idA = builder.getModuleCanonicalizer().getId(a);
            const idB = builder.getModuleCanonicalizer().getId(b);
            const idC = builder.getModuleCanonicalizer().getId(c);
            const idD = builder.getModuleCanonicalizer().getId(d);
            const idE = builder.getModuleCanonicalizer().getId(e);
            injectDepGraph(scene, builder, [
                [idA, idB],
                [idB, idC],
                [idD, idE],
            ]);

            const closure = builder.computeModuleClosure(new Set(['/project/a', '/project/d']));
            expect(closure.has(idA)).toBe(true);
            expect(closure.has(idB)).toBe(true);
            expect(closure.has(idC)).toBe(true);
            expect(closure.has(idD)).toBe(true);
            expect(closure.has(idE)).toBe(true);
            expect(closure.size).toBe(5);
        });

        it('skips non-existent paths without throwing', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const a = builder.registerModule('/project/a');
            const idA = builder.getModuleCanonicalizer().getId(a);
            const closure = builder.computeModuleClosure(new Set(['/project/a', '/project/nonexistent']));
            expect(closure.has(idA)).toBe(true);
            expect(closure.size).toBe(1);
        });

        it('does not include SDK modules in the closure', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const a = builder.registerModule('/project/a');
            const sdk = builder.registerModule('/sdk/ets');
            const idA = builder.getModuleCanonicalizer().getId(a);
            const idSdk = builder.getModuleCanonicalizer().getId(sdk);
            sdk.setModuleType(ModuleType.SDK);
            injectDepGraph(scene, builder, [[idA, idSdk]]);

            const closure = builder.computeModuleClosure(new Set(['/project/a']));
            expect(closure.has(idA)).toBe(true);
            expect(closure.has(idSdk)).toBe(false);
            expect(closure.size).toBe(1);
        });

        it('handles cyclic dependencies without infinite recursion', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const a = builder.registerModule('/project/a');
            const b = builder.registerModule('/project/b');
            const idA = builder.getModuleCanonicalizer().getId(a);
            const idB = builder.getModuleCanonicalizer().getId(b);
            injectDepGraph(scene, builder, [
                [idA, idB],
                [idB, idA],
            ]);

            const closure = builder.computeModuleClosure(new Set(['/project/a']));
            expect(closure.has(idA)).toBe(true);
            expect(closure.has(idB)).toBe(true);
            expect(closure.size).toBe(2);
        });

        it('returns an empty set when no target path is registered', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const closure = builder.computeModuleClosure(new Set(['/project/nonexistent']));
            expect(closure.size).toBe(0);
        });
    });

    describe('getFilteredTopoOrder', () => {
        it('filters the topological order to only include IDs in the closure', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            builder.registerModule('/project/a');
            builder.registerModule('/project/b');
            builder.registerModule('/project/c');
            builder.registerModule('/project/d');
            const idA = builder.getModuleCanonicalizer().getId(builder.getModuleByPath('/project/a')!);
            const idB = builder.getModuleCanonicalizer().getId(builder.getModuleByPath('/project/b')!);
            const idC = builder.getModuleCanonicalizer().getId(builder.getModuleByPath('/project/c')!);
            const idD = builder.getModuleCanonicalizer().getId(builder.getModuleByPath('/project/d')!);
            // topoOrder is populated by refineSCCGroups inside analyzeModuleDependencies; inject a
            // depGraph with a preset topoOrder here so the filtering behavior can be verified in isolation.
            const graph = injectDepGraph(scene, builder, []);
            (graph as unknown as { topoOrder: ModuleID[] }).topoOrder = [idA, idB, idC, idD];

            const filtered = builder.getFilteredTopoOrder(new Set<ModuleID>([idB, idD]));
            expect(filtered).toEqual([idB, idD]);
        });

        it('returns an empty array when the closure is empty', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            builder.registerModule('/project/a');
            const idA = builder.getModuleCanonicalizer().getId(builder.getModuleByPath('/project/a')!);
            const graph = injectDepGraph(scene, builder, []);
            (graph as unknown as { topoOrder: ModuleID[] }).topoOrder = [idA];
            expect(builder.getFilteredTopoOrder(new Set<ModuleID>())).toEqual([]);
        });

        it('returns an empty array when topoOrder is empty', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const closure = new Set<ModuleID>([0, 1]);
            expect(builder.getFilteredTopoOrder(closure)).toEqual([]);
        });
    });

    describe('initial state flags', () => {
        it('reports false for isSdkRegistered, isModulesRegistered and isModuleDependenciesAnalyzed before any build step', () => {
            const scene = makeScene();
            expect(scene.isSdkRegistered()).toBe(false);
            expect(scene.isModulesRegistered()).toBe(false);
            expect(scene.isModuleDependenciesAnalyzed()).toBe(false);
        });

        it('returns an empty topological order and undefined depGraph before dependency analysis', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            expect(builder.getTopoOrder()).toEqual([]);
            expect(scene.getModuleDepGraph()).toBeUndefined();
        });
    });

    describe('getModuleCanonicalizer', () => {
        it('returns the canonicalizer shared with registered modules', () => {
            const scene = makeScene();
            const builder = new ModuleBuilder(scene);
            const module = builder.registerModule('/project/entry');
            const canonicalizer = builder.getModuleCanonicalizer();
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
            const scene = makeSdkSceneStub(sdks);
            const builder = new ModuleBuilder(scene);

            builder.prepareSdkModules();

            expect(scene.isSdkRegistered()).toBe(true);
            expect(builder.getModuleCount()).toBe(2);

            const etsModule = builder.getModuleByPath(path.normalize('/sdk/ets'));
            expect(etsModule).toBeDefined();
            expect(etsModule!.getModuleType()).toBe(ModuleType.SDK);
            expect(etsModule!.getModuleName()).toBe('etsSdk');

            const hmsModule = builder.getModuleByPath(path.normalize('/sdk/hms'));
            expect(hmsModule).toBeDefined();
            expect(hmsModule!.getModuleType()).toBe(ModuleType.SDK);
        });

        it('skips SDKs with moduleName set (module-level SDKs)', () => {
            const sdks: Sdk[] = [
                { name: 'etsSdk', path: '/sdk/ets', moduleName: '' },
                { name: 'moduleSdk', path: '/sdk/module', moduleName: 'entry' },
            ];
            const scene = makeSdkSceneStub(sdks);
            const builder = new ModuleBuilder(scene);

            builder.prepareSdkModules();

            expect(builder.getModuleCount()).toBe(1);
            expect(builder.getModuleByPath(path.normalize('/sdk/ets'))).toBeDefined();
            expect(builder.getModuleByPath(path.normalize('/sdk/module'))).toBeUndefined();
        });

        it('does not build ArkFiles or perform type inference', () => {
            const sdks: Sdk[] = [{ name: 'etsSdk', path: '/sdk/ets', moduleName: '' }];
            const scene = makeSdkSceneStub(sdks);
            const builder = new ModuleBuilder(scene);

            builder.prepareSdkModules();

            const sdkModule = builder.getModuleByPath(path.normalize('/sdk/ets'));
            expect(sdkModule).toBeDefined();
            expect(sdkModule!.getFilesMap().size).toBe(0);
            expect(sdkModule!.getLoadState()).toBe(ModuleLoadState.NOT_LOADED);
        });

        it('is idempotent — second call does not register additional modules', () => {
            const sdks: Sdk[] = [{ name: 'etsSdk', path: '/sdk/ets', moduleName: '' }];
            const scene = makeSdkSceneStub(sdks);
            const builder = new ModuleBuilder(scene);

            builder.prepareSdkModules();
            expect(builder.getModuleCount()).toBe(1);

            builder.prepareSdkModules();
            expect(builder.getModuleCount()).toBe(1);
            expect(scene.isSdkRegistered()).toBe(true);
        });

        it('handles missing SceneConfig gracefully', () => {
            const scene = new Scene();
            (scene as unknown as { getSceneConfig: () => undefined }).getSceneConfig = () => undefined;
            const builder = new ModuleBuilder(scene);

            builder.prepareSdkModules();

            expect(scene.isSdkRegistered()).toBe(true);
            expect(builder.getModuleCount()).toBe(0);
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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);

                builder.prepareModules();

                expect(scene.isModulesRegistered()).toBe(true);

                const entryPath = path.resolve(tmpDir, './entry');
                const libraryPath = path.resolve(tmpDir, './library');
                const entryModule = builder.getModuleByPath(entryPath);
                const libraryModule = builder.getModuleByPath(libraryPath);

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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);

                builder.prepareModules();

                let ohModulesCount = 0;
                for (const module of builder.modulesIterator()) {
                    if (module.getModuleType() === ModuleType.OH_MODULES) {
                        ohModulesCount++;
                    }
                }
                expect(ohModulesCount).toBe(1);

                const realPath = fs.realpathSync(path.join(tmpDir, 'oh_modules', 'lodash'));
                const lodashModule = builder.getModuleByPath(realPath);
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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);

                builder.prepareModules();

                const entryPath = path.resolve(tmpDir, './entry');
                const entryModule = builder.getModuleByPath(entryPath);
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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);

                builder.prepareModules();
                const countAfterFirst = builder.getModuleCount();
                expect(countAfterFirst).toBeGreaterThan(0);

                builder.prepareModules();
                expect(builder.getModuleCount()).toBe(countAfterFirst);
                expect(scene.isModulesRegistered()).toBe(true);
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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);

                builder.prepareModules();

                // The real path should only be registered once
                const sharedModule = builder.getModuleByPath(realPkgDir);
                expect(sharedModule).toBeDefined();
                expect(sharedModule!.getModuleType()).toBe(ModuleType.OH_MODULES);

                let ohModulesCount = 0;
                for (const module of builder.modulesIterator()) {
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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);

                builder.prepareModules();

                const realPath = fs.realpathSync(path.join(tmpDir, 'oh_modules', '@ohos', 'library'));
                const libModule = builder.getModuleByPath(realPath);
                expect(libModule).toBeDefined();
                expect(libModule!.getModuleType()).toBe(ModuleType.OH_MODULES);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('logs a warning when build-profile.json5 does not exist', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-nobuildprofile-'));
            try {
                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);

                builder.prepareModules();

                // No PROJECT modules registered, no crash
                expect(scene.isModulesRegistered()).toBe(true);
                let projectCount = 0;
                for (const module of builder.modulesIterator()) {
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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);
                builder.prepareModules();
                builder.analyzeModuleDependencies();

                expect(scene.isModuleDependenciesAnalyzed()).toBe(true);
                expect(scene.getModuleDepGraph()).toBeDefined();
                expect(builder.getTopoOrder().length).toBe(3);

                const idA = builder.getModuleCanonicalizer().getId(builder.getModuleByPath(path.resolve(tmpDir, './a'))!);
                const idB = builder.getModuleCanonicalizer().getId(builder.getModuleByPath(path.resolve(tmpDir, './b'))!);
                const idC = builder.getModuleCanonicalizer().getId(builder.getModuleByPath(path.resolve(tmpDir, './c'))!);

                // Topo order: depended-on first (c before b before a)
                const topo = builder.getTopoOrder();
                expect(topo.indexOf(idC)).toBeLessThan(topo.indexOf(idB));
                expect(topo.indexOf(idB)).toBeLessThan(topo.indexOf(idA));
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('isModuleDependenciesAnalyzed returns true after analysis', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-topo-'));
            try {
                setupProject(tmpDir, [{ name: 'a', srcPath: './a', ohPkg: { name: '@a', dependencies: {} } }]);

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);
                builder.prepareModules();
                expect(scene.isModuleDependenciesAnalyzed()).toBe(false);
                builder.analyzeModuleDependencies();
                expect(scene.isModuleDependenciesAnalyzed()).toBe(true);
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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);
                builder.prepareModules();
                builder.analyzeModuleDependencies();

                const entryPath = path.resolve(tmpDir, './entry');
                const entryModule = builder.getModuleByPath(entryPath)!;
                const entryId = builder.getModuleCanonicalizer().getId(entryModule);
                const graph = scene.getModuleDepGraph()!;

                // ./lib1 resolves to entry/lib1
                const lib1Path = path.resolve(tmpDir, './entry/lib1');
                const lib1Module = builder.getModuleByPath(lib1Path)!;
                const lib1Id = builder.getModuleCanonicalizer().getId(lib1Module);
                expect(graph.hasDependencyEdge(entryId, lib1Id)).toBe(true);
                expect(builder.resolveAlias(entryId, 'lib1')).toBe(lib1Module);

                // ../lib2 resolves to lib2
                const lib2Path = path.resolve(tmpDir, './lib2');
                const lib2Module = builder.getModuleByPath(lib2Path)!;
                const lib2Id = builder.getModuleCanonicalizer().getId(lib2Module);
                expect(graph.hasDependencyEdge(entryId, lib2Id)).toBe(true);
                expect(builder.resolveAlias(entryId, 'lib2')).toBe(lib2Module);

                // file:../lib3 resolves to lib3
                const lib3Path = path.resolve(tmpDir, './lib3');
                const lib3Module = builder.getModuleByPath(lib3Path)!;
                const lib3Id = builder.getModuleCanonicalizer().getId(lib3Module);
                expect(graph.hasDependencyEdge(entryId, lib3Id)).toBe(true);
                expect(builder.resolveAlias(entryId, 'lib3')).toBe(lib3Module);
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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);
                builder.prepareModules();
                builder.analyzeModuleDependencies();

                const entryPath = path.resolve(tmpDir, './entry');
                const entryModule = builder.getModuleByPath(entryPath)!;
                const entryId = builder.getModuleCanonicalizer().getId(entryModule);

                const lodashRealPath = fs.realpathSync(path.join(tmpDir, 'oh_modules', 'lodash'));
                const lodashModule = builder.getModuleByPath(lodashRealPath)!;
                const lodashId = builder.getModuleCanonicalizer().getId(lodashModule);

                expect(scene.getModuleDepGraph()!.hasDependencyEdge(entryId, lodashId)).toBe(true);
                expect(builder.resolveAlias(entryId, 'lodash')).toBe(lodashModule);
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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);
                builder.prepareModules();
                builder.analyzeModuleDependencies();

                const entryPath = path.resolve(tmpDir, './entry');
                const entryModule = builder.getModuleByPath(entryPath)!;
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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);
                builder.prepareModules();
                builder.analyzeModuleDependencies();

                const graph = scene.getModuleDepGraph()!;
                const srcId = builder.getModuleCanonicalizer().getId(builder.getModuleByPath(path.resolve(tmpDir, './src'))!);
                const dep1Id = builder.getModuleCanonicalizer().getId(builder.getModuleByPath(path.resolve(tmpDir, './dep1'))!);
                const dep2Id = builder.getModuleCanonicalizer().getId(builder.getModuleByPath(path.resolve(tmpDir, './dep2'))!);
                const dep3Id = builder.getModuleCanonicalizer().getId(builder.getModuleByPath(path.resolve(tmpDir, './dep3'))!);

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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);
                builder.prepareModules();

                // Before analysis, moduleName comes from build-profile ('entry')
                const entryPath = path.resolve(tmpDir, './entry');
                const entryModule = builder.getModuleByPath(entryPath)!;
                expect(entryModule.getModuleName()).toBe('entry');

                builder.analyzeModuleDependencies();

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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);
                builder.prepareModules();
                builder.analyzeModuleDependencies();

                const topoAfterFirst = builder.getTopoOrder().slice();
                const graphAfterFirst = scene.getModuleDepGraph();
                const sccSizeAfterFirst = scene.getModuleDepGraph()!.getSCCGroups().size;

                // Second call should be a no-op
                builder.analyzeModuleDependencies();

                expect(builder.getTopoOrder().slice()).toEqual(topoAfterFirst);
                expect(scene.getModuleDepGraph()).toBe(graphAfterFirst);
                expect(scene.getModuleDepGraph()!.getSCCGroups().size).toBe(sccSizeAfterFirst);
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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);
                builder.prepareModules();
                builder.analyzeModuleDependencies();

                const entryPath = path.resolve(tmpDir, './entry');
                const entryModule = builder.getModuleByPath(entryPath)!;
                const entryId = builder.getModuleCanonicalizer().getId(entryModule);

                const lib1Path = path.resolve(tmpDir, './lib1');
                const lib1Module = builder.getModuleByPath(lib1Path)!;
                const lib1Id = builder.getModuleCanonicalizer().getId(lib1Module);

                // @module:@lib1 resolves to the module whose oh-package name is '@lib1'
                expect(scene.getModuleDepGraph()!.hasDependencyEdge(entryId, lib1Id)).toBe(true);
                expect(builder.resolveAlias(entryId, 'lib')).toBe(lib1Module);
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

                const scene = makeProjectSceneStub(tmpDir);
                const builder = new ModuleBuilder(scene);
                builder.prepareModules();
                builder.analyzeModuleDependencies();

                const idA = builder.getModuleCanonicalizer().getId(builder.getModuleByPath(path.resolve(tmpDir, './a'))!);
                const idB = builder.getModuleCanonicalizer().getId(builder.getModuleByPath(path.resolve(tmpDir, './b'))!);

                // a and b are in the same SCC (cycle)
                const sccGroups = scene.getModuleDepGraph()!.getSCCGroups();
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
            const scene = makeProjectSceneStub(projectDir);
            const builder = new ModuleBuilder(scene);
            builder.prepareModules();
            builder.analyzeModuleDependencies();

            expect(scene.isModuleDependenciesAnalyzed()).toBe(true);
            expect(scene.getModuleDepGraph()).toBeDefined();
            const graph = scene.getModuleDepGraph()!;

            // 6 PROJECT modules from build-profile.json5 + 2 OH_MODULES (@ohos/hypium, @ohos/model2)
            expect(builder.getTopoOrder().length).toBe(8);

            // model1 and model2 form a cycle (model1 → model2 → model1)
            const model1Module = builder.getModuleByPath(path.resolve(projectDir, './model1'))!;
            const model2Module = builder.getModuleByPath(path.resolve(projectDir, './model2'))!;
            const idModel1 = builder.getModuleCanonicalizer().getId(model1Module);
            const idModel2 = builder.getModuleCanonicalizer().getId(model2Module);

            expect(graph.hasDependencyEdge(idModel1, idModel2)).toBe(true);
            expect(graph.hasDependencyEdge(idModel2, idModel1)).toBe(true);

            const sccGroups = scene.getModuleDepGraph()!.getSCCGroups();
            expect(sccGroups.get(idModel1)).toEqual(sccGroups.get(idModel2));
            expect(sccGroups.get(idModel1)!.length).toBe(2);

            // Module names updated from oh-package.json5
            expect(model1Module.getModuleName()).toBe('@model1');
            expect(model2Module.getModuleName()).toBe('model2');

            const libbaseModule = builder.getModuleByPath(path.resolve(projectDir, './libbase'))!;
            const idLibbase = builder.getModuleCanonicalizer().getId(libbaseModule);
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

        it('transitions module state from NOT_LOADED to META', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-state-'));
            try {
                setupModuleDir(path.join(tmpDir, 'entry'), ['main.ets']);
                const scene = makeLoadModuleSceneStub();
                const builder = new ModuleBuilder(scene);
                const module = builder.registerModule(path.join(tmpDir, 'entry'), '@ohos/entry');
                const moduleId = builder.getModuleCanonicalizer().getId(module);

                expect(module.getLoadState()).toBe(ModuleLoadState.NOT_LOADED);
                builder.loadModule(moduleId);
                expect(module.getLoadState()).toBe(ModuleLoadState.META);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('is idempotent — second call does not rebuild files', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-idem-'));
            try {
                setupModuleDir(path.join(tmpDir, 'entry'), ['a.ets', 'b.ets']);
                const scene = makeLoadModuleSceneStub();
                const builder = new ModuleBuilder(scene);
                const module = builder.registerModule(path.join(tmpDir, 'entry'), '@ohos/entry');
                const moduleId = builder.getModuleCanonicalizer().getId(module);

                builder.loadModule(moduleId);
                expect(module.getLoadState()).toBe(ModuleLoadState.META);
                const fileCountAfterFirst = module.getFilesMap().size;

                // Second call should be a no-op
                builder.loadModule(moduleId);
                expect(module.getLoadState()).toBe(ModuleLoadState.META);
                expect(module.getFilesMap().size).toBe(fileCountAfterFirst);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('SDK modules: builds files at META level by default', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-sdk-meta-'));
            try {
                setupModuleDir(path.join(tmpDir, 'sdk'), ['api.ets']);
                const scene = makeLoadModuleSceneStub();
                const builder = new ModuleBuilder(scene);
                const module = builder.registerModule(path.join(tmpDir, 'sdk'), 'etsSdk');
                module.setModuleType(ModuleType.SDK);
                const moduleId = builder.getModuleCanonicalizer().getId(module);

                builder.loadModule(moduleId);

                expect(module.getLoadState()).toBe(ModuleLoadState.META);
                // SDK modules build ArkFiles at the effective META level like any other module
                expect(module.getFilesMap().size).toBe(1);
                // No file dependency analysis is performed below IMPORTS level
                expect(module.hasFileTopoOrder()).toBe(false);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('SDK modules: builds files and file deps at IMPORTS level', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-sdk-imports-'));
            try {
                setupModuleDir(path.join(tmpDir, 'sdk'), ['api.ets']);
                const scene = makeLoadModuleSceneStub();
                const builder = new ModuleBuilder(scene);
                const module = builder.registerModule(path.join(tmpDir, 'sdk'), 'etsSdk');
                module.setModuleType(ModuleType.SDK);
                const moduleId = builder.getModuleCanonicalizer().getId(module);

                const config = new ModuleAnalysisConfig();
                config.setLoadLevel(ModuleType.SDK, ModuleDepthLevel.IMPORTS);
                builder.loadModule(moduleId, config);

                expect(module.getFilesMap().size).toBe(1);
                expect(module.hasFileTopoOrder()).toBe(true);
                expect(module.getFileDepGraph()).toBeDefined();
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('creates ArkFile objects at META level (files exist but are not parsed)', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-meta-'));
            try {
                const modulePath = setupModuleDir(path.join(tmpDir, 'entry'), ['main.ets', 'utils.ts', 'index.ets']);
                const scene = makeLoadModuleSceneStub();
                const builder = new ModuleBuilder(scene);
                const module = builder.registerModule(modulePath, '@ohos/entry');
                const moduleId = builder.getModuleCanonicalizer().getId(module);

                builder.loadModule(moduleId);

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
                const scene = makeLoadModuleSceneStub();
                const builder = new ModuleBuilder(scene);
                const entry = builder.registerModule(path.join(tmpDir, 'entry'), '@ohos/entry');
                const library = builder.registerModule(path.join(tmpDir, 'library'), '@ohos/library');
                const entryId = builder.getModuleCanonicalizer().getId(entry);
                const libraryId = builder.getModuleCanonicalizer().getId(library);
                injectDepGraph(scene, builder, [[entryId, libraryId]]);

                // Load entry — should recursively load library first
                builder.loadModule(entryId);

                expect(library.getLoadState()).toBe(ModuleLoadState.META);
                expect(entry.getLoadState()).toBe(ModuleLoadState.META);
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
                const scene = makeLoadModuleSceneStub();
                const builder = new ModuleBuilder(scene);
                const a = builder.registerModule(path.join(tmpDir, 'a'), '@a');
                const b = builder.registerModule(path.join(tmpDir, 'b'), '@b');
                const idA = builder.getModuleCanonicalizer().getId(a);
                const idB = builder.getModuleCanonicalizer().getId(b);
                injectDepGraph(scene, builder, [
                    [idA, idB],
                    [idB, idA],
                ]);

                builder.loadModule(idA);

                expect(a.getLoadState()).toBe(ModuleLoadState.META);
                expect(b.getLoadState()).toBe(ModuleLoadState.META);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('returns null for a non-existent module ID without throwing', () => {
            const scene = makeLoadModuleSceneStub();
            const builder = new ModuleBuilder(scene);
            expect(() => builder.loadModule(999)).not.toThrow();
        });

        it('IMPORTS level: populates import/export info on ArkFiles', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-imports-io-'));
            try {
                const modulePath = path.join(tmpDir, 'entry');
                fs.mkdirSync(modulePath, { recursive: true });
                fs.writeFileSync(path.join(modulePath, 'a.ets'), "import { foo } from './b';\n");
                fs.writeFileSync(path.join(modulePath, 'b.ets'), 'export const foo = 1;\n');
                const scene = makeLoadModuleSceneStub();
                const builder = new ModuleBuilder(scene);
                const module = builder.registerModule(modulePath, '@ohos/entry');
                const moduleId = builder.getModuleCanonicalizer().getId(module);

                const config = new ModuleAnalysisConfig();
                config.setLoadLevel(ModuleType.PROJECT, ModuleDepthLevel.IMPORTS);
                builder.loadModule(moduleId, config);

                const filesMap = module.getFilesMap();
                expect(filesMap.size).toBe(2);
                // Locate the ArkFile for a.ets and b.ets by their file path basename
                let aFile: ArkFile | undefined;
                let bFile: ArkFile | undefined;
                for (const arkFile of filesMap.values()) {
                    const base = path.basename(arkFile.getFilePath());
                    if (base === 'a.ets') {
                        aFile = arkFile;
                    } else if (base === 'b.ets') {
                        bFile = arkFile;
                    }
                }
                expect(aFile).toBeDefined();
                expect(bFile).toBeDefined();
                expect(aFile!.getImportInfos().length).toBeGreaterThanOrEqual(1);
                expect(bFile!.getExportInfos().length).toBeGreaterThanOrEqual(1);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('IMPORTS level: no ArkClass/ArkBody built', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-imports-noclass-'));
            try {
                const modulePath = path.join(tmpDir, 'entry');
                fs.mkdirSync(modulePath, { recursive: true });
                fs.writeFileSync(path.join(modulePath, 'cls.ets'), 'export const x = 1;\n');
                const scene = makeLoadModuleSceneStub();
                const builder = new ModuleBuilder(scene);
                const module = builder.registerModule(modulePath, '@ohos/entry');
                const moduleId = builder.getModuleCanonicalizer().getId(module);

                const config = new ModuleAnalysisConfig();
                config.setLoadLevel(ModuleType.PROJECT, ModuleDepthLevel.IMPORTS);
                builder.loadModule(moduleId, config);

                expect(module.getFilesMap().size).toBe(1);
                const arkFile = module.getFilesMap().values().next().value as ArkFile;
                // At IMPORTS level, only import/export info is built — no classes or namespaces
                expect(arkFile.getClasses().length).toBe(0);
                expect(arkFile.getNamespaces().length).toBe(0);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('META level: no import/export info', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-meta-noio-'));
            try {
                const modulePath = path.join(tmpDir, 'entry');
                fs.mkdirSync(modulePath, { recursive: true });
                fs.writeFileSync(path.join(modulePath, 'a.ets'), "import { foo } from './b';\n");
                fs.writeFileSync(path.join(modulePath, 'b.ets'), 'export const foo = 1;\n');
                const scene = makeLoadModuleSceneStub();
                const builder = new ModuleBuilder(scene);
                const module = builder.registerModule(modulePath, '@ohos/entry');
                const moduleId = builder.getModuleCanonicalizer().getId(module);

                // Default config -> META level: import/export info is not populated
                builder.loadModule(moduleId);

                for (const arkFile of module.getFilesMap().values()) {
                    expect(arkFile.getImportInfos().length).toBe(0);
                    expect(arkFile.getExportInfos().length).toBe(0);
                }
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('analyzeFileDependencies: builds file dependency graph', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-filedeps-'));
            try {
                const modulePath = path.join(tmpDir, 'entry');
                fs.mkdirSync(modulePath, { recursive: true });
                fs.writeFileSync(path.join(modulePath, 'a.ets'), "import { x } from './b';\n");
                fs.writeFileSync(path.join(modulePath, 'b.ets'), "import { y } from './c';\n");
                fs.writeFileSync(path.join(modulePath, 'c.ets'), 'export const y = 1;\n');
                const scene = makeLoadModuleSceneStub();
                const builder = new ModuleBuilder(scene);
                const module = builder.registerModule(modulePath, '@ohos/entry');
                const moduleId = builder.getModuleCanonicalizer().getId(module);

                const config = new ModuleAnalysisConfig();
                config.setLoadLevel(ModuleType.PROJECT, ModuleDepthLevel.IMPORTS);
                builder.loadModule(moduleId, config);

                expect(module.hasFileTopoOrder()).toBe(true);
                const fileDepGraph = module.getFileDepGraph()!;
                const topoOrder = fileDepGraph.getTopoOrder();
                expect(topoOrder.length).toBe(3);
                expect(module.getFileDepGraph()).toBeDefined();

                // Resolve each topo-order NodeID to its ArkFile and collect basenames
                const basenamesInTopoOrder: string[] = [];
                for (const fileId of topoOrder) {
                    const arkFile = fileDepGraph.getNode(fileId);
                    basenamesInTopoOrder.push(path.basename(arkFile.getFilePath()));
                }
                // Dependency order: c.ets (no deps) before b.ets (imports c) before a.ets (imports b)
                expect(basenamesInTopoOrder).toEqual(['c.ets', 'b.ets', 'a.ets']);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        it('SIGNATURES config capped to IMPORTS', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-load-sig-capped-'));
            try {
                const modulePath = path.join(tmpDir, 'entry');
                fs.mkdirSync(modulePath, { recursive: true });
                fs.writeFileSync(path.join(modulePath, 'a.ets'), "import { foo } from './b';\n");
                fs.writeFileSync(path.join(modulePath, 'b.ets'), 'export const foo = 1;\n');
                const scene = makeLoadModuleSceneStub();
                const builder = new ModuleBuilder(scene);
                const module = builder.registerModule(modulePath, '@ohos/entry');
                const moduleId = builder.getModuleCanonicalizer().getId(module);

                const config = new ModuleAnalysisConfig();
                config.setLoadLevel(ModuleType.PROJECT, ModuleDepthLevel.SIGNATURES);
                builder.loadModule(moduleId, config);

                // Effective level is capped to IMPORTS: import/export info is populated
                let aFile: ArkFile | undefined;
                let bFile: ArkFile | undefined;
                for (const arkFile of module.getFilesMap().values()) {
                    const base = path.basename(arkFile.getFilePath());
                    if (base === 'a.ets') {
                        aFile = arkFile;
                    } else if (base === 'b.ets') {
                        bFile = arkFile;
                    }
                }
                expect(aFile).toBeDefined();
                expect(bFile).toBeDefined();
                expect(aFile!.getImportInfos().length).toBeGreaterThanOrEqual(1);
                expect(bFile!.getExportInfos().length).toBeGreaterThanOrEqual(1);
                // The load state reflects the effective capped level (IMPORTS)
                expect(module.getLoadState()).toBe(ModuleLoadState.IMPORTS);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });
});
