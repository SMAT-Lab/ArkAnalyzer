/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

import { BaseNode } from './BaseExplicitGraph';
import { NodeID, GraphTraits } from './GraphTraits';

type NodeSet = Set<NodeID>;
type NodeStack = NodeID[];
type Node2RepSCCInfoMap = Map<NodeID, NodeSCCInfo>;
type Node2NodeMap = Map<NodeID, NodeID>;

/**
 * Basic SCC info for a single node
 */
class NodeSCCInfo {
    private _rep: NodeID;
    private _subNodes: NodeSet;

    constructor() {
        this._rep = Number.MAX_SAFE_INTEGER;
        this._subNodes = new Set();
    }

    get rep(): NodeID {
        return this._rep;
    }

    set rep(n: NodeID) {
        this._rep = n;
    }

    addSubNodes(n: NodeID): void {
        this._subNodes.add(n);
    }

    get subNodes(): NodeSet {
        return this._subNodes;
    }
}

/**
 * Detect strongly connected components in a directed graph
 * A topological graph is an extra product from this algorithm
 * Advanced Nuutila’s algorithm which come from the following paper:
 *   Wave Propagation and Deep Propagation for pointer Analysis
 *   CGO 2009
 */
export class SCCDetection<Graph extends GraphTraits<BaseNode>> {
    // graph G = (V, E)
    private _G: Graph;
    // counter
    private _I: number;
    // map of V to {1, . . . , |V |} ∪ ⊥, associates the
    // nodes in V to the order in which they are visited by
    // Nuutila’s algorithm. Initially, D(v) = ⊥.
    private _D: Node2NodeMap;
    // map of V to V , associates each node in a cycle to
    // the representative of that cycle. Initially R(v) = v.
    private _R: Node2RepSCCInfoMap;
    // stack of V, holds the nodes that are in a cycle, but
    // have not yet been inserted into C. Initially empty
    private _S: NodeStack;
    // stack of V , holds the nodes of V that are represenatives
    // of strongly connected components. T keeps the
    // nodes in topological order, that is, the top node has no
    // predecessors. Initially empty
    private _T: NodeStack;
    private repNodes: NodeSet;
    private visitedNodes: Set<NodeID>;
    private inSCCNodes: Set<NodeID>;

    constructor(GT: Graph) {
        this._G = GT;
        this._I = 0;
        this._D = new Map<NodeID, NodeID>();
        this._S = new Array<NodeID>();
        this._T = new Array<NodeID>();
        this.repNodes = new Set<NodeID>();
        this._R = new Map<number, NodeSCCInfo>();
        this.visitedNodes = new Set();
        this.inSCCNodes = new Set();
    }

    private isVisited(n: NodeID): boolean {
        return this.visitedNodes.has(n);
    }

    private inSCC(n: NodeID): boolean {
        return this.inSCCNodes.has(n);
    }

    private setVisited(n: NodeID): void {
        this.visitedNodes.add(n);
    }

    private setInSCC(n: NodeID): void {
        this.inSCCNodes.add(n);
    }

    private setRep(n: NodeID, r: NodeID): void {
        let sccIn = this._R.get(n);
        if (!sccIn) {
            sccIn = new NodeSCCInfo();
            this._R.set(n, sccIn);
        }
        sccIn.rep = r;

        let rInfo = this._R.get(r);
        if (!rInfo) {
            rInfo = new NodeSCCInfo();
            this._R.set(r, rInfo);
        }
        rInfo.addSubNodes(n);
        if (n !== r) {
            sccIn.subNodes.clear();
            this.repNodes.add(r);
        }
    }

    private getRep(n: NodeID): NodeID {
        let info = this._R.get(n);
        if (!info) {
            info = new NodeSCCInfo();
            this._R.set(n, info);
        }
        return info.rep;
    }

    private getNode(id: NodeID): BaseNode {
        let n = this._G.getNode(id);
        if (!n) {
            throw new Error('Node is not found');
        }
        return n;
    }

    private visit(v: NodeID): void {
        this._I += 1;
        this._D.set(v, this._I);
        this.setRep(v, v);
        this.setVisited(v);

        let node = this.getNode(v);
        node.getOutgoingEdges().forEach(e => {
            let w: NodeID = e.getDstID();
            if (!this.isVisited(w)) {
                this.visit(w);
            }

            if (!this.inSCC(w)) {
                let repV = this.getRep(v);
                let repW = this.getRep(w);
                if (!this._D.has(repV) || !this._D.has(repW)) {
                    throw new Error('Error happening in SCC detection');
                }
                let rep = this._D.get(repV)! < this._D.get(repW)! ? repV : repW;
                this.setRep(v, rep);
            }
        });

        if (this.getRep(v) === v) {
            this.setInSCC(v);
            while (this._S.length > 0) {
                let w = this._S[this._S.length - 1]!;
                if (this._D.get(w)! <= this._D.get(v)!) {
                    break;
                } else {
                    this._S.pop();
                    this.setInSCC(w);
                    this.setRep(w, v);
                }
            }
            this._T.push(v);
        } else {
            this._S.push(v);
        }
    }

    private clear(): void {
        this._R.clear();
        this._I = 0;
        this._D.clear();
        this.repNodes.clear();
        this._S.length = 0;
        this._T.length = 0;
        this.inSCCNodes.clear();
        this.visitedNodes.clear();
    }

    /**
     * Get the rep node
     * If not found return itself
     */
    public getRepNode(n: NodeID): NodeID {
        const it = this._R.get(n);
        if (!it) {
            throw new Error('scc rep not found');
        }
        const rep = it.rep;
        return rep !== Number.MAX_SAFE_INTEGER ? rep : n;
    }

    /**
     * Start to detect and collapse SCC
     */
    public find(): void {
        this.clear();
        let nodeIt = this._G.nodesItor();
        for (let node of nodeIt) {
            const nodeId: NodeID = node.getID();
            if (!this.isVisited(nodeId) && !this._D.has(nodeId)) {
                this.visit(nodeId);
            }
        }
    }

    public getTopoAndCollapsedNodeStack(): NodeStack {
        return this._T;
    }

    public getNode2SCCInfoMap(): Node2RepSCCInfoMap {
        return this._R;
    }

    // whether the node is in a cycle
    public nodeIsInCycle(n: NodeID): boolean {
        const rep = this.getRepNode(n);
        const subNodesCount = this.getSubNodes(rep).size;
        // multi-node cycle
        if (subNodesCount > 1) {
            return true;
        }
        // self-cycle: a call a
        let repNode = this._G.getNode(rep)!;
        for (const e of repNode?.getOutgoingEdges()) {
            if (e.getDstID() === rep) {
                return true;
            }
        }
        return false;
    }

    public getMySCCNodes(n: NodeID): NodeSet {
        const rep = this.getRepNode(n);
        return this.getSubNodes(rep);
    }

    // get all subnodes in one scc
    public getSubNodes(n: NodeID): NodeSet {
        const it = this._R.get(n);
        if (!it) {
            throw new Error('sccInfo not found for a node');
        }
        let sub = it.subNodes;
        if (sub.size === 0) {
            sub.add(n);
        }

        return sub;
    }

    // get all representative nodes
    public getRepNodes(): NodeSet {
        return this.repNodes;
    }
}
