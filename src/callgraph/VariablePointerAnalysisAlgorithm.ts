import { Scene } from "../Scene";
import { AbstractInvokeExpr, ArkInstanceInvokeExpr, ArkNewExpr, ArkStaticInvokeExpr } from "../core/base/Expr";
import { Local } from "../core/base/Local";
import { ArkAssignStmt, ArkInvokeStmt, Stmt } from "../core/base/Stmt";
import { ClassType } from "../core/base/Type";
import { Value } from "../core/base/Value";
import { ArkMethod } from "../core/model/ArkMethod";
import { MethodSignature } from "../core/model/ArkSignature";
import { isItemRegistered } from "../utils/callGraphUtils";
import { AbstractCallGraph } from "./AbstractCallGraphAlgorithm";
import { ClassHierarchyAnalysisAlgorithm } from "./ClassHierarchyAnalysisAlgorithm";
import { Pointer, PointerTargetPair, PointerTarget } from "./PointerAnalysis/Pointer";
import { PointerFlowGraph } from "./PointerAnalysis/PointerFlowGraph";
import Logger, { LOG_LEVEL } from "../utils/logger";

const logger = Logger.getLogger();

export class VariablePointerAnalysisAlogorithm extends AbstractCallGraph {
    private pointerFlowGraph: PointerFlowGraph
    private reachableStmts: Stmt[]
    private workList: PointerTargetPair[]
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
        
        this.pointerFlowGraph.printPointerFlowGraph()
    }

    public processWorkList(entryPoints: MethodSignature[]): void {
        this.addReachable(entryPoints)
        while (this.workList.length != 0) {
            let workElement = this.workList.shift()
            // workList的结构是[指针，指向目标]
            let pointer = workElement!.getPointer(), pointerTarget = workElement!.getPointerTarget()
            let identifier = pointer.getIdentifier()

            logger.info("[processWorkList] process work item: "+(identifier as Local).getName()+" -> "+pointerTarget.getType())
            logger.info("\t"+pointerTarget.getLocation() + " "+pointerTarget.getType())
            let pointerSet = this.pointerFlowGraph.getPointerSetElement(identifier)

            if (!(pointerSet.getPointerTarget(pointerTarget) == null)) {
                continue
            }
            let newWorkListItems = this.pointerFlowGraph.proPagate(identifier, pointerTarget)
            for (let newWorkLisItem of newWorkListItems) {
                this.workList.push(newWorkLisItem)
            }
            if (identifier instanceof Local) {
                // TODO: 取、存属性的指针操作待支持
                this.processInstanceInvokeStmt(identifier, pointerTarget)
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
            logger.info("[addReachable] processing method: "+method.toString())
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
                        let pointer = new PointerTarget(classType, PointerTarget.genLocation(method, stmt))

                        logger.info("\t[addReachable] find new expr in method, add workList: "+(leftOp as Local).getName()+" -> "+pointer.getType())
                        this.workList.push(
                            new PointerTargetPair(this.pointerFlowGraph.getPointerSetElement(leftOp), pointer))
                    } else if (rightOp instanceof Local) {
                        logger.info("\t[addReachable] find assign expr in method, add pointer flow edge: "+(rightOp as Local).getName()+" -> "+(leftOp as Local).getType())
                        this.addEdgeIntoPointerFlowGraph(
                            this.pointerFlowGraph.getPointerSetElement(rightOp),
                            this.pointerFlowGraph.getPointerSetElement(leftOp)
                        )
                    } else if (rightOp instanceof ArkStaticInvokeExpr) {
                        let targetMethod = this.scene.getMethod(rightOp.getMethodSignature())
                        if (targetMethod == null) {
                            continue
                        }
                        this.addReachable([targetMethod.getSignature()])
                        this.processInvokePointerFlow(arkMethodInstance, targetMethod, stmt)
                    }
                } else if (stmt instanceof ArkInvokeStmt) {
                    let invokeExpr = stmt.getInvokeExpr()
                    if (invokeExpr instanceof ArkStaticInvokeExpr) {
                        let targetMethod = this.scene.getMethod(invokeExpr.getMethodSignature())
                        if (targetMethod == null) {
                            continue
                        }
                        this.addReachable([invokeExpr.getMethodSignature()])
                        this.processInvokePointerFlow(arkMethodInstance, targetMethod, stmt)
                    }
                }
            }
        }
    }

    protected processInstanceInvokeStmt(identifier: Value, pointer: PointerTarget) {
        logger.info("[processInvokeStmt] process identifier: "+(identifier as Local).getName())
        for (let stmt of this.reachableStmts) {
            if (stmt.containsInvokeExpr()) {
                let expr = stmt.getInvokeExpr()
                if (expr === undefined) {
                    continue
                }
                // 判断是否是当前identifier的调用语句，否则continue
                if (expr instanceof ArkInstanceInvokeExpr) {
                    // TODO: constructor调用
                    if (identifier != expr.getBase()) {
                        continue
                    }
                } else if (expr instanceof ArkStaticInvokeExpr) {
                    continue
                }
                let sourceMethod: ArkMethod = stmt.getCfg()?.getDeclaringMethod()!
                let possibleCallTargets: MethodSignature[] = this.CHAtool.resolveCall(
                    sourceMethod.getSignature()!,
                    stmt
                )
                // 对CHA结果进行过滤
                let specificCallTarget: MethodSignature | null = this.getSpecificCallTarget(possibleCallTargets, pointer)
                if (specificCallTarget == null) {
                    continue
                }
                logger.info("\t[processInvokeStmt] get specific call target: "+specificCallTarget.toString()+", from stmt: "+stmt.toString())

                // 根据过滤后结果获取到ArkMethod
                let targetMethod: ArkMethod | null = this.scene.getMethod(specificCallTarget)
                if (targetMethod == null) {
                    continue
                }

                let targetMethodThisInstance: Value | null = targetMethod.getThisInstance()
                if (targetMethodThisInstance == null) {
                    continue
                }

                logger.info("\t[processInvokeStmt] add pointer to call target this instance: "+pointer.getType())
                this.workList.push(new PointerTargetPair(
                    this.pointerFlowGraph.getPointerSetElement(targetMethodThisInstance),
                    pointer))

                this.processInvokePointerFlow(sourceMethod, targetMethod, stmt)
            }
        }
    }

    protected processInvokePointerFlow(sourceMethod: ArkMethod, targetMethod: ArkMethod, stmt: Stmt) {
        if (isItemRegistered<MethodSignature>(
            targetMethod.getSignature(), this.getCall(sourceMethod.getSignature()),
            (a, b) => a.toString() === b.toString()
        )) {
            return
        }
        // 如果当前调用关系没有被记录
        let expr = stmt.getInvokeExpr()
        if (expr == undefined) {
            return
        }
        let sourceMethodSignature: MethodSignature = sourceMethod.getSignature()
        let targetMethodSignature: MethodSignature = targetMethod.getSignature()

        this.addCall(sourceMethodSignature, targetMethodSignature)
        this.addMethod(sourceMethodSignature)
        // 将被调用方法加入到可到达集合中
        this.addReachable([targetMethodSignature])

        let parameters = expr.getArgs()
        let methodParameterInstances = targetMethod.getParameterInstances()
        logger.info("[processInvokeStmt] add pointer flow edges for invoke stmt parameter")
        for (let i = 0;i < parameters.length;i ++) {
            // 参数指针传递
            this.addEdgeIntoPointerFlowGraph(
                this.pointerFlowGraph.getPointerSetElement(parameters[i]),
                this.pointerFlowGraph.getPointerSetElement(methodParameterInstances[i])
            )
        }

        if (stmt instanceof ArkAssignStmt) {
            let returnValues = targetMethod.getReturnValues()
            for (let returnValue of returnValues) {
                this.addEdgeIntoPointerFlowGraph(
                    this.pointerFlowGraph.getPointerSetElement(returnValue),
                    this.pointerFlowGraph.getPointerSetElement(stmt.getLeftOp())
                )
            }
        }
    }

    protected addEdgeIntoPointerFlowGraph(source: Pointer, target: Pointer) {
        let newWorkListItems = this.pointerFlowGraph.addPointerFlowEdge(
            source, target
        )

        for (let newWorkListItem of newWorkListItems) {
            this.workList.push(newWorkListItem)
        }
    }

    protected getSpecificCallTarget(possibleCallTargets: MethodSignature[], pointerTarget: PointerTarget): MethodSignature | null {
        let type = pointerTarget.getType()
        if (!(type instanceof ClassType)) {
            return null
        }
 
        for (let possibleTarget of possibleCallTargets) {
            if (possibleTarget.getDeclaringClassSignature().toString() == 
            type.getClassSignature().toString()) {
                return possibleTarget
            }
        }
        return null
    }
}