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

import { ArkFile, FileSignature } from '../../..';
import { StringConstant } from '../../../core/base/Constant';
import { ArkInstanceInvokeExpr } from '../../../core/base/Expr';
import { Local } from '../../../core/base/Local';
import { ArkInstanceFieldRef, ArkParameterRef } from '../../../core/base/Ref';
import { ArkAssignStmt, Stmt } from '../../../core/base/Stmt';
import { FunctionType } from '../../../core/base/Type';
import { CONSTRUCTORFUCNNAME, ONMESSAGEFUNCNAME, POSTMESSAGEFUNCNAME, POSTMESSAGEWITHSHAREDSENDABLEFUNCNAME } from '../../../core/common/Const';
import { NodeID } from '../../../core/graph/GraphTraits';
import { CallGraph, CallGraphNode, ICallSite } from '../../model/CallGraph';
import { ContextID } from '../context/Context';
import { emptyID } from '../context/ContextSelector';
import { Pag, PagEdgeKind, PagNode } from '../Pag';
import { CSFuncID, PagBuilder } from '../PagBuilder';
import { IPagPlugin } from './IPagPlugin';


export class WorkerPlugin implements IPagPlugin {
    pag: Pag;
    pagBuilder: PagBuilder;
    cg: CallGraph;
    private workerObj2CGNodeMap: Map<Local, CallGraphNode> = new Map();

    constructor(pag: Pag, pagBuilder: PagBuilder, cg: CallGraph) {
        this.pag = pag;
        this.pagBuilder = pagBuilder;
        this.cg = cg;
    }

    getName(): string {
        return 'WorkerPlugin';
    }

    canHandle(cs: ICallSite, cgNode: CallGraphNode): boolean {
        let namespacename = cgNode.getMethod().getDeclaringClassSignature().getDeclaringNamespaceSignature()?.getNamespaceName();
        return namespacename === 'worker';
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
        if (methodname === CONSTRUCTORFUCNNAME) {
            this.addWorkerObj2CGNodeMap(cs);
        }
        if (methodname === POSTMESSAGEFUNCNAME || methodname === POSTMESSAGEWITHSHAREDSENDABLEFUNCNAME) {
            this.addWorkerPagCallEdge(cs, cid, srcNodes);
        }
        return srcNodes;
    }

    private addWorkerPagCallEdge(cs: ICallSite, callerCid: ContextID, srcNodes: NodeID[]): void {
        let myworker = (cs.callStmt.getInvokeExpr() as ArkInstanceInvokeExpr).getBase();
        let nodes = this.pag.getNodesByValue(myworker);
        let pointto = new Set<PagNode>();
        if (nodes === undefined) {
            return;
        }
        for (let node of nodes) {
            if (node[0] !== callerCid) {
                continue;
            }
            let ptcollection = (this.pag.getNode(node[1]) as PagNode).getPointTo();
            for (let id of ptcollection) {
                pointto.add(this.pag.getNode(id) as PagNode);
            }
        }
        for (let obj of pointto) {
            let cgnode = this.workerObj2CGNodeMap.get(((obj.getStmt() as ArkAssignStmt).getLeftOp() as Local));
            if (cgnode === undefined) {
                continue;
            }
            this.addPostMessagePagCallEdge(cs, callerCid, cgnode.getID(), srcNodes);
        }
        return;
    }

    private addPostMessagePagCallEdge(cs: ICallSite, callerCid: ContextID, calleeFuncID: number, srcNodes: NodeID[]): void {
        let cgnode = this.cg.getNode(calleeFuncID) as CallGraphNode;
        let calleeMethod = this.cg.getArkMethodByFuncID(cgnode.getID());
        if (calleeMethod === null) {
            return;
        }
        let calleeCid = this.pagBuilder.getContextSelector().selectContext(callerCid, cs, emptyID, cgnode.getID());
        this.pagBuilder.buildFuncPagAndAddToWorklist(new CSFuncID(calleeCid, cgnode.getID()));
        let params = calleeMethod.getCfg()!.getStmts()
            .filter(stmt => stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof ArkParameterRef)
            .map(stmt => (stmt as ArkAssignStmt).getRightOp());
        calleeMethod.getBody()?.getLocals().forEach((local) => {
            if (local.getDeclaringStmt() instanceof ArkAssignStmt && (local.getDeclaringStmt() as ArkAssignStmt).getRightOp() === params[0]) {
                // find the local corresponding to the first parameter
                this.ProcessPostMessagePagCallEdge(cs, callerCid, calleeCid, local, srcNodes);
            }
        });
        return;
    }

    private ProcessPostMessagePagCallEdge(cs: ICallSite, callerCid: ContextID, calleeCid: ContextID, local: Local, srcNodes: NodeID[]): void {
        let usedstmts = local.getUsedStmts().filter(usedstmt => usedstmt instanceof ArkAssignStmt && usedstmt.getRightOp() instanceof ArkInstanceFieldRef);
        for (let usedstmt of usedstmts) {
            let fieldref = (usedstmt as ArkAssignStmt).getRightOp() as ArkInstanceFieldRef;
            // find the fieldref whose fieldname is 'data', then add pag edge between the argument and the leftop of the assignstmt
            // of the fieldref
            if (fieldref.getBase() === local && fieldref.getFieldName() === 'data' && cs.args !== undefined && cs.args[0] instanceof Local) {
                let srcPagNode = this.pagBuilder.getOrNewPagNode(callerCid, cs.args[0], cs.callStmt);
                let dstPagNode = this.pagBuilder.getOrNewPagNode(calleeCid, (usedstmt as ArkAssignStmt).getLeftOp(), cs.callStmt);
                this.pag.addPagEdge(srcPagNode, dstPagNode, PagEdgeKind.Copy, cs.callStmt);
                srcNodes.push(srcPagNode.getID());
            }
        }
        return;
    }

    public addWorkerObj2CGNodeMap(cs: ICallSite): void {
        // Obtain the function that the worker sub-thread is going to execute through the file path.
        let callstmt = cs.callStmt;
        callstmt.getCfg().getDeclaringMethod().getDeclaringArkClass().getDeclaringArkFile().getScene();
        let invokeExpr = cs.callStmt.getInvokeExpr() as ArkInstanceInvokeExpr;
        if (cs.args === undefined) {
            return;
        }
        if (cs.args[0] instanceof StringConstant) {
            let workerfile = this.getFileByPath(callstmt, cs.args[0]);
            if (workerfile === null) {
                return;
            }
            let defaultArkMethod = workerfile.getDefaultClass().getDefaultArkMethod();
            if (defaultArkMethod === null) {
                return;
            }
            let cfg = defaultArkMethod.getCfg();
            if (cfg === undefined) {
                return;
            }
            let stmts = cfg.getStmts();
            for (let stmt of stmts) {
                // Find the assignment statement where the onmessage function is assigned to the worker object.
                if (!(stmt instanceof ArkAssignStmt)) {
                    continue;
                }
                if (stmt.getLeftOp() instanceof ArkInstanceFieldRef && (stmt.getLeftOp() as ArkInstanceFieldRef).getFieldName() === ONMESSAGEFUNCNAME) {
                    let cgnode = this.cg.getCallGraphNodeByMethod((stmt.getRightOp().getType() as FunctionType).getMethodSignature());
                    this.workerObj2CGNodeMap.set(invokeExpr.getBase(), cgnode);
                }
            }
        }
        return;
    }

    public getWorkerObj2CGNodeMap(): Map<Local, CallGraphNode> {
        return this.workerObj2CGNodeMap;
    }

    public getFileByPath(callstmt: Stmt, filePath: StringConstant): ArkFile | null {
        let declaringarkfile = callstmt.getCfg().getDeclaringMethod().getDeclaringArkClass().getDeclaringArkFile();
        const scene = declaringarkfile.getScene();
        let filepath = filePath.toString().replace('../', '').replace('./', '').replace("'", '').replace("'", '');
        filepath = filepath.substring(filepath.indexOf('ets'));
        if (/\.e?ts$/.test(filepath)) {
            const fileSignature = new FileSignature(declaringarkfile.getFileSignature().getProjectName(), filepath);
            return scene.getFile(fileSignature);
        }
        return null;
    }
}