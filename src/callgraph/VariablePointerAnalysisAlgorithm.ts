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
import { LocalPointer, PointerTargetPair, PointerTarget, InstanceFieldPointer, StaticFieldPointer, Pointer } from "./PointerAnalysis/Pointer";
import { PointerFlowGraph } from "./PointerAnalysis/PointerFlowGraph";
import Logger, { LOG_LEVEL } from "../utils/logger";
import { AbstractFieldRef, ArkInstanceFieldRef, ArkStaticFieldRef } from "../core/base/Ref";

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
            let pointerSet: Pointer, identifier: Value | PointerTarget
            // workList的结构是[指针，指向目标]
            let pointer = workElement!.getPointer(), pointerTarget = workElement!.getPointerTarget()
            if (pointer instanceof LocalPointer) {
                identifier = pointer.getIdentifier()
                pointerSet = this.pointerFlowGraph.getPointerSetElement(identifier, null, null)

            } else if (pointer instanceof InstanceFieldPointer) {
                identifier = pointer.getBasePointerTarget()
                pointerSet = this.pointerFlowGraph.getPointerSetElement(null, identifier, pointer.getFieldSignature())

            } else if (pointer instanceof StaticFieldPointer) {
                pointerSet = this.pointerFlowGraph.getPointerSetElement(null, null, pointer.getFieldSignature())
            }

            // 检查当前指针是否已经存在于对应指针集中
            if (!(pointerSet!.getPointerTarget(pointerTarget) == null)) {
                continue
            }

            let newWorkListItems = this.pointerFlowGraph.proPagate(pointerSet!, pointerTarget)
            for (let newWorkLisItem of newWorkListItems) {
                this.workList.push(newWorkLisItem)
            }
            if (identifier! instanceof Local) {
                this.processFieldReferenceStmt(identifier!, pointerTarget)
                
                this.processInstanceInvokeStmt(identifier!, pointerTarget)
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
            // logger.info("[addReachable] processing method: "+method.toString())
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
                    if (!(leftOp instanceof Local)) {
                        continue
                    }
                    if (rightOp instanceof ArkNewExpr) {
                        let classType = rightOp.getType() as ClassType
                        let pointer = new PointerTarget(classType, PointerTarget.genLocation(method, stmt))

                        // logger.info("\t[addReachable] find new expr in method, add workList: "+(leftOp as Local).getName()+" -> "+pointer.getType())
                        this.workList.push(
                            new PointerTargetPair(this.pointerFlowGraph.getPointerSetElement(leftOp, null, null), pointer))
                    } else if (rightOp instanceof Local) {
                        // logger.info("\t[addReachable] find assign expr in method, add pointer flow edge: "+(rightOp as Local).getName()+" -> "+(leftOp as Local).getType())
                        this.addEdgeIntoPointerFlowGraph(
                            this.pointerFlowGraph.getPointerSetElement(rightOp, null, null),
                            this.pointerFlowGraph.getPointerSetElement(leftOp, null, null)
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
        // logger.info("[processInvokeStmt] process identifier: "+(identifier as Local).getName())
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
                let targetMethod: ArkMethod | null = this.getSpecificCallTarget(expr, pointer)
                if (targetMethod == null) {
                    continue
                }
                let specificCallTarget = targetMethod.getSignature()
                // logger.info("\t[processInvokeStmt] get specific call target: "+specificCallTarget.toString()+", from stmt: "+stmt.toString())

                let targetMethodThisInstance: Value | null = targetMethod.getThisInstance()
                if (targetMethodThisInstance == null) {
                    continue
                }

                // logger.info("\t[processInvokeStmt] add pointer to call target this instance: "+pointer.getType())
                this.workList.push(new PointerTargetPair(
                    this.pointerFlowGraph.getPointerSetElement(targetMethodThisInstance, null, null),
                    pointer))

                this.processInvokePointerFlow(sourceMethod, targetMethod, stmt)
            }
        }
    }

    protected processFieldReferenceStmt (identifier: Value, pointerTarget: PointerTarget) {
        // 将field的存与取操作合并
        for (let stmt of this.reachableStmts) {
            // TODO: getFieldRef接口可能包含了左值
            if (stmt instanceof ArkAssignStmt && stmt.containsFieldRef()) {
                // TODO: 对namespace中取field会拆分为两条语句，需要进行区分
                let fieldRef
                if ((fieldRef = this.getFieldRefFromUse(stmt)) != undefined) {
                    // 取属性
                    let fieldSignature = fieldRef.getFieldSignature()
                    if (fieldRef instanceof ArkInstanceFieldRef) {
                        let fieldBase = fieldRef.getBase()
                        if (fieldBase !== identifier) {
                            continue
                        }
                        this.addEdgeIntoPointerFlowGraph(
                            this.pointerFlowGraph.getPointerSetElement(null, pointerTarget, fieldSignature),
                            this.pointerFlowGraph.getPointerSetElement(stmt.getLeftOp(), null, null)
                        )
                    } else if (fieldRef instanceof ArkStaticFieldRef) {
                        this.addEdgeIntoPointerFlowGraph(
                            this.pointerFlowGraph.getPointerSetElement(null, null, fieldSignature),
                            this.pointerFlowGraph.getPointerSetElement(stmt.getLeftOp(), null, null)
                        )
                    }
                } else if ((fieldRef = this.getFieldFromDef(stmt)) != undefined) {
                    // 存属性
                    let fieldSignature = fieldRef.getFieldSignature()
                    if (fieldRef instanceof ArkInstanceFieldRef) {
                        let fieldBase = fieldRef.getBase()
                        if (fieldBase !== identifier) {
                            continue
                        }                        
                        this.addEdgeIntoPointerFlowGraph(
                            this.pointerFlowGraph.getPointerSetElement(stmt.getRightOp(), null, null),
                            this.pointerFlowGraph.getPointerSetElement(null, pointerTarget, fieldSignature)
                        )
                    } else if (fieldRef instanceof ArkStaticFieldRef) {
                        this.addEdgeIntoPointerFlowGraph(
                            this.pointerFlowGraph.getPointerSetElement(stmt.getRightOp(), null, null),
                            this.pointerFlowGraph.getPointerSetElement(null, null, fieldRef.getFieldSignature())
                        )
                    }
                }
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
        // logger.info("[processInvokeStmt] add pointer flow edges for invoke stmt parameter")
        for (let i = 0;i < parameters.length;i ++) {
            // 参数指针传递
            this.addEdgeIntoPointerFlowGraph(
                this.pointerFlowGraph.getPointerSetElement(parameters[i], null, null),
                this.pointerFlowGraph.getPointerSetElement(methodParameterInstances[i], null, null)
            )
        }

        if (stmt instanceof ArkAssignStmt) {
            let returnValues = targetMethod.getReturnValues()
            for (let returnValue of returnValues) {
                this.addEdgeIntoPointerFlowGraph(
                    this.pointerFlowGraph.getPointerSetElement(returnValue, null, null),
                    this.pointerFlowGraph.getPointerSetElement(stmt.getLeftOp(), null, null)
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

    protected getSpecificCallTarget(expr: AbstractInvokeExpr, pointerTarget: PointerTarget): ArkMethod | null {
        let type = pointerTarget.getType()
        if (!(type instanceof ClassType)) {
            return null
        }
        let arkClassInstance = this.scene.getClass(type.getClassSignature())
        if (arkClassInstance == null) {
            logger.error("can not resolve classtype: "+type.toString())
            return null
        }
        const methodInstances = arkClassInstance.getMethods()
        for (let method of methodInstances) {
            if (method.getSignature().getMethodSubSignature().toString() === expr.getMethodSignature().getMethodSubSignature().toString()) {
                return method
            }
        }
        return null
    }

    protected getFieldRefFromUse(stmt: Stmt) {
        for (let use of stmt.getUses()) {
            if (use instanceof AbstractFieldRef) {
                return use as AbstractFieldRef;
            }
        }
    }

    protected getFieldFromDef(stmt: Stmt) {
        let def = stmt.getDef()
        if (def instanceof AbstractFieldRef) {
            return def as AbstractFieldRef;
        }
    }

    public updateVariableType() {
        
    }
}