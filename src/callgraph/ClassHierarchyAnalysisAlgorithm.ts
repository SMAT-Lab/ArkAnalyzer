import {AbstractCallGraphAlgorithm} from "./AbstractCallGraphAlgorithm";
import {MethodSignature, MethodSubSignature} from "../core/model/ArkSignature";
import {ArkClass} from "../core/model/ArkClass";
import {ArkMethod} from "../core/model/ArkMethod";
import {isItemRegistered, splitStringWithRegex} from "./utils";
import {ArkInvokeStmt} from "../core/base/Stmt";
import {ArkInstanceInvokeExpr, ArkStaticInvokeExpr} from "../core/base/Expr";
import {ArkFile} from "../core/model/ArkFile";

export class ClassHierarchyAnalysisAlgorithm extends AbstractCallGraphAlgorithm {
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression: ArkInvokeStmt): MethodSignature[] {
        let concreteMethodSignature: MethodSignature|null = null;
        let concreteMethod: ArkMethod;
        let callTargetMethods: MethodSignature[] = [];
        let invokeExpressionExpr = invokeExpression.getInvokeExpr()
        let invokeClass: ArkClass | null = null

        // TODO: 根据调用语句获取具体方法签名或函数签名
        if (invokeExpressionExpr instanceof ArkInstanceInvokeExpr) {
            // console.log(invokeExpressionExpr.getMethodSignature())
            let classCompleteType = invokeExpressionExpr.getBase().getType()
            let lastDotIndex = classCompleteType.lastIndexOf('.')
            let fileName = classCompleteType.substring(0, lastDotIndex)
            let className = classCompleteType.substring(lastDotIndex + 1)
            invokeClass = this.resolveClassInstance(className, fileName)
            if (invokeClass == null) {
                return callTargetMethods
            }
        } else if (invokeExpressionExpr instanceof ArkStaticInvokeExpr) {
            // console.log(invokeExpressionExpr.getMethodSignature())
            let exprResults = splitStringWithRegex(invokeExpressionExpr.getMethodSignature())
            // invokeClass = this.resolveClassInstance(exprResults[1])
        }
        if (invokeClass == null) {
            // TODO: 处理函数调用
            let functionMethod = this.resolveFunctionCall(invokeExpressionExpr, sourceMethodSignature.getArkClass().getArkFile())
            if (functionMethod != null) {
                callTargetMethods.push(functionMethod.getSignature())
            }
            return callTargetMethods
        }
        for (let method of invokeClass.getMethods()) {
            if (method.getName() === invokeExpressionExpr.getMethodSignature()) {
                concreteMethodSignature = method.getSignature()
                concreteMethod = method
            }
        }
        // if (invokeExpressionExpr.getMethodSignature() == "constructor" &&
        //     concreteMethodSignature == null) {
        //     concreteMethodSignature = new MethodSignature(
        //         new MethodSubSignature("constructor", new Map<string, string>(), []),
        //         invokeClass.classSignature
        //     )
        // }

        if (concreteMethodSignature == null) {
            // If the invoked function is static or a constructor, then return the signature.
            return callTargetMethods
        } else if ((invokeExpressionExpr instanceof ArkStaticInvokeExpr)) {
            callTargetMethods.push(concreteMethodSignature)
            return callTargetMethods
        } else {
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

        targetClasses = this.scene.getExtendedClasses(targetMethodSignature.getArkClass())
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

    protected resolveClassInstance(className: string, fileName: string) {
        for (let file of this.scene.scene.arkFiles) {
            if (file.getName() === fileName) {
                for (let arkClass of file.getClasses()) {
                    if (arkClass.getName() === className) {
                        return arkClass
                    }
                }
            }
        }
        return null
    }

    protected resolveFunction(file: ArkFile, functionName: string) {
        for (let arkMethod of file.getDefaultClass().getMethods()) {
            if (arkMethod.getName() === functionName) {
                return arkMethod
            }
        }
        return null
    }

    protected preProcessMethod(methodSignature: MethodSignature): void {
        //do nothing
    }

    protected resolveFunctionCall(invokeExpressionExpr: ArkStaticInvokeExpr, arkFileName: string): ArkMethod|null {
        let arkFile!: ArkFile
        for (let sceneFile of this.scene.scene.arkFiles) {
            if (sceneFile.getName() === arkFileName) {
                arkFile = sceneFile
            }
        }
        let functionName = invokeExpressionExpr.getMethodSignature()
        for (let fileFunction of arkFile.getDefaultClass().getMethods()) {
            if (fileFunction.getName() === functionName) {
                return fileFunction
            }
        }
        for (let importInfo of arkFile.getImportInfos()) {
            const importFromDir = importInfo.getImportFrom();
            if (functionName == importInfo.getImportClauseName() && importFromDir != undefined) {
                const fileDir = arkFile.getName().split("\\");
                const importDir = importFromDir.split(/[\/\\]/).filter(item => item !== '.');
                let parentDirNum = 0;
                while (importDir[parentDirNum] == "..") {
                    parentDirNum++;
                }
                if (parentDirNum < fileDir.length) {
                    let realImportFileName = "";
                    for (let i = 0; i < fileDir.length - parentDirNum - 1; i++) {
                        realImportFileName += fileDir[i] + "\\";
                    }
                    for (let i = parentDirNum; i < importDir.length; i++) {
                        realImportFileName += importDir[i];
                        if (i != importDir.length - 1) {
                            realImportFileName += "\\";
                        }
                    }
                    realImportFileName += ".ts";
                    const scene = arkFile.getScene();
                    if (scene) {
                        for (let sceneFile of scene.arkFiles) {
                            if (sceneFile.getName() == realImportFileName) {
                                return this.resolveFunction(sceneFile, functionName);
                            }
                        }
                    }
                }
            }
        }
        return null
    }
}