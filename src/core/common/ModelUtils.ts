import { Scene } from "../../Scene";
import { ArkClass } from "../model/ArkClass";
import { ArkField } from "../model/ArkField";
import { ArkFile } from "../model/ArkFile";
import { ArkMethod } from "../model/ArkMethod";
import { ArkNamespace } from "../model/ArkNamespace";
import { ClassSignature, MethodSignature, NamespaceSignature } from "../model/ArkSignature";
import { ExportInfo } from "./ExportBuilder";
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
        let arkFile = scene.getFile(fileSignature);
        if (!arkFile) {
            arkFile = scene.getSdkArkFilestMap().get(fileSignature.toString()) || null;
        }
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
            curr = curr.getNamespace(namespaceSignatures[i]);
            if (curr == null) {
                return null;
            }
        }
        return curr.getClass(classSignature);
    }

    public static getMethodWithMethodSignature(methodSignature: MethodSignature, scene: Scene): ArkMethod | null {
        const arkClass = this.getClassWithClassSignature(methodSignature.getDeclaringClassSignature(), scene);
        return arkClass!.getMethod(methodSignature);
    }

    public static getClassWithNameInNamespaceRecursively(className: string, ns: ArkNamespace): ArkClass | null {
        if (className == '') {
            return null;
        }
        let res: ArkClass | null = null;
        res = this.getClassInNamespaceWithName(className, ns);
        if (res == null) {
            let declaringNs = ns.getDeclaringArkNamespace();
            if (declaringNs != null) {
                res = this.getClassWithNameInNamespaceRecursively(className, declaringNs);
            }
            else {
                res = this.getClassInFileWithName(className, ns.getDeclaringArkFile());
            }
        }
        return res;
    }

    public static getClassWithNameFromClass(className: string, startFrom: ArkClass): ArkClass | null {
        if (!className.includes(".")) {
            let res: ArkClass | null = null;
            if (startFrom.getDeclaringArkNamespace() != null) {
                res = this.getClassWithNameInNamespaceRecursively(className, startFrom.getDeclaringArkNamespace());
            }
            else {
                res = this.getClassInFileWithName(className, startFrom.getDeclaringArkFile());
            }
        }
        else {
            const names = className.split('.');
            let nameSpace = this.getNamespaceWithNameFromClass(names[0], startFrom);
            for (let i = 1; i < names.length - 1; i++) {
                if (nameSpace)
                    nameSpace = this.getNamespaceInNamespaceWithName(names[i], nameSpace);
            }
            if (nameSpace) {
                return this.getClassInNamespaceWithName(names[names.length - 1], nameSpace);
            }
        }
        return null;
    }

    /** search class within the file that contain the given method */
    public static getClassWithName(className: string, startFrom: ArkMethod): ArkClass | null {
        //TODO:是否支持类表达式
        if (!className.includes(".")) {
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
            for (let i = 1; i < names.length - 1; i++) {
                if (nameSpace)
                    nameSpace = this.getNamespaceInNamespaceWithName(names[i], nameSpace);
            }
            if (nameSpace) {
                return this.getClassInNamespaceWithName(names[names.length - 1], nameSpace);
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

        return this.getClassInImportInfoWithName(className, arkFile);
    }

    public static getClassInImportInfoWithName(className: string, arkFile: ArkFile): ArkClass | null {
        for (const importInfo of arkFile.getImportInfos()) {
            if (importInfo.getImportClauseName() == className) {
                const importFrom = this.getFileFromImportInfo(importInfo, arkFile.getScene());
                if (importFrom) {
                    const nameBefroreAs = importInfo.getNameBeforeAs();
                    if (nameBefroreAs != undefined) {
                        className = nameBefroreAs;
                    }
                    return this.getClassInImportFileWithName(className, importFrom);
                }
            }
        }
        return null;
    }

    public static getClassInImportFileWithName(className: string, arkFile: ArkFile): ArkClass | null {
        let defaultExport: ExportInfo | null = null;
        for (const exportInfo of arkFile.getExportInfos()) {
            if (exportInfo.getExportClauseName() == className) {
                const nameBefroreAs = exportInfo.getNameBeforeAs();
                if (nameBefroreAs != undefined) {
                    className = nameBefroreAs;
                }
                for (const arkClass of arkFile.getClasses()) {
                    if (arkClass.getName() == className) {
                        return arkClass;
                    }
                }
                return this.getClassInImportInfoWithName(className, arkFile);
            }
            else if (exportInfo.getDefault()) {
                defaultExport = exportInfo;
            }
        }
        if (defaultExport) {
            className = defaultExport.getExportClauseName()
            for (const arkClass of arkFile.getClasses()) {
                if (arkClass.getName() == className) {
                    return arkClass;
                }
            }
            return this.getClassInImportInfoWithName(className, arkFile);
        }
        return null;
    }

    public static getFileFromImportInfo(importInfo: ImportInfo, scene: Scene): ArkFile | null {
        const signatureStr = importInfo.getImportFromSignature2Str();
        let file: ArkFile | null = null;
        if (importInfo.getImportProjectType() == "TargetProject") {
            file = scene.getFiles().find(file => file.getFileSignature().toString() == signatureStr) || null;
        }
        else if (importInfo.getImportProjectType() == "SDKProject") {
            file = scene.getSdkArkFilestMap().get(signatureStr) || null;
        }
        return file;
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

    public static getNamespaceWithNameFromClass(namespaceName: string, startFrom: ArkClass): ArkNamespace | null {
        const thisNamespace = startFrom.getDeclaringArkNamespace();
        let namespaceSearched: ArkNamespace | null = null;
        if (thisNamespace) {
            namespaceSearched = this.getNamespaceInNamespaceWithName(namespaceName, thisNamespace);
            if (namespaceSearched) {
                return namespaceSearched;
            }
        }
        const thisFile = startFrom.getDeclaringArkFile();
        namespaceSearched = this.getNamespaceInFileWithName(namespaceName, thisFile);
        return namespaceSearched;
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

        return this.getNamespaceInImportInfoWithName(namespaceName, arkFile);
    }

    public static getNamespaceInImportInfoWithName(namespaceName: string, arkFile: ArkFile): ArkNamespace | null {
        for (const importInfo of arkFile.getImportInfos()) {
            if (importInfo.getImportClauseName() == namespaceName) {
                const importFrom = this.getFileFromImportInfo(importInfo, arkFile.getScene());
                if (importFrom) {
                    const nameBefroreAs = importInfo.getNameBeforeAs();
                    if (nameBefroreAs != undefined) {
                        namespaceName = nameBefroreAs;
                    }
                    return this.getNamespaceInImportFileWithName(namespaceName, importFrom);
                }
            }
        }
        return null;
    }

    public static getNamespaceInImportFileWithName(namespaceName: string, arkFile: ArkFile): ArkNamespace | null {
        let defaultExport: ExportInfo | null = null;
        for (const exportInfo of arkFile.getExportInfos()) {
            if (exportInfo.getExportClauseName() == namespaceName) {
                const nameBefroreAs = exportInfo.getNameBeforeAs();
                if (nameBefroreAs != undefined) {
                    namespaceName = nameBefroreAs;
                }
                for (const arkNamespace of arkFile.getNamespaces()) {
                    if (arkNamespace.getName() == namespaceName) {
                        return arkNamespace;
                    }
                }
                return this.getNamespaceInImportInfoWithName(namespaceName, arkFile);
            }
            else if (exportInfo.getDefault()) {
                defaultExport = exportInfo;
            }
        }
        if (defaultExport) {
            namespaceName = defaultExport.getExportClauseName()
            for (const arkNamespace of arkFile.getNamespaces()) {
                if (arkNamespace.getName() == namespaceName) {
                    return arkNamespace;
                }
            }
            return this.getNamespaceInImportInfoWithName(namespaceName, arkFile);
        }
        return null;
    }

    public static getStaticMethodWithName(methodName: string, startFrom: ArkMethod): ArkMethod | null {
        const thisClass = startFrom.getDeclaringArkClass();
        const thisNamespace = thisClass.getDeclaringArkNamespace();
        if (thisNamespace) {
            const defaultClass = thisNamespace.getClasses().find(cls => cls.getName() == '_DEFAULT_ARK_CLASS') || null;
            if (defaultClass) {
                const method = this.getMethodInClassWithName(methodName, defaultClass);
                if (method) {
                    return method;
                }
            }
        }
        return this.getStaticMethodInFileWithName(methodName, startFrom.getDeclaringArkFile());
    }

    public static getStaticMethodInFileWithName(methodName: string, arkFile: ArkFile): ArkMethod | null {
        const defaultClass = arkFile.getClasses().find(cls => cls.getName() == '_DEFAULT_ARK_CLASS') || null;
        if (defaultClass) {
            let method = this.getMethodInClassWithName(methodName, defaultClass);
            if (method) {
                return method;
            }
        }
        return this.getStaticMethodInImportInfoWithName(methodName, arkFile);
    }

    public static getStaticMethodInImportInfoWithName(methodName: string, arkFile: ArkFile): ArkMethod | null {
        for (const importInfo of arkFile.getImportInfos()) {
            if (importInfo.getImportClauseName() == methodName) {
                const importFrom = this.getFileFromImportInfo(importInfo, arkFile.getScene());
                if (importFrom) {
                    const nameBefroreAs = importInfo.getNameBeforeAs();
                    if (nameBefroreAs != undefined) {
                        methodName = nameBefroreAs;
                    }
                    return this.getStaticMethodInImportFileWithName(methodName, importFrom);
                }
            }
        }
        return null;
    }

    public static getStaticMethodInImportFileWithName(methodName: string, arkFile: ArkFile): ArkMethod | null {
        let defaultExport: ExportInfo | null = null;
        for (const exportInfo of arkFile.getExportInfos()) {
            if (exportInfo.getExportClauseName() == methodName) {
                const defaultClass = arkFile.getClasses().find(cls => cls.getName() == '_DEFAULT_ARK_CLASS') || null;
                if (defaultClass) {
                    const nameBefroreAs = exportInfo.getNameBeforeAs();
                    if (nameBefroreAs != undefined) {
                        methodName = nameBefroreAs;
                    }
                    for (const arkMethod of defaultClass.getMethods()) {
                        if (arkMethod.getName() == methodName) {
                            return arkMethod;
                        }
                    }
                    return this.getStaticMethodInImportInfoWithName(methodName, arkFile);
                }

            }
            else if (exportInfo.getDefault()) {
                defaultExport = exportInfo;
            }
        }
        if (defaultExport) {
            methodName = defaultExport.getExportClauseName()
            const defaultClass = arkFile.getClasses().find(cls => cls.getName() == '_DEFAULT_ARK_CLASS') || null;
            if (defaultClass) {
                for (const arkMethod of defaultClass.getMethods()) {
                    if (arkMethod.getName() == methodName) {
                        return arkMethod;
                    }
                }
                return this.getStaticMethodInImportInfoWithName(methodName, arkFile);
            }
        }
        return null;
    }

}
