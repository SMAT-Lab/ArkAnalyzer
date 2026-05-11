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

import { FullPosition } from '../../../../core/base/Position';
import { ImportInfo, ImportType } from '../../../../core/model/ArkImport';
import { IRUtils } from '../../common/IRUtils';
import { ArkFile } from '../../../../core/model/ArkFile';
import { normalize } from 'path';
import { CxxAstNode, CxxIncludeInfo } from '../../ast';
import { buildExportInfo } from '../../../../core/model/builder/ArkExportBuilder';

export function buildGenericImportInfo(includeInfo: CxxIncludeInfo, includeNode: CxxAstNode, sourceFile: CxxAstNode, arkFile: ArkFile): ImportInfo {
    const originFullPosition = FullPosition.cxxBuildFromNode(includeNode, sourceFile);
    const importFrom: string = normalize(includeInfo.fileName ?? includeInfo.includeName ?? '');
    let importClauseName = `#include "${includeInfo.includeName}"`;
    let importInfo = new ImportInfo();
    importInfo.build(importClauseName, ImportType.NONE_IMPORT, importFrom, originFullPosition, 0);
    IRUtils.setComments(importInfo, includeNode, sourceFile, arkFile.getScene().getOptions());
    return importInfo;
}

export function buildUsingNamespaceImportInfo(node: CxxAstNode, sourceFile: CxxAstNode, arkFile: ArkFile): ImportInfo | null {
    const originFullPosition = FullPosition.cxxBuildFromNode(node, sourceFile);
    if (!node.nominatedNamespace) {
        return null;
    }
    const importClauseName = node.nominatedNamespace.name;
    const importFrom: string = '';
    let importInfo = new ImportInfo();
    importInfo.build(importClauseName, ImportType.NAMESPACE_IMPORT, importFrom, originFullPosition, 0);
    IRUtils.setComments(importInfo, node, sourceFile, arkFile.getScene().getOptions());
    // scenario in cpp file: namespace xxx { Func() {} }; using namespace xxx;
    const namespaceInCpp = arkFile.getNamespaceWithName(importClauseName);
    if (namespaceInCpp) {
        const positions = namespaceInCpp.getOriginFullPositions();
        if (positions.length > 0) {
            importInfo.setExportInfo(buildExportInfo(namespaceInCpp, arkFile, positions[0]));
        }
    }
    return importInfo;
}