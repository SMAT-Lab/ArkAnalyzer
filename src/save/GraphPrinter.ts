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

import { BaseEdge, BaseNode, NodeID } from '../core/graph/BaseExplicitGraph';
import { GraphTraits } from '../core/graph/GraphTraits';
import { Printer } from './Printer';

function escapeStr(input: string): string {
    let str = input;
    for (let i = 0; i < str.length; ++i) {
        switch (str[i]) {
            case '\n':
                str = str.substring(0, i) + '\\n' + str.substring(i + 1);
                ++i;
                break;
            case '\t':
                str = str.substring(0, i) + '  ' + str.substring(i + 1);
                ++i;
                break;
            case '\\':
                if (i + 1 < str.length) {
                    switch (str[i + 1]) {
                        case 'l':
                            continue; // don't disturb \l
                        case '|':
                        case '{':
                        case '}':
                            str = str.substring(0, i) + str.substring(i + 1);
                            continue;
                        default:
                            break;
                    }
                }
                str = str.substring(0, i) + '\\\\' + str.substring(i + 1);
                ++i;
                break;
            case '{':
            case '}':
            case '<':
            case '>':
            case '|':
            case '"':
                str = str.substring(0, i) + '\\' + str[i] + str.substring(i + 1);
                ++i;
                break;
            default:
        }
    }
    return str;
}

export class GraphPrinter<GraphType extends GraphTraits<BaseNode>> extends Printer {
    graph: GraphType;
    title!: string;
    startID: NodeID | undefined = undefined;

    constructor(g: GraphType, t?: string) {
        super();
        this.graph = g;
        if (t) {
            this.title = t;
        }
    }

    public setStartID(n: NodeID): void {
        this.startID = n;
    }

    public dump(): string {
        this.printer.clear();
        this.writeGraph();
        return this.printer.toString();
    }

    public writeGraph(): void {
        this.writeHeader();
        this.writeNodes();
        this.writeFooter();
    }

    public writeNodes(): void {
        let itor: IterableIterator<BaseNode> = this.graph.nodesItor();
        if (this.startID) {
            // from start id
            let nodes = new Set<BaseNode>();
            let startNode = this.graph.getNode(this.startID)!;
            let worklist = [startNode];
            while (worklist.length > 0) {
                let n = worklist.shift()!;
                if (nodes.has(n)) {
                    continue;
                }
                nodes.add(n);
                n.getOutgoingEdges()?.forEach(e => worklist.push(e.getDstNode()));
            }
            itor = nodes.values();
        }

        for (let node of itor) {
            let nodeAttr = node.getDotAttr();
            if (nodeAttr === '') {
                continue;
            }
            let nodeLabel = escapeStr(node.getDotLabel());

            this.printer.writeLine(`\tNode${node.getID()} [shape=recode,${nodeAttr},label="${nodeLabel}"];`);

            for (let edge of node.getOutgoingEdges() ?? []) {
                this.writeEdge(edge);
            }
        }
    }

    public writeEdge(edge: BaseEdge): void {
        let edgeAttr = edge.getDotAttr();
        if (edgeAttr === '') {
            return;
        }
        this.printer.writeLine(`\tNode${edge.getSrcID()} -> Node${edge.getDstID()}[${edgeAttr}]`);
    }

    public writeHeader(): void {
        const GraphName = this.graph.getGraphName();

        let graphNameStr = `digraph "${escapeStr(this.title || GraphName || 'unnamed')}" {\n`;
        this.printer.writeLine(graphNameStr);

        let labelStr = `\tlabel="${escapeStr(this.title || GraphName)}";\n`;
        this.printer.writeLine(labelStr);

        // TODO: need graph attr?
    }

    public writeFooter(): void {
        this.printer.writeLine('}\n');
    }
}
