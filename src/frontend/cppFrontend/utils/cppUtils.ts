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

import type {
    ClassBase,
    CxxAstNode,
    CxxAstNodePositionSource,
    CxxPosition,
} from './ArkCxxAstNode';
import {
    AstKind,
    CxxAccess,
    CxxBaseFlag,
    CxxFoldOp,
    CxxNodeFlag,
    CxxOpcode,
    CxxStorageClass,
    CxxTagUsed,
    CxxValueCategory,
} from './ArkCxxAstNode';

/** Wire id index → Clang JSON string (aligned with C++ kTagUsedTable). */
const CXX_TAG_USED_CLANG: readonly string[] = ['', 'class', 'struct', 'union', 'enum'];

/** Wire id index → Clang JSON string (aligned with C++ kStorageClassTable). */
const CXX_STORAGE_CLASS_CLANG: readonly string[] = ['', 'static', 'extern'];

/** Wire id index → Clang JSON string (aligned with C++ kAccessTable). */
const CXX_ACCESS_CLANG: readonly string[] = ['', 'public', 'private', 'protected'];

/** Wire id index → Clang JSON string (aligned with C++ kValueCategoryTable). */
const CXX_VALUE_CATEGORY_CLANG: readonly string[] = ['', 'prvalue', 'lvalue', 'xvalue'];

/** Wire id index → Clang JSON string (aligned with C++ kFoldOpTable). */
const CXX_FOLD_OP_CLANG: readonly string[] = ['', ' ', '|', '&', '^'];

/** Wire id index → Clang JSON string (aligned with C++ kOpcodeTable). */
const CXX_OPCODE_CLANG: readonly string[] = [
    '',
    '=',
    '+',
    '-',
    '*',
    '/',
    '%',
    '<<',
    '>>',
    '&',
    '|',
    '^',
    '&&',
    '||',
    '<',
    '<=',
    '>',
    '>=',
    '==',
    '!=',
    '++',
    '--',
    '+=',
    '-=',
    '*=',
    '/=',
    '%=',
    '<<=',
    '>>=',
    '&=',
    '|=',
    '^=',
    ',',
    '!',
    '~',
];

/** C/C++ implementation file extensions (translation units). */
const CXX_IMPLEMENTATION_EXTENSIONS: readonly string[] = ['.c', '.cc', '.cpp', '.cxx'];

/** C/C++ header extensions. */
const CXX_HEADER_EXTENSIONS: readonly string[] = ['.h', '.hh', '.hpp'];

const CXX_IMPLEMENTATION_EXTENSION_SET: ReadonlySet<string> = new Set(CXX_IMPLEMENTATION_EXTENSIONS);
const CXX_HEADER_EXTENSION_SET: ReadonlySet<string> = new Set(CXX_HEADER_EXTENSIONS);
const CXX_SOURCE_EXTENSION_SET: ReadonlySet<string> = new Set([
    ...CXX_IMPLEMENTATION_EXTENSIONS,
    ...CXX_HEADER_EXTENSIONS,
]);

/**
 * Returns extensions for C/C++ implementation and header files used across the C++ frontend
 * (scanning, SceneConfig defaults, language detection).
 */
export function getCxxSourceFileExtensions(): readonly string[] {
    return [...CXX_IMPLEMENTATION_EXTENSIONS, ...CXX_HEADER_EXTENSIONS];
}

/** Returns a read-only set for fast C/C++ source/header extension checks. */
export function getCxxSourceFileExtensionSet(): ReadonlySet<string> {
    return CXX_SOURCE_EXTENSION_SET;
}

/** Returns a read-only set for fast C/C++ header extension checks. */
export function getCxxHeaderFileExtensionSet(): ReadonlySet<string> {
    return CXX_HEADER_EXTENSION_SET;
}

/**
 * Returns extensions for C/C++ translation units only (no headers), e.g. for IR passes that
 * walk implementation files.
 */
export function getCxxImplementationFileExtensions(): readonly string[] {
    return [...CXX_IMPLEMENTATION_EXTENSIONS];
}

/** Returns a read-only set for fast C/C++ implementation-file checks. */
export function getCxxImplementationFileExtensionSet(): ReadonlySet<string> {
    return CXX_IMPLEMENTATION_EXTENSION_SET;
}

/** True when `node.nodeFlags` contains all bits in `flag`. */
export function hasNodeFlag(node: CxxAstNode, flag: CxxNodeFlag): boolean {
    return ((node.nodeFlags ?? 0) & flag) === flag;
}

/** True when `base.baseFlags` contains all bits in `flag`. */
export function hasBaseFlag(base: ClassBase, flag: CxxBaseFlag): boolean {
    return ((base.baseFlags ?? 0) & flag) === flag;
}

export function getNodeAt(node: CxxAstNode, index: number): CxxAstNode | undefined {
    if (!node?.inner?.length || index < 0 || index >= node.inner.length) {
        return undefined;
    }
    return node.inner[index];
}

/** Get the starting line and column numbers of the ast node, Default LineColPosition is (0, 0). */
export function getNodeStartLineAndCol(node: CxxAstNodePositionSource): CxxPosition {
    if (node.loc?.line && node.loc?.col) {
        return { line: node.loc.line, col: node.loc.col };
    }
    return node.range?.begin ?? { line: 0, col: 0 };
}

/** Reverse-map numeric enum id to Clang name string (logs / legacy APIs). */
export function astKindToString(kind: AstKind): string {
    const name = AstKind[kind];
    return typeof name === 'string' ? name : 'Unknown';
}

export function cxxTagUsedToString(tag: CxxTagUsed): string {
    return CXX_TAG_USED_CLANG[tag] ?? '';
}

export function cxxStorageClassToString(sc: CxxStorageClass): string {
    return CXX_STORAGE_CLASS_CLANG[sc] ?? '';
}

export function cxxAccessToString(access: CxxAccess): string {
    return CXX_ACCESS_CLANG[access] ?? '';
}

export function cxxValueCategoryToString(vc: CxxValueCategory): string {
    return CXX_VALUE_CATEGORY_CLANG[vc] ?? '';
}

export function cxxFoldOpToString(op: CxxFoldOp): string {
    return CXX_FOLD_OP_CLANG[op] ?? '';
}

export function cxxOpcodeToString(op: CxxOpcode): string {
    return CXX_OPCODE_CLANG[op] ?? '';
}
