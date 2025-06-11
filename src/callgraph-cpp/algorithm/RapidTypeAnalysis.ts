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

import { ArkNewExpr, ArkStaticInvokeExpr } from '../../core/base/Expr';
import { Scene } from '../../Scene';
import { Stmt } from '../../core/base/Stmt';
import { ArkClass } from '../../core/model/ArkClass';
import { ClassSignature } from '../../core/model/ArkSignature';
import { NodeID } from '../../core/graph/BaseExplicitGraph';
import { CallGraph, CallSite, FuncID } from '../model/CallGraph';
import { AbstractAnalysis } from './AbstractAnalysis';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ClassType } from '../../core/base/Type';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'RTA');

export class RapidTypeAnalysis extends AbstractAnalysis {
    // TODO: signature duplicated check
    private instancedClasses: Set<ClassSignature> = new Set();
    // TODO: Set duplicated check
    private ignoredCalls: Map<ClassSignature, Set<{ caller: NodeID; callee: NodeID; callStmt: Stmt }>> = new Map();

    constructor(scene: Scene, cg: CallGraph) {
        super(scene, cg);
    }

    public resolveCall(callerMethod: NodeID, invokeStmt: Stmt): CallSite[] {
        let invokeExpr = invokeStmt.getInvokeExpr();
        let resolveResult: CallSite[] = [];

        if (!invokeExpr) {
            return [];
        }

        // process anonymous method call
        this.getParamAnonymousMethod(invokeExpr).forEach(method => {
            resolveResult.push(new CallSite(invokeStmt, undefined, this.cg.getCallGraphNodeByMethod(method).getID(), callerMethod));
        });

        let calleeMethod = this.resolveInvokeExpr(invokeExpr);
        if (!calleeMethod) {
            return resolveResult;
        }

        if (invokeExpr instanceof ArkStaticInvokeExpr) {
            // get specific method
            resolveResult.push(new CallSite(invokeStmt, undefined, this.cg.getCallGraphNodeByMethod(calleeMethod.getSignature()).getID(), callerMethod));
        } else {
            let declareClass = calleeMethod!.getDeclaringArkClass();
            // TODO: super class method should be placed at the end
            this.getClassHierarchy(declareClass).forEach((arkClass: ArkClass) => {
                if (arkClass.isAbstract()) {
                    return;
                }

                let possibleCalleeMethod = arkClass.getMethodWithName(calleeMethod!.getName());

                if (
                    possibleCalleeMethod &&
                    possibleCalleeMethod.isGenerated() &&
                    arkClass.getSignature().toString() !== declareClass.getSignature().toString()
                ) {
                    // remove the generated method in extended classes
                    return;
                }

                if (!(possibleCalleeMethod && !possibleCalleeMethod.isAbstract())) {
                    return;
                }

                if (!this.instancedClasses.has(arkClass.getSignature())) {
                    this.addIgnoredCalls(
                        arkClass.getSignature(),
                        callerMethod,
                        this.cg.getCallGraphNodeByMethod(possibleCalleeMethod.getSignature()).getID(),
                        invokeStmt
                    );
                } else {
                    resolveResult.push(
                        new CallSite(invokeStmt, undefined, this.cg.getCallGraphNodeByMethod(possibleCalleeMethod.getSignature()).getID(), callerMethod)
                    );
                }
            });
        }

        return resolveResult;
    }

    protected preProcessMethod(funcID: FuncID): CallSite[] {
        let newCallSites: CallSite[] = [];
        let instancedClasses: Set<ClassSignature> = this.collectInstancedClassesInMethod(funcID);
        let newlyInstancedClasses = new Set(Array.from(instancedClasses).filter(item => !this.instancedClasses.has(item)));

        newlyInstancedClasses.forEach(sig => {
            let ignoredCalls = this.ignoredCalls.get(sig);
            if (ignoredCalls) {
                ignoredCalls.forEach(call => {
                    this.cg.addDynamicCallEdge(call.caller, call.callee, call.callStmt);
                    newCallSites.push(new CallSite(call.callStmt, undefined, call.callee, call.caller));
                });
            }
            this.instancedClasses.add(sig);
            this.ignoredCalls.delete(sig);
        });
        return newCallSites;
    }

    private collectInstancedClassesInMethod(funcID: FuncID): Set<ClassSignature> {
        let instancedClasses: Set<ClassSignature> = new Set();
        let arkMethod = this.cg.getArkMethodByFuncID(funcID);

        if (!arkMethod) {
            logger.error(`can not find arkMethod by funcID`);
            return instancedClasses;
        }

        let cfg = arkMethod!.getCfg();
        if (!cfg) {
            logger.error(`arkMethod ${arkMethod.getSignature().toString()} has no cfg`);
            return instancedClasses;
        }

        for (let stmt of cfg!.getStmts()) {
            let stmtExpr = stmt.getExprs()[0];
            if (stmtExpr instanceof ArkNewExpr) {
                let classSig: ClassSignature = (stmtExpr.getType() as ClassType).getClassSignature();
                if (classSig != null) {
                    // TODO: need to check if different stmt has single sig
                    instancedClasses.add(classSig);
                }
            }
        }
        return instancedClasses;
    }

    public addIgnoredCalls(arkClass: ClassSignature, callerID: FuncID, calleeID: FuncID, invokeStmt: Stmt): void {
        let classMap = this.ignoredCalls.get(arkClass) ?? new Set();
        classMap.add({ caller: callerID, callee: calleeID, callStmt: invokeStmt });
        this.ignoredCalls.set(arkClass, classMap);
    }
}
