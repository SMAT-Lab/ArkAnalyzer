import {AbstractCallGraphAlgorithm} from "./AbstractCallGraphAlgorithm";
import {ClassSignature, MethodSignature, MethodSubSignature} from "../core/ArkSignature";
import {CFG} from "../core/base/Cfg";
import {ArkMethod} from "../core/ArkMethod";

type Tuple = [MethodSignature, MethodSignature];
class RapidTypeAnalysisAlgorithm extends AbstractCallGraphAlgorithm {
    private instancedClasses : Set<ClassSignature>
    // TODO: ignoredCalls未做重复检查
    private ignoredCalls : Map<ClassSignature, Tuple[]>
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression): MethodSignature[] {
        let concreteMethodSignature : MethodSignature;
        let concreteMethod : ArkMethod;
        let callTargetMethods : MethodSignature[];

        // TODO: 根据调用语句获取具体方法，函数签名
        // concreteMethodSignature = cfg.getMethodSignature(invokeExpression);
        concreteMethod = this.arkFiles.getMethod(concreteMethodSignature)

        if (concreteMethodSignature == null ||
            concreteMethod.modifiers.includes("StaticKeyword")) {
            // 若调用函数为静态方法直接返回签名
            callTargetMethods.push(concreteMethodSignature)
            return callTargetMethods
        } else {
            if (this.instancedClasses.has(sourceMethodSignature.arkClass)) {
                // 获取可能的全部调用目标方法
                callTargetMethods = this.resolveAllCallTargets(sourceMethodSignature, concreteMethodSignature)
                if (!concreteMethod.modifiers.includes("AbstractKeyword")) {
                    callTargetMethods.push(concreteMethodSignature)
                }
            } else {
                // TODO: 未实例化需要加入到ignoredCalls中

            }
            return callTargetMethods
        }
        return []
    }

    protected resolveAllCallTargets(sourceMethodSignature, targetMethodSignature: MethodSignature): MethodSignature[] {
        // TODO: 对于给出方法签名，获取方法所在的类，并该类的所有子类，是否存在继承的方法
        let targetClasses: ClassSignature[];
        let methodSignature: MethodSignature[] = [];
        targetClasses = []
        for (let targetClass of targetClasses) {
            // TODO: 获取到类的信息
            // let arkClass = arkFile.getClass(targetClass)
            // let methods = arkClass.getMethods()

            // for (let method of methods) {
            //     // TODO: 后续需要考虑比较使用subSignature还是直接名字比较
            //     if (method.methodSubSignature === targetMethodSignature.methodSubSignature) {
            //         if (this.instancedClasses.has(targetClass)) {
            //             methodSignature.push(method.methodSignature)
            //         } else {
            //             this.saveIgnoredCalls(sourceMethodSignature, method)
            //         }
            //     }
            // }
        }
        return methodSignature;
    }

    protected preProcessMethod(methodSignature: MethodSignature): void {
        let newInstancedClasses = this.collectInstantiatedClassesInMethod(methodSignature)
        for (let newInstancedClass of newInstancedClasses) {
            // Soot 中前处理没看明白，先写个简单版本
            // 从未实例化方法调用中检查是否有新的实例，并重新加入到calls中
            if (this.ignoredCalls.has(newInstancedClass)) {
                let reinsertEdge = this.ignoredCalls.get(newInstancedClass)
                for (let edge of reinsertEdge) {
                    this.addCall(edge[0], edge[1]);
                    if (!this.hasMethod(edge[1])) {
                        this.signatureManager.addToWorkList(edge[1]);
                    }
                }
                this.ignoredCalls.delete(newInstancedClass)
            }
        }
    }

    // 获取方法中新创建的类对象
    protected collectInstantiatedClassesInMethod(methodSignature: MethodSignature): ClassSignature[] {
        let cfg : CFG;
        // let instancedClass, newInstancedClass: ClassSignature[]
        // TODO: 获取cfg中的语句
        // for (let stmt of cfg.?) {
        //     if (stmt.kindProperty == JAssignStmt) {
        //         let classSignature = getClassSignature();
        //         if (this.instancedClasses.has(classSignature)) {
        //
        //         } else {
        //             newInstancedClass.push(classSignature)
        //         }
        //     }
        // }
        // return newInstancedClass
        return []
    }

    protected saveIgnoredCalls(sourceMethodSignature, targetMethodSignature: MethodSignature) {
        let notInstancedClass = targetMethodSignature.arkClass
        if (this.ignoredCalls.has(notInstancedClass)) {
            this.ignoredCalls.get(notInstancedClass).push([sourceMethodSignature, targetMethodSignature])
        } else {
            this.ignoredCalls.set(notInstancedClass, [sourceMethodSignature, targetMethodSignature])
        }
    }
}