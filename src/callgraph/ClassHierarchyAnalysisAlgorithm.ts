import path from "path";
import { AbstractInvokeExpr, ArkInstanceInvokeExpr, ArkStaticInvokeExpr } from "../core/base/Expr";
import { ArkInvokeStmt } from "../core/base/Stmt";
import { ArkClass } from "../core/model/ArkClass";
import { ArkFile } from "../core/model/ArkFile";
import { ArkMethod } from "../core/model/ArkMethod";
import { MethodSignature } from "../core/model/ArkSignature";
import {isItemRegistered} from "../utils/callGraphUtils";
import {getArkFileByName, matchClassInFile, searchImportMessage, splitType} from "../utils/typeReferenceUtils";
import { AbstractCallGraphAlgorithm } from "./AbstractCallGraphAlgorithm";

export class ClassHierarchyAnalysisAlgorithm extends AbstractCallGraphAlgorithm {
    protected resolveCall(sourceMethodSignature: MethodSignature, invokeExpression: ArkInvokeStmt): MethodSignature[] {
        let concreteMethodSignature: MethodSignature|null = null;
        let concreteMethod: ArkMethod;
        let callTargetMethods: MethodSignature[] = [];
        let invokeExpressionExpr = invokeExpression.getInvokeExpr()

        let methodsFromInvoke = this.resolveInvokeExpr(
            invokeExpressionExpr,
            sourceMethodSignature.getDeclaringClassSignature().getDeclaringFileSignature().getFileName(),
            sourceMethodSignature)
        if (methodsFromInvoke == null) {
            return callTargetMethods
        }
        for (let methodFromInvoke of methodsFromInvoke) {
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
                            targetMethod.getSignature(), callTargetMethods,
                            (a, b) =>
                                a.toString() === b.toString()
                        )) {
                            callTargetMethods.push(targetMethodSignature)
                        }
                    }
                }
            }
        }
        return callTargetMethods
    }

    protected resolveAllCallTargets(targetMethodSignature: MethodSignature): MethodSignature[] {
        let targetClasses: ArkClass[];
        let methodSignature: MethodSignature[] = [];

        targetClasses = this.scene.getExtendedClasses(targetMethodSignature.getDeclaringClassSignature())
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
        let classCompleteName = searchImportMessage(file, className, matchClassInFile)
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
    protected resolveInvokeExpr(invokeExpr: AbstractInvokeExpr,
                                arkFileName: string,
                                sourceMethodSignature: MethodSignature) {
        let arkFile = getArkFileByName(arkFileName, this.scene.scene)
        let callName = invokeExpr.getMethodSignature().getMethodSubSignature().getMethodName()
        console.log(invokeExpr.getMethodSignature().toString())
        // console.log(callName)
        let methodName: string = callName
        let classAndArkFileNames: Set<[string, string]> = new Set<[string, string]>()
        let callMethods: ArkMethod[] = []
        let sourceMethod = this.scene.getMethod(sourceMethodSignature)

        // TODO: 对于基本类型的一些固定方法，需要讨论是否可以给这些类创建一个ArkClass等，这样不需要改动这里的内容
        if (invokeExpr instanceof ArkInstanceInvokeExpr) {
            console.log("instanceInvoke:   "+invokeExpr.getMethodSignature().toString())
            if (invokeExpr.getBase().getName() === "this") {
                // 处理this调用
                let currentClass = this.scene.getClass(sourceMethodSignature.getDeclaringClassSignature())
                classAndArkFileNames.add([currentClass!.getName(), currentClass!.getDeclaringArkFile().getName()])
            } else {
                let classCompleteType = invokeExpr.getBase().getType() // a| b |c
                let classAllType = splitType(classCompleteType.toString(), '|') // [a, b, c]
                //TODO: 这里多类型修改为UnionType需要进行适配，需要确认是否可以适配getClassWithName()方法
                for (let classSingleType of classAllType) {
                    let lastDotIndex = classSingleType.lastIndexOf('.')
                    classAndArkFileNames.add([classCompleteType.toString().substring(lastDotIndex + 1),
                        classCompleteType.toString().substring(0, lastDotIndex)])
                }
            }
        } else if (invokeExpr instanceof ArkStaticInvokeExpr) {
            // console.log("static:   "+invokeExpr.getMethodSignature().toString())
            if (callName.includes('.')) {
                // a.b()的静态调用
                let lastDotIndex = callName.lastIndexOf('.')
                let className = callName.substring(0, lastDotIndex)
                if (className === "this") {
                    let currentClass = this.scene.getClass(sourceMethodSignature.getDeclaringClassSignature())
                    classAndArkFileNames.add([currentClass!.getName(),
                        currentClass!.getDeclaringArkFile().getName()])
                } else {
                    classAndArkFileNames.add([className, arkFileName])
                    methodName = callName.substring(lastDotIndex + 1)
                }
            } else {
                // 函数调用
                let callFunction = this.resolveFunctionCall(arkFile!, methodName)
                if (callFunction != null) {
                    if (!isItemRegistered<ArkMethod>(
                        callFunction, callMethods,
                        (a, b) =>
                            a.getSignature().toString() === b.getSignature().toString()
                    )) {
                        callMethods.push(callFunction)
                    }
                }
            }
        }
        for (let classTuple of classAndArkFileNames) {
            if (classTuple[0] === "" || classTuple[1] === "") {
                classAndArkFileNames.delete(classTuple)
            } else {
                let arkFile = getArkFileByName(classTuple[1], this.scene.scene)
                if (arkFile == null) {
                    classAndArkFileNames.delete(classTuple)
                } else {
                    let invokeClass = this.resolveClassInstance(classTuple[0], arkFile)
                    if (invokeClass == null) {
                        return null
                    }
                    for (let method of invokeClass.getMethods()) {
                        if (method.getName() === methodName) {
                            if (!isItemRegistered<ArkMethod>(
                                method, callMethods,
                                (a, b) =>
                                    a.getSignature().toString() === b.getSignature().toString()
                            )) {
                                callMethods.push(method)
                            }
                        }
                    }
                }
            }
        }
        return callMethods
    }
}