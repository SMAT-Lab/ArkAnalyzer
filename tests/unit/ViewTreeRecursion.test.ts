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

import { SceneConfig } from '../../src/Config';
import { describe, it, expect } from 'vitest';
import { Scene } from '../../src/Scene';
import path from 'path';

function buildSceneForDir(dir: string): Scene {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, `../resources/viewtree/${dir}`));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();
    return scene;
}

describe('recursion guard - self-referencing builder (T1)', () => {
    it('builds SelfRefBuilder without infinite recursion', () => {
        const scene = buildSceneForDir('recursion');
        const arkFile = scene.getFiles().find(f => f.getName() === 'SelfRefBuilder.ets');
        expect(arkFile).toBeDefined();
        const cls = arkFile!.getClassWithName('SelfRefBuilder');
        expect(cls).toBeDefined();

        // Without the buildingTrees guard, this call infinite-recurses and
        // vitest times out. With the guard, foo's self-reference returns an
        // empty placeholder node and the build completes.
        const vt = cls!.getViewTree();
        expect(vt).toBeDefined();
        const root = vt!.getRoot();
        expect(root).not.toBeNull();
    });
});

describe('recursion guard - mutually recursive components (T2)', () => {
    it('builds CompA and CompB without infinite recursion', () => {
        const scene = buildSceneForDir('recursion');
        const arkFile = scene.getFiles().find(f => f.getName() === 'MutualRecursion.ets');
        expect(arkFile).toBeDefined();
        const compA = arkFile!.getClassWithName('CompA');
        const compB = arkFile!.getClassWithName('CompB');
        expect(compA).toBeDefined();
        expect(compB).toBeDefined();

        // Trigger CompA first; its build references CompB, which references
        // CompA back. The buildingTrees guard cuts the cycle.
        const vtA = compA!.getViewTree();
        expect(vtA).toBeDefined();
        expect(vtA!.getRoot()).not.toBeNull();

        const vtB = compB!.getViewTree();
        expect(vtB).toBeDefined();
        expect(vtB!.getRoot()).not.toBeNull();
    });
});
