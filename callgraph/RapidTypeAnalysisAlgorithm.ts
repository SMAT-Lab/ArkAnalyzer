import {AbstractCallGraphAlgorithm} from "./AbstractCallGraphAlgorithm";
import {ClassSignature, MethodSignature} from "../core/ArkSignature";

class RapidTypeAnalysisAlgorithm extends AbstractCallGraphAlgorithm {
    private instantiatedClasses : Set<ClassSignature>
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression): MethodSignature[] {
        // TODO: 根据调用语句获取具体方法，函数签名
        let concreteMethod : MethodSignature;
        let callTargetMethods : MethodSignature[];

        // if (concreteMethod == null ||
        //     concreteMethod.isStatic()) {
        //     // 若调用函数为静态方法直接返回签名
        //     callTargetMethods.push(concreteMethod)
        //     return callTargetMethods
        // } else {
        //     // TODO: 获取可能的全部调用目标方法
        //     callTargetMethods = this.resolveAllCallTargets()
        //     if (!concreteMethod.isAbstract()) {
        //         callTargetMethods.push(concreteMethod)
        //     }
        //     return callTargetMethods
        // }
        return []
    }

    protected resolveAllCallTargets(): MethodSignature[] {
        return [];
    }
}