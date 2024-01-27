import {AbstractCallGraphAlgorithm} from "./AbstractCallGraphAlgorithm";
import {ClassSignature, MethodSignature, MethodSubSignature} from "../core/model/ArkSignature";
import {ArkMethod} from "../core/model/ArkMethod";
import {isItemRegistered} from "./utils";

type Tuple = [MethodSignature, MethodSignature];
class RapidTypeAnalysisAlgorithm extends AbstractCallGraphAlgorithm {
    private instancedClasses : Set<string>
    private ignoredCalls : Map<string, Tuple[]>
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression): MethodSignature[] {
        let concreteMethodSignature : MethodSignature;
        let concreteMethod : ArkMethod;
        let callTargetMethods : MethodSignature[] = [];

        // TODO: 根据调用语句获取具体方法签名或函数签名
        // concreteMethodSignature = cfg.getMethodSignature___(invokeExpression);
        concreteMethod = this.scene.getMethod(concreteMethodSignature)

        if (concreteMethodSignature == null ||
            concreteMethod.modifiers.includes("StaticKeyword") ||
            concreteMethod.modifiers.includes("Constructor")) {
            // If the invoked function is static or a constructor, then return the signature.
            callTargetMethods.push(concreteMethodSignature)
            return callTargetMethods
        } else {
            if (this.instancedClasses.has(sourceMethodSignature.arkClass.toString())) {
                // Obtain all possible target method signatures based on the acquired method signature.
                callTargetMethods = this.resolveAllCallTargets(sourceMethodSignature, concreteMethodSignature)
                if (!concreteMethod.modifiers.includes("AbstractKeyword")) {
                    if (!isItemRegistered<MethodSignature>(
                        concreteMethodSignature, callTargetMethods,
                        (a, b) =>
                            a.toString() === b.toString()
                    )) {
                        callTargetMethods.push(concreteMethodSignature)
                    }
                }
            } else {
                this.saveIgnoredCalls(sourceMethodSignature, concreteMethodSignature)
            }
            return callTargetMethods
        }
    }

    /**
     * For the given method signature
     * retrieve the class where the method resides, as well as all subclasses of this class.
     * Check whether there are inherited methods in these classes.
     *
     * @param sourceMethodSignature
     * @param targetMethodSignature
     * @protected
     */
    protected resolveAllCallTargets(sourceMethodSignature, targetMethodSignature: MethodSignature): MethodSignature[] {
        let targetClasses: ClassSignature[];
        let methodSignature: MethodSignature[] = [];
        targetClasses = []
        for (let targetClass of targetClasses) {
            // TODO: 获取到子类的信息
            let arkClass = this.scene.getClass(targetClass)
            let methods = arkClass.getMethods()

            for (let method of methods) {
                if (method.methodSubSignature.toString() === targetMethodSignature.methodSubSignature.toString()) {
                    if (this.instancedClasses.has(targetClass.toString())) {
                        if (!isItemRegistered<MethodSignature>(
                            method.methodSignature, methodSignature,
                            (a, b) =>
                                a.toString() === b.toString()
                        )) {
                            methodSignature.push(method.methodSignature)
                        }
                    } else {
                        this.saveIgnoredCalls(sourceMethodSignature, method.methodSignature)
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
        let newInstancedClasses = this.collectInstantiatedClassesInMethod(methodSignature)
        for (let newInstancedClass of newInstancedClasses) {
            // Soot中前处理没看明白，先写个简单版本
            // Check from the ignoredCalls collection whether there are edges that need to be reactivated.
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

    /**
     * Retrieve the newly created class objects within the method.
     *
     * @param methodSignature
     * @protected
     */
    protected collectInstantiatedClassesInMethod(methodSignature: MethodSignature): ClassSignature[] {
        // let cfg : Cfg = this.scene.getMethod(methodSignature).getCFG();
        let cfg: Cfg
        let newInstancedClass: ClassSignature[]
        newInstancedClass = []
        for (let stmt of cfg.statementArray) {
            // TODO: 判断语句类型，如果是赋值语句且创建了新的实例，则获取类签名
            if (stmt.type == "JAssignStmt") {
                // Soot中JAssignStmt代表赋值操作，如果赋值操作中右操作数是new语句，则获取类签名
                let classSignature: ClassSignature;
                if (!this.instancedClasses.has(classSignature.toString())) {
                    if (!isItemRegistered<ClassSignature>(
                        classSignature, newInstancedClass,
                        (a, b) =>
                            a.toString() === b.toString()
                    )) {
                        newInstancedClass.push(classSignature)
                    }
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
            if (!isItemRegistered<Tuple>(
                [sourceMethodSignature, targetMethodSignature], this.ignoredCalls.get(notInstancedClass.toString()),
                (a, b) =>
                    a[0].toString() === b[0].toString() && a[1].toString() === b[1].toString()
            )) {
                this.ignoredCalls.get(notInstancedClass.toString()).push([sourceMethodSignature, targetMethodSignature])
            }
        } else {
            this.ignoredCalls.set(notInstancedClass.toString(), [sourceMethodSignature.toString(), targetMethodSignature.toString()])
        }
    }
}