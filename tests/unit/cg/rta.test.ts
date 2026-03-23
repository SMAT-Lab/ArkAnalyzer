/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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
import { SceneConfig, Scene, CallGraph, CallGraphBuilder, CallGraphNode } from '../../../src';

describe('RTA test', () => {
    const config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir('./tests/resources/callgraph/cha_rta_test');

    const scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    const cg = new CallGraph(scene);
    const cgBuilder = new CallGraphBuilder(cg, scene);

    const mainMethod = scene.getMethods().find(m => m.getName() === 'main')!;
    cgBuilder.buildRapidTypeCallGraph([mainMethod.getSignature()], true);

    it('case1: inheritance test (RTA) - should include instantiated subclasses', () => {
        const makeSoundMethod = scene.getMethods().find(m => m.getName() === 'makeSound')!;
        const cgNode = cg.getCallGraphNodeByMethod(makeSoundMethod.getSignature());

        const calleeNodes = cgNode.getOutgoingEdges() ?? new Set();
        const actualCalleeSignatures = Array.from(calleeNodes).map(node =>
            (node.getDstNode() as CallGraphNode).getMethod()
        );

        const dogSound = scene.getClasses().find(c => c.getName() === 'Dog')!
            .getMethods().find(m => m.getName() === 'sound')!.getSignature();
        const catSound = scene.getClasses().find(c => c.getName() === 'Cat')!
            .getMethods().find(m => m.getName() === 'sound')!.getSignature();

        assert(
            actualCalleeSignatures.includes(dogSound),
            `Expected callee ${dogSound} not found in actual callees: ${actualCalleeSignatures.join(', ')}`
        );
        assert(
            actualCalleeSignatures.includes(catSound),
            `Expected callee ${catSound} not found in actual callees: ${actualCalleeSignatures.join(', ')}`
        );
    });

    it('case2: super test (RTA) - should include instantiated implementations', () => {
        const dogSoundMethod = scene.getClasses().find(c => c.getName() === 'Dog')!
            .getMethods().find(m => m.getName() === 'sound')!;
        const cgNode = cg.getCallGraphNodeByMethod(dogSoundMethod.getSignature());

        const calleeNodes = cgNode.getOutgoingEdges() ?? new Set();
        const actualCalleeSignatures = Array.from(calleeNodes).map(node =>
            (node.getDstNode() as CallGraphNode).getMethod()
        );

        const dogSound = scene.getClasses().find(c => c.getName() === 'Dog')!
            .getMethods().find(m => m.getName() === 'sound')!.getSignature();
        const catSound = scene.getClasses().find(c => c.getName() === 'Cat')!
            .getMethods().find(m => m.getName() === 'sound')!.getSignature();

        assert(
            actualCalleeSignatures.includes(dogSound),
            `Expected callee ${dogSound} not found in actual callees: ${actualCalleeSignatures.join(', ')}`
        );
        assert(
            actualCalleeSignatures.includes(catSound),
            `Expected callee ${catSound} not found in actual callees: ${actualCalleeSignatures.join(', ')}`
        );
    });
});

