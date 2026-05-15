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

import { Scene } from '../../Scene';
import { AbstractInvokeExpr } from '../../core/base/Expr';
import { ArkAssignStmt, ArkInvokeStmt, Stmt } from '../../core/base/Stmt';
import { FunctionType } from '../../core/base/Type';
import { ArkClass } from '../../core/model/ArkClass';
import { ArkMethod } from '../../core/model/ArkMethod';
import { ClassSignature, MethodSignature } from '../../core/model/ArkSignature';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { IntWorkList } from '../../utils/IntWorkList';
import { NodeID } from '../../core/graph/BaseExplicitGraph';
import { CallGraph, FuncID, CallSite, CallGraphNode } from '../model/CallGraph';
import { CallGraphBuilder } from '../model/builder/CallGraphBuilder';
import { createPtsCollectionCtor, IPtsCollection, PtsCollectionType } from '../pointerAnalysis/PtsDS';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'CG');

export abstract class AbstractAnalysis {
    protected scene: Scene;
    protected cg: CallGraph;
    protected cgBuilder!: CallGraphBuilder;
    protected workList: IntWorkList = new IntWorkList();
    protected processedMethod!: IPtsCollection<FuncID>;
    private classHierarchyCache: Map<ClassSignature, ArkClass[]> = new Map();
    /** Reused on cache miss to avoid per-call array / Set allocations. */
    private hierarchyWorkList: ArkClass[] = [];
    private hierarchyScratch: ArkClass[] = [];
    private hierarchyVisited: Set<ArkClass> = new Set();

    constructor(s: Scene, cg: CallGraph) {
        this.scene = s;
        this.cg = cg;
    }

    public getScene(): Scene {
        return this.scene;
    }

    public getCallGraph(): CallGraph {
        return this.cg;
    }

    protected abstract resolveCall(sourceMethod: NodeID, invokeStmt: Stmt): CallSite[];
    protected abstract preProcessMethod(funcID: FuncID): CallSite[];

    public resolveInvokeExpr(invokeExpr: AbstractInvokeExpr): ArkMethod | undefined {
        const method = this.scene.getMethod(invokeExpr.getMethodSignature());
        if (method != null) {
            return method;
        }
        return undefined;
    }

    public getClassHierarchy(arkClass: ArkClass): ArkClass[] {
        const sig = arkClass.getSignature();
        const hit = this.classHierarchyCache.get(sig);
        if (hit !== undefined) {
            return hit;
        }

        // TODO: remove abstract class
        const work = this.hierarchyWorkList;
        const out = this.hierarchyScratch;
        const seen = this.hierarchyVisited;
        work.length = 0;
        out.length = 0;
        seen.clear();

        work.push(arkClass);
        seen.add(arkClass);
        let head = 0;

        while (head < work.length) {
            const tempClass = work[head++]!;
            out.push(tempClass);
            for (const base of tempClass.getExtendedClasses().values()) {
                if (seen.has(base)) {
                    continue;
                }
                seen.add(base);
                work.push(base);
            }
        }

        const cached = out.slice();
        this.classHierarchyCache.set(sig, cached);
        return cached;
    }

    public start(displayGeneratedMethod: boolean): void {
        this.init();
        while (!this.workList.isEmpty()) {
            const method = this.workList.pop() as FuncID;
            const cgNode = this.cg.getNode(method) as CallGraphNode;

            if (this.processedMethod.contains(method) || cgNode.isSdkMethod()) {
                continue;
            }

            // pre process for RTA only
            this.preProcessMethod(method).forEach((cs: CallSite) => {
                this.workList.push(cs.calleeFuncID);
            });

            this.processMethod(method, displayGeneratedMethod, false);
        }
    }

    public projectStart(displayGeneratedMethod: boolean): void {
        this.cgBuilder.buildCGNodes(this.scene.getMethods());

        for (let n of this.cg.getNodesIter()) {
            let cgNode = n as CallGraphNode;

            if (cgNode.isSdkMethod()) {
                continue;
            }

            this.preProcessMethod(cgNode.getID());

            this.processMethod(cgNode.getID(), displayGeneratedMethod, true);
        }

        this.cgBuilder.setEntries();
    }

    protected processCallSite(method: FuncID, cs: CallSite, displayGeneratedMethod: boolean, isProject: boolean = false): void {
        let me = this.cg.getArkMethodByFuncID(cs.calleeFuncID);
        let meNode = this.cg.getNode(cs.calleeFuncID) as CallGraphNode;
        this.addCallGraphEdge(method, me, cs, displayGeneratedMethod);

        if (isProject) {
            return;
        }

        this.processedMethod.insert(cs.callerFuncID);

        if (this.processedMethod.contains(cs.calleeFuncID) || meNode.isSdkMethod()) {
            return;
        }

        if (displayGeneratedMethod || !me?.isGenerated()) {
            this.workList.push(cs.calleeFuncID);
            logger.trace(`New workList item ${cs.calleeFuncID}: ${this.cg.getArkMethodByFuncID(cs.calleeFuncID)?.getSignature().toString()}`);
        }
    }

    protected init(): void {
        this.processedMethod = new (createPtsCollectionCtor(PtsCollectionType.BitVector))();
        this.cg.getEntries().forEach(entryFunc => {
            this.workList.push(entryFunc);
        });
    }

    protected processMethod(methodID: FuncID, displayGeneratedMethod: boolean, isProject: boolean = false): void {
        let cgNode = this.cg.getNode(methodID) as CallGraphNode;
        let arkMethod = this.scene.getMethod(cgNode.getMethod(), true);

        if (!arkMethod) {
            throw new Error('can not find method');
        }

        const cfg = arkMethod.getCfg();
        if (!cfg) {
            return;
        }
        cfg.getBlocks().forEach(block => {
            block.getStmts().forEach(stmt => {
                if (!(stmt instanceof ArkInvokeStmt || (stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof AbstractInvokeExpr))) {
                    return;
                }

                this.resolveCall(cgNode.getID(), stmt).forEach(callSite => {
                    this.cg.addStmtToCallSiteMap(stmt, callSite);
                    this.cg.addMethodToCallSiteMap(callSite.calleeFuncID, callSite);
                    this.processCallSite(methodID, callSite, displayGeneratedMethod, isProject);
                });
            });
        });
    }

    protected getParamAnonymousMethod(invokeExpr: AbstractInvokeExpr): MethodSignature[] {
        let paramMethod: MethodSignature[] = [];

        invokeExpr.getArgs().forEach(args => {
            let argsType = args.getType();
            if (argsType instanceof FunctionType) {
                paramMethod.push(argsType.getMethodSignature());
            }
        });

        return paramMethod;
    }

    protected addCallGraphEdge(caller: FuncID, callee: ArkMethod | null, cs: CallSite, displayGeneratedMethod: boolean): void {
        // check if need to display generated method
        if (!callee) {
            logger.error(`FuncID has no method ${cs.calleeFuncID}`);
        } else {
            if (displayGeneratedMethod || !callee?.isGenerated()) {
                this.cg.addDynamicCallEdge(caller, cs.calleeFuncID, cs.callStmt);
            }
        }
    }
}
