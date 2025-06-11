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

import { MethodSignature } from '../../core/model/ArkSignature';
import { Stmt } from '../../core/base/Stmt';
import { Scene } from '../../Scene';
import { ArkMethod } from '../../core/model/ArkMethod';
import { GraphPrinter } from '../../save/GraphPrinter';
import { PrinterBuilder } from '../../save/PrinterBuilder';
import { BaseEdge, BaseNode, BaseExplicitGraph, NodeID } from '../../core/graph/BaseExplicitGraph';
import { CGStat } from '../common/Statistics';
import { UNKNOWN_FILE_NAME } from '../../core/common/Const';
import { CallSite, CallSiteID, DynCallSite, ICallSite } from './CallSite';

export type Method = MethodSignature;
export type FuncID = number;
type StmtSet = Set<Stmt>;

export { CallSite, DynCallSite, ICallSite };

export enum CallGraphNodeKind {
    real, // method from project and has body
    vitual,
    intrinsic, // method created by AA, which arkMethod.isGenrated is true
    constructor, // constructor
    blank, // method without body
}

export class CallGraphEdge extends BaseEdge {
    private directCalls: StmtSet = new Set();
    private specialCalls: StmtSet = new Set();
    private indirectCalls: StmtSet = new Set();
    // private callSiteID: CallSiteID;

    constructor(src: CallGraphNode, dst: CallGraphNode) {
        super(src, dst, 0);
    }

    public addDirectCallSite(stmt: Stmt): void {
        this.directCalls.add(stmt);
    }

    public addSpecialCallSite(stmt: Stmt): void {
        this.specialCalls.add(stmt);
    }

    public addInDirectCallSite(stmt: Stmt): void {
        this.indirectCalls.add(stmt);
    }

    public getDotAttr(): string {
        const indirectCallNums: number = this.indirectCalls.size;
        const directCallNums: number = this.directCalls.size;
        const specialCallNums: number = this.specialCalls.size;
        if ([CallGraphNodeKind.intrinsic, CallGraphNodeKind.constructor].includes(this.getDstNode().getKind())) {
            return '';
        }

        if (indirectCallNums !== 0 && directCallNums === 0) {
            return 'color=red';
        } else if (specialCallNums !== 0) {
            return 'color=yellow';
        } else if (indirectCallNums === 0 && directCallNums !== 0) {
            return 'color=black';
        } else {
            return 'color=black';
        }
    }
}

export class CallGraphNode extends BaseNode {
    private method: Method;
    private ifSdkMethod: boolean = false;

    constructor(id: number, m: Method, k: CallGraphNodeKind = CallGraphNodeKind.real) {
        super(id, k);
        this.method = m;
    }

    public getMethod(): Method {
        return this.method;
    }

    public setSdkMethod(v: boolean): void {
        this.ifSdkMethod = v;
    }

    public isSdkMethod(): boolean {
        return this.ifSdkMethod;
    }

    public get isBlankMethod(): boolean {
        return this.kind === CallGraphNodeKind.blank;
    }

    public getDotAttr(): string {
        if ([CallGraphNodeKind.intrinsic, CallGraphNodeKind.constructor].includes(this.getKind())) {
            return '';
        }
        return 'shape=box';
    }

    public getDotLabel(): string {
        let label: string = 'ID: ' + this.getID() + '\n';
        label = label + this.getMethod().toString();
        return label;
    }
}

export class CallGraph extends BaseExplicitGraph {
    private scene: Scene;
    private idToCallSiteMap: Map<CallSiteID, CallSite> = new Map();
    private callSiteToIdMap: Map<CallSite, CallSiteID> = new Map();
    private stmtToCallSitemap: Map<Stmt, CallSite[]> = new Map();
    private stmtToDynCallSitemap: Map<Stmt, DynCallSite> = new Map();
    private methodToCGNodeMap: Map<string, NodeID> = new Map();
    private callPairToEdgeMap: Map<string, CallGraphEdge> = new Map();
    private methodToCallSiteMap: Map<FuncID, Set<CallSite>> = new Map();
    private callSiteNum: number = 0;
    private entries!: NodeID[];
    private cgStat: CGStat;
    private dummyMainMethodID: FuncID | undefined;

    constructor(s: Scene) {
        super();
        this.scene = s;
        this.cgStat = new CGStat();
    }

    private getCallPairString(srcID: NodeID, dstID: NodeID): string {
        return `${srcID}-${dstID}`;
    }

    public getCallEdgeByPair(srcID: NodeID, dstID: NodeID): CallGraphEdge | undefined {
        let key: string = this.getCallPairString(srcID, dstID);
        return this.callPairToEdgeMap.get(key);
    }

    public addCallGraphNode(method: Method, kind: CallGraphNodeKind = CallGraphNodeKind.real): CallGraphNode {
        let id: NodeID = this.nodeNum;
        let cgNode = new CallGraphNode(id, method, kind);
        // check if sdk method
        cgNode.setSdkMethod(this.scene.hasSdkFile(method.getDeclaringClassSignature().getDeclaringFileSignature()));

        this.addNode(cgNode);
        this.methodToCGNodeMap.set(method.toString(), cgNode.getID());
        this.cgStat.addNodeStat(kind);
        return cgNode;
    }

    public removeCallGraphNode(nodeID: NodeID): void {
        // remove edge relate to node first
        this.removeCallGraphEdge(nodeID);
        let node = this.getNode(nodeID) as CallGraphNode;
        // remove node itself
        this.removeNode(nodeID);
        this.methodToCGNodeMap.delete(node.getMethod().toString());
    }

    public getCallGraphNodeByMethod(method: Method): CallGraphNode {
        if (!method) {
            throw new Error();
        }
        let n = this.methodToCGNodeMap.get(method.toString());
        if (n === undefined) {
            // The method can't be found
            // means the method has no implementation, or base type is unclear to find it
            // Create a virtual CG Node
            // TODO: this virtual CG Node need be remove once the base type is clear
            return this.addCallGraphNode(method, CallGraphNodeKind.vitual);
        }

        return this.getNode(n) as CallGraphNode;
    }

    public addDirectOrSpecialCallEdge(caller: Method, callee: Method, callStmt: Stmt, isDirectCall: boolean = true): void {
        let callerNode = this.getCallGraphNodeByMethod(caller) as CallGraphNode;
        let calleeNode = this.getCallGraphNodeByMethod(callee) as CallGraphNode;
        let args = callStmt.getInvokeExpr()?.getArgs();

        let cs: CallSite = new CallSite(callStmt, args, calleeNode.getID(), callerNode.getID());
        let csID: CallSiteID;
        if (!this.callSiteToIdMap.has(cs)) {
            csID = this.callSiteNum++;
            this.idToCallSiteMap.set(csID, cs);
            this.callSiteToIdMap.set(cs, csID);
        } else {
            csID = this.callSiteToIdMap.get(cs) as CallSiteID;
        }

        if (this.addStmtToCallSiteMap(callStmt, cs)) {
            // TODO: check stmt exists
        }

        // TODO: check if edge exists
        let callEdge = this.getCallEdgeByPair(callerNode.getID(), calleeNode.getID());
        if (callEdge === undefined) {
            callEdge = new CallGraphEdge(callerNode, calleeNode);
            callEdge.getSrcNode().addOutgoingEdge(callEdge);
            callEdge.getDstNode().addIncomingEdge(callEdge);
            this.callPairToEdgeMap.set(this.getCallPairString(callerNode.getID(), calleeNode.getID()), callEdge);
        }
        if (isDirectCall) {
            callEdge.addDirectCallSite(callStmt);
        } else {
            callEdge.addSpecialCallSite(callStmt);
        }
    }

    public removeCallGraphEdge(nodeID: NodeID): void {
        let node = this.getNode(nodeID) as CallGraphNode;

        for (const inEdge of node.getIncomingEdge()) {
            node.removeIncomingEdge(inEdge);
        }

        for (const outEdge of node.getOutgoingEdges()) {
            node.removeIncomingEdge(outEdge);
        }
    }

    public addDynamicCallInfo(callStmt: Stmt, caller: Method, protentialCallee?: Method): void {
        let callerNode = this.getCallGraphNodeByMethod(caller) as CallGraphNode;
        let calleeNode;
        if (protentialCallee) {
            calleeNode = this.getCallGraphNodeByMethod(protentialCallee) as CallGraphNode;
        }
        let args = callStmt.getInvokeExpr()?.getArgs();

        let cs = new DynCallSite(callStmt, args, calleeNode?.getID(), callerNode.getID());
        this.stmtToDynCallSitemap.set(callStmt, cs);
    }

    public addDynamicCallEdge(callerID: NodeID, calleeID: NodeID, callStmt: Stmt): void {
        let callerNode = this.getNode(callerID) as CallGraphNode;
        let calleeNode = this.getNode(calleeID) as CallGraphNode;

        let callEdge = this.getCallEdgeByPair(callerNode.getID(), calleeNode.getID());
        if (callEdge === undefined) {
            callEdge = new CallGraphEdge(callerNode, calleeNode);
            callEdge.getSrcNode().addOutgoingEdge(callEdge);
            callEdge.getDstNode().addIncomingEdge(callEdge);
            this.callPairToEdgeMap.set(this.getCallPairString(callerNode.getID(), calleeNode.getID()), callEdge);
        }
        callEdge.addInDirectCallSite(callStmt);
    }

    public getDynCallsiteByStmt(stmt: Stmt): DynCallSite | undefined {
        return this.stmtToDynCallSitemap.get(stmt);
    }

    public addStmtToCallSiteMap(stmt: Stmt, cs: CallSite): boolean {
        if (this.stmtToCallSitemap.has(stmt)) {
            let callSites = this.stmtToCallSitemap.get(stmt) ?? [];
            this.stmtToCallSitemap.set(stmt, [...callSites, cs]);
            return false;
        }
        this.stmtToCallSitemap.set(stmt, [cs]);
        return true;
    }

    public getCallSiteByStmt(stmt: Stmt): CallSite[] {
        return this.stmtToCallSitemap.get(stmt) ?? [];
    }

    public addMethodToCallSiteMap(funcID: FuncID, cs: CallSite): void {
        if (this.methodToCallSiteMap.has(funcID)) {
            this.methodToCallSiteMap.get(funcID)!.add(cs);
        } else {
            this.methodToCallSiteMap.set(funcID, new Set([cs]));
        }
    }

    public getCallSitesByMethod(func: FuncID | MethodSignature): Set<CallSite> {
        let funcID: FuncID;
        if (func instanceof MethodSignature) {
            funcID = this.getCallGraphNodeByMethod(func).getID();
        } else {
            funcID = func;
        }

        return this.methodToCallSiteMap.get(funcID) ?? new Set();
    }

    public getInvokeStmtByMethod(func: FuncID | MethodSignature): Stmt[] {
        let callSites = this.getCallSitesByMethod(func);
        let invokeStmts: Stmt[] = [];
        callSites.forEach(cs => {
            invokeStmts.push(cs.callStmt);
        });

        return invokeStmts;
    }

    public getDynEdges(): Map<Method, Set<Method>> {
        let callMap: Map<Method, Set<Method>> = new Map();
        this.callPairToEdgeMap.forEach((edge: CallGraphEdge) => {
            let srcMethod = (edge.getSrcNode() as CallGraphNode).getMethod();
            let dstMethod = (edge.getDstNode() as CallGraphNode).getMethod();

            let dstSet: Set<Method>;
            if (callMap.has(srcMethod)) {
                dstSet = callMap.get(srcMethod)!;
            } else {
                dstSet = new Set();
            }
            callMap.set(srcMethod, dstSet.add(dstMethod));
        });

        return callMap;
    }

    public getMethodByFuncID(id: FuncID): Method | null {
        let node = this.getNode(id);
        if (node !== undefined) {
            return (node as CallGraphNode).getMethod();
        }
        return null;
    }

    public getArkMethodByFuncID(id: FuncID): ArkMethod | null {
        let method = this.getMethodByFuncID(id);
        if (method != null) {
            // TODO: SDK Method search
            return this.scene.getMethod(method);
        }

        return null;
    }

    public getEntries(): FuncID[] {
        return this.entries;
    }

    public setEntries(n: NodeID[]): void {
        this.entries = n;
    }

    public dump(name: string, entry?: FuncID): void {
        let printer = new GraphPrinter<this>(this);
        if (entry) {
            printer.setStartID(entry);
        }
        PrinterBuilder.dump(printer, name);
    }

    public detectReachable(fromID: FuncID, dstID: FuncID): boolean {
        let dWorklist: FuncID[] = [];
        let travserdFuncs = new Set();

        dWorklist.push(fromID);

        while (dWorklist.length > 0) {
            let nodeID = dWorklist.shift()!;
            if (travserdFuncs.has(nodeID)) {
                continue;
            }
            travserdFuncs.add(nodeID);

            let node = this.getNode(nodeID)!;
            for (let e of node.getOutgoingEdges()) {
                let dst = e.getDstID();
                if (dst === dstID) {
                    return true;
                }
                dWorklist.push(dst);
            }
        }

        return false;
    }

    public startStat(): void {
        this.cgStat.startStat();
    }

    public endStat(): void {
        this.cgStat.endStat();
    }

    public printStat(): void {
        this.cgStat.printStat();
    }

    public getStat(): string {
        return this.cgStat.getStat();
    }

    public setDummyMainFuncID(dummyMainMethodID: number): void {
        this.dummyMainMethodID = dummyMainMethodID;
    }

    public getDummyMainFuncID(): FuncID | undefined {
        return this.dummyMainMethodID;
    }

    public isUnknownMethod(funcID: FuncID): boolean {
        let method = this.getMethodByFuncID(funcID);

        if (method) {
            if (!(method.getDeclaringClassSignature().getDeclaringFileSignature().getFileName() === UNKNOWN_FILE_NAME)) {
                return false;
            }
        }

        return true;
    }

    public getGraphName(): string {
        return 'CG';
    }
}