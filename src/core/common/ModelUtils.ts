import { Scene } from "../../Scene";
import { ArkClass } from "../model/ArkClass";
import { ArkField } from "../model/ArkField";
import { ArkFile } from "../model/ArkFile";
import { ArkMethod } from "../model/ArkMethod";
import { ArkNamespace } from "../model/ArkNamespace";
import { ClassSignature, MethodSignature, NamespaceSignature } from "../model/ArkSignature";
import { ImportInfo } from "./ImportBuilder";

export class ModelUtils {
    public static getMethodSignatureFromArkClass(arkClass: ArkClass, methodName: string): MethodSignature | null {
        for (const arkMethod of arkClass.getMethods()) {
            if (arkMethod.getName() == methodName) {
                return arkMethod.getSignature();
            }
        }
        return null
    }

    /** search class iteratively with ClassSignature */
    public static getClassWithClassSignature(classSignature: ClassSignature, scene: Scene): ArkClass | null {
        const fileSignature = classSignature.getDeclaringFileSignature();
        const arkFile = scene.getFile(fileSignature);
        if (arkFile == null) {
            return null;
        }

        let namespaceSignature = classSignature.getDeclaringNamespaceSignature();
        let namespaceSignatures: NamespaceSignature[] = [];
        while (namespaceSignature != null) {
            namespaceSignatures.push(namespaceSignature);
            namespaceSignature = namespaceSignature.getDeclaringNamespaceSignature();
        }
        let curr: ArkFile | ArkNamespace | null = arkFile;
        for (let i = namespaceSignatures.length - 1; i >= 0; i--) {
            curr = arkFile.getNamespace(namespaceSignatures[i]);
            if (curr == null) {
                return null;
            }
        }
        return curr.getClass(classSignature);
    }

    /** search class within the file that contain the given method */
    public static getClassWithName(className: string, startFrom: ArkMethod): ArkClass | null {
        //TODO:是否支持类表达式
        if (!className.includes(".")){
            const thisClass = startFrom.getDeclaringArkClass();
            if (thisClass.getName() == className) {
                return thisClass;
            }
            const thisNamespace = thisClass.getDeclaringArkNamespace();
            let classSearched: ArkClass | null = null;
            if (thisNamespace) {
                classSearched = this.getClassInNamespaceWithName(className, thisNamespace);
                if (classSearched) {
                    return classSearched;
                }
            }
            const thisFile = thisClass.getDeclaringArkFile();
            classSearched = this.getClassInFileWithName(className, thisFile);
            return classSearched;
        }
        else {
            const names = className.split('.');
            let nameSpace = this.getNamespaceWithName(names[0], startFrom);
            for (let i = 1; i < names.length - 1; i++){
                if (nameSpace)
                    nameSpace = this.getNamespaceInNamespaceWithName(names[i], nameSpace);
            }
            if(nameSpace){
                return this.getClassInNamespaceWithName(names[names.length-1], nameSpace);
            }
        }
        return null;
    }

    /** search class within the given namespace */
    public static getClassInNamespaceWithName(className: string, arkNamespace: ArkNamespace): ArkClass | null {
        for (const arkClass of arkNamespace.getClasses()) {
            if (arkClass.getName() == className) {
                return arkClass;
            }
        }
        return null;
    }

    /** search class within the given file */
    public static getClassInFileWithName(className: string, arkFile: ArkFile): ArkClass | null {
        for (const arkClass of arkFile.getClasses()) {
            if (arkClass.getName() == className) {
                return arkClass;
            }
        }

        for (const importInfo of arkFile.getImportInfos()){
            if (importInfo.getImportClauseName() == className){
                const importFrom=this.getFileFromImportInfo(importInfo, arkFile.getScene());
                if (importFrom){
                    return this.getClassInFileWithName(className, importFrom);
                }
            }
        }
        return null;
        // let classSearched: ArkClass | null = null;
        // for (const arkNamespace of arkFile.getNamespaces()) {
        //     if (arkNamespaceExclude && arkNamespaceExclude == arkNamespace) {
        //         continue;
        //     }
        //     classSearched = this.getClassInNamespaceWithName(className, arkNamespace);
        //     if (classSearched) {
        //         break;
        //     }
        // }
        // return classSearched;
    }

    public static getFileFromImportInfo(importInfo: ImportInfo, scene: Scene): ArkFile | null {
        const signatureStr = importInfo.getImportFromSignature2Str();
        const fileName = signatureStr.substring(signatureStr.indexOf('/')+1).replace('/',"\\").replace(': ','')+'.ts';
        return scene.getFile(fileName);
    }

    /** search method within the file that contain the given method */
    public static getMethodWithName(methodName: string, startFrom: ArkMethod): ArkMethod | null {
        if (startFrom.getName() == methodName) {
            return startFrom;
        }

        const thisClass = startFrom.getDeclaringArkClass();
        let methodSearched: ArkMethod | null = this.getMethodInClassWithName(methodName, thisClass);
        if (methodSearched) {
            return methodSearched;
        }
        return null;
    }

    /** search method within the given class */
    public static getMethodInClassWithName(methodName: string, arkClass: ArkClass): ArkMethod | null {
        for (const method of arkClass.getMethods()) {
            if (method.getName() == methodName) {
                return method;
            }
        }
        return null;
    }

    /** search field within the given class */
    public static getFieldInClassWithName(fieldName: string, arkClass: ArkClass): ArkField | null {
        for (const field of arkClass.getFields()) {
            if (field.getName() == fieldName) {
                return field;
            }
        }
        return null;
    }

    public static getNamespaceWithName(namespaceName: string, startFrom: ArkMethod): ArkNamespace | null {
        const thisClass = startFrom.getDeclaringArkClass();
        const thisNamespace = thisClass.getDeclaringArkNamespace();
        let namespaceSearched: ArkNamespace | null = null;
        if (thisNamespace) {
            namespaceSearched = this.getNamespaceInNamespaceWithName(namespaceName, thisNamespace);
            if (namespaceSearched) {
                return namespaceSearched;
            }
        }
        const thisFile = thisClass.getDeclaringArkFile();
        namespaceSearched = this.getNamespaceInFileWithName(namespaceName, thisFile);
        return namespaceSearched;
    }

    public static getNamespaceInNamespaceWithName(namespaceName: string, arkNamespace: ArkNamespace): ArkNamespace | null {
        for (const namespace of arkNamespace.getNamespaces()) {
            if (namespace.getName() == namespaceName) {
                return namespace;
            }
        }
        return null;
    }

    public static getNamespaceInFileWithName(namespaceName: string, arkFile: ArkFile): ArkNamespace | null {
        for (const namespace of arkFile.getNamespaces()) {
            if (namespace.getName() == namespaceName) {
                return namespace;
            }
        }

        for (const importInfo of arkFile.getImportInfos()){
            if (importInfo.getImportClauseName() == namespaceName){
                const importFrom=this.getFileFromImportInfo(importInfo, arkFile.getScene());
                if (importFrom){
                    return this.getNamespaceInFileWithName(namespaceName, importFrom);
                }
            }
        }
        return null;
    }
}
