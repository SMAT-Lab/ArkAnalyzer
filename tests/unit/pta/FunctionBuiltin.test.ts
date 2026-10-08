
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

import { assert, beforeAll, describe, it } from 'vitest';
import { SceneConfig, Scene, CallGraph, CallGraphBuilder, Pag, PointerAnalysis, PointerAnalysisConfig } from '../../../src';
import { Sdk } from '../../../src/Config';
import { SignatureCanonicalizerRegistry } from '../../../src/core/common/SignatureCanonicalizerRegistry';

let sdk: Sdk = {
    name: 'ohos',
    path: './builtIn/typescript',
    moduleName: ''
};

function test(): PointerAnalysis {
    SignatureCanonicalizerRegistry.dispose();
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir('./tests/resources/pta/FunctionType');
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

describe('Function.call Test', () => {
    let pta: PointerAnalysis;

    beforeAll(() => {
       pta = test();
    });

    it('case1: anonymousMethod', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'ptrInvoke1Call');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%AM1$ptrInvoke1Call');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('heapObj1')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('heapObj2')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('arg1')!;
        let argDstValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('arg2')!;

        let relatedNodes = pta.getRelatedNodes(argSrcValue_1);
        // console.log(argDstValue_1)
        // console.log(Array.from(relatedNodes).includes(argDstValue_1))
        assert(
            Array.from(relatedNodes).includes(argDstValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_2);
        assert(
            Array.from(relatedNodes).includes(argDstValue_2)
        );
    });

    it('case2: class instance method', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
        'ptrInvoke2Call');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
        'test');

        let thisSrcValue = callerMethod[0]?.getBody()?.getLocals().get('test_instance_1')!;
        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('heapObj1')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('heapObj2')!;

        let thisDstValue = calleeMethod[1]?.getBody()?.getLocals().get('this')!;
        let argDstValue_1 = calleeMethod[1]?.getBody()?.getLocals().get('arg1')!;
        let argDstValue_2 = calleeMethod[1]?.getBody()?.getLocals().get('arg2')!;

        let relatedNodes = pta.getRelatedNodes(thisSrcValue);
        assert(
            Array.from(relatedNodes).includes(thisDstValue)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_1);
        assert(
            Array.from(relatedNodes).includes(argDstValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_2);
        assert(
            Array.from(relatedNodes).includes(argDstValue_2)
        );
    });

    it('case3: class static method', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'ptrInvoke3Call');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'testStatic');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('heapObj1')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('heapObj2')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('arg1')!;
        let argDstValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('arg2')!;

        let relatedNodes = pta.getRelatedNodes(argSrcValue_1);
        assert(
            Array.from(relatedNodes).includes(argDstValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_2);
        assert(
            Array.from(relatedNodes).includes(argDstValue_2)
        );
    });

    it('case4: function', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'ptrInvoke4Call');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'test');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('heapObj1')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('heapObj2')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('arg1')!;
        let argDstValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('arg2')!;

        let relatedNodes = pta.getRelatedNodes(argSrcValue_1);
        assert(
            Array.from(relatedNodes).includes(argDstValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_2);
        assert(
            Array.from(relatedNodes).includes(argDstValue_2)
        );
    });

    it('case5: function with binding environment', () => {
        // 
    });
});

describe('Function.apply Test', () => {
    let pta: PointerAnalysis;

    beforeAll(() => {
        pta = test();
    });

    it('case1: anonymousMethod', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'ptrInvoke1Apply');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%AM2$ptrInvoke1Apply');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('heapObj1')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('heapObj2')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('arg1')!;
        let argDstValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('arg2')!;

        let relatedNodes = pta.getRelatedNodes(argSrcValue_1);
        assert(
            Array.from(relatedNodes).includes(argDstValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_2);
        assert(
            Array.from(relatedNodes).includes(argDstValue_2)
        );
    });

    it('case2: class instance method', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'ptrInvoke2Apply');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'test');

        let thisSrcValue = callerMethod[0]?.getBody()?.getLocals().get('test_instance_2')!;
        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('heapObj1')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('heapObj2')!;

        let thisDstValue = calleeMethod[1]?.getBody()?.getLocals().get('this')!;
        let argDstValue_1 = calleeMethod[1]?.getBody()?.getLocals().get('arg1')!;
        let argDstValue_2 = calleeMethod[1]?.getBody()?.getLocals().get('arg2')!;

        let relatedNodes = pta.getRelatedNodes(thisSrcValue);
        assert(
            Array.from(relatedNodes).includes(thisDstValue)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_1);
        assert(
            Array.from(relatedNodes).includes(argDstValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_2);
        assert(
            Array.from(relatedNodes).includes(argDstValue_2)
        );
    });

    it('case3: class static method', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'ptrInvoke3Apply');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'testStatic');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('heapObj1')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('heapObj2')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('arg1')!;
        let argDstValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('arg2')!;

        let relatedNodes = pta.getRelatedNodes(argSrcValue_1);
        assert(
            Array.from(relatedNodes).includes(argDstValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_2);
        assert(
            Array.from(relatedNodes).includes(argDstValue_2)
        );
    });

    it('case4: function', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'ptrInvoke4Apply');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'test');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('heapObj1')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('heapObj2')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('arg1')!;
        let argDstValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('arg2')!;

        let relatedNodes = pta.getRelatedNodes(argSrcValue_1);
        assert(
            Array.from(relatedNodes).includes(argDstValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_2);
        assert(
            Array.from(relatedNodes).includes(argDstValue_2)
        );
    });

    it('case5: function with binding environment', () => {
        // 
    });
});

// TODO: add return value check
describe('Function.bind Test', () => {
    let pta: PointerAnalysis;

    beforeAll(() => {
        pta = test();
    });

    it('case1: anonymousMethod', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'ptrInvoke1Bind');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            '%AM3$ptrInvoke1Bind');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('heapObj1')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('heapObj2')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('arg1')!;
        let argDstValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('arg2')!;

        // console.log(pta.getRelatedNodes(argDstValue_1))

        let relatedNodes = pta.getRelatedNodes(argSrcValue_1);
        assert(
            Array.from(relatedNodes).includes(argDstValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_2);
        assert(
            Array.from(relatedNodes).includes(argDstValue_2)
        );
    });

    it('case2: class instance method', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'ptrInvoke2Bind');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'test');

        let thisSrcValue = callerMethod[0]?.getBody()?.getLocals().get('test_instance')!;
        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('heapObj1')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('heapObj2')!;

        let thisDstValue = calleeMethod[1]?.getBody()?.getLocals().get('this')!;
        let argDstValue_1 = calleeMethod[1]?.getBody()?.getLocals().get('arg1')!;
        let argDstValue_2 = calleeMethod[1]?.getBody()?.getLocals().get('arg2')!;

        let relatedNodes = pta.getRelatedNodes(thisSrcValue);
        assert(
            Array.from(relatedNodes).includes(thisDstValue)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_1);
        assert(
            Array.from(relatedNodes).includes(argDstValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_2);
        assert(
            Array.from(relatedNodes).includes(argDstValue_2)
        );
    });

    it('case3: class instance method called in external method', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'ptrInvoke2BindReturn');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'test');

        let thisSrcValue = callerMethod[0]?.getBody()?.getLocals().get('test_instance')!;
        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('heapObj1')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('heapObj2')!;

        let thisDstValue = calleeMethod[1]?.getBody()?.getLocals().get('this')!;
        let argDstValue_1 = calleeMethod[1]?.getBody()?.getLocals().get('arg1')!;
        let argDstValue_2 = calleeMethod[1]?.getBody()?.getLocals().get('arg2')!;

        let relatedNodes = pta.getRelatedNodes(thisSrcValue);
        assert(
            Array.from(relatedNodes).includes(thisDstValue)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_1);
        assert(
            Array.from(relatedNodes).includes(argDstValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_2);
        assert(
            Array.from(relatedNodes).includes(argDstValue_2)
        );
    });

    it('case4: class static method', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'ptrInvoke3Bind');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'testStatic');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('heapObj1')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('heapObj2')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('arg1')!;
        let argDstValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('arg2')!;

        let relatedNodes = pta.getRelatedNodes(argSrcValue_1);
        assert(
            Array.from(relatedNodes).includes(argDstValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_2);
        assert(
            Array.from(relatedNodes).includes(argDstValue_2)
        );
    });

    it('case5: function', () => {
        let callerMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'ptrInvoke4Bind');
        let calleeMethod = pta.getScene().getMethods().filter(arkMethod => arkMethod.getName() ===
            'test');

        let argSrcValue_1 = callerMethod[0]?.getBody()?.getLocals().get('heapObj1')!;
        let argSrcValue_2 = callerMethod[0]?.getBody()?.getLocals().get('heapObj2')!;

        let argDstValue_1 = calleeMethod[0]?.getBody()?.getLocals().get('arg1')!;
        let argDstValue_2 = calleeMethod[0]?.getBody()?.getLocals().get('arg2')!;

        let relatedNodes = pta.getRelatedNodes(argSrcValue_1);
        assert(
            Array.from(relatedNodes).includes(argDstValue_1)
        );

        relatedNodes = pta.getRelatedNodes(argSrcValue_2);
        assert(
            Array.from(relatedNodes).includes(argDstValue_2)
        );
    });

    it('case6: function with binding environment', () => {
        // 
    });
});