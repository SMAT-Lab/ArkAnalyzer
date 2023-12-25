import {AbstractCallGraphAlgorithm} from "./AbstractCallGraphAlgorithm";
import {ClassSignature, MethodSignature, MethodSubSignature} from "../core/ArkSignature";
import {ArkClass} from "../core/ArkClass";
import {ArkFile} from "../core/ArkFile";
import {ArkMethod} from "../core/ArkMethod";

class ClassHierarchyAnalysisAlgorithm extends AbstractCallGraphAlgorithm {
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression): MethodSignature[] {
        // TODO: 根据调用语句获取具体方法签名或函数签名
        let concreteMethodSignature : MethodSignature;
        let concreteMethod : ArkMethod;
        let callTargetMethods : MethodSignature[];

        concreteMethodSignature = cfg.getMethodSignature(invokeExpression);
        concreteMethod = this.arkFiles.getMethod(concreteMethodSignature)

        if (concreteMethodSignature == null ||
            concreteMethod.modifiers.includes("StaticKeyword")) {
            // 若调用函数为静态方法直接返回签名
            callTargetMethods.push(concreteMethodSignature)
            return callTargetMethods
        } else {
            // TODO: 根据获取的方法签名获取可能的全部调用目标方法，方法签名需要包括所在类
            callTargetMethods = this.resolveAllCallTargets(concreteMethodSignature)
            return callTargetMethods
        }
        return []
    }

    protected resolveAllCallTargets(targetMethodSignature: MethodSignature): MethodSignature[] {
        // TODO: 对于给出方法签名，获取方法所在的类，并同时获取该类的所有子类，是否存在继承的方法
        // let targetClasses: ClassSignature[];
        // let methodSignature: MethodSignature[] = [];
        // targetClasses = []
        // for (let targetClass of targetClasses) {
        //     // TODO: 获取到类的信息
        //     let arkClass = arkFile.getClass(targetClass)
        //     let methods = arkClass.getMethods()
        //
        //     for (let method of methods) {
        //         // TODO: 后续需要考虑比较使用subSignature还是直接名字比较
        //         if (method.methodSubSignature === targetMethodSignature.methodSubSignature) {
        //             methodSignature.push(method.methodSignature)
        //         }
        //     }
        // }
        // return methodSignature;
        return []
    }

    protected preProcessMethod(methodSignature: MethodSignature): void {
        //do nothing
    }
}