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
import { ArkModule, ModuleLoadState, ModuleType } from '../../src/core/model/ArkModule';
import { ArkFile, Language } from '../../src/core/model/ArkFile';
import { FileSignature } from '../../src';
import type { Scene, ModuleScene } from '../../src/Scene';

const STUB_SCENE = {} as Scene;

function makeArkFile(projectName: string, fileName: string): ArkFile {
    const arkFile = new ArkFile(Language.TYPESCRIPT);
    arkFile.setFileSignature(new FileSignature(projectName, fileName));
    return arkFile;
}

function makeModuleSceneStub(modulePath: string, moduleName: string, files: Map<string, ArkFile>): ModuleScene {
    return {
        getModulePath: () => modulePath,
        getModuleName: () => moduleName,
        getModuleFilesMap: () => files,
    } as unknown as ModuleScene;
}

describe('ArkModule tests', () => {
    describe('constructor defaults', () => {
        it('initializes loadState, moduleType and filesMap with default values', () => {
            const module = new ArkModule(STUB_SCENE);
            expect(module.getLoadState()).toBe(ModuleLoadState.NOT_LOADED);
            expect(module.getModuleType()).toBe(ModuleType.PROJECT);
            expect(module.getFilesMap().size).toBe(0);
        });

        it('returns the scene passed to the constructor', () => {
            const scene = {} as Scene;
            const module = new ArkModule(scene);
            expect(module.getScene()).toBe(scene);
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

            module.setLoadState(ModuleLoadState.ANALYZED);
            expect(module.getLoadState()).toBe(ModuleLoadState.ANALYZED);
            expect(module.getModuleType()).toBe(ModuleType.PROJECT);

            module.setModuleType(ModuleType.SDK);
            expect(module.getModuleType()).toBe(ModuleType.SDK);
            expect(module.getLoadState()).toBe(ModuleLoadState.ANALYZED);

            module.setLoadState(ModuleLoadState.DISPOSED);
            expect(module.getLoadState()).toBe(ModuleLoadState.DISPOSED);
            expect(module.getModuleType()).toBe(ModuleType.SDK);

            module.setModuleType(ModuleType.OH_MODULES);
            expect(module.getModuleType()).toBe(ModuleType.OH_MODULES);
            expect(module.getLoadState()).toBe(ModuleLoadState.DISPOSED);
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
            for (const state of [ModuleLoadState.NOT_LOADED, ModuleLoadState.LOADED, ModuleLoadState.ANALYZED, ModuleLoadState.DISPOSED]) {
                module.setLoadState(state);
                expect(module.getLoadState()).toBe(state);
            }
        });
    });

    describe('dependency management', () => {
        it('adds and queries direct dependencies', () => {
            const module = new ArkModule(STUB_SCENE);
            expect(module.hasDependency(1)).toBe(false);
            module.addDependency(1);
            module.addDependency(5);
            expect(module.hasDependency(1)).toBe(true);
            expect(module.hasDependency(5)).toBe(true);
            expect(module.hasDependency(2)).toBe(false);
            const ids = [...module.getDependencyIds()];
            expect(ids.sort((a, b) => a - b)).toEqual([1, 5]);
        });

        it('adds and queries dependents', () => {
            const module = new ArkModule(STUB_SCENE);
            expect(module.hasDependent(3)).toBe(false);
            module.addDependent(3);
            expect(module.hasDependent(3)).toBe(true);
            expect(module.hasDependent(4)).toBe(false);
            const ids = [...module.getDependentIds()];
            expect(ids).toEqual([3]);
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

    describe('external dependencies', () => {
        it('stores and exposes external dependencies', () => {
            const module = new ArkModule(STUB_SCENE);
            expect(module.getExternalDependencies().size).toBe(0);
            module.addExternalDependency('lodash', '^4.17.0');
            module.addExternalDependency('axios', 'file:../axios');
            const deps = module.getExternalDependencies();
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
                fs.writeFileSync(
                    path.join(tmpDir, 'oh-package.json5'),
                    JSON.stringify({ name: '@ohos/lib', version: '1.0.0' })
                );
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

    describe('fromModuleScene', () => {
        it('migrates modulePath, moduleName and filesMap from ModuleScene', () => {
            const files = new Map<string, ArkFile>();
            const file1 = makeArkFile('project', 'src/a.ts');
            const file2 = makeArkFile('project', 'src/b.ts');
            files.set(file1.getFileSignature().toMapKey(), file1);
            files.set(file2.getFileSignature().toMapKey(), file2);

            const scene = {} as Scene;
            const ms = makeModuleSceneStub('/project/lib', '@ohos/lib', files);
            const module = ArkModule.fromModuleScene(ms, scene);

            expect(module.getModulePath()).toBe('/project/lib');
            expect(module.getModuleName()).toBe('@ohos/lib');
            expect(module.getScene()).toBe(scene);
            expect(module.getFilesMap().size).toBe(2);
            expect(module.getFilesMap().get(file1.getFileSignature().toMapKey())).toBe(file1);
            expect(module.getFilesMap().get(file2.getFileSignature().toMapKey())).toBe(file2);
        });

        it('does not migrate dependency aliases', () => {
            const ms = makeModuleSceneStub('/project/lib', '@ohos/lib', new Map());
            const module = ArkModule.fromModuleScene(ms, STUB_SCENE);
            expect(module.getDependencyAliasToId().size).toBe(0);
        });

        it('applies default loadState and moduleType after migration', () => {
            const ms = makeModuleSceneStub('/project/lib', '@ohos/lib', new Map());
            const module = ArkModule.fromModuleScene(ms, STUB_SCENE);
            expect(module.getLoadState()).toBe(ModuleLoadState.NOT_LOADED);
            expect(module.getModuleType()).toBe(ModuleType.PROJECT);
        });
    });
});
