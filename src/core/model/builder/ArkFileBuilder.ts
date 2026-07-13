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
import { buildDefaultArkClassFromArkFile, buildNormalArkClassFromArkFile, ClassLikeNode } from './ArkClassBuilder';
import { buildArkMethodFromArkClass, MethodLikeNode } from './ArkMethodBuilder';
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
import { FullPosition } from '../../base/Position';
import { ETS_COMPILER_OPTIONS } from '../../common/EtsConst';
import { FileSignature } from '../ArkSignature';
import { ARKTS_STATIC_MARK } from '../../common/Const';
import { cloneText } from '../../common/StringUtils';

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

    let sourceText: string;
    try {
        sourceText = fs.readFileSync(arkFile.getFilePath(), 'utf8');
    } catch (error) {
        logger.error('Failed to read file: ${error}');
        return;
    }
    const options = arkFile.getScene().getOptions();
    const eagerLoad = options.saveSourceCodeByDefault ?? false;
    if (eagerLoad && arkFile.getScene().getProjectName() === arkFile.getProjectName()) {
        arkFile.setCode(sourceText);
    }
    const sourceFile = ts.createSourceFile(arkFile.getName(), sourceText, ts.ScriptTarget.Latest, true, undefined, ETS_COMPILER_OPTIONS);
    // save ast source file, if enabled ast and file is from the project (not from sdk)
    if (arkFile.getScene().getOptions().enableAST && arkFile.getScene().getProjectName() === arkFile.getProjectName()) {
        arkFile.setAST(sourceFile);
    }
    genDefaultArkClass(arkFile, sourceFile);
    buildArkFile(arkFile, sourceFile);
}

/**
 * Building ArkFile instance.
 *
 * @param arkFile - The ArkFile to populate.
 * @param astRoot - The parsed TypeScript source file AST.
 * @param skipImportExport - When true, skip the import/export statement branches so that
 *   existing ImportInfo/ExportInfo (populated earlier at IMPORTS level) is preserved and only
 *   class/method/namespace signatures are built on top. This avoids re-parsing import/export
 *   which would duplicate `export *` entries (their temp keys are process-level auto-increment).
 */
function buildArkFile(arkFile: ArkFile, astRoot: ts.SourceFile, skipImportExport: boolean = false): void {
    const namespaces: ArkNamespace[] = [];
    for (const child of astRoot.statements) {
        if (ts.isModuleDeclaration(child)) {
            buildAndCollectNamespace(child, arkFile, astRoot, namespaces);
        } else if (ts.isClassDeclaration(child) || ts.isInterfaceDeclaration(child) || ts.isEnumDeclaration(child) || ts.isStructDeclaration(child)) {
            buildAndExportClass(child, arkFile, astRoot);
        } else if (ts.isMethodDeclaration(child) || ts.isFunctionDeclaration(child)) {
            buildAndExportMethod(child, arkFile, astRoot);
        } else if (!skipImportExport && tryBuildImportExport(child, arkFile, astRoot)) {
            // import/export handled by tryBuildImportExport
        } else if (ts.isExpressionStatement(child) && ts.isStringLiteral(child.expression)) {
            if (cloneText(child.expression.text).trim() === ARKTS_STATIC_MARK) {
                arkFile.setLanguage(Language.ARKTS1_2);
            }
        } else {
            logger.trace('Child joined default method of arkFile: ', ts.SyntaxKind[child.kind]);
        }
    }
    mergeAndAddNamespaces(namespaces, arkFile);
}

function buildAndCollectNamespace(child: ts.ModuleDeclaration, arkFile: ArkFile, astRoot: ts.SourceFile, namespaces: ArkNamespace[]): void {
    const ns = new ArkNamespace();
    ns.setDeclaringArkFile(arkFile);
    buildArkNamespace(child, arkFile, ns, astRoot);
    namespaces.push(ns);
    if (ns.isExported()) {
        arkFile.addExportInfo(buildExportInfo(ns, arkFile, FullPosition.buildFromNode(child, astRoot)));
    }
}

function buildAndExportClass(child: ClassLikeNode, arkFile: ArkFile, astRoot: ts.SourceFile): void {
    const cls = new ArkClass();
    buildNormalArkClassFromArkFile(child, arkFile, cls, astRoot);
    if (cls.isExported()) {
        arkFile.addExportInfo(buildExportInfo(cls, arkFile, FullPosition.buildFromNode(child, astRoot)));
    }
}

function buildAndExportMethod(child: MethodLikeNode, arkFile: ArkFile, astRoot: ts.SourceFile): void {
    const mthd = new ArkMethod();
    buildArkMethodFromArkClass(child, arkFile.getDefaultClass(), mthd, astRoot);
    if (mthd.isExported()) {
        arkFile.addExportInfo(buildExportInfo(mthd, arkFile, FullPosition.buildFromNode(child, astRoot)));
    }
}

/**
 * Attempt to build import/export info from a statement. Returns true if the statement was
 * recognized and handled as an import/export declaration.
 */
function tryBuildImportExport(child: ts.Statement, arkFile: ArkFile, astRoot: ts.SourceFile): boolean {
    if (ts.isImportEqualsDeclaration(child) || ts.isImportDeclaration(child)) {
        const importInfos = buildImportInfo(child, astRoot, arkFile);
        importInfos?.forEach(element => {
            element.setDeclaringArkFile(arkFile);
            arkFile.addImportInfo(element);
        });
        return true;
    }
    if (ts.isExportDeclaration(child)) {
        buildExportDeclaration(child, astRoot, arkFile).forEach(item => arkFile.addExportInfo(item));
        return true;
    }
    if (ts.isExportAssignment(child)) {
        buildExportAssignment(child, astRoot, arkFile).forEach(item => arkFile.addExportInfo(item));
        return true;
    }
    if (ts.isVariableStatement(child) && isExported(child.modifiers)) {
        buildExportVariableStatement(child, astRoot, arkFile).forEach(item => arkFile.addExportInfo(item));
        return true;
    }
    if (ts.isTypeAliasDeclaration(child) && isExported(child.modifiers)) {
        buildExportTypeAliasDeclaration(child, astRoot, arkFile).forEach(item => arkFile.addExportInfo(item));
        return true;
    }
    return false;
}

function mergeAndAddNamespaces(namespaces: ArkNamespace[], arkFile: ArkFile): void {
    const merged = mergeNameSpaces(namespaces);
    merged.forEach(ns => {
        arkFile.addNamespace(ns);
        if (ns.isExport()) {
            const positions = ns.getOriginFullPositions();
            if (positions.length > 0) {
                arkFile.addExportInfo(buildExportInfo(ns, arkFile, positions[0]));
            }
        }
    });
}

function genDefaultArkClass(arkFile: ArkFile, astRoot: ts.SourceFile): void {
    let defaultClass = new ArkClass();

    buildDefaultArkClassFromArkFile(arkFile, defaultClass, astRoot);
    arkFile.setDefaultClass(defaultClass);
    arkFile.addArkClass(defaultClass);
}

/**
 * Lightweight entry of building ImportInfo/ExportInfo on ArkFile without building ArkClass/ArkMethod/ArkNamespace/ArkBody.
 *
 * @param arkFile
 * @returns
 */
export function buildImportExportInfoFromFile(arkFile: ArkFile): void {
    let sourceText: string;
    try {
        sourceText = fs.readFileSync(arkFile.getFilePath(), 'utf8');
    } catch (error) {
        logger.error('Failed to read file: ${error}');
        return;
    }
    arkFile.setCode(sourceText);
    const sourceFile = ts.createSourceFile(arkFile.getName(), sourceText, ts.ScriptTarget.Latest, true, undefined, ETS_COMPILER_OPTIONS);
    buildImportExportInfo(arkFile, sourceFile);
}

/**
 * Building ImportInfo/ExportInfo on ArkFile from AST, skipping class/interface/enum/struct/namespace declarations.
 *
 * @param arkFile
 * @param astRoot
 * @returns
 */
function buildImportExportInfo(arkFile: ArkFile, astRoot: ts.SourceFile): void {
    const statements = astRoot.statements;
    statements.forEach(child => {
        if (ts.isImportEqualsDeclaration(child) || ts.isImportDeclaration(child)) {
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
            cloneText(child.expression.text).trim() === ARKTS_STATIC_MARK && arkFile.setLanguage(Language.ARKTS1_2);
        }
    });
}

/**
 * Signatures-only upgrade entry: builds ArkClass/ArkMethod/ArkNamespace signatures on top of an
 * ArkFile whose ImportInfo/ExportInfo were already populated (e.g. by {@link buildImportExportInfoFromFile}).
 *
 * Unlike {@link buildArkFileFromFile}, this function calls {@link buildArkFile} with
 * `skipImportExport = true`, so existing import/export data is preserved and not re-parsed. This
 * avoids duplicating `export *` re-export entries whose temp clause keys are process-level
 * auto-increment values that cannot be overwritten by `Map.set`.
 *
 * @param arkFile - The ArkFile to upgrade. Must already have filePath set.
 */
export function buildArkFileSignaturesFromFile(arkFile: ArkFile): void {
    let sourceText: string;
    try {
        sourceText = fs.readFileSync(arkFile.getFilePath(), 'utf8');
    } catch (error) {
        logger.error('Failed to read file: ${error}');
        return;
    }
    const sourceFile = ts.createSourceFile(arkFile.getName(), sourceText, ts.ScriptTarget.Latest, true, undefined, ETS_COMPILER_OPTIONS);
    if (arkFile.getScene().getOptions().enableAST && arkFile.getScene().getProjectName() === arkFile.getProjectName()) {
        arkFile.setAST(sourceFile);
    }
    genDefaultArkClass(arkFile, sourceFile);
    buildArkFile(arkFile, sourceFile, true);
}
