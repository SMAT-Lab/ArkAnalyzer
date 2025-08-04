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

import { NullConstant } from '../../../core/base/Constant';
import { Local } from '../../../core/base/Local';
import { ArkAssignStmt } from '../../../core/base/Stmt';
import { ArrayType } from '../../../core/base/Type';
import { Value } from '../../../core/base/Value';
import { NodeID } from '../../../core/graph/GraphTraits';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { CallGraphNode, CallGraph } from '../../model/CallGraph';
import { ICallSite, CallSite } from '../../model/CallSite';
import { ContextID } from '../context/Context';
import { Pag, PagEdgeKind, PagFuncNode } from '../Pag';
import { CSFuncID, PagBuilder } from '../PagBuilder';
import { BuiltApiType, getBuiltInApiType } from '../PTAUtils';
import { IPagPlugin } from './IPagPlugin';

/**
 * FunctionPlugin processes Function.call, Function.apply, Function.bind.
 */
export class FunctionPlugin implements IPagPlugin {
    pag: Pag;
    pagBuilder: PagBuilder;
    cg: CallGraph;

    constructor(pag: Pag, pagBuilder: PagBuilder, cg: CallGraph) {
        this.pag = pag;
        this.pagBuilder = pagBuilder;
        this.cg = cg;
    }

    getName(): string {
        return 'FunctionPlugin';
    }

    canHandle(cs: ICallSite, cgNode: CallGraphNode): boolean {
        let ivkExpr = cs.callStmt.getInvokeExpr()!;
        const methodType = getBuiltInApiType(ivkExpr.getMethodSignature());
        return methodType === BuiltApiType.FunctionCall ||
            methodType === BuiltApiType.FunctionApply ||
            methodType === BuiltApiType.FunctionBind;
    }

    processCallSite(cs: CallSite, cid: ContextID, basePTNode: NodeID): NodeID[] {
        let srcNodes: NodeID[] = [];
        let calleeFuncID = cs.getCalleeFuncID();
        if (!calleeFuncID) {
            return srcNodes;
        }

        const calleeMethod = this.cg.getArkMethodByFuncID(calleeFuncID);

        if (!calleeMethod) {
            return srcNodes;
        }

        let ivkExpr = cs.callStmt.getInvokeExpr()!;
        const methodType = getBuiltInApiType(ivkExpr.getMethodSignature());
        const calleeCid = this.pagBuilder.getContextSelector().selectContext(cid, cs, basePTNode, calleeFuncID);

        // TODO: call and apply can return.
        switch (methodType) {
            case BuiltApiType.FunctionCall:
                /**
                 * set this and param
                 * function.call(thisArg, arg1, arg2, ...)
                 */
                this.handleFunctionCall(cs, cid, calleeCid, calleeMethod, srcNodes);
                break;
            case BuiltApiType.FunctionApply:
                /**
                 * set this, resolve array param
                 * function.apply(thisArg, [argsArray])
                 */
                this.handleFunctionApply(cs, cid, calleeCid, calleeMethod, srcNodes);
                break;
            case BuiltApiType.FunctionBind:
                /**
                 * clone the function node and add the this pointer, origin callSite, args offset to it
                 * let f = function.bind(thisArg, arg1, arg2, ...)
                 * f();
                 */
                this.handleFunctionBind(cs, cid, basePTNode, srcNodes);
                break;
            default:
        }
        return srcNodes;
    }


    private handleFunctionCall(
        staticCS: CallSite,
        cid: ContextID,
        calleeCid: ContextID,
        realCallee: ArkMethod,
        srcNodes: NodeID[],
    ): void {
        this.pagBuilder.buildFuncPagAndAddToWorklist(new CSFuncID(calleeCid, staticCS.calleeFuncID));
        srcNodes.push(...this.pagBuilder.addCallParamPagEdge(realCallee, staticCS.args!, staticCS, cid, calleeCid, 1));
        this.addThisEdge(staticCS, cid, realCallee, srcNodes, calleeCid);
    }

    private handleFunctionApply(
        staticCS: CallSite,
        cid: ContextID,
        calleeCid: ContextID,
        realCallee: ArkMethod,
        srcNodes: NodeID[],
    ): void {
        this.pagBuilder.buildFuncPagAndAddToWorklist(new CSFuncID(calleeCid, staticCS.calleeFuncID));
        let callerMethod = this.cg.getArkMethodByFuncID(staticCS.callerFuncID);
        if (!callerMethod) {
            throw new Error('Cannot get caller method');
        }
        let argsRealValues = this.transferArrayValues(staticCS.args![1]);
        srcNodes.push(...this.pagBuilder.addCallParamPagEdge(realCallee, argsRealValues, staticCS, cid, calleeCid, 0));
        this.addThisEdge(staticCS, cid, realCallee, srcNodes, calleeCid);
    }

    private handleFunctionBind(staticCS: CallSite, cid: ContextID, baseClassPTNode: NodeID, srcNodes: NodeID[]): void {
        let srcNode = this.pag.getOrClonePagFuncNode(baseClassPTNode);
        if (!srcNode) {
            return;
        }
        this.setFunctionThisPt(staticCS, srcNode, cid);

        let dstNode = this.pagBuilder.getOrNewPagNode(cid, (staticCS.callStmt as ArkAssignStmt).getLeftOp() as Local);
        this.pag.addPagEdge(srcNode, dstNode, PagEdgeKind.Copy, staticCS.callStmt);

        srcNode.setCS(staticCS);
        srcNode.setArgsOffset(1);
        srcNode.setOriginCid(cid);
    }

    private transferArrayValues(arrayLocal: Value): Local[] {
        if (!(arrayLocal instanceof Local) || !(arrayLocal.getType() instanceof ArrayType)) {
            return [];
        }

        /**
         * TODO: get array element values
         * need to resolve multi dimension array
         */
        const usedValuesInArray = arrayLocal.getUsedStmts().flatMap(stmt => {
            if (stmt instanceof ArkAssignStmt) {
                const rightOp = stmt.getRightOp();
                if (rightOp instanceof Local) {
                    return rightOp;
                }
            }
            return [];
        });

        return usedValuesInArray;
    }

    private setFunctionThisPt(staticCS: CallSite, srcNode: PagFuncNode, cid: ContextID): void {
        let thisLocal = staticCS.args![0];
        if (!(thisLocal instanceof Local)) {
            return;
        }

        let thisInstanceLocal = this.pagBuilder.getRealThisLocal(thisLocal, staticCS.callerFuncID);
        let baseThisNode = this.pag.getOrNewNode(cid, thisInstanceLocal);

        for (let pt of baseThisNode.getPointTo()) {
            srcNode.setThisPt(pt);
        }
    }

    private addThisEdge(staticCS: CallSite, cid: ContextID, realCallee: ArkMethod, srcNodes: NodeID[], calleeCid: ContextID): void {
        if (!(staticCS.args![0] instanceof NullConstant) && !realCallee.isStatic()) {
            let srcNodeID = this.pagBuilder.addThisRefCallEdge(cid, staticCS.args![0] as Local, realCallee, calleeCid, staticCS.callerFuncID);

            if (srcNodeID !== -1) {
                srcNodes.push(srcNodeID);
            }
        }
    }
}
