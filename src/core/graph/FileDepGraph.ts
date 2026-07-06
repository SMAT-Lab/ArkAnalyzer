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

import { BaseImplicitGraph } from './BaseImplicitGraph';
import type { NodeID } from './BaseImplicitGraph';
import type { ArkFile } from '../model/ArkFile';
import type { Canonicalizer } from '../../utils/Canonicalizer';
import { SCCDetection } from './Scc';

/**
 * File dependency graph, based on BaseImplicitGraph.
 * The node type is ArkFile, and edges represent dependency relationships between files.
 *
 * Similar to ModuleDepGraph but operates at file granularity:
 * - The node is the ArkFile itself, identified by its Canonicalizer-assigned ID
 * - Edge information is implicitly stored via succMap/predMap (Map<NodeID, NodeID[]>)
 * - Works with Canonicalizer<ArkFile> to provide bidirectional ArkFile <-> NodeID mapping
 *
 * SCCDetection is used to compute a topological order of files (depended-on files first).
 */
export class FileDepGraph extends BaseImplicitGraph<ArkFile> {
    /**
     * File Canonicalizer for bidirectional ArkFile <-> NodeID mapping.
     */
    private fileCanonicalizer: Canonicalizer<ArkFile>;

    /**
     * Topological order of nodes after SCC computation, populated by computeTopoOrder.
     * Depended-on files appear before their dependents.
     */
    private topoOrder: NodeID[] = [];

    constructor(fileCanonicalizer: Canonicalizer<ArkFile>) {
        super();
        this.fileCanonicalizer = fileCanonicalizer;
        this.nodeToIdMap = new Map<ArkFile, NodeID>();
        this.idToNodeMap = new Map<NodeID, ArkFile>();
        this.succMap = new Map<NodeID, NodeID[]>();
        this.predMap = new Map<NodeID, NodeID[]>();
    }

    public getGraphName(): string {
        return 'FileDepGraph';
    }

    /**
     * Add a file node to the graph.
     * The node's NodeID directly uses the ID assigned by the Canonicalizer.
     */
    public addFile(file: ArkFile): void {
        const id = this.fileCanonicalizer.getId(file);
        this.nodeToIdMap.set(file, id);
        this.idToNodeMap!.set(id, file);

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
     */
    public addDependencyEdge(srcId: NodeID, dstId: NodeID): void {
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
    }

    /**
     * Remove a dependency edge.
     */
    public removeDependencyEdge(srcId: NodeID, dstId: NodeID): void {
        this.removeFromAdjacencyList(this.succMap, srcId, dstId);
        this.removeFromAdjacencyList(this.predMap, dstId, srcId);
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
     * Get all successor (dependency target) file IDs of the specified file.
     */
    public getSuccFileIds(fileId: NodeID): NodeID[] {
        return this.succMap.get(fileId) ?? [];
    }

    /**
     * Get all predecessor (dependent) file IDs of the specified file.
     */
    public getPredFileIds(fileId: NodeID): NodeID[] {
        return this.predMap.get(fileId) ?? [];
    }

    /**
     * Check whether a dependency edge exists between two files.
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
        this.succMap.forEach((succs) => {
            count += succs.length;
        });
        return count;
    }

    /**
     * Get the topological order produced by the last computeTopoOrder call.
     * Depended-on files appear before their dependents.
     */
    public getTopoOrder(): NodeID[] {
        return this.topoOrder;
    }

    /**
     * Compute the topological order of all files using SCCDetection.
     * Each SCC representative in the topological stack is expanded to its members,
     * so every node appears exactly once. The result is stored in topoOrder and returned.
     * Depended-on files appear before their dependents.
     */
    public computeTopoOrder(): NodeID[] {
        const scc = new SCCDetection<FileDepGraph>(this);
        scc.find();
        const topoStack = scc.getTopoAndCollapsedNodeStack();

        this.topoOrder = [];
        const added = new Set<NodeID>();

        for (const repId of topoStack) {
            const members = Array.from(scc.getMySCCNodes(repId));
            for (const memberId of members) {
                if (!added.has(memberId)) {
                    added.add(memberId);
                    this.topoOrder.push(memberId);
                }
            }
        }

        return this.topoOrder;
    }
}
