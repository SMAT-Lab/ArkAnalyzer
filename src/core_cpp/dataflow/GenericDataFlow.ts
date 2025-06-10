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

/**
 * Generic Data Flow Analysis Framework
 *
 * This module provides a generic framework for implementing data flow analyses,
 * such as Reaching Definitions, Live Variables, and Available Expressions.
 * The framework is designed to be flexible and extensible, allowing users to
 * define custom flow graphs, transfer functions, and meet operations.
 *
 * Design Notes:
 * - The framework is designed to be generic and reusable, allowing users to
 *   implement custom data flow analyses by defining appropriate transfer functions
 *   and meet operations.
 * - The solver uses a worklist algorithm to efficiently compute the MFP solution.
 * - The analysis can be configured as either forward or backward, depending on
 *   the problem requirements.
 *
 */

/**
 * Represents a flow graph for data flow analysis.
 * Provides access to nodes in post-order and reverse post-order, as well as
 * methods to retrieve successors and predecessors of a given node.
 *
 * @template T - The type of nodes in the graph (e.g., node IDs or node objects).
 */
export interface FlowGraph<T> {
    // Nodes in reverse post-order, which is useful for backward data flow analysis.
    nodesInReversePostOrder?: T[];
    // Nodes in post-order, which is useful for forward data flow analysis.
    nodesInPostOrder: T[];
    // Get precessors of Node t.
    pred(t: T): T[];
    // Get successors of Node t.
    succ(t: T): T[];
}

/**
 * DS (Data Set) is an interface that defines the basic operations for a data set.
 * It requires the data set to be iterable, comparable, and countable.
 */
interface DS {
    /**
     * Returns an iterator that allows iterating over the elements of the data set.
     * @returns An iterable iterator over the elements of the data set.
     */
    [Symbol.iterator](): IterableIterator<any>;

    /**
     * Checks whether the current data set is equal to another data set.
     */
    equals(d: DS): boolean;

    /**
     * Counts the number of elements in the data set.
     */
    count(): number;
}

/**
 * Represents the transfer function used in data flow analysis.
 * The transfer function computes the output value (out set) of a node
 * based on its input value (in set) and the node's properties.
 *
 * @template Node - The type of nodes in the graph.
 * @template V - The type of data flow values (e.g., sets, bit vectors).
 */
export interface TransferFunction<Node, V> {
    /**
     * Computes the output value for a node based on its input value.
     *
     * @param n - The node for which the output value is computed.
     * @param x - The input value (in set) for the node.
     * @returns The output value (out set) for the node.
     */
    apply(n: Node, x: V): V;
}

/**
 * Represents a data flow problem, encapsulating all the necessary components
 * for performing data flow analysis, such as the flow graph, transfer function,
 * meet operation, and initialization configuration.
 *
 * @template Node - The type of nodes in the graph.
 * @template V - The type of data flow values.
 */
export interface DataFlowProblem<Node, V> {
    /**
     * The flow graph for the data flow analysis.
     */
    flowGraph: FlowGraph<Node>;
    /**
     * The transfer function used to compute out sets from in sets.
     */
    transferFunction: TransferFunction<Node, V>;
    /**
     * The meet operation used to combine values from multiple paths (e.g., union or intersection).
     */
    meet: (a: V, b: V) => V;
    /**
     * The initialization configuration for in and out sets.
     */
    initIn: Map<Node, V>;
    initOut: Map<Node, V>;
    /**
     * Indicates whether the analysis is forward (true) or backward (false).
     */
    forward: boolean;
    /**
     * The empty value used to initialize in and out sets (e.g., an empty set).
     */
    empty: V;
}

/**
 * Represents the result of a data flow analysis.
 * Contains the in and out sets for each node, as well as the corresponding data flow problem.
 *
 * @template Node - The type of nodes in the graph.
 * @template V - The type of data flow values.
 */
export class Solution<Node, V> {
    in: Map<Node, V>;
    out: Map<Node, V>;
    problem: DataFlowProblem<Node, V>;

    constructor(i: Map<Node, V>, out: Map<Node, V>, problem: DataFlowProblem<Node, V>) {
        this.in = i;
        this.out = out;
        this.problem = problem;
    }
}

/**
 * A solver for data flow analysis problems.
 * Implements forward and backward data flow analysis using a worklist algorithm.
 * The solver computes the Maximum Fixed Point (MFP) solution, which is a safe
 * over-approximation of the ideal Meet-Over-All-Paths (MOP) solution.
 */
export class MFPDataFlowSolver {
    /**
     * Computes the MFP solution for a forward data flow analysis problem.
     *
     * @template Node - The type of nodes in the graph.
     * @template V - The type of data flow values.
     * @param problem - The data flow problem to solve.
     * @returns The solution containing the in and out sets for all nodes.
     */
    calculateMopSolutionForwards<Node, V extends DS>(problem: DataFlowProblem<Node, V>): Solution<Node, V> {
        let _out: Map<Node, V> = problem.initOut;
        let _in: Map<Node, V> = problem.initIn;
        let workList: Node[] = problem.flowGraph.nodesInPostOrder;
        let newEntries: Set<Node> = new Set();

        while (workList.length > 0) {
            newEntries.clear();
            workList.forEach(n => {
                let inSet: V | undefined;
                const predecessors = problem.flowGraph.pred(n);
                if (predecessors && predecessors.length > 0) {
                    const predecessorOuts = predecessors.map(pred => _out.get(pred));
                    inSet = predecessorOuts.reduce((acc, cur) => problem.meet(acc!, cur!), problem.empty);
                } else {
                    inSet = problem.empty;
                }

                _in.set(n, inSet!);
                let old: V | undefined = _out.get(n);
                let newSet: V = problem.transferFunction.apply(n, inSet!);

                if (!old || old.count() === 0 || !old.equals(newSet)) {
                    _out.set(n, newSet);
                    problem.flowGraph.succ(n).forEach(succ => newEntries.add(succ));
                }
            });

            workList = [...newEntries];
        }

        return new Solution(_in, _out, problem);
    }

    /**
     * Computes the MFP solution for a backward data flow analysis problem.
     *
     * @template Node - The type of nodes in the graph.
     * @template V - The type of data flow values.
     * @param problem - The data flow problem to solve.
     * @returns The solution containing the in and out sets for all nodes.
     */
    calculateMopSolutionBackwards<Node, T extends DS>(problem: DataFlowProblem<Node, T>): Solution<Node, T> {
        let _out: Map<Node, T> = problem.initOut;
        let _in: Map<Node, T> = problem.initIn;
        let workList: Node[] = problem.flowGraph.nodesInPostOrder;
        let newEntries: Set<Node> = new Set();

        while (workList.length > 0) {
            newEntries.clear();
            workList.forEach(n => {
                let outSet: T = problem.flowGraph.succ(n).reduce((acc, curr) => {
                    return problem.meet(acc, _in.get(curr)!);
                }, problem.empty);

                _out.set(n, outSet);
                let old: T | undefined = _in.get(n);
                let newSet: T = problem.transferFunction.apply(n, outSet);
                if (!old || !old.equals(newSet)) {
                    _in.set(n, newSet);
                    problem.flowGraph.pred(n).forEach(pred => newEntries.add(pred));
                }
            });

            workList = [...newEntries];
        }

        return new Solution(_in, _out, problem);
    }
}
