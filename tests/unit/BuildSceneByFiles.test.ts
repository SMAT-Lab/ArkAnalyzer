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

import { assert, describe, expect, it, vi, beforeAll } from 'vitest';
import { SceneConfig } from '../../src/Config';
import { Scene } from '../../src/Scene';
import { ArkClass } from '../../src';
import * as fileBuilder from '../../src/core/model/builder/ArkFileBuilder';

describe('build scene by files Test', () => {
    let scene: Scene;

    beforeAll(() => {
        const filesPath: string[] = ['./'];
        const projectDir = './tests/resources/dependency/exampleProject/MyApplication4Files';
        const projectName = 'MyApplication4Files';
        const sceneConfig: SceneConfig = new SceneConfig();
        sceneConfig.buildFromProjectFiles(projectName, projectDir, filesPath);

        scene = new Scene();
        scene.buildSceneFromFiles(sceneConfig);
        scene.inferTypes();
    });

    it('check files num', () => {
        // 19 = 项目目录内文件。旧值 21 含 2 个 tsconfig paths 指向的越界兄弟目录
        // （../DependencyTest*）文件——越界文件签名畸形（fileName 为 ../ 相对路径），
        // 现已被 getDependencyFilesDeeply 的项目目录范围守卫排除（与目录扫描语义对齐）。
        assert.equal(scene.getFiles().length, 19);
        assert.equal(scene.getModuleSceneMap().size, 6);
        // 34 → 30：随越界文件排除，其类/方法不再计入（少 2 文件的 default class 与用户类）。
        assert.equal(scene.getClasses().length, 30);
        assert.equal(scene.getMethods().length, 66);
        assert.equal(scene.getModuleSceneMap().size, 6);
        assert.equal(scene.getModuleSceneMap().get('lib1')?.getModuleFilesMap().size, 2);
        assert.equal(scene.getModuleSceneMap().get('libbase')?.getModuleFilesMap().size, 4);
        assert.equal(scene.getModuleSceneMap().get('log4js')?.getModuleFilesMap().size, 2);
        assert.equal(scene.getModuleSceneMap().get('model1')?.getModuleFilesMap().size, 4);
        assert.equal(scene.getModuleSceneMap().get('model2')?.getModuleFilesMap().size, 2);
        assert.equal(scene.getModuleSceneMap().get('parameter_test')?.getModuleFilesMap().size, 1);
    });

    it('check dependencies info', () => {
        assert.equal(scene.getOverRides().get('@MyLib'), './libbase/lib1');
        assert.equal(scene.getOverRides().get('@ohos/model2'), 'file:./libs/model2.har');
        assert.equal(JSON.stringify(scene.getGlobalModule2PathMapping()!), JSON.stringify(globalModule2PathMapping_expect_result));
        assert.equal(scene.getbaseUrl(), './');
        // API 兼容性：根 oh-package.json5 内容构建后可查（快照回填，构建期上下文已释放）。
        const ohPkgContent = scene.getOhPkgContent();
        assert.equal((ohPkgContent.dependencies as { [k: string]: string })['@MyLib'], './lib1');
        assert.equal(ohPkgContent.modelVersion, '5.0.0');
    });

    it('check import', () => {
        const arkFile = scene.getFiles().find(f => f.getName().endsWith('Libbase.ets'));
        assert.isDefined(arkFile);
        const arkExport = arkFile?.getImportInfoBy('Model2')?.getLazyExportInfo()?.getArkExport();
        assert.isTrue(arkExport instanceof ArkClass);
    });
});

describe('build scene by files With Circular Dependency', () => {
    let scene: Scene;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let spy: any;

    beforeAll(() => {
        spy = vi.spyOn(fileBuilder, 'buildArkFileFromFile');
        const filesPath: string[] = ['./'];
        const projectDir = './tests/resources/dependency/exampleProject/CircularDependency';
        const projectName = 'CircularDependency';
        const sceneConfig: SceneConfig = new SceneConfig();
        sceneConfig.buildFromProjectFiles(projectName, projectDir, filesPath);
        sceneConfig.getOptions().enableBuiltIn = false;

        scene = new Scene();
        scene.buildSceneFromFiles(sceneConfig);
        scene.inferTypes();
    });

    it('check circular dependencies', () => {
        const expectedFilesKey = ['file1.ts', 'file2.ts', 'file3.ts'];
        const files = scene.getFiles();
        assert.equal(files.length, expectedFilesKey.length);
        files.forEach((file, index) => {
            assert.equal(file.getName(), expectedFilesKey[index]);
        });
        expect(spy).toHaveBeenCalledTimes(3);
    });
});

export const globalModule2PathMapping_expect_result = {
    '@DependencyTest/': ['../DependencyTest/', '../DependencyTest1/'],
    '@DependencyTest/*': ['../DependencyTest/*', '../DependencyTest1/*'],
    'DependencyTest/': ['../DependencyTest/', '../DependencyTest1/'],
    'DependencyTest/*': ['../DependencyTest/*', '../DependencyTest1/*'],
};
