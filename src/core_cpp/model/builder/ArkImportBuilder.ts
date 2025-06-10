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

import ts from 'ohos-typescript';
import { LineColPosition } from '../../base/Position';
import { ImportInfo } from '../ArkImport';
import { buildModifiers } from './builderUtils';
import { IRUtils } from '../../common/IRUtils';
import { ArkFile } from '../ArkFile';

export function buildImportInfo(node: ts.ImportEqualsDeclaration | ts.ImportDeclaration, sourceFile: ts.SourceFile, arkFile: ArkFile): ImportInfo[] {
    if (ts.isImportDeclaration(node)) {
        return buildImportDeclarationNode(node, sourceFile, arkFile);
    } else if (ts.isImportEqualsDeclaration(node)) {
        return buildImportEqualsDeclarationNode(node, sourceFile, arkFile);
    }
    return [];
}

function buildImportDeclarationNode(node: ts.ImportDeclaration, sourceFile: ts.SourceFile, arkFile: ArkFile): ImportInfo[] {
    const originTsPosition = LineColPosition.buildFromNode(node, sourceFile);
    const tsSourceCode = node.getText(sourceFile);

    let importInfos: ImportInfo[] = [];
    let importFrom: string = '';
    if (ts.isStringLiteral(node.moduleSpecifier)) {
        importFrom = node.moduleSpecifier.text;
    }

    let modifiers = 0;
    if (node.modifiers) {
        modifiers = buildModifiers(node);
    }

    // just like: import '../xxx'
    if (!node.importClause) {
        let importClauseName = '';
        let importType = '';
        let importInfo = new ImportInfo();
        importInfo.build(importClauseName, importType, importFrom, originTsPosition, modifiers);
        importInfo.setTsSourceCode(tsSourceCode);
        IRUtils.setComments(importInfo, node, sourceFile, arkFile.getScene().getOptions());
        importInfos.push(importInfo);
    }

    //just like: import fs from 'fs'
    if (node.importClause && node.importClause.name && ts.isIdentifier(node.importClause.name)) {
        let importClauseName = node.importClause.name.text;
        const pos = LineColPosition.buildFromNode(node.importClause.name, sourceFile);
        let importType = 'Identifier';
        let importInfo = new ImportInfo();
        importInfo.build(importClauseName, importType, importFrom, pos, modifiers);
        importInfo.setTsSourceCode(tsSourceCode);
        IRUtils.setComments(importInfo, node, sourceFile, arkFile.getScene().getOptions());
        importInfos.push(importInfo);
    }

    // just like: import {xxx} from './yyy'
    if (node.importClause && node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        let importType = 'NamedImports';
        if (node.importClause.namedBindings.elements) {
            node.importClause.namedBindings.elements.forEach(element => {
                if (element.name && ts.isIdentifier(element.name)) {
                    let importClauseName = element.name.text;
                    const pos = LineColPosition.buildFromNode(element, sourceFile);
                    if (element.propertyName && ts.isIdentifier(element.propertyName)) {
                        let importInfo = new ImportInfo();
                        importInfo.build(importClauseName, importType, importFrom, pos, modifiers, element.propertyName.text);
                        importInfo.setTsSourceCode(tsSourceCode);
                        IRUtils.setComments(importInfo, node, sourceFile, arkFile.getScene().getOptions());
                        importInfos.push(importInfo);
                    } else {
                        let importInfo = new ImportInfo();
                        importInfo.build(importClauseName, importType, importFrom, pos, modifiers);
                        importInfo.setTsSourceCode(tsSourceCode);
                        IRUtils.setComments(importInfo, node, sourceFile, arkFile.getScene().getOptions());
                        importInfos.push(importInfo);
                    }
                }
            });
        }
    }

    // just like: import * as ts from 'ohos-typescript'
    if (node.importClause && node.importClause.namedBindings && ts.isNamespaceImport(node.importClause.namedBindings)) {
        let importType = 'NamespaceImport';
        if (node.importClause.namedBindings.name && ts.isIdentifier(node.importClause.namedBindings.name)) {
            let importClauseName = node.importClause.namedBindings.name.text;
            let importInfo = new ImportInfo();
            let nameBeforeAs = '*';
            const pos = LineColPosition.buildFromNode(node.importClause.namedBindings.name, sourceFile);
            importInfo.build(importClauseName, importType, importFrom, pos, modifiers, nameBeforeAs);
            importInfo.setTsSourceCode(tsSourceCode);
            IRUtils.setComments(importInfo, node, sourceFile, arkFile.getScene().getOptions());
            importInfos.push(importInfo);
        }
    }

    return importInfos;
}

function buildImportEqualsDeclarationNode(node: ts.ImportEqualsDeclaration, sourceFile: ts.SourceFile, arkFile: ArkFile): ImportInfo[] {
    const originTsPosition = LineColPosition.buildFromNode(node, sourceFile);
    const tsSourceCode = node.getText(sourceFile);

    let importInfos: ImportInfo[] = [];
    let importType = 'EqualsImport';
    let modifiers = 0;
    if (node.modifiers) {
        modifiers = buildModifiers(node);
    }
    if (
        node.moduleReference &&
        ts.isExternalModuleReference(node.moduleReference) &&
        node.moduleReference.expression &&
        ts.isStringLiteral(node.moduleReference.expression)
    ) {
        let importFrom = node.moduleReference.expression.text;
        let importClauseName = node.name.text;
        let importInfo = new ImportInfo();
        importInfo.build(importClauseName, importType, importFrom, originTsPosition, modifiers);
        importInfo.setTsSourceCode(tsSourceCode);
        IRUtils.setComments(importInfo, node, sourceFile, arkFile.getScene().getOptions());
        importInfos.push(importInfo);
    }
    return importInfos;
}
