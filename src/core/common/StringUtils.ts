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

import { FullPosition } from '../base/Position';

const MIN_SLICED_STRING_LENGTH = 13;

/**
 * Deep copy a string to avoid sharing the original text reference from TypeScript AST nodes.
 * This ensures that model objects do not implicitly depend on AST node lifecycles.
 * Strings shorter than V8's kMinSlicedStringLength can never be sliced strings,
 * so they cannot retain a larger parent and are returned as-is.
 */
export function cloneText(text: string): string {
    if (text.length < MIN_SLICED_STRING_LENGTH) {
        return text;
    }
    return Buffer.from(text, 'utf8').toString('utf8');
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
