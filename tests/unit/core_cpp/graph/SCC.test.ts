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

import {
    SCCDetection,
    SceneConfig,
    Scene,
    CallGraph,
    CallGraphBuilder
} from '../../../../src/index';
import { describe, expect, it } from 'vitest';

describe('SCCTest', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir('./tests/resources/scc');
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();

    let cg = new CallGraph(projectScene);
    let cgBuilder = new CallGraphBuilder(cg, projectScene);
    cgBuilder.buildDirectCallGraphForScene();

    let scc = new SCCDetection<CallGraph>(cg);
    scc.find();
    let topo = scc.getTopoAndCollapsedNodeStack();
    console.log(topo);
    it('case1: patching interface', () => {
        expect(topo.length).eq(4);
        expect(
            topo.reverse().toString()
        ).eq('5,2,1,0');//b,e,g,%dflt
        expect(
            Array.from(scc.getMySCCNodes(2)).toString()
        ).eq('2,3,4,7');//e,d,c,f
    });
});
