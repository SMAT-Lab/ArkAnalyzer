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

import { ArkFile } from '../../core/model/ArkFile';
import {
    FileSignature,
    fileSignatureCompare,
} from '../../core/model/ArkSignature';
import { ExportInfo, ExportType, FromInfo } from '../../core/model/ArkExport';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { getFileAbsPath } from '../../utils/FileUtils';
import path from 'path';
import { ImportInfo } from '../../core/model/ArkImport';

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
        from = getFileAbsPath(im.getDeclaringArkFile().getFilePath(), from);
    }
    if (!from) {
        return null;
    }
    const scene = im.getDeclaringArkFile().getScene();
    return scene.getFile(new FileSignature(scene.getProjectName(), path.relative(scene.getRealProjectDir(), from)));
}

/**
 * #include "xx/xx.h"==>预编译直接展开==>相当于导入文件的全部内容==>头文件直接获取exportInfo
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
    if (fromInfo instanceof ImportInfo && (fromInfo as ImportInfo).getImportClauseName().startsWith('#include')) {
        return processIncludeRef(fromInfo, file);
    }
    return processHeaderExportInfos(fromInfo, file);
}

/* 处理#include "xx/xx.h"的头文件引用 */
function processIncludeRef(fromInfo: FromInfo, headerFile: ArkFile): ExportInfo {
    // 1.构造#include "xxx/xx"该头文件引用的exportInfo为该头文件的DefaultClass
    const includeExportInfo = new ExportInfo.Builder()
        .exportClauseType(ExportType.CLASS)
        .exportClauseName(`#include "${fromInfo.getFrom()}"`)
        .declaringArkFile(headerFile)
        .arkExport(headerFile.getDefaultClass())
        .build();
    // 2.将头文件的exportInfo添加到当前文件的importInfoMaps里，并设置好lazyImportInfo
    const declFile = fromInfo.getDeclaringArkFile();
    let includeClauseName =  (fromInfo as ImportInfo).getImportClauseName();
    for (const exportInfo of headerFile.getExportInfos()) {
        let headerRealIm = new ImportInfo();
        headerRealIm.build(exportInfo.getExportClauseName(), 'NamedImports', headerFile.getFilePath(),
            exportInfo.getOriginTsPosition(), 0);
        headerRealIm.setTsSourceCode(includeClauseName);
        headerRealIm.setDeclaringArkFile(declFile);
        declFile.addImportInfo(headerRealIm);
        headerRealIm.getLazyExportInfo();  // 会递归findExportInfo函数
    }
    // 3.将头文件的importInfos添加到当前文件的importInfoMaps里，并设置好lazyImportInfo
    for (const im of headerFile.getImportInfos()) {
        if (declFile.getImportInfoBy(im.getImportClauseName())) {
            continue;
        }
        declFile.addImportInfo(im);
        im.getLazyExportInfo();
    }
    return includeExportInfo;
}

/* 处理头文件的exportInfo（当作当前文件named importInfo) */
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
