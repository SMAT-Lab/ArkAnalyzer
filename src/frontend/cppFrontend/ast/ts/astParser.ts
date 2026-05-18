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

import * as path from 'path';

import type { Scene } from '../../../../Scene';
import Logger, { LOG_MODULE_TYPE } from '../../../../utils/logger';
import { CxxAstFlatInfo } from './CxxAstFlatInfo';
import { astKind, CxxAstNode, CxxAstNodeLite } from './ArkCxxAstNode';
import { callCppAstParser } from './napi/napiApi';
import { getCxxHeaderFileExtensionSet } from './const';
import { extractAllCppModifiers, findCompileCommands, findProjectRoot } from './astUtils';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'astParser');

interface AstStreamRecord {
    index: number;
    exitCode: number;
    /** Absolute path to the per-TU AST file for this translation unit. */
    astPath: string;
}
export interface CppAstError {
    filePath: string;
    reason: Error;
}

export interface CppAstResult {
    dumpErrors: CppAstError[];
    exitCode: number;
}

export interface CppAstParams {
    scene: Scene;
    sources: string[];
    projectDir: string;
    includeDirs: string[];
    // <= 1 means serial mode.
    maxParallelProcesses: number;
    // <= 0 means auto (2 * workerCount).
    maxPendingAstResults: number;
    /** Log AST payload stats after each successful TU decode. */
    logAstInfo?: boolean;
    // Invoked for each source after the AST payload is decoded.
    onSourceAst: (sourceFile: string, astRoot: CxxAstNode) => void;
}

export type GetParentFn = {
    (isNeedInner: true): CxxAstNode;
    (isNeedInner?: false): CxxAstNodeLite;
};

export class AstParser {
    private static currentAccess: string = '';

    /**
     * Optional include-root hint (e.g. main/cpp) for consumers building compile or include lists.
     */
    public static resolveProjectRootForSource(sourceFile: string): string | null {
        return this.resolveProjectRoot(sourceFile);
    }

    /**
     * Runs one sync manifest batch and consumes ASTM records incrementally via addon callback.
     */
    public static runCppAst(params: CppAstParams): CppAstResult {
        const dumpErrors: CppAstError[] = [];
        const manifest = this.buildCppAstManifest(
            params.scene,
            params.sources,
            params.projectDir,
            params.includeDirs,
            params.maxParallelProcesses,
            params.maxPendingAstResults,
        );
        let processed = 0;
        const applyRecord = (rec: AstStreamRecord): void => {
            AstParser.applyCppAstRecord(rec, params, dumpErrors);
            processed++;
            AstParser.logHeapProgressIfDebug(processed, params.sources.length);
        };
        const exitCode = callCppAstParser(manifest, (record) => {
            applyRecord({
                index: record.index,
                exitCode: record.exitCode,
                astPath: record.payload,
            });
        });
        return { dumpErrors, exitCode };
    }

    private static applyCppAstRecord(rec: AstStreamRecord, params: CppAstParams, dumpErrors: CppAstError[]): void {
        const sourceFile = params.sources[rec.index];
        try {
            const astRoot = this.processAst(rec.astPath, sourceFile, rec.exitCode, params.logAstInfo ?? false);
            params.onSourceAst(sourceFile, astRoot);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            CxxAstFlatInfo.logError(sourceFile, err);
            dumpErrors.push({ filePath: sourceFile, reason: err });
        }
    }

    private static logHeapProgressIfDebug(processed: number, total: number): void {
        if (process.env.ARKANALYZER_DEBUG_AST_MEM !== '1') {
            return;
        }
        if (processed % 50 !== 0 && processed !== total) {
            return;
        }
        const m = process.memoryUsage();
        logger.info(
            `[HEAP] processed=${processed}/${total} ` +
                `heapUsed=${(m.heapUsed / 1024 / 1024).toFixed(1)}MB ` +
                `rss=${(m.rss / 1024 / 1024).toFixed(1)}MB ` +
                `external=${(m.external / 1024 / 1024).toFixed(1)}MB`
        );
    }

    private static buildCppAstManifest(
        scene: Scene,
        sources: string[],
        projectDir: string,
        includeDirs: string[],
        maxParallelProcesses: number,
        maxPendingAstResults: number,
    ): string {
        const sceneCc = scene.getCcjsonPath() ?? '';
        const defaultCcAbs = sceneCc ? (path.isAbsolute(sceneCc) ? sceneCc : path.resolve(projectDir, sceneCc)) : '';
        const ccJsonPaths = sources.map((f) => this.resolveCcJsonPath(f, sceneCc, projectDir));
        const mergedIncludes = this.mergeIncludeDirs(sources, includeDirs);
        const manifest: Record<string, unknown> = {
            files: sources,
            defaultCcJson: defaultCcAbs,
            ccJsonPaths,
            includeDirs: mergedIncludes,
            maxParallelProcesses,
            maxPendingAstResults,
            outputDir: path.join(findProjectRoot(__dirname), 'output', 'astFiles'),
        };
        return JSON.stringify(manifest);
    }

    private static resolveCcJsonPath(sourceFile: string, sceneCcjson: string, projectDir: string): string {
        const ext = path.extname(sourceFile).toLowerCase();
        const isHeader = getCxxHeaderFileExtensionSet().has(ext);
        let found = '';
        if (!isHeader) {
            found = findCompileCommands(sourceFile);
        }
        const pick = found || sceneCcjson;
        if (!pick) {
            return '';
        }
        return path.isAbsolute(pick) ? pick : path.resolve(projectDir, pick);
    }

    private static mergeIncludeDirs(absoluteSources: string[], base: string[]): string[] {
        const set = new Set<string>();
        for (const d of base ?? []) {
            if (d) {
                set.add(path.isAbsolute(d) ? d : path.resolve(d));
            }
        }
        for (const f of absoluteSources) {
            const r = this.resolveProjectRootForSource(f);
            if (r) {
                set.add(r);
            }
        }
        return Array.from(set);
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

    private static processAst(
        astPath: string,
        sourceFile: string,
        exitCode: number,
        logAstInfo: boolean,
    ): CxxAstNode {
        const { root } = CxxAstFlatInfo.loadAndDecode(sourceFile, astPath, exitCode, logAstInfo);
        return this.filter(sourceFile, root) as CxxAstNode;
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

}
