import { Scene } from "../Scene";
import { ArkNewExpr } from "../core/base/Expr";
import { Local } from "../core/base/Local";
import { ArkAssignStmt, Stmt } from "../core/base/Stmt";
import { ClassType } from "../core/base/Type";
import { Value } from "../core/base/Value";
import { ArkMethod } from "../core/model/ArkMethod";
import { MethodSignature } from "../core/model/ArkSignature";
import { isItemRegistered } from "../utils/callGraphUtils";
import { AbstractCallGraph } from "./AbstractCallGraphAlgorithm";
import { ClassHierarchyAnalysisAlgorithm } from "./ClassHierarchyAnalysisAlgorithm";
import { Pointer, PointerPair, PointerSet } from "./PointerAnalysis/Pointer";
import { PointerFlowGraph } from "./PointerAnalysis/PointerFlowGraph";

export class VariablePointerAnalysisAlogorithm extends AbstractCallGraph {
    private pointerFlowGraph: PointerFlowGraph
    private reachableStmts: Stmt[]
    private workList: PointerPair[]
    private reachableMethods: MethodSignature[]
    private CHAtool: ClassHierarchyAnalysisAlgorithm

    constructor(scene: Scene) {
        super(scene)
        this.workList = []
        this.reachableStmts = []
        this.reachableMethods = []
        this.pointerFlowGraph = new PointerFlowGraph()
        this.CHAtool = this.scene.scene.makeCallGraphCHA([]) as ClassHierarchyAnalysisAlgorithm
    }

    public loadCallGraph(entryPoints: MethodSignature[]) {
        this.processWorkList(entryPoints);
    }

    public processWorkList(entryPoints: MethodSignature[]): void {
        this.addReachable(entryPoints)
        while (this.workList.length != 0) {
            let workElement = this.workList.shift()
            let identifier = workElement!.getidentifier(), pointer = workElement!.getPointer()
            let pointerSet = this.pointerFlowGraph.getPointerSetElement(identifier)

            // 由于workList的结构是[标识符，单个指针]，因此在遍历时只需要检查当前指针是否存在于指针集中
            if (pointerSet.getPointer(pointer) == null) {
                continue
            }
            this.pointerFlowGraph.proPagate(identifier, pointer)
            if (identifier instanceof Local) {
                // TODO: 取、存属性的指针操作待支持
                this.processInvokeStmt(identifier, pointer)
            }
        }
    }

    protected resolveCall(sourceMethodSignature: MethodSignature, invokeStmt: Stmt): MethodSignature[] {
        throw new Error("Method not implemented.");
    }

    protected preProcessMethod(methodSignature: MethodSignature): void {
        throw new Error("Method not implemented.");
    }

    protected addReachable(entryPoints: MethodSignature[]) {
        for (let method of entryPoints) {
            if (isItemRegistered<MethodSignature>(
                method, this.reachableMethods,
                (a, b) => a.toString() === b.toString()
            )) {
                continue
            }

            this.reachableMethods.push(method)
            let arkMethodInstance = this.scene.getMethod(method)
            if (arkMethodInstance == null)
                continue
            let stmts = arkMethodInstance.getCfg().getStmts()
            this.reachableStmts.push(...stmts)

            for (let stmt of stmts) {
                if (stmt instanceof ArkAssignStmt) {
                    let leftOp = stmt.getLeftOp(), rightOp = stmt.getRightOp()

                    if (rightOp instanceof ArkNewExpr) {
                        let classType = rightOp.getType() as ClassType

                        this.workList.push(
                            new PointerPair(leftOp,
                                new Pointer(classType, Pointer.genLocation(method, stmt))))
                    } else if (rightOp instanceof Local) {
                        // TODO: 加边的时候，两个节点指针集需要怎么进行初始化
                        this.pointerFlowGraph.addPointerSetFlowEdge(
                            this.pointerFlowGraph.getPointerSetElement(rightOp),
                            this.pointerFlowGraph.getPointerSetElement(leftOp)
                        )
                    }
                }
            }
        }
    }

    protected processInvokeStmt(identifier: Value, pointer: Pointer) {
        for (let stmt of this.reachableStmts) {
            if (stmt.containsInvokeExpr()) {
                let expr = stmt.getInvokeExpr()
                if (expr === undefined) {
                    continue
                }
                // TODO: 判断是否是当前identifier的调用语句，否则continue
                let sourceMethod: ArkMethod = stmt.getCfg()?.getDeclaringMethod()!
                // TODO: 不能直接用CHA的调用解析，需要根据指针作为过滤条件，应该只能剩下一个具体函数？
                let possibleCallTargets: MethodSignature[] = this.CHAtool.resolveCall(
                    sourceMethod.getSignature()!,
                    stmt
                )

                let specificCallTarget: MethodSignature = new MethodSignature()
                if (!isItemRegistered<MethodSignature>(
                    specificCallTarget, this.getCall(sourceMethod.getSignature()),
                    (a, b) => a.toString() === b.toString()
                )) {
                    this.addCall(sourceMethod.getSignature(), specificCallTarget)
                    this.addMethod(sourceMethod.getSignature())

                    this.addReachable([specificCallTarget])

                    // TODO: 调用语句参数指针传播
                }
            }
        }
    }
}