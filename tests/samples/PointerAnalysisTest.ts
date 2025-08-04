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

import { SceneConfig, Sdk } from '../../src/Config';
import { Scene } from '../../src/Scene';
import { CallGraph } from '../../src/callgraph/model/CallGraph';
import { CallGraphBuilder } from '../../src/callgraph/model/builder/CallGraphBuilder';
import { Pag } from '../../src/callgraph/pointerAnalysis/Pag'
import { PointerAnalysis } from '../../src/callgraph/pointerAnalysis/PointerAnalysis'
import { PtaAnalysisScale, PointerAnalysisConfig, ContextType } from '../../src/callgraph/pointerAnalysis/PointerAnalysisConfig';
import { PtsCollectionType } from '../../src/callgraph/pointerAnalysis/PtsDS';
import { Local } from '../../src/core/base/Local';
import { ArkThisRef } from '../../src/core/base/Ref';
import { ArkAssignStmt } from '../../src/core/base/Stmt';
import { ArkMethod } from '../../src/core/model/ArkMethod';
import Logger, { LOG_LEVEL } from '../../src/utils/logger';

Logger.configure('./out/ArkAnalyzer.log', LOG_LEVEL.TRACE)
let config: SceneConfig = new SceneConfig()
let sdk: Sdk = {
    name: 'ohos',
    path: '',
    moduleName: ''
};
sdk;

function printStat(pta: PointerAnalysis): void {
    console.log(pta.getStat());
}

function dumpIR(scene: Scene) {
    scene.getMethods().forEach(fun => {
        console.log('\n---\n' + fun.getSignature().toString())
        if (!fun.getCfg())
            return;

        console.log('{');
        let i = 0;
        fun.getCfg()?.getBlocks().forEach(bb => {

            console.log(`  bb${i++}:`)
            bb.getStmts().forEach(stmt => {
                console.log('    ' + stmt.toString());
            })
        })
        console.log('}')
    });
}

function printTypeDiff(pta: PointerAnalysis) {
    let dm = pta.getTypeDiffMap();
    for (let [v, types] of dm) {
        console.log('=======')
        if (v instanceof Local) {
            if (v.getName() == 'this') {
                continue;
            }

            let s = v.getDeclaringStmt()
            if (s instanceof ArkAssignStmt && s.getLeftOp() instanceof Local && (s.getLeftOp() as Local).getName() === 'this'
                && s.getRightOp() instanceof ArkThisRef) {
                continue;
            }

            if (s) {
                console.log('Method: ' + s?.getCfg()?.getDeclaringMethod().getSignature().toString());
                console.log('Declare: ' + s);
            }
        }

        console.log(v)
        console.log('----\n' + v.getType().toString());
        for (let t of types) {
            console.log('  ' + t.toString());
        }

    }
}

function runProject(output: string) {
    config.buildFromJson('./tests/resources/pta/PointerAnalysisTestConfig.json');
    let projectScene: Scene = new Scene();
    projectScene.buildBasicInfo(config);
    projectScene.buildScene4HarmonyProject()
    projectScene.inferTypes();

    let ptaConfig = PointerAnalysisConfig.create(2, output, true, true, true)
    let pta = PointerAnalysis.pointerAnalysisForWholeProject(projectScene, ptaConfig);
    printStat(pta);
}


function runDir(output: string) {
    config.buildFromProjectDir('./tests/unit/save');
    config.getSdksObj().push(sdk);

    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();

    let cg = new CallGraph(projectScene);
    let cgBuilder = new CallGraphBuilder(cg, projectScene);
    cgBuilder.buildDirectCallGraphForScene();

    let pag = new Pag();
    let debugfunc = cg.getEntries().filter(funcID => cg.getArkMethodByFuncID(funcID)?.getName() === 'main');

    let ptaConfig = PointerAnalysisConfig.create(2, output, true, true, true, PtaAnalysisScale.WholeProgram, PtsCollectionType.BitVector, ContextType.CallSite)
    let pta = new PointerAnalysis(pag, cg, projectScene, ptaConfig)
    pta.setEntries(debugfunc);
    pta.start();

    cg.dump(output + '/subcg.dot', debugfunc[0])
    cgBuilder.setEntries()

    dumpIR(projectScene)
    printTypeDiff(pta);

    printStat(pta);
}

function runMethod(output: string): void {
    config.buildFromProjectDir('./tests/resources/pta/CallField');
    config.getSdksObj().push(sdk);

    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();

    let cg = new CallGraph(projectScene);
    let cgBuilder = new CallGraphBuilder(cg, projectScene);
    cgBuilder.buildDirectCallGraphForScene();

    let debugfunc = cg.getEntries().filter(funcID => cg.getArkMethodByFuncID(funcID)?.getName() === 'setget');

    let ptaConfig = PointerAnalysisConfig.create(2, output, true, true, true, PtaAnalysisScale.MethodLevel, PtsCollectionType.BitVector);
    PointerAnalysis.pointerAnalysisForMethod(projectScene, cg.getArkMethodByFuncID(debugfunc[0]) as ArkMethod, ptaConfig);
}

let type = 1;

switch (type) {
    case 1:
        runDir('./out/dir');
        break;

    case 2:
        runMethod('./out/method');
        break;

    case 3:
        runProject('./out/project');
        break;
}
