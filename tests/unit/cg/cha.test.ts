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
import { SceneConfig, Scene, CallGraph, CallGraphBuilder, CallGraphNode } from '../../../src';

describe('CHA test', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir('./tests/resources/callgraph/cha_rta_test');
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    let cg = new CallGraph(scene);
    let cgBuilder = new CallGraphBuilder(cg, scene);
    const mainMethod = scene.getMethods().find(m => m.getName() === 'main')!;
    cgBuilder.buildClassHierarchyCallGraph([mainMethod.getSignature()]);

    it('case1: inheritance test', () => {
        const makeSoundMethod = scene.getMethods().find(m => m.getName() === 'makeSound')!;
        const cgNode = cg.getCallGraphNodeByMethod(makeSoundMethod.getSignature());
        const calleeNodes = cgNode.getOutgoingEdges();

        // 定义预期的四个函数签名或名称
        const expectedCallees = [
            scene.getClasses().find(c => c.getName() === 'Animal')!.getMethods().find(m => m.getName() === 'sound')!.getSignature(),
            scene.getClasses().find(c => c.getName() === 'Dog')!.getMethods().find(m => m.getName() === 'sound')!.getSignature(),
            scene.getClasses().find(c => c.getName() === 'Cat')!.getMethods().find(m => m.getName() === 'sound')!.getSignature(),
            scene.getClasses().find(c => c.getName() === 'Pig')!.getMethods().find(m => m.getName() === 'sound')!.getSignature(),
        ];

        // 方法1: 如果你要比较函数签名
        const actualCalleeSignatures = Array.from(calleeNodes).map(node =>
            (node.getDstNode() as CallGraphNode).getMethod()
        );

        expectedCallees.forEach(expectedSignature => {
            assert(
                actualCalleeSignatures.includes(expectedSignature),
                `Expected callee ${expectedSignature} not found in actual callees: ${actualCalleeSignatures.join(', ')}`
            );
        });
    });

    it('case2: super test', () => {
        const makeSoundMethod = scene.getClasses().find(c => c.getName() === 'Dog')!.getMethods().find(m => m.getName() === 'sound')!;
        const cgNode = cg.getCallGraphNodeByMethod(makeSoundMethod.getSignature());
        const calleeNodes = cgNode.getOutgoingEdges();

        // 定义预期的四个函数签名或名称
        const expectedCallees = [
            scene.getClasses().find(c => c.getName() === 'Animal')!.getMethods().find(m => m.getName() === 'sound')!.getSignature(),
        ];

        // 方法1: 如果你要比较函数签名
        const actualCalleeSignatures = Array.from(calleeNodes).map(node =>
            (node.getDstNode() as CallGraphNode).getMethod()
        );

        expectedCallees.forEach(expectedSignature => {
            assert(
                actualCalleeSignatures.includes(expectedSignature),
                `Expected callee ${expectedSignature} not found in actual callees: ${actualCalleeSignatures.join(', ')}`
            );
        });
    });
});