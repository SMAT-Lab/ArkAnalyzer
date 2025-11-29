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
import { buildImportInfo } from './ArkImportBuilder';
import { shouldAddCxxHeaderImport } from '../../common/ModelUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { init4InstanceInitMethod, init4StaticInitMethod } from '../../../core/model/builder/ArkClassBuilder';
import { CxxAstNode } from '../../ast/ArkCxxAstNode';
import { ArkExport } from '../../../core/model/ArkExport';
import { Scene } from '../../../Scene';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkFileBuilder');

interface ModuleInfo {
    moduleName?: string;
    name: string;
    path?: string;
}

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
    const jsonObject = AstUtils.parse(absoluteFilePath, scene.getCcjsonPath(), includeDirs, llvmPath);
    genDefaultArkClass(arkFile, jsonObject);
    buildArkFile(arkFile, jsonObject);
}

export function buildArkClassFromCxxClass(classNode: CxxAstNode, arkFile: ArkFile, astRoot: CxxAstNode): void {
    let cls: ArkClass = new ArkClass();
    if (classNode.kind === 'ClassTemplate') {
        classNode.tagUsed = classNode.tagUsed ? classNode.tagUsed : 'class';
    }
    buildNormalArkClassFromArkFile(classNode, arkFile, cls, astRoot);
    addExportInfoOnCondition(classNode, cls, arkFile);
}

function buildImportInfoFromIncludeOrUsing(child: CxxAstNode, astRoot: CxxAstNode, arkFile: ArkFile): void {
    let importInfo = buildImportInfo(child, astRoot, arkFile);
    if (!importInfo) {
        return;
    }
    importInfo.setDeclaringArkFile(arkFile);
    if (shouldAddCxxHeaderImport(importInfo)) {
        arkFile.addImportInfo(importInfo);
    }
}

function addExportInfoOnCondition(currNode: CxxAstNode, arkInstance: ArkExport, arkFile: ArkFile): void {
    if (Object.prototype.hasOwnProperty.call(currNode, 'locFile') &&
        typeof currNode.locFile === 'string' && currNode.locFile.endsWith('.h')) {
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
    const includeNodes = astRoot.headerUnits?.filter((item: CxxAstNode) => item?.kind === 'inclusion directive') ?? [];
    const statements = [...includeNodes, ...(astRoot.inner ?? [])];
    statements.forEach((child: CxxAstNode) => {
        let childKind = child.kind;
        switch (childKind) {
            case 'CXXRecordDecl':
            case 'ClassTemplate':
                buildArkClassFromCxxClass(child, arkFile, astRoot);
                break;
            case 'FunctionDecl':
            case 'FriendDecl':
            case 'FunctionTemplate':
                buildArkMethodFromCxxMethod(child, arkFile, astRoot);
                break;
            case 'NamespaceDecl':
            case 'Namespace':
                let ns: ArkNamespace = new ArkNamespace();
                ns.setDeclaringArkFile(arkFile);
                buildArkNamespace(child, arkFile, ns, astRoot);
                arkFile.addNamespace(ns);
                addExportInfoOnCondition(child, ns, arkFile);
                break;
            case 'CXXMethodDecl':
            case 'CXXConstructorDecl':
            case 'CXXDestructorDecl':
                // Member function, construction and destructor need to establish the function class first
                const arkClass = getDeclaringArkClassOfMethod(child, arkFile);
                buildArkMethodFromCxxMethod(child, arkFile, astRoot, arkClass);
                break;
            case 'TypedefDecl':
                if (child.inner?.[0]?.kind === 'CXXRecordDecl') {
                    buildArkClassFromCxxClass(child.inner[0], arkFile, astRoot);
                }
                break;
            case 'EnumDecl':
                child = { ...child, tagUsed: 'enum' };
                buildArkClassFromCxxClass(child, arkFile, astRoot);
                break;
            case 'inclusion directive':
            case 'UsingDirectiveDecl':
                buildImportInfoFromIncludeOrUsing(child, astRoot, arkFile);
                break;
            default:
                logger.error('Child joined default method of arkFile: ', child.kind ?? child.code);
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
