/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Local } from '../base/Local';
import { ArkClass, ClassCategory } from '../model/ArkClass';
import { ArkFile, Language } from '../model/ArkFile';
import { ArkMethod } from '../model/ArkMethod';
import { ArkNamespace } from '../model/ArkNamespace';
import {
    AliasTypeSignature,
    ClassSignature,
    FieldSignature,
    FileSignature,
    LocalSignature,
    MethodSignature,
    NamespaceSignature,
    Signature,
} from '../model/ArkSignature';
import { ArkExport, ExportInfo, ExportType, FromInfo } from '../model/ArkExport';
import { ArkField } from '../model/ArkField';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { FileUtils, ModulePath } from '../../utils/FileUtils';
import path from 'path';
import { Sdk } from '../../Config';
import { ALL, DEFAULT, TEMP_EXPORT_ALL_PREFIX, THIS_NAME } from './TSConst';
import { buildDefaultExportInfo } from '../model/builder/ArkExportBuilder';
import {
    AliasType,
    AnnotationNamespaceType,
    ClassType,
    EnumValueType,
    FunctionType,
    LiteralType,
    Type,
    UnclearReferenceType,
    UnionType,
    UnknownType
} from '../base/Type';
import { Scene } from '../../Scene';
import {
    ANONYMOUS_CLASS_PREFIX,
    DEFAULT_ARK_CLASS_NAME,
    DEFAULT_ARK_METHOD_NAME,
    LEXICAL_ENV_NAME_PREFIX,
    NAME_DELIMITER,
    TEMP_LOCAL_PREFIX
} from './Const';
import { EMPTY_STRING } from './ValueUtil';
import { ArkBaseModel } from '../model/ArkBaseModel';
import { ArkAssignStmt } from '../base/Stmt';
import { ClosureFieldRef } from '../base/Ref';
import { SdkUtils } from './SdkUtils';
import { TypeInference } from './TypeInference';
import { MethodParameter } from '../model/builder/ArkMethodBuilder';
import { Value } from '../base/Value';
import { Constant } from '../base/Constant';
import { Builtin } from './Builtin';
import { CALL_BACK } from './EtsConst';

export class ModelUtils {
    public static implicitArkUIBuilderMethods: Set<ArkMethod> = new Set();

    /*
     * Set static field to be null, then all related objects could be freed by GC.
     * Static field implicitArkUIBuilderMethods is only used during method body building, the dispose method should be called after build all body.
     */
    public static dispose(): void {
        this.implicitArkUIBuilderMethods.clear();
    }

    public static getMethodSignatureFromArkClass(arkClass: ArkClass, methodName: string): MethodSignature | null {
        for (const arkMethod of arkClass.getMethods()) {
            if (arkMethod.getName() === methodName) {
                return arkMethod.getSignature();
            }
        }
        return null;
    }

    public static getClassWithNameInNamespaceRecursively(className: string, ns: ArkNamespace): ArkClass | null {
        if (className === '') {
            return null;
        }
        let res: ArkClass | null = null;
        res = ns.getClassWithName(className);
        if (res == null) {
            let declaringNs = ns.getDeclaringArkNamespace();
            if (declaringNs != null) {
                res = this.getClassWithNameInNamespaceRecursively(className, declaringNs);
            } else {
                res = this.getClassInFileWithName(className, ns.getDeclaringArkFile());
            }
        }
        return res;
    }

    public static getClassWithNameFromClass(className: string, startFrom: ArkClass): ArkClass | null {
        if (!className.includes('.')) {
            let res: ArkClass | null = null;
            const arkNamespace = startFrom.getDeclaringArkNamespace();
            if (arkNamespace) {
                res = this.getClassWithNameInNamespaceRecursively(className, arkNamespace);
            } else {
                res = this.getClassInFileWithName(className, startFrom.getDeclaringArkFile());
            }
            return res;
        } else {
            const names = className.split('.');
            let nameSpace = this.getNamespaceWithNameFromClass(names[0], startFrom);
            for (let i = 1; i < names.length - 1; i++) {
                if (nameSpace) {
                    nameSpace = nameSpace.getNamespaceWithName(names[i]);
                }
            }
            if (nameSpace) {
                return nameSpace.getClassWithName(names[names.length - 1]);
            }
        }
        return null;
    }

    /**
     *  search class within the file that contain the given method
     */
    public static getClassWithName(className: string, thisClass: ArkClass): ArkClass | null {
        if (thisClass.getName() === className) {
            return thisClass;
        }
        let classSearched = thisClass.getDeclaringArkNamespace()?.getClassWithName(className);
        if (!classSearched) {
            classSearched = thisClass.getDeclaringArkFile().getClassWithName(className);
        }
        return classSearched;
    }

    /** search class within the given file */
    public static getClassInFileWithName(className: string, arkFile: ArkFile): ArkClass | null {
        let classSearched = arkFile.getClassWithName(className);
        if (classSearched != null) {
            return classSearched;
        }
        return null;
    }

    public static getClassInImportInfoWithName(className: string, arkFile: ArkFile): ArkClass | null {
        let arkExport = this.getArkExportInImportInfoWithName(className, arkFile);
        if (arkExport instanceof ArkClass) {
            return arkExport;
        }
        return null;
    }

    /** search type within the given file import infos */
    public static getArkExportInImportInfoWithName(name: string, arkFile: ArkFile): ArkExport | null {
        return arkFile.getImportInfoBy(name)?.getLazyExportInfo()?.getArkExport() ?? null;
    }

    /** search method within the file that contain the given method */
    public static getMethodWithName(methodName: string, startFrom: ArkMethod): ArkMethod | null {
        if (!methodName.includes('.')) {
            if (startFrom.getName() === methodName) {
                return startFrom;
            }

            const thisClass = startFrom.getDeclaringArkClass();
            let methodSearched: ArkMethod | null = thisClass.getMethodWithName(methodName);
            if (!methodSearched) {
                methodSearched = thisClass.getStaticMethodWithName(methodName);
            }
            return methodSearched;
        } else {
            const names = methodName.split('.');
            let nameSpace = this.getNamespaceWithName(names[0], startFrom.getDeclaringArkClass());
            for (let i = 1; i < names.length - 1; i++) {
                if (nameSpace) {
                    nameSpace = nameSpace.getNamespaceWithName(names[i]);
                }
            }
            if (nameSpace) {
                return nameSpace.getDefaultClass().getMethodWithName(names[names.length - 1]);
            }
        }
        return null;
    }

    public static getNamespaceWithNameFromClass(namespaceName: string, startFrom: ArkClass): ArkNamespace | null {
        const thisNamespace = startFrom.getDeclaringArkNamespace();
        let namespaceSearched: ArkNamespace | null = null;
        if (thisNamespace) {
            namespaceSearched = thisNamespace.getNamespaceWithName(namespaceName);
            if (namespaceSearched) {
                return namespaceSearched;
            }
        }
        const thisFile = startFrom.getDeclaringArkFile();
        namespaceSearched = this.getNamespaceInFileWithName(namespaceName, thisFile);
        return namespaceSearched;
    }

    public static getNamespaceWithName(namespaceName: string, thisClass: ArkClass): ArkNamespace | null {
        let thisNamespace: ArkNamespace | null | undefined = thisClass.getDeclaringArkNamespace();
        let namespaceSearched: ArkNamespace | null = null;
        while (!namespaceSearched && thisNamespace) {
            namespaceSearched = thisNamespace.getNamespaceWithName(namespaceName);
            thisNamespace = thisNamespace.getDeclaringArkNamespace();
        }
        if (!namespaceSearched) {
            namespaceSearched = thisClass.getDeclaringArkFile().getNamespaceWithName(namespaceName);
        }
        return namespaceSearched;
    }

    public static getNamespaceInFileWithName(namespaceName: string, arkFile: ArkFile): ArkNamespace | null {
        let namespaceSearched = arkFile.getNamespaceWithName(namespaceName);
        if (namespaceSearched) {
            return namespaceSearched;
        }

        return null;
    }

    public static findSymbolInFileWithName(symbolName: string, arkClass: ArkClass, onlyType: boolean = false): ArkExport | null {
        // find symbol from enum value
        if (arkClass.getCategory() === ClassCategory.ENUM) {
            const field = arkClass.getStaticFieldWithName(symbolName);
            if (field) {
                return new Local(symbolName, TypeInference.getEnumValueType(field) ?? field.getType());
            }
        }
        // look up symbol from inner to outer
        let currNamespace: ArkNamespace | null | undefined = arkClass.getDeclaringArkNamespace();
        let result: ArkExport | null | undefined;
        while (currNamespace) {
            result = currNamespace.getClassWithName(symbolName) ??
                currNamespace.getDefaultClass()?.getDefaultArkMethod()?.getBody()?.getAliasTypeByName(symbolName) ??
                currNamespace.getDefaultClass()?.getDefaultArkMethod()?.getBody()?.getLocals()?.get(symbolName);
            if (!result && !onlyType) {
                result = (currNamespace.getName() === symbolName ? currNamespace : null) ??
                    currNamespace.getNamespaceWithName(symbolName) ??
                    currNamespace.getDefaultClass().getMethodWithName(symbolName);
            }
            if (result) {
                return result;
            }
            currNamespace = currNamespace.getDeclaringArkNamespace();
        }
        const file = arkClass.getDeclaringArkFile();
        result =
            file.getClassWithName(symbolName) ??
            file.getDefaultClass().getDefaultArkMethod()?.getBody()?.getAliasTypeByName(symbolName) ??
            file.getDefaultClass()?.getDefaultArkMethod()?.getBody()?.getLocals().get(symbolName);
        if (!result && !onlyType) {
            result = file.getNamespaceWithName(symbolName) ??
                file.getDefaultClass().getMethodWithName(symbolName);

        }
        return result || null;
    }

    public static getNamespaceInImportInfoWithName(namespaceName: string, arkFile: ArkFile): ArkNamespace | null {
        let arkExport = this.getArkExportInImportInfoWithName(namespaceName, arkFile);
        if (arkExport instanceof ArkNamespace) {
            return arkExport;
        }
        return null;
    }

    public static getStaticMethodWithName(methodName: string, thisClass: ArkClass): ArkMethod | null {
        const thisNamespace = thisClass.getDeclaringArkNamespace();
        if (thisNamespace) {
            const defaultClass = thisNamespace.getClassWithName(DEFAULT_ARK_CLASS_NAME);
            if (defaultClass) {
                const method = defaultClass.getMethodWithName(methodName);
                if (method) {
                    return method;
                }
            }
        }
        return this.getStaticMethodInFileWithName(methodName, thisClass.getDeclaringArkFile());
    }

    public static isLanguageOverloadSupport(language: Language): boolean {
        if (language === Language.CXX) {
            return true;
        } else {
            return false;
        }
    }

    public static getStaticMethodInFileWithName(methodName: string, arkFile: ArkFile): ArkMethod | null {
        const defaultClass = arkFile.getClasses().find(cls => cls.getName() === DEFAULT_ARK_CLASS_NAME) || null;
        if (defaultClass) {
            let method = defaultClass.getMethodWithName(methodName);
            if (method) {
                return method;
            }
        }
        return null;
    }

    public static getStaticMethodInImportInfoWithName(methodName: string, arkFile: ArkFile): ArkMethod | null {
        let arkExport = this.getArkExportInImportInfoWithName(methodName, arkFile);
        if (arkExport instanceof ArkMethod) {
            return arkExport;
        }
        return null;
    }

    public static getLocalInImportInfoWithName(localName: string, arkFile: ArkFile): Local | null {
        let arkExport = this.getArkExportInImportInfoWithName(localName, arkFile);
        if (arkExport instanceof Local) {
            return arkExport;
        }
        return null;
    }

    /* get nested namespaces in a file */
    public static getAllNamespacesInFile(arkFile: ArkFile): ArkNamespace[] {
        const arkNamespaces: ArkNamespace[] = arkFile.getNamespaces();
        for (const arkNamespace of arkFile.getNamespaces()) {
            this.getAllNamespacesInNamespace(arkNamespace, arkNamespaces);
        }
        return arkNamespaces;
    }

    /* get nested namespaces in a namespace */
    public static getAllNamespacesInNamespace(arkNamespace: ArkNamespace, allNamespaces: ArkNamespace[]): void {
        allNamespaces.push(...arkNamespace.getNamespaces());
        for (const nestedNamespace of arkNamespace.getNamespaces()) {
            this.getAllNamespacesInNamespace(nestedNamespace, allNamespaces);
        }
    }

    public static getAllClassesInFile(arkFile: ArkFile): ArkClass[] {
        const allClasses = arkFile.getClasses();
        this.getAllNamespacesInFile(arkFile).forEach(namespace => {
            allClasses.push(...namespace.getClasses());
        });
        return allClasses;
    }

    public static getAllMethodsInFile(arkFile: ArkFile): ArkMethod[] {
        const allMethods: ArkMethod[] = [];
        this.getAllClassesInFile(arkFile).forEach(cls => {
            allMethods.push(...cls.getMethods());
        });
        return allMethods;
    }

    public static isArkUIBuilderMethod(arkMethod: ArkMethod): boolean {
        let isArkUIBuilderMethod = arkMethod.hasBuilderDecorator() || this.implicitArkUIBuilderMethods.has(arkMethod);

        if (!isArkUIBuilderMethod && arkMethod.getName() === 'build' && arkMethod.getDeclaringArkClass().hasComponentDecorator() && !arkMethod.isStatic()) {
            const fileName = arkMethod.getDeclaringArkClass().getDeclaringArkFile().getName();
            if (fileName.endsWith('.ets')) {
                isArkUIBuilderMethod = true;
            }
        }
        return isArkUIBuilderMethod;
    }

    public static getArkClassInBuild(scene: Scene, classType: ClassType): ArkClass | null {
        const classSignature = classType.getClassSignature();
        const file = scene.getFile(classSignature.getDeclaringFileSignature());
        const namespaceSignature = classSignature.getDeclaringNamespaceSignature();
        if (namespaceSignature) {
            return file?.getNamespace(namespaceSignature)?.getClass(classSignature) || null;
        }
        return file?.getClassWithName(classSignature.getClassName()) || null;
    }

    public static getDefaultClass(arkClass: ArkClass): ArkClass | null {
        return arkClass.getDeclaringArkNamespace()?.getDefaultClass() ?? arkClass.getDeclaringArkFile().getDefaultClass();
    }

    public static getClass(method: ArkMethod, signature: ClassSignature): ArkClass | null {
        let cls: ArkClass | undefined | null = method.getDeclaringArkFile().getScene().getClass(signature);
        if (cls) {
            return cls;
        }
        let importInfo = method.getDeclaringArkFile().getImportInfoBy(signature.getClassName());
        let exportInfo = importInfo ? findExportInfo(importInfo) : null;
        let arkExport = exportInfo?.getArkExport();
        if (arkExport instanceof ArkClass) {
            return arkExport;
        }

        cls = method.getDeclaringArkClass().getDeclaringArkNamespace()?.getClassWithName(signature.getClassName());
        if (cls) {
            return cls;
        }

        for (const ns of method.getDeclaringArkFile().getAllNamespacesUnderThisFile()) {
            cls = ns.getClassWithName(signature.getClassName());
            if (cls) {
                return cls;
            }
        }

        return method.getDeclaringArkFile().getClassWithName(signature.getClassName());
    }

    public static findPropertyInNamespace(name: string, namespace: ArkNamespace): ArkExport | undefined {
        return (
            namespace.getDefaultClass()?.getMethodWithName(name) ??
            findArkExport(namespace.getExportInfoBy(name)) ??
            namespace.getClassWithName(name) ??
            namespace.getNamespaceWithName(name) ??
            namespace.getDefaultClass()?.getDefaultArkMethod()?.getBody()?.getAliasTypeByName(name) ??
            namespace.getDefaultClass()?.getDefaultArkMethod()?.getBody()?.getLocals()?.get(name)
        );
    }

    public static findPropertyInClass(name: string, arkClass: ArkClass): ArkExport | ArkField | null {
        let property: ArkExport | ArkField | null =
            arkClass.getMethodWithName(name) ??
            arkClass.getStaticMethodWithName(name) ??
            arkClass.getMethodWithName('Get-' + name) ??
            arkClass.getFieldWithName(name) ??
            arkClass.getStaticFieldWithName(name);
        if (property) {
            return property;
        }
        if (arkClass.isDefaultArkClass()) {
            return findArkExport(arkClass.getDeclaringArkFile().getExportInfoBy(name));
        }
        for (const heritage of arkClass.getAllHeritageClasses()) {
            property = this.findPropertyInClass(name, heritage);
            if (property) {
                return property;
            }
        }
        const objectClass = arkClass.getDeclaringArkFile().getScene().getSdkGlobal('Object');
        if (objectClass instanceof ArkClass && arkClass !== objectClass) {
            return this.findPropertyInClass(name, objectClass);
        }
        return null;
    }

    public static findDeclaredLocal(local: Local, arkMethod: ArkMethod, times: number = 0): Local | null {
        const name: string = local.getName();
        if (name === THIS_NAME || name.startsWith(TEMP_LOCAL_PREFIX)) {
            return null;
        }
        const parameter = arkMethod.getParameters().find(p => p.getName() === name);
        if (parameter) {
            return new Local(parameter.getName(), parameter.getType());
        }
        if (times > 0) {
            const declaredLocal = arkMethod.getBody()?.getLocals().get(name);
            if (
                declaredLocal &&
                declaredLocal.getDeclaringStmt() instanceof ArkAssignStmt &&
                !((declaredLocal.getDeclaringStmt() as ArkAssignStmt).getRightOp() instanceof ClosureFieldRef)
            ) {
                return declaredLocal;
            }
        }
        let parentName = arkMethod.getName();
        if (parentName === DEFAULT_ARK_METHOD_NAME) {
            return null;
        }
        let invokeMethod: ArkMethod | null | undefined = arkMethod.getOuterMethod();
        if (!invokeMethod) {
            const className = arkMethod.getDeclaringArkClass().getName();
            const outerStart = className.indexOf(NAME_DELIMITER);
            const outerEnd = className.lastIndexOf('.');
            if (outerStart > -1 && outerEnd > -1) {
                invokeMethod = arkMethod
                    .getDeclaringArkFile()
                    .getClassWithName(className.substring(outerStart + 1, outerEnd))
                    ?.getMethodWithName(className.substring(outerEnd + 1));
            } else {
                const symbol = this.findSymbolInFileWithName(name, arkMethod.getDeclaringArkClass(), true);
                return symbol instanceof Local ? symbol : null;
            }
        }
        if (invokeMethod) {
            return this.findDeclaredLocal(local, invokeMethod, ++times);
        }
        return null;
    }

    public static findArkModel(baseName: string, arkClass: ArkClass): ArkExport | ArkField | null {
        let arkModel: ArkExport | ArkField | null =
            arkClass.getMethodWithName(baseName) ??
            arkClass.getStaticMethodWithName(baseName) ??
            arkClass.getFieldWithName(baseName) ??
            arkClass.getStaticFieldWithName(baseName);
        if (arkModel) {
            return arkModel;
        }
        arkModel =
            ModelUtils.getDefaultClass(arkClass)?.getDefaultArkMethod()?.getBody()?.getLocals()?.get(baseName) ??
            ModelUtils.getClassWithName(baseName, arkClass) ??
            ModelUtils.getNamespaceWithName(baseName, arkClass) ??
            ModelUtils.getDefaultClass(arkClass)?.getMethodWithName(baseName) ??
            ModelUtils.getDefaultClass(arkClass)?.getDefaultArkMethod()?.getBody()?.getAliasTypeByName(baseName) ??
            ModelUtils.getArkExportInImportInfoWithName(baseName, arkClass.getDeclaringArkFile());
        if (!arkModel && !arkClass.getDeclaringArkFile().getImportInfoBy(baseName)) {
            arkModel = arkClass.getDeclaringArkFile().getScene().getSdkGlobal(baseName);
        }
        return arkModel;
    }

    public static findGlobalRef(refName: string, method: ArkMethod): ArkExport | null {
        return (
            this.findDeclaredLocal(new Local(refName), method, 1) ??
            this.getArkExportInImportInfoWithName(refName, method.getDeclaringArkFile()) ??
            method.getDeclaringArkFile().getScene().getSdkGlobal(refName)
        );
    }

    public static findArkModelByRefName(refName: string, arkClass: ArkClass): ArkExport | ArkField | null {
        const singleNames = refName.split('.');
        let model = null;
        for (let i = 0; i < singleNames.length; i++) {
            if (model instanceof Local || model instanceof ArkField) {
                const type = model.getType();
                if (type instanceof ClassType) {
                    model = arkClass.getDeclaringArkFile().getScene().getClass(type.getClassSignature());
                } else if (type instanceof AnnotationNamespaceType) {
                    model = arkClass.getDeclaringArkFile().getScene().getNamespace(type.getNamespaceSignature());
                }
            }
            const name = singleNames[i].replace(/<(\w+)>/, EMPTY_STRING);
            if (i === 0) {
                model = this.findArkModel(name, arkClass);
            } else if (model instanceof ArkClass) {
                model = this.findPropertyInClass(name, model);
            } else if (model instanceof ArkNamespace) {
                model = this.findPropertyInNamespace(name, model);
            }
            if (!model) {
                return null;
            }
        }
        return model;
    }

    public static findArkModelBySignature(signature: Signature, scene: Scene): ArkExport | ArkField | null {
        if (signature instanceof ClassSignature) {
            return scene.getClass(signature);
        } else if (signature instanceof NamespaceSignature) {
            return scene.getNamespace(signature);
        } else if (signature instanceof MethodSignature) {
            return scene.getMethod(signature);
        } else if (signature instanceof FieldSignature) {
            const declare = this.findArkModelBySignature(signature.getDeclaringSignature(), scene);
            if (declare instanceof ArkClass) {
                return this.findPropertyInClass(signature.getFieldName(), declare);
            } else if (declare instanceof ArkNamespace) {
                return this.findPropertyInNamespace(signature.getFieldName(), declare) || null;
            }
            return null;
        } else if (signature instanceof LocalSignature) {
            const declare = scene.getMethod(signature.getDeclaringMethodSignature());
            return declare?.getBody()?.getLocals().get(signature.getName()) ?? declare?.getBody()?.getAliasTypeByName(signature.getName()) ?? null;
        } else if (signature instanceof AliasTypeSignature) {
            const declare = scene.getMethod(signature.getDeclaringMethodSignature());
            return declare?.getBody()?.getAliasTypeByName(signature.getName()) ?? null;
        }
        return null;
    }

    public static parseArkBaseModel2Type(arkBaseModel: ArkBaseModel): Type | null {
        if (arkBaseModel instanceof ArkClass) {
            return new ClassType(arkBaseModel.getSignature(), arkBaseModel.getGenericsTypes());
        } else if (arkBaseModel instanceof ArkNamespace) {
            return AnnotationNamespaceType.getInstance(arkBaseModel.getSignature());
        } else if (arkBaseModel instanceof ArkMethod) {
            return new FunctionType(arkBaseModel.getSignature());
        } else if (arkBaseModel instanceof ArkField) {
            if (arkBaseModel.getType() instanceof UnknownType || arkBaseModel.getType() instanceof UnclearReferenceType) {
                return null;
            }
            return arkBaseModel.getType();
        }
        return null;
    }

    public static isMatched(parameters: MethodParameter[], args: Value[], scene: Scene, isArrowFunc: boolean = false): boolean {
        for (let i = 0; i < parameters.length; i++) {
            if (!args[i]) {
                return isArrowFunc ? true : parameters[i].isOptional();
            }
            const paramType = parameters[i].getType();
            const isMatched = ModelUtils.matchParam(paramType, args[i], scene);
            if (!isMatched) {
                return false;
            } else if (paramType instanceof EnumValueType || paramType instanceof LiteralType) {
                return true;
            }
        }
        return true;
    }

    private static matchParam(paramType: Type, argument: Value, scene: Scene): boolean {
        const arg = ModelUtils.parseArg(argument, paramType);
        let argType = arg.getType();
        if (paramType instanceof AliasType && !(argType instanceof AliasType)) {
            paramType = TypeInference.replaceAliasType(paramType);
        } else if (!(paramType instanceof AliasType) && argType instanceof AliasType) {
            argType = TypeInference.replaceAliasType(argType);
        }

        if (paramType instanceof UnionType) {
            return !!paramType.getTypes().find(p => this.matchParam(p, arg, scene));
        } else if (argType instanceof FunctionType && paramType instanceof FunctionType) {
            if (argType.getMethodSignature().getParamLength() > paramType.getMethodSignature().getParamLength()) {
                return false;
            }
            const parameters = paramType.getMethodSignature().getMethodSubSignature().getParameters();
            const args = argType.getMethodSignature().getMethodSubSignature().getParameters().filter(p => !p.getName().startsWith(LEXICAL_ENV_NAME_PREFIX));
            return ModelUtils.isMatched(parameters, args, scene, true);
        }
        return ModelUtils.matchType(paramType, argType, arg, scene);
    }

    private static matchType(paramType: Type, argType: Type, arg: Value, scene: Scene): boolean {
        if (paramType instanceof LiteralType) {
            const argStr = arg instanceof Constant ? arg.getValue() : argType.getTypeString();
            return argStr.replace(/[\"|\']/g, '') ===
                paramType.getTypeString().replace(/[\"|\']/g, '');
        } else if (paramType instanceof ClassType && argType instanceof EnumValueType) {
            return paramType.getClassSignature() === argType.getFieldSignature().getDeclaringSignature();
        } else if (paramType instanceof EnumValueType) {
            if (argType instanceof EnumValueType) {
                return paramType.getFieldSignature() === argType.getFieldSignature();
            } else if (argType.constructor === paramType.getConstant()?.getType().constructor && arg instanceof Constant) {
                return paramType.getConstant()?.getValue() === arg.getValue();
            }
        } else if (paramType instanceof ClassType && paramType.getClassSignature().getClassName().startsWith(ANONYMOUS_CLASS_PREFIX)) {
            if (argType instanceof ClassType) {
                const className = argType.getClassSignature().getClassName();
                return className === Builtin.OBJECT || className.startsWith(ANONYMOUS_CLASS_PREFIX);
            }
            return false;
        } else if (paramType instanceof ClassType && argType instanceof ClassType) {
            return ModelUtils.classTypeMatch(paramType, argType, scene);
        } else if (paramType instanceof ClassType && paramType.getClassSignature().getClassName().includes(CALL_BACK)) {
            return argType instanceof FunctionType;
        }
        return argType.constructor === paramType.constructor;
    }


    private static classTypeMatch(paramType: ClassType, argType: ClassType, scene: Scene): boolean {
        const paramClass = scene.getClass(paramType.getClassSignature());
        const argClass = scene.getClass(argType.getClassSignature());
        if (!paramClass || !argClass) {
            return false;
        }
        if (paramClass === argClass) {
            return true;
        }
        const mustFields = paramClass.getFields().filter(f => !f.isStatic() && !f.getQuestionToken());
        const noMatchedField = mustFields.find(f => !argClass.getFieldWithName(f.getName()));
        if (noMatchedField) {
            return false;
        }
        const mustMethods = paramClass.getMethods().filter(f => !f.isStatic() && !f.getQuestionToken());
        const noMatchedMethod = mustMethods.find(f => !argClass.getMethodWithName(f.getName()));
        if (noMatchedMethod) {
            return false;
        }
        if (mustFields.length === 0 && mustMethods.length === 0) {
            const excessField = argClass.getFields().find(f => !paramClass.getFieldWithName(f.getName()));
            if (excessField) {
                return false;
            }
            const excessMethod = argClass.getMethods().find(f => !paramClass.getMethodWithName(f.getName()));
            if (excessMethod) {
                return false;
            }
        }
        return true;
    }

    private static parseArg(arg: Value, paramType: Type): Value {
        if ((paramType instanceof EnumValueType || paramType instanceof LiteralType) && arg instanceof Local) {
            const stmt = arg.getDeclaringStmt();
            const argType = arg.getType();
            if (argType instanceof EnumValueType && argType.getConstant()) {
                arg = argType.getConstant()!;
            } else if (stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof Constant) {
                arg = stmt.getRightOp();
            }
        }
        return arg;
    }
}

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ModelUtils');
let moduleMap: Map<string, ModulePath> | undefined;

/**
 * find arkFile by from info
 * export xx from '../xx'
 * import xx from '@ohos/xx'
 * import xx from '@ohos.xx'
 * @param im importInfo or exportInfo
 */
export function getArkFile(im: FromInfo): ArkFile | null | undefined {
    const from = im.getFrom();
    if (!from) {
        return null;
    }
    if (/^([^@]*\/)([^\/]*)$/.test(from)) {
        //relative path
        const parentPath = /^\.{1,2}\//.test(from) ? path.dirname(im.getDeclaringArkFile().getFilePath()) : im.getDeclaringArkFile().getProjectDir();
        const originPath = path.resolve(parentPath, from);
        return getArkFileFromScene(im, originPath);
    } else if (moduleMap?.get(from) || /^@[a-z|\-]+?\//.test(from)) {
        //module path
        const arkFile = getArkFileFromOtherModule(im);
        if (arkFile) {
            return arkFile;
        }
    }

    //sdk path
    const file = SdkUtils.getImportSdkFile(from);
    if (file) {
        return file;
    }
    const scene = im.getDeclaringArkFile().getScene();
    for (const sdk of scene.getProjectSdkMap().values()) {
        const arkFile = getArkFileFormMap(sdk.name, processSdkPath(sdk, from), scene);
        if (arkFile) {
            return arkFile;
        }
    }
    return null;
}

/**
 * find from info's export
 * @param fromInfo importInfo or exportInfo
 */
export function findExportInfo(fromInfo: FromInfo): ExportInfo | null {
    let file = getArkFile(fromInfo);
    if (!file) {
        logger.warn(`${fromInfo.getOriginName()} ${fromInfo.getFrom()} file not found: ${fromInfo.getDeclaringArkFile()?.getFileSignature()?.toString()}`);
        return null;
    }
    // expand export *
    if (fromInfo.getOriginName().startsWith(TEMP_EXPORT_ALL_PREFIX) && fromInfo instanceof ExportInfo) {
        const declaringArkFile = fromInfo.getDeclaringArkFile();
        if (declaringArkFile !== file) {
            file.getExportInfos().filter(f => f.getExportClauseName().startsWith(TEMP_EXPORT_ALL_PREFIX)).forEach(e => findExportInfo(e));
            file.getExportInfos().filter(f => !f.isDefault()).forEach(exportInfo => declaringArkFile.addExportInfo(exportInfo));
        }
        declaringArkFile.removeExportInfo(fromInfo);
        return null;
    }
    let exportInfo = findExportInfoInfile(fromInfo, file) || null;
    if (exportInfo === null) {
        logger.warn('export info not found, ' + fromInfo.getFrom() + ' in file: ' + fromInfo.getDeclaringArkFile().getFileSignature().toString());
        return null;
    }
    const arkExport = findArkExport(exportInfo);
    exportInfo.setArkExport(arkExport);
    if (arkExport) {
        exportInfo.setExportClauseType(arkExport.getExportType());
    }
    return exportInfo;
}

export function findArkExport(exportInfo: ExportInfo | undefined): ArkExport | null {
    if (!exportInfo) {
        return null;
    }
    let arkExport = exportInfo.getArkExport();
    if (arkExport || arkExport === null) {
        return arkExport;
    }
    if (!exportInfo.getFrom()) {
        const name = exportInfo.getOriginName();
        const defaultClass = exportInfo.getDeclaringArkNamespace()?.getDefaultClass() ?? exportInfo.getDeclaringArkFile().getDefaultClass();
        if (exportInfo.getExportClauseType() === ExportType.LOCAL) {
            arkExport = defaultClass.getDefaultArkMethod()?.getBody()?.getExportLocalByName(name);
        } else if (exportInfo.getExportClauseType() === ExportType.TYPE) {
            arkExport = defaultClass.getDefaultArkMethod()?.getBody()?.getAliasTypeByName(name);
        } else {
            arkExport = findArkExportInFile(name, exportInfo.getDeclaringArkFile());
        }
    } else if (exportInfo.getExportClauseType() === ExportType.UNKNOWN) {
        const result = findExportInfo(exportInfo);
        if (result) {
            arkExport = result.getArkExport() || null;
        }
    }
    if (arkExport) {
        exportInfo.setArkExport(arkExport);
    } else {
        const file = exportInfo.getDeclaringArkFile().getFileSignature().toString();
        logger.warn(`${exportInfo.getExportClauseName()} get arkExport fail from ${exportInfo.getFrom()} at ${file}`);
    }
    return arkExport || null;
}

export function findArkExportInFile(name: string, declaringArkFile: ArkFile): ArkExport | null {
    let arkExport: ArkExport | undefined | null =
        declaringArkFile.getNamespaceWithName(name) ??
        declaringArkFile.getDefaultClass().getDefaultArkMethod()?.getBody()?.getAliasTypeByName(name) ??
        declaringArkFile.getClassWithName(name) ??
        declaringArkFile.getDefaultClass().getMethodWithName(name) ??
        declaringArkFile.getDefaultClass().getDefaultArkMethod()?.getBody()?.getExportLocalByName(name);

    if (!arkExport) {
        const importInfo = declaringArkFile.getImportInfoBy(name);
        if (importInfo) {
            const result = findExportInfo(importInfo);
            if (result) {
                arkExport = result.getArkExport();
            }
        }
    }
    return arkExport || null;
}

function processSdkPath(sdk: Sdk, formPath: string): string {
    let originPath = path.join(sdk.path, formPath);
    if (FileUtils.isDirectory(originPath)) {
        formPath = path.join(formPath, FileUtils.getIndexFileName(originPath));
    }
    return `${formPath}`;
}

function getArkFileFromScene(im: FromInfo, originPath: string): ArkFile | null {
    if (FileUtils.isDirectory(originPath)) {
        originPath = path.join(originPath, FileUtils.getIndexFileName(originPath));
    }
    const fileName = path.relative(im.getDeclaringArkFile().getProjectDir(), originPath);
    const scene = im.getDeclaringArkFile().getScene();
    if (/\.e?ts$/.test(originPath)) {
        const fromSignature = new FileSignature(im.getDeclaringArkFile().getProjectName(), fileName);
        return scene.getFile(fromSignature);
    }
    const projectName = im.getDeclaringArkFile().getProjectName();
    return getArkFileFormMap(projectName, fileName, scene);
}

function getArkFileFormMap(projectName: string, filePath: string, scene: Scene): ArkFile | null {
    if (/\.e?ts$/.test(filePath)) {
        return scene.getFile(new FileSignature(projectName, filePath));
    }
    const fileSuffixArray = scene.getOptions().supportFileExts;
    if (!fileSuffixArray) {
        return null;
    }
    for (const suffix of fileSuffixArray) {
        const arkFile = scene.getFile(new FileSignature(projectName, filePath + suffix));
        if (arkFile) {
            return arkFile;
        }
    }
    return null;
}

export function findExportInfoInfile(fromInfo: FromInfo, file: ArkFile): ExportInfo | undefined {
    const exportName = fromInfo.isDefault() ? DEFAULT : fromInfo.getOriginName();
    let exportInfo = file.getExportInfoBy(exportName);
    if (exportInfo) {
        return exportInfo;
    }

    if (exportName === DEFAULT) {
        exportInfo = file.getExportInfos().find(p => p.isDefault());
        if (exportInfo) {
            file.addExportInfo(exportInfo, DEFAULT);
            return exportInfo;
        }
    }

    if (fromInfo.getOriginName() === ALL) {
        exportInfo = buildDefaultExportInfo(fromInfo, file);
        file.addExportInfo(exportInfo, ALL);
    } else if (/\.d\.e?ts$/.test(file.getName())) {
        let declare = exportName === DEFAULT ? undefined : findArkExportInFile(fromInfo.getOriginName(), file) || undefined;
        exportInfo = buildDefaultExportInfo(fromInfo, file, declare);
    }

    return exportInfo;
}

export function initModulePathMap(ohPkgContentMap: Map<string, { [k: string]: unknown }>): void {
    if (moduleMap) {
        moduleMap.clear();
    }
    moduleMap = FileUtils.generateModuleMap(ohPkgContentMap);
}

function getArkFileFromOtherModule(fromInfo: FromInfo): ArkFile | undefined {
    if (!moduleMap || moduleMap.size === 0) {
        return undefined;
    }
    const from = fromInfo.getFrom()!;
    let index: number;
    let file;
    let modulePath;
    //find file by given from like '@ohos/module/src/xxx' '@ohos/module/index'
    if ((index = from.indexOf('src')) > 0 || (index = from.indexOf('Index')) > 0 || (index = from.indexOf('index')) > 0) {
        modulePath = moduleMap.get(from.substring(0, index).replace(/\/*$/, ''));
        file = findFileInModule(fromInfo, modulePath, from.substring(index));
    }
    if (file) {
        return file;
    }
    modulePath = modulePath ?? moduleMap.get(from);
    if (!modulePath) {
        return file;
    }
    //find file in module json main path
    if (modulePath.main) {
        file = getArkFileFromScene(fromInfo, modulePath.main);
    }
    //find file in module path Index.ts
    if (!file && FileUtils.isDirectory(modulePath.path)) {
        file = findFileInModule(fromInfo, modulePath, FileUtils.getIndexFileName(modulePath.path));
    }
    //find file in module path/src/main/ets/TsIndex.ts
    if (!file) {
        file = findFileInModule(fromInfo, modulePath, '/src/main/ets/TsIndex.ts');
    }
    return file;
}

function findFileInModule(fromInfo: FromInfo, modulePath: ModulePath | undefined, contentPath: string): ArkFile | undefined {
    if (!modulePath) {
        return undefined;
    }
    const originPath = path.join(modulePath.path, contentPath);
    let file;
    if (originPath !== modulePath.main) {
        file = getArkFileFromScene(fromInfo, originPath);
    }
    if (file && findExportInfoInfile(fromInfo, file)) {
        return file;
    }
    return undefined;
}
