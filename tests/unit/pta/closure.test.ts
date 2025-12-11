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
import { SceneConfig, Scene, CallGraph, CallGraphBuilder, Pag, PointerAnalysis, PointerAnalysisConfig } from '../../../src';
import { Sdk } from '../../../src/Config';

let sdk: Sdk = {
    name: 'ohos',
    path: './builtIn/typescript',
    moduleName: ''
};

function test(): PointerAnalysis {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir('./tests/resources/pta/closure');
    config.getSdksObj().push(sdk);

    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    let cg = new CallGraph(scene);
    let cgBuilder = new CallGraphBuilder(cg, scene);
    cgBuilder.buildDirectCallGraphForScene();

    let pag = new Pag();
    let debugfunc = cg.getEntries().filter(funcID => cg.getArkMethodByFuncID(funcID)?.getName() === 'main');

    let ptaConfig = PointerAnalysisConfig.create(2, './out', true, true, false);
    let pta = new PointerAnalysis(pag, cg, scene, ptaConfig);
    pta.setEntries(debugfunc);
    pta.start();
    return pta;
}

let pta = test();
const mainMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() === 'main')[0];

describe('Basic Test', () => {
    it('basic method 1', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'basicOuterMethod1');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%basicNestedMethod1$basicOuterMethod1');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('output')!;
        let argSrcValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('%0')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('output')!;
        let argDstValue_2 = mainMethod.getBody()?.getLocals().get('result1')!;

        let relatedNodes = pta.getRelatedNodes(argDstValue_1);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argDstValue_2);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_2)
        );
    });

    it('basic method 2', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'basicOuterMethod2');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%AM0$basicOuterMethod2');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('index')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('index')!;

        let relatedNodes = pta.getRelatedNodes(argDstValue_1);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_1)
        );
    });

    it('basic method 3', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'basicOuterMethod3');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%AM1$basicOuterMethod3');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('output')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('output')!;

        let relatedNodes = pta.getRelatedNodes(argDstValue_1);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_1)
        );
    });

    it('basic method 4', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'callMethod4');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'basicOuterMethod4');
        let calleeMethod1 = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%basicNestedMethod4$basicOuterMethod4');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('%0')!;
        let argSrcValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('base')!;

        let argDstValue_1 = calleeMethod1[0]?.getBody()?.getLocals().get('input')!;
        let argDstValue_2 = calleeMethod1[0]?.getBody()?.getLocals().get('base')!;

        let relatedNodes = pta.getRelatedNodes(argDstValue_1);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argDstValue_2);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_2)
        );
    });
});

describe('Function Test', () => {
    it('function 1', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'outerFunction1');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%innerFunction1$outerFunction1');
        let calleeMethod2 = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%AM1$outerFunction1');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('outerInput')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('%2')!;

        let argDstValue_1 = calleeMethod2[0]?.getBody()?.getLocals().get('outerInput')!;
        let argDstValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('innerInput')!;

        let relatedNodes = pta.getRelatedNodes(argDstValue_1);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argDstValue_2);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_2)
        );
    });

    it('function 2', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'outerFunction2');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%innerFunction2$outerFunction2');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('%0')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('%1')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('outerInput')!;
        let argDstValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('%12')!;

        let relatedNodes = pta.getRelatedNodes(argDstValue_1);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argDstValue_2);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_2)
        );
    });

    it('function 3', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'outerFunction3');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%innerFunction3$outerFunction3');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('count')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('size')!;
        let argSrcValue_3 = callerMethod[0]?.getBody()?.getLocals().get('%2')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('count')!;
        let argDstValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('size')!;
        let argDstValue_3 = calleeMethod[0]?.getBody()?.getLocals().get('%6')!;

        let relatedNodes = pta.getRelatedNodes(argDstValue_1);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argDstValue_2);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_2)
        );

        relatedNodes = pta.getRelatedNodes(argDstValue_3);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_3)
        );
    });

    it('function 4', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'outerFunction4');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%innerFunction4$outerFunction4');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('flag')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('outerInput')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('flag')!;
        let argDstValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('outerInput')!;

        let relatedNodes = pta.getRelatedNodes(argDstValue_1);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argDstValue_2);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_2)
        );
    });
});

describe('MultipleNested Test', () => {
    it('method 1', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'outerMethod1');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%nested1Method1$outerMethod1');
        let calleeMethod3 = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%nested3Method1$%nested2Method1$%nested1Method1$outerMethod1');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('a')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('%2')!;
        let argSrcValue_3 = calleeMethod[0]?.getBody()?.getLocals().get('%1')!;
        let argSrcValue_4 = callerMethod[0]?.getBody()?.getLocals().get('%3')!;

        let argDstValue_1 = calleeMethod3[0]?.getBody()?.getLocals().get('a')!;
        let argDstValue_2 = calleeMethod3[0]?.getBody()?.getLocals().get('b')!;
        let argDstValue_3 = calleeMethod3[0]?.getBody()?.getLocals().get('c')!;
        let argDstValue_4 = calleeMethod3[0]?.getBody()?.getLocals().get('%0')!;

        let relatedNodes = pta.getRelatedNodes(argDstValue_1);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argDstValue_2);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_2)
        );

        relatedNodes = pta.getRelatedNodes(argDstValue_3);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_3)
        );

        relatedNodes = pta.getRelatedNodes(argDstValue_4);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_4)
        );
    });

    it('method 2', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'outerMethod2');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%AM3$%AM2$outerMethod2');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('a')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('a')!;

        let relatedNodes = pta.getRelatedNodes(argDstValue_1);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_1)
        );
    });

    it('method 3', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'outerMethod3');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%AM4$outerMethod3');
        let calleeMethod2 = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%AM5$%AM4$outerMethod3');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('a')!;
        let argSrcValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('b')!;

        let argDstValue_1 = calleeMethod2[0]?.getBody()?.getLocals().get('a')!;
        let argDstValue_2 = calleeMethod2[0]?.getBody()?.getLocals().get('b')!;

        let relatedNodes = pta.getRelatedNodes(argDstValue_1);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argDstValue_2);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_2)
        );
    });

    it('method 4', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'callMethod4');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'outerMethod4');
        let calleeMethod3 = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%nestedInNestedMethod4$%nestedMethod4$outerMethod4');

        let argSrcValue_1 = callerMethod[1]?.getBody()?.getLocals().get('%0')!;
        let argSrcValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('b')!;

        let argDstValue_1 = calleeMethod3[0]?.getBody()?.getLocals().get('a')!;
        let argDstValue_2 = calleeMethod3[0]?.getBody()?.getLocals().get('b')!;

        let relatedNodes = pta.getRelatedNodes(argDstValue_1);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argDstValue_2);
        assert(
            Array.from(relatedNodes).includes(argSrcValue_2)
        );
    });
});