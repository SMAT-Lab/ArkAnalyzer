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

import { describe, it } from 'vitest';
import { SceneConfig, Scene, CallGraph, CallGraphBuilder, Pag, PointerAnalysis, PointerAnalysisConfig } from '../../../src';
import { Sdk } from '../../../src/Config';
import { assert } from 'vitest';

let sdk: Sdk = {
    name: 'ohos',
    path: './node_modules/typescript/lib',
    moduleName: ''
};

describe('ContainerAddTest', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir('./tests/resources/pta/Container');
    config.getSdksObj().push(sdk);
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    let cg = new CallGraph(scene);
    let cgBuilder = new CallGraphBuilder(cg, scene);
    cgBuilder.buildDirectCallGraphForScene();

    let pag = new Pag();
    let debugfunc = cg.getEntries().filter(funcID => cg.getArkMethodByFuncID(funcID)?.getName() === 'main');

    let ptaConfig = PointerAnalysisConfig.create(2, './out', true, true);
    let pta = new PointerAnalysis(pag, cg, scene, ptaConfig);
    pta.setEntries(debugfunc);
    pta.start();

    let arrayMethod = scene.getClasses().filter(arkClass => arkClass.getName() === 'ArrayTest')
        .flatMap(arkClass => arkClass.getMethodWithName('test'))!;
    let setMethod = scene.getClasses().filter(arkClass => arkClass.getName() === 'SetTest')
        .flatMap(arkClass => arkClass.getMethodWithName('test'))!;
    let mapMethod = scene.getClasses().filter(arkClass => arkClass.getName() === 'MapTest')
        .flatMap(arkClass => arkClass.getMethodWithName('test'))!;

    it('case1: Array.push(T[])', () => {
        const eleLocal = arrayMethod[0]?.getBody()?.getLocals().get('ele')!;
        const ele2Local = arrayMethod[0]?.getBody()?.getLocals().get('ele2')!;
        let resultLocal = arrayMethod[0]?.getBody()?.getLocals().get('b')!;
        let resultLocal2 = arrayMethod[0]?.getBody()?.getLocals().get('c')!;
        let relatedNodes = pta.getRelatedNodes(resultLocal);
        assert(
            Array.from(relatedNodes).some(element => element === eleLocal)
        );

        assert(
            Array.from(relatedNodes).some(element => element === ele2Local)
        );

        assert(
            Array.from(relatedNodes).some(element => element === resultLocal2)
        );
    });

    it('case2: Set.add(<T>)', () => {
        let setLocal = setMethod[0]?.getBody()?.getLocals().get('ele')!;
        let relatedNodes = pta.getRelatedNodes(setLocal);
        assert(
            Array.from(relatedNodes).some(element => element.toString() === 'set.<@container/lib.es2015.collection.d.ts: Set.field>')
        );
    });

    it('case3: Map.set(K, V))', () => {
        let mapLocal = mapMethod[0]?.getBody()?.getLocals().get('ele')!;
        let resultLocal = mapMethod[0]?.getBody()?.getLocals().get('v')!;
        let relatedNodes = pta.getRelatedNodes(mapLocal);
        assert(
            Array.from(relatedNodes).some(element => element.toString() === 'map.<@container/lib.es2015.collection.d.ts: Map.field>')
        );

        assert(
            Array.from(relatedNodes).some(element => element === resultLocal)
        );
    });
});

describe('ContainerForeachTest', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir('./tests/resources/pta/Foreach');
    config.getSdksObj().push(sdk);
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    let cg = new CallGraph(scene);
    let cgBuilder = new CallGraphBuilder(cg, scene);
    cgBuilder.buildDirectCallGraphForScene();

    let pag = new Pag();
    let debugfunc = cg.getEntries().filter(funcID => cg.getArkMethodByFuncID(funcID)?.getName() === 'main');

    let ptaConfig = PointerAnalysisConfig.create(2, './out', true, true);
    let pta = new PointerAnalysis(pag, cg, scene, ptaConfig);
    pta.setEntries(debugfunc);
    pta.start();

    const arrayMethod = scene.getMethods().filter(arkMethod => arkMethod.getName() === 'arrayForeach')!;
    const setMethod = scene.getMethods().filter(arkMethod => arkMethod.getName() === 'setForeach')!;
    const mapMethod = scene.getMethods().filter(arkMethod => arkMethod.getName() === 'mapForeach')!;

    it('case1: Array.forEach', () => {
        const foreachMethod = scene.getMethods().filter(arkMethod => arkMethod.getName() === '%AM0$arrayForeach')!;
        const eleLocal = arrayMethod[0]?.getBody()?.getLocals().get('ele')!;
        const ele2Local = arrayMethod[0]?.getBody()?.getLocals().get('ele2')!;
        let resultLocal = foreachMethod[0]?.getBody()?.getLocals().get('temp')!;
        let relatedNodes = pta.getRelatedNodes(resultLocal);
        assert(
            Array.from(relatedNodes).some(element => element === eleLocal)
        );

        assert(
            Array.from(relatedNodes).some(element => element === ele2Local)
        );
    });

    it('case1: Set.forEach', () => {
        const foreachMethod = scene.getMethods().filter(arkMethod => arkMethod.getName() === '%AM1$setForeach')!;
        const eleLocal = setMethod[0]?.getBody()?.getLocals().get('ele')!;
        let resultLocal = foreachMethod[0]?.getBody()?.getLocals().get('temp')!;
        let relatedNodes = pta.getRelatedNodes(eleLocal);
        assert(
            Array.from(relatedNodes).some(element => element === resultLocal)
        );
    });

    it('case2: Map.forEach', () => {
        const foreachMethod = scene.getMethods().filter(arkMethod => arkMethod.getName() === '%AM2$mapForeach')!;
        let mapLocal = mapMethod[0]?.getBody()?.getLocals().get('ele')!;
        let resultLocal = foreachMethod[0]?.getBody()?.getLocals().get('temp')!;
        let relatedNodes = pta.getRelatedNodes(mapLocal);
        assert(
            Array.from(relatedNodes).some(element => element === resultLocal)
        );
    });
});