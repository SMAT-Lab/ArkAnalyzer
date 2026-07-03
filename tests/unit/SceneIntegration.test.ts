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
import { Scene } from '../../src/Scene';
import { SceneConfig } from '../../src/Config';
import { ArkModule } from '../../src/core/model/ArkModule';
import { ModuleBuilder } from '../../src/frontend/common/ModuleBuilder';

describe('Scene integration tests', () => {
    describe('config(sceneConfig)', () => {
        it('saves SceneConfig and makes it retrievable via getSceneConfig()', () => {
            const scene = new Scene();
            expect(scene.getSceneConfig()).toBeUndefined();

            const sceneConfig = new SceneConfig();
            scene.config(sceneConfig);

            expect(scene.getSceneConfig()).toBe(sceneConfig);
        });
    });

    describe('getSceneConfig()', () => {
        it('returns undefined before config() is called', () => {
            const scene = new Scene();
            expect(scene.getSceneConfig()).toBeUndefined();
        });

        it('returns the saved config after config() is called', () => {
            const scene = new Scene();
            const sceneConfig = new SceneConfig();
            scene.config(sceneConfig);
            expect(scene.getSceneConfig()).toBe(sceneConfig);
        });
    });

    describe('getModules()', () => {
        it('returns an empty array when no modules are registered', () => {
            const scene = new Scene();
            expect(scene.getModules()).toEqual([]);
        });

        it('returns registered ArkModule list', () => {
            const scene = new Scene();
            const builder = new ModuleBuilder(scene);

            const moduleA = builder.registerModule('/project/a', 'moduleA');
            const moduleB = builder.registerModule('/project/b', 'moduleB');

            const modules = scene.getModules();
            expect(modules.length).toBe(2);
            expect(modules).toContain(moduleA);
            expect(modules).toContain(moduleB);
            expect(modules[0]).toBeInstanceOf(ArkModule);
        });
    });
});
