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
import { CallSite, CallSiteID, CallSiteManager, DynCallSite, ICallSite } from './CallSite';
import { CallGraphJsonPrinter } from '../../save/CGJsonPrinter';

export type Method = MethodSignature;
export type FuncID = number;

export { CallSite, DynCallSite, ICallSite };

export enum CallGraphNodeKind {
    real, // method from project and has body
    virtual,
    intrinsic, // method created by AA, which arkMethod.isGenerated is true
    constructor, // constructor
    blank, // method without body
}

const EDGE_FLAG_DIRECT = 1;
const EDGE_FLAG_SPECIAL = 2;
const EDGE_FLAG_INDIRECT = 4;

export class CallGraphEdge extends BaseEdge {
    private flags: number = 0;

    constructor(src: CallGraphNode, dst: CallGraphNode) {
        super(src, dst, 0);
    }

    public addDirectCallSite(_stmt: Stmt): void {
        this.flags |= EDGE_FLAG_DIRECT;
    }

    public addSpecialCallSite(_stmt: Stmt): void {
        this.flags |= EDGE_FLAG_SPECIAL;
    }

    public addInDirectCallSite(_stmt: Stmt): void {
        this.flags |= EDGE_FLAG_INDIRECT;
    }

    public hasDirectCall(): boolean {
        return (this.flags & EDGE_FLAG_DIRECT) !== 0;
    }

    public hasIndirectCall(): boolean {
        return (this.flags & EDGE_FLAG_INDIRECT) !== 0;
    }

    public hasSpecialCall(): boolean {
        return (this.flags & EDGE_FLAG_SPECIAL) !== 0;
    }

    public getDotAttr(): string {
        if (this.hasIndirectCall() && !this.hasDirectCall()) {
            return 'color=red';
        } else if (this.hasSpecialCall()) {
            return 'color=yellow';
        } else if (this.hasDirectCall()) {
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
    private csManager = new CallSiteManager();
    private stmtToCallSitemap: Map<Stmt, CallSite[]> = new Map();
    private stmtToDynCallSitemap: Map<Stmt, DynCallSite> = new Map();
    private methodToCGNodeMap: Map<string, NodeID> = new Map();
    private callPairToEdgeMap: Map<string, CallGraphEdge> = new Map();
    private methodToCallSiteMap: Map<FuncID, Set<CallSite>> = new Map();
    private entries!: NodeID[];
    private cgStat?: CGStat;
    private dummyMainMethodID: FuncID | undefined;

    constructor(s: Scene, enableStatistics: boolean = false) {
        super();
        this.scene = s;
        if (enableStatistics) {
            this.cgStat = new CGStat();
        }
    }

    private getCallPairString(srcID: NodeID, dstID: NodeID): string {
        return `${srcID}-${dstID}`;
    }

    public getCallEdgeByPair(srcID: NodeID, dstID: NodeID): CallGraphEdge | undefined {
        let key: string = this.getCallPairString(srcID, dstID);
        return this.callPairToEdgeMap.get(key);
    }

    public getCallEdges(): Iterable<CallGraphEdge> {
        return this.callPairToEdgeMap.values();
    }

    public addCallGraphNode(method: Method, kind: CallGraphNodeKind = CallGraphNodeKind.real): CallGraphNode {
        let id: NodeID = this.nodeNum;
        let cgNode = new CallGraphNode(id, method, kind);
        // check if sdk method
        cgNode.setSdkMethod(this.scene.hasSdkFile(method.getDeclaringClassSignature().getDeclaringFileSignature()));

        this.addNode(cgNode);
        this.methodToCGNodeMap.set(method.toString(), cgNode.getID());
        this.cgStat?.addNodeStat(kind);
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
            return this.addCallGraphNode(method, CallGraphNodeKind.virtual);
        }

        return this.getNode(n) as CallGraphNode;
    }

    public addDirectOrSpecialCallEdge(caller: Method, callee: Method, callStmt: Stmt, isDirectCall: boolean = true): void {
        let callerNode = this.getCallGraphNodeByMethod(caller) as CallGraphNode;
        let calleeNode = this.getCallGraphNodeByMethod(callee) as CallGraphNode;
        let args = callStmt.getInvokeExpr()?.getArgs();

        let cs: CallSite = this.csManager.newCallSite(callStmt, args, calleeNode.getID(), callerNode.getID());

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
            this.edgeNum++;
        }
        if (isDirectCall) {
            callEdge.addDirectCallSite(callStmt);
        } else {
            callEdge.addSpecialCallSite(callStmt);
        }
    }

    public removeCallGraphEdge(nodeID: NodeID): void {
        let node = this.getNode(nodeID) as CallGraphNode;

        for (const inEdge of node.getIncomingEdge() ?? []) {
            node.removeIncomingEdge(inEdge);
        }

        for (const outEdge of node.getOutgoingEdges() ?? []) {
            node.removeOutgoingEdge(outEdge);
        }
    }

    public addDynamicCallInfo(callStmt: Stmt, caller: Method, potentialCallee?: Method): void {
        let callerNode = this.getCallGraphNodeByMethod(caller) as CallGraphNode;
        let calleeNode;
        if (potentialCallee) {
            calleeNode = this.getCallGraphNodeByMethod(potentialCallee) as CallGraphNode;
        }
        let args = callStmt.getInvokeExpr()?.getArgs();

        let cs = this.csManager.newDynCallSite(callStmt, args, calleeNode?.getID(), callerNode.getID());
        this.stmtToDynCallSitemap.set(callStmt, cs);
    }

    public addDynamicCallEdge(callerID: NodeID, calleeID: NodeID, callStmt: Stmt): void {
        let callerNode = this.getNode(callerID) as CallGraphNode;
        let calleeNode = this.getNode(calleeID) as CallGraphNode;

        let callerNodeID = callerNode.getID();
        let calleeNodeID = calleeNode.getID();
        let callPairString = this.getCallPairString(callerNodeID, calleeNodeID);

        let callEdge = this.callPairToEdgeMap.get(callPairString);
        if (callEdge === undefined) {
            callEdge = new CallGraphEdge(callerNode, calleeNode);
            callEdge.getSrcNode().addOutgoingEdge(callEdge);
            callEdge.getDstNode().addIncomingEdge(callEdge);
            this.callPairToEdgeMap.set(callPairString, callEdge);
            this.edgeNum++;
        }
        callEdge.addInDirectCallSite(callStmt);
    }

    public getDynCallSiteByStmt(stmt: Stmt): DynCallSite | undefined {
        return this.stmtToDynCallSitemap.get(stmt);
    }

    public recordCallSite(stmt: Stmt, cs: CallSite): void {
        this.addStmtToCallSiteMap(stmt, cs);
        this.addMethodToCallSiteMap(cs.calleeFuncID, cs);
    }

    public addStmtToCallSiteMap(stmt: Stmt, cs: CallSite): boolean {
        if (this.stmtToCallSitemap.has(stmt)) {
            this.stmtToCallSitemap.get(stmt)!.push(cs);
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

    public getCallPairEdges(): Map<string, CallGraphEdge> {
        return this.callPairToEdgeMap;
    }

    public dump(name: string, entry?: FuncID): void {
        let printer = new GraphPrinter<this>(this);
        if (entry) {
            printer.setStartID(entry);
        }
        PrinterBuilder.dump(printer, name);
    }

    public dump2Json(name: string): void {
        let printer = new CallGraphJsonPrinter(this);
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
            for (let e of node.getOutgoingEdges() ?? []) {
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
        this.cgStat?.startStat();
    }

    public endStat(): void {
        this.cgStat?.endStat(this);
    }

    public printStat(): void {
        this.cgStat?.printStat();
    }

    public getStat(): string {
        return this.cgStat?.getStat() ?? '';
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

    public getCallSiteManager(): CallSiteManager {
        return this.csManager;
    }

    public getCallSiteInfo(csID: CallSiteID): string {
        const callSite = this.csManager.getCallSiteById(csID);
        if (!callSite) {
            return '';
        }

        const callerMethod = this.getMethodByFuncID(callSite.callerFuncID)!;
        const calleeMethod = this.getMethodByFuncID(callSite.getCalleeFuncID()!)!;

        return `CS[${csID}]: {${callerMethod.toString()} -> ${calleeMethod.toString()}}`;
    }
}