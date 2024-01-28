import {AbstractCallGraphAlgorithm} from "./AbstractCallGraphAlgorithm";
import {MethodSignature, MethodSubSignature} from "../core/model/ArkSignature";
import {ArkClass} from "../core/model/ArkClass";
import {ArkMethod} from "../core/model/ArkMethod";
import {isItemRegistered, splitStringWithRegex} from "../utils/callGraphUtils";
import {ArkInvokeStmt} from "../core/base/Stmt";
import {AbstractInvokeExpr, ArkInstanceInvokeExpr, ArkStaticInvokeExpr} from "../core/base/Expr";
import {ArkFile} from "../core/model/ArkFile";

export class ClassHierarchyAnalysisAlgorithm extends AbstractCallGraphAlgorithm {
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression: ArkInvokeStmt): MethodSignature[] {
        let concreteMethodSignature: MethodSignature|null = null;
        let concreteMethod: ArkMethod;
        let callTargetMethods: MethodSignature[] = [];
        let invokeExpressionExpr = invokeExpression.getInvokeExpr()
        let invokeClass: ArkClass | null = null

        let methodFromInvoke = this.resolveInvokeExpr(invokeExpressionExpr, sourceMethodSignature.getArkClass().getArkFile())
        if (methodFromInvoke == null) {
            return callTargetMethods
        }
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

    protected resolveClassInstance(className: string, file: ArkFile) {
        let classCompleteName = this.resolveImportClass(file, className)
        let lastDotIndex = classCompleteName.lastIndexOf('.')
        let fileName = classCompleteName.substring(0, lastDotIndex)
        let classRealName = classCompleteName.substring(lastDotIndex + 1)
        for (let file of this.scene.scene.arkFiles) {
            if (file.getName() === fileName) {
                for (let arkClass of file.getClasses()) {
                    if (arkClass.getName() === classRealName) {
                        return arkClass
                    }
                }
            }
        }
        return null
    }
    protected preProcessMethod(methodSignature: MethodSignature): void {
        //do nothing
    }

    private resolveImportClass(file: ArkFile, name: string): string {
        for (let classInFile of file.getClasses()) {
            if (name == classInFile.getName()) {
                return classInFile.getSignature().getArkFile() + "." + name;
            }
        }
        for (let importInfo of file.getImportInfos()) {
            const importFromDir=importInfo.getImportFrom();
            if (name == importInfo.getImportClauseName() && importFromDir != undefined) {
                const fileDir = file.getName().split("\\");
                const importDir = importFromDir.split(/[\/\\]/).filter(item => item !== '.');
                let parentDirNum = 0;
                let realName = importInfo.getNameBeforeAs()?importInfo.getNameBeforeAs():importInfo.getImportClauseName()
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
                    const scene = file.getScene();
                    if (scene) {
                        for (let sceneFile of scene.arkFiles) {
                            if (sceneFile.getName() == realImportFileName) {
                                return this.resolveImportClass(sceneFile, realName!);
                            }
                        }
                    }
                }
            }
        }
        return "";
    }

    private resolveFunctionCall(file: ArkFile, name: string): ArkMethod | null {
        for (let functionOfFile of file.getDefaultClass().getMethods()) {
            if (name == functionOfFile.getName()) {
                return functionOfFile
            }
        }
        for (let importInfo of file.getImportInfos()) {
            const importFromDir=importInfo.getImportFrom();
            if (name == importInfo.getImportClauseName() && importFromDir != undefined) {
                const fileDir = file.getName().split("\\");
                const importDir = importFromDir.split(/[\/\\]/).filter(item => item !== '.');
                let parentDirNum = 0;
                let realName = importInfo.getNameBeforeAs()?importInfo.getNameBeforeAs():importInfo.getImportClauseName()
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
                    const scene = file.getScene();
                    if (scene) {
                        for (let sceneFile of scene.arkFiles) {
                            if (sceneFile.getName() == realImportFileName) {
                                return this.resolveFunctionCall(sceneFile, realName!);
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    protected getCurrentArkFileByName(fileName: string) {
        for (let sceneFile of this.scene.scene.arkFiles) {
            if (sceneFile.getName() === fileName) {
                return sceneFile
            }
        }
        return null
    }

    protected resolveInvokeExpr(invokeExpr: AbstractInvokeExpr, arkFileName: string) {
        let arkFile = this.getCurrentArkFileByName(arkFileName)
        let callName = invokeExpr.getMethodSignature()
        let className: string, methodName: string = callName
        if (invokeExpr instanceof ArkInstanceInvokeExpr) {
            let classCompleteType = invokeExpr.getBase().getType()
            let lastDotIndex = classCompleteType.lastIndexOf('.')
            className = classCompleteType.substring(lastDotIndex + 1)
        } else if (invokeExpr instanceof ArkStaticInvokeExpr) {
            // console.log(callName)
            if (callName.includes('.')) {
                let lastDotIndex = callName.lastIndexOf('.')
                className = callName.substring(0, lastDotIndex)
                methodName = callName.substring(lastDotIndex + 1)
            } else {
                return this.resolveFunctionCall(arkFile!, methodName)
            }
        }
        let invokeClass = this.resolveClassInstance(className!, arkFile!)
        if (invokeClass == null) {
            return null
        }
        // console.log(invokeClass.getSignature().toString() + "....." + methodName)
        for (let method of invokeClass.getMethods()) {
            // console.log(method.getName())
            if (method.getName() === methodName) {
                return method
            }
        }
        return null
    }
}