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
import { NodeID, GraphTraits } from './GraphTraits';

export { NodeID };

/**
 * BaseImplicitGraph is an abstract class that represents an implicit graph.
 * An implicit graph is a graph representation where node and edge information is implicitly stored using maps.
 * This class implements the GraphTraits<Node> interface and provides basic graph operations.
 */
export abstract class BaseImplicitGraph<Node> implements GraphTraits<Node> {
    /**
     * idToNodeMap is an optional map that maps node IDs (NodeID) to node objects (Node).
     * If not initialized, calling related methods will throw an error.
     */
    protected idToNodeMap?: Map<NodeID, Node>;

    /**
     * nodeToIdMap is a map that maps node objects (Node) to node IDs (NodeID).
     * This map must be initialized in the subclass.
     */
    protected nodeToIdMap!: Map<Node, NodeID>;

    /**
     * succMap is a map that stores the successors of each node.
     * The key is a node ID (NodeID), and the value is an array of successor node IDs.
     */
    succMap!: Map<NodeID, NodeID[]>;

    /**
     * predMap is a map that stores the predecessors of each node.
     * The key is a node ID (NodeID), and the value is an array of predecessor node IDs.
     */
    predMap!: Map<NodeID, NodeID[]>;

    constructor() {}

    /**
     * Gets the number of nodes in the graph.
     * @returns The number of nodes in the graph.
     */
    public getNodeNum(): number {
        return this.nodeToIdMap.size;
    }

    /**
     * Returns an iterator for all nodes in the graph.
     * @returns An iterator for traversing all nodes in the graph.
     */
    public nodesItor(): IterableIterator<Node> {
        return this.nodeToIdMap.keys();
    }

    /**
     * Gets the node object corresponding to a given node ID.
     * @param id The node ID.
     * @returns The corresponding node object.
     * @throws Throws an error if idToNodeMap is not initialized or if the node is not found.
     */
    public getNode(id: NodeID): Node {
        if (!this.idToNodeMap) {
            throw new Error(`initialize this.idToNodeMap first`);
        }

        if (!this.idToNodeMap.has(id)) {
            throw new Error(`Can find Node # ${id}`);
        }

        return this.idToNodeMap.get(id)!;
    }

    public getNodeID(s: Node): NodeID {
        if (!this.nodeToIdMap.has(s)) {
            throw new Error(`Can find Node # ${s}`);
        }

        return this.nodeToIdMap.get(s)!;
    }

    /**
     * Checks whether the graph contains a specific node ID.
     * @param id The node ID.
     * @returns Returns true if the node ID exists in the graph; otherwise, returns false.
     * @throws Throws an error if idToNodeMap is not initialized.
     */
    public hasNode(id: NodeID): boolean {
        if (!this.idToNodeMap) {
            throw new Error(`initialize this.idToNodeMap first`);
        }

        return this.idToNodeMap.has(id);
    }

    /**
     * Gets the list of successor node IDs for a given node.
     * @param id The node ID.
     * @returns An array of successor node IDs. Returns an empty array if no successors are found.
     */
    public succ(id: NodeID): NodeID[] {
        return this.succMap.get(id) ?? [];
    }

    /**
     * Gets the list of predecessor node IDs for a given node.
     * @param id The node ID.
     * @returns An array of predecessor node IDs. Returns an empty array if no predecessors are found.
     */
    public pred(id: NodeID): NodeID[] {
        return this.predMap.get(id) ?? [];
    }

    /**
     * Gets the nodeToIdMap, which maps node objects to node IDs.
     * @returns The nodeToIdMap.
     */
    public getNodeToIdMap(): Map<Node, NodeID> {
        return this.nodeToIdMap;
    }

    /**
     * Abstract method to get the name of the graph.
     * Subclasses must implement this method.
     * @returns The name of the graph.
     */
    public abstract getGraphName(): string;
}
