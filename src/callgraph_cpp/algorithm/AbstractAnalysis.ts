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
import { Stmt } from '../../core/base/Stmt';
import { FunctionType } from '../../core/base/Type';
import { ArkClass } from '../../core/model/ArkClass';
import { ArkMethod } from '../../core/model/ArkMethod';
import { MethodSignature } from '../../core/model/ArkSignature';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { NodeID } from '../../core/graph/GraphTraits';
import { CallGraph, FuncID, CallSite, CallGraphNode } from '../model/CallGraph';
import { CallGraphBuilder } from '../model/builder/CallGraphBuilder';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'CG');

export abstract class AbstractAnalysis {
    protected scene:Scene;
    protected cg: CallGraph;
    protected cgBuilder!: CallGraphBuilder;
    protected workList: FuncID[] = [];
    protected processedMethod!: Set<FuncID>;

    constructor(s:Scene, cg: CallGraph) {
        this.scene = s;
        this.cg = cg;
    }

    public getScene():Scene {
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
        // TODO: remove abstract class
        let classWorkList: ArkClass[] = [arkClass];
        // TODO: check class with no super Class
        let classHierarchy: ArkClass[] = [];

        while (classWorkList.length > 0) {
            // TODO: no dumplicated check, TS doesn't allow multi extend
            let tempClass = classWorkList.shift()!;
            classWorkList.push(...tempClass.getExtendedClasses().values());
            classHierarchy.push(tempClass);
        }

        return classHierarchy;
    }

    public start(displayGeneratedMethod: boolean): void {
        this.init();
        while (this.workList.length !== 0) {
            const method = this.workList.shift() as FuncID;
            const cgNode = this.cg.getNode(method) as CallGraphNode;

            if (this.processedMethod.has(method) || cgNode.isSdkMethod()) {
                continue;
            }

            // pre process for RTA only
            this.preProcessMethod(method).forEach((cs: CallSite) => {
                this.workList.push(cs.calleeFuncID);
            });

            this.processMethod(method).forEach((cs: CallSite) => {
                let me = this.cg.getArkMethodByFuncID(cs.calleeFuncID);

                this.addCallGraphEdge(method, me, cs, displayGeneratedMethod);

                if (!this.processedMethod.has(cs.calleeFuncID)) {
                    this.workList.push(cs.calleeFuncID);
                    logger.info(`New workList item ${cs.calleeFuncID}: ${this.cg.getArkMethodByFuncID(cs.calleeFuncID)?.getSignature().toString()}`);
                    this.processedMethod.add(cs.callerFuncID);
                }
            });
        }
    }

    protected init(): void {
        this.processedMethod = new Set();
        this.cg.getEntries().forEach(entryFunc => {
            this.workList.push(entryFunc);
        });
    }

    protected processMethod(methodID: FuncID): CallSite[] {
        let cgNode = this.cg.getNode(methodID) as CallGraphNode;
        let arkMethod = this.scene.getMethod(cgNode.getMethod(), true);
        let calleeMethods: CallSite[] = [];

        if (!arkMethod) {
            throw new Error('can not find method');
        }

        const cfg = arkMethod.getCfg();
        if (!cfg) {
            return [];
        }
        cfg.getStmts().forEach((stmt: any) => {
            if (stmt.containsInvokeExpr()) {
                calleeMethods.push(...this.resolveCall(cgNode.getID(), stmt));
            }
        });

        return calleeMethods;
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
