import { AbstractInvokeExpr, ArkInstanceInvokeExpr, ArkNewExpr, ArkStaticInvokeExpr } from "../core/base/Expr";
import { ArkInvokeStmt } from "../core/base/Stmt";
import { ClassType } from "../core/base/Type";
import { Cfg } from "../core/graph/Cfg";
import { ArkClass } from "../core/model/ArkClass";
import { ArkMethod } from "../core/model/ArkMethod";
import { ClassSignature, MethodSignature } from "../core/model/ArkSignature";
import { isItemRegistered } from "../utils/callGraphUtils";
import { AbstractCallGraph } from "./AbstractCallGraphAlgorithm";

type Tuple = [MethodSignature, MethodSignature];
export class RapidTypeAnalysisAlgorithm extends AbstractCallGraph {
    private instancedClasses: Set<ClassSignature> = new Set<ClassSignature>()
    private ignoredCalls: Map<ClassSignature, Tuple[]> = new Map<ClassSignature, Tuple[]>()
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression: ArkInvokeStmt): MethodSignature[] {
        let concreteMethodSignature: MethodSignature;
        let concreteMethod: ArkMethod;
        let callTargetMethods: MethodSignature[] = [];
        let invokeExpressionExpr = invokeExpression.getInvokeExpr()

        let methodsFromInvoke = this.resolveInvokeExpr(
            invokeExpressionExpr,
            sourceMethodSignature.getDeclaringClassSignature().getDeclaringFileSignature().getFileName(),
            sourceMethodSignature)
        if (methodsFromInvoke == null) {
            return callTargetMethods
        }

        for (let methodFromInvoke of methodsFromInvoke) {
            concreteMethodSignature = methodFromInvoke.getSignature()
            concreteMethod = methodFromInvoke

            if (concreteMethodSignature == null) {
                // If the invoked function is static or a constructor, then return the signature.
                return callTargetMethods
            } else if ((invokeExpressionExpr instanceof ArkStaticInvokeExpr)) {
                callTargetMethods.push(concreteMethodSignature)
                return callTargetMethods
            } else {
                if (concreteMethodSignature.getMethodSubSignature().getMethodName() === "constructor") {
                    callTargetMethods.push(concreteMethodSignature)
                    return callTargetMethods
                }
                // Obtain all possible target method signatures based on the acquired method signature.
                let targetMethodSignatures = this.resolveAllCallTargets(concreteMethodSignature)
                for (let targetMethodSignature of targetMethodSignatures) {
                    // remove abstract method
                    let targetMethod = this.scene.getMethod(targetMethodSignature)
                    if (targetMethod == null) {
                        continue
                    }
                    if (!targetMethod.getModifiers().has("AbstractKeyword")) {
                        if (this.getInstancedClass(targetMethod.getDeclaringArkClass().getSignature()) !== null) {
                            if (!isItemRegistered<MethodSignature>(
                                targetMethod.getSignature(), callTargetMethods,
                                (a, b) =>
                                    a.toString() === b.toString()
                            )) {
                                callTargetMethods.push(targetMethodSignature)
                            }
                        } else {
                            this.saveIgnoredCalls(sourceMethodSignature, targetMethod.getSignature())
                        }
                    }
                }
            }
        }
        return callTargetMethods
    }

    protected resolveAllCallTargets(targetMethodSignature: MethodSignature): MethodSignature[] {
        let targetClasses: ArkClass[];
        let methodSignature: MethodSignature[] = [];

        targetClasses = this.scene.getExtendedClasses(targetMethodSignature.getDeclaringClassSignature())
        for (let targetClass of targetClasses) {
            let methods = targetClass.getMethods()

            for (let method of methods) {
                if (method.getSubSignature().toString() === targetMethodSignature.getMethodSubSignature().toString()) {
                    if (!isItemRegistered<MethodSignature>(
                        method.getSignature(), methodSignature,
                        (a, b) =>
                            a.toString() === b.toString()
                    )) {
                        methodSignature.push(method.getSignature())
                    }
                }
            }
        }
        return methodSignature;
    }

    /**
     * Preprocessing of the RTA method:
     * For the method being processed,
     * get all the newly instantiated classes within the method body,
     * and re-add the edges previously ignored from these classes back into the Call collection.
     *
     * @param methodSignature
     * @protected
     */
    protected preProcessMethod(methodSignature: MethodSignature): void {
        // 获取当前函数中新实例化的类
        let instancedClasses = this.collectInstantiatedClassesInMethod(methodSignature)
        const newlyInstancedClasses = instancedClasses.filter(item => !(this.getInstancedClass(item)!= null))
        for (let newInstancedClass of newlyInstancedClasses) {
            // Soot中前处理没看明白，先写个简单版本
            // Check from the ignoredCalls collection whether there are edges that need to be reactivated.
            let ignoredCallsOfSpecificClass: Tuple[] = this.getIgnoredCalls(newInstancedClass)
            if (ignoredCallsOfSpecificClass.length != 0) {
                for (let edge of ignoredCallsOfSpecificClass) {
                    this.addCall(edge[0], edge[1])
                    this.signatureManager.addToWorkList(edge[1])
                }
                this.ignoredCalls.delete(newInstancedClass)
            }
        }
    }

    /**
     * Retrieve the newly created class objects within the method.(WIP)
     *
     * @param methodSignature
     * @protected
     */
    protected collectInstantiatedClassesInMethod(methodSignature: MethodSignature): ClassSignature[] {
        // TODO: 需要考虑怎么收集不在当前method方法内的instancedClass
        //       确定哪些范围的变量需要收集信息
        let cfg: Cfg = this.scene.getMethod(methodSignature)!.getCfg()
        let newInstancedClass: ClassSignature[]
        newInstancedClass = []
        for (let stmt of cfg.getStmts()) {
            // TODO: 判断语句类型，如果是赋值语句且创建了新的实例，则获取类签名
            let stmtExpr = stmt.getExprs()[0]
            if (stmtExpr instanceof ArkNewExpr) {
                let classSignature: ClassSignature = (stmtExpr.getType() as ClassType).getClassSignature()
                if (classSignature != null) {
                    if (!isItemRegistered<ClassSignature>(
                        classSignature, newInstancedClass, (a, b) =>
                        a.toString() === b.toString()
                    )) {
                        newInstancedClass.push(classSignature)
                    }
                    this.addInstancedClass(classSignature)
                }
            }
        }
        return newInstancedClass
    }

    protected resolveInvokeExpr(invokeExpr: AbstractInvokeExpr,
        arkFileName: string,
        sourceMethodSignature: MethodSignature) {
        let callName = invokeExpr.getMethodSignature().getMethodSubSignature().getMethodName()
        let methodName: string = callName
        let classAndArkFileNames: Set<[string, string]> = new Set<[string, string]>()
        let callMethods: ArkMethod[] = []

        if (invokeExpr instanceof ArkInstanceInvokeExpr) {
            // logger.info("instanceInvoke:   "+invokeExpr.getMethodSignature().toString())
            let classCompleteType = invokeExpr.getBase().getType()
            if (classCompleteType instanceof ClassType) {
                let extendedClasses = this.scene.getExtendedClasses(classCompleteType.getClassSignature())
                for (let extendedClass of extendedClasses) {
                    for (let extendedMethod of extendedClass.getMethods()) {
                        if (extendedMethod.getName() === callName) {
                            if (!isItemRegistered<ArkMethod>(
                                extendedMethod, callMethods,
                                (a, b) =>
                                    a.getSignature().toString() === b.getSignature().toString()
                            )) {
                                callMethods.push(extendedMethod)
                            }
                        }
                    }
                }
            }
        } else if (invokeExpr instanceof ArkStaticInvokeExpr) {
            // logger.info("static:   "+invokeExpr.getMethodSignature().toString())
            if (callName.includes('.')) {
                // a.b()的静态调用
                let lastDotIndex = callName.lastIndexOf('.')
                let className = callName.substring(0, lastDotIndex)
                if (className === "this") {
                    let currentClass = this.scene.getClass(sourceMethodSignature.getDeclaringClassSignature())
                    classAndArkFileNames.add([currentClass!.getName(),
                    currentClass!.getDeclaringArkFile().getName()])
                } else {
                    classAndArkFileNames.add([className, arkFileName])
                    methodName = callName.substring(lastDotIndex + 1)
                }
            } else {
                // 函数调用
                let callFunction = this.scene.getMethod(invokeExpr.getMethodSignature())
                if (callFunction != null) {
                    if (!isItemRegistered<ArkMethod>(
                        callFunction, callMethods, (a, b) =>
                            a.getSignature().toString() === b.getSignature().toString()
                    )) {
                        callMethods.push(callFunction)
                    }
                }
            }
        }
        return callMethods
    }

    protected saveIgnoredCalls(sourceMethodSignature: MethodSignature, targetMethodSignature: MethodSignature): void {
        let notInstancedClass: ClassSignature = targetMethodSignature.getDeclaringClassSignature()
        // notice: 是被调用函数的类没有实例化才会被加入边，且调用关系会以被调用函数类作为key
        let ignoredCallsOfSpecificClass: Tuple[] = this.getIgnoredCalls(notInstancedClass)

        const callExists = ignoredCallsOfSpecificClass.some(ignoredCall =>
            ignoredCall[0].toString() === sourceMethodSignature.toString() &&
            ignoredCall[1].toString() === targetMethodSignature.toString()
        );
        if (callExists) {
            return;
        }
    
        if (ignoredCallsOfSpecificClass.length != 0) {
            // 当前集合中已经存在该类被忽略的边
            ignoredCallsOfSpecificClass.push([sourceMethodSignature, targetMethodSignature])
        } else {
            this.ignoredCalls.set(notInstancedClass, [[sourceMethodSignature, targetMethodSignature]])
        }
    }

    protected getIgnoredCalls(sourceClassSignature: ClassSignature): Tuple[] {
        for (let keyClassSignature of this.ignoredCalls.keys()) {
            if (keyClassSignature.toString() === sourceClassSignature.toString()) {
                return this.ignoredCalls.get(keyClassSignature)!
            }
        }
        return []
    }
    
    protected deleteIgnoredCalls(sourceClassSignature: ClassSignature): void {
        for (let keyClassSignature of this.ignoredCalls.keys()) {
            if (keyClassSignature.toString() === sourceClassSignature.toString()) {
                this.ignoredCalls.delete(keyClassSignature)
            }
        }
    }

    protected addInstancedClass(classSignature: ClassSignature) {
        for (let instanceClass of this.instancedClasses) {
            if (instanceClass.toString() === classSignature.toString()) {
                return
            }
        }
        this.instancedClasses.add(classSignature)
    }

    protected getInstancedClass(classSignature: ClassSignature): ClassSignature | null {
        for (let classSig of this.instancedClasses) {
            if (classSig.toString() === classSignature.toString()) {
                return classSig
            }
        }
        return null
    }
}