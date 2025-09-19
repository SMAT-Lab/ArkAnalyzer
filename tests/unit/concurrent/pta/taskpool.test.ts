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

import { describe, it, assert } from 'vitest';
import { CallGraph, CallGraphBuilder, Local, Pag, PagNode, PointerAnalysis, PointerAnalysisConfig, Scene, SceneConfig } from '../../../../src';
import path from 'path';
import { ContextType, PtaAnalysisScale } from '../../../../src/callgraph/pointerAnalysis/PointerAnalysisConfig';
import { PtsCollectionType } from '../../../../src/callgraph/pointerAnalysis/PtsDS';


function buildScene(): Scene {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../../../resources/Sdk') });
    config.buildFromProjectDir(path.join(__dirname, '../../../resources/concurrent/pta/taskpool'));
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();
    return projectScene;
}

let projectScene = buildScene();

describe('TaskPoolTest', () => {
    let cg = new CallGraph(projectScene);
    let cgBuilder = new CallGraphBuilder(cg, projectScene);
    cgBuilder.buildDirectCallGraphForScene();

    let pag = new Pag();
    let debugfunc = cg.getEntries().filter(funcID => cg.getArkMethodByFuncID(funcID)?.getName() === 'main');

    
    let ptaConfig = PointerAnalysisConfig.create(2, './out', false, false, false, PtaAnalysisScale.WholeProgram, PtsCollectionType.Set, ContextType.CallSite);
    let pta = new PointerAnalysis(pag, cg, projectScene, ptaConfig);
    pta.setEntries(debugfunc);
    pta.start();

    it('case1: taskpool.execute(func, v)', () => {
        let target;
        for (let node of pag.getNodesIter()) {
            let pagNode = node as PagNode;
            let pagValue = pagNode?.getValue();
            if (pagValue && pagValue instanceof Local && pagValue.getName() === 'vTmp') {
                target = pagNode;
            }
        }
        assert(target !== undefined);
        let pointTo = target.getPointTo();
        assert(pointTo !== undefined && pointTo.count() === 1);
    });

    it('case2: constructor(func, v)', () => {
        let target;
        for (let node of pag.getNodesIter()) {
            let pagNode = node as PagNode;
            let pagValue = pagNode?.getValue();
            if (pagValue && pagValue instanceof Local && pagValue.getName() === 'vTmp2') {
                target = pagNode;
            }
        }
        assert(target !== undefined);
        let pointTo = target.getPointTo();
        assert(pointTo !== undefined && pointTo.count() === 1);
    });

    it('case3: addTask(func, v)', () => {
        let target;
        for (let node of pag.getNodesIter()) {
            let pagNode = node as PagNode;
            let pagValue = pagNode?.getValue();
            if (pagValue && pagValue instanceof Local && pagValue.getName() === 'vTmp3') {
                target = pagNode;
            }
        }
        assert(target !== undefined);
        let pointTo = target.getPointTo();
        assert(pointTo !== undefined && pointTo.count() === 1);
    });
});