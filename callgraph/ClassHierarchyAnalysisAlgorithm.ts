import {AbstractCallGraphAlgorithm} from "./AbstractCallGraphAlgorithm";
import {ClassSignature, MethodSignature, MethodSubSignature} from "../core/ArkSignature";
import {ArkClass} from "../core/ArkClass";
import {ArkFile} from "../core/ArkFile";
import {ArkMethod} from "../core/ArkMethod";

class ClassHierarchyAnalysisAlgorithm extends AbstractCallGraphAlgorithm {
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression): MethodSignature[] {
        let concreteMethodSignature : MethodSignature;
        let concreteMethod : ArkMethod;
        let callTargetMethods : MethodSignature[] = [];

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
                    callTargetMethods.push(concreteMethodSignature)
                }
            }
            return callTargetMethods
        }
    }

    protected resolveAllCallTargets(targetMethodSignature: MethodSignature): MethodSignature[] {
        // TODO: 对于给出方法签名，获取方法所在的类(done)，并同时获取该类的所有子类，是否存在继承的方法
        let targetClasses: ClassSignature[];
        let methodSignature: MethodSignature[] = [];
        targetClasses = [targetMethodSignature.arkClass]
        for (let targetClass of targetClasses) {
            let arkClass = this.scene.getClass(targetClass)
            let methods = arkClass.getMethods()

            for (let method of methods) {
                // TODO: 后续需要考虑比较使用subSignature还是直接名字比较
                if (method.methodSubSignature.toString() === targetMethodSignature.methodSubSignature.toString()) {
                    methodSignature.push(method.methodSignature)
                }
            }
        }
        return methodSignature;
    }

    protected preProcessMethod(methodSignature: MethodSignature): void {
        //do nothing
    }
}