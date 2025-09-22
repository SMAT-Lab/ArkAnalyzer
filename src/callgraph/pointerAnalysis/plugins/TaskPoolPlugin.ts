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

import { Constant } from '../../../core/base/Constant';
import { AbstractExpr, ArkInstanceInvokeExpr, ArkNewExpr, ArkPtrInvokeExpr } from '../../../core/base/Expr';
import { Local } from '../../../core/base/Local';
import { ArkAssignStmt, ArkInvokeStmt, Stmt } from '../../../core/base/Stmt';
import { ClassType, FunctionType } from '../../../core/base/Type';
import { Value } from '../../../core/base/Value';
import { CONSTRUCTORFUCNNAME } from '../../../core/common/Const';
import { NodeID } from '../../../core/graph/GraphTraits';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { CallGraph, CallGraphNode, FuncID, ICallSite } from '../../model/CallGraph';
import { ContextID } from '../context/Context';
import { Pag, PagEdgeKind, PagLocalNode } from '../Pag';
import { PagBuilder } from '../PagBuilder';
import { IPagPlugin } from './IPagPlugin';


const taskpoolMethodNames = new Set([
    'execute',
    'executeDelayed',
    'executePeriodically',
    'addTask',
    'constructor'
]);

export class TaskPoolPlugin implements IPagPlugin {
    pag: Pag;
    pagBuilder: PagBuilder;
    cg: CallGraph;
    private sdkMethodReturnValueMap: Map<ArkMethod, Map<ContextID, ArkNewExpr>>;
    // Record the sdk method param values.
    private methodParamValueMap: Map<FuncID, Value[]>;
    // A fake stmt to mark the declaring stmt of the sdk method param Local.
    private fakeSdkMethodParamDeclaringStmt: Stmt;
    // Record the function that the task thread object will execute.
    private taskObj2CGNodeMap: Map<Local, CallGraphNode>;
    // Record the constructor statement of the task thread object.
    private taskObj2ConstructorStmtMap: Map<Local, Stmt>;

    constructor(pag: Pag, pagBuilder: PagBuilder, cg: CallGraph) {
        this.pag = pag;
        this.pagBuilder = pagBuilder;
        this.cg = cg;
        this.sdkMethodReturnValueMap = new Map();
        this.methodParamValueMap = new Map();
        this.fakeSdkMethodParamDeclaringStmt = new ArkAssignStmt(new Local(''), new Local(''));
        this.taskObj2ConstructorStmtMap = new Map();
        this.taskObj2CGNodeMap = new Map();
    }

    getName(): string {
        return 'TaskPoolPlugin';
    }

    canHandle(cs: ICallSite, cgNode: CallGraphNode): boolean {
        // if namespace is 'taskpool', then can handle
        let namespacename = cgNode.getMethod().getDeclaringClassSignature().getDeclaringNamespaceSignature()?.getNamespaceName();
        return namespacename === 'taskpool';
    }

    processCallSite(cs: ICallSite, cid: ContextID, basePTNode: NodeID): NodeID[] {
        let srcNodes: NodeID[] = [];
        let calleeFuncID = cs.getCalleeFuncID();
        if (!calleeFuncID) {
            return srcNodes;
        }
        const calleeMethod = this.cg.getArkMethodByFuncID(calleeFuncID);
        if (!calleeMethod) {
            return srcNodes;
        }
        let methodname = calleeMethod.getSubSignature().getMethodName();
        const calleeCid = this.pagBuilder.getContextSelector().selectContext(cid, cs, basePTNode, calleeFuncID);
        if (methodname === CONSTRUCTORFUCNNAME && cs.args !== undefined) {
            // match the constructor function so that update the taskObj2CGNodeMap
            for (let i = 0; i < cs.args.length; i++) {
                if (cs.args[i] instanceof Local && cs.args[i].getType() instanceof FunctionType) {
                    this.addTaskObj2CGNodeMap(cs, i);
                    break;
                }
            }
        }
        if (taskpoolMethodNames.has(methodname) && cs.args !== undefined) {
            // transfer the param function pag to the task thread function pag
            for (let i = 0; i < cs.args.length; i++) {
                if (cs.args[i] instanceof Local && cs.args[i].getType() instanceof FunctionType) {
                    this.addTaskPoolMethodPagCallEdge(cs, cid, calleeCid, srcNodes, i);
                    break;
                }
            }
        }
        return srcNodes;
    }

    private addTaskPoolMethodPagCallEdge(cs: ICallSite, callerCid: ContextID, calleeCid: ContextID, srcNodes: NodeID[], index: number): void {
        let calleeFuncID = cs.getCalleeFuncID();
        if (!calleeFuncID) {
            return;
        }
        let calleeNode = this.cg.getNode(calleeFuncID) as CallGraphNode;
        let calleeMethod = this.cg.getArkMethodByFuncID(calleeFuncID);
        if (!calleeMethod) {
            return;
        }

        if (!this.methodParamValueMap.has(calleeNode.getID())) {
            this.buildSDKFuncPag(calleeNode.getID(), calleeMethod);
        }

        this.addSDKMethodReturnPagEdge(cs, callerCid, calleeCid, calleeMethod, srcNodes);
        this.addTaskPoolMethodParamPagEdge(cs, callerCid, calleeCid, calleeNode.getID(), srcNodes, index);
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
        if (!newExpr && returnType instanceof ClassType) {
            newExpr = new ArkNewExpr(returnType);
        }
        if (newExpr === undefined) {
            return;
        }
        cidMap.set(calleeCid, newExpr!);
        this.sdkMethodReturnValueMap.set(calleeMethod, cidMap);

        let srcPagNode = this.pagBuilder.getOrNewPagNode(calleeCid, newExpr!);
        let dstPagNode = this.pagBuilder.getOrNewPagNode(callerCid, cs.callStmt.getLeftOp(), cs.callStmt);

        this.pag.addPagEdge(srcPagNode, dstPagNode, PagEdgeKind.Address, cs.callStmt);
        srcNodes.push(srcPagNode.getID());
        return;
    }

    private addTaskPoolMethodParamPagEdge(cs: ICallSite, callerCid: ContextID, calleeCid: ContextID, funcID: FuncID, srcNodes: NodeID[], index: number): void {
        let paramValue = this.methodParamValueMap.get(funcID)?.[0];
        if (paramValue === undefined || cs.args === undefined) {
            return;
        }
        let srcPagNode = this.pagBuilder.getOrNewPagNode(callerCid, cs.args[index], cs.callStmt);
        let dstPagNode = this.pagBuilder.getOrNewPagNode(calleeCid, paramValue, cs.callStmt);
        let args = cs.args.slice(index + 1);

        if (dstPagNode instanceof PagLocalNode) {
            dstPagNode.setSdkParam();
            // add related dyn callsite
            let arkPtrInvokeExpr = new ArkPtrInvokeExpr((cs.args[index].getType() as FunctionType).getMethodSignature(), paramValue as Local, args);
            let sdkParamInvokeStmt = new ArkInvokeStmt(arkPtrInvokeExpr);
            let calleeNode = this.cg.getCallGraphNodeByMethod((cs.args[index].getType() as FunctionType).getMethodSignature());
            let sdkParamCallSite = this.cg.getCallSiteManager().newDynCallSite(sdkParamInvokeStmt, args, calleeNode.getID(), funcID);
            dstPagNode.addRelatedDynCallSite(sdkParamCallSite);
        }

        this.pag.addPagEdge(srcPagNode, dstPagNode, PagEdgeKind.Copy, cs.callStmt);
        srcNodes.push(srcPagNode.getID());

        // passed the cid of args
        for (let arg of args) {
            if (arg instanceof Constant || arg instanceof AbstractExpr) {
                continue;
            }
            srcPagNode = this.pagBuilder.getOrNewPagNode(callerCid, arg, cs.callStmt);
            dstPagNode = this.pagBuilder.getOrNewPagNode(calleeCid, arg, cs.callStmt);
            this.pag.addPagEdge(srcPagNode, dstPagNode, PagEdgeKind.Copy, cs.callStmt);
            srcNodes.push(srcPagNode.getID());
        }

        return;
    }

    public addTaskObj2CGNodeMap(cs: ICallSite, index: number): void {
        // Obtain the function that the task thread is going to execute through the param function.
        let invokeExpr = cs.callStmt.getInvokeExpr() as ArkInstanceInvokeExpr;
        if (cs.args === undefined) {
            return;
        }
        let arg_type = cs.args[index].getType();
        if (arg_type instanceof FunctionType) {
            let cgnode = this.cg.getCallGraphNodeByMethod(arg_type.getMethodSignature());
            this.taskObj2CGNodeMap.set(invokeExpr.getBase(), cgnode);
            this.taskObj2ConstructorStmtMap.set(invokeExpr.getBase(), cs.callStmt);
        }
    }

    public getTaskObj2CGNodeMap(): Map<Local, CallGraphNode> {
        return this.taskObj2CGNodeMap;
    }

    public getTaskObj2ConstructorStmtMap(): Map<Local, Stmt> {
        return this.taskObj2ConstructorStmtMap;
    }
}