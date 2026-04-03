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

import { LineColPosition } from '../../../core/base/Position';
import { ImportInfo } from '../../../core/model/ArkImport';
import { IRUtils } from '../../common/IRUtils';
import { ArkFile } from '../../../core/model/ArkFile';
import { normalize } from 'path';
import { CxxAstNode, CxxIncludeInfo } from '../../ast/ArkCxxAstNode';
import { buildExportInfo } from '../../../core/model/builder/ArkExportBuilder';

export function buildGenericImportInfo(includeInfo: CxxIncludeInfo, includeNode: CxxAstNode, sourceFile: CxxAstNode, arkFile: ArkFile): ImportInfo {
    const originTsPosition = LineColPosition.cxxBuildFromNode(includeNode);
    const tsSourceCode = includeInfo.code;
    const importFrom: string = normalize(includeInfo.fileName ?? includeInfo.includeName ?? '');
    let importClauseName = `#include "${includeInfo.includeName}"`;
    let importType = '';
    let importInfo = new ImportInfo();
    importInfo.build(importClauseName, importType, importFrom, originTsPosition, 0);
    importInfo.setTsSourceCode(tsSourceCode);
    IRUtils.setComments(importInfo, includeNode, sourceFile, arkFile.getScene().getOptions());
    return importInfo;
}

export function buildUsingNamespaceImportInfo(node: CxxAstNode, sourceFile: CxxAstNode, arkFile: ArkFile): ImportInfo | null {
    const originTsPosition = LineColPosition.cxxBuildFromNode(node);
    if (!node.nominatedNamespace) {
        return null;
    }
    const importClauseName = node.nominatedNamespace.name;
    const sourceCode = `using namespace ${importClauseName}`;
    const importFrom: string = '';
    let importType = 'NamespaceImport';
    let importInfo = new ImportInfo();
    importInfo.build(importClauseName, importType, importFrom, originTsPosition, 0);
    importInfo.setTsSourceCode(sourceCode);
    IRUtils.setComments(importInfo, node, sourceFile, arkFile.getScene().getOptions());
    // scenario in cpp file: namespace xxx { Func() {} }; using namespace xxx;
    const namespaceInCpp = arkFile.getNamespaceWithName(importClauseName);
    if (namespaceInCpp) {
        importInfo.setExportInfo(buildExportInfo(namespaceInCpp, arkFile, new LineColPosition(namespaceInCpp.getLine(), namespaceInCpp.getColumn())));
    }
    return importInfo;
}
