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

import fs from 'fs';
import { SceneConfig } from '../../../../src';
import { DEFAULT_ARK_CLASS_NAME } from '../../../../src';
import { CallGraph } from '../../../../src';
import { CallGraphBuilder } from '../../../../src';
import { Scene } from '../../../../src';
import { MethodSignature } from '../../../../src';

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir('../../../cppResources/call_graph/');

function runScene(config: SceneConfig, fileName: string): void {
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();

    let entryPoints: MethodSignature[] = [];
    entryPoints.push(
        ...projectScene
            .getFiles()
            .filter(arkFile => arkFile.getName() === fileName)
            .flatMap(arkFile => arkFile.getClasses())
            .filter(arkClass => arkClass.getName() === DEFAULT_ARK_CLASS_NAME)
            .flatMap(arkClass => arkClass.getMethods())
            .filter(arkMethod => arkMethod.getName() === 'main')
            .map(arkMethod => arkMethod.getSignature())
    );

    let callGraph = new CallGraph(projectScene);
    let callGraphBuilder = new CallGraphBuilder(callGraph, projectScene);
    callGraphBuilder.buildClassHierarchyCallGraph(entryPoints, false);
    callGraph.dump('../cg_out/Tests.dot');
    const content1 = fs.readFileSync('../cg_out/Tests.dot', 'utf-8').replace(/\s+/g, '');
    const content2 = fs.readFileSync('cg/Tests.dot', 'utf-8').replace(/\s+/g, '');
    console.log('Are the files equal?', content1 === content2);
}

runScene(config, 'Tests.cpp');
