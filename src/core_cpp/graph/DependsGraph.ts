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

import { BaseEdge, BaseExplicitGraph, BaseNode, Kind, NodeID } from './BaseExplicitGraph';
interface Attributes {
    [name: string]: any;
}

interface NodeAttributes extends Attributes {
    name: string;
    kind: Kind;
}

interface EdgeAttributes extends Attributes {
    kind: Kind;
}

export class DependsNode<NodeAttr extends NodeAttributes> extends BaseNode {
    private attr: NodeAttr;

    public constructor(id: NodeID, attr: NodeAttr) {
        super(id, attr.kind);
        this.attr = attr;
    }

    public getNodeAttr(): NodeAttr {
        return this.attr;
    }

    public setNodeAttr(attr: NodeAttr): void {
        this.attr = attr;
    }

    public getDotLabel(): string {
        return this.attr.name;
    }
}

export class DependsEdge<NodeAttr extends NodeAttributes, EdgeAttr extends EdgeAttributes> extends BaseEdge {
    private attr: EdgeAttr;

    public constructor(s: DependsNode<NodeAttr>, d: DependsNode<NodeAttr>, attr: EdgeAttr) {
        super(s, d, attr.kind);
        this.attr = attr;
    }

    public getEdgeAttr(): EdgeAttr {
        return this.attr;
    }

    public setEdgeAttr(attr: EdgeAttr): void {
        this.attr = attr;
    }

    public getKey(): string {
        return `${this.getSrcID()}-${this.getDstID()}-${this.getKind()}`;
    }
}

export class DependsGraph<NodeAttr extends NodeAttributes, EdgeAttr extends EdgeAttributes> extends BaseExplicitGraph {
    protected depsMap: Map<string, NodeID>;
    protected edgesMap: Map<string, DependsEdge<NodeAttr, EdgeAttr>>;

    constructor() {
        super();
        this.depsMap = new Map();
        this.edgesMap = new Map();
    }

    public hasDepsNode(key: string): boolean {
        return this.depsMap.has(key);
    }

    public addDepsNode(key: string, attr: NodeAttr): DependsNode<NodeAttr> {
        if (this.depsMap.has(key)) {
            // update attr
            let node = this.getNode(this.depsMap.get(key)!) as DependsNode<NodeAttr>;
            node.setNodeAttr(attr);
            return node;
        }

        let node = new DependsNode(this.getNodeNum(), attr);
        this.depsMap.set(key, node.getID());
        this.addNode(node);
        return node;
    }

    public addEdge(src: DependsNode<NodeAttr>, dst: DependsNode<NodeAttr>, attr: EdgeAttr): DependsEdge<NodeAttr, EdgeAttr> {
        let edge = new DependsEdge(src, dst, attr);
        let key = edge.getKey();
        if (this.edgesMap.has(key)) {
            return this.edgesMap.get(key)!;
        }
        this.edgesMap.set(key, edge);
        src.addOutgoingEdge(edge);
        dst.addIncomingEdge(edge);
        return edge;
    }

    public getGraphName(): string {
        return 'DependsGraph';
    }
}
