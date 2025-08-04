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

import {SceneConfig} from "../../src/Config";
import {describe, it} from "vitest";
import {Scene} from "../../src/Scene";
import { CallGraph } from "../../src/callgraph/model/CallGraph";
import { CallGraphBuilder } from "../../src/callgraph/model/builder/CallGraphBuilder";
import { Pag } from "../../src/callgraph/pointerAnalysis/Pag";
import { PointerAnalysis } from "../../src/callgraph/pointerAnalysis/PointerAnalysis";
import { ContextType, PointerAnalysisConfig, PtaAnalysisScale } from "../../src/callgraph/pointerAnalysis/PointerAnalysisConfig";
import { PtsCollectionType } from "../../src/callgraph/pointerAnalysis/PtsDS";

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir('./tests/unit/save');
let scene = new Scene();
scene.buildSceneFromProjectDir(config);
describe("PointerAnalysisAlgorithm Test", () => {
    let cg = new CallGraph(scene);
    let cgBuilder = new CallGraphBuilder(cg, scene);
    cgBuilder.buildDirectCallGraphForScene();

    let pag = new Pag();
    let entry = cg.getEntries()
    let ptaConfig = PointerAnalysisConfig.create(2, './out', true, true, true, PtaAnalysisScale.WholeProgram, PtsCollectionType.BitVector, ContextType.CallSite)
    let pta = new PointerAnalysis(pag, cg, scene, ptaConfig)
    pta.setEntries(entry)
    it('normal case', () => {
        pta.start()
    })
})