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

import * as fs from 'fs';
import * as path from 'path';

import {
    AstKind,
    AST_KIND_COUNT,
    CxxAccess,
    CXX_ACCESS_COUNT,
    CxxFoldOp,
    CXX_FOLD_OP_COUNT,
    CxxOpcode,
    CXX_OPCODE_COUNT,
    CxxStorageClass,
    CXX_STORAGE_CLASS_COUNT,
    CxxTagUsed,
    CXX_TAG_USED_COUNT,
    CxxValueCategory,
    CXX_VALUE_CATEGORY_COUNT,
} from '../lib/utils/ArkCxxAstNode';

// Module level cache: Sub project root directory (including .cxx directory) -> compile_commands.json absolute path
const ccJsonCache: Map<string, string> = new Map();

export function findProjectRoot(startDir: string = __dirname): string {
    let dir = path.resolve(startDir);
    while (true) {
        if (fs.existsSync(path.join(dir, 'package.json'))) {
            return dir;
        }
        const parentDir = path.dirname(dir);
        if (parentDir === dir) {
            return dir;
        }
        dir = parentDir;
    }
}

/**
 * Resolved path to the astJsonDumper N-API addon ({@code astJsonDumper.node} under dumper/ or lib/ast/).
 */
export function getAstJsonDumperNodePath(): string {
    const projectRoot = findProjectRoot(__dirname);
    const platformArch = `${process.platform}-${process.arch}`;
    const addonPackageName = `@arkanalyzer/ast-addon-${platformArch}`;
    const candidates = [
        path.join(__dirname, '..', 'dumper', 'astJsonDumper.node'),
        path.join(projectRoot, 'packages', 'cxx-ast-runtime', 'dumper', 'astJsonDumper.node'),
        path.join(projectRoot, 'node_modules', addonPackageName, 'runtime', 'astJsonDumper.node'),
        path.join(projectRoot, 'lib', 'ast', 'astJsonDumper.node'),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return candidates[0];
}

/** True when {@link getAstJsonDumperNodePath} exists on disk. */
export function isAstJsonDumperAvailable(): boolean {
    return fs.existsSync(getAstJsonDumperNodePath());
}

/** True when flatbuffers and astJsonDumper.node are both usable (arkanalyzer C++ frontend gate). */
export function isCppEnvironmentReady(): boolean {
    try {
        require.resolve('flatbuffers');
    } catch {
        return false;
    }
    return isAstJsonDumperAvailable();
}

/** Project-root anchor for C++ AST output paths (legacy name: historically held Clang binary paths). */
export class ClangPath {
    public static protectRoot = findProjectRoot(__dirname);
}

export function extractAllCppModifiers(code: string): string[] {
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
    const pattern = new RegExp(`\\b(${cppModifiers.join('|')})\\b`, 'g');
    const matches = code.match(pattern);
    return matches ? matches : [];
}

/**
 * Find the absolute path of compile_commands.json starting from a file path.
 * Strict logic: only traverses upward (ancestors) to find a ".cxx" directory.
 */
export function findCompileCommands(filePath: string): string {
    for (const [projectRoot, jsonPath] of ccJsonCache) {
        if (filePath === projectRoot || filePath.startsWith(projectRoot + path.sep)) {
            return jsonPath;
        }
    }

    let currentDir = path.dirname(filePath);
    while (true) {
        const cxxDir = path.join(currentDir, '.cxx');

        if (fs.existsSync(cxxDir) && fs.statSync(cxxDir).isDirectory()) {
            const result = searchCompileCommandsInDir(cxxDir);
            if (result) {
                ccJsonCache.set(currentDir, result);
                return result;
            }
            return '';
        }

        const parent = path.dirname(currentDir);
        if (parent === currentDir) {
            break;
        }
        currentDir = parent;
    }

    return '';
}

/**
 * Recursively search for compile_commands.json inside .cxx directory.
 */
function searchCompileCommandsInDir(dir: string): string {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return '';
    }

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name === 'compile_commands.json') {
            return dir;
        }
        if (entry.isDirectory()) {
            const result = searchCompileCommandsInDir(fullPath);
            if (result) {
                return result;
            }
        }
    }
    return '';
}

/** Wire uint16 kind id → AstKind (C++ already emits numeric ids on .ast.flat). */
export function wireKindToAstKind(wireId: number): AstKind {
    if (!Number.isInteger(wireId) || wireId <= 0 || wireId >= AST_KIND_COUNT) {
        return AstKind.Unknown;
    }
    return wireId as AstKind;
}

/** Clang kind name for logs / legacy string APIs (numeric enum reverse map). */
export function astKindToString(kind: AstKind): string {
    const name = AstKind[kind];
    return typeof name === 'string' ? name : 'Unknown';
}

/** Wire uint8 tagUsed id → CxxTagUsed. */
export function wireTagUsedToEnum(wireId: number): CxxTagUsed {
    if (!Number.isInteger(wireId) || wireId <= 0 || wireId >= CXX_TAG_USED_COUNT) {
        return CxxTagUsed.Unknown;
    }
    return wireId as CxxTagUsed;
}

/** Wire uint8 storageClass id → CxxStorageClass. */
export function wireStorageClassToEnum(wireId: number): CxxStorageClass {
    if (!Number.isInteger(wireId) || wireId <= 0 || wireId >= CXX_STORAGE_CLASS_COUNT) {
        return CxxStorageClass.Unknown;
    }
    return wireId as CxxStorageClass;
}

/** Wire uint8 access id → CxxAccess. */
export function wireAccessToEnum(wireId: number): CxxAccess {
    if (!Number.isInteger(wireId) || wireId <= 0 || wireId >= CXX_ACCESS_COUNT) {
        return CxxAccess.Unknown;
    }
    return wireId as CxxAccess;
}

/** Map wire/AST access specifier to ModifierType bitmask (PRIVATE / PROTECTED / PUBLIC). */
export function cxxAccessToModifierFlag(access: CxxAccess): number {
    switch (access) {
        case CxxAccess.Private:
            return 1;
        case CxxAccess.Protected:
            return 1 << 1;
        case CxxAccess.Public:
            return 1 << 2;
        default:
            return 0;
    }
}

/** Wire uint8 valueCategory id → CxxValueCategory. */
export function wireValueCategoryToEnum(wireId: number): CxxValueCategory {
    if (!Number.isInteger(wireId) || wireId <= 0 || wireId >= CXX_VALUE_CATEGORY_COUNT) {
        return CxxValueCategory.Unknown;
    }
    return wireId as CxxValueCategory;
}

/** Wire uint8 fold op id → CxxFoldOp. */
export function wireFoldOpToEnum(wireId: number): CxxFoldOp {
    if (!Number.isInteger(wireId) || wireId <= 0 || wireId >= CXX_FOLD_OP_COUNT) {
        return CxxFoldOp.Unknown;
    }
    return wireId as CxxFoldOp;
}

/** Wire uint8 opcode id → CxxOpcode. */
export function wireOpcodeToEnum(wireId: number): CxxOpcode {
    if (!Number.isInteger(wireId) || wireId <= 0 || wireId >= CXX_OPCODE_COUNT) {
        return CxxOpcode.Unknown;
    }
    return wireId as CxxOpcode;
}
