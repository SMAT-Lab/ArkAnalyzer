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
import { ArkModule, ModuleLoadState, ModuleType, ModuleID } from '../../src/core/model/ArkModule';
import { ArkFile, Language } from '../../src/core/model/ArkFile';
import { FileSignature } from '../../src';
import { ModuleBuilder } from '../../src/frontend/common/ModuleBuilder';
import { ModuleDepGraph } from '../../src/core/graph/ModuleDepGraph';
import { Scene } from '../../src/Scene';

const STUB_SCENE = {} as Scene;

/** Create a real Scene for getDependencies/getDependents tests (ArkModule queries the Scene). */
function makeStubScene(): Scene {
    return new Scene();
}

function makeArkFile(projectName: string, fileName: string): ArkFile {
    const arkFile = new ArkFile(Language.TYPESCRIPT);
    arkFile.setFileSignature(new FileSignature(projectName, fileName));
    return arkFile;
}

/**
 * Inject a ModuleDepGraph with the given edges into the scene.
 * All currently-registered modules are added as graph nodes.
 */
function injectDepGraph(scene: Scene, builder: ModuleBuilder, edges: Array<[ModuleID, ModuleID]>): ModuleDepGraph {
    const graph = builder.createModuleDepGraph();
    for (const module of builder.modulesIterator()) {
        graph.addModule(module);
    }
    for (const [src, dst] of edges) {
        graph.addDependencyEdge(src, dst);
    }
    scene.setModuleDepGraph(graph);
    return graph;
}

describe('ArkModule tests', () => {
    describe('constructor defaults', () => {
        it('initializes loadState, moduleType and filesMap with default values', () => {
            const module = new ArkModule(STUB_SCENE);
            expect(module.getLoadState()).toBe(ModuleLoadState.NOT_LOADED);
            expect(module.getModuleType()).toBe(ModuleType.PROJECT);
            expect(module.getFilesMap().size).toBe(0);
        });
    });

    describe('modulePath / moduleName getters and setters', () => {
        it('reads and writes modulePath', () => {
            const module = new ArkModule(STUB_SCENE);
            expect(module.getModulePath()).toBe('');
            module.setModulePath('/project/entry');
            expect(module.getModulePath()).toBe('/project/entry');
        });

        it('reads and writes moduleName', () => {
            const module = new ArkModule(STUB_SCENE);
            expect(module.getModuleName()).toBe('');
            module.setModuleName('@ohos/entry');
            expect(module.getModuleName()).toBe('@ohos/entry');
        });
    });

    describe('tags bit-field independence', () => {
        it('keeps loadState and moduleType independent while sharing the tags field', () => {
            const module = new ArkModule(STUB_SCENE);
            expect(module.getLoadState()).toBe(ModuleLoadState.NOT_LOADED);
            expect(module.getModuleType()).toBe(ModuleType.PROJECT);

            module.setLoadState(ModuleLoadState.SIGNATURES);
            expect(module.getLoadState()).toBe(ModuleLoadState.SIGNATURES);
            expect(module.getModuleType()).toBe(ModuleType.PROJECT);

            module.setModuleType(ModuleType.SDK);
            expect(module.getModuleType()).toBe(ModuleType.SDK);
            expect(module.getLoadState()).toBe(ModuleLoadState.SIGNATURES);

            module.setLoadState(ModuleLoadState.BODIES);
            expect(module.getLoadState()).toBe(ModuleLoadState.BODIES);
            expect(module.getModuleType()).toBe(ModuleType.SDK);

            module.setModuleType(ModuleType.OH_MODULES);
            expect(module.getModuleType()).toBe(ModuleType.OH_MODULES);
            expect(module.getLoadState()).toBe(ModuleLoadState.BODIES);
        });

        it('supports setModuleType / getModuleType for all values', () => {
            const module = new ArkModule(STUB_SCENE);
            for (const type of [ModuleType.PROJECT, ModuleType.SDK, ModuleType.OH_MODULES]) {
                module.setModuleType(type);
                expect(module.getModuleType()).toBe(type);
            }
        });

        it('supports setLoadState / getLoadState for all values', () => {
            const module = new ArkModule(STUB_SCENE);
            for (const state of [
                ModuleLoadState.NOT_LOADED,
                ModuleLoadState.META,
                ModuleLoadState.IMPORTS,
                ModuleLoadState.SIGNATURES,
                ModuleLoadState.BODIES,
            ]) {
                module.setLoadState(state);
                expect(module.getLoadState()).toBe(state);
            }
        });
    });

    describe('dependency alias mapping', () => {
        it('resolves an alias added via addDependencyAlias', () => {
            const module = new ArkModule(STUB_SCENE);
            module.addDependencyAlias('@ohos/library', 7);
            expect(module.resolveDependencyAlias('@ohos/library')).toBe(7);
            expect(module.resolveDependencyAlias('@ohos/unknown')).toBeUndefined();
        });

        it('overrides an existing alias with the latest value', () => {
            const module = new ArkModule(STUB_SCENE);
            module.addDependencyAlias('@ohos/library', 7);
            module.addDependencyAlias('@ohos/library', 9);
            expect(module.resolveDependencyAlias('@ohos/library')).toBe(9);
            expect(module.getDependencyAliasToId().size).toBe(1);
        });
    });

    describe('unresolved dependencies', () => {
        it('stores and exposes unresolved dependencies', () => {
            const module = new ArkModule(STUB_SCENE);
            expect(module.getUnresolvedDependencies().size).toBe(0);
            module.addUnresolvedDependency('lodash', '^4.17.0');
            module.addUnresolvedDependency('axios', 'file:../axios');
            const deps = module.getUnresolvedDependencies();
            expect(deps.get('lodash')).toBe('^4.17.0');
            expect(deps.get('axios')).toBe('file:../axios');
            expect(deps.size).toBe(2);
        });
    });

    describe('file management', () => {
        it('adds a file keyed by FileSignature.toMapKey()', () => {
            const module = new ArkModule(STUB_SCENE);
            const arkFile = makeArkFile('project', 'src/main/Entry.ts');
            module.addFile(arkFile);
            const filesMap = module.getFilesMap();
            expect(filesMap.size).toBe(1);
            const expectedKey = arkFile.getFileSignature().toMapKey();
            expect(filesMap.has(expectedKey)).toBe(true);
            expect(filesMap.get(expectedKey)).toBe(arkFile);
        });

        it('clears all files via clearFilesMap', () => {
            const module = new ArkModule(STUB_SCENE);
            module.addFile(makeArkFile('project', 'a.ts'));
            module.addFile(makeArkFile('project', 'b.ts'));
            expect(module.getFilesMap().size).toBe(2);
            module.clearFilesMap();
            expect(module.getFilesMap().size).toBe(0);
        });
    });

    describe('oh-package.json5', () => {
        it('getOhPkgPath returns path.join(modulePath, "oh-package.json5")', () => {
            const module = new ArkModule(STUB_SCENE);
            module.setModulePath('/project/entry');
            expect(module.getOhPkgPath()).toBe(path.join('/project/entry', 'oh-package.json5'));
        });

        it('readOhPkgContent returns {} when the file does not exist', () => {
            const module = new ArkModule(STUB_SCENE);
            module.setModulePath(path.join(os.tmpdir(), 'non-existent-arkmodule-path'));
            expect(module.readOhPkgContent()).toEqual({});
        });

        it('readOhPkgContent returns parsed content when the file exists', () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arkmodule-'));
            try {
                fs.writeFileSync(path.join(tmpDir, 'oh-package.json5'), JSON.stringify({ name: '@ohos/lib', version: '1.0.0' }));
                const module = new ArkModule(STUB_SCENE);
                module.setModulePath(tmpDir);
                const content = module.readOhPkgContent();
                expect(content.name).toBe('@ohos/lib');
                expect(content.version).toBe('1.0.0');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });

    describe('getDependencies / getDependents', () => {
        it('returns empty arrays when the dependency graph has not been built', () => {
            const scene = makeStubScene();
            const builder = new ModuleBuilder(scene);
            const entry = builder.registerModule('/project/entry', '@ohos/entry');
            expect(entry.getDependencies()).toEqual([]);
            expect(entry.getDependents()).toEqual([]);
        });

        it('getDependencies returns successor modules from the dependency graph', () => {
            const scene = makeStubScene();
            const builder = new ModuleBuilder(scene);
            const entry = builder.registerModule('/project/entry', '@ohos/entry');
            const library = builder.registerModule('/project/library', '@ohos/library');
            const entryId = builder.getModuleId(entry);
            const libraryId = builder.getModuleId(library);
            injectDepGraph(scene, builder, [[entryId, libraryId]]);

            const deps = entry.getDependencies();
            expect(deps.length).toBe(1);
            expect(deps[0]).toBe(library);

            // library has no dependencies
            expect(library.getDependencies()).toEqual([]);
        });

        it('getDependents returns predecessor modules from the dependency graph', () => {
            const scene = makeStubScene();
            const builder = new ModuleBuilder(scene);
            const entry = builder.registerModule('/project/entry', '@ohos/entry');
            const library = builder.registerModule('/project/library', '@ohos/library');
            const entryId = builder.getModuleId(entry);
            const libraryId = builder.getModuleId(library);
            injectDepGraph(scene, builder, [[entryId, libraryId]]);

            const dependents = library.getDependents();
            expect(dependents.length).toBe(1);
            expect(dependents[0]).toBe(entry);

            // entry has no dependents
            expect(entry.getDependents()).toEqual([]);
        });

        it('handles multiple dependencies and dependents', () => {
            const scene = makeStubScene();
            const builder = new ModuleBuilder(scene);
            const a = builder.registerModule('/project/a', '@a');
            const b = builder.registerModule('/project/b', '@b');
            const c = builder.registerModule('/project/c', '@c');
            const idA = builder.getModuleId(a);
            const idB = builder.getModuleId(b);
            const idC = builder.getModuleId(c);
            // a -> b, a -> c
            injectDepGraph(scene, builder, [
                [idA, idB],
                [idA, idC],
            ]);

            const aDeps = a.getDependencies();
            expect(aDeps.length).toBe(2);
            expect(aDeps).toContain(b);
            expect(aDeps).toContain(c);

            const bDependents = b.getDependents();
            expect(bDependents.length).toBe(1);
            expect(bDependents[0]).toBe(a);

            const cDependents = c.getDependents();
            expect(cDependents.length).toBe(1);
            expect(cDependents[0]).toBe(a);
        });
    });
});
