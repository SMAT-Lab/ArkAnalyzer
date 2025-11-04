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
import {CxxAstNode, CxxAstNodeLite} from './ArkCxxAstNode';

const deveco_c = process.env.DEVECO_C;

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'astUtils');

export type GetParentFn = {
    (isNeedInner: true): CxxAstNode;
    (isNeedInner?: false): CxxAstNodeLite;
};

export class AstUtils {
    private static currentAccess: string = 'public';

    public static parse(sourceFile: string, ccJsonPath: string | null, includeDirs: string[] | null, llvmPath: string): CxxAstNode {
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
        let includeArgs = constructParseArguments(sourceFile, ccJsonPath, includeDirs);
        let parseArguments: string[] = [sourceFile, '-o', astPath];
        parseArguments = [...parseArguments, ...includeArgs];
        this.ensureOutputDir(path.dirname(astPath));
        const sep = path.delimiter;
        const existingPath = process.env.PATH ?? '';
        // Check whether llvmPath needs to be added to PATH (avoid adding it twice)
        const shouldAppendLlvmPath = llvmPath && !existingPath.split(sep).includes(llvmPath);
        // If llvmPath needs to be appended, construct a new environment variable object; otherwise, use the default environment variables
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
        let translationUnit = JSON.parse(fs.readFileSync(astPath, 'utf-8')) as CxxAstNode;
        translationUnit = this.filter(sourceFile, translationUnit) as CxxAstNode;
        deleteFile(astPath);
        return translationUnit;
    }

    private static updateInner(sourceFile: string, firstOccurrenceOfMainFile: boolean, entry: CxxAstNode, newInner: CxxAstNode[]): void {
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

    private static filter(sourceFile: string, translationUnit: CxxAstNode):CxxAstNode {
        let newInner: CxxAstNode[] = [];
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

    private static filterChildren(cursor: CxxAstNode): CxxAstNode[] {
        let filteredChildren: CxxAstNode[] = [];
        if (!Object.prototype.hasOwnProperty.call(cursor, 'inner')) {
            return filteredChildren;
        }
        filteredChildren = cursor.inner.filter(
            (item: CxxAstNode) => !Object.prototype.hasOwnProperty.call(cursor, 'isImplicit') ||
                                           !item.isImplicit || cursor.kind === 'LambdaExpr' || item.isUsed
        );
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
        if (!Array.isArray(cursor.inner)) {
            cursor.inner = [];
        }
        cursor.inner = this.filterChildren(cursor);
        if (!Object.prototype.hasOwnProperty.call(cursor, 'name') || cursor.name === undefined) {
            cursor.name = '';
        }
        // The default access property of class is 'private',The default access property of struct is 'public'
        if (cursor.kind === 'CXXRecordDecl' && cursor.tagUsed === 'class') {
            this.currentAccess = 'private';
        } else if (cursor.kind === 'CXXRecordDecl' && cursor.tagUsed === 'struct') {
            this.currentAccess = 'public';
        }
        for (const idx in cursor.inner) {
            if (!Object.prototype.hasOwnProperty.call(cursor.inner, idx)) {
                continue;
            }
            const currentCursor = cursor.inner[idx];
            // Overloaded implementation without any usage of 'any' or type assertions
            Object.assign(currentCursor, { getParent: this.makeGetParent(cursor) });
            if (cursor.kind === 'CXXRecordDecl') {
                this.processAccess(currentCursor);
            }
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
        // Construct the regular expression; \b ensures whole-word matching
        const pattern = new RegExp(`\\b(${cppModifiers.join('|')})\\b`, 'g');
        const match = pattern.exec(code);
        if (match) {
            return match[1];
        }
        return null;
    }

    // Members in the syntax tree do not have control attributes, please process them here
    private static processAccess(cursor: CxxAstNode): void {
        // C++access control is a partition declaration that updates current information when encountering an access control symbol
        if (cursor.kind === 'CXXAccessSpecifier') {
            this.currentAccess = this.extractCppModifier(cursor.code) ?? '';
        } else {
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
                return ClangPath.LinuxPath;
            default:
                return ClangPath.Unknown;
        }
    }
}

async function deleteFile(filePath: string): Promise<void> {
    try {
        await fs.promises.unlink(filePath);
        logger.info('delete file ok:', filePath);
    } catch (err) {
        logger.warn('delete file is not ok:', filePath);
    }
}

function constructParseArguments(srcFilePath: string, ccJsonPath: string | null, includeDirs: string[] | null): string[] {
    const args: string[] = [];
    const ext = path.extname(srcFilePath).toLowerCase();
    const isHeader = ext === '.h' || ext === '.hpp';

    if (!ccJsonPath && !isHeader) {
        ccJsonPath = findCompileCommands(srcFilePath);
    }
    if (ccJsonPath) {
        args.push('-c', ccJsonPath);
    } else if (deveco_c != undefined){
        // Provide default header file search path
        args.push('-i', path.join(deveco_c, 'c++', 'v1'));
    }
    if (includeDirs && includeDirs.length > 0) {
        includeDirs.forEach(dir => {
            args.push('-i', `${dir}`);
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
            return fullPath;
        } else if (entry.isDirectory()) {
            const result = searchCompileCommandsInDir(fullPath);
            if (result) {
                return result;
            }
        }
    }
    return '';
}