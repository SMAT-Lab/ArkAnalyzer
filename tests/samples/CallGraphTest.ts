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

import { SceneConfig, Scene, DEFAULT_ARK_CLASS_NAME, CallGraph, CallGraphBuilder, MethodSignature, RapidTypeAnalysis, DummyMainCreater } from '../../src';
const mode: 'rta' | 'cha' = 'rta';

let config: SceneConfig = new SceneConfig();
function runDir(): void {
    config.buildFromProjectDir('tests/resources/callgraph/cha_rta_test');
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();

    let entryPoints: MethodSignature[] = [];

    entryPoints.push(
        ...projectScene
            .getFiles()
            .filter(arkFile => arkFile.getName() === 'main.ts')
            .flatMap(arkFile => arkFile.getClasses())
            .filter(arkClass => arkClass.getName() === DEFAULT_ARK_CLASS_NAME)
            .flatMap(arkClass => arkClass.getMethods())
            .filter(arkMethod => arkMethod.getName() === 'main')
            .map(arkMethod => arkMethod.getSignature())
    );

    let callGraph = new CallGraph(projectScene);
    let callGraphBuilder = new CallGraphBuilder(callGraph, projectScene);
    if (mode === 'cha') {
        callGraphBuilder.buildClassHierarchyCallGraph(entryPoints, false);
    } else {
        callGraphBuilder.buildRapidTypeCallGraph(entryPoints, false);
    }
    callGraph.dump('out/cg.dot');
}

function run4Project(): void {
    config.buildFromJson('./tests/resources/callgraph/callGraphConfigUnix.json');
    let projectScene: Scene = new Scene();
    projectScene.buildBasicInfo(config);
    projectScene.buildScene4HarmonyProject();
    projectScene.inferTypes();

    let cg = new CallGraph(projectScene, true);
    const callGraphBuilder = new CallGraphBuilder(cg, projectScene);
    if (mode === 'rta') {
        callGraphBuilder.buildCGNodes(projectScene.getMethods());

        const dummyMainCreater = new DummyMainCreater(projectScene);
        dummyMainCreater.createDummyMain();
        const entryMethod = dummyMainCreater.getDummyMain();

        const dummyMainMethodNode = cg.getCallGraphNodeByMethod(entryMethod.getSignature());
        cg.setEntries([dummyMainMethodNode.getID()]);

        const rta = new RapidTypeAnalysis(projectScene, cg, callGraphBuilder, true);
        rta.start(true);
    } else {
        callGraphBuilder.buildCHA4WholeProject(true);
    }

    console.log(cg.getStat());
    console.log('entry count: ', cg.getEntries().length);
}

if (true) {
    run4Project();
} else {
    runDir();
}
