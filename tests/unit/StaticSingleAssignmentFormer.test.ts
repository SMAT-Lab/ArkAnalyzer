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

import { describe, expect, it } from 'vitest';
import { DEFAULT_ARK_METHOD_NAME, Scene, SceneConfig } from '../../src';
import path from 'path';
import { StaticSingleAssignmentFormer } from '../../src/transformer/StaticSingleAssignmentFormer';
import Logger, { LOG_LEVEL, LOG_MODULE_TYPE } from '../../src/utils/logger';

const logPath = 'out/ArkAnalyzer.log';
const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'StaticSingleAssignmentFormer');
Logger.configure(logPath, LOG_LEVEL.DEBUG, LOG_LEVEL.DEBUG);

const SSA_EXPECT = `this#0 = this: @ssa/main.ts: %dflt
v#1 = 3
a#2 = undefined
if v#1 > 0
a#3 = 10
a#4 = phi(a#3, a#5)
return a#4
a#5 = -10`
;

describe('StaticSingleAssignmentFormer Test', () => {
    let config: SceneConfig = new SceneConfig();

    config.buildFromProjectDir(path.join(__dirname, '../resources/ssa'));
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);

    it('debug case', () => {
        let staticSingleAssignmentFormer = new StaticSingleAssignmentFormer();
        for (const arkFile of projectScene.getFiles()) {
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == DEFAULT_ARK_METHOD_NAME) {
                        continue;
                    }

                    const body = arkMethod.getBody();
                    if (body) {
                        for (const threeAddressStmt of body.getCfg().getStmts()) {
                            logger.info(threeAddressStmt.toString());
                        }
                        staticSingleAssignmentFormer.transformBody(body);

                        let ssa: string[] = [];
                        for (const threeAddressStmt of body.getCfg().getStmts()) {
                            ssa.push(threeAddressStmt.toString());
                        }
                        expect(ssa.join('\n')).eq(SSA_EXPECT);
                        body.getLocals().forEach(local => {
                            logger.info('ssa form:' + local.toString() + ', original form: ' + local.getOriginalValue()?.toString());
                        });
                    }
                }
            }
        }
    });
});