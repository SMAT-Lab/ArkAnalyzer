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

import { BaseImplicitGraph, NodeID } from './BaseImplicitGraph';
import { ArkModule, ModuleID } from '../model/ArkModule';
import { Canonicalizer } from '../../utils/Canonicalizer';
import { SCCDetection } from './Scc';

/**
 * Dependency type enum, indicating the source of a dependency edge.
 * Used during SCC post-processing to remove edges by priority when splitting oversized module groups.
 *
 * Priority (removal priority; higher value = removed first):
 *   - DEV_DEPENDENCIES (devDependencies): only needed during development, removed first
 *   - DYNAMIC (dynamicDependencies): runtime dynamic loading, removed next
 *   - DEPENDENCIES (dependencies): core dependency, removed last
 */
export enum DependencyType {
    DEPENDENCIES = 0, // Core dependency, lowest removal priority
    DYNAMIC = 1, // Dynamic dependency
    DEV_DEPENDENCIES = 2, // Dev dependency, highest removal priority
}

/**
 * Module dependency graph, based on BaseImplicitGraph.
 * The node type is ArkModule, and edges represent dependency relationships between modules.
 *
 * Differences from DependsGraph (BaseExplicitGraph):
 * - No BaseNode/BaseEdge objects needed; the node is the ArkModule itself
 * - Edge information is implicitly stored via succMap/predMap (Map<NodeID, NodeID[]>)
 * - Works with Canonicalizer<ArkModule> to provide bidirectional ArkModule <-> NodeID mapping
 *
 * SCCDetection has been generalized to accept any graph implementing GraphTraits<any>,
 * i.e. one providing nodesItor(), getNode(id), getNodeID(node), succ(id) methods.
 * ModuleDepGraph satisfies these methods by inheriting from BaseImplicitGraph,
 * without requiring nodes to have BaseNode methods like getID() or getOutgoingEdges().
 */
export class ModuleDepGraph extends BaseImplicitGraph<ArkModule> {
    /**
     * Module Canonicalizer for bidirectional ArkModule <-> ModuleID(NodeID) mapping.
     * Shares the same instance with the owning Scene's moduleCanonicalizer.
     */
    private moduleCanonicalizer: Canonicalizer<ArkModule>;

    /**
     * Edge type map, key is `${srcId}->${dstId}`, value is the dependency type.
     * Used during SCC post-processing to remove edges by dependency type priority.
     */
    private edgeTypeMap: Map<string, DependencyType> = new Map();

    /**
     * Topological order of nodes after SCC refinement, populated by refineSCCGroups.
     * Depended-on modules appear before their dependents.
     */
    private topoOrder: NodeID[] = [];

    /**
     * SCC groups: NodeID -> all NodeIDs in the same SCC group.
     * Populated by refineSCCGroups and retained for later queries.
     */
    private sccGroups: Map<NodeID, NodeID[]> = new Map();

    /**
     * SCC post-processing threshold: the maximum allowed number of modules in a group; SCCs
     * exceeding this size are split. Default 3; set to Number.MAX_SAFE_INTEGER to disable.
     */
    private maxSCCGroupSize: number = 3;

    constructor(moduleCanonicalizer: Canonicalizer<ArkModule>) {
        super();
        this.moduleCanonicalizer = moduleCanonicalizer;
        this.nodeToIdMap = new Map<ArkModule, NodeID>();
        this.idToNodeMap = new Map<NodeID, ArkModule>();
        this.succMap = new Map<NodeID, NodeID[]>();
        this.predMap = new Map<NodeID, NodeID[]>();
        this.edgeTypeMap = new Map<string, DependencyType>();
    }

    public getGraphName(): string {
        return 'ModuleDepGraph';
    }

    /**
     * Add a module node to the graph.
     * The node's NodeID directly uses the ModuleID assigned by the Canonicalizer.
     */
    public addModule(module: ArkModule): void {
        const id = this.moduleCanonicalizer.getId(module);
        this.nodeToIdMap.set(module, id);
        this.idToNodeMap!.set(id, module);

        // Ensure the node has corresponding entries in succMap and predMap (empty arrays)
        if (!this.succMap.has(id)) {
            this.succMap.set(id, []);
        }
        if (!this.predMap.has(id)) {
            this.predMap.set(id, []);
        }
    }

    /**
     * Add a dependency edge: src depends on dst (src -> dst).
     * succMap stores successors (dependency targets), predMap stores predecessors (dependents).
     * @param type Dependency type, used for edge removal priority during SCC post-processing.
     *              When the same edge is added twice, the type with the lower removal priority is kept (i.e. the more core dependency).
     */
    public addDependencyEdge(srcId: NodeID, dstId: NodeID, type: DependencyType = DependencyType.DEPENDENCIES): void {
        // Add successor
        let succs = this.succMap.get(srcId);
        if (!succs) {
            succs = [];
            this.succMap.set(srcId, succs);
        }
        if (!succs.includes(dstId)) {
            succs.push(dstId);
        }

        // Add predecessor
        let preds = this.predMap.get(dstId);
        if (!preds) {
            preds = [];
            this.predMap.set(dstId, preds);
        }
        if (!preds.includes(srcId)) {
            preds.push(srcId);
        }

        // Record edge type: when the same edge is added twice, keep the type with the lower removal priority (smaller value = more core)
        const edgeKey = `${srcId}->${dstId}`;
        const existingType = this.edgeTypeMap.get(edgeKey);
        if (existingType === undefined || type < existingType) {
            this.edgeTypeMap.set(edgeKey, type);
        }
    }

    /**
     * Remove a dependency edge.
     */
    public removeDependencyEdge(srcId: NodeID, dstId: NodeID): void {
        this.removeFromAdjacencyList(this.succMap, srcId, dstId);
        this.removeFromAdjacencyList(this.predMap, dstId, srcId);
        this.edgeTypeMap.delete(`${srcId}->${dstId}`);
    }

    /**
     * Remove a node ID from an adjacency list entry.
     */
    private removeFromAdjacencyList(adjMap: Map<NodeID, NodeID[]>, key: NodeID, value: NodeID): void {
        const list = adjMap.get(key);
        if (!list) {
            return;
        }
        const idx = list.indexOf(value);
        if (idx >= 0) {
            list.splice(idx, 1);
        }
    }

    /**
     * Get the dependency type of a specific edge.
     * @returns The dependency type, or undefined if the edge does not exist.
     */
    public getEdgeType(srcId: NodeID, dstId: NodeID): DependencyType | undefined {
        return this.edgeTypeMap.get(`${srcId}->${dstId}`);
    }

    /**
     * Get all successor (dependency target) module IDs of the specified module.
     */
    public getSuccModuleIds(moduleId: ModuleID): ModuleID[] {
        return this.succMap.get(moduleId) ?? [];
    }

    /**
     * Get all predecessor (dependent) module IDs of the specified module.
     */
    public getPredModuleIds(moduleId: ModuleID): ModuleID[] {
        return this.predMap.get(moduleId) ?? [];
    }

    /**
     * Check whether a dependency edge exists between two modules.
     */
    public hasDependencyEdge(srcId: NodeID, dstId: NodeID): boolean {
        const succs = this.succMap.get(srcId);
        return succs !== undefined && succs.includes(dstId);
    }

    /**
     * Get the total number of edges in the graph.
     */
    public getEdgeCount(): number {
        let count = 0;
        for (const succs of this.succMap.values()) {
            count += succs.length;
        }
        return count;
    }

    /**
     * Get the topological order produced by the last refineSCCGroups call.
     * Depended-on modules appear before their dependents.
     */
    public getTopoOrder(): NodeID[] {
        return this.topoOrder;
    }

    /**
     * Get the SCC groups map (NodeID -> all NodeIDs in the same SCC group) produced by the last
     * refineSCCGroups call.
     */
    public getSCCGroups(): Map<NodeID, NodeID[]> {
        return this.sccGroups;
    }

    /**
     * Set the SCC post-processing threshold. SCCs larger than this size are split.
     * Set to Number.MAX_SAFE_INTEGER to disable post-processing.
     */
    public setMaxSCCGroupSize(maxGroupSize: number): void {
        this.maxSCCGroupSize = maxGroupSize;
    }

    /** Current SCC post-processing threshold. */
    public getMaxSCCGroupSize(): number {
        return this.maxSCCGroupSize;
    }

    /**
     * Detect strong bridges in the SCC subgraph.
     * A strong bridge is a directed edge whose removal increases the number of SCCs.
     * For each edge u->v, check if removing it causes u and v to no longer be
     * mutually reachable. If either u cannot reach v or v cannot reach u without
     * the edge, then u->v is a strong bridge.
     * @param members Node IDs in the large SCC
     * @returns Array of strong bridge edges with their dependency types
     */
    public findStrongBridges(members: NodeID[]): Array<{ src: NodeID; dst: NodeID; type: DependencyType }> {
        const memberSet = new Set(members);
        const bridges: Array<{ src: NodeID; dst: NodeID; type: DependencyType }> = [];

        // Collect all internal edges
        const edges: Array<{ src: NodeID; dst: NodeID }> = [];
        for (const srcId of members) {
            const succs = this.getSuccModuleIds(srcId);
            for (const dstId of succs) {
                if (memberSet.has(dstId)) {
                    edges.push({ src: srcId, dst: dstId });
                }
            }
        }

        // For each edge u->v, it is a strong bridge if removing it causes
        // u and v to no longer be in the same SCC.
        for (const edge of edges) {
            const uCanReachV = this.canReachWithoutEdge(edge.src, edge.dst, edge.src, edge.dst, memberSet);
            const vCanReachU = this.canReachWithoutEdge(edge.dst, edge.src, edge.src, edge.dst, memberSet);
            if (!uCanReachV || !vCanReachU) {
                const type = this.getEdgeType(edge.src, edge.dst) ?? DependencyType.DEPENDENCIES;
                bridges.push({ src: edge.src, dst: edge.dst, type });
            }
        }

        return bridges;
    }

    /**
     * Check if 'from' can reach 'to' in the subgraph, excluding edge excludedSrc->excludedDst.
     * Uses DFS over successor edges within the member set.
     */
    private canReachWithoutEdge(from: NodeID, to: NodeID, excludedSrc: NodeID, excludedDst: NodeID, memberSet: Set<NodeID>): boolean {
        if (from === to) {
            return true;
        }

        const visited = new Set<NodeID>([from]);
        const stack: NodeID[] = [from];

        while (stack.length > 0) {
            const u = stack.pop()!;
            const succs = this.getSuccModuleIds(u);
            for (const v of succs) {
                if (!memberSet.has(v)) {
                    continue;
                }
                // Skip the excluded edge
                if (u === excludedSrc && v === excludedDst) {
                    continue;
                }
                if (v === to) {
                    return true;
                }
                if (!visited.has(v)) {
                    visited.add(v);
                    stack.push(v);
                }
            }
        }

        return false;
    }

    /**
     * Build a temporary subgraph excluding specified edges, for SCC post-processing.
     * Does not modify the original graph. Edge type labels are preserved from the original graph.
     * @param sccMembers Node IDs in the SCC subgraph
     * @param excludedEdges Set of edge keys ("srcId->dstId") to exclude
     * @returns A new ModuleDepGraph containing only the SCC subgraph without excluded edges
     */
    public buildTempGraphWithoutEdges(sccMembers: NodeID[], excludedEdges: Set<string>): ModuleDepGraph {
        const tempGraph = new ModuleDepGraph(this.moduleCanonicalizer);
        const memberSet = new Set(sccMembers);

        for (const memberId of sccMembers) {
            const module = this.moduleCanonicalizer.get(memberId);
            if (module) {
                tempGraph.addModule(module);
            }
        }

        for (const srcId of sccMembers) {
            const succs = this.getSuccModuleIds(srcId);
            for (const dstId of succs) {
                if (memberSet.has(dstId) && !excludedEdges.has(`${srcId}->${dstId}`)) {
                    const type = this.getEdgeType(srcId, dstId) ?? DependencyType.DEPENDENCIES;
                    tempGraph.addDependencyEdge(srcId, dstId, type);
                }
            }
        }

        return tempGraph;
    }

    /**
     * Recompute SCC on a temporary subgraph excluding specified edges, returning group results.
     * @param members Node IDs in the SCC
     * @param excludedEdges Set of edge keys to exclude from the temporary subgraph
     * @returns Array of SCC groups, each group is an array of NodeIDs
     */
    public recomputeSCC(members: NodeID[], excludedEdges: Set<string>): NodeID[][] {
        const tempGraph = this.buildTempGraphWithoutEdges(members, excludedEdges);
        const tempScc = new SCCDetection<ModuleDepGraph>(tempGraph);
        tempScc.find();
        const tempTopo = tempScc.getTopoAndCollapsedNodeStack();

        const groups: NodeID[][] = [];
        for (const repId of tempTopo) {
            const groupMembers = Array.from(tempScc.getMySCCNodes(repId));
            groups.push(groupMembers);
        }
        return groups;
    }

    /**
     * Split a single large SCC using strong bridge detection first,
     * then fall back to dependency type priority for remaining edges.
     * Does not modify the original graph.
     * @param members Node IDs in the large SCC
     * @param maxGroupSize Maximum allowed group size after splitting
     * @returns Array of split groups, each group is an array of NodeIDs
     */
    public splitLargeSCC(members: NodeID[], maxGroupSize: number): NodeID[][] {
        const excludedEdges: Set<string> = new Set();
        const memberSet = new Set(members);

        // Phase 1: Try removing strong bridges first (precise split)
        const bridges = this.findStrongBridges(members);
        bridges.sort((a, b) => b.type - a.type); // Higher removal priority first

        for (const bridge of bridges) {
            const currentGroups = this.recomputeSCC(members, excludedEdges);
            if (currentGroups.every(g => g.length <= maxGroupSize)) {
                return currentGroups;
            }

            excludedEdges.add(`${bridge.src}->${bridge.dst}`);

            const newGroups = this.recomputeSCC(members, excludedEdges);
            if (newGroups.every(g => g.length <= maxGroupSize)) {
                return newGroups;
            }
        }

        // Phase 2: Fall back to removing remaining edges by dependency type priority
        const edges: Array<{ src: NodeID; dst: NodeID; type: DependencyType }> = [];
        for (const srcId of members) {
            const succs = this.getSuccModuleIds(srcId);
            for (const dstId of succs) {
                if (memberSet.has(dstId) && !excludedEdges.has(`${srcId}->${dstId}`)) {
                    const type = this.getEdgeType(srcId, dstId) ?? DependencyType.DEPENDENCIES;
                    edges.push({ src: srcId, dst: dstId, type });
                }
            }
        }
        edges.sort((a, b) => b.type - a.type);

        for (const edge of edges) {
            const currentGroups = this.recomputeSCC(members, excludedEdges);
            if (currentGroups.every(g => g.length <= maxGroupSize)) {
                return currentGroups;
            }

            excludedEdges.add(`${edge.src}->${edge.dst}`);

            const newGroups = this.recomputeSCC(members, excludedEdges);
            if (newGroups.every(g => g.length <= maxGroupSize)) {
                return newGroups;
            }
        }

        return this.recomputeSCC(members, excludedEdges);
    }

    /**
     * Refine SCC groups: split groups exceeding maxGroupSize using strong bridge
     * detection and dependency type priority fallback.
     * Stores the resulting groups in {@link sccGroups} and returns the same map.
     * Also populates the topoOrder field with nodes in dependency order (depended-on first).
     * @param maxGroupSize Maximum allowed group size; Number.MAX_SAFE_INTEGER disables post-processing
     * @returns Map from each member NodeID to its group members array
     */
    public refineSCCGroups(maxGroupSize: number): Map<NodeID, NodeID[]> {
        const scc = new SCCDetection<ModuleDepGraph>(this);
        scc.find();
        const topoStack = scc.getTopoAndCollapsedNodeStack();

        const sccGroups: Map<NodeID, NodeID[]> = new Map();
        this.topoOrder = [];
        const added = new Set<NodeID>();

        for (const repId of topoStack) {
            const members = scc.nodeIsInCycle(repId) ? Array.from(scc.getMySCCNodes(repId)) : [repId];

            const groups = members.length <= maxGroupSize ? [members] : this.splitLargeSCC(members, maxGroupSize);

            if (!scc.nodeIsInCycle(repId)) {
                this.addToTopoAndGroups([repId], [repId], sccGroups, added);
            } else {
                for (const group of groups) {
                    this.addToTopoAndGroups(group, group, sccGroups, added);
                }
            }
        }

        this.sccGroups = sccGroups;
        return sccGroups;
    }

    /**
     * Add members to topoOrder and sccGroups, skipping already-added members.
     */
    private addToTopoAndGroups(members: NodeID[], group: NodeID[], sccGroups: Map<NodeID, NodeID[]>, added: Set<NodeID>): void {
        for (const memberId of members) {
            if (!added.has(memberId)) {
                added.add(memberId);
                this.topoOrder.push(memberId);
            }
            sccGroups.set(memberId, group);
        }
    }
}
