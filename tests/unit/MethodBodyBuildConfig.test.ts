/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { assert, describe, it } from 'vitest';
import path from 'path';
import { SceneConfig } from '../../src/Config';
import { Scene } from '../../src/Scene';

describe('MethodBodyBuild Config Test', () => {
    const testFile = path.join(__dirname, '../resources/inferType/Target.ets');

    it('should build method body when enableMethodBodyBuild is undefined (default)', () => {
        const config: SceneConfig = new SceneConfig();
        config.buildConfig('test', '', [], [testFile]);

        const scene: Scene = new Scene();
        scene.buildSceneFromProjectDir(config);

        const methods = scene.getMethods();
        assert.isTrue(methods.length > 0);

        const userMethod = methods.find(m => !m.isGenerated());
        assert.isDefined(userMethod);

        const body = userMethod!.getBody();
        assert.isDefined(body);
        assert.isDefined(body!.getCfg());
        assert.isTrue(body!.getCfg().getBlocks().size > 0);
    });

    it('should build method body when enableMethodBodyBuild is true', () => {
        const config: SceneConfig = new SceneConfig({ enableMethodBodyBuild: true });
        config.buildConfig('test', '', [], [testFile]);

        const scene: Scene = new Scene();
        scene.buildSceneFromProjectDir(config);

        const methods = scene.getMethods();
        assert.isTrue(methods.length > 0);

        const userMethod = methods.find(m => !m.isGenerated());
        assert.isDefined(userMethod);

        const body = userMethod!.getBody();
        assert.isDefined(body);
        assert.isDefined(body!.getCfg());
        assert.isTrue(body!.getCfg().getBlocks().size > 0);
    });

    it('should skip method body build and free body builders when enableMethodBodyBuild is false', () => {
        const config: SceneConfig = new SceneConfig({ enableMethodBodyBuild: false });
        config.buildConfig('test', '', [], [testFile]);

        const scene: Scene = new Scene();
        scene.buildSceneFromProjectDir(config);

        const methods = scene.getMethods();
        assert.isTrue(methods.length > 0);

        const userMethods = methods.filter(m => !m.isGenerated());
        assert.isTrue(userMethods.length > 0);

        for (const userMethod of userMethods) {
            const body = userMethod.getBody();
            assert.isUndefined(body);
        }
    });

    it('should have methods available even when method body is skipped', () => {
        const config: SceneConfig = new SceneConfig({ enableMethodBodyBuild: false });
        config.buildConfig('test', '', [], [testFile]);

        const scene: Scene = new Scene();
        scene.buildSceneFromProjectDir(config);

        const methods = scene.getMethods();
        const userMethods = methods.filter(m => !m.isGenerated());
        const methodNames = userMethods.map(m => m.getName());
        assert.include(methodNames, 'methodTarget');
        assert.include(methodNames, 'staticFunc');
        assert.include(methodNames, 'funcTarget');
    });
});