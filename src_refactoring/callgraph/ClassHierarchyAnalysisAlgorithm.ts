import { AbstractInvokeExpr, ArkInstanceInvokeExpr, ArkStaticInvokeExpr } from "../core/base/Expr";
import { Stmt } from "../core/base/Stmt";
import { ClassType } from "../core/base/Type";
import { ArkClass } from "../core/model/ArkClass";
import { ArkMethod } from "../core/model/ArkMethod";
import { MethodSignature } from "../core/model/ArkSignature";
import { isItemRegistered } from "../utils/callGraphUtils";
import { AbstractCallGraph } from "./AbstractCallGraphAlgorithm";

export class ClassHierarchyAnalysisAlgorithm extends AbstractCallGraph {
    public resolveCall(sourceMethodSignature: MethodSignature, invokeStmt: Stmt): MethodSignature[] {
        let concreteMethodSignature: MethodSignature|null = null;
        let concreteMethod: ArkMethod;
        let callTargetMethods: MethodSignature[] = [];
        let invokeExpressionExpr = invokeStmt.getInvokeExpr()
        if (invokeExpressionExpr === undefined) {
            return []
        }

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
                    if (!targetMethod.getDeclaringArkClass().getModifiers().has("AbstractKeyword") && 
                    !targetMethod.getModifiers().has("AbstractKeyword")) {
                        if (!isItemRegistered<MethodSignature>(
                            targetMethod.getSignature(), callTargetMethods,
                            (a, b) =>
                                a.toString() === b.toString()
                        )) {
                            callTargetMethods.push(targetMethodSignature)
                        }
                    }
                }
            }
        }
        return callTargetMethods
    }

    /**
     * get all possible call target
     * get extended classes corresponding to target class
     * filter all method under the classes
     * 
     * @param targetMethodSignature 
     * @returns 
     */
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
     * resolve expr in the invoke stmt
     * 
     * @param invokeExpr 
     * @param arkFileName 
     * @param sourceMethodSignature 
     * @returns 
     * instance invoke: get base variable class type, return corresponding method under class
     * static invoke: return normal static method and function invoke
     */
    protected resolveInvokeExpr(invokeExpr: AbstractInvokeExpr,
        arkFileName: string,
        sourceMethodSignature: MethodSignature) {
        let callName = invokeExpr.getMethodSignature().getMethodSubSignature().getMethodName()
        let methodName: string = callName
        let classAndArkFileNames: Set<[string, string]> = new Set<[string, string]>()
        let callMethods: ArkMethod[] = []

        // TODO: ts库、常用库未扫描，导致console.log等调用无法识别
        if (invokeExpr instanceof ArkInstanceInvokeExpr) {
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
            let callFunction = this.scene.getMethod(invokeExpr.getMethodSignature())
            if (callFunction != null) {
                if (!isItemRegistered<ArkMethod>(
                    callFunction, callMethods,
                    (a, b) =>
                        a.getSignature().toString() === b.getSignature().toString()
                )) {
                    callMethods.push(callFunction)
                }
            }
        }
        return callMethods
    }

    protected preProcessMethod(methodSignature: MethodSignature): void {
        //do nothing
    }
}