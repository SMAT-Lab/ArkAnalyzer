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

import { CallGraph, CallGraphNode, CallGraphNodeKind, Method } from '../CallGraph';
import { Scene } from '../../../Scene';
import { AbstractInvokeExpr, ArkInstanceInvokeExpr, ArkStaticInvokeExpr } from '../../../core/base/Expr';
import { NodeID } from '../../../core/graph/BaseExplicitGraph';
import { ClassHierarchyAnalysis } from '../../algorithm/ClassHierarchyAnalysis';
import { RapidTypeAnalysis } from '../../algorithm/RapidTypeAnalysis';
import { ArkMethod } from '../../../core/model/ArkMethod';

export class CallGraphBuilder {
    private cg: CallGraph;
    private scene: Scene;

    constructor(c: CallGraph, s: Scene) {
        this.cg = c;
        this.scene = s;
    }

    public buildDirectCallGraphForScene(): void {
        const methods = this.scene.getMethods();
        this.buildDirectCallGraph(methods);

        // set entries at end
        this.setEntries();
    }

    /*
     * Create CG Node for ArkMethods
     */
    public buildCGNodes(methods: ArkMethod[]): void {
        for (const method of methods) {
            let m = method.getSignature();
            let kind = CallGraphNodeKind.real;
            if (method.isGenerated()) {
                kind = CallGraphNodeKind.intrinsic;
            } else if (method.getBody() === undefined || method.getCfg() === undefined) {
                kind = CallGraphNodeKind.blank;
            } else if (method.getName() === 'constructor') {
                kind = CallGraphNodeKind.constructor;
            }

            this.cg.addCallGraphNode(m, kind);
        }
    }

    public buildDirectCallGraph(methods: ArkMethod[]): void {
        this.buildCGNodes(methods);

        for (const method of methods) {
            let cfg = method.getCfg();
            if (cfg === undefined) {
                // abstract method cfg is undefined
                continue;
            }
            let stmts = cfg.getStmts();
            for (const stmt of stmts) {
                let invokeExpr = stmt.getInvokeExpr();
                if (invokeExpr === undefined) {
                    continue;
                }

                let callee: Method | undefined = this.getDCCallee(invokeExpr);
                // abstract method will also be added into direct cg
                if (callee && invokeExpr instanceof ArkStaticInvokeExpr) {
                    this.cg.addDirectOrSpecialCallEdge(method.getSignature(), callee, stmt);
                } else if (
                    callee && invokeExpr instanceof ArkInstanceInvokeExpr &&
                    (this.isConstructor(callee) || this.scene.getMethod(callee)?.isGenerated())
                ) {
                    this.cg.addDirectOrSpecialCallEdge(method.getSignature(), callee, stmt, false);
                } else {
                    this.cg.addDynamicCallInfo(stmt, method.getSignature(), callee);
                }
            }
        }
    }

    public buildClassHierarchyCallGraph(entries: Method[], displayGeneratedMethod: boolean = false): void {
        let cgEntries: NodeID[] = [];
        entries.forEach((entry: Method) => {
            cgEntries.push(this.cg.getCallGraphNodeByMethod(entry).getID());
        });
        this.cg.setEntries(cgEntries);

        let classHierarchyAnalysis: ClassHierarchyAnalysis = new ClassHierarchyAnalysis(this.scene, this.cg, this);
        classHierarchyAnalysis.start(displayGeneratedMethod);
    }

    public buildCHA4WholeProject(displayGeneratedMethod: boolean = false): void {
        let classHierarchyAnalysis: ClassHierarchyAnalysis = new ClassHierarchyAnalysis(this.scene, this.cg, this);
        classHierarchyAnalysis.projectStart(displayGeneratedMethod);
    }

    public buildRapidTypeCallGraph(entries: Method[], displayGeneratedMethod: boolean = false): void {
        let cgEntries: NodeID[] = [];
        entries.forEach((entry: Method) => {
            cgEntries.push(this.cg.getCallGraphNodeByMethod(entry).getID());
        });
        this.cg.setEntries(cgEntries);

        let rapidTypeAnalysis: RapidTypeAnalysis = new RapidTypeAnalysis(this.scene, this.cg);
        rapidTypeAnalysis.start(displayGeneratedMethod);
    }

    /// Get direct call callee
    private getDCCallee(invokeExpr: AbstractInvokeExpr): Method | undefined {
        return invokeExpr.getMethodSignature();
    }

    private isConstructor(m: Method): boolean {
        return m.getMethodSubSignature().getMethodName() === 'constructor';
    }

    public setEntries(): void {
        let nodesIter = this.cg.getNodesIter();
        let entries = Array.from(nodesIter)
            .filter(node => !node.hasIncomingEdges() && node.getKind() === CallGraphNodeKind.real && !(node as CallGraphNode).isBlankMethod)
            .map(node => node.getID());
        this.cg.setEntries(entries);
    }
}
