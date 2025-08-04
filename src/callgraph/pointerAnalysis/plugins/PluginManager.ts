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

import { CallGraph, CallGraphNode, FuncID } from '../../model/CallGraph';
import { ICallSite } from '../../model/CallSite';
import { Pag } from '../Pag';
import { PagBuilder } from '../PagBuilder';
import { IPagPlugin } from './IPagPlugin';
import { NodeID } from '../../../core/graph/GraphTraits';
import { ContainerPlugin } from './ContainerPlugin';
import { FunctionPlugin } from './FunctionPlugin';
import { SdkPlugin } from './SdkPlugin';
import { StoragePlugin } from './StoragePlugin';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { Value } from '../../../core/base/Value';

// plugins/PluginManager.ts
export class PluginManager {
    private plugins: IPagPlugin[] = [];

    constructor(pag: Pag, pagBuilder: PagBuilder, cg: CallGraph) {
        this.init(pag, pagBuilder, cg);
    }

    private init(pag: Pag, pagBuilder: PagBuilder, cg: CallGraph): void {
        this.registerPlugin(new StoragePlugin(pag, pagBuilder, cg));
        this.registerPlugin(new FunctionPlugin(pag, pagBuilder, cg));
        this.registerPlugin(new SdkPlugin(pag, pagBuilder, cg));
        this.registerPlugin(new ContainerPlugin(pag, pagBuilder, cg));
    }

    public registerPlugin(plugin: IPagPlugin): void {
        this.plugins.push(plugin);
    }

    public findPlugin(cs: ICallSite, cgNode: CallGraphNode): IPagPlugin | undefined {
        return this.plugins.find(plugin => plugin.canHandle(cs, cgNode));
    }

    public getAllPlugins(): IPagPlugin[] {
        return this.plugins;
    }

    public processCallSite(cs: ICallSite, cid: number, basePTNode: NodeID, cg: CallGraph): { handled: boolean, srcNodes: NodeID[] } {
        const cgNode = cg.getNode(cs.getCalleeFuncID()!) as CallGraphNode;
        const plugin = this.findPlugin(cs, cgNode);
        let srcNodes: NodeID[] = [];

        if (plugin) {
            srcNodes.push(...plugin.processCallSite(cs, cid, basePTNode));
            return { handled: true, srcNodes: srcNodes };
        }

        return { handled: false, srcNodes: srcNodes };
    }

    // sdk plugin interfaces
    public processSDKFuncPag(funcID: FuncID, method: ArkMethod): { handled: boolean } {
        const plugin: SdkPlugin = this.plugins.find(p => p.getName() === 'SdkPlugin') as SdkPlugin;
        if (plugin) {
            plugin.buildSDKFuncPag(funcID, method);
            return { handled: true };
        }

        return { handled: false };
    }

    public getSDKParamValue(method: ArkMethod): Value[] | undefined {
        return (this.plugins.find(p => p.getName() === 'SdkPlugin') as SdkPlugin).getParamValues(method);
    }
}