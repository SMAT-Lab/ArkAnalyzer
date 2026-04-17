/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import * as fs from 'fs';
import * as path from 'path';

import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { astKind, CxxAstNode, CxxAstNodeLite } from './ArkCxxAstNode';
import { dumpAstJson } from './astJsonNapi/napiApi';
import { ClangPath, extractAllCppModifiers } from './astUtils';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'astParser');

export type GetParentFn = {
    (isNeedInner: true): CxxAstNode;
    (isNeedInner?: false): CxxAstNodeLite;
};

export class AstParser {
    private static currentAccess: string = '';

    private static deleteFileSync(filePath: string): void {
        try {
            fs.unlinkSync(filePath);
        } catch {
            logger.warn('delete file failed:', filePath);
        }
    }

    public static parse(sourceFile: string, ccJsonPath: string | null, includeDirs: string[] | null, llvmPath: string, cppAstPath: string): CxxAstNode {
        logger.info(`[Debug] Parsing File: ${sourceFile}`);
        if (!fs.existsSync(sourceFile)) {
            logger.warn('parse file is not exists');
            return this.createEmptyNode();
        }

        const rawAstPath = this.getAstOutputPath(sourceFile, cppAstPath);
        const astPath = path.resolve(rawAstPath);
        this.ensureOutputDir(path.dirname(astPath));
        const workingDir = this.getWorkingDir(ccJsonPath);

        const finalIncludeDirs = includeDirs ? [...includeDirs] : [];
        const projectRoot = this.resolveProjectRoot(sourceFile);
        if (projectRoot && !finalIncludeDirs.includes(projectRoot)) {
            finalIncludeDirs.push(projectRoot);
        }

        const status = dumpAstJson({
            sourceFile,
            outputFile: astPath,
            ccJsonPath: ccJsonPath ?? undefined,
            includeDirs: finalIncludeDirs,
        }, workingDir, llvmPath);

        return this.processAstFile(astPath, sourceFile, status);
    }

    private static resolveProjectRoot(sourceFile: string): string | null {
        try {
            let currentDir = path.dirname(sourceFile);
            for (let i = 0; i < 10; i++) {
                if (path.dirname(currentDir) === currentDir) {
                    break;
                }
                if (path.basename(currentDir) === 'cpp' && path.basename(path.dirname(currentDir)) === 'main') {
                    const absRoot = path.resolve(currentDir);
                    logger.info(`[Debug] Found Source Root: ${absRoot}`);
                    return absRoot;
                }
                currentDir = path.dirname(currentDir);
            }
        } catch (e) {
            logger.error('[Debug] Error finding source root:', e);
        }
        return null;
    }

    private static getWorkingDir(ccJsonPath: string | null): string {
        let workingDir = process.cwd();
        if (ccJsonPath && fs.existsSync(ccJsonPath)) {
            const stats = fs.statSync(ccJsonPath);
            if (stats.isFile()) {
                workingDir = path.dirname(ccJsonPath);
            } else {
                workingDir = ccJsonPath;
            }
        }
        return workingDir;
    }

    private static processAstFile(astPath: string, sourceFile: string, status: number): CxxAstNode {
        try {
            if (!fs.existsSync(astPath)) {
                logger.error(`[Debug] AST file missing at: ${astPath}`);
                return this.createEmptyNode();
            }
            const content = fs.readFileSync(astPath, 'utf-8');
            if (!content || content.trim() === '') {
                return this.createEmptyNode();
            }
            let tu = JSON.parse(content) as CxxAstNode;
            tu = this.filter(sourceFile, tu) as CxxAstNode;
            return tu;
        } catch (e) {
            logger.error('Failed to parse AST json:', e);
            return this.createEmptyNode();
        } finally {
            this.deleteFileSync(astPath);
        }
    }

    private static createEmptyNode(): CxxAstNode {
        return { kind: '', name: '', code: '', type: { qualType: '' }, inner: [] };
    }

    private static updateInner(sourceFile: string, entry: CxxAstNode, newInner: CxxAstNode[]): void {
        if (entry.isImplicit) {
            return;
        }
        const loc = entry.loc;
        if (!loc) {
            logger.warn('Node skipped due to missing "locFile", kind of node: ', entry.kind);
            return;
        }
        newInner.push(entry);
    }

    private static filter(sourceFile: string, translationUnit: CxxAstNode): CxxAstNode {
        const newInner: CxxAstNode[] = [];
        for (const entry of translationUnit.inner) {
            this.updateInner(sourceFile, entry, newInner);
        }
        translationUnit.inner = newInner;
        translationUnit.fileName = sourceFile;
        translationUnit.projectName = path.dirname(sourceFile);
        this.fullInfo(translationUnit);
        return translationUnit;
    }

    private static filterChildren(cursor: CxxAstNode): CxxAstNode[] {
        if (!cursor.inner) {
            return [];
        }
        return cursor.inner.filter((item: CxxAstNode) => !item.isImplicit);
    }

    private static makeGetParent(cursor: CxxAstNode): GetParentFn {
        function getParent(isNeedInner: true): CxxAstNode;
        function getParent(isNeedInner?: false): CxxAstNodeLite;
        function getParent(isNeedInner?: boolean): CxxAstNode | CxxAstNodeLite {
            if (isNeedInner) {
                return { ...cursor };
            }
            const { inner, ...rest } = cursor;
            return rest;
        }
        return getParent;
    }

    private static fullInfo(cursor: CxxAstNode): void {
        if (!cursor.inner) {
            cursor.inner = [];
        }
        cursor.inner = this.filterChildren(cursor);
        if (cursor.name === undefined) {
            cursor.name = '';
        }

        if (cursor.kind === 'LambdaExpr') {
            this.processAccess(cursor);
        }

        if (cursor.kind === astKind.CXXRecordDecl && cursor.tagUsed === 'class') {
            this.currentAccess = 'private';
        } else if (cursor.kind === astKind.CXXRecordDecl && cursor.tagUsed === 'struct') {
            this.currentAccess = 'public';
        } else {
            this.currentAccess = '';
        }

        for (const currentCursor of cursor.inner) {
            Object.assign(currentCursor, { getParent: this.makeGetParent(cursor) });
            if (cursor.kind === astKind.CXXRecordDecl || cursor.kind === astKind.CXXMethodDecl || cursor.kind === astKind.FunctionDecl) {
                this.processAccess(currentCursor);
            }
            this.fullInfo(currentCursor);
        }
    }

    private static processAccess(cursor: CxxAstNode): void {
        cursor.modifiers = [];
        if (cursor.kind === 'AccessSpecDecl') {
            this.currentAccess = cursor.access ?? extractAllCppModifiers(cursor.code)[0] ?? '';
        } else {
            const extractedCode = this.getCodeForExtractModifiers(cursor);
            const codeModifier = extractAllCppModifiers(extractedCode);
            if (this.currentAccess !== '') {
                cursor.modifiers.push(this.currentAccess);
            }
            if (codeModifier !== null) {
                cursor.modifiers.push(...codeModifier);
            }
        }
    }

    private static getCodeForExtractModifiers(cursor: CxxAstNode): string {
        const extractedCode = cursor.code;
        if (!['CXXConstructorDecl', 'CXXDestructorDecl', 'CXXMethodDecl', 'FriendDecl', 'FunctionDecl', 'FunctionTemplateDecl'].includes(cursor.kind)) {
            return extractedCode;
        }
        const bodyNode = cursor.inner.filter((inner) => inner.kind === 'CompoundStmt');
        const bodyCode = bodyNode.length === 0 ? '' : bodyNode[0].code;
        return this.stripFucntionParams(extractedCode.replace(bodyCode, ''));
    }

    private static stripFucntionParams(code: string): string {
        let depth = 0;
        let start = -1;
        let end = -1;
        for (let i = 0; i < code.length; i++) {
            const ch = code[i];
            if (ch === '(') {
                if (depth === 0) {
                    start = i;
                }
                depth++;
            } else if (ch === ')') {
                depth--;
                if (depth === 0) {
                    end = i;
                    break;
                }
            }
        }
        if (start === -1 || end === -1) {
            return code;
        }
        return code.slice(0, start).trimEnd() + ' ' + code.slice(end + 1).trimStart();
    }

    private static getAstOutputPath(sourceFile: string, cppAstPath: string): string {
        const fileName = `${path.parse(path.basename(sourceFile)).name}_AST.json`;
        if (cppAstPath !== '') {
            return path.join(cppAstPath, fileName);
        }
        return path.join(ClangPath.protectRoot, 'src', 'frontend', 'cppFrontend', 'ast', 'out', fileName);
    }

    private static ensureOutputDir(dir: string): void {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
}
