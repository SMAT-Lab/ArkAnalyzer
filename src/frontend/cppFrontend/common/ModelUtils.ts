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

import { ArkFile, Language } from '../../../core/model/ArkFile';
import { ClassSignature, FileSignature } from '../../../core/model/ArkSignature';
import { ArkExport, ExportInfo, ExportType, FromInfo } from '../../../core/model/ArkExport';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { getFileAbsPath } from '../../../utils/FileUtils';
import path from 'path';
import { ImportInfo, ImportType } from '../../../core/model/ArkImport';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { ArkClass, ClassCategory } from '../../../core/model/ArkClass';
import { Value } from '../../../core/base/Value';
import { Local } from '../../../core/base/Local';
import { StringConstant } from '../../../core/base/Constant';
import {
    ANONYMOUS_NAMESPACE_PREFIX,
    INSTANCE_INIT_METHOD_NAME,
    NAME_DELIMITER,
    STATIC_INIT_METHOD_NAME,
    TEMP_LOCAL_PREFIX,
} from '../../../core/common/Const';
import { FunctionType } from '../../../core/base/Type';
import { ArkNamespace } from '../../../core/model/ArkNamespace';
import { findArkExport, ModelUtils } from '../../../core/common/ModelUtils';
import { DEFAULT_ARK_CLASS_NAME } from '../../../core/common/Const';
import { ArkField } from '../../../core/model/ArkField';
import { TypeInference } from '../../../core/common/TypeInference';
import { MethodParameter } from '../../../core/model/builder/ArkMethodBuilder';
import { Scene } from '../../../Scene';
import { ReferenceType } from '../base/Type';
import { SignatureCanonicalizerRegistry } from '../../../core/common/SignatureCanonicalizerRegistry';

// Common C++standard library header files (excluding the .h suffix)
const CXX_STD_HEADERS = new Set([
    'iostream',
    'iomanip',
    'fstream',
    'sstream',
    'string',
    'vector',
    'map',
    'unordered_map',
    'set',
    'unordered_set',
    'queue',
    'stack',
    'list',
    'algorithm',
    'utility',
    'memory',
    'thread',
    'mutex',
    'condition_variable',
    'future',
    'atomic',
    'chrono',
    'functional',
    'stdexcept',
    'type_traits',
    'cassert',
    'cstdint',
    'cstdlib',
    'cstdio',
    'cstring',
    'cmath',
    'array',
    'bitset',
    'deque',
    'tuple',
    'numeric',
    'any',
    'optional',
    'variant',
    'filesystem',
    'span',
]);

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ModelUtils');
/**
 * find arkFile by from info
 * #include "xx/xx.h"
 * @param im importInfo or exportInfo
 */
export function getArkFile(im: FromInfo): ArkFile | null | undefined {
    let from = im.getFrom();
    if (!from) {
        return null;
    }
    if (!path.isAbsolute(from)) {
        from = getFileAbsPath([im.getDeclaringArkFile().getFilePath()], from);
    }
    if (!from) {
        return null;
    }
    const scene = im.getDeclaringArkFile().getScene();
    return scene.getFile(new FileSignature(scene.getProjectName(), path.relative(scene.getRealProjectDir(), from)));
}

/**
 * #include "xx/xx.h" ==> Precompilation directly expands ==> Equivalent to importing all content of the file ==> Get exportInfo directly from header file
 * find from info's export
 * @param fromInfo importInfo or exportInfo
 * @param fromFile The file where the imported object is located
 */
export function findExportInfo(fromInfo: FromInfo, fromFile?: ArkFile | null): ExportInfo | null {
    // scenario 1. processing using namespace xxx
    if (fromInfo instanceof ImportInfo && fromInfo.getImportTypeTag() === ImportType.NAMESPACE_IMPORT && fromInfo.getFrom() === '') {
        return processNamespaceImport(fromInfo);
    }
    // scenario 2. processing #include "xx.h"
    let file = fromFile ?? getArkFile(fromInfo);
    if (!file) {
        logger.warn(`${fromInfo.getOriginName()} ${fromInfo.getFrom()} file not found: ${fromInfo.getDeclaringArkFile()?.getFileSignature()?.toString()}`);
        return null;
    }
    if (fromInfo instanceof ImportInfo && fromInfo.getImportClauseName().startsWith('#include')) {
        return processIncludeRef(fromInfo, file);
    }
    return processHeaderExportInfos(fromInfo, file);
}

export function shouldAddCxxHeaderImport(element: ImportInfo): boolean {
    if (!Object.prototype.hasOwnProperty.call(element, 'importClauseName')) {
        return false;
    }
    return isValidCxxHeaderPath(element.getImportClauseName());
}

function processNamespaceImport(fromInfo: ImportInfo): ExportInfo | null {
    const declFile = fromInfo.getDeclaringArkFile();
    const namespaceName = fromInfo.getImportClauseName();
    // namespace is from current file or importInfo
    let lazyExportInfo = declFile.getExportInfoBy(namespaceName) ??
        declFile.getImportInfoBy(namespaceName)?.getExportInfo();
    if (lazyExportInfo) {
        let arkExport = lazyExportInfo.getArkExport() || null;
        lazyExportInfo.setArkExport(arkExport);
        if (!arkExport) {
            return lazyExportInfo;
        }
        lazyExportInfo.setExportClauseType(ExportType.NAME_SPACE);
        // If the namespace is imported in a header file, it is necessary to construct the  exportInfo for the imported namespace.
        if (isValidCxxHeaderPath(declFile.getFilePath())) {
            const namespaceExportInfo = new ExportInfo.Builder()
                .exportClauseType(ExportType.NAME_SPACE)
                .exportClauseName(namespaceName)
                .declaringArkFile(declFile)
                .arkExport(arkExport)
                .build();
            declFile.addExportInfo(namespaceExportInfo);
        }
        return lazyExportInfo;
    }
    return null;
}

function isValidCxxHeaderPath(headerPath: string | undefined): boolean {
    if (!headerPath) {
        return false;
    }

    const normalized = headerPath.replace(/\\/g, '/').toLowerCase();

    // Check the sdk/default path
    if (normalized.includes('sdk/default')) {
        return false;
    }

    // Split the path and check the last file name
    const parts = normalized.split('/');
    let filename = parts.length > 0 ? parts[parts.length - 1] : '';
    filename = filename.replace('"', '');

    // Determine whether it is a standard library name or a standard library name+ h
    if (CXX_STD_HEADERS.has(filename) || (filename.endsWith('.h') && CXX_STD_HEADERS.has(filename.replace(/\.h$/, '')))) {
        return false;
    }

    return true;
}

/* Handling header file references for # include "xx/xx. h" */
function processIncludeRef(fromInfo: ImportInfo, headerFile: ArkFile): ExportInfo {
    // 1.Construct # include "xxx/xx" The exportInfo referenced by the header file is the DefaultClass of the header file
    const includeExportInfo = new ExportInfo.Builder()
        .exportClauseType(ExportType.CLASS)
        .exportClauseName(`#include "${fromInfo.getFrom()}"`)
        .declaringArkFile(headerFile)
        .arkExport(headerFile.getDefaultClass())
        .build();
    // 2.Add the exportInfo of the header file to the importInfoMaps of the current file, and set lazyImportInfo
    const declFile = fromInfo.getDeclaringArkFile();
    for (const exportInfo of headerFile.getExportInfos()) {
        let headerRealIm = new ImportInfo();
        // if there is "using namespace xxx" in declFile or the indirectly referenced file, we should keep the original import type
        const curClauseName = exportInfo.getExportClauseName();
        let importTypeTag: ImportType;
        if (declFile.getImportInfoBy(curClauseName)?.getImportTypeTag() === ImportType.NAMESPACE_IMPORT ||
            headerFile.getImportInfoBy(curClauseName)?.getImportTypeTag() === ImportType.NAMESPACE_IMPORT) {
            importTypeTag = ImportType.NAMESPACE_IMPORT;
        } else {
            importTypeTag = ImportType.NAMED_IMPORTS_IMPORT;
        }
        headerRealIm.build(curClauseName, importTypeTag, headerFile.getFilePath(), exportInfo.getOriginFullPosition(), 0);
        headerRealIm.setDeclaringArkFile(declFile);
        if (shouldAddCxxHeaderImport(headerRealIm)) {
            declFile.addImportInfo(headerRealIm);
        }
        headerRealIm.getLazyExportInfo(); // The findExportInfo function will be recursed
    }
    // 3.Add the importInfos of the header file to the importInfoMaps of the current file, and set lazyImportInfo
    for (const im of headerFile.getImportInfos()) {
        if (declFile.getImportInfoBy(im.getImportClauseName())) {
            continue;
        }
        if (shouldAddCxxHeaderImport(im)) {
            declFile.addImportInfo(im);
        }
        im.getLazyExportInfo();
    }
    return includeExportInfo;
}

/* Process the exportInfo of the header file (as the current file named importInfo) */
function processHeaderExportInfos(fromInfo: FromInfo, headerFile: ArkFile): ExportInfo | null {
    const exportName = fromInfo.getOriginName();
    let exportInfo = headerFile.getExportInfoBy(exportName);
    if (!exportInfo) {
        return null;
    }
    let arkExport = exportInfo.getArkExport() || null;
    exportInfo.setArkExport(arkExport);
    if (arkExport) {
        exportInfo.setExportClauseType(arkExport.getExportType());
    }
    return exportInfo;
}

/**
 * Record the mapping relationship between cpp functions and ts functions (when there are napi_property_descriptor and napi_define_class identifiers)
 * @param elementValues Value of each actual parameter of the function describing the mapping relationship
 * @param isDefineClass Whether it is a napi_define_class identifier
 * @param declMethod The ArkMethod where the call is located
 * @return None
 */
export function setTs2CxxFuncMapOfClass(elementValues: Value[], isDefineClass: boolean, declMethod: ArkMethod): void {
    const curArkClass = declMethod.getDeclaringArkClass();
    const dfltArkClass = declMethod.getDeclaringArkFile().getDefaultClass();
    if (!(curArkClass && dfltArkClass)) {
        return;
    }
    let funcElements: Value[];
    let tsFuncNameIdx: number;
    if (isDefineClass) {
        // napi_define_class sets the constructor of the externally exposed class
        funcElements = elementValues.length > 4 ? [elementValues[3]] : [];
        tsFuncNameIdx = 1;
    } else {
        // Fields set by functions in napi_property_descriptor
        funcElements = elementValues.length > 5 ? elementValues.slice(2, 5) : [];
        tsFuncNameIdx = 0;
    }
    const cxxFunc: ArkMethod[] = findMatchingCxxMethod(funcElements, declMethod);
    if (elementValues[tsFuncNameIdx] instanceof StringConstant) {
        dfltArkClass.addTs2cxxFuncMapElement((elementValues[tsFuncNameIdx] as StringConstant).getValue(), cxxFunc);
    }
}

/**
 * Find the actual cpp function corresponding to the function pointer in the mapping function
 * @param funcElements Value array corresponding to function pointers
 * @param declMethod The ArkMethod where the call is located
 * @return Returns the found matching function array
 */
function findMatchingCxxMethod(funcElements: Value[], declMethod: ArkMethod): ArkMethod[] {
    const cxxFunc: ArkMethod[] = [];
    const currArkClass = declMethod.getDeclaringArkClass();
    const classesToBeSearched: ArkClass[] = [];
    classesToBeSearched.push(currArkClass, ...getIncludeDefaultClasses(declMethod));
    const scene = currArkClass.getDeclaringArkFile().getScene();
    for (const element of funcElements) {
        if (!(element instanceof Local)) {
            continue;
        }
        let funcRef = element as Local;
        const mtdName = funcRef.getName();
        // If it is local and in %num format => %num = A.b, it should actually be a member of a class
        if (mtdName.startsWith(TEMP_LOCAL_PREFIX)) {
            const realType = funcRef.getType();
            if (!(realType instanceof FunctionType)) {
                continue;
            }
            let matchMtd = scene.getMethod(realType.getMethodSignature());
            if (matchMtd) {
                matchMtd = getFuncImplement(matchMtd);
                cxxFunc.push(matchMtd);
            }
            continue;
        }
        // If it is local and does not start with "%" => Member function of current class or global function
        for (const cls of classesToBeSearched) {
            let matchMtd = cls.getMethodWithName(mtdName) ?? cls.getStaticMethodWithName(mtdName);
            if (matchMtd) {
                matchMtd = getFuncImplement(matchMtd);
                cxxFunc.push(matchMtd);
            }
        }
    }
    return cxxFunc;
}

/**
 * Get the defaultClass of the include header files of the file to which the current arkInstance belongs
 * @param arkInstance Instance of ArkIR
 * @return Returns all qualified defaultClasses obtained
 */
function getIncludeDefaultClasses(arkInstance: ArkMethod | ArkClass | ArkFile): ArkClass[] {
    const defaultClasses: ArkClass[] = [];
    if (arkInstance instanceof ArkMethod || arkInstance instanceof ArkClass) {
        arkInstance = arkInstance.getDeclaringArkFile();
    }
    const includeFiles: string[] = [];
    for (const info of arkInstance.getImportInfos()) {
        const imFrom = info.getFrom();
        if (!imFrom) {
            continue;
        }
        includeFiles.push(imFrom);
    }
    if (includeFiles.length === 0) {
        return defaultClasses;
    }
    const scene = arkInstance.getScene();
    scene.getFiles().forEach(file => {
        if (file.getLanguage() !== Language.CXX || !includeFiles.includes(file.getFilePath())) {
            return;
        }
        defaultClasses.push(file.getDefaultClass());
    });
    return defaultClasses;
}

function getFuncImplement(mtd: ArkMethod): ArkMethod {
    if (mtd.isDefaultArkMethod() || mtd.getName() === INSTANCE_INIT_METHOD_NAME || mtd.getName() === STATIC_INIT_METHOD_NAME) {
        return mtd;
    }
    const realImplSignature = mtd.getImplementationSignature();
    if (!realImplSignature) {
        return mtd;
    }
    const realImplMtd = mtd.getDeclaringArkFile().getScene().getMethod(realImplSignature);
    if (!realImplMtd || !realImplMtd.getImplementationSignature()) {
        return mtd;
    }
    return realImplMtd;
}

export class CxxModelUtils {

    public static getArkExportInImportInfoWithName(name: string, arkFile: ArkFile, arkClass?: ArkClass): ArkExport | null {
        let arkExport = arkFile.getImportInfoBy(name)?.getLazyExportInfo()?.getArkExport();
        if (arkExport) {
            return arkExport;
        }
        let declNamespace: ArkNamespace | undefined;
        if (arkClass) {
            declNamespace = arkClass.getDeclaringArkNamespace();
        }
        // if using namespace or use type in same name namespace in file，we can call the method or class in the namespace without a prefix.
        for (const im of arkFile.getImportInfos()) {
            const imArkExport = im.getLazyExportInfo()?.getArkExport();
            if (!(imArkExport instanceof ArkNamespace)) {
                continue;
            }
            const imNS = imArkExport as ArkNamespace;
            // using namespace xxx
            if (im.getImportTypeTag() === ImportType.NAMESPACE_IMPORT) {
                arkExport = CxxModelUtils.findPropertyInNamespace(name, imNS);
                if (arkExport) {
                    return arkExport;
                }
            }
            // infer type within the same namespace across different files
            if (declNamespace?.getName() !== imNS.getName()) {
                continue;
            }
            arkExport = CxxModelUtils.findPropertyInNamespace(name, imNS);
            if (arkExport) {
                return arkExport;
            }
        }
        return null;
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
        // In cases where a class's declaration and definition are separated, we may consider searching for the property at the class declaration.
        const clsDeclareSignature = arkClass.getDeclareSignature();
        let declClass: ArkClass | undefined | null;
        if (clsDeclareSignature) {
            declClass = arkClass.getDeclaringArkFile().getScene().getFile(
                clsDeclareSignature.getDeclaringFileSigID())?.getClass(clsDeclareSignature);
        }
        const heritageClasses = arkClass.getAllHeritageClasses();
        if (declClass) {
            property = this.findPropertyInClass(name, declClass);
            if (property) {
                return property;
            }
            heritageClasses.push(...declClass.getAllHeritageClasses());
        }
        for (const heritage of heritageClasses) {
            property = this.findPropertyInClass(name, heritage);
            if (property) {
                return property;
            }
        }
        const objectClass = SignatureCanonicalizerRegistry.getSdkGlobal('Object');
        if (objectClass instanceof ArkClass && arkClass !== objectClass) {
            return this.findPropertyInClass(name, objectClass);
        }
        return null;
    }

    public static getClassFromAnonymousNamespaceByName(className: string, declFile: ArkFile): ArkClass | null {
        const anonyNamespaces = declFile.getNamespaces().filter(ns => ns.getName().startsWith(ANONYMOUS_NAMESPACE_PREFIX));
        for (const anonyNamespace of anonyNamespaces) {
            const matchedClass = anonyNamespace.getClassWithName(className);
            if (matchedClass) {
                return matchedClass;
            }
        }
        return null;
    }

    public static getStaticMethodWithName(methodName: string, thisClass: ArkClass): ArkMethod | null {
        const thisNamespace = thisClass.getDeclaringArkNamespace();
        if (thisNamespace) {
            const defaultClass = thisNamespace.getDefaultClass();
            if (defaultClass) {
                const method = defaultClass.getMethodWithName(methodName);
                if (method) {
                    return method;
                }
            }
        }
        return this.getStaticMethodInFileWithName(methodName, thisClass.getDeclaringArkFile());
    }

    public static getStaticMethodInFileWithName(methodName: string, arkFile: ArkFile): ArkMethod | null {
        const anonymousNamespaces: ArkNamespace[] = this.getAccessibleAnonNamespacesInFile(arkFile);
        const allDefaultClasses: ArkClass[] = [];
        allDefaultClasses.push(arkFile.getDefaultClass());
        anonymousNamespaces.forEach(ns => {
            allDefaultClasses.push(ns.getDefaultClass());
        });
        for (const defaultClass of allDefaultClasses) {
            let method = defaultClass.getMethodWithName(methodName);
            if (method) {
                return method;
            }
        }
        return null;
    }

    public static getAccessibleAnonNamespacesInFile(file: ArkFile, namespace?: ArkNamespace): ArkNamespace[] {
        const anonymousNamespaces: ArkNamespace[] = [];
        const traversableNamespace = namespace ? namespace.getNamespaces() : file.getNamespaces();
        for (const ns of traversableNamespace) {
            if (ns.getName().startsWith(ANONYMOUS_NAMESPACE_PREFIX)) {
                anonymousNamespaces.push(ns);
                anonymousNamespaces.push(...this.getAccessibleAnonNamespacesInFile(file, ns));
            }
        }
        return anonymousNamespaces;
    }

    public static findPropertyInNamespace(name: string, namespace: ArkNamespace): ArkExport | undefined {
        const allAccessibleNamespaces = [namespace];
        allAccessibleNamespaces.push(...this.getAccessibleAnonNamespacesInFile(namespace.getDeclaringArkFile(), namespace));
        for (const ns of allAccessibleNamespaces) {
            const property = ns.getDefaultClass()?.getMethodWithName(name) ??
                findArkExport(ns.getExportInfoBy(name)) ??
                ns.getClassWithName(name) ??
                ns.getNamespaceWithName(name) ??
                ns.getDefaultClass()?.getDefaultArkMethod()?.getBody()?.getAliasTypeByName(name) ??
                ns.getDefaultClass()?.getDefaultArkMethod()?.getBody()?.getLocals()?.get(name);
            if (property) {
                return property;
            }
        }
        return undefined;
    }

    /**
     * Resolve a nested class / local class referenced by its short (unqualified) name.
     *
     * C++ name lookup makes nested classes visible by their bare name inside the
     * enclosing class, but the analyzer stores them under a composed top-level name
     * (`Inner$Outer`, multi-level chains like `I$I2$Outer`, method-local classes as
     * `L$Cls.m`). Instead of fuzzy prefix matching on the container's class list,
     * this walks the enclosing-name chain of the context class and resolves each
     * candidate by an exact ClassSignature lookup (O(1) per candidate).
     *
     * Candidate order follows C++ scoping (innermost first), so a same-name nested
     * class correctly shadows an outer/top-level class.
     * @param shortName - the bare source name of the nested class
     * @param ctxClass - the class where the reference occurs (scope context)
     * @param ctxMethod - optional; the method where the reference occurs. When present,
     *        classes declared inside the method body (`L$Cls.m`) are also considered.
     * @returns The matching ArkClass, or null when no candidate resolves.
     */
    public static findClassByShortName(shortName: string, ctxClass: ArkClass, ctxMethod?: ArkMethod): ArkClass | null {
        if (!shortName || shortName.includes(NAME_DELIMITER)) {
            return null;
        }
        // Enclosing-name chain: 'I2$Outer' -> ['I2$Outer', 'Outer']; top-level 'Outer' -> ['Outer'].
        // round32：`%dflt`（file 级函数的容器）放行——cpp 方法局部类挂载约定为
        // `short$%dflt.method`，排除它会使顶层函数上下文的局部类候选链恒空
        //（structBinding Person %unk 实证）。其余 % 前缀合成名（%AC0 匿名类等）
        // 仍排除；%dflt 无 $ 分隔符，下钻循环自然终止。
        const enclosingChain: string[] = [];
        let scopeName: string | undefined = ctxClass.getName();
        while (scopeName && scopeName.length > 0 && (!scopeName.startsWith('%') || scopeName === DEFAULT_ARK_CLASS_NAME)) {
            enclosingChain.push(scopeName);
            const idx = scopeName.indexOf(NAME_DELIMITER);
            if (idx <= 0) {
                break;
            }
            scopeName = scopeName.substring(idx + 1);
        }
        if (enclosingChain.length === 0) {
            return null;
        }
        const file = ctxClass.getDeclaringArkFile();
        const ns = ctxClass.getDeclaringArkNamespace();
        const fileID = ns ? ns.getDeclaringFileID() : file.getFileSigID();
        const nsSigID = ns ? ns.getNamespaceSigID() : undefined;
        const tryCandidates = (candidates: string[]): ArkClass | null => {
            for (const candidate of candidates) {
                const cls = ns
                    ? ns.getClass(new ClassSignature(candidate, fileID, nsSigID))
                    : file.getClass(new ClassSignature(candidate, fileID));
                if (cls) {
                    return cls;
                }
            }
            return null;
        };
        // 1. Nested classes inside the enclosing chain (innermost scope first).
        const nestedCandidates: string[] = [];
        for (const enclosing of enclosingChain) {
            nestedCandidates.push(shortName + NAME_DELIMITER + enclosing);
        }
        const nested = tryCandidates(nestedCandidates);
        if (nested) {
            return nested;
        }
        // 2. Method-local classes (composed with '.' as the method separator).
        if (ctxMethod) {
            const methodLocalCandidates: string[] = [];
            for (const enclosing of enclosingChain) {
                methodLocalCandidates.push(shortName + NAME_DELIMITER + enclosing + '.' + ctxMethod.getName());
            }
            const local = tryCandidates(methodLocalCandidates);
            if (local) {
                return local;
            }
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
        // Nested classes are visible by their bare name inside the enclosing class scope;
        // resolve them first (inner scope shadows outer) before the container-level search.
        const nestedByShortName = this.findClassByShortName(symbolName, arkClass);
        if (nestedByShortName) {
            return nestedByShortName;
        }
        // look up symbol from inner to outer
        let currNamespace: ArkNamespace | null | undefined = arkClass.getDeclaringArkNamespace();
        let result: ArkExport | null | undefined;
        while (currNamespace) {
            result = this.findPropertyInNamespace(symbolName, currNamespace);
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
        if (result) {
            return result;
        }

        const allAnonyNamespaces = this.getAccessibleAnonNamespacesInFile(file);
        for (const ns of allAnonyNamespaces) {
            result = this.findPropertyInNamespace(symbolName, ns);
            if (result) {
                return result;
            }
        }
        return null;
    }

    public static isIOStreamObjectMatched(parameters: MethodParameter[], args: Value[], scene: Scene): boolean {
        // Compare the output object directly, i.e., the last param/arg
        const lastParam = parameters.length > 0 ? parameters[parameters.length - 1] : null;
        const lastArg = args.length > 0 ? args[args.length - 1] : null;
        if (!lastParam || !lastArg) {
            return false;
        }
        let lastParamType = lastParam.getType();
        let lastArgType = lastArg.getType();
        if (lastParamType instanceof ReferenceType) {
            lastParamType = lastParamType.getBaseType();
        }
        if (lastArgType instanceof ReferenceType) {
            lastArgType = lastArgType.getBaseType();
        }
        return ModelUtils.matchType(lastParamType, lastArgType, lastArg, scene);
    }
}