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

import { describe, it } from 'vitest';
import { SceneConfig } from '../../../src/Config';
import { Scene } from '../../../src/Scene';
import { CallGraph } from '../../../src/callgraph/model/CallGraph';
import { CallGraphBuilder } from '../../../src/callgraph/model/builder/CallGraphBuilder';
import { Pag, PagEdge, PagEdgeKind, PagNode } from '../../../src/callgraph/pointerAnalysis/Pag';
import { PointerAnalysis } from '../../../src/callgraph/pointerAnalysis/PointerAnalysis';
import { ContextType, PointerAnalysisConfig, PtaAnalysisScale } from '../../../src/callgraph/pointerAnalysis/PointerAnalysisConfig';
import { PtsCollectionType } from '../../../src/callgraph/pointerAnalysis/PtsDS';
import { Local } from '../../../src/core/base/Local';
import { Sdk } from '../../../src/Config';
import { assert } from 'vitest';
import { ArkAssignStmt, ArkInstanceInvokeExpr } from '../../../src';

let sdk: Sdk = {
    name: 'ohos',
    path: './builtIn/typescript',
    moduleName: ''
};

describe('ExportNewTest', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir('./tests/resources/pta/ExportNew');
    config.getSdksObj().push(sdk);

    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    let cg = new CallGraph(scene);
    let cgBuilder = new CallGraphBuilder(cg, scene);
    cgBuilder.buildDirectCallGraphForScene();

    let pag = new Pag();
    let debugfunc = cg.getEntries().filter(funcID => cg.getArkMethodByFuncID(funcID)?.getName() === 'main');

    
    let ptaConfig = PointerAnalysisConfig.create(2, './out', true, true, true, PtaAnalysisScale.WholeProgram, PtsCollectionType.BitVector, ContextType.CallSite);
    let pta = new PointerAnalysis(pag, cg, scene, ptaConfig);
    pta.setEntries(debugfunc);
    pta.start();

    it('case1', () => {
        let target;
        let method = scene.getClasses().filter(arkClass => arkClass.getName() === '%dflt')
        .flatMap(arkClass => arkClass.getMethodWithName('test1')).filter(Boolean);
    
        let local = (method[0]?.getBody()?.getLocals().get('lo')?.getDeclaringStmt() as ArkAssignStmt).getRightOp() as Local;

        for (let node of pag.getNodesIter()) {
            let pagNode = node as PagNode;
            let pagValue = pagNode?.getValue();
            if (pagValue && pagValue === local) {
                target = pagNode;
            }
        }

        assert(target !== undefined);
        let incomings = Array.from(target.getIncomingEdge());
        let outgoings = Array.from(target.getOutgoingEdges());
        assert(incomings.length === 1 && outgoings.length === 1);
        let incoming = incomings[0] as PagEdge;
        assert(incoming.getKind() === PagEdgeKind.InterProceduralCopy);
        let outgoing = outgoings[0] as PagEdge;
        assert(outgoing.getKind() === PagEdgeKind.Copy);
    });

    it('case2', () => {
        let target;
        let method = scene.getClasses().filter(arkClass => arkClass.getName() === '%dflt')
        .flatMap(arkClass => arkClass.getMethodWithName('test1')).filter(Boolean);
    
        let local = (method[0]?.getBody()?.getLocals().get('lo2')?.getDeclaringStmt() as ArkAssignStmt).getRightOp() as Local;

        for (let node of pag.getNodesIter()) {
            let pagNode = node as PagNode;
            let pagValue = pagNode?.getValue();
            if (pagValue && pagValue === local) {
                target = pagNode;
            }
        }

        assert(target !== undefined);
        let incomings = Array.from(target.getIncomingEdge());
        let outgoings = Array.from(target.getOutgoingEdges());
        assert(incomings.length === 1 && outgoings.length === 1);
        let incoming = incomings[0] as PagEdge;
        assert(incoming.getKind() === PagEdgeKind.InterProceduralCopy);
        let outgoing = outgoings[0] as PagEdge;
        assert(outgoing.getKind() === PagEdgeKind.Copy);
    });
});

describe('ExportNew2Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir('./tests/resources/pta/ExportNew2');
    config.getSdksObj().push(sdk);

    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    let cg = new CallGraph(scene);
    let cgBuilder = new CallGraphBuilder(cg, scene);
    cgBuilder.buildDirectCallGraphForScene();

    let pag = new Pag();
    let debugfunc = cg.getEntries().filter(funcID => cg.getArkMethodByFuncID(funcID)?.getName() === 'main');

    
    let ptaConfig = PointerAnalysisConfig.create(2, './out', true, true, true, PtaAnalysisScale.WholeProgram, PtsCollectionType.BitVector, ContextType.CallSite);
    let pta = new PointerAnalysis(pag, cg, scene, ptaConfig);
    pta.setEntries(debugfunc);
    pta.start();

    it('case1', () => {
        let target;
        for (let node of pag.getNodesIter()) {
            let pagNode = node as PagNode;
            let pagValue = pagNode?.getValue();
            if (pagValue && pagValue instanceof Local && pagValue.getName() === 'et') {
                target = pagNode;
            }
        }
        assert(target !== undefined);
        let incomings = Array.from(target.getIncomingEdge());
        let outgoings = Array.from(target.getOutgoingEdges());
        assert(incomings.length === 1 && outgoings.length === 1);
        let incoming = incomings[0] as PagEdge;
        assert(incoming.getKind() === PagEdgeKind.InterProceduralCopy);
        let outgoing = outgoings[0] as PagEdge;
        assert(outgoing.getKind() === PagEdgeKind.This);
    });
});

describe('ExportNew3Test', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir('./tests/resources/pta/ExportNew3');
    config.getSdksObj().push(sdk);

    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    let cg = new CallGraph(scene);
    let cgBuilder = new CallGraphBuilder(cg, scene);
    cgBuilder.buildDirectCallGraphForScene();

    let pag = new Pag();
    let debugfunc = cg.getEntries().filter(funcID => cg.getArkMethodByFuncID(funcID)?.getName() === 'main');

    
    let ptaConfig = PointerAnalysisConfig.create(2, './out', true, true, true, PtaAnalysisScale.WholeProgram, PtsCollectionType.BitVector, ContextType.CallSite);
    let pta = new PointerAnalysis(pag, cg, scene, ptaConfig);
    pta.setEntries(debugfunc);
    pta.start();

    it('case1', () => {
        let srcMethod = scene.getClasses().filter(arkClass => arkClass.getName() === '%dflt')
            .flatMap(arkClass => arkClass.getMethodWithName('%dflt'))
            .filter(method => method !== null && method !== undefined);
        let dstMethod_1 = scene.getClasses().filter(arkClass => arkClass.getName() === '%dflt')
            .flatMap(arkClass => arkClass.getMethodWithName('main'))
            .filter(method => method !== null && method !== undefined);
        let dstMethod_2 = scene.getClasses().filter(arkClass => arkClass.getName() === 'Vector')
            .flatMap(arkClass => arkClass.getMethodWithName('editConfig'))
            .filter(method => method !== null && method !== undefined);

        let exportValue = srcMethod[0]?.getBody()?.getLocals().get('config')!;
        let importValue_1 = (dstMethod_1[0]?.getCfg()?.getStmts()[1].getInvokeExpr() as ArkInstanceInvokeExpr).getBase();
        let importValue_2 = (dstMethod_2[0]?.getCfg()?.getStmts()[1].getInvokeExpr() as ArkInstanceInvokeExpr).getBase();

        let relatedNodes = pta.getRelatedNodes(exportValue);
        assert(
            relatedNodes.has(importValue_1) && relatedNodes.has(importValue_2)
        );
    });
});