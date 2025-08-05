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

import { ArkNewExpr, ArkPtrInvokeExpr } from '../../../core/base/Expr';
import { Local } from '../../../core/base/Local';
import { ArkAssignStmt, ArkInvokeStmt, Stmt } from '../../../core/base/Stmt';
import { ClassType, FunctionType } from '../../../core/base/Type';
import { Value } from '../../../core/base/Value';
import { NodeID } from '../../../core/graph/GraphTraits';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { CallGraph, CallGraphNode, FuncID, ICallSite } from '../../model/CallGraph';
import { ContextID } from '../context/Context';
import { Pag, PagEdgeKind, PagLocalNode } from '../Pag';
import { PagBuilder } from '../PagBuilder';
import { BuiltApiType, getBuiltInApiType } from '../PTAUtils';
import { IPagPlugin } from './IPagPlugin';

/**
 * SdkPlugin processes OpenHarmony and built-in SDK APIs.
 * creates fake PAG nodes for SDK method return values and parameters.
 */
export class SdkPlugin implements IPagPlugin {
    pag: Pag;
    pagBuilder: PagBuilder;
    cg: CallGraph;
    // record the SDK API param, and create fake Values
    private sdkMethodReturnValueMap: Map<ArkMethod, Map<ContextID, ArkNewExpr>>;
    private methodParamValueMap: Map<FuncID, Value[]>;
    private fakeSdkMethodParamDeclaringStmt: Stmt;

    constructor(pag: Pag, pagBuilder: PagBuilder, cg: CallGraph) {
        this.pag = pag;
        this.pagBuilder = pagBuilder;
        this.cg = cg;
        this.sdkMethodReturnValueMap = new Map();
        this.methodParamValueMap = new Map();
        this.fakeSdkMethodParamDeclaringStmt = new ArkAssignStmt(new Local(''), new Local(''));
    }

    getName(): string {
        return 'SdkPlugin';
    }

    canHandle(cs: ICallSite, cgNode: CallGraphNode): boolean {
        let methodType = getBuiltInApiType(cgNode.getMethod());
        return cgNode.isSdkMethod() && (methodType === BuiltApiType.NotBuiltIn);
    }

    processCallSite(cs: ICallSite, cid: ContextID, basePTNode: NodeID): NodeID[] {
        let srcNodes: NodeID[] = [];
        this.addSDKMethodPagCallEdge(cs, cid, 0, srcNodes);
        return srcNodes;
    }

    private addSDKMethodPagCallEdge(cs: ICallSite, callerCid: ContextID, calleeCid: ContextID, srcNodes: NodeID[]): void {
        let calleeFuncID = cs.getCalleeFuncID()!;
        let calleeNode = this.cg.getNode(calleeFuncID) as CallGraphNode;
        let calleeMethod: ArkMethod | null = this.cg.getArkMethodByFuncID(calleeFuncID);
        if (!calleeMethod) {
            return;
        }

        if (!this.methodParamValueMap.has(calleeNode.getID())) {
            this.buildSDKFuncPag(calleeNode.getID(), calleeMethod);
        }

        this.addSDKMethodReturnPagEdge(cs, callerCid, calleeCid, calleeMethod, srcNodes);
        this.addSDKMethodParamPagEdge(cs, callerCid, calleeCid, calleeNode.getID(), srcNodes);
        return;
    }

    /**
     * will not create real funcPag, only create param values
     */
    public buildSDKFuncPag(funcID: FuncID, sdkMethod: ArkMethod): void {
        let paramArr: Value[] = this.createDummyParamValue(sdkMethod);

        this.methodParamValueMap.set(funcID, paramArr);
    }

    private createDummyParamValue(sdkMethod: ArkMethod): Value[] {
        let args = sdkMethod.getParameters();
        let paramArr: Value[] = [];
        if (!args) {
            return paramArr;
        }

        // Local
        args.forEach((arg) => {
            let argInstance: Local = new Local(arg.getName(), arg.getType());
            argInstance.setDeclaringStmt(this.fakeSdkMethodParamDeclaringStmt);
            paramArr.push(argInstance);
        });

        return paramArr;
    }

    private addSDKMethodReturnPagEdge(cs: ICallSite, callerCid: ContextID, calleeCid: ContextID, calleeMethod: ArkMethod, srcNodes: NodeID[]): void {
        let returnType = calleeMethod.getReturnType();
        if (!(returnType instanceof ClassType) || !(cs.callStmt instanceof ArkAssignStmt)) {
            return;
        }

        // check fake heap object exists or not
        let cidMap = this.sdkMethodReturnValueMap.get(calleeMethod);
        if (!cidMap) {
            cidMap = new Map();
        }
        let newExpr = cidMap.get(calleeCid);
        if (!newExpr) {
            if (returnType instanceof ClassType) {
                newExpr = new ArkNewExpr(returnType);
            }
        }
        cidMap.set(calleeCid, newExpr!);
        this.sdkMethodReturnValueMap.set(calleeMethod, cidMap);

        let srcPagNode = this.pagBuilder.getOrNewPagNode(calleeCid, newExpr!);
        let dstPagNode = this.pagBuilder.getOrNewPagNode(callerCid, cs.callStmt.getLeftOp(), cs.callStmt);

        this.pag.addPagEdge(srcPagNode, dstPagNode, PagEdgeKind.Address, cs.callStmt);
        srcNodes.push(srcPagNode.getID());
        return;
    }

    /**
     * process the anonymous method param, create a new CallSite for it and invoke it.
     */
    private addSDKMethodParamPagEdge(cs: ICallSite, callerCid: ContextID, calleeCid: ContextID, funcID: FuncID, srcNodes: NodeID[]): void {
        let argNum = cs.args?.length;

        if (!argNum) {
            return;
        }

        // add args to parameters edges
        for (let i = 0; i < argNum; i++) {
            let arg = cs.args?.[i];
            let paramValue;

            if (arg instanceof Local && arg.getType() instanceof FunctionType) {
                paramValue = this.methodParamValueMap.get(funcID)![i];
            } else {
                continue;
            }

            if (!(arg && paramValue)) {
                continue;
            }

            // Get or create new PAG node for argument and parameter
            let srcPagNode = this.pagBuilder.getOrNewPagNode(callerCid, arg, cs.callStmt);
            let dstPagNode = this.pagBuilder.getOrNewPagNode(calleeCid, paramValue, cs.callStmt);

            if (dstPagNode instanceof PagLocalNode) {
                // set the fake param Value in PagLocalNode
                /**
                 * TODO: !!!
                 * some API param is in the form of anonymous method:
                 *  component/common.d.ts
                 *  declare function animateTo(value: AnimateParam, event: () => void): void;
                 *
                 * this param fake Value will create PagFuncNode rather than PagLocalNode
                 * when this API is called, the anonymous method pointer will not be able to pass into the fake Value PagNode
                 */
                dstPagNode.setSdkParam();
                let sdkParamInvokeStmt = new ArkInvokeStmt(new ArkPtrInvokeExpr((arg.getType() as FunctionType).getMethodSignature(), paramValue as Local, []));

                // create new DynCallSite
                let sdkParamCallSite = this.cg.getCallSiteManager().newDynCallSite(
                    sdkParamInvokeStmt, undefined, undefined, funcID
                );
                dstPagNode.addRelatedDynCallSite(sdkParamCallSite);
            }

            this.pag.addPagEdge(srcPagNode, dstPagNode, PagEdgeKind.Copy, cs.callStmt);
            srcNodes.push(srcPagNode.getID());
        }

        return;
    }

    public getParamValues(method: ArkMethod): Value[] | undefined {
        const funcID = this.cg.getCallGraphNodeByMethod(method.getSignature()).getID();
        return this.methodParamValueMap.get(funcID);
    }
}