/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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
import { FileSignature } from '../../src/core/model/ArkSignature';

describe("build scene Test", () => {
    it('build case', () => {
        const config: SceneConfig = new SceneConfig();
        const singleFile = path.join(__dirname, "../resources/inferType/Target.ets");
        config.buildConfig('must','',[],[singleFile]);
        const projectScene: Scene = new Scene();
        projectScene.buildSceneFromProjectDir(config);
        projectScene.inferTypes();

        const fileId = new FileSignature(projectScene.getProjectName(), "Target.ets", );
        const file = projectScene.getFile(fileId);
        assert.isDefined(file);
    });
});
