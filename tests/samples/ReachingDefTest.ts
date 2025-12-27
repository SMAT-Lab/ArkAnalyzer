/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License"); * you may not use this file except in compliance with the License.
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
import { SceneConfig, Scene } from '../../src';
import { ReachingDefProblem } from '../../src/core/dataflow/ReachingDef';
import { MFPDataFlowSolver } from '../../src/core/dataflow/GenericDataFlow';
import { Logger, LOG_LEVEL, LOG_MODULE_TYPE } from '../../src';

const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'ReachingDefTest');
Logger.configure('', LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);

let config: SceneConfig = new SceneConfig();

function runDir(): Scene {
    config.buildFromProjectDir('tests/resources/reachingDef/loop');
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();

    return projectScene;
}

let scene = runDir();
scene.getMethods().forEach((m) => {
    let methodName = m.getName();
    if (methodName === '%dflt') {
        return;
    }
    let problem = new ReachingDefProblem(m);
    let solver = new MFPDataFlowSolver();
    let s = solver.calculateMopSolutionForwards(problem);

    logger.info(methodName);
    logger.info(problem);
    logger.info(s);
    s.out.forEach((defs, nodeId) => {
        let str = Array.from(defs).join(', ');
        logger.info('//' + nodeId + ': ' + str);
    });
    debugger;
});
