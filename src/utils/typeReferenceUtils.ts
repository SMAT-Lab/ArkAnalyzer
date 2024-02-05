import path from "path";
import { Scene } from "../Scene";
import { NodeA } from "../core/base/Ast";
import { ArkFile } from "../core/model/ArkFile";
import { ClassSignature } from "../core/model/ArkSignature";

export function isPrimaryType(type: string): boolean {
    switch (type) {
        case "boolean":
        case "number":
        case "string":
        case "String":
        case "void":
        case "any":
        case "null":
        case "undefined":
            return true
        default:
            return false
    }
}

export function isPrimaryTypeKeyword(keyword: string): boolean {
    switch (keyword) {
        case "NumberKeyword":
        case "StringKeyword":
        case "NullKeyword":
            return true
        default:
            return false
    }
}

export function resolvePrimaryTypeKeyword(keyword: string): string {
    switch (keyword) {
        case "NumberKeyword":
            return "number"
        case "StringKeyword":
            return "string"
        case "NullKeyword":
            return "null"
        default:
            return ""
    }
}

export function splitType(typeName: string, separator: string): string[] {
    return typeName.split(separator).map(type => type.trim()).filter(Boolean);
}

export function transformArrayToString<T>(array: T[], separator: string = '|'): string {
    return array.join(separator);
}

export function buildTypeReferenceString(astNodes: NodeA[]): string {
    return astNodes.map(node => {
        if (node.kind === 'Identifier') {
            return node.text;
        } else if (node.kind === 'DotToken') {
            return '.';
        }
        return '';
    }).join('');
}

export function resolveBinaryResultType(op1Type: string, op2Type: string, operator: string): string {
    switch (operator) {
        case "+":
            if (op1Type === "string" || op2Type === "string") {
                return "string";
            }
            if (op1Type === "number" && op2Type === "number") {
                return "number";
            }
            break;
        case "-":
        case "*":
        case "/":
        case "%":
            if (op1Type === "number" && op2Type === "number") {
                return "number";
            }
            break;
        case "<":
        case "<=":
        case ">":
        case ">=":
        case "==":
        case "!=":
        case "===":
        case "!==":
        case "&&":
        case "||":
            return "boolean";
        case "&":
        case "|":
        case "^":
        case "<<":
        case ">>":
        case ">>>":
            if (op1Type === "number" && op2Type === "number") {
                return "number";
            }
            break;
    }
    return "";
}

export function getArkFileByName(fileName: string, scene: Scene) {
    for (let sceneFile of scene.arkFiles) {
        if (sceneFile.getName() === fileName) {
            return sceneFile
        }
    }
    return null
}

export function resolveClassInstance(classCompleteName: string, file: ArkFile | null) {
    if (file == null)
        return null
    let lastDotIndex = classCompleteName.lastIndexOf('.')
    let classRealName = classCompleteName.substring(lastDotIndex + 1)
    for (let arkClass of file.getClasses()) {
        if (arkClass.getName() === classRealName) {
            return arkClass
        }
    }
    return null
}

export function resolveClassInstanceField(fieldName: string[], file: ArkFile | null) {
    if (file == null)
        return null
    for (let i = 0; i < fieldName.length - 1; i++) {
        let className = fieldName[i]
        let classInstanceName = searchImportMessage(file, className, matchClassInFile)
        let lastDotIndex = classInstanceName.lastIndexOf('.')
        let classInstanceArkFile = getArkFileByName(classInstanceName.substring(0, lastDotIndex), file.getScene())
        let classInstance = resolveClassInstance(classInstanceName, classInstanceArkFile)
        if (classInstance == null) {
            return null
        }
        for (let field of classInstance.getFields()) {
            if (field.getName() === fieldName[i + 1]) {
                fieldName[i + 1] = field.getType()
                file = classInstance.getDeclaringArkFile()
                break
            }
        }
    }
    return searchImportMessage(file, fieldName[fieldName.length - 1], matchClassInFile)
}

// MatchItemFromImport

type ClassSearchCallback = (file: ArkFile, className: string) => string | null;
export function searchImportMessage(file: ArkFile, className: string, searchCallback: ClassSearchCallback): string {
    // 调用回调函数作为递归结束条件
    const result = searchCallback(file, className);
    if (result) {
        return result;
    }
    for (let importInfo of file.getImportInfos()) {
        console.log(importInfo.getImportClauseName())
        const importFromDir = importInfo.getImportFrom();
        if (className == importInfo.getImportClauseName() && importFromDir != undefined) {
            const fileDir = file.getName().split("\\");
            const importDir = importFromDir.split(/[\/\\]/).filter(item => item !== '.');
            let realName = importInfo.getNameBeforeAs() ? importInfo.getNameBeforeAs() : importInfo.getImportClauseName()
            let parentDirNum = 0;
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
                            return searchImportMessage(sceneFile, realName!, searchCallback);
                        }
                    }
                    // file不在scene中，视为外部库
                    const targetSignature = importInfo.getTargetArkSignature();
                    const apiMap = scene.arkClassMaps;
                    if (apiMap != undefined && apiMap.get(targetSignature) != undefined) {
                        return apiMap.get(targetSignature);
                    }
                }
            }
        }
    }
    return "";
}

export function typeStrToClassSignature(typrStr: string): ClassSignature {
    const lastDot = typrStr.lastIndexOf('.');
    const classSignature = new ClassSignature();
    classSignature.setArkFile(typrStr.substring(0, lastDot));
    const classType = typrStr.replace(/\\\\/g, '.').split('.');
    classSignature.setClassType(classType[classType.length - 1]);

    return classSignature;
}

export const matchClassInFile: ClassSearchCallback = (file, className) => {
    for (let classInFile of file.getClasses()) {
        if (className === classInFile.getName()) {
            return classInFile.getSignature().getArkFile() + "." + className;
        }
    }
    return null;
};

export const matchFunctionInFile: ClassSearchCallback = (file, functionName) => {
    for (let functionOfFile of file.getDefaultClass().getMethods()) {
        if (functionName == functionOfFile.getName()) {
            return functionOfFile.getSignature().toString()
        }
    }
    return null;
};