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
import { AstUtils } from '../../../ast/astUtils';
import { FileSignature, ClassSignature } from '../../../core/model/ArkSignature';
import { LineColPosition } from '../../../core/base/Position';
import { buildImportInfo } from './ArkImportBuilder';
import { shouldAddCppHeaderImport } from '../../common/ModelUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { init4InstanceInitMethod, init4StaticInitMethod } from '../../../core/model/builder/ArkClassBuilder';
import { CppAstNode } from "../../../ast/ArkCxxAstNode";

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkFileBuilder');

function extractOhosSdkPath(mapData: Map<string, any>): string {
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

    // 优先查找环境变量中 LLVM 路径
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
    arkFile.setFilePath(absoluteFilePath);
    arkFile.setProjectDir(projectDir);

    const fileSignature = new FileSignature(projectName, path.relative(projectDir, absoluteFilePath));
    arkFile.setFileSignature(fileSignature);
    arkFile.setCode(fs.readFileSync(arkFile.getFilePath(), 'utf8'));
    let sdkPath = extractOhosSdkPath(arkFile.getScene().getProjectSdkMap());
    let llvmPath = findLLVMPath(sdkPath);
    const jsonObject = AstUtils.parse(absoluteFilePath, null, includeDirs, llvmPath);
    genDefaultArkClass(arkFile, jsonObject);
    buildArkFile(arkFile, jsonObject);
}

function isChildLocFileHeader(child: CppAstNode): boolean {
    return (
        Object.prototype.hasOwnProperty.call(child, 'locFile') &&
        typeof child.locFile === 'string' &&
        child.locFile.endsWith('.h')
    );
}

/**
 * Building ArkFile instance
 *
 * @param arkFile
 * @param astRoot
 * @returns
 */
function buildArkFile(arkFile: ArkFile, astRoot: CppAstNode): void {
    const includeNodes = astRoot.headerUnits?.filter((item: CppAstNode) => item?.kind === 'inclusion directive') ?? [];
    const statements = [...includeNodes, ...(astRoot.inner ?? [])];
    let recordMap = new Map(); //记录派生类
    statements.forEach((child: CppAstNode) => {
        if (child.kind === 'CXXRecordDecl' || child.kind === 'ClassTemplate') {
            let cls: ArkClass = new ArkClass();
            if (child.kind === 'ClassTemplate') {
                child.tagUsed = 'class';
            }
            buildNormalArkClassFromArkFile(child, arkFile, cls, astRoot);
            arkFile.addArkClass(cls);
            recordMap.set(child.id, cls);
            if (isChildLocFileHeader(child)) {
                arkFile.addExportInfo(buildExportInfo(cls, arkFile, LineColPosition.buildFromNodeCpp(child, astRoot)));
            }
        } else if (child.kind === 'FunctionDecl' || child.kind === 'FriendDecl' || child.kind === 'FunctionTemplate') {
            let mthd: ArkMethod = new ArkMethod();

            buildArkMethodFromArkClass(child, arkFile.getDefaultClass(), mthd, astRoot);
            if (isChildLocFileHeader(child)) {
                arkFile.addExportInfo(buildExportInfo(mthd, arkFile, LineColPosition.buildFromNodeCpp(child, astRoot)));
            }
        } else if (child.kind === 'NamespaceDecl' || child.kind === 'Namespace') {
            let ns: ArkNamespace = new ArkNamespace();
            ns.setDeclaringArkFile(arkFile);
            buildArkNamespace(child, arkFile, ns, astRoot);
            arkFile.addNamespace(ns);
            if (isChildLocFileHeader(child)) {
                arkFile.addExportInfo(buildExportInfo(ns, arkFile, LineColPosition.buildFromNodeCpp(child, astRoot)));
            }
        } else if (child.kind === 'CXXMethodDecl' || child.kind === 'CXXConstructorDecl' || child.kind === 'CXXDestructorDecl') {
            // 成员函数，构造，析构函数需先进行函数所属类的建立
            const arkClass = getDeclaringArkClassOfMethod(child, arkFile);
            let mthd: ArkMethod = new ArkMethod();
            // @ts-ignore
            buildArkMethodFromArkClass(child, arkClass, mthd, astRoot);
            if (isChildLocFileHeader(child)) {
                arkFile.addExportInfo(buildExportInfo(mthd, arkFile, LineColPosition.buildFromNodeCpp(child, astRoot)));
            }
        } else if (child.kind === 'TypedefDecl') {
            if (child.inner?.[0]?.kind === 'CXXRecordDecl') {
                let cls: ArkClass = new ArkClass();
                buildNormalArkClassFromArkFile(child.inner[0], arkFile, cls, astRoot);
                arkFile.addArkClass(cls);
                recordMap.set(child.id, cls);
                if (isChildLocFileHeader(child)) {
                    arkFile.addExportInfo(buildExportInfo(cls, arkFile, LineColPosition.buildFromNodeCpp(child, astRoot)));
                }
            }
        } else if (child.kind === 'EnumDecl') {
            child = { ...child, tagUsed: 'enum' };
            let cls: ArkClass = new ArkClass();
            buildNormalArkClassFromArkFile(child, arkFile, cls, astRoot);
            recordMap.set(child.id, cls);
            if (isChildLocFileHeader(child)) {
                arkFile.addExportInfo(buildExportInfo(cls, arkFile, LineColPosition.buildFromNodeCpp(child, astRoot)));
            }
        } else if (child.kind === 'inclusion directive' || child.kind === 'UsingDirectiveDecl') {
            let importInfos = buildImportInfo(child, astRoot, arkFile);
            importInfos?.forEach(element => {
                element.setDeclaringArkFile(arkFile);
                if (shouldAddCppHeaderImport(element)) {
                    arkFile.addImportInfo(element);
                }
            });
        } else {
            logger.trace('Child joined default method of arkFile: ', child.kind ?? child.code);
        }
    });
}

// Get ArkClass of 'CXXMethodDecl'/'CXXConstructorDecl'/'CXXDestructorDecl'
function getDeclaringArkClassOfMethod(mtd: CppAstNode, arkFile: ArkFile): ArkClass {
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

function genDefaultArkClass(arkFile: ArkFile, astRoot: CppAstNode): void {
    let defaultClass = new ArkClass();

    buildDefaultArkClassFromArkFile(arkFile, defaultClass, astRoot);
    arkFile.setDefaultClass(defaultClass);
    arkFile.addArkClass(defaultClass);
}
