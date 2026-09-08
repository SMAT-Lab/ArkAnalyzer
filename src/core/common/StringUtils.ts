/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

import { FullPosition, LineColPosition } from '../base/Position';

/**
 * Deep copy a string to avoid sharing the original text reference from TypeScript AST nodes.
 * This ensures that model objects do not implicitly depend on AST node lifecycles.
 */
export function cloneText(text: string): string {
    return text.length > 0 ? Buffer.from(text, 'utf8').toString('utf8') : '';
}

/**
 * Builds an array of absolute offsets of each line start in `sourceText`.
 * Index 0 is always 0. Handles `\n` and `\r\n` the same way as position extraction.
 * @param maxLineCount - When set, stop once this many line starts are collected
 *                       (used by one-shot extract to avoid scanning the whole file).
 */
export function buildLineStarts(sourceText: string, maxLineCount?: number): number[] {
    const lineStarts: number[] = [0];
    const len = sourceText.length;
    for (let i = 0; i < len && (maxLineCount === undefined || lineStarts.length < maxLineCount); i++) {
        if (sourceText[i] === '\n') {
            lineStarts.push(i + 1);
        } else if (sourceText[i] === '\r' && i + 1 < len && sourceText[i + 1] === '\n') {
            lineStarts.push(i + 2);
            i++;
        }
    }
    return lineStarts;
}

/**
 * Extracts source text from the given source code using the specified full position.
 * @param sourceText - The source code text, or undefined if not available.
 * @param position - The full position (start/end line/col) specifying the range to extract.
 * @param lineStarts - Optional precomputed line-start offsets (e.g. from {@link buildLineStarts}
 *                     or `ArkFile.getLineStarts()`). When omitted, builds offsets only up to `endLine`.
 * @returns The extracted source text, or undefined if:
 *          - sourceText is undefined or empty
 *          - position is undefined or FullPosition.DEFAULT
 *          - position has invalid line/col values (<=0)
 *          - position exceeds the source text boundaries
 */
export function extractSourceTextByFullPosition(
    sourceText: string | undefined,
    position: FullPosition | undefined,
    lineStarts?: readonly number[]
): string | undefined {
    if (!sourceText || !position || position === FullPosition.DEFAULT) {
        return undefined;
    }

    const startLine = position.getFirstLine();
    const endLine = position.getLastLine();
    const startCol = position.getFirstCol();
    const endCol = position.getLastCol();
    if (startLine <= 0 || startCol <= 0 || endLine <= 0 || endCol <= 0) {
        return undefined;
    }

    const len = sourceText.length;
    const starts = lineStarts ?? buildLineStarts(sourceText, endLine);

    // Check if there are enough lines
    if (startLine > starts.length || endLine > starts.length) {
        return undefined;
    }

    const startIdx = starts[startLine - 1] + startCol - 1;
    const endIdx = starts[endLine - 1] + endCol - 1;

    if (startIdx >= len || endIdx > len || startIdx >= endIdx) {
        return undefined;
    }

    return sourceText.slice(startIdx, endIdx);
}

export function isPositiveFullPosition(pos: FullPosition | null): pos is FullPosition {
    return pos !== null && pos.getFirstLine() > 0 && pos.getFirstCol() > 0 &&
        pos.getLastLine() > 0 && pos.getLastCol() > 0;
}

/**
 * Finds the start offset of callee identifier `name` that is followed (after optional
 * grouping `)` and nested generics) by a call `(`.
 * Fast path: plain `name(` with no whitespace/generics between name and `(`.
 */
export function matchCallOpenParen(text: string | undefined, name: string): number | null {
    if (!text || !name || text.indexOf(name) === -1) {
        return null;
    }
    // Common case: `foo(` — avoid regex and generic/grouping scan.
    const plainCall = name + '(';
    let from = 0;
    while (from < text.length) {
        const idx = text.indexOf(plainCall, from);
        if (idx === -1) {
            break;
        }
        if (idx === 0 || !/[A-Za-z0-9_$]/.test(text[idx - 1]!)) {
            return idx;
        }
        from = idx + 1;
    }
    const escaped = name.replace(/\$/g, '\\$');
    const ident = new RegExp(`(?<![A-Za-z0-9_$])${escaped}(?![A-Za-z0-9_$])`, 'g');
    let match = ident.exec(text);
    while (match) {
        if (hasCallOpenParenAfter(text, match.index + match[0].length)) {
            return match.index;
        }
        match = ident.exec(text);
    }
    return null;
}

function hasCallOpenParenAfter(text: string, start: number): boolean {
    let i = skipWhitespace(text, start);
    while (i < text.length) {
        if (text[i] === '<') {
            const afterAngles = skipBalancedAngleBrackets(text, i);
            if (afterAngles < 0) {
                return false;
            }
            i = skipWhitespace(text, afterAngles);
            continue;
        }
        if (text[i] === ')') {
            i = skipWhitespace(text, i + 1);
            continue;
        }
        return text[i] === '(';
    }
    return false;
}

function skipWhitespace(text: string, index: number): number {
    while (index < text.length && /\s/.test(text[index])) {
        index++;
    }
    return index;
}

function skipBalancedAngleBrackets(text: string, start: number): number {
    let depth = 0;
    for (let i = start; i < text.length; i++) {
        const skipped = skipNonAngleToken(text, i);
        if (skipped !== i) {
            if (skipped < 0) {
                return -1;
            }
            i = skipped - 1;
            continue;
        }
        if (text[i] === '<') {
            depth++;
        } else if (text[i] === '>') {
            depth--;
            if (depth === 0) {
                return i + 1;
            }
        }
    }
    return -1;
}

function skipNonAngleToken(text: string, index: number): number {
    const ch = text[index];
    if (ch === '"' || ch === "'") {
        return skipQuoted(text, index);
    }
    if (ch === '`') {
        return skipTemplate(text, index);
    }
    if (ch === '/' && text[index + 1] === '*') {
        return skipBlockComment(text, index);
    }
    if (ch === '/' && text[index + 1] === '/') {
        return skipLineComment(text, index);
    }
    if (ch === '=' && text[index + 1] === '>') {
        return index + 2;
    }
    return index;
}

function skipQuoted(text: string, start: number): number {
    const quote = text[start];
    for (let i = start + 1; i < text.length; i++) {
        if (text[i] === '\\') {
            i++;
            continue;
        }
        if (text[i] === quote) {
            return i + 1;
        }
    }
    return -1;
}

function skipBlockComment(text: string, start: number): number {
    const end = text.indexOf('*/', start + 2);
    return end === -1 ? -1 : end + 2;
}

function skipLineComment(text: string, start: number): number {
    const newline = text.indexOf('\n', start);
    return newline === -1 ? text.length : newline + 1;
}

function skipTemplate(text: string, start: number): number {
    for (let i = start + 1; i < text.length; i++) {
        if (text[i] === '\\') {
            i++;
            continue;
        }
        if (text[i] === '`') {
            return i + 1;
        }
        if (text[i] === '$' && text[i + 1] === '{') {
            const end = skipTemplateInterpolation(text, i + 2);
            if (end < 0) {
                return -1;
            }
            i = end - 1;
        }
    }
    return -1;
}

function skipTemplateInterpolation(text: string, start: number): number {
    let depth = 1;
    for (let i = start; i < text.length; i++) {
        const skipped = skipNonAngleToken(text, i);
        if (skipped !== i) {
            if (skipped < 0) {
                return -1;
            }
            i = skipped - 1;
            continue;
        }
        if (text[i] === '{') {
            depth++;
        } else if (text[i] === '}') {
            depth--;
            if (depth === 0) {
                return i + 1;
            }
        }
    }
    return -1;
}

/**
 * Converts an offset within `text` to an absolute line/col, given the absolute origin of `text`.
 */
export function offsetToAbsoluteLineCol(text: string, offset: number, originLine: number, originCol: number): LineColPosition {
    const before = text.slice(0, offset);
    const relLine = before.split('\n').length - 1;
    const lastNl = before.lastIndexOf('\n');
    const colInText = lastNl === -1 ? offset + 1 : offset - lastNl;
    const line = originLine + relLine;
    const col = relLine === 0 ? originCol + (colInText - 1) : colInText;
    return new LineColPosition(line, col);
}