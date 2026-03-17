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

import { ArkInstanceInvokeExpr, ArkNewExpr, ArkStaticInvokeExpr } from '../../core/base/Expr';
import { Scene } from '../../Scene';
import { ArkAssignStmt, Stmt } from '../../core/base/Stmt';
import { ArkClass } from '../../core/model/ArkClass';
import { ClassSignature } from '../../core/model/ArkSignature';
import { NodeID } from '../../core/graph/BaseExplicitGraph';
import { CallGraph, CallSite, FuncID } from '../model/CallGraph';
import { AbstractAnalysis } from './AbstractAnalysis';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ClassType } from '../../core/base/Type';
import { CallGraphBuilder } from '../model/builder/CallGraphBuilder';
import { CONSTRUCTOR_NAME, THIS_NAME } from '../../core/common/TSConst';
import { Local } from '../../core/base/Local';
import { DEFAULT_ARK_CLASS_NAME, DEFAULT_ARK_METHOD_NAME } from '../../core/common/Const';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'RTA');

export class RapidTypeAnalysis extends AbstractAnalysis {
    // TODO: signature duplicated check
    private instancedClasses: Set<ClassSignature> = new Set();
    // TODO: Set duplicated check
    private ignoredCalls: Map<ClassSignature, Set<{ caller: NodeID; callee: NodeID; callStmt: Stmt }>> = new Map();
    private enableThisPrune: boolean;

    constructor(scene: Scene, cg: CallGraph, cb: CallGraphBuilder, enableThisPrune: boolean = false) {
        super(scene, cg);
        this.cgBuilder = cb;
        this.enableThisPrune = enableThisPrune;
    }

    protected init(): void {
        this.scene.getClasses().filter(c => c.getName() === DEFAULT_ARK_CLASS_NAME).forEach(c => {
            const dfltMethod = c.getMethodWithName(DEFAULT_ARK_METHOD_NAME)?.getSignature();
            if (dfltMethod) {
                const funcID = this.cg.getCallGraphNodeByMethod(dfltMethod).getID();
                this.workList.push(funcID);
            }
        });

        super.init();
    }

    public resolveCall(callerMethod: NodeID, invokeStmt: Stmt): CallSite[] {
        let invokeExpr = invokeStmt.getInvokeExpr();
        let resolveResult: CallSite[] = [];

        if (!invokeExpr) {
            return [];
        }

        // process anonymous method call
        this.getParamAnonymousMethod(invokeExpr).forEach(method => {
            resolveResult.push(
                this.cg.getCallSiteManager().newCallSite(invokeStmt, undefined, this.cg.getCallGraphNodeByMethod(method).getID(), callerMethod)
            );
        });

        let calleeMethod = this.resolveInvokeExpr(invokeExpr);
        if (!calleeMethod) {
            return resolveResult;
        }

        if (invokeExpr instanceof ArkStaticInvokeExpr) {
            // get specific method
            resolveResult.push(
                this.cg.getCallSiteManager().newCallSite(
                    invokeStmt, undefined, this.cg.getCallGraphNodeByMethod(calleeMethod.getSignature()).getID(), callerMethod
                )
            );
        } else {
            let declareClass = calleeMethod!.getDeclaringArkClass();
            const methodName = calleeMethod!.getName();

            // Aggressive heuristic: when enabled and the call is `this.foo()`,
            // only keep the implementation of `foo` in the current declaring class,
            // or the first superclass that defines it (e.g. B.m() calling this.foo() → A.foo() when B extends A).
            if (this.enableThisPrune && invokeExpr instanceof ArkInstanceInvokeExpr) {
                const base = invokeExpr.getBase();
                if (base.getName && base.getName() === THIS_NAME) {
                    let curClass: ArkClass | null = invokeStmt.getCfg().getDeclaringMethod().getDeclaringArkClass();
                    while (curClass) {
                        const methodInClass = curClass.getMethodWithName(methodName);
                        if (methodInClass && !methodInClass.isAbstract()) {
                            const callSite = this.cg.getCallSiteManager().newCallSite(invokeStmt, undefined,
                                this.cg.getCallGraphNodeByMethod(methodInClass.getSignature()).getID(), callerMethod);
                            resolveResult.push(callSite);
                            return resolveResult;
                        }
                        curClass = curClass.getSuperClass();
                    }
                }
            }

            const directCallSite = this.resolveConstructorClassFromNew(methodName, invokeStmt, callerMethod);
            if (directCallSite) {
                resolveResult.push(directCallSite);
                return resolveResult;
            }

            // Private methods cannot be overridden; only the declaring class has an implementation.
            if (calleeMethod!.isPrivate()) {
                const calleeNode = this.cg.getCallGraphNodeByMethod(calleeMethod!.getSignature());
                if (this.instancedClasses.has(declareClass.getSignature())) {
                    resolveResult.push(
                        this.cg.getCallSiteManager().newCallSite(invokeStmt, undefined, calleeNode.getID(), callerMethod)
                    );
                } else {
                    this.addIgnoredCalls(declareClass.getSignature(), callerMethod, calleeNode.getID(), invokeStmt);
                }
                return resolveResult;
            }

            // TODO: super class method should be placed at the end
            this.getClassHierarchy(declareClass).forEach((arkClass: ArkClass) => {
                let possibleCalleeMethod = arkClass.getMethodWithName(calleeMethod!.getName());

                if (
                    possibleCalleeMethod && possibleCalleeMethod.isGenerated() &&
                    arkClass.getSignature().toString() !== declareClass.getSignature().toString()
                ) {
                    // remove the generated method in extended classes
                    return;
                }

                if (!(possibleCalleeMethod && !possibleCalleeMethod.isAbstract())) {
                    return;
                }

                let calleeNode = this.cg.getCallGraphNodeByMethod(possibleCalleeMethod.getSignature());

                const isSdkClass = this.scene.hasSdkFile(arkClass.getSignature().getDeclaringFileSignature());
                const isInstanced = this.instancedClasses.has(arkClass.getSignature());
                if (isSdkClass || isInstanced) {
                    resolveResult.push(
                        this.cg.getCallSiteManager().newCallSite(invokeStmt, undefined, calleeNode.getID(), callerMethod)
                    );
                } else {
                    this.addIgnoredCalls(arkClass.getSignature(), callerMethod, calleeNode.getID(), invokeStmt);
                }
            });
        }

        return resolveResult;
    }

    private resolveConstructorClassFromNew(methodName: string, invokeStmt: Stmt, callerMethod: NodeID): CallSite | null {
        if (methodName !== CONSTRUCTOR_NAME) {
            return null;
        }

        if (!(invokeStmt instanceof ArkAssignStmt)) {
            return null;
        }

        const leftOp = invokeStmt.getLeftOp();
        if (!(leftOp instanceof Local)) {
            return null;
        }

        const declaringStmt = leftOp.getDeclaringStmt();
        if (!(declaringStmt && declaringStmt instanceof ArkAssignStmt)) {
            return null;
        }

        const rightOp = declaringStmt.getRightOp();
        if (!(rightOp instanceof ArkNewExpr)) {
            return null;
        }

        const classSig = rightOp.getClassType().getClassSignature();
        const constructorMethod = this.scene.getClass(classSig)?.getMethodWithName(CONSTRUCTOR_NAME);
        if (!constructorMethod) {
            return null;
        }
        return this.cg.getCallSiteManager().newCallSite(
            invokeStmt,
            undefined,
            this.cg.getCallGraphNodeByMethod(constructorMethod.getSignature()).getID(),
            callerMethod
        );
    }

    protected preProcessMethod(funcID: FuncID): CallSite[] {
        let newCallSites: CallSite[] = [];
        let instancedClasses: Set<ClassSignature> = this.collectInstancedClassesInMethod(funcID);
        let newlyInstancedClasses = new Set<ClassSignature>();
        for (const sig of instancedClasses) {
            if (!this.instancedClasses.has(sig)) {
                newlyInstancedClasses.add(sig);
            }
        }

        newlyInstancedClasses.forEach(sig => {
            let ignoredCalls = this.ignoredCalls.get(sig);
            if (ignoredCalls) {
                ignoredCalls.forEach(call => {
                    this.cg.addDynamicCallEdge(call.caller, call.callee, call.callStmt);
                    const newCallSite = this.cg.getCallSiteManager().newCallSite(call.callStmt, undefined, call.callee, call.caller);
                    this.cg.addStmtToCallSiteMap(call.callStmt, newCallSite);
                    this.cg.addMethodToCallSiteMap(call.callee, newCallSite);
                    newCallSites.push(newCallSite);
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
            return instancedClasses;
        }

        for (let stmt of cfg!.getStmts()) {
            let stmtExpr: ArkNewExpr | undefined;
            if(stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof ArkNewExpr) {
                stmtExpr = stmt.getRightOp() as ArkNewExpr;
            } else {
                continue;
            }

            let classSig: ClassSignature = (stmtExpr.getType() as ClassType).getClassSignature();
            if (classSig != null) {
                // TODO: need to check if different stmt has single sig
                instancedClasses.add(classSig);
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
