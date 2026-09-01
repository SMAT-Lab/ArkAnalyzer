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

import { ArkInstanceInvokeExpr, ArkStaticInvokeExpr } from '../../core/base/Expr';
import { Scene } from '../../Scene';
import { Stmt } from '../../core/base/Stmt';
import { ArkClass } from '../../core/model/ArkClass';
import { NodeID } from '../../core/graph/BaseExplicitGraph';
import { CallGraph, CallSite } from '../model/CallGraph';
import { AbstractAnalysis } from './AbstractAnalysis';
import { CallGraphBuilder } from '../model/builder/CallGraphBuilder';
import { ClassSignature } from '../../core/model/ArkSignature';
import { CONSTRUCTOR_NAME } from '../../core/common/TSConst';

export class ClassHierarchyAnalysis extends AbstractAnalysis {
    constructor(scene: Scene, cg: CallGraph, cb: CallGraphBuilder) {
        super(scene, cg);
        this.cgBuilder = cb;
    }

    public resolveCall(callerMethod: NodeID, invokeStmt: Stmt): CallSite[] {
        let invokeExpr = invokeStmt.getInvokeExpr();
        if (!invokeExpr) {
            return [];
        }

        const stmtDeclareClass: ClassSignature = invokeStmt.getCfg().getDeclaringMethod().getDeclaringArkClass().getSignature();
        let resolveResult: CallSite[] = [];

        // process anonymous method call
        this.getParamAnonymousMethod(invokeExpr).forEach(method => {
            const nodeID = this.cg.getCallGraphNodeByMethod(method).getID();
            resolveResult.push(this.newRecordedCallSite(invokeStmt, nodeID, callerMethod));
        });

        let calleeMethod = this.resolveInvokeExpr(invokeExpr);
        if (!calleeMethod) {
            return resolveResult;
        }

        let declareClass = calleeMethod.getDeclaringArkClass();
        if (invokeExpr instanceof ArkStaticInvokeExpr || 
            calleeMethod.isPrivate() ||
            calleeMethod.getName() === CONSTRUCTOR_NAME ||
            this.checkSuperInvoke(invokeStmt, declareClass, stmtDeclareClass)) {
            // get specific method
            const nodeID = this.cg.getCallGraphNodeByMethod(calleeMethod!.getSignature()).getID();
            resolveResult.push(this.newRecordedCallSite(invokeStmt, nodeID, callerMethod));
        } else {
            const classHierarchy = this.getClassHierarchy(declareClass);
            const calleeMethodName = calleeMethod.getName();
            const declareClassSignature = declareClass.getSignature();

            for (const arkClass of classHierarchy) {
                let possibleCalleeMethod = arkClass.getMethodWithName(calleeMethodName);

                if (
                    possibleCalleeMethod &&
                    possibleCalleeMethod.isGenerated() &&
                    arkClass.getSignature() !== declareClassSignature
                ) {
                    // remove the generated method in extended classes
                    continue;
                }

                if (possibleCalleeMethod && !possibleCalleeMethod.isAbstract()) {
                    const nodeID = this.cg.getCallGraphNodeByMethod(possibleCalleeMethod.getSignature()).getID();
                    resolveResult.push(this.newRecordedCallSite(invokeStmt, nodeID, callerMethod));
                }
            }
        }

        return resolveResult;
    }

    private newRecordedCallSite(invokeStmt: Stmt, calleeFuncID: NodeID, callerMethod: NodeID): CallSite {
        const cs = this.cg.getCallSiteManager().newCallSite(invokeStmt, undefined, calleeFuncID, callerMethod);
        this.cg.recordCallSite(invokeStmt, cs);
        return cs;
    }

    protected preProcessMethod(): CallSite[] {
        // do nothing
        return [];
    }

    private checkSuperInvoke(invokeStmt: Stmt, declareClass: ArkClass, stmtDeclareClass: ClassSignature): boolean {
        const invokeExpr = invokeStmt.getInvokeExpr();
        if (invokeExpr instanceof ArkInstanceInvokeExpr) {
            const baseLocalName = invokeExpr.getBase().getName();
            if (baseLocalName === 'this' && declareClass.getSignature() !== stmtDeclareClass) {
                return true;
            }
        }
        return false;
    }
}