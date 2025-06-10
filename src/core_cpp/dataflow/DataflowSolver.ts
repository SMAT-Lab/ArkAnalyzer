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

import { Scene } from '../../Scene';
import { AbstractInvokeExpr } from '../base/Expr';
import { ArkInvokeStmt, ArkReturnStmt, ArkReturnVoidStmt, Stmt } from '../base/Stmt';
import { ArkMethod } from '../model/ArkMethod';
import { DataflowProblem, FlowFunction } from './DataflowProblem';
import { PathEdge, PathEdgePoint } from './Edge';
import { BasicBlock } from '../graph/BasicBlock';
import { CallGraph } from '../../callgraph/model/CallGraph';
import { ClassHierarchyAnalysis } from '../../callgraph/algorithm/ClassHierarchyAnalysis';
import { addCfg2Stmt } from '../../utils/entryMethodUtils';
import { getRecallMethodInParam } from './Util';
import { CallGraphBuilder } from '../../callgraph/model/builder/CallGraphBuilder';

/*
this program is roughly an implementation of the paper: Practical Extensions to the IFDS Algorithm.
compare to the original ifds paper : Precise Interprocedural Dataflow Analysis via Graph Reachability,
it have several improvments:
1. construct supergraph on demand(implement in this program);
2. use endSummary and incoming tables to speed up the program(implement in this program)
3. handle ssa form(not implement)
4. handle data facts which subsume another(not implement)
*/
type CallToReturnCacheEdge<D> = PathEdge<D>;

export abstract class DataflowSolver<D> {
    protected problem: DataflowProblem<D>;
    protected workList: Array<PathEdge<D>>;
    protected pathEdgeSet: Set<PathEdge<D>>;
    protected zeroFact: D;
    protected inComing: Map<PathEdgePoint<D>, Set<PathEdgePoint<D>>>;
    protected endSummary: Map<PathEdgePoint<D>, Set<PathEdgePoint<D>>>;
    protected summaryEdge: Set<CallToReturnCacheEdge<D>>; // summaryEdge不是加速一个函数内多次调用同一个函数，而是加速多次调用同一个函数f时，f内的函数调用
    protected scene: Scene;
    protected CHA!: ClassHierarchyAnalysis;
    protected stmtNexts: Map<Stmt, Set<Stmt>>;
    protected laterEdges: Set<PathEdge<D>> = new Set();

    constructor(problem: DataflowProblem<D>, scene: Scene) {
        this.problem = problem;
        this.scene = scene;
        scene.inferTypes();
        this.zeroFact = problem.createZeroValue();
        this.workList = new Array<PathEdge<D>>();
        this.pathEdgeSet = new Set<PathEdge<D>>();
        this.inComing = new Map<PathEdgePoint<D>, Set<PathEdgePoint<D>>>();
        this.endSummary = new Map<PathEdgePoint<D>, Set<PathEdgePoint<D>>>();
        this.summaryEdge = new Set<CallToReturnCacheEdge<D>>();
        this.stmtNexts = new Map();
    }

    public solve(): void {
        this.init();
        this.doSolve();
    }

    protected computeResult(stmt: Stmt, d: D): boolean {
        for (let pathEdge of this.pathEdgeSet) {
            if (pathEdge.edgeEnd.node === stmt && pathEdge.edgeEnd.fact === d) {
                return true;
            }
        }
        return false;
    }

    protected getChildren(stmt: Stmt): Stmt[] {
        return Array.from(this.stmtNexts.get(stmt) || []);
    }

    protected init(): void {
        let edgePoint: PathEdgePoint<D> = new PathEdgePoint<D>(this.problem.getEntryPoint(), this.zeroFact);
        let edge: PathEdge<D> = new PathEdge<D>(edgePoint, edgePoint);
        this.workList.push(edge);
        this.pathEdgeSet.add(edge);

        // build CHA
        let cg = new CallGraph(this.scene);
        this.CHA = new ClassHierarchyAnalysis(this.scene, cg, new CallGraphBuilder(cg, this.scene));
        this.buildStmtMapInClass();
        this.setCfg4AllStmt();
        return;
    }

    protected buildStmtMapInClass(): void {
        const methods = this.scene.getMethods();
        methods.push(this.problem.getEntryMethod());
        for (const method of methods) {
            const cfg = method.getCfg();
            const blocks: BasicBlock[] = [];
            if (cfg) {
                blocks.push(...cfg.getBlocks());
            }
            for (const block of blocks) {
                this.buildStmtMapInBlock(block);
            }
        }
    }

    protected buildStmtMapInBlock(block: BasicBlock): void {
        const stmts = block.getStmts();
        for (let stmtIndex = 0; stmtIndex < stmts.length; stmtIndex++) {
            const stmt = stmts[stmtIndex];
            if (stmtIndex !== stmts.length - 1) {
                this.stmtNexts.set(stmt, new Set([stmts[stmtIndex + 1]]));
            } else {
                const set: Set<Stmt> = new Set();
                for (const successor of block.getSuccessors()) {
                    set.add(successor.getStmts()[0]);
                }
                this.stmtNexts.set(stmt, set);
            }
        }
    }

    protected setCfg4AllStmt(): void {
        for (const cls of this.scene.getClasses()) {
            for (const mtd of cls.getMethods(true)) {
                addCfg2Stmt(mtd);
            }
        }
    }

    protected getAllCalleeMethods(callNode: ArkInvokeStmt): Set<ArkMethod> {
        const callSites = this.CHA.resolveCall(
            this.CHA.getCallGraph().getCallGraphNodeByMethod(this.problem.getEntryMethod().getSignature()).getID(),
            callNode
        );
        const methods: Set<ArkMethod> = new Set();
        for (const callSite of callSites) {
            const method = this.scene.getMethod(this.CHA.getCallGraph().getMethodByFuncID(callSite.calleeFuncID)!);
            if (method) {
                methods.add(method);
            }
        }
        return methods;
    }

    protected getReturnSiteOfCall(call: Stmt): Stmt {
        return [...this.stmtNexts.get(call)!][0];
    }

    protected getStartOfCallerMethod(call: Stmt): Stmt {
        const cfg = call.getCfg()!;
        const paraNum = cfg.getDeclaringMethod().getParameters().length;
        return [...cfg.getBlocks()][0].getStmts()[paraNum];
    }

    protected pathEdgeSetHasEdge(edge: PathEdge<D>): boolean {
        for (const path of this.pathEdgeSet) {
            this.problem.factEqual(path.edgeEnd.fact, edge.edgeEnd.fact);
            if (
                path.edgeEnd.node === edge.edgeEnd.node &&
                this.problem.factEqual(path.edgeEnd.fact, edge.edgeEnd.fact) &&
                path.edgeStart.node === edge.edgeStart.node &&
                this.problem.factEqual(path.edgeStart.fact, edge.edgeStart.fact)
            ) {
                return true;
            }
        }
        return false;
    }

    protected propagate(edge: PathEdge<D>): void {
        if (!this.pathEdgeSetHasEdge(edge)) {
            let index = this.workList.length;
            for (let i = 0; i < this.workList.length; i++) {
                if (this.laterEdges.has(this.workList[i])) {
                    index = i;
                    break;
                }
            }
            this.workList.splice(index, 0, edge);
            this.pathEdgeSet.add(edge);
        }
    }

    protected processExitNode(edge: PathEdge<D>): void {
        let startEdgePoint: PathEdgePoint<D> = edge.edgeStart;
        let exitEdgePoint: PathEdgePoint<D> = edge.edgeEnd;
        const summary = this.endSummary.get(startEdgePoint);
        if (summary === undefined) {
            this.endSummary.set(startEdgePoint, new Set([exitEdgePoint]));
        } else {
            summary.add(exitEdgePoint);
        }
        const callEdgePoints = this.inComing.get(startEdgePoint);
        if (callEdgePoints === undefined) {
            if (startEdgePoint.node.getCfg()!.getDeclaringMethod() === this.problem.getEntryMethod()) {
                return;
            }
            throw new Error('incoming does not have ' + startEdgePoint.node.getCfg()?.getDeclaringMethod().toString());
        }
        for (let callEdgePoint of callEdgePoints) {
            let returnSite: Stmt = this.getReturnSiteOfCall(callEdgePoint.node);
            let returnFlowFunc: FlowFunction<D> = this.problem.getExitToReturnFlowFunction(exitEdgePoint.node, returnSite, callEdgePoint.node);
            this.handleFacts(returnFlowFunc, returnSite, exitEdgePoint, callEdgePoint);
        }
    }

    private handleFacts(returnFlowFunc: FlowFunction<D>, returnSite: Stmt, exitEdgePoint: PathEdgePoint<D>, callEdgePoint: PathEdgePoint<D>): void {
        for (let fact of returnFlowFunc.getDataFacts(exitEdgePoint.fact)) {
            let returnSitePoint: PathEdgePoint<D> = new PathEdgePoint<D>(returnSite, fact);
            let cacheEdge: CallToReturnCacheEdge<D> = new PathEdge<D>(callEdgePoint, returnSitePoint);
            let summaryEdgeHasCacheEdge = false;
            for (const sEdge of this.summaryEdge) {
                if (sEdge.edgeStart === callEdgePoint && sEdge.edgeEnd.node === returnSite && sEdge.edgeEnd.fact === fact) {
                    summaryEdgeHasCacheEdge = true;
                    break;
                }
            }
            if (summaryEdgeHasCacheEdge) {
                continue;
            }
            this.summaryEdge.add(cacheEdge);
            let startOfCaller: Stmt = this.getStartOfCallerMethod(callEdgePoint.node);
            for (let pathEdge of this.pathEdgeSet) {
                if (pathEdge.edgeStart.node === startOfCaller && pathEdge.edgeEnd === callEdgePoint) {
                    this.propagate(new PathEdge<D>(pathEdge.edgeStart, returnSitePoint));
                }
            }
        }
    }

    protected processNormalNode(edge: PathEdge<D>): void {
        let start: PathEdgePoint<D> = edge.edgeStart;
        let end: PathEdgePoint<D> = edge.edgeEnd;
        let stmts: Stmt[] = [...this.getChildren(end.node)].reverse();
        for (let stmt of stmts) {
            let flowFunction: FlowFunction<D> = this.problem.getNormalFlowFunction(end.node, stmt);
            let set: Set<D> = flowFunction.getDataFacts(end.fact);
            for (let fact of set) {
                let edgePoint: PathEdgePoint<D> = new PathEdgePoint<D>(stmt, fact);
                const edge = new PathEdge<D>(start, edgePoint);
                this.propagate(edge);
                this.laterEdges.add(edge);
            }
        }
    }

    protected processCallNode(edge: PathEdge<D>): void {
        let start: PathEdgePoint<D> = edge.edgeStart;
        let callEdgePoint: PathEdgePoint<D> = edge.edgeEnd;
        const invokeStmt = callEdgePoint.node as ArkInvokeStmt;
        let callees: Set<ArkMethod>;
        if (this.scene.getFile(invokeStmt.getInvokeExpr().getMethodSignature().getDeclaringClassSignature().getDeclaringFileSignature())) {
            callees = this.getAllCalleeMethods(callEdgePoint.node as ArkInvokeStmt);
        } else {
            callees = new Set([getRecallMethodInParam(invokeStmt)!]);
        }
        let returnSite: Stmt = this.getReturnSiteOfCall(callEdgePoint.node);
        for (let callee of callees) {
            let callFlowFunc: FlowFunction<D> = this.problem.getCallFlowFunction(invokeStmt, callee);
            if (!callee.getCfg()) {
                continue;
            }
            let firstStmt: Stmt = [...callee.getCfg()!.getBlocks()][0].getStmts()[callee.getParameters().length];
            let facts: Set<D> = callFlowFunc.getDataFacts(callEdgePoint.fact);
            for (let fact of facts) {
                this.callNodeFactPropagate(edge, firstStmt, fact, returnSite);
            }
        }
        let callToReturnflowFunc: FlowFunction<D> = this.problem.getCallToReturnFlowFunction(edge.edgeEnd.node, returnSite);
        let set: Set<D> = callToReturnflowFunc.getDataFacts(callEdgePoint.fact);
        for (let fact of set) {
            this.propagate(new PathEdge<D>(start, new PathEdgePoint<D>(returnSite, fact)));
        }
        for (let cacheEdge of this.summaryEdge) {
            if (cacheEdge.edgeStart === edge.edgeEnd && cacheEdge.edgeEnd.node === returnSite) {
                this.propagate(new PathEdge<D>(start, cacheEdge.edgeEnd));
            }
        }
    }

    protected callNodeFactPropagate(edge: PathEdge<D>, firstStmt: Stmt, fact: D, returnSite: Stmt): void {
        let callEdgePoint: PathEdgePoint<D> = edge.edgeEnd;
        // method start loop path edge
        let startEdgePoint: PathEdgePoint<D> = new PathEdgePoint(firstStmt, fact);
        this.propagate(new PathEdge<D>(startEdgePoint, startEdgePoint));
        //add callEdgePoint in inComing.get(startEdgePoint)
        let coming: Set<PathEdgePoint<D>> | undefined;
        for (const incoming of this.inComing.keys()) {
            if (incoming.fact === startEdgePoint.fact && incoming.node === startEdgePoint.node) {
                coming = this.inComing.get(incoming);
                break;
            }
        }
        if (coming === undefined) {
            this.inComing.set(startEdgePoint, new Set([callEdgePoint]));
        } else {
            coming.add(callEdgePoint);
        }
        let exitEdgePoints: Set<PathEdgePoint<D>> = new Set();
        for (const end of Array.from(this.endSummary.keys())) {
            if (end.fact === fact && end.node === firstStmt) {
                exitEdgePoints = this.endSummary.get(end)!;
            }
        }
        for (let exitEdgePoint of exitEdgePoints) {
            let returnFlowFunc = this.problem.getExitToReturnFlowFunction(exitEdgePoint.node, returnSite, callEdgePoint.node);
            for (let returnFact of returnFlowFunc.getDataFacts(exitEdgePoint.fact)) {
                this.summaryEdge.add(new PathEdge<D>(edge.edgeEnd, new PathEdgePoint<D>(returnSite, returnFact)));
            }
        }
    }

    protected doSolve(): void {
        while (this.workList.length !== 0) {
            let pathEdge: PathEdge<D> = this.workList.shift()!;
            if (this.laterEdges.has(pathEdge)) {
                this.laterEdges.delete(pathEdge);
            }
            let targetStmt: Stmt = pathEdge.edgeEnd.node;
            if (this.isCallStatement(targetStmt)) {
                this.processCallNode(pathEdge);
            } else if (this.isExitStatement(targetStmt)) {
                this.processExitNode(pathEdge);
            } else {
                this.processNormalNode(pathEdge);
            }
        }
    }

    protected isCallStatement(stmt: Stmt): boolean {
        for (const expr of stmt.getExprs()) {
            if (expr instanceof AbstractInvokeExpr) {
                if (this.scene.getFile(expr.getMethodSignature().getDeclaringClassSignature().getDeclaringFileSignature())) {
                    return true;
                }
                if (stmt instanceof ArkInvokeStmt && getRecallMethodInParam(stmt)) {
                    return true;
                }
            }
        }
        return false;
    }

    protected isExitStatement(stmt: Stmt): boolean {
        return stmt instanceof ArkReturnStmt || stmt instanceof ArkReturnVoidStmt;
    }

    public getPathEdgeSet(): Set<PathEdge<D>> {
        return this.pathEdgeSet;
    }
}
