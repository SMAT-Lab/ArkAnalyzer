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

import { ArkFile, Language } from '../../core/model/ArkFile';
import { FileSignature } from '../../core/model/ArkSignature';
import { ArkExport, ExportInfo, ExportType, FromInfo } from '../../core/model/ArkExport';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { getFileAbsPath } from '../../utils/FileUtils';
import path from 'path';
import { ImportInfo } from '../../core/model/ArkImport';
import { ArkMethod } from '../../core/model/ArkMethod';
import { ArkClass } from '../../core/model/ArkClass';
import { Value } from '../../core/base/Value';
import { Local } from '../../core/base/Local';
import { StringConstant } from '../../core/base/Constant';
import { INSTANCE_INIT_METHOD_NAME, STATIC_INIT_METHOD_NAME, TEMP_LOCAL_PREFIX } from '../../core/common/Const';
import { FunctionType } from '../../core/base/Type';
import { ArkNamespace } from '../../core/model/ArkNamespace';
import { findArkExport, ModelUtils } from '../../core/common/ModelUtils';
import { ArkField } from '../../core/model/ArkField';

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
    if (fromInfo instanceof ImportInfo && fromInfo.getImportType() === 'NamespaceImport' && fromInfo.getFrom() === '') {
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
    const filename = parts.length > 0 ? parts[parts.length - 1] : '';

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
    let includeClauseName = fromInfo.getImportClauseName();
    for (const exportInfo of headerFile.getExportInfos()) {
        let headerRealIm = new ImportInfo();
        // if there is "using namespace xxx" in declFile or the indirectly referenced file, we should keep the original import type
        const curClauseName = exportInfo.getExportClauseName();
        let importType: string;
        if (declFile.getImportInfoBy(curClauseName)?.getImportType() === 'NamespaceImport' ||
            headerFile.getImportInfoBy(curClauseName)?.getImportType() === 'NamespaceImport') {
            importType = 'NamespaceImport';
        } else {
            importType = 'NamedImports';
        }
        headerRealIm.build(curClauseName, importType, headerFile.getFilePath(), exportInfo.getOriginTsPosition(), 0);
        headerRealIm.setTsSourceCode(includeClauseName);
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

export class PatchRegistry {
    private static _instance: PatchRegistry;
    private static originalMap = new Map<string, Function>();

    private constructor() {}

    public static get instance(): PatchRegistry {
        if (!this._instance) {
            this._instance = new PatchRegistry();
            Object.freeze(this._instance);
        }
        return this._instance;
    }

    public static patchMethod(targetModule: any, methodName: string, newFunction: Function) {
        const key = `${targetModule.constructor.name}.${methodName}`;
        if (!this.originalMap.has(key)) {
            this.originalMap.set(key, targetModule[methodName]);
        }
        targetModule[methodName] = newFunction;
    }

    public static restoredMethod(targetModule: any, methodName: string) {
        const key = `${targetModule.constructor.name}.${methodName}`;
        if (!this.originalMap.has(key)) {
            return;
        }
        targetModule[methodName] = this.originalMap.get(key)!;
        this.originalMap.delete(key);
    }
}

export class CxxModelUtils {

    public static getArkExportInImportInfoWithName(name: string, arkFile: ArkFile): ArkExport | null {
        let arkExport = arkFile.getImportInfoBy(name)?.getLazyExportInfo()?.getArkExport();
        if (arkExport) {
            return arkExport;
        }
        // if using namespace in file，we can call the method or class in the namespace without a prefix.
        for (const im of arkFile.getImportInfos()) {
            const imArkExport = im.getLazyExportInfo()?.getArkExport();
            if (im.getImportType() !== 'NamespaceImport' ||  !(imArkExport instanceof ArkNamespace)) {
                continue;
            }
            const imNS = imArkExport as ArkNamespace;
            arkExport = ModelUtils.findPropertyInNamespace(name, imNS);
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
                clsDeclareSignature.getDeclaringFileSignature())?.getClass(clsDeclareSignature);
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
        const objectClass = arkClass.getDeclaringArkFile().getScene().getSdkGlobal('Object');
        if (objectClass instanceof ArkClass && arkClass !== objectClass) {
            return this.findPropertyInClass(name, objectClass);
        }
        return null;
    }
}