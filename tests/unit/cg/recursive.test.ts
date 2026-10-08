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
import { SceneConfig, Scene, CallGraph, CallGraphBuilder } from '../../../src';
import { Sdk } from '../../../src/Config';

let sdk: Sdk = {
    name: 'ohos',
    path: './builtIn/typescript',
    moduleName: ''
};

describe('recursive Test', () => {
    it('case1', () => {
        let config: SceneConfig = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/callgraph/recursive');
        config.getSdksObj().push(sdk);

        let scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();

        let cg = new CallGraph(scene);
        let cgBuilder = new CallGraphBuilder(cg, scene);
        cgBuilder.buildDirectCallGraphForScene();

        let mainFunc = scene.getMethods().filter(method => method.getName() === 'main')
            .flatMap(method => {
                const signature = method.getSignature();
                return signature ? [signature] : [];
            });

        let reFunc = scene.getMethods().filter(method => method.getName() === 're')
            .flatMap(method => {
                const signature = method.getSignature();
                return signature ? [signature] : [];
            });

        let cgCha = new CallGraph(scene);
        let cgBuilderCha = new CallGraphBuilder(cgCha, scene);
        cgBuilderCha.buildClassHierarchyCallGraph(mainFunc, false);

        let main = cgCha.getCallGraphNodeByMethod(mainFunc[0]).getID();
        let recusive = cgCha.getCallGraphNodeByMethod(reFunc[0]).getID();

        let reInEdges = cgCha.getNode(recusive)?.getIncomingEdge() ?? new Set();
        let srcNodeIDs: number[] = [];

        for (let edge of reInEdges) {
            srcNodeIDs.push(edge.getSrcID());
        }

        assert(
            srcNodeIDs.includes(main)
        );

        assert(
            srcNodeIDs.includes(recusive)
        );
    });
});