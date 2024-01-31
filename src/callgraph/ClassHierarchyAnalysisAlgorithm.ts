import {AbstractCallGraphAlgorithm} from "./AbstractCallGraphAlgorithm";
import {MethodSignature} from "../core/model/ArkSignature";
import {ArkClass} from "../core/model/ArkClass";
import {ArkMethod} from "../core/model/ArkMethod";
import {isItemRegistered} from "../utils/callGraphUtils";
import {ArkInvokeStmt} from "../core/base/Stmt";
import {AbstractInvokeExpr, ArkInstanceInvokeExpr, ArkStaticInvokeExpr} from "../core/base/Expr";
import {ArkFile} from "../core/model/ArkFile";
import path from "path";
import {Local} from "../core/base/Local";

export class ClassHierarchyAnalysisAlgorithm extends AbstractCallGraphAlgorithm {
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression: ArkInvokeStmt): MethodSignature[] {
        let concreteMethodSignature: MethodSignature|null = null;
        let concreteMethod: ArkMethod;
        let callTargetMethods: MethodSignature[] = [];
        let invokeExpressionExpr = invokeExpression.getInvokeExpr()

        let methodFromInvoke = this.resolveInvokeExpr(
            invokeExpressionExpr,
            sourceMethodSignature.getArkClass().getArkFile(),
            sourceMethodSignature)
        if (methodFromInvoke == null) {
            return callTargetMethods
        }
        concreteMethodSignature = methodFromInvoke.getSignature()
        concreteMethod = methodFromInvoke

        /** TODO: 加入多类型后对一个调用语句的解析可能会导致获取多个函数签名
         *      这样需要多返回的多个函数签名每个都进行一次下面的过程，最后将全部内容返回
         */

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
                        targetMethod.getSignature(), callTargetMethods,
                        (a, b) =>
                            a.toString() === b.toString()
                    )) {
                        callTargetMethods.push(targetMethodSignature)
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
        /**
         *
         * TODO:第一句在后续可以进行优化，目前在instance中存储type是真实类文件，类名，
         *  但是在StaticInvoke中只能拿到别名构建出的signature，导致该句不能省略
         *  example:
         *  import {C as D} from "./b.ts"
         *  D.staticMethod()
         *  在进到cg时的签名只有"D.staticMethod"，因此仍然需要递归分析import，后续待优化
         */
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
                    let realImportFileName = path.dirname("");
                    for (let i = 0; i < fileDir.length - parentDirNum - 1; i++) {
                        realImportFileName = path.join(realImportFileName, fileDir[i])
                    }
                    for (let i = parentDirNum; i < importDir.length; i++) {
                        realImportFileName = path.join(realImportFileName, importDir[i])
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
                    let realImportFileName = path.dirname("");
                    for (let i = 0; i < fileDir.length - parentDirNum - 1; i++) {
                        realImportFileName = path.join(realImportFileName, fileDir[i])
                    }
                    for (let i = parentDirNum; i < importDir.length; i++) {
                        realImportFileName = path.join(realImportFileName, importDir[i])
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

    protected getArkFileByName(fileName: string) {
        for (let sceneFile of this.scene.scene.arkFiles) {
            if (sceneFile.getName() === fileName) {
                return sceneFile
            }
        }
        return null
    }

    protected resolveInvokeExpr(invokeExpr: AbstractInvokeExpr,
                                arkFileName: string,
                                sourceMethodSignature: MethodSignature) {
        let arkFile = this.getArkFileByName(arkFileName)
        let callName = invokeExpr.getMethodSignature()
        let className: string = "", methodName: string = callName
        // TODO: 对于基本类型的一些固定方法，需要讨论是否可以给这些类创建一个ArkClass等，这样不需要改动这里的内容
        if (invokeExpr instanceof ArkInstanceInvokeExpr) {
            // console.log("instance:   "+invokeExpr)
            let classCompleteType = invokeExpr.getBase().getType()
            // TODO: getType函数可能返回字符串中包含多种类型
            let classInstanceDeclareStmtLocal = invokeExpr.getBase().getDeclaringStmt()?.getDef()
            if (classInstanceDeclareStmtLocal instanceof Local) {
                classCompleteType = classInstanceDeclareStmtLocal.getType()
            }
            // TODO: className, arkFile这些变量可能需要改成数组
            let lastDotIndex = classCompleteType.lastIndexOf('.')
            className = classCompleteType.substring(lastDotIndex + 1)
            arkFile = this.getArkFileByName(classCompleteType.substring(0, lastDotIndex))
            if (invokeExpr.getBase().getName() === "this") {
                let currentClass = this.scene.getClass(sourceMethodSignature.getArkClass())
                className = currentClass!.getName()
                arkFile = currentClass!.getDeclaringArkFile()
            }
        } else if (invokeExpr instanceof ArkStaticInvokeExpr) {
            // console.log("static:   "+invokeExpr)
            if (callName.includes('.')) {
                let lastDotIndex = callName.lastIndexOf('.')
                className = callName.substring(0, lastDotIndex)
                methodName = callName.substring(lastDotIndex + 1)
                if (className === "this") {
                    let currentClass = this.scene.getClass(sourceMethodSignature.getArkClass())
                    className = currentClass!.getName()
                    arkFile = currentClass!.getDeclaringArkFile()
                }
            } else {
                return this.resolveFunctionCall(arkFile!, methodName)
            }
        }
        // console.log("className: "+className+" arkFileName: "+arkFile?.getName())
        if (arkFile == null || className == "") {
            return null
        }
        // TODO: 对所有的类名进行解析，获取可能的实例
        let invokeClass = this.resolveClassInstance(className, arkFile)
        if (invokeClass == null) {
            return null
        }
        // 调用方法名都是相同的，这里无需修改
        for (let method of invokeClass.getMethods()) {
            if (method.getName() === methodName) {
                return method
            }
        }
        return null
    }
}