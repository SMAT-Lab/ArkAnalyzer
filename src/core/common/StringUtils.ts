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

/**
 * Deep copy a string to avoid sharing the original text reference from TypeScript AST nodes.
 * This ensures that model objects do not implicitly depend on AST node lifecycles.
 */
export function cloneText(text: string): string {
    return text.length > 0 ? Buffer.from(text, 'utf8').toString('utf8') : '';
}

/**
 * Extracts source text from the given source code using the specified full position.
 * @param sourceText - The source code text, or undefined if not available.
 * @param position - The full position (start/end line/col) specifying the range to extract.
 * @returns The extracted source text, or undefined if:
 *          - sourceText is undefined or empty
 *          - position is undefined or FullPosition.DEFAULT
 *          - position has invalid line/col values (<=0)
 *          - position exceeds the source text boundaries
 */
export function extractSourceTextByFullPosition(sourceText: string | undefined, position: FullPosition | undefined): string | undefined {
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
    const lineStarts: number[] = [0];
    // Only iterate up to endLine to avoid traversing the entire file
    for (let i = 0; i < len && lineStarts.length < endLine; i++) {
        if (sourceText[i] === '\n') {
            lineStarts.push(i + 1);
        } else if (sourceText[i] === '\r' && i + 1 < len && sourceText[i + 1] === '\n') {
            lineStarts.push(i + 2);
            i++;
        }
    }

    // Check if there are enough lines
    if (startLine > lineStarts.length || endLine > lineStarts.length) {
        return undefined;
    }

    const startIdx = lineStarts[startLine - 1] + startCol - 1;
    const endIdx = lineStarts[endLine - 1] + endCol - 1;

    if (startIdx >= len || endIdx > len || startIdx >= endIdx) {
        return undefined;
    }

    return sourceText.slice(startIdx, endIdx);
}