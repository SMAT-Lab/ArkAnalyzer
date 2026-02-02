/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ClangPath } from './const';
import { astKind, CxxAstNode, CxxAstNodeLite } from './ArkCxxAstNode';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'astUtils');

export type GetParentFn = {
    (isNeedInner: true): CxxAstNode;
    (isNeedInner?: false): CxxAstNodeLite;
};

export class AstUtils {
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

        const clangPath: string = this.getPlatformClang().toString();
        logger.info(`[Debug] Clang Path: ${clangPath}`);

        // 1. Prepare the path and directory
        const rawAstPath = this.getAstOutputPath(sourceFile, cppAstPath);
        const astPath = path.resolve(rawAstPath);
        this.ensureOutputDir(path.dirname(astPath));
        const workingDir = this.getWorkingDir(ccJsonPath);

        // 2. Prepare the Include path (automatically inject source code root directory)
        const finalIncludeDirs = includeDirs ? [...includeDirs] : [];
        const projectRoot = this.resolveProjectRoot(sourceFile);
        if (projectRoot && !finalIncludeDirs.includes(projectRoot)) {
            finalIncludeDirs.push(projectRoot);
        }

        // 3. Build parameters and environment
        let parseArguments: string[] = [sourceFile, '-o', astPath];
        parseArguments = [...parseArguments, ...constructParseArguments(sourceFile, ccJsonPath, finalIncludeDirs)];

        const sep = path.delimiter;
        const existingPath = process.env.PATH ?? '';
        const shouldAppend = llvmPath && !existingPath.split(sep).includes(llvmPath);
        const envVars = shouldAppend ? { ...process.env, PATH: existingPath + sep + llvmPath } : undefined;

        // 4. Execute Clang
        const status = this.runClang(clangPath, parseArguments, envVars, workingDir);

        // 5. Processing result
        return this.processAstFile(astPath, sourceFile, status);
    }

    /**
     * Auxiliary method: Try to find and return the root directory of src/main/cpp
     */
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

    /**
     * Auxiliary method: Determine Work Catalog (CWD)
     */
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

    /**
     * Auxiliary method: Execute Clang process and print debugging logs
     */
    private static runClang(clangPath: string, args: string[], env: NodeJS.ProcessEnv | undefined, cwd: string): number {
        const fullCmd = `"${clangPath}" ${args.map(a => a.includes(' ') ? `"${a}"` : a).join(' ')}`;
        logger.info('================================================================');
        logger.info(`[Debug] CWD: ${cwd}`);
        logger.info(`[Debug] CMD: ${fullCmd}`);
        logger.info('================================================================');

        const result = spawnSync(clangPath, args, {
            stdio: ['inherit', 'pipe'],
            encoding: 'utf-8',
            env: env,
            cwd: cwd
        });

        if (result.status !== 0) {
            logger.error(`[Debug] Clang exited with code ${result.status}`);
            logger.error(`[Debug] Stderr: ${result.stderr}`);
            return result.status ?? -1;
        } else {
            logger.info('[Debug] Clang finished successfully.');
            return 0;
        }
    }

    /**
     * Auxiliary method: Read and parse the generated AST JSON file
     */
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
            // [Debug] If you need to debug file generation, you can comment out the following line
            this.deleteFileSync(astPath);
        }
    }

    private static createEmptyNode(): CxxAstNode {
        return { kind: '', name: '', code: '', type: { qualType: '' }, inner: [] };
    }

    private static updateInner(sourceFile: string, entry: CxxAstNode, newInner: CxxAstNode[]): void {
        // isImplicit=true indicates that the node must exist under the rules of the C/C++ language but is not explicitly
        // written in the source code, so it needs to be filtered out.
        if (entry.isImplicit) {
            return;
        }
        let loc = entry.loc;
        if (!loc) {
            logger.warn('Node skipped due to missing "locFile", kind of node: ', entry.kind);
            return;
        }
        newInner.push(entry);
    }

    private static filter(sourceFile: string, translationUnit: CxxAstNode):CxxAstNode {
        let newInner: CxxAstNode[] = [];
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
        let filteredChildren: CxxAstNode[] = [];
        if (!cursor.inner) {
            return filteredChildren;
        }
        filteredChildren = cursor.inner.filter((item: CxxAstNode) => !item.isImplicit);
        return filteredChildren;
    }

// Factory: generates a getParent implementation with overload signatures for a given cursor
    private static makeGetParent(cursor: CxxAstNode):GetParentFn {
        function getParent(isNeedInner: true): CxxAstNode;
        function getParent(isNeedInner?: false): CxxAstNodeLite;
        function getParent(isNeedInner?: boolean): CxxAstNode | CxxAstNodeLite {
            if (isNeedInner) {
                // Return the "full parent node": shallow copy, keeping the inner property
                // Note: This will also copy getParent itself (usually not an issue)
                return { ...cursor };
            }
            // Return the "lightweight snapshot": shallow copy without inner, keeping other fields
            const { inner, ...rest } = cursor;
            return rest; // Inferred as CxxAstNodeLite
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

        // handle modifiers of lambda function
        if (cursor.kind === 'LambdaExpr') {
            this.processAccess(cursor);
        }

        // The default access property of class is 'private',The default access property of struct is 'public'
        if (cursor.kind === astKind.CXXRecordDecl && cursor.tagUsed === 'class') {
            this.currentAccess = 'private';
        } else if (cursor.kind === astKind.CXXRecordDecl && cursor.tagUsed === 'struct') {
            this.currentAccess = 'public';
        } else {
            this.currentAccess = '';
        }

        for (const currentCursor of cursor.inner) {
            // Overloaded implementation without any usage of 'any' or type assertions
            Object.assign(currentCursor, { getParent: this.makeGetParent(cursor) });
            if (cursor.kind === astKind.CXXRecordDecl || cursor.kind === astKind.CXXMethodDecl || cursor.kind === astKind.FunctionDecl) {
                this.processAccess(currentCursor);
            }
            this.fullInfo(currentCursor);
        }
    }


    static extractAllCppModifiers(code: string): string[] {
        if (!code) {
            return [];
        }
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
            'volatile'
        ];
        // Construct the regular expression; \b ensures whole-word matching
        const pattern = new RegExp(`\\b(${cppModifiers.join('|')})\\b`, 'g');
        const matches = code.match(pattern);
        return matches ? matches : [];
    }

    // Members in the syntax tree do not have control attributes, please process them here
    private static processAccess(cursor: CxxAstNode): void {
        cursor.modifiers = [];
        // C++access control is a partition declaration that updates current information when encountering an access control symbol
        if (cursor.kind === 'AccessSpecDecl') {
            this.currentAccess = cursor.access ?? this.extractAllCppModifiers(cursor.code)[0] ?? '';
        } else {
            const extractedCode = this.getCodeForExtractModifiers(cursor);
            let codeModifier = this.extractAllCppModifiers(extractedCode);
            if (this.currentAccess !== '') {
                cursor.modifiers.push(this.currentAccess);
            }
            if (codeModifier !== null) {
                cursor.modifiers.push(...codeModifier);
            }
        }
    }

    private static getCodeForExtractModifiers(cursor: CxxAstNode): string {
        let extractedCode = cursor.code;
        if (!['CXXConstructorDecl', 'CXXDestructorDecl', 'CXXMethodDecl', 'FriendDecl', 'FunctionDecl', 'FunctionTemplateDecl'].includes(cursor.kind)) {
            return extractedCode;
        }
        const bodyNode = cursor.inner.filter(inn => inn.kind === 'CompoundStmt');
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
        return path.join(ClangPath.protectRoot, 'src', 'cpp_frontend', 'ast', 'out', fileName);
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
            case 'darwin':
                return ClangPath.LinuxPath;
            default:
                return ClangPath.Unknown;
        }
    }
}

function constructParseArguments(srcFilePath: string, ccJsonPath: string | null, includeDirs: string[] | null): string[] {
    const args: string[] = [];
    if (ccJsonPath) {
        args.push('-p', ccJsonPath);
    }
    if (includeDirs && includeDirs.length > 0) {
        includeDirs.forEach(dir => {
            args.push('--extra-arg-before=-I' + `${dir}`);
        });
    }
    return args;
}

/**
 * Find the absolute path of compile_commands.json starting from a file path.
 * It goes upward to find a ".cxx" directory, and then recursively searches
 * inside it for compile_commands.json.
 * @param filePath Absolute path of the input file
 * @returns Absolute path of compile_commands.json if found, otherwise empty string
 */
export function findCompileCommands(filePath: string): string {
    let dir = path.dirname(filePath);

    while (true) {
        const cxxDir = path.join(dir, '.cxx');
        if (fs.existsSync(cxxDir) && fs.statSync(cxxDir).isDirectory()) {
            const result = searchCompileCommandsInDir(cxxDir);
            if (result) {
                return result;
            }
        }

        const parent = path.dirname(dir);
        if (parent === dir) {
            break; // reached the root directory
        }
        dir = parent;
    }

    return '';
}

/**
 * Recursively search for compile_commands.json inside a directory
 * @param dir Directory path to start searching
 * @returns Absolute path of compile_commands.json if found, otherwise empty string
 */
function searchCompileCommandsInDir(dir: string): string {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name === 'compile_commands.json') {
            return dir;
        } else if (entry.isDirectory()) {
            const result = searchCompileCommandsInDir(fullPath);
            if (result) {
                return result;
            }
        }
    }
    return '';
}