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

import { assert, describe, expect, it, vi } from 'vitest';
import { SceneConfig } from '../../src/Config';
import { Scene } from '../../src/Scene';
import { ArkClass } from '../../src';
import * as fileBuilder from '../../src/core/model/builder/ArkFileBuilder';

describe('build scene by files Test', () => {

    const filesPath: string[] = ['./'];
    const projectDir = './tests/resources/dependency/exampleProject/MyApplication4Files';
    const projectName = 'MyApplication4Files';
    const sceneConfig: SceneConfig = new SceneConfig();
    sceneConfig.buildFromProjectFiles(projectName, projectDir, filesPath);

    const scene: Scene = new Scene();
    scene.buildSceneFromFiles(sceneConfig);
    scene.inferTypes();
    it('check files num', () => {
        assert.equal(scene.getFiles().length, 17);
        assert.equal(scene.getModuleSceneMap().size, 6);
        assert.equal(scene.getClasses().length, 28);
        assert.equal(scene.getMethods().length, 64);
        assert.equal(scene.getModuleSceneMap().size, 6);
        assert.equal(scene.getModuleSceneMap().get('lib1')?.getModuleFilesMap().size, 2);
        assert.equal(scene.getModuleSceneMap().get('libbase')?.getModuleFilesMap().size, 4);
        assert.equal(scene.getModuleSceneMap().get('log4js')?.getModuleFilesMap().size, 2);
        assert.equal(scene.getModuleSceneMap().get('model1')?.getModuleFilesMap().size, 4);
        assert.equal(scene.getModuleSceneMap().get('model2')?.getModuleFilesMap().size, 2);
        assert.equal(scene.getModuleSceneMap().get('parameter_test')?.getModuleFilesMap().size, 1);
    });

    it('check dependencies info', () => {
        assert.equal(scene.getOverRides().get('@model1'), './model1/index11.ets');
        assert.equal(scene.getOverRides().get('@model2'), 'file:./model2');
        assert.equal(JSON.stringify(scene.getGlobalModule2PathMapping()!), JSON.stringify(globalModule2PathMapping_expect_result));
        assert.equal(scene.getbaseUrl(), './');
    });

    it('check import', () => {
        const arkFile = scene.getFiles().find(f => f.getName().endsWith('Libbase.ets'));
        assert.isDefined(arkFile);
        const arkExport = arkFile?.getImportInfoBy('Model2')?.getLazyExportInfo()?.getArkExport();
        assert.isTrue(arkExport instanceof ArkClass);
    });
});

describe('build scene by files With Circular Dependency', () => {
    const filesPath: string[] = ['./'];
    const projectDir = './tests/resources/dependency/exampleProject/CircularDependency';
    const projectName = 'CircularDependency';
    const sceneConfig: SceneConfig = new SceneConfig();
    sceneConfig.buildFromProjectFiles(projectName, projectDir, filesPath);
    sceneConfig.getOptions().enableBuiltIn = false;

    const scene: Scene = new Scene();
    const spy = vi.spyOn(fileBuilder, 'buildArkFileFromFile');
    scene.buildSceneFromFiles(sceneConfig);
    scene.inferTypes();

    it('check circular dependencies', () => {
        const expectedFilesKey = ['file3.ts', 'file2.ts', 'file1.ts'];
        const files = scene.getFiles();
        assert.equal(files.length, expectedFilesKey.length);
        files.forEach((file, index) => {
            assert.equal(file.getName(), expectedFilesKey[index]);
        });
        expect(spy).toHaveBeenCalledTimes(3);
    });
});

export const globalModule2PathMapping_expect_result = {
    '@DependencyTest/': [
        '../DependencyTest/',
        '../DependencyTest1/'
    ],
    '@DependencyTest/*': [
        '../DependencyTest/*',
        '../DependencyTest1/*'
    ],
    'DependencyTest/': [
        '../DependencyTest/',
        '../DependencyTest1/'
    ],
    'DependencyTest/*': [
        '../DependencyTest/*',
        '../DependencyTest1/*'
    ]
};

