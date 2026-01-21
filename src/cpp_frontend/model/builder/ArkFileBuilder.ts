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
import { ArkFile } from '../../../core/model/ArkFile';
import { ArkNamespace } from '../../../core/model/ArkNamespace';
import { buildNormalArkClassFromArkFile } from './ArkClassBuilder';
import { buildArkMethodFromArkClass } from './ArkMethodBuilder';
import { buildExportInfo } from '../../../core/model/builder/ArkExportBuilder';
import { buildArkNamespace } from './ArkNamespaceBuilder';
import { ArkClass } from '../../../core/model/ArkClass';
import { buildDefaultArkClassFromArkFile } from './ArkClassBuilder';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { AstUtils } from '../../ast/astUtils';
import { FileSignature, ClassSignature } from '../../../core/model/ArkSignature';
import { LineColPosition } from '../../../core/base/Position';
import { buildGenericImportInfo, buildUsingNamespaceImportInfo } from './ArkImportBuilder';
import { shouldAddCxxHeaderImport } from '../../common/ModelUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { init4InstanceInitMethod, init4StaticInitMethod } from '../../../core/model/builder/ArkClassBuilder';
import { astKind, CxxAstNode, CxxIncludeInfo } from '../../ast/ArkCxxAstNode';
import { ArkExport } from '../../../core/model/ArkExport';
import { Scene } from '../../../Scene';
import { buildProperty2ArkField } from './ArkFieldBuilder';
import { DEFAULT_ARK_CLASS_NAME } from '../../../core/common/Const';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkFileBuilder');

interface ModuleInfo {
    moduleName?: string;
    name: string;
    path?: string;
}
export const classMap : Map<string, ArkClass> = new Map<string, ArkClass>();
function extractOhosSdkPath(mapData: Map<string, ModuleInfo>): string {
    for (const [key, value] of mapData.entries()) {
        if (key !== 'ohosSdk') {
            continue;
        }
        const sdkPath = Object.prototype.hasOwnProperty.call(value, 'path') ? value.path : '';
        if (typeof sdkPath === 'string' && sdkPath) {
            return sdkPath;
        }
    }
    return '';
}

function findLLVMPath(inputPath: string): string {
    if (!inputPath || !inputPath.trim() || !path.isAbsolute(inputPath)) {
        return '';
    }

    const normalized = path.normalize(inputPath);
    const parts = normalized.split(path.sep);

    const devEcoIndex = parts.findIndex(p => p.trim() === 'DevEco Studio');
    if (devEcoIndex === -1) {
        return '';
    }

    const basePath = path.join(...parts.slice(0, devEcoIndex + 1));

    // Prioritize finding LLVM path in environment variables
    const envPathList = (process.env.PATH || '').split(';');
    const llvmEnvPath = envPathList.find(p => p.includes('clang+llvm-19.1.7-x86_64-pc-windows-msvc') && fs.existsSync(p)) || '';

    const llvmBinCandidates = [
        llvmEnvPath,
        path.join(basePath, 'sdk', 'default', 'openharmony', 'native', 'clang+llvm-19.1.7-x86_64-pc-windows-msvc', 'bin'),
        path.join(basePath, 'sdk', 'default', 'openharmony', 'native', 'llvm', 'bin'),
    ];

    for (const candidate of llvmBinCandidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return '';
}

/**
 * Entry of building ArkFile instance
 *
 * @param absoluteFilePath
 * @param projectDir
 * @param arkFile
 * @param projectName
 * @param includeDirs
 * @returns
 */
export function buildArkFileFromFile(absoluteFilePath: string, projectDir: string, arkFile: ArkFile, projectName: string, includeDirs: string[] = []): void {
    let scene: Scene = arkFile.getScene();
    arkFile.setFilePath(absoluteFilePath);
    arkFile.setProjectDir(projectDir);

    const fileSignature = new FileSignature(projectName, path.relative(projectDir, absoluteFilePath));
    arkFile.setFileSignature(fileSignature);
    arkFile.setCode(fs.readFileSync(arkFile.getFilePath(), 'utf8'));
    let sdkPath = extractOhosSdkPath(arkFile.getScene().getProjectSdkMap());
    let llvmPath = findLLVMPath(sdkPath);
    const jsonObject = AstUtils.parse(absoluteFilePath, scene.getCcjsonPath(), includeDirs, llvmPath, scene.getCppAstPath());
    genDefaultArkClass(arkFile, jsonObject);
    buildArkFile(arkFile, jsonObject);
}

export function buildArkClassFromCxxClass(classNode: CxxAstNode, arkFile: ArkFile, astRoot: CxxAstNode): void {
    let cls: ArkClass = new ArkClass();
    if (classNode.kind === 'ClassTemplateDecl') {
        classNode.tagUsed = classNode.tagUsed ? classNode.tagUsed : 'class';
    }
    buildNormalArkClassFromArkFile(classNode, arkFile, cls, astRoot);
    addExportInfoOnCondition(classNode, cls, arkFile);
    if (classNode.id) {
        classMap.set(classNode.id,cls);
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

function addExportInfoOnCondition(currNode: CxxAstNode, arkInstance: ArkExport, arkFile: ArkFile): void {
    if (currNode.loc?.file?.endsWith('.h')) {
        arkFile.addExportInfo(buildExportInfo(arkInstance, arkFile, LineColPosition.cxxBuildFromNode(currNode)));
    }
}

function buildArkMethodFromCxxMethod(mtdNode: CxxAstNode, arkFile: ArkFile, astRoot: CxxAstNode, arkClass?: ArkClass): void {
    let mtd = new ArkMethod();
    buildArkMethodFromArkClass(mtdNode, arkClass ?? arkFile.getDefaultClass(), mtd, astRoot);
    addExportInfoOnCondition(mtdNode, mtd, arkFile);
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
            if (includeInfo.kind !== 'InclusionDirective') {
                logger.trace('Unprocess kind of header unit: ', includeInfo.kind ?? includeInfo.code);
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
            case astKind.RecordDecl:
            case astKind.CXXRecordDecl:
            case astKind.ClassTemplateDecl:
                buildArkClassFromCxxClass(child, arkFile, astRoot);
                break;
            case astKind.FunctionDecl:
            case astKind.FriendDecl:
            case astKind.FunctionTemplateDecl:
                buildArkMethodFromCxxMethod(child, arkFile, astRoot);
                break;
            case astKind.NamespaceDecl:
                let ns: ArkNamespace = new ArkNamespace();
                ns.setDeclaringArkFile(arkFile);
                buildArkNamespace(child, arkFile, ns, astRoot);
                arkFile.addNamespace(ns);
                addExportInfoOnCondition(child, ns, arkFile);
                break;
            case astKind.CXXMethodDecl:
            case astKind.CXXConstructorDecl:
            case astKind.CXXDestructorDecl:
                // Member function, construction and destructor need to establish the function class first
                const arkClass = getDeclaringArkClassOfMethod(child, arkFile);
                buildArkMethodFromCxxMethod(child, arkFile, astRoot, arkClass);
                break;
            case astKind.EnumDecl:
                child = { ...child, tagUsed: 'enum' };
                buildArkClassFromCxxClass(child, arkFile, astRoot);
                break;
            case astKind.UsingDirectiveDecl:
                buildImportInfoFromUsing(child, astRoot, arkFile);
                break;
            case astKind.VarDecl:
                // handle global variable
                child.mangledName = DEFAULT_ARK_CLASS_NAME;
                const arkDefaultClass = getDeclaringArkClassOfMethod(child, arkFile);
                buildProperty2ArkField(child, astRoot, arkDefaultClass);
                break;
            case astKind.LinkageSpecDecl:
                buildArkFile(arkFile, child);
            default:
                logger.trace('Child joined default method of arkFile: ', child.kind ?? child.code);
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
