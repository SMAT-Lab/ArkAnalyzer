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
import { ArkFile, Language } from '../../../../core/model/ArkFile';
import { ArkNamespace } from '../../../../core/model/ArkNamespace';
import { buildNormalArkClassFromArkFile } from './ArkClassBuilder';
import { buildArkMethodFromArkClass } from './ArkMethodBuilder';
import { buildExportInfo } from '../../../../core/model/builder/ArkExportBuilder';
import { buildArkNamespace } from './ArkNamespaceBuilder';
import { ArkClass } from '../../../../core/model/ArkClass';
import { buildDefaultArkClassFromArkFile } from './ArkClassBuilder';
import { ArkMethod } from '../../../../core/model/ArkMethod';
import { FileSignature, ClassSignature } from '../../../../core/model/ArkSignature';
import { FullPosition } from '../../../../core/base/Position';
import { buildGenericImportInfo, buildUsingNamespaceImportInfo } from './ArkImportBuilder';
import { shouldAddCxxHeaderImport } from '../../common/ModelUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../../utils/logger';
import { init4InstanceInitMethod, init4StaticInitMethod } from '../../../../core/model/builder/ArkClassBuilder';
import type { CxxAstNode, CxxIncludeInfo } from '../../utils/ArkCxxAstNode';
import { AstKind, CxxTagUsed } from '../../utils/ArkCxxAstNode';
import type { AstParserClass } from '../../utils/cxxAstParserTypes';
import { requireCxxAstParser } from '../../utils/cxxAstParserTypes';
import { ArkExport } from '../../../../core/model/ArkExport';
import { Scene } from '../../../../Scene';
import { buildProperty2ArkField } from './ArkFieldBuilder';
import { DEFAULT_ARK_CLASS_NAME } from '../../../../core/common/Const';
import { FrontendParseFailure } from '../../../FrontendBuilder';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkFileBuilder');

function getAstParser(): AstParserClass {
    return requireCxxAstParser().AstParser;
}

function applyArkFile(arkFile: ArkFile, sourceFile: string, astRoot: CxxAstNode): void {
    const scene = arkFile.getScene();
    const projectDir = scene.getRealProjectDir();
    const projectName = scene.getProjectName();
    arkFile.setFilePath(sourceFile);
    arkFile.setProjectDir(projectDir);
    arkFile.setFileSignature(new FileSignature(projectName, path.relative(projectDir, sourceFile)));
    const sourceText = fs.readFileSync(arkFile.getFilePath(), 'utf8');
    const options = scene.getOptions();
    const eagerLoad = options.saveSourceCodeByDefault ?? false;
    if (eagerLoad && scene.getProjectName() === arkFile.getProjectName()) {
        arkFile.setCode(sourceText);
    }
    genDefaultArkClass(arkFile, astRoot);
    buildArkFile(arkFile, astRoot);
}

/**
 * Lightweight variant of {@link applyArkFile} that only sets basic file metadata and
 * fills ImportInfo from #include / using-namespace directives. It does NOT build
 * ArkClass, ArkMethod, ArkNamespace, or ArkBody.
 *
 * @param arkFile - Target ArkFile to populate.
 * @param sourceFile - Absolute path of the C++ source file.
 * @param astRoot - Root AST node returned by the C++ AST parser.
 */
function applyArkFileForImports(arkFile: ArkFile, sourceFile: string, astRoot: CxxAstNode): void {
    const scene = arkFile.getScene();
    const projectDir = scene.getRealProjectDir();
    const projectName = scene.getProjectName();
    arkFile.setFilePath(sourceFile);
    arkFile.setProjectDir(projectDir);
    arkFile.setFileSignature(new FileSignature(projectName, path.relative(projectDir, sourceFile)));
    const sourceText = fs.readFileSync(arkFile.getFilePath(), 'utf8');
    const options = scene.getOptions();
    const eagerLoad = options.saveSourceCodeByDefault ?? false;
    if (eagerLoad && scene.getProjectName() === arkFile.getProjectName()) {
        arkFile.setCode(sourceText);
    }
    buildImportsOnly(arkFile, astRoot);
}

/**
 * Imports-only subset of {@link buildArkFile}. Processes #include directives from
 * header units and using-namespace directives from the top-level statement list.
 * Recurses into LinkageSpecDecl nodes which may contain their own includes/usings.
 *
 * @param arkFile - Target ArkFile to populate with ImportInfo.
 * @param astRoot - Root AST node returned by the C++ AST parser.
 */
function buildImportsOnly(arkFile: ArkFile, astRoot: CxxAstNode): void {
    // handle header units - process #include directives
    astRoot.headerUnits?.forEach((child: CxxAstNode) => {
        if (!child.includes) {
            return;
        }
        for (const includeInfo of child.includes) {
            if (includeInfo.kind !== AstKind.InclusionDirective) {
                logger.trace('Unprocess kind of header unit: ', includeInfo.kind ?? includeInfo.includeName);
                continue;
            }
            buildImportInfoFromInclude(includeInfo, child, astRoot, arkFile);
        }
    });
    // handle non-header unit - only import-related declarations
    const statements = astRoot.inner ?? [];
    statements.forEach((child: CxxAstNode) => {
        switch (child.kind) {
            case AstKind.UsingDirectiveDecl:
                buildImportInfoFromUsing(child, astRoot, arkFile);
                break;
            case AstKind.LinkageSpecDecl:
                buildImportsOnly(arkFile, child);
                break;
            default:
                break;
        }
    });
}

export interface CppStreamBuildResult {
    arkFiles: ArkFile[];
    failedFiles: FrontendParseFailure[];
}

/**
 * C++ AST manifest pipeline: addon emits per-TU records, consumed synchronously per record.
 */
export function prepareArkFiles(
    scene: Scene,
    absoluteSourceFiles: string[],
    maxParallelProcesses: number = 1,
    maxPendingAstResults: number = 2,
    logAstInfo: boolean = false
): CppStreamBuildResult {
    const arkFiles: ArkFile[] = [];
    const failedFiles: FrontendParseFailure[] = [];
    const sources = absoluteSourceFiles.map(f => path.resolve(f));
    if (sources.length === 0) {
        return { arkFiles, failedFiles };
    }
    const projectDir = scene.getRealProjectDir();
    const includeDirs = scene.getIncludeDirs();
    const result = getAstParser().runCppAst({
        scene,
        sources,
        projectDir,
        includeDirs,
        maxParallelProcesses,
        maxPendingAstResults,
        logAstInfo,
        onSourceAst: (sourceFile, astRoot) => {
            const target = new ArkFile(Language.CXX);
            target.setScene(scene);
            try {
                applyArkFile(target, sourceFile, astRoot);
                arkFiles.push(target);
            } catch (err) {
                failedFiles.push({ filePath: sourceFile, reason: err });
            }
        },
    });

    for (const e of result.dumpErrors) {
        failedFiles.push({ filePath: e.filePath, reason: e.reason });
    }

    return { arkFiles, failedFiles };
}

export function prepareArkFile(scene: Scene, absoluteFilePath: string, targetArkFile: ArkFile, logAstInfo: boolean = false): void {
    const sourceFile = path.resolve(absoluteFilePath);
    const projectDir = scene.getRealProjectDir();
    const includeDirs = scene.getIncludeDirs();
    const result = getAstParser().runCppAst({
        scene,
        sources: [sourceFile],
        projectDir,
        includeDirs,
        maxParallelProcesses: 1,
        maxPendingAstResults: 2,
        logAstInfo,
        onSourceAst: (source, astRoot) => {
            try {
                applyArkFile(targetArkFile, source, astRoot);
            } catch (err) {
                logger.warn(`Failed to apply C++ AST to ArkFile: ${source}`, err as Error);
            }
        },
    });
    for (const e of result.dumpErrors) {
        logger.warn(`C++ AST dump error for ${e.filePath}`, e.reason);
    }
    if (result.exitCode !== 0) {
        logger.warn(`C++ single-file AST parse not completed successfully: ${sourceFile}`);
    }
}

/**
 * Imports-only variant of {@link prepareArkFile}. Parses the C++ AST for the given
 * file and populates only basic file metadata and ImportInfo (#include directives
 * and using-namespace declarations). Does NOT build ArkClass/ArkMethod/ArkNamespace/ArkBody.
 *
 * @param arkFile - Pre-allocated ArkFile to populate (must have scene and file path set).
 */
export function buildImportExportInfoFromFile(arkFile: ArkFile): void {
    const scene = arkFile.getScene();
    const sourceFile = path.resolve(arkFile.getFilePath());
    const projectDir = scene.getRealProjectDir();
    const includeDirs = scene.getIncludeDirs();
    const logAstInfo = scene.getOptions().languages?.cpp?.logAstInfo === true;
    const result = getAstParser().runCppAst({
        scene,
        sources: [sourceFile],
        projectDir,
        includeDirs,
        maxParallelProcesses: 1,
        maxPendingAstResults: 2,
        logAstInfo,
        onSourceAst: (source, astRoot) => {
            try {
                applyArkFileForImports(arkFile, source, astRoot);
            } catch (err) {
                logger.warn(`Failed to apply C++ AST (imports-only) to ArkFile: ${source}`, err as Error);
            }
        },
    });
    for (const e of result.dumpErrors) {
        logger.warn(`C++ AST dump error for ${e.filePath}`, e.reason);
    }
    if (result.exitCode !== 0) {
        logger.warn(`C++ single-file AST parse not completed successfully: ${sourceFile}`);
    }
}

export const classMap: Map<string, ArkClass> = new Map<string, ArkClass>();

export function buildArkClassFromCxxClass(classNode: CxxAstNode, arkFile: ArkFile, astRoot: CxxAstNode): void {
    let cls: ArkClass = new ArkClass();
    if (classNode.kind === AstKind.ClassTemplateDecl) {
        classNode.tagUsed = classNode.tagUsed ? classNode.tagUsed : CxxTagUsed.Class;
    }
    buildNormalArkClassFromArkFile(classNode, arkFile, cls, astRoot);
    addExportInfoOnCondition(classNode, cls, arkFile, astRoot);
    if (classNode.id) {
        classMap.set(classNode.id, cls);
    }
}

/**
 * Building import info from inclusion directive (just like: #include '../xxx.h')
 *
 * @param includeInfo Info of inclusion
 * @param includeNode Ast node of inclusion
 * @param astRoot Ast node of translate unit file
 * @param arkFile ArkFile of translate unit file
 * @returns
 */
function buildImportInfoFromInclude(includeInfo: CxxIncludeInfo, includeNode: CxxAstNode, astRoot: CxxAstNode, arkFile: ArkFile): void {
    let importInfo = buildGenericImportInfo(includeInfo, includeNode, astRoot, arkFile);
    if (!importInfo) {
        return;
    }
    importInfo.setDeclaringArkFile(arkFile);
    if (shouldAddCxxHeaderImport(importInfo)) {
        arkFile.addImportInfo(importInfo);
    }
}

/**
 * Building import info from using namespace declaration (just like: using namespace xxx)
 *
 * @param usingNode Ast node of using declaration
 * @param astRoot Ast node of translate unit file
 * @param arkFile ArkFile of translate unit file
 * @returns
 */
function buildImportInfoFromUsing(usingNode: CxxAstNode, astRoot: CxxAstNode, arkFile: ArkFile): void {
    let importInfo = buildUsingNamespaceImportInfo(usingNode, astRoot, arkFile);
    if (!importInfo) {
        return;
    }
    importInfo.setDeclaringArkFile(arkFile);
    if (shouldAddCxxHeaderImport(importInfo)) {
        arkFile.addImportInfo(importInfo);
    }
}

function addExportInfoOnCondition(currNode: CxxAstNode, arkInstance: ArkExport, arkFile: ArkFile, astRoot: CxxAstNode): void {
    if (currNode.loc?.file?.endsWith('.h')) {
        arkFile.addExportInfo(buildExportInfo(arkInstance, arkFile, FullPosition.cxxBuildFromNode(currNode, astRoot)));
    }
}

function buildArkMethodFromCxxMethod(mtdNode: CxxAstNode, arkFile: ArkFile, astRoot: CxxAstNode, arkClass?: ArkClass): void {
    let mtd = new ArkMethod();
    buildArkMethodFromArkClass(mtdNode, arkClass ?? arkFile.getDefaultClass(), mtd, astRoot);
    addExportInfoOnCondition(mtdNode, mtd, arkFile, astRoot);
}

/**
 * Building ArkFile instance
 *
 * @param arkFile
 * @param astRoot
 * @returns
 */
function buildArkFile(arkFile: ArkFile, astRoot: CxxAstNode): void {
    // handle header units
    astRoot.headerUnits?.forEach((child: CxxAstNode) => {
        if (!child.includes) {
            return;
        }
        for (const includeInfo of child.includes) {
            if (includeInfo.kind !== AstKind.InclusionDirective) {
                logger.trace('Unprocess kind of header unit: ', includeInfo.kind ?? includeInfo.includeName);
                continue;
            }
            buildImportInfoFromInclude(includeInfo, child, astRoot, arkFile);
        }
    });
    // handle non-header unit
    const statements = astRoot.inner ?? [];
    statements.forEach((child: CxxAstNode) => {
        let childKind = child.kind;
        switch (childKind) {
            // 'RecordDecl' ---C Language (struct/class/union)
            // 'CXXRecordDecl' ---C++ Language (struct/class/union)
            case AstKind.RecordDecl:
            case AstKind.CXXRecordDecl:
            case AstKind.ClassTemplateDecl:
                buildArkClassFromCxxClass(child, arkFile, astRoot);
                break;
            case AstKind.FunctionDecl:
            case AstKind.FriendDecl:
            case AstKind.FunctionTemplateDecl:
                buildArkMethodFromCxxMethod(child, arkFile, astRoot);
                break;
            case AstKind.NamespaceDecl:
                let ns: ArkNamespace = new ArkNamespace();
                ns.setDeclaringArkFile(arkFile);
                buildArkNamespace(child, arkFile, ns, astRoot);
                arkFile.addNamespace(ns);
                addExportInfoOnCondition(child, ns, arkFile, astRoot);
                break;
            case AstKind.CXXMethodDecl:
            case AstKind.CXXConstructorDecl:
            case AstKind.CXXDestructorDecl:
                // Member function, construction and destructor need to establish the function class first
                const arkClass = getDeclaringArkClassOfMethod(child, arkFile);
                buildArkMethodFromCxxMethod(child, arkFile, astRoot, arkClass);
                break;
            case AstKind.EnumDecl:
                child = { ...child, tagUsed: CxxTagUsed.Enum };
                buildArkClassFromCxxClass(child, arkFile, astRoot);
                break;
            case AstKind.UsingDirectiveDecl:
                buildImportInfoFromUsing(child, astRoot, arkFile);
                break;
            case AstKind.VarDecl:
                // handle global variable
                child.mangledName = DEFAULT_ARK_CLASS_NAME;
                const arkDefaultClass = getDeclaringArkClassOfMethod(child, arkFile);
                buildProperty2ArkField(child, astRoot, arkDefaultClass);
                break;
            case AstKind.LinkageSpecDecl:
                buildArkFile(arkFile, child);
            default:
                logger.trace('Child joined default method of arkFile: ', child.kind);
                break;
        }
    });
}

// Get ArkClass of 'CXXMethodDecl'/'CXXConstructorDecl'/'CXXDestructorDecl'
function getDeclaringArkClassOfMethod(mtd: CxxAstNode, arkFile: ArkFile): ArkClass {
    const className: string = mtd.mangledName ?? '';
    let arkClass = arkFile.getClasses().find(arkClass => arkClass.getName() === className);
    if (!arkClass) {
        arkClass = new ArkClass();
        const classSignature = new ClassSignature(className, arkFile.getFileSignature());
        arkClass.setSignature(classSignature);
        arkClass.setDeclaringArkFile(arkFile);
        arkFile.addArkClass(arkClass);
        init4InstanceInitMethod(arkClass);
        init4StaticInitMethod(arkClass);
    }
    return arkClass;
}

function genDefaultArkClass(arkFile: ArkFile, astRoot: CxxAstNode): void {
    let defaultClass = new ArkClass();

    buildDefaultArkClassFromArkFile(arkFile, defaultClass, astRoot);
    arkFile.setDefaultClass(defaultClass);
    arkFile.addArkClass(defaultClass);
}
