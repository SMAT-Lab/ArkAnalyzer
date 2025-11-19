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
import { FileSignature, fileSignatureCompare } from '../../core/model/ArkSignature';
import { ExportInfo, ExportType, FromInfo } from '../../core/model/ArkExport';
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

// Common C++standard library header files (excluding the. h suffix)
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
 */
export function findExportInfo(fromInfo: FromInfo): ExportInfo | null {
    let file = getArkFile(fromInfo);
    if (!file) {
        logger.warn(`${fromInfo.getOriginName()} ${fromInfo.getFrom()} file not found: ${fromInfo.getDeclaringArkFile()?.getFileSignature()?.toString()}`);
        return null;
    }
    if (fileSignatureCompare(file.getFileSignature(), fromInfo.getDeclaringArkFile().getFileSignature())) {
        for (let exportInfo of file.getExportInfos()) {
            if (exportInfo.getOriginName() === fromInfo.getOriginName()) {
                exportInfo.setArkExport(file.getDefaultClass());
                return exportInfo;
            }
        }
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
function processIncludeRef(fromInfo: FromInfo, headerFile: ArkFile): ExportInfo {
    // 1.Construct # include "xxx/xx" The exportInfo referenced by the header file is the DefaultClass of the header file
    const includeExportInfo = new ExportInfo.Builder()
        .exportClauseType(ExportType.CLASS)
        .exportClauseName(`#include "${fromInfo.getFrom()}"`)
        .declaringArkFile(headerFile)
        .arkExport(headerFile.getDefaultClass())
        .build();
    // 2.Add the exportInfo of the header file to the importInfoMaps of the current file, and set lazyImportInfo
    const declFile = fromInfo.getDeclaringArkFile();
    let includeClauseName = (fromInfo as ImportInfo).getImportClauseName();
    for (const exportInfo of headerFile.getExportInfos()) {
        let headerRealIm = new ImportInfo();
        headerRealIm.build(exportInfo.getExportClauseName(), 'NamedImports', headerFile.getFilePath(), exportInfo.getOriginTsPosition(), 0);
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
