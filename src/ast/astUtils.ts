/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import Logger, { LOG_MODULE_TYPE } from '../utils/logger';
import { ClangPath } from './const';
import {CppAstNode, CppAstNodeLite} from './ArkCxxAstNode';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'astUtils');

export class AstUtils {
    private static currentAccess: string = 'public';

    public static parse(sourceFile: string, ccJsonPath: string | null, includeDirs: string[] | null, llvmPath: string): CppAstNode {
        if (!fs.existsSync(sourceFile)) {
            logger.warn('parse file is not exists');
            return {
                kind: '',
                name: '',
                code: '',
                type: { qualType: '' },
                inner: []
            };
        }
        let clangPath: string = this.getPlatformClang().toString();
        if (clangPath === '') {
            logger.warn('can not find clang path');
            return {
                kind: '',
                name: '',
                code: '',
                type: { qualType: '' },
                inner: []
            };
        }
        let astPath: string = this.getAstOutputPath(sourceFile);
        let includeArgs = constructParseArguments(ccJsonPath, includeDirs);
        let parseArguments: string[] = [sourceFile, '-o', astPath];
        parseArguments = [...parseArguments, ...includeArgs];
        this.ensureOutputDir(path.dirname(astPath));
        const sep = path.delimiter;
        const existingPath = process.env.PATH ?? '';
        // 判断是否需要将 llvmPath 添加进 PATH（避免重复添加）
        const shouldAppendLlvmPath = llvmPath && !existingPath.split(sep).includes(llvmPath);
        // 如果需要追加 llvmPath，构造新的环境变量对象；否则使用默认环境变量
        const envVars = shouldAppendLlvmPath
            ? {
                  ...process.env,
                  PATH: existingPath + sep + llvmPath,
              }
            : undefined;

        const parseResult = spawnSync(clangPath, parseArguments, { stdio: ['inherit', 'pipe'], encoding: 'utf-8', env: envVars });

        if (parseResult.status) {
            logger.info('Error parsing ast', parseResult.stderr);
        } else {
            logger.info('Parsing completed!');
        }
        let translationUnit = JSON.parse(fs.readFileSync(astPath, 'utf-8')) as CppAstNode;
        translationUnit = this.filter(sourceFile, translationUnit) as CppAstNode;
        deleteFIle(astPath);
        return translationUnit;
    }

    private static updateInner(sourceFile: string, firstOccurrenceOfMainFile: boolean, entry: CppAstNode, newInner: CppAstNode[]): void {
        if (!firstOccurrenceOfMainFile) {
            if (Object.prototype.hasOwnProperty.call(entry, 'isImplicit') && entry.isImplicit && entry.kind !== 'UsingDirectiveDecl') {
                return;
            }
            let fileName = '';
            let loc = entry.locFile;
            if (!loc) {
                if (entry.kind === 'inclusion directive') {
                    entry.locFile = sourceFile;
                    newInner.push(entry);
                } else {
                    logger.warn('Node skipped due to missing "locFile", kind of node: ', entry.kind);
                }
                return;
            }
            if (entry.locFile) {
                fileName = entry.locFile;
            }
            if (Object.prototype.hasOwnProperty.call(entry, 'include') && entry.include && entry.kind !== 'inclusion directive') {
                newInner.push(entry);
                return;
            }
            if (fileName !== sourceFile) {
                return;
            }
        }
        newInner.push(entry);
    }

    private static filter(sourceFile: string, translationUnit: CppAstNode):CppAstNode {
        let newInner: any[] = [];
        let firstOccurrenceOfMainFile: boolean = false;
        for (let index in translationUnit.inner) {
            if (Object.prototype.hasOwnProperty.call(translationUnit.inner, index)) {
                let entry = translationUnit.inner[index];
                this.updateInner(sourceFile, firstOccurrenceOfMainFile, entry, newInner);
            }
        }
        translationUnit.inner = newInner;
        translationUnit.fileName = sourceFile;
        translationUnit.projectName = path.dirname(sourceFile);
        this.fullInfo(translationUnit);
        return translationUnit;
    }

    private static filterChildren(cursor: CppAstNode): CppAstNode[] {
        let filteredChildren: CppAstNode[] = [];
        if (!Object.prototype.hasOwnProperty.call(cursor, 'inner')) {
            return filteredChildren;
        }
        filteredChildren = cursor.inner.filter(
            (item: CppAstNode) => !Object.prototype.hasOwnProperty.call(cursor, 'isImplicit') || !item.isImplicit || cursor.kind === 'LambdaExpr' || item.isUsed
        );
        return filteredChildren;
    }

    private static fullInfo(cursor: CppAstNode): void {
        if (!Array.isArray(cursor.inner)) {
            cursor.inner = [];
        }
        cursor.inner = this.filterChildren(cursor);
        if (!Object.prototype.hasOwnProperty.call(cursor, 'name') || cursor.name === undefined) {
            cursor.name = '';
        }
        for (const idx in cursor.inner) {
            if (!Object.prototype.hasOwnProperty.call(cursor.inner, idx)) {
                continue;
            }
            const currentCursor = cursor.inner[idx];
            // 明确 getParent 的重载类型
            type GetParentOverload = { (isNeedInner: true): CppAstNode; (isNeedInner?: false): CppAstNodeLite; };
            const getParentImpl: GetParentOverload = ((isNeedInner?: boolean):CppAstNodeLite => {
                if (isNeedInner) {
                    return { ...cursor };
                }
                // 去掉 inner 的浅拷贝
                const { inner, ...rest } = cursor as CppAstNode;
                return rest as CppAstNodeLite;
            }) as GetParentOverload;
            Object.assign(currentCursor, { getParent: getParentImpl });
            this.processAccess(currentCursor);
            this.fullInfo(currentCursor);
        }
    }


    static extractCppModifier(code: string): string | null {
        const cppModifiers = [
            'static',
            'public',
            'private',
            'protected',
            'const',
            'virtual',
            'inline',
            'mutable',
            'explicit',
            'friend',
            'constexpr',
            'volatile',
            'extern',
            'register',
            'thread_local',
            'typedef',
        ];
        // 构造正则表达式, \b 保证是单词匹配
        const pattern = new RegExp(`\\b(${cppModifiers.join('|')})\\b`, 'g');
        const match = pattern.exec(code);
        if (match) {
            return match[1];
        }
        return null;
    }

    private static processAccess(cursor: CppAstNode): void {
        if (cursor.kind === 'AccessSpecDecl') {
            this.currentAccess = cursor.access ??  '';
        }
        if (cursor.kind === 'CXXMethodDecl' || cursor.kind === 'FieldDecl' || cursor.kind === 'VarDecl' || cursor.kind === 'FriendDecl') {
            let codeModifier = this.extractCppModifier(cursor.code);
            if (codeModifier !== null) {
                cursor.access = codeModifier;
            } else if (!cursor.isImplicit) {
                cursor.access = this.currentAccess;
            }
        }
    }

    private static getAstOutputPath(sourceFile: string): string {
        const fileName = `${path.parse(path.basename(sourceFile)).name}_AST.json`;
        return path.join(ClangPath.protectRoot, 'src', 'ast', 'out', fileName);
    }

    private static ensureOutputDir(dir: string): void {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private static getPlatformClang(): string {
        let platform = os.platform();
        switch (platform) {
            case 'win32':
                return ClangPath.WindowsPath;
            case 'linux':
                return ClangPath.LinuxPath;
            default:
                return ClangPath.Unknown;
        }
    }
}

async function deleteFIle(filePath: string): Promise<void> {
    try {
        await fs.promises.unlink(filePath);
        logger.info('delete file ok:', filePath);
    } catch (err) {
        logger.warn('delete file is not ok:', filePath);
    }
}

function constructParseArguments(ccJsonPath: string | null, includeDirs: string[] | null): string[] {
    const args: string[] = [];

    if (ccJsonPath) {
        args.push('-c', ccJsonPath);
    }
    if (includeDirs && includeDirs.length > 0) {
        includeDirs.forEach(dir => {
            args.push('-i', `${dir}`);
        });
    }
    return args;
}
