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

import {
    AstKind,
    CxxAccess,
    CxxTagUsed,
    type CppAstError,
    type CppAstParams,
    type CppAstResult,
    type CppAstSceneContext,
    type CxxAstNode,
    type CxxAstNodeLite,
    type CxxTranslationUnit,
} from '../lib/utils/ArkCxxAstNode';

export type { CppAstError, CppAstParams, CppAstResult, CppAstSceneContext } from '../lib/utils/ArkCxxAstNode';
import { CxxAstFlatInfo } from './CxxAstFlatInfo';
import { callCppAstParser } from './napi/napiApi';
import { getCxxHeaderFileExtensionSet } from '../lib/utils/cppUtils';
import { cxxAccessToModifierFlag, findCompileCommands, findProjectRoot } from './astUtils';

const log = {
    info: (message: string): void => {
        console.log(message);
    },
    warn: (...args: unknown[]): void => {
        console.warn(...args);
    },
    error: (message: string): void => {
        console.error(message);
    },
};

interface AstStreamRecord {
    index: number;
    exitCode: number;
    /** Absolute path to the per-TU AST file for this translation unit. */
    astPath: string;
}

export type GetParentFn = {
    (isNeedInner: true): CxxAstNode;
    (isNeedInner?: false): CxxAstNodeLite;
};

export class AstParser {
    private static currentAccess: CxxAccess = CxxAccess.Unknown;

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
            log.error(CxxAstFlatInfo.formatError(sourceFile, err));
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
        log.info(
            `[HEAP] processed=${processed}/${total} ` +
                `heapUsed=${(m.heapUsed / 1024 / 1024).toFixed(1)}MB ` +
                `rss=${(m.rss / 1024 / 1024).toFixed(1)}MB ` +
                `external=${(m.external / 1024 / 1024).toFixed(1)}MB`,
        );
    }

    private static buildCppAstManifest(
        scene: CppAstSceneContext,
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
                    log.info(`[Debug] Found Source Root: ${absRoot}`);
                    return absRoot;
                }
                currentDir = path.dirname(currentDir);
            }
        } catch (e) {
            log.error(`[Debug] Error finding source root: ${e}`);
        }
        return null;
    }

    private static processAst(
        astPath: string,
        sourceFile: string,
        exitCode: number,
        logAstInfo: boolean,
    ): CxxTranslationUnit {
        const { root } = CxxAstFlatInfo.loadAndDecode(sourceFile, astPath, exitCode, {
            logAstInfo,
            onInfo: logAstInfo ? (message: string) => log.info(message) : undefined,
        });
        return this.filter(sourceFile, root as CxxTranslationUnit);
    }

    private static updateInner(sourceFile: string, entry: CxxAstNode, newInner: CxxAstNode[]): void {
        const loc = entry.loc;
        if (!loc) {
            log.warn('Node skipped due to missing "locFile", kind of node: ', entry.kind);
            return;
        }
        newInner.push(entry);
    }

    private static filter(sourceFile: string, translationUnit: CxxTranslationUnit): CxxTranslationUnit {
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
        if (cursor.name === undefined) {
            cursor.name = '';
        }

        if (cursor.kind === AstKind.LambdaExpr) {
            this.processAccess(cursor);
        }

        if (cursor.kind === AstKind.CXXRecordDecl && cursor.tagUsed === CxxTagUsed.Class) {
            this.currentAccess = CxxAccess.Private;
        } else if (cursor.kind === AstKind.CXXRecordDecl && cursor.tagUsed === CxxTagUsed.Struct) {
            this.currentAccess = CxxAccess.Public;
        } else {
            this.currentAccess = CxxAccess.Unknown;
        }

        for (const currentCursor of cursor.inner) {
            Object.assign(currentCursor, { getParent: this.makeGetParent(cursor) });
            if (
                cursor.kind === AstKind.CXXRecordDecl ||
                cursor.kind === AstKind.CXXMethodDecl ||
                cursor.kind === AstKind.FunctionDecl
            ) {
                this.processAccess(currentCursor);
            }
            this.fullInfo(currentCursor);
        }
    }

    private static processAccess(cursor: CxxAstNode): void {
        const flags = cursor.modifierFlags ?? 0;
        if (cursor.kind === AstKind.AccessSpecDecl) {
            this.currentAccess = cursor.access ?? CxxAccess.Unknown;
            return;
        }
        cursor.modifierFlags = flags;
        if (this.currentAccess !== CxxAccess.Unknown) {
            cursor.modifierFlags |= cxxAccessToModifierFlag(this.currentAccess);
        }
    }
}
