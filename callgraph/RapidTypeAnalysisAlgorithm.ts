import {AbstractCallGraphAlgorithm} from "./AbstractCallGraphAlgorithm";
import {ClassSignature, MethodSignature, MethodSubSignature} from "../core/ArkSignature";
import {CFG} from "../core/base/Cfg";
import {ArkMethod} from "../core/ArkMethod";

type Tuple = [MethodSignature, MethodSignature];
class RapidTypeAnalysisAlgorithm extends AbstractCallGraphAlgorithm {
    private instancedClasses : Set<string>
    private ignoredCalls : Map<string, Tuple[]>
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression): MethodSignature[] {
        let concreteMethodSignature : MethodSignature;
        let concreteMethod : ArkMethod;
        let callTargetMethods : MethodSignature[] = [];

        // TODO: 根据调用语句获取具体方法，函数签名
        // concreteMethodSignature = cfg.getMethodSignature___(invokeExpression);
        concreteMethod = this.scene.getMethod(concreteMethodSignature)

        if (concreteMethodSignature == null ||
            concreteMethod.modifiers.includes("StaticKeyword") ||
            concreteMethod.modifiers.includes("Constructor")) {
            // 若调用函数为static, constructor直接返回签名
            callTargetMethods.push(concreteMethodSignature)
            return callTargetMethods
        } else {
            if (this.instancedClasses.has(sourceMethodSignature.arkClass.toString())) {
                // 获取可能的全部调用目标方法
                callTargetMethods = this.resolveAllCallTargets(sourceMethodSignature, concreteMethodSignature)
                if (!concreteMethod.modifiers.includes("AbstractKeyword")) {
                    callTargetMethods.push(concreteMethodSignature)
                }
            } else {
                this.saveIgnoredCalls(sourceMethodSignature, concreteMethodSignature)
            }
            return callTargetMethods
        }
    }

    protected resolveAllCallTargets(sourceMethodSignature, targetMethodSignature: MethodSignature): MethodSignature[] {
        // TODO: 对于给出方法签名，获取方法所在的类(done)，并该类的所有子类，是否存在继承的方法
        let targetClasses: ClassSignature[];
        let methodSignature: MethodSignature[] = [];
        targetClasses = []
        for (let targetClass of targetClasses) {
            // TODO: 获取到类的信息
            let arkClass = this.scene.getClass(targetClass)
            let methods = arkClass.getMethods()

            for (let method of methods) {
                if (method.methodSubSignature.toString() === targetMethodSignature.methodSubSignature.toString()) {
                    if (this.instancedClasses.has(targetClass.toString())) {
                        methodSignature.push(method.methodSignature)
                    } else {
                        this.saveIgnoredCalls(sourceMethodSignature, method.methodSignature)
                    }
                }
            }
        }
        return methodSignature;
    }

    protected preProcessMethod(methodSignature: MethodSignature): void {
        let newInstancedClasses = this.collectInstantiatedClassesInMethod(methodSignature)
        for (let newInstancedClass of newInstancedClasses) {
            // Soot中前处理没看明白，先写个简单版本
            // 从未实例化方法调用中检查是否有新的实例，并重新加入到calls中
            if (this.ignoredCalls.has(newInstancedClass.toString())) {
                let reinsertEdge = this.ignoredCalls.get(newInstancedClass.toString())
                for (let edge of reinsertEdge) {
                    this.addCall(edge[0], edge[1]);
                    if (!this.hasMethod(edge[1])) {
                        this.signatureManager.addToWorkList(edge[1]);
                    }
                }
                this.ignoredCalls.delete(newInstancedClass.toString())
            }
        }
    }

    // 获取方法中新创建的类对象
    protected collectInstantiatedClassesInMethod(methodSignature: MethodSignature): ClassSignature[] {
        let cfg : CFG = this.scene.getMethod(methodSignature).cfg;
        let newInstancedClass: ClassSignature[]
        newInstancedClass = []
        for (let stmt of cfg.statementArray) {
            if (stmt.type == "JAssignStmt") {
                // Soot中JAssignStmt代表赋值操作，如果赋值操作中右操作数是new语句，则获取类签名
                let classSignature: ClassSignature;
                if (!this.instancedClasses.has(classSignature.toString())) {
                    newInstancedClass.push(classSignature)
                    this.instancedClasses.add(classSignature.toString())
                }
            }
        }
        return newInstancedClass
    }

    protected saveIgnoredCalls(sourceMethodSignature, targetMethodSignature: MethodSignature) {
        let notInstancedClass = targetMethodSignature.arkClass
        if (this.ignoredCalls.has(notInstancedClass.toString())) {
            for (let ignoredCall of this.ignoredCalls.get(notInstancedClass.toString())) {
                if (ignoredCall[0].toString() == sourceMethodSignature.toString() && ignoredCall[1].toString() == targetMethodSignature.toString()) {
                    return
                }
            }
            this.ignoredCalls.get(notInstancedClass.toString()).push([sourceMethodSignature, targetMethodSignature])
        } else {
            this.ignoredCalls.set(notInstancedClass.toString(), [sourceMethodSignature.toString(), targetMethodSignature.toString()])
        }
    }
}