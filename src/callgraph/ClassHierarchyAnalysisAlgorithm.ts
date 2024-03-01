import path from "path";
import { AbstractInvokeExpr, ArkInstanceInvokeExpr, ArkStaticInvokeExpr } from "../core/base/Expr";
import { ArkInvokeStmt } from "../core/base/Stmt";
import { ArkClass } from "../core/model/ArkClass";
import { ArkFile } from "../core/model/ArkFile";
import { ArkMethod } from "../core/model/ArkMethod";
import { ClassSignature, MethodSignature } from "../core/model/ArkSignature";
import {isItemRegistered} from "../utils/callGraphUtils";
import {getArkFileByName, matchClassInFile, searchImportMessage, splitType} from "../utils/typeReferenceUtils";
import { AbstractCallGraphAlgorithm } from "./AbstractCallGraphAlgorithm";
import { ModelUtils } from "../core/common/ModelUtils";
import { ClassType } from "../core/base/Type";

export class ClassHierarchyAnalysisAlgorithm extends AbstractCallGraphAlgorithm {
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression: ArkInvokeStmt): MethodSignature[] {
        let concreteMethodSignature: MethodSignature|null = null;
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

    protected preProcessMethod(methodSignature: MethodSignature): void {
        //do nothing
    }
    
    protected resolveInvokeExpr(invokeExpr: AbstractInvokeExpr,
                                arkFileName: string,
                                sourceMethodSignature: MethodSignature) {
        let callName = invokeExpr.getMethodSignature().getMethodSubSignature().getMethodName()
        let methodName: string = callName
        let classAndArkFileNames: Set<[string, string]> = new Set<[string, string]>()
        let callMethods: ArkMethod[] = []

        // TODO: 对于基本类型的固定方法，需要讨论是否可以给这些类创建一个ArkClass
        if (invokeExpr instanceof ArkInstanceInvokeExpr) {
            // console.log("instanceInvoke:   "+invokeExpr.getMethodSignature().toString())
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
            // console.log("static:   "+invokeExpr.getMethodSignature().toString())
            if (callName.includes('.')) {
                // a.b()的静态调用
                // TODO: 上游信息有误
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
                        callFunction, callMethods,
                        (a, b) =>
                            a.getSignature().toString() === b.getSignature().toString()
                    )) {
                        callMethods.push(callFunction)
                    }
                }
            }
        }
        return callMethods
    }
}