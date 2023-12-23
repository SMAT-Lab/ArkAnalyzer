import {AbstractCallGraphAlgorithm} from "./AbstractCallGraphAlgorithm";
import {MethodSignature} from "../core/ArkSignature";

class ClassHierarchyAnalysisAlgorithm extends AbstractCallGraphAlgorithm {
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression): MethodSignature[] {
        // TODO: 根据调用语句获取具体方法签名或函数签名
        let concreteMethod : MethodSignature;
        let callTargetMethods : MethodSignature[];

        // if (concreteMethod == null ||
        //     // concreteMethod.isStatic()) {
        //     // 若调用函数为静态方法直接返回签名
        //     // callTargetMethods.push(concreteMethod)
        //     // return callTargetMethods
        // } else {
        //     // TODO: 根据获取的方法签名获取可能的全部调用目标方法，方法签名需要包括所在类
        //     callTargetMethods = this.resolveAllCallTargets(concreteMethod)
        //     if (!concreteMethod.isAbstract()) {
        //         callTargetMethods.push(concreteMethod)
        //     }
        //     return callTargetMethods
        // }
        return []
    }

    protected resolveAllCallTargets(targetMethodSignature: MethodSignature): MethodSignature[] {
        // TODO: 对于给出方法签名，获取方法所在的类，并该类的所有子类，是否存在继承的方法
        return [];
    }
}