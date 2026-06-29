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

import { SCCDetection, SceneConfig, Scene, CallGraph, CallGraphBuilder } from '../../../../src';
import { BaseImplicitGraph } from '../../../../src/core/graph/BaseImplicitGraph';
import { describe, expect, it } from 'vitest';

describe('SCCTest', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir('./tests/resources/scc');
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();

    let cg = new CallGraph(projectScene);
    let cgBuilder = new CallGraphBuilder(cg, projectScene);
    cgBuilder.buildDirectCallGraphForScene();

    let scc = new SCCDetection<CallGraph>(cg);
    scc.find();
    let topo = scc.getTopoAndCollapsedNodeStack();
    console.log(topo);
    it('case1: patching interface', () => {
        expect(topo.length).eq(4);
        expect(topo.reverse().toString()).eq('5,2,1,0'); //b,e,g,%dflt
        expect(Array.from(scc.getMySCCNodes(2)).toString()).eq('2,3,4,7'); //e,d,c,f
    });

    it('case2: backward compatibility - nodeIsInCycle on CallGraph', () => {
        // node 2 (e) is the rep of an SCC containing 2,3,4,7 -> multi-node cycle
        expect(scc.nodeIsInCycle(2)).toBe(true);
        // node 1 (g) is a single-node SCC without a self edge -> not in cycle
        expect(scc.nodeIsInCycle(1)).toBe(false);
    });
});

/**
 * A minimal implicit graph whose nodes are plain strings (not BaseNode).
 * Used to verify SCCDetection works on any GraphTraits<any> implementation.
 */
class StringGraph extends BaseImplicitGraph<string> {
    constructor(nodes: string[], edges: [string, string][]) {
        super();
        this.idToNodeMap = new Map();
        this.nodeToIdMap = new Map();
        this.succMap = new Map();
        this.predMap = new Map();
        nodes.forEach((n, i) => {
            this.idToNodeMap!.set(i, n);
            this.nodeToIdMap.set(n, i);
            this.succMap!.set(i, []);
            this.predMap!.set(i, []);
        });
        edges.forEach(([s, d]) => {
            const sid = this.nodeToIdMap.get(s)!;
            const did = this.nodeToIdMap.get(d)!;
            this.succMap!.get(sid)!.push(did);
            this.predMap!.get(did)!.push(sid);
        });
    }

    public getGraphName(): string {
        return 'StringGraph';
    }
}

describe('SCCTest with non-BaseNode graph', () => {
    // Graph: a -> b -> c -> a (cycle), c -> d (d outside cycle)
    const nodes = ['a', 'b', 'c', 'd'];
    const edges: [string, string][] = [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'a'],
        ['c', 'd'],
    ];
    const g = new StringGraph(nodes, edges);
    const scc = new SCCDetection<StringGraph>(g);
    scc.find();

    it('case3: detects multi-node cycle in string graph', () => {
        const idA = g.getNodeID('a');
        const idB = g.getNodeID('b');
        const idC = g.getNodeID('c');
        const idD = g.getNodeID('d');
        // a, b, c share the same rep (cycle), d is its own rep
        const repA = scc.getRepNode(idA);
        expect(scc.getRepNode(idB)).toBe(repA);
        expect(scc.getRepNode(idC)).toBe(repA);
        expect(scc.getRepNode(idD)).toBe(idD);
        // the cycle SCC contains a, b, c
        const sccNodes = scc.getMySCCNodes(idA);
        expect(sccNodes.size).toBe(3);
        expect(sccNodes.has(idA)).toBe(true);
        expect(sccNodes.has(idB)).toBe(true);
        expect(sccNodes.has(idC)).toBe(true);
        expect(sccNodes.has(idD)).toBe(false);
    });

    it('case4: nodeIsInCycle on string graph', () => {
        const idA = g.getNodeID('a');
        const idD = g.getNodeID('d');
        expect(scc.nodeIsInCycle(idA)).toBe(true);
        expect(scc.nodeIsInCycle(idD)).toBe(false);
    });

    it('case5: topological stack has cycle rep before d', () => {
        const idD = g.getNodeID('d');
        const topoStack = scc.getTopoAndCollapsedNodeStack();
        // d is not in the cycle; it should appear in the topo stack
        expect(topoStack.length).toBe(2);
        expect(topoStack).toContain(idD);
    });
});
