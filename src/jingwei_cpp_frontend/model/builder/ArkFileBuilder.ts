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
import { buildDefaultArkClassFromArkFile, buildNormalArkClassFromArkFile } from './ArkClassBuilder';
import { buildArkMethodFromArkClass } from './ArkMethodBuilder';
import {buildExportInfo} from '../../../core/model/builder/ArkExportBuilder'
import { buildArkNamespace } from './ArkNamespaceBuilder';
import { ArkClass } from '../../../core/model/ArkClass';
import { ArkMethod } from '../../../core/model/ArkMethod';
import {AstUtils} from "../../../ast/astUtils"
import { FileSignature, ClassSignature } from '../../../core/model/ArkSignature';
import { LineColPosition } from '../../../core/base/Position';
import { buildImportInfo } from './ArkImportBuilder';

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
export function buildArkFileFromFile(absoluteFilePath: string, projectDir: string, arkFile: ArkFile, projectName: string, includeDirs: string[] = []): void {
    arkFile.setFilePath(absoluteFilePath);
    arkFile.setProjectDir(projectDir);

    const fileSignature = new FileSignature(projectName, path.relative(projectDir, absoluteFilePath));
    arkFile.setFileSignature(fileSignature);

    arkFile.setCode(fs.readFileSync(arkFile.getFilePath(), 'utf8'));
    const jsonObject = AstUtils.parse(absoluteFilePath, null, includeDirs);
    genDefaultArkClass(arkFile, jsonObject);
    buildArkFile(arkFile, jsonObject);
}

function isChildLocFileHeader(child: any): boolean {
    return (
        child.hasOwnProperty('loc') &&
        child.loc &&
        child.loc.hasOwnProperty('file') &&
        typeof child.loc.file === 'string' &&
        child.loc.file.endsWith('.h')
    );
}

/**
 * Building ArkFile instance
 *
 * @param arkFile
 * @param astRoot
 * @returns
 */
function buildArkFile(arkFile: ArkFile, astRoot: any): void {
    const includeNodes = astRoot.headerUnits?.filter(
        (item: any) => item?.kind === 'inclusion directive') ?? [];
    const statements = [...includeNodes, ...astRoot.inner]
    let recordMap = new Map; //记录派生类
    statements.forEach((child: any) => {
        if (child.kind === 'CXXRecordDecl' || child.kind === 'ClassTemplate') {
            let cls: ArkClass = new ArkClass();
            if (child.kind === 'ClassTemplate') {
                child.tagUsed = 'class';
            }
            buildNormalArkClassFromArkFile(child, arkFile, cls, astRoot);
            arkFile.addArkClass(cls);
            recordMap.set(child.id, cls);
            if (isChildLocFileHeader(child)) {
                arkFile.addExportInfo(buildExportInfo(cls, arkFile, LineColPosition.buildFromNodeCpp(child, astRoot)))
            }

        } else if (child.kind === 'FunctionDecl' || child.kind === 'FriendDecl' || child.kind === 'FunctionTemplate') {
            let mthd: ArkMethod = new ArkMethod();

            buildArkMethodFromArkClass(child, arkFile.getDefaultClass(), mthd, astRoot);
            if (isChildLocFileHeader(child)) {
                arkFile.addExportInfo(buildExportInfo(mthd, arkFile, LineColPosition.buildFromNodeCpp(child, astRoot)))
            }
        } else if (child.kind === 'NamespaceDecl') {
            let ns: ArkNamespace = new ArkNamespace();
            ns.setDeclaringArkFile(arkFile);
            buildArkNamespace(child, arkFile, ns, astRoot);
            arkFile.addNamespace(ns);
            if (isChildLocFileHeader(child)) {
                arkFile.addExportInfo(buildExportInfo(ns, arkFile, LineColPosition.buildFromNodeCpp(child, astRoot)))
            }
        } else if (child.kind === 'CXXMethodDecl' || child.kind === 'CXXConstructorDecl' || child.kind === 'CXXDestructorDecl') {
            const arkClass = getDeclaringArkClassOfMethod(child, arkFile);
            let mthd: ArkMethod = new ArkMethod();
            // @ts-ignore
            buildArkMethodFromArkClass(child, arkClass, mthd, astRoot);
            if (isChildLocFileHeader(child)) {
                arkFile.addExportInfo(buildExportInfo(mthd, arkFile, LineColPosition.buildFromNodeCpp(child, astRoot)))
            }
        } else if (child.kind === 'TypedefDecl') {
            if (child.inner[0].kind === "CXXRecordDecl") {
                let cls: ArkClass = new ArkClass();
                buildNormalArkClassFromArkFile(child.inner[0], arkFile, cls, astRoot);
                arkFile.addArkClass(cls);
                recordMap.set(child.id, cls);
                if (isChildLocFileHeader(child)) {
                    arkFile.addExportInfo(buildExportInfo(cls, arkFile, LineColPosition.buildFromNodeCpp(child, astRoot)))
                }
            }
        } else if (child.kind === 'EnumDecl') {
            child = { ...child, 'tagUsed': 'enum' };
            let cls: ArkClass = new ArkClass();
            buildNormalArkClassFromArkFile(child, arkFile, cls, astRoot);
            recordMap.set(child.id, cls);
            if (isChildLocFileHeader(child)) {
                arkFile.addExportInfo(buildExportInfo(cls, arkFile, LineColPosition.buildFromNodeCpp(child, astRoot)))
            }
        } else if (child.kind === 'inclusion directive') {
            let importInfos = buildImportInfo(child, astRoot, arkFile);
            importInfos?.forEach(element => {
                element.setDeclaringArkFile(arkFile);
                arkFile.addImportInfo(element);
            });
        }

    });
}

// Get ArkClass of 'CXXMethodDecl'/'CXXConstructorDecl'/'CXXDestructorDecl'
function getDeclaringArkClassOfMethod(mtd: any, arkFile: ArkFile): ArkClass {
    const className: string = mtd.mangledName;
    let arkClass = arkFile.getClasses().find(arkClass => (arkClass.getName() === className));
    if (!arkClass) {
        arkClass = new ArkClass();
        const classSignature = new ClassSignature(className, arkFile.getFileSignature());
        arkClass.setSignature(classSignature);
        arkClass.setDeclaringArkFile(arkFile);
        arkFile.addArkClass(arkClass);
    }
    return arkClass;
}

function genDefaultArkClass(arkFile: ArkFile, astRoot: any): void {
    let defaultClass = new ArkClass();

    buildDefaultArkClassFromArkFile(arkFile, defaultClass, astRoot);
    arkFile.setDefaultClass(defaultClass);
    arkFile.addArkClass(defaultClass);
}
