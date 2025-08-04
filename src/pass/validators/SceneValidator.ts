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

import { ScenePassMgr } from '../ScenePassMgr';
import { Scene } from '../../Scene';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import {
    ArkValidatorRegistry,
    SceneSummary,
} from './Validator';
import { ArkClassValidator, ArkFileValidator, ArkMethodValidator } from './Models';
import './Exprs';
import './Stmts';
import './Values';


const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'SceneValidator');

/**
 * The SceneValidator class is responsible for validating a given scene by leveraging the ScenePassMgr.
 * It sets up a context for validation, executes the validation process, and retrieves the summary of the validation.
 *
 * The validate method initializes a new SceneSummary instance, associates it with the current scene context,
 * runs the validation process using the configured manager, and finally returns the generated summary.
 *
 * This class ensures that the validation logic is encapsulated and provides a clean interface for processing scenes.
 */
export class SceneValidator {
    private mgr: ScenePassMgr = new ScenePassMgr({
        passes: {
            file: [ArkFileValidator],
            klass: [ArkClassValidator],
            method: [ArkMethodValidator],
        },
        dispatcher: ArkValidatorRegistry,
    });

    validate(scene: Scene): SceneSummary {
        let summary = new SceneSummary();
        this.mgr.sceneContext().set(SceneSummary, summary);
        this.mgr.run(scene);
        logger.info('validate');
        return this.mgr.sceneContext().remove(SceneSummary)!;
    }
}