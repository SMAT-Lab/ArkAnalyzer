import { Scene } from "../../Scene";
import { ClassHierarchyAnalysisAlgorithm } from "../../callgraph/ClassHierarchyAnalysisAlgorithm";
import { StmtReader } from "../../save/source/SourceBody";
import { ArkInvokeStmt, ArkReturnStmt, ArkReturnVoidStmt, Stmt } from "../base/Stmt";
import { Type } from "../base/Type";
import { Value } from "../base/Value";
import { ModelUtils } from "../common/ModelUtils";
import { ArkClass } from "../model/ArkClass";
import { ArkMethod } from "../model/ArkMethod";
import { DataflowProblem, FlowFunction } from "./DataflowProblem";
import { DataflowResult } from "./DataflowResult";
import {PathEdge, PathEdgePoint} from "./Edge"

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
    
    private problem: DataflowProblem<D>;
    private workList: Array<PathEdge<D>>;
    private pathEdgeSet : Set<PathEdge<D>>;
    private zeroFact:D;
    private inComing:Map<PathEdgePoint<D>,Set<PathEdgePoint<D>>>;
    private endSummary:Map<PathEdgePoint<D>,Set<PathEdgePoint<D>>>;
    private summaryEdge:Set<CallToReturnCacheEdge<D>>;
    private scene:Scene;
    private CHA:ClassHierarchyAnalysisAlgorithm;
    private stmtNexts:Map<Stmt,Set<Stmt>>;

    constructor(problem: DataflowProblem<D>, scene: Scene) {
        this.problem = problem;
        this.scene = scene;
        scene.inferTypes();
        this.zeroFact = problem.createZeroValue();
        this.workList = new Array<PathEdge<D>>();
        this.pathEdgeSet = new Set<PathEdge<D>>();
        this.inComing = new Map<PathEdgePoint<D>,Set<PathEdgePoint<D>>>();
        this.endSummary = new Map<PathEdgePoint<D>,Set<PathEdgePoint<D>>>();
        this.summaryEdge = new Set<CallToReturnCacheEdge<D>>();
        this.stmtNexts = new Map();
    }


    public solve() {
        this.init();
        this.doSolve();
    }

    protected computeResult(stmt:Stmt, d:D) : boolean {
        for (let pathEdge of this.pathEdgeSet) {
            if (pathEdge.edgeEnd.node == stmt && pathEdge.edgeEnd.fact == d) {
                return true;
            }
        }
        return false;
    }

    protected getChildren(stmt:Stmt) : Stmt[] {
        return Array.from(this.stmtNexts.get(stmt) || []);
    }

    protected init() {
        let edgePoint : PathEdgePoint<D> = new PathEdgePoint<D>(this.problem.getEntryPoint(), this.zeroFact);
        let edge : PathEdge<D> = new PathEdge<D>(edgePoint, edgePoint);
        this.workList.push(edge);
        this.pathEdgeSet.add(edge);

        // build CHA
        this.CHA = this.scene.makeCallGraphCHA([this.problem.getEntryMethod().getSignature()]) as ClassHierarchyAnalysisAlgorithm;
        this.buildStmtMap()

        return;
    }

    private buildStmtMapInClass(clas: ArkClass){
        for (const method of clas.getMethods()){
            for (const block of method.getCfg().getBlocks()){
                const stmts = block.getStmts()
                for (let stmtIndex = 0; stmtIndex < stmts.length; stmtIndex++) {
                    const stmt = stmts[stmtIndex];
                    if (stmtIndex != stmts.length - 1){
                        this.stmtNexts.set(stmt, new Set([stmts[stmtIndex + 1]]));
                    }
                    else {
                        const set:Set<Stmt> = new Set();
                        for (const successor of block.getSuccessors()){
                            set.add(successor.getStmts()[0]);
                        }
                        this.stmtNexts.set(stmt, set);
                    }
                }
            }
        }
    }
    
    private buildStmtMap() {
        for (const file of this.scene.getFiles()){
            for (const ns of file.getNamespaces()){
                for (const clas of ns.getClasses()){
                    this.buildStmtMapInClass(clas);
                }
            }
            for (const clas of file.getClasses()){
                this.buildStmtMapInClass(clas);
            }
        }

    }

    protected getAllCalleeMethods(callNode:ArkInvokeStmt) : Set<ArkMethod> {
        const methodSignatures = this.CHA.resolveCall(this.problem.getEntryMethod().getSignature(),callNode);
        const methods:Set<ArkMethod> = new Set();
        for (const methodSignature of methodSignatures){
            const method = ModelUtils.getMethodWithMethodSignature(methodSignature,this.scene);
            if (method){
                methods.add(method);
            }
        }
        return methods;
    }

    protected getReturnSiteOfCall(call:Stmt) : Stmt {
        return [...this.stmtNexts.get(call)!][0];
    }

    protected getStartOfCallerMethod(call:Stmt) : Stmt {
        const cfg = call.getCfg()!;
        const paraNum = cfg.getDeclaringMethod().getParameters().length
        return [...cfg.getBlocks()][0].getStmts()[paraNum];
    }

    protected pathEdgeSetHasEdge(edge :PathEdge<D>) {
        for (const path of this.pathEdgeSet){
            if (path.edgeEnd.node == edge.edgeEnd.node && path.edgeEnd.fact == edge.edgeEnd.fact &&
                 path.edgeStart.node == path.edgeStart.node && path.edgeStart.fact == edge.edgeStart.fact){
                    return true;
                 }
        }
        return false;
    }

    protected propagate(edge : PathEdge<D>) {
        if (!this.pathEdgeSetHasEdge(edge)) {
            this.workList.push(edge);
            this.pathEdgeSet.add(edge);
        }
    }

    protected processExitNode(edge:PathEdge<D>) {
        let startEdgePoint : PathEdgePoint<D> = edge.edgeStart;
        let exitEdgePoint: PathEdgePoint<D> = edge.edgeEnd;
        const summary = this.endSummary.get(startEdgePoint);
        if (summary == undefined){
            this.endSummary.set(startEdgePoint, new Set([exitEdgePoint]));
        }
        else {
            summary.add(exitEdgePoint);
        }
        const callEdgePoints = this.inComing.get(startEdgePoint);
        if (callEdgePoints == undefined){
            throw new Error("incoming does not have "+startEdgePoint.node.getCfg()?.getDeclaringMethod().toString());
        }
        for (let callEdgePoint of callEdgePoints) {
            let returnSite : Stmt = this.getReturnSiteOfCall(callEdgePoint.node);
            let returnFlowFunc : FlowFunction<D> = this.problem.getExitToReturnFlowFunction(exitEdgePoint.node, returnSite, callEdgePoint.node);
            for (let fact of returnFlowFunc.getDataFacts(exitEdgePoint.fact)) {
                let returnSitePoint: PathEdgePoint<D> = new PathEdgePoint<D>(returnSite, fact);
                let cacheEdge : CallToReturnCacheEdge<D> = new PathEdge<D>(callEdgePoint, returnSitePoint);
                let summaryEdgeHasCacheEdge = false;
                for (const sEdge of this.summaryEdge){
                    if (sEdge.edgeStart == callEdgePoint && sEdge.edgeEnd.node == returnSite && sEdge.edgeEnd.fact == fact){
                        summaryEdgeHasCacheEdge = true;
                        break;
                    }
                }
                if (!summaryEdgeHasCacheEdge) {
                    this.summaryEdge.add(cacheEdge);
                    let startOfCaller : Stmt = this.getStartOfCallerMethod(callEdgePoint.node);
                    for (let pathEdge of this.pathEdgeSet) {
                        if (pathEdge.edgeStart.node == startOfCaller && pathEdge.edgeEnd == callEdgePoint) {
                            this.propagate(new PathEdge<D>(pathEdge.edgeStart, returnSitePoint));
                        }
                    }
                }
            }
        }
    }

    protected processNormalNode(edge:PathEdge<D>) {
        let start : PathEdgePoint<D> =  edge.edgeStart;
        let end : PathEdgePoint<D> =  edge.edgeEnd;
        let stmts : Stmt[] = this.getChildren(end.node);
        for (let stmt of stmts) {
            let flowFunction : FlowFunction<D> = this.problem.getNormalFlowFunction(end.node, stmt);
            let set : Set<D> = flowFunction.getDataFacts(end.fact);
            for (let fact of set) {
                let edgePoint : PathEdgePoint<D> = new PathEdgePoint<D>(stmt, fact);
                this.propagate(new PathEdge<D>(start, edgePoint));
            }
        }
    }

    protected processCallNode(edge:PathEdge<D>) {
        let start:PathEdgePoint<D>= edge.edgeStart;
        let callEdgePoint:PathEdgePoint<D> = edge.edgeEnd;
        let callees:Set<ArkMethod> = this.getAllCalleeMethods(callEdgePoint.node as ArkInvokeStmt);
        let callNode: Stmt = edge.edgeEnd.node;
        for (let callee of callees) {
            let callFlowFunc:FlowFunction<D> = this.problem.getCallFlowFunction(callNode, callee);
            let firstStmt:Stmt = [...callee.getCfg().getBlocks()][0].getStmts()[callee.getParameters().length];
            let facts:Set<D> = callFlowFunc.getDataFacts(callEdgePoint.fact);
            let returnSite: Stmt = this.getReturnSiteOfCall(callEdgePoint.node);
            for (let fact of facts) {
                // method start loop path edge
                let startEdgePoint:PathEdgePoint<D>  = new PathEdgePoint(firstStmt, fact);
                this.propagate(new PathEdge<D>(startEdgePoint,startEdgePoint));
                //add callEdgePoint in inComing.get(startEdgePoint)
                const coming = this.inComing.get(startEdgePoint);
                if (coming == undefined){
                    this.inComing.set(startEdgePoint, new Set([callEdgePoint]));
                }
                else {
                    coming.add(callEdgePoint);
                }
                let exitEdgePoints:Set<PathEdgePoint<D>> = new Set();
                for (const end of Array.from(this.endSummary.keys())){
                    if (end.fact == fact && end.node == firstStmt){
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
            let callToReturnflowFunc:FlowFunction<D> = this.problem.getCallToReturnFlowFunction(edge.edgeEnd.node, returnSite);
            let set : Set<D> = callToReturnflowFunc.getDataFacts(callEdgePoint.fact);
            for (let fact of set) {
                this.propagate(new PathEdge<D>(start, new PathEdgePoint<D>(returnSite, fact)));
            }
            for (let cacheEdge of this.summaryEdge) {
                if (cacheEdge.edgeStart == edge.edgeEnd && cacheEdge.edgeEnd.node == returnSite) {
                    this.propagate(new PathEdge<D>(start, cacheEdge.edgeEnd));
                }
            }
        }
    }

    protected doSolve() {
        while (this.workList.length != 0) {
            let pathEdge:PathEdge<D> = this.workList.pop()!;
            let targetStmt : Stmt = pathEdge.edgeEnd.node;
            if (this.isCallStatement(targetStmt)) {
                this.processCallNode(pathEdge)
            } else if (this.isExitStatement(targetStmt)) {
                this.processExitNode(pathEdge);
            } else {
                this.processNormalNode(pathEdge);
            }
        }
    }

    protected isCallStatement(stmt:Stmt) : boolean {
        return stmt.containsInvokeExpr();
    }

    protected isExitStatement(stmt:Stmt) : boolean {
        return stmt instanceof ArkReturnStmt;
    }

    public getPathEdgeSet(): Set<PathEdge<D> >{
        return this.pathEdgeSet;
    }
}




