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
import { CxxAstNode, CppTranslationUnit} from '../../ast/ArkCxxAstNode';

export function buildImportInfo(node: any, sourceFile: any, arkFile: ArkFile): ImportInfo[] {
    if (node.kind === 'inclusion directive') {
        // just like: #include '../xxx' => import '../xxx'
        return buildGenericImportInfo(node, sourceFile, arkFile, n => `#include "${normalize(n.fileName ?? n.name ?? '')}"`);
    }
    if (node.kind === 'UsingDirectiveDecl') {
        return buildGenericImportInfo(node, sourceFile, arkFile, n => n.code);
    }
    return [];
}

function buildGenericImportInfo(node: CxxAstNode, sourceFile: CppTranslationUnit, arkFile: ArkFile,
                                importClauseNameBuilder: (node: CxxAstNode) => string): ImportInfo[] {
    const originTsPosition = LineColPosition.buildFromNodeCpp(node, sourceFile);
    const tsSourceCode = node.code;
    let importInfos: ImportInfo[] = [];
    const importFrom: string = normalize(node.fileName ?? node.name ?? '');
    let importClauseName = importClauseNameBuilder(node);
    let importType = '';
    let importInfo = new ImportInfo();
    importInfo.build(importClauseName, importType, importFrom, originTsPosition, 0);
    importInfo.setTsSourceCode(tsSourceCode);
    IRUtils.setComments(importInfo, node, sourceFile, arkFile.getScene().getOptions());
    importInfos.push(importInfo);
    return importInfos;
}
