import {AbstractCallGraphAlgorithm} from "./AbstractCallGraphAlgorithm";
import {MethodSignature} from "../core/model/ArkSignature";
import {ArkClass} from "../core/model/ArkClass";
import {ArkMethod} from "../core/model/ArkMethod";
import {isItemRegistered} from "./utils";

class ClassHierarchyAnalysisAlgorithm extends AbstractCallGraphAlgorithm {
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression): MethodSignature[] {
        let concreteMethodSignature: MethodSignature;
        let concreteMethod: ArkMethod;
        let callTargetMethods: MethodSignature[] = [];

        // TODO: 根据调用语句获取具体方法签名或函数签名
        // concreteMethodSignature = cfg.getMethodSignature(invokeExpression);
        concreteMethod = this.scene.getMethod(concreteMethodSignature)

        if (concreteMethodSignature == null ||
            concreteMethod.modifiers.includes("StaticKeyword") ||
            concreteMethod.modifiers.includes("Constructor")) {
            // If the invoked function is static or a constructor, then return the signature.
            callTargetMethods.push(concreteMethodSignature)
            return callTargetMethods
        } else {
            // Obtain all possible target method signatures based on the acquired method signature.
            let targetMethodSignatures = this.resolveAllCallTargets(concreteMethodSignature)
            for (let targetMethodSignature of targetMethodSignatures) {
                // remove abstract method
                let targetMethod = this.scene.getMethod(targetMethodSignature)
                if (!targetMethod.modifiers.includes("AbstractKeyword")) {
                    if (!isItemRegistered<MethodSignature>(
                        concreteMethodSignature, callTargetMethods,
                        (a, b) =>
                            a.toString() === b.toString()
                    )) {
                        callTargetMethods.push(concreteMethodSignature)
                    }
                }
            }
            return callTargetMethods
        }
    }

    protected resolveAllCallTargets(targetMethodSignature: MethodSignature): MethodSignature[] {
        let targetClasses: ArkClass[];
        let methodSignature: MethodSignature[] = [];

        targetClasses = this.scene.getExtendedClasses(targetMethodSignature.arkClass)
        for (let targetClass of targetClasses) {
            let methods = targetClass.getMethods()

            for (let method of methods) {
                if (method.methodSubSignature.toString() === targetMethodSignature.methodSubSignature.toString()) {
                    if (!isItemRegistered<ArkMethod>(
                        method, methods,
                        (a, b) =>
                            a.methodSignature.toString() === b.methodSignature.toString()
                    )) {
                        methodSignature.push(method.methodSignature)
                    }
                }
            }
        }
        return methodSignature;
    }

    protected preProcessMethod(methodSignature: MethodSignature): void {
        //do nothing
    }
}