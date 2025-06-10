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

import { Kind, NodeID, GraphTraits } from './GraphTraits';

export { Kind, NodeID };
export abstract class BaseEdge {
    private src: BaseNode;
    private dst: BaseNode;
    protected kind: Kind;

    constructor(s: BaseNode, d: BaseNode, k: Kind) {
        this.src = s;
        this.dst = d;
        this.kind = k;
    }

    public getSrcID(): NodeID {
        return this.src.getID();
    }

    public getDstID(): NodeID {
        return this.dst.getID();
    }

    public getSrcNode(): BaseNode {
        return this.src;
    }

    public getDstNode(): BaseNode {
        return this.dst;
    }

    public getKind(): Kind {
        return this.kind;
    }

    public setKind(kind: Kind): void {
        this.kind = kind;
    }

    public getEndPoints(): { src: NodeID; dst: NodeID } {
        return {
            src: this.src.getID(),
            dst: this.dst.getID(),
        };
    }

    public getDotAttr(): string {
        return 'color=black';
    }
}

export abstract class BaseNode {
    private id: NodeID;
    protected kind: Kind;
    private inEdges: Set<BaseEdge> = new Set();
    private outEdges: Set<BaseEdge> = new Set();

    constructor(id: NodeID, k: Kind) {
        this.id = id;
        this.kind = k;
    }

    public getID(): NodeID {
        return this.id;
    }

    public getKind(): Kind {
        return this.kind;
    }

    public setKind(kind: Kind): void {
        this.kind = kind;
    }

    public hasIncomingEdges(): boolean {
        return this.inEdges.size !== 0;
    }

    public hasOutgoingEdges(): boolean {
        return this.outEdges.size === 0;
    }

    public hasIncomingEdge(e: BaseEdge): boolean {
        return this.inEdges.has(e);
    }

    public hasOutgoingEdge(e: BaseEdge): boolean {
        return this.outEdges.has(e);
    }

    public addIncomingEdge(e: BaseEdge): void {
        this.inEdges.add(e);
    }

    public addOutgoingEdge(e: BaseEdge): void {
        this.outEdges.add(e);
    }

    public removeIncomingEdge(e: BaseEdge): boolean {
        return this.inEdges.delete(e);
    }

    public removeOutgoingEdge(e: BaseEdge): boolean {
        return this.outEdges.delete(e);
    }

    public getIncomingEdge(): Set<BaseEdge> {
        return this.inEdges;
    }

    public getOutgoingEdges(): Set<BaseEdge> {
        return this.outEdges;
    }

    public getDotAttr(): string {
        return 'shape=box';
    }

    public abstract getDotLabel(): string;
}

export abstract class BaseExplicitGraph implements GraphTraits<BaseNode> {
    protected edgeNum: number = 0;
    protected nodeNum: number = 0;
    protected idToNodeMap: Map<NodeID, BaseNode>;
    protected edgeMarkSet: Set<string>;

    constructor() {
        this.idToNodeMap = new Map();
        this.edgeMarkSet = new Set();
    }

    public getNodeNum(): number {
        return this.nodeNum;
    }

    public nodesItor(): IterableIterator<BaseNode> {
        return this.idToNodeMap.values();
    }

    public addNode(n: BaseNode): void {
        this.idToNodeMap.set(n.getID(), n);
        this.nodeNum++;
    }

    public getNode(id: NodeID): BaseNode | undefined {
        if (!this.idToNodeMap.has(id)) {
            throw new Error(`Can find Node # ${id}`);
        }

        return this.idToNodeMap.get(id);
    }

    public hasNode(id: NodeID): boolean {
        return this.idToNodeMap.has(id);
    }

    public removeNode(id: NodeID): boolean {
        if (this.idToNodeMap.delete(id)) {
            this.nodeNum--;
            return true;
        }
        return false;
    }

    public hasEdge(src: BaseNode, dst: BaseNode): boolean {
        for (let e of src.getOutgoingEdges()) {
            if (e.getDstNode() === dst) {
                return true;
            }
        }

        return false;
    }

    public ifEdgeExisting(edge: BaseEdge): boolean {
        let edgeMark: string = `${edge.getSrcID()}-${edge.getDstID()}:${edge.getKind()}`;
        if (this.edgeMarkSet.has(edgeMark)) {
            return true;
        }

        this.edgeMarkSet.add(edgeMark);
        return false;
    }

    public getNodesIter(): IterableIterator<BaseNode> {
        return this.idToNodeMap.values();
    }

    public abstract getGraphName(): string;
}
