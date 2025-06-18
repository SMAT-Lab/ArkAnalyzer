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

import { ArkStaticInvokeExpr } from '../../core/base/Expr';
import { Scene } from '../../Scene';
import { Stmt } from '../../core/base/Stmt';
import { ArkClass } from '../../core/model/ArkClass';
import { NodeID } from '../../core/graph/GraphTraits';
import { CallGraph, CallSite } from '../model/CallGraph';
import { AbstractAnalysis } from './AbstractAnalysis';
import { CallGraphBuilder } from '../model/builder/CallGraphBuilder';

export class ClassHierarchyAnalysis extends AbstractAnalysis {
    constructor(scene:Scene, cg: CallGraph, cb: CallGraphBuilder) {
        super(scene, cg);
        this.cgBuilder = cb;
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
            resolveResult.push(new CallSite(invokeStmt, undefined, this.cg.getCallGraphNodeByMethod(calleeMethod!.getSignature()).getID(), callerMethod!));
        } else {
            let declareClass = calleeMethod.getDeclaringArkClass();
            // TODO: super class method should be placed at the end
            this.getClassHierarchy(declareClass).forEach((arkClass: ArkClass) => {
                if (arkClass.isAbstract()) {
                    return resolveResult;
                }

                let possibleCalleeMethod = arkClass.getMethodWithName(calleeMethod!.getName());

                if (
                    possibleCalleeMethod &&
                    possibleCalleeMethod.isGenerated() &&
                    arkClass.getSignature().toString() !== declareClass.getSignature().toString()
                ) {
                    // remove the generated method in extended classes
                    return resolveResult;
                }

                if (possibleCalleeMethod && !possibleCalleeMethod.isAbstract()) {
                    resolveResult.push(
                        new CallSite(invokeStmt, undefined, this.cg.getCallGraphNodeByMethod(possibleCalleeMethod.getSignature()).getID(), callerMethod)
                    );
                }
            });
        }

        return resolveResult;
    }

    protected preProcessMethod(): CallSite[] {
        // do nothing
        return [];
    }
}
