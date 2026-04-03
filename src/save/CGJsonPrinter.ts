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

import { Printer } from './Printer';
import { CallGraph, CallGraphNode } from '../callgraph/model/CallGraph';
import { Method } from '../callgraph/model/CallGraph';

export class CallGraphJsonPrinter extends Printer {
    constructor(private callGraph: CallGraph) {
        super();
    }

    public dump(): string {
        const callMap: { [caller: string]: string[] } = {};

        this.callGraph.getCallPairEdges().forEach(edge => {
            const callerMethod: Method = (edge.getSrcNode() as CallGraphNode).getMethod();
            const calleeMethod: Method = (edge.getDstNode() as CallGraphNode).getMethod();

            const callerKey = callerMethod.toString();
            const calleeValue = calleeMethod.toString();

            if (!callMap[callerKey]) {
                callMap[callerKey] = [];
            }
            if (!callMap[callerKey].includes(calleeValue)) {
                callMap[callerKey].push(calleeValue);
            }
        });

        return JSON.stringify(callMap, null, 2);
    }
}