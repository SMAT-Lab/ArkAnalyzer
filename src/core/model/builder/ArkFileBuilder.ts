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

import fs from 'fs';
import path from 'path';
import ts from 'ohos-typescript';
import { ArkFile, Language } from '../ArkFile';
import { ArkNamespace } from '../ArkNamespace';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { buildDefaultArkClassFromArkFile, buildNormalArkClassFromArkFile } from './ArkClassBuilder';
import { buildArkMethodFromArkClass } from './ArkMethodBuilder';
import { buildImportInfo } from './ArkImportBuilder';
import {
    buildExportAssignment,
    buildExportDeclaration,
    buildExportInfo,
    buildExportTypeAliasDeclaration,
    buildExportVariableStatement,
    isExported,
} from './ArkExportBuilder';
import { buildArkNamespace, mergeNameSpaces } from './ArkNamespaceBuilder';
import { ArkClass } from '../ArkClass';
import { ArkMethod } from '../ArkMethod';
import { LineColPosition } from '../../base/Position';
import { ETS_COMPILER_OPTIONS } from '../../common/EtsConst';
import { FileSignature } from '../ArkSignature';
import { ARKTS_STATIC_MARK } from '../../common/Const';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkFileBuilder');

export const notStmtOrExprKind = [
    'ModuleDeclaration',
    'ClassDeclaration',
    'InterfaceDeclaration',
    'EnumDeclaration',
    'ExportDeclaration',
    'ExportAssignment',
    'MethodDeclaration',
    'Constructor',
    'FunctionDeclaration',
    'GetAccessor',
    'SetAccessor',
    'ArrowFunction',
    'FunctionExpression',
    'MethodSignature',
    'ConstructSignature',
    'CallSignature',
];

/**
 * Entry of building ArkFile instance
 *
 * @param arkFile
 * @returns
 */
export function buildArkFileFromFile(absoluteFilePath: string, projectDir: string, arkFile: ArkFile, projectName: string): void {
    arkFile.setFilePath(absoluteFilePath);
    arkFile.setProjectDir(projectDir);

    const fileSignature = new FileSignature(projectName, path.relative(projectDir, absoluteFilePath));
    arkFile.setFileSignature(fileSignature);

    try {
        arkFile.setCode(fs.readFileSync(arkFile.getFilePath(), 'utf8'));
    } catch (error) {
        logger.error('Failed to read file: ${error}');
        return;
    }
    const sourceFile = ts.createSourceFile(arkFile.getName(), arkFile.getCode(), ts.ScriptTarget.Latest, true, undefined, ETS_COMPILER_OPTIONS);
    // save ast source file, if enabled ast and file is from the project (not from sdk)
    if (arkFile.getScene().getOptions().enableAST && arkFile.getScene().getProjectName() === arkFile.getProjectName()) {
        arkFile.setAST(sourceFile);
    }
    genDefaultArkClass(arkFile, sourceFile);
    buildArkFile(arkFile, sourceFile);
}

/**
 * Building ArkFile instance
 *
 * @param arkFile
 * @param astRoot
 * @returns
 */
function buildArkFile(arkFile: ArkFile, astRoot: ts.SourceFile): void {
    const statements = astRoot.statements;
    const namespaces: ArkNamespace[] = [];
    statements.forEach(child => {
        if (ts.isModuleDeclaration(child)) {
            let ns: ArkNamespace = new ArkNamespace();
            ns.setDeclaringArkFile(arkFile);

            buildArkNamespace(child, arkFile, ns, astRoot);
            namespaces.push(ns);
            if (ns.isExported()) {
                arkFile.addExportInfo(buildExportInfo(ns, arkFile, LineColPosition.buildFromNode(child, astRoot)));
            }
        } else if (ts.isClassDeclaration(child) || ts.isInterfaceDeclaration(child) || ts.isEnumDeclaration(child) || ts.isStructDeclaration(child)) {
            let cls: ArkClass = new ArkClass();

            buildNormalArkClassFromArkFile(child, arkFile, cls, astRoot);

            if (cls.isExported()) {
                arkFile.addExportInfo(buildExportInfo(cls, arkFile, LineColPosition.buildFromNode(child, astRoot)));
            }
        }
        // TODO: Check
        else if (ts.isMethodDeclaration(child)) {
            logger.trace('This is a MethodDeclaration in ArkFile.');
            let mthd: ArkMethod = new ArkMethod();

            buildArkMethodFromArkClass(child, arkFile.getDefaultClass(), mthd, astRoot);

            if (mthd.isExported()) {
                arkFile.addExportInfo(buildExportInfo(mthd, arkFile, LineColPosition.buildFromNode(child, astRoot)));
            }
        } else if (ts.isFunctionDeclaration(child)) {
            let mthd: ArkMethod = new ArkMethod();

            buildArkMethodFromArkClass(child, arkFile.getDefaultClass(), mthd, astRoot);

            if (mthd.isExported()) {
                arkFile.addExportInfo(buildExportInfo(mthd, arkFile, LineColPosition.buildFromNode(child, astRoot)));
            }
        } else if (ts.isImportEqualsDeclaration(child) || ts.isImportDeclaration(child)) {
            let importInfos = buildImportInfo(child, astRoot, arkFile);
            importInfos?.forEach(element => {
                element.setDeclaringArkFile(arkFile);
                arkFile.addImportInfo(element);
            });
        } else if (ts.isExportDeclaration(child)) {
            buildExportDeclaration(child, astRoot, arkFile).forEach(item => arkFile.addExportInfo(item));
        } else if (ts.isExportAssignment(child)) {
            buildExportAssignment(child, astRoot, arkFile).forEach(item => arkFile.addExportInfo(item));
        } else if (ts.isVariableStatement(child) && isExported(child.modifiers)) {
            buildExportVariableStatement(child, astRoot, arkFile).forEach(item => arkFile.addExportInfo(item));
        } else if (ts.isTypeAliasDeclaration(child) && isExported(child.modifiers)) {
            buildExportTypeAliasDeclaration(child, astRoot, arkFile).forEach(item => arkFile.addExportInfo(item));
        } else if (ts.isExpressionStatement(child) && ts.isStringLiteral(child.expression)) {
            child.expression.text.trim() === ARKTS_STATIC_MARK && arkFile.setLanguage(Language.ARKTS1_2);
        } else {
            logger.trace('Child joined default method of arkFile: ', ts.SyntaxKind[child.kind]);
        }
    });

    const mergedNameSpaces = mergeNameSpaces(namespaces);
    mergedNameSpaces.forEach(mergedNameSpace => {
        arkFile.addNamespace(mergedNameSpace);
        if (mergedNameSpace.isExport()) {
            const linCol = new LineColPosition(mergedNameSpace.getLine(), mergedNameSpace.getColumn());
            arkFile.addExportInfo(buildExportInfo(mergedNameSpace, arkFile, linCol));
        }
    });
}

function genDefaultArkClass(arkFile: ArkFile, astRoot: ts.SourceFile): void {
    let defaultClass = new ArkClass();

    buildDefaultArkClassFromArkFile(arkFile, defaultClass, astRoot);
    arkFile.setDefaultClass(defaultClass);
    arkFile.addArkClass(defaultClass);
}
