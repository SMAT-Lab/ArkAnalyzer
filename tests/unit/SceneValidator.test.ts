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
import { SceneConfig } from '../../src';
import { Scene } from '../../src';
import ConsoleLogger, { LOG_MODULE_TYPE } from '../../src/utils/logger';
import { LOG_LEVEL } from '../../src';
import Logger from '../../src/utils/logger';
import {
    SceneValidator,
} from '../../src/pass/validators/SceneValidator';

ConsoleLogger.configure('', LOG_LEVEL.INFO, LOG_LEVEL.INFO, true);

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'Test');

describe('Anonymous Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, '../resources/validator'));
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    it('iter inst', () => {
        let mgr = new SceneValidator();
        let summary = mgr.validate(projectScene);
        logger.info('summary', projectScene.getProjectName());
        summary.dump2log();
        assert.equal(projectScene.getMethods().length, 7);
    });
});
