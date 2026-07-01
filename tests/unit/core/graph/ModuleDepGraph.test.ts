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

import { describe, expect, it } from 'vitest';
import { ModuleDepGraph, DependencyType } from '../../../../src/core/graph/ModuleDepGraph';
import { ArkModule } from '../../../../src/core/model/ArkModule';
import { Canonicalizer } from '../../../../src/utils/Canonicalizer';
import { ModuleManager } from '../../../../src/frontend/common/ModuleManager';
import type { Scene } from '../../../../src/Scene';

const STUB_MANAGER = new ModuleManager({} as Scene);

function makeModule(path: string, name: string): ArkModule {
    const module = new ArkModule(STUB_MANAGER);
    module.setModulePath(path);
    module.setModuleName(name);
    return module;
}

describe('ModuleDepGraph tests', () => {
    describe('addModule', () => {
        it('increases node count and includes the module in nodesItor', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const module = makeModule('/project/entry', '@ohos/entry');

            expect(graph.getNodeNum()).toBe(0);
            graph.addModule(module);
            expect(graph.getNodeNum()).toBe(1);

            const nodes = Array.from(graph.nodesItor());
            expect(nodes.length).toBe(1);
            expect(nodes[0]).toBe(module);
        });

        it('does not increase count when the same module is added twice', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const module = makeModule('/project/entry', '@ohos/entry');

            graph.addModule(module);
            expect(graph.getNodeNum()).toBe(1);

            graph.addModule(module);
            expect(graph.getNodeNum()).toBe(1);
        });

        it('adds multiple modules with increasing node count', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const m1 = makeModule('/project/entry', '@ohos/entry');
            const m2 = makeModule('/project/lib', '@ohos/lib');
            const m3 = makeModule('/project/utils', '@ohos/utils');

            graph.addModule(m1);
            graph.addModule(m2);
            graph.addModule(m3);
            expect(graph.getNodeNum()).toBe(3);
        });
    });

    describe('NodeID consistency with Canonicalizer ModuleID', () => {
        it('getNodeID returns the same ID as Canonicalizer.getId', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const module = makeModule('/project/entry', '@ohos/entry');

            const canonId = canon.getId(module);
            graph.addModule(module);
            const graphId = graph.getNodeID(module);

            expect(graphId).toBe(canonId);
        });

        it('getNode returns the module whose ID was assigned by Canonicalizer', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const m1 = makeModule('/project/entry', '@ohos/entry');
            const m2 = makeModule('/project/lib', '@ohos/lib');

            graph.addModule(m1);
            graph.addModule(m2);

            const id1 = canon.getId(m1);
            const id2 = canon.getId(m2);
            expect(graph.getNode(id1)).toBe(m1);
            expect(graph.getNode(id2)).toBe(m2);
        });
    });

    describe('addDependencyEdge', () => {
        it('reflects the edge in succ and pred', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const src = makeModule('/project/entry', '@ohos/entry');
            const dst = makeModule('/project/lib', '@ohos/lib');

            graph.addModule(src);
            graph.addModule(dst);
            const srcId = canon.getId(src);
            const dstId = canon.getId(dst);

            graph.addDependencyEdge(srcId, dstId);

            expect(graph.succ(srcId)).toContain(dstId);
            expect(graph.pred(dstId)).toContain(srcId);
        });

        it('defaults to DEPENDENCIES type when no type is specified', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const src = makeModule('/project/entry', '@ohos/entry');
            const dst = makeModule('/project/lib', '@ohos/lib');

            graph.addModule(src);
            graph.addModule(dst);
            const srcId = canon.getId(src);
            const dstId = canon.getId(dst);

            graph.addDependencyEdge(srcId, dstId);

            expect(graph.getEdgeType(srcId, dstId)).toBe(DependencyType.DEPENDENCIES);
        });

        it('stores the specified dependency type', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const src = makeModule('/project/entry', '@ohos/entry');
            const dst = makeModule('/project/lib', '@ohos/lib');

            graph.addModule(src);
            graph.addModule(dst);
            const srcId = canon.getId(src);
            const dstId = canon.getId(dst);

            graph.addDependencyEdge(srcId, dstId, DependencyType.DEV_DEPENDENCIES);
            expect(graph.getEdgeType(srcId, dstId)).toBe(DependencyType.DEV_DEPENDENCIES);

            graph.removeDependencyEdge(srcId, dstId);
            graph.addDependencyEdge(srcId, dstId, DependencyType.DYNAMIC);
            expect(graph.getEdgeType(srcId, dstId)).toBe(DependencyType.DYNAMIC);
        });

        it('keeps the lower priority type when DEV then DEP are added', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const src = makeModule('/project/entry', '@ohos/entry');
            const dst = makeModule('/project/lib', '@ohos/lib');

            graph.addModule(src);
            graph.addModule(dst);
            const srcId = canon.getId(src);
            const dstId = canon.getId(dst);

            graph.addDependencyEdge(srcId, dstId, DependencyType.DEV_DEPENDENCIES);
            graph.addDependencyEdge(srcId, dstId, DependencyType.DEPENDENCIES);

            expect(graph.getEdgeType(srcId, dstId)).toBe(DependencyType.DEPENDENCIES);
        });

        it('keeps the lower priority type when DEP then DEV are added', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const src = makeModule('/project/entry', '@ohos/entry');
            const dst = makeModule('/project/lib', '@ohos/lib');

            graph.addModule(src);
            graph.addModule(dst);
            const srcId = canon.getId(src);
            const dstId = canon.getId(dst);

            graph.addDependencyEdge(srcId, dstId, DependencyType.DEPENDENCIES);
            graph.addDependencyEdge(srcId, dstId, DependencyType.DEV_DEPENDENCIES);

            expect(graph.getEdgeType(srcId, dstId)).toBe(DependencyType.DEPENDENCIES);
        });

        it('does not increase getEdgeCount when the same edge is added twice', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const src = makeModule('/project/entry', '@ohos/entry');
            const dst = makeModule('/project/lib', '@ohos/lib');

            graph.addModule(src);
            graph.addModule(dst);
            const srcId = canon.getId(src);
            const dstId = canon.getId(dst);

            graph.addDependencyEdge(srcId, dstId);
            expect(graph.getEdgeCount()).toBe(1);

            graph.addDependencyEdge(srcId, dstId);
            expect(graph.getEdgeCount()).toBe(1);
        });

        it('keeps the lowest priority type among all three types', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const src = makeModule('/project/entry', '@ohos/entry');
            const dst = makeModule('/project/lib', '@ohos/lib');

            graph.addModule(src);
            graph.addModule(dst);
            const srcId = canon.getId(src);
            const dstId = canon.getId(dst);

            graph.addDependencyEdge(srcId, dstId, DependencyType.DEV_DEPENDENCIES);
            graph.addDependencyEdge(srcId, dstId, DependencyType.DYNAMIC);
            graph.addDependencyEdge(srcId, dstId, DependencyType.DEPENDENCIES);

            expect(graph.getEdgeType(srcId, dstId)).toBe(DependencyType.DEPENDENCIES);
        });
    });

    describe('removeDependencyEdge', () => {
        it('removes the edge from succ and pred', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const src = makeModule('/project/entry', '@ohos/entry');
            const dst = makeModule('/project/lib', '@ohos/lib');

            graph.addModule(src);
            graph.addModule(dst);
            const srcId = canon.getId(src);
            const dstId = canon.getId(dst);

            graph.addDependencyEdge(srcId, dstId, DependencyType.DYNAMIC);
            graph.removeDependencyEdge(srcId, dstId);

            expect(graph.succ(srcId)).not.toContain(dstId);
            expect(graph.pred(dstId)).not.toContain(srcId);
        });

        it('clears the edge type record', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const src = makeModule('/project/entry', '@ohos/entry');
            const dst = makeModule('/project/lib', '@ohos/lib');

            graph.addModule(src);
            graph.addModule(dst);
            const srcId = canon.getId(src);
            const dstId = canon.getId(dst);

            graph.addDependencyEdge(srcId, dstId, DependencyType.DEV_DEPENDENCIES);
            graph.removeDependencyEdge(srcId, dstId);

            expect(graph.getEdgeType(srcId, dstId)).toBeUndefined();
        });

        it('decreases getEdgeCount after removal', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const src = makeModule('/project/entry', '@ohos/entry');
            const dst = makeModule('/project/lib', '@ohos/lib');

            graph.addModule(src);
            graph.addModule(dst);
            const srcId = canon.getId(src);
            const dstId = canon.getId(dst);

            graph.addDependencyEdge(srcId, dstId);
            expect(graph.getEdgeCount()).toBe(1);

            graph.removeDependencyEdge(srcId, dstId);
            expect(graph.getEdgeCount()).toBe(0);
        });
    });

    describe('getEdgeType', () => {
        it('returns undefined for a non-existent edge', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const m1 = makeModule('/project/entry', '@ohos/entry');
            const m2 = makeModule('/project/lib', '@ohos/lib');

            graph.addModule(m1);
            graph.addModule(m2);
            const id1 = canon.getId(m1);
            const id2 = canon.getId(m2);

            expect(graph.getEdgeType(id1, id2)).toBeUndefined();
        });
    });

    describe('hasDependencyEdge', () => {
        it('returns true for an existing edge and false for a non-existing one', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const src = makeModule('/project/entry', '@ohos/entry');
            const dst = makeModule('/project/lib', '@ohos/lib');
            const other = makeModule('/project/utils', '@ohos/utils');

            graph.addModule(src);
            graph.addModule(dst);
            graph.addModule(other);
            const srcId = canon.getId(src);
            const dstId = canon.getId(dst);
            const otherId = canon.getId(other);

            graph.addDependencyEdge(srcId, dstId);

            expect(graph.hasDependencyEdge(srcId, dstId)).toBe(true);
            expect(graph.hasDependencyEdge(dstId, srcId)).toBe(false);
            expect(graph.hasDependencyEdge(srcId, otherId)).toBe(false);
        });
    });

    describe('getSuccModuleIds / getPredModuleIds', () => {
        it('returns correct successor and predecessor lists', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const a = makeModule('/project/a', '@ohos/a');
            const b = makeModule('/project/b', '@ohos/b');
            const c = makeModule('/project/c', '@ohos/c');

            graph.addModule(a);
            graph.addModule(b);
            graph.addModule(c);
            const idA = canon.getId(a);
            const idB = canon.getId(b);
            const idC = canon.getId(c);

            // a -> b, a -> c
            graph.addDependencyEdge(idA, idB);
            graph.addDependencyEdge(idA, idC);

            const succs = graph
                .getSuccModuleIds(idA)
                .slice()
                .sort((x, y) => x - y);
            expect(succs).toEqual([idB, idC].sort((x, y) => x - y));

            expect(graph.getPredModuleIds(idB)).toEqual([idA]);
            expect(graph.getPredModuleIds(idC)).toEqual([idA]);
            expect(graph.getPredModuleIds(idA)).toEqual([]);
        });

        it('returns an empty array for a module with no edges', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const m = makeModule('/project/entry', '@ohos/entry');
            graph.addModule(m);
            const id = canon.getId(m);

            expect(graph.getSuccModuleIds(id)).toEqual([]);
            expect(graph.getPredModuleIds(id)).toEqual([]);
        });
    });

    describe('getEdgeCount', () => {
        it('returns the correct count with multiple edges', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const a = makeModule('/project/a', '@ohos/a');
            const b = makeModule('/project/b', '@ohos/b');
            const c = makeModule('/project/c', '@ohos/c');

            graph.addModule(a);
            graph.addModule(b);
            graph.addModule(c);
            const idA = canon.getId(a);
            const idB = canon.getId(b);
            const idC = canon.getId(c);

            // a -> b, b -> c, c -> a (3 edges)
            graph.addDependencyEdge(idA, idB);
            graph.addDependencyEdge(idB, idC);
            graph.addDependencyEdge(idC, idA);

            expect(graph.getEdgeCount()).toBe(3);
        });

        it('returns 0 for a graph with no edges', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const a = makeModule('/project/a', '@ohos/a');
            graph.addModule(a);

            expect(graph.getEdgeCount()).toBe(0);
        });
    });

    describe('getGraphName', () => {
        it('returns "ModuleDepGraph"', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            expect(graph.getGraphName()).toBe('ModuleDepGraph');
        });
    });

    describe('hasNode', () => {
        it('returns true for added modules and false for unknown IDs', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const m = makeModule('/project/entry', '@ohos/entry');
            graph.addModule(m);
            const id = canon.getId(m);

            expect(graph.hasNode(id)).toBe(true);
            expect(graph.hasNode(id + 999)).toBe(false);
        });
    });

    describe('SCC post-processing (refineSCCGroups)', () => {
        it('keeps a small SCC unchanged when size <= maxGroupSize', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const a = makeModule('/p/a', '@ohos/a');
            const b = makeModule('/p/b', '@ohos/b');
            const c = makeModule('/p/c', '@ohos/c');
            graph.addModule(a);
            graph.addModule(b);
            graph.addModule(c);
            const idA = canon.getId(a);
            const idB = canon.getId(b);
            const idC = canon.getId(c);
            // 3-node cycle A -> B -> C -> A
            graph.addDependencyEdge(idA, idB);
            graph.addDependencyEdge(idB, idC);
            graph.addDependencyEdge(idC, idA);

            const groups = graph.refineSCCGroups(5);

            // All three nodes should be in the same group (not split)
            const groupA = groups.get(idA)!;
            expect(groupA.length).toBe(3);
            expect(groups.get(idB)).toBe(groupA);
            expect(groups.get(idC)).toBe(groupA);
            // topoOrder should contain all 3 nodes
            expect(graph.getTopoOrder().length).toBe(3);
        });

        it('splits a large SCC by removing a devDependencies edge (strong bridge)', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const a = makeModule('/p/a', '@ohos/a');
            const b = makeModule('/p/b', '@ohos/b');
            const c = makeModule('/p/c', '@ohos/c');
            const d = makeModule('/p/d', '@ohos/d');
            graph.addModule(a);
            graph.addModule(b);
            graph.addModule(c);
            graph.addModule(d);
            const idA = canon.getId(a);
            const idB = canon.getId(b);
            const idC = canon.getId(c);
            const idD = canon.getId(d);
            // Two 2-cycles connected by a DEV edge:
            // A <-> B (DEP), C <-> D (DEP), B -> C (DEV), D -> A (DEP)
            graph.addDependencyEdge(idA, idB, DependencyType.DEPENDENCIES);
            graph.addDependencyEdge(idB, idA, DependencyType.DEPENDENCIES);
            graph.addDependencyEdge(idB, idC, DependencyType.DEV_DEPENDENCIES);
            graph.addDependencyEdge(idC, idD, DependencyType.DEPENDENCIES);
            graph.addDependencyEdge(idD, idC, DependencyType.DEPENDENCIES);
            graph.addDependencyEdge(idD, idA, DependencyType.DEPENDENCIES);

            const groups = graph.refineSCCGroups(2);

            // The DEV edge B->C should be removed, splitting into {A,B} and {C,D}
            const groupA = groups.get(idA)!;
            const groupC = groups.get(idC)!;
            expect(groupA.length).toBeLessThanOrEqual(2);
            expect(groupC.length).toBeLessThanOrEqual(2);
            expect(groups.get(idB)).toBe(groupA);
            expect(groups.get(idD)).toBe(groupC);
            expect(groupA).not.toBe(groupC);
        });

        it('splits a large SCC with only dependencies edges (last resort removal)', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const a = makeModule('/p/a', '@ohos/a');
            const b = makeModule('/p/b', '@ohos/b');
            const c = makeModule('/p/c', '@ohos/c');
            graph.addModule(a);
            graph.addModule(b);
            graph.addModule(c);
            const idA = canon.getId(a);
            const idB = canon.getId(b);
            const idC = canon.getId(c);
            // K_3 complete digraph, all DEPENDENCIES, no strong bridges
            graph.addDependencyEdge(idA, idB);
            graph.addDependencyEdge(idB, idA);
            graph.addDependencyEdge(idA, idC);
            graph.addDependencyEdge(idC, idA);
            graph.addDependencyEdge(idB, idC);
            graph.addDependencyEdge(idC, idB);

            const groups = graph.refineSCCGroups(2);

            // All groups should have size <= 2
            for (const group of new Set(groups.values())) {
                expect(group.length).toBeLessThanOrEqual(2);
            }
            // The original SCC of 3 nodes must be split (not one group of 3)
            expect(new Set(groups.values()).size).toBeGreaterThan(1);
        });

        it('reduces to single-node groups when all edges must be removed (maxGroupSize = 1)', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const a = makeModule('/p/a', '@ohos/a');
            const b = makeModule('/p/b', '@ohos/b');
            const c = makeModule('/p/c', '@ohos/c');
            graph.addModule(a);
            graph.addModule(b);
            graph.addModule(c);
            const idA = canon.getId(a);
            const idB = canon.getId(b);
            const idC = canon.getId(c);
            // K_3 complete digraph, all DEPENDENCIES
            graph.addDependencyEdge(idA, idB);
            graph.addDependencyEdge(idB, idA);
            graph.addDependencyEdge(idA, idC);
            graph.addDependencyEdge(idC, idA);
            graph.addDependencyEdge(idB, idC);
            graph.addDependencyEdge(idC, idB);

            const groups = graph.refineSCCGroups(1);

            // Each node should be its own group
            expect(groups.get(idA)!.length).toBe(1);
            expect(groups.get(idB)!.length).toBe(1);
            expect(groups.get(idC)!.length).toBe(1);
            expect(new Set(groups.values()).size).toBe(3);
        });

        it('disables post-processing when maxGroupSize = MAX_SAFE_INTEGER', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const mods: ArkModule[] = [];
            for (let i = 0; i < 5; i++) {
                const m = makeModule(`/p/m${i}`, `@ohos/m${i}`);
                graph.addModule(m);
                mods.push(m);
            }
            const ids = mods.map((m) => canon.getId(m));
            // 5-node cycle
            for (let i = 0; i < 5; i++) {
                graph.addDependencyEdge(ids[i], ids[(i + 1) % 5]);
            }

            const groups = graph.refineSCCGroups(Number.MAX_SAFE_INTEGER);

            // All 5 nodes should be in one group (no splitting)
            const group0 = groups.get(ids[0])!;
            expect(group0.length).toBe(5);
            for (let i = 1; i < 5; i++) {
                expect(groups.get(ids[i])).toBe(group0);
            }
        });

        it('splits multiple large SCCs independently', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const mods: ArkModule[] = [];
            for (let i = 0; i < 8; i++) {
                const m = makeModule(`/p/m${i}`, `@ohos/m${i}`);
                graph.addModule(m);
                mods.push(m);
            }
            const ids = mods.map((m) => canon.getId(m));
            // SCC1: 4-node cycle 0 -> 1 -> 2 -> 3 -> 0
            graph.addDependencyEdge(ids[0], ids[1]);
            graph.addDependencyEdge(ids[1], ids[2]);
            graph.addDependencyEdge(ids[2], ids[3]);
            graph.addDependencyEdge(ids[3], ids[0]);
            // SCC2: 4-node cycle 4 -> 5 -> 6 -> 7 -> 4
            graph.addDependencyEdge(ids[4], ids[5]);
            graph.addDependencyEdge(ids[5], ids[6]);
            graph.addDependencyEdge(ids[6], ids[7]);
            graph.addDependencyEdge(ids[7], ids[4]);

            const groups = graph.refineSCCGroups(2);

            // All groups should have size <= 2
            for (const group of new Set(groups.values())) {
                expect(group.length).toBeLessThanOrEqual(2);
            }
            // All 8 nodes should be covered
            expect(groups.size).toBe(8);
            // topoOrder should contain all 8 nodes
            expect(graph.getTopoOrder().length).toBe(8);
            // No group should mix nodes from SCC1 and SCC2
            const scc1Set = new Set([ids[0], ids[1], ids[2], ids[3]]);
            const scc2Set = new Set([ids[4], ids[5], ids[6], ids[7]]);
            for (const group of new Set(groups.values())) {
                const hasSCC1 = group.some((id) => scc1Set.has(id));
                const hasSCC2 = group.some((id) => scc2Set.has(id));
                expect(hasSCC1 && hasSCC2).toBe(false);
            }
        });

        it('does not modify the original graph during post-processing', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const a = makeModule('/p/a', '@ohos/a');
            const b = makeModule('/p/b', '@ohos/b');
            const c = makeModule('/p/c', '@ohos/c');
            graph.addModule(a);
            graph.addModule(b);
            graph.addModule(c);
            const idA = canon.getId(a);
            const idB = canon.getId(b);
            const idC = canon.getId(c);
            // K_3, all DEP
            graph.addDependencyEdge(idA, idB);
            graph.addDependencyEdge(idB, idA);
            graph.addDependencyEdge(idA, idC);
            graph.addDependencyEdge(idC, idA);
            graph.addDependencyEdge(idB, idC);
            graph.addDependencyEdge(idC, idB);

            const edgeCountBefore = graph.getEdgeCount();
            expect(edgeCountBefore).toBe(6);

            graph.refineSCCGroups(2);

            // Original graph should be unchanged
            expect(graph.getEdgeCount()).toBe(edgeCountBefore);
            expect(graph.hasDependencyEdge(idA, idB)).toBe(true);
            expect(graph.hasDependencyEdge(idB, idA)).toBe(true);
            expect(graph.hasDependencyEdge(idA, idC)).toBe(true);
            expect(graph.hasDependencyEdge(idC, idA)).toBe(true);
            expect(graph.hasDependencyEdge(idB, idC)).toBe(true);
            expect(graph.hasDependencyEdge(idC, idB)).toBe(true);
        });

        it('findStrongBridges correctly identifies connecting edges', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const mods: ArkModule[] = [];
            for (let i = 0; i < 6; i++) {
                const m = makeModule(`/p/m${i}`, `@ohos/m${i}`);
                graph.addModule(m);
                mods.push(m);
            }
            const ids = mods.map((m) => canon.getId(m));
            // K_3 on {0,1,2}: all 6 directed edges (no internal strong bridges)
            for (const [i, j] of [
                [0, 1], [1, 0], [0, 2], [2, 0], [1, 2], [2, 1]
            ]) {
                graph.addDependencyEdge(ids[i], ids[j]);
            }
            // K_3 on {3,4,5}: all 6 directed edges
            for (const [i, j] of [
                [3, 4], [4, 3], [3, 5], [5, 3], [4, 5], [5, 4]
            ]) {
                graph.addDependencyEdge(ids[i], ids[j]);
            }
            // Connecting edges: 2->3 and 5->0 (these are the strong bridges)
            graph.addDependencyEdge(ids[2], ids[3]);
            graph.addDependencyEdge(ids[5], ids[0]);

            const bridges = graph.findStrongBridges(ids);

            // Only the connecting edges should be strong bridges
            expect(bridges.length).toBe(2);
            const bridgeKeys = new Set(bridges.map((br) => `${br.src}->${br.dst}`));
            expect(bridgeKeys.has(`${ids[2]}->${ids[3]}`)).toBe(true);
            expect(bridgeKeys.has(`${ids[5]}->${ids[0]}`)).toBe(true);
        });

        it('falls back to type priority when no strong bridges exist', () => {
            const canon = new Canonicalizer<ArkModule>();
            const graph = new ModuleDepGraph(canon);
            const a = makeModule('/p/a', '@ohos/a');
            const b = makeModule('/p/b', '@ohos/b');
            const c = makeModule('/p/c', '@ohos/c');
            graph.addModule(a);
            graph.addModule(b);
            graph.addModule(c);
            const idA = canon.getId(a);
            const idB = canon.getId(b);
            const idC = canon.getId(c);
            // K_3 with mixed types: A->B is DEV, rest are DEP
            graph.addDependencyEdge(idA, idB, DependencyType.DEV_DEPENDENCIES);
            graph.addDependencyEdge(idB, idA);
            graph.addDependencyEdge(idA, idC);
            graph.addDependencyEdge(idC, idA);
            graph.addDependencyEdge(idB, idC);
            graph.addDependencyEdge(idC, idB);

            const members = [idA, idB, idC];

            // K_3 has no strong bridges
            const bridges = graph.findStrongBridges(members);
            expect(bridges.length).toBe(0);

            // splitLargeSCC should still split via Phase 2 (type priority fallback)
            const groups = graph.splitLargeSCC(members, 2);
            for (const group of groups) {
                expect(group.length).toBeLessThanOrEqual(2);
            }
            // The SCC must be split (not one group of 3)
            expect(groups.length).toBeGreaterThan(1);

            // Original graph should be unmodified
            expect(graph.getEdgeCount()).toBe(6);
            expect(graph.hasDependencyEdge(idA, idB)).toBe(true);
        });
    });
});
