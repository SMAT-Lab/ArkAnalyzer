/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

import ts from 'ohos-typescript';

import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import type { CxxAstNodePositionSource } from '../../frontend/cppFrontend/utils/ArkCxxAstNode';
import { getNodeStartLineAndCol } from '../../frontend/cppFrontend/utils/cppUtils';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'Position');

const LOW_BITS_SIZE = 16;
const LOW_BITS_MASK = 0xffff;
const HIGH_BITS_MASK = 0xffff0000;
const MIN_NUMBER = 0;
const MAX_NUMBER = 0xffff;
export const INVALID_LINE = -1;

export type LineCol = number;

export function setLine(lineCol: LineCol, lineNo: number): LineCol {
    if (lineNo < MIN_NUMBER) {
        lineNo = MIN_NUMBER;
    }
    if (lineNo > MAX_NUMBER) {
        logger.warn(`setLine overflow ${lineNo}`);
        lineNo = MAX_NUMBER;
    }

    return (lineNo << LOW_BITS_SIZE) | (lineCol & LOW_BITS_MASK);
}

export function setCol(lineCol: LineCol, colNo: number): LineCol {
    if (colNo < MIN_NUMBER) {
        colNo = MIN_NUMBER;
    }
    if (colNo > MAX_NUMBER) {
        logger.warn(`setCol overflow ${colNo}`);
        colNo = MAX_NUMBER;
    }

    return (lineCol & HIGH_BITS_MASK) | colNo;
}

export function setLineCol(lineNo: number, colNo: number): LineCol {
    let lineCol: LineCol = 0;
    lineCol = setLine(lineCol, lineNo);
    lineCol = setCol(lineCol, colNo);
    return lineCol;
}

function lineIndexOfPosition(lineStarts: readonly number[], position: number): number {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >>> 1;
        if (lineStarts[mid] <= position) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    return lo;
}

export function getLineNo(lineCol: LineCol): number {
    let line = lineCol >>> LOW_BITS_SIZE;
    if (line === MIN_NUMBER) {
        return INVALID_LINE;
    }
    return line;
}

export function getColNo(lineCol: LineCol): number {
    let col = lineCol & LOW_BITS_MASK;
    if (col === MIN_NUMBER) {
        return INVALID_LINE;
    }
    return col;
}

/**
 * @category core/base
 */
export class LineColPosition {
    private readonly lineCol: LineCol;

    public static readonly DEFAULT: LineColPosition = new LineColPosition(INVALID_LINE, INVALID_LINE);

    constructor(lineNo: number, colNo: number) {
        this.lineCol = setLineCol(lineNo, colNo);
    }

    public getLineNo(): number {
        return getLineNo(this.lineCol);
    }

    public getColNo(): number {
        return getColNo(this.lineCol);
    }

    public static buildFromNode(node: ts.Node, sourceFile: ts.SourceFile): LineColPosition {
        const lineStarts = sourceFile.getLineStarts();
        const offset = node.getStart(sourceFile);
        const line = lineIndexOfPosition(lineStarts, offset);
        // line start from 1.
        return new LineColPosition(line + 1, offset - lineStarts[line] + 1);
    }

    /**
     * Builds a LineColPosition object from a CxxAstNode.
     * @param node - The C++ AST node.
     * @returns A LineColPosition object containing the line and character information. Default LineColPosition is (0, 0).
     */
    public static cxxBuildFromNode(node: CxxAstNodePositionSource): LineColPosition {
        const nodePos = getNodeStartLineAndCol(node);
        return new LineColPosition(nodePos.line, nodePos.col);
    }
}

export class FullPosition {
    private readonly first: LineCol;
    private readonly last: LineCol;

    public static readonly DEFAULT: FullPosition = new FullPosition(INVALID_LINE, INVALID_LINE, INVALID_LINE, INVALID_LINE);

    constructor(firstLine: number, firstCol: number, lastLine: number, lastCol: number) {
        this.first = setLineCol(firstLine, firstCol);
        this.last = setLineCol(lastLine, lastCol);
    }

    public getFirstLine(): number {
        return getLineNo(this.first);
    }

    public getLastLine(): number {
        return getLineNo(this.last);
    }

    public getFirstCol(): number {
        return getColNo(this.first);
    }

    public getLastCol(): number {
        return getColNo(this.last);
    }

    /** @internal Raw packed line/col word of the range start, for compact storage. */
    public getFirstPacked(): LineCol {
        return this.first;
    }

    /** @internal Raw packed line/col word of the range end, for compact storage. */
    public getLastPacked(): LineCol {
        return this.last;
    }

    /** @internal Rebuild a position from raw packed words produced by getFirstPacked/getLastPacked. */
    public static fromPacked(first: LineCol, last: LineCol): FullPosition {
        return new FullPosition(getLineNo(first), getColNo(first), getLineNo(last), getColNo(last));
    }

    public static buildFromNode(node: ts.Node, sourceFile: ts.SourceFile): FullPosition {
        const lineStarts = sourceFile.getLineStarts();
        const startOffset = node.getStart(sourceFile);
        const startLine = lineIndexOfPosition(lineStarts, startOffset);
        const endOffset = node.getEnd();
        const endLine = lineIndexOfPosition(lineStarts, endOffset);

        // line start from 1
        return new FullPosition(startLine + 1, startOffset - lineStarts[startLine] + 1, endLine + 1, endOffset - lineStarts[endLine] + 1);
    }

    /**
     *Building a FullPosition object from a C++AST node
     *@ param node C++AST node, possibly undefined
     *@ param_sourceFile source file node (not used)
     *@ returns The FullPosition object containing location information
     */
    public static cxxBuildFromNode(node: CxxAstNodePositionSource | undefined, _sourceFile: CxxAstNodePositionSource): FullPosition {
        const begin = node?.range?.begin;
        const end = node?.range?.end;
        const startLine = begin?.line ?? 0;
        const startCharacter = begin?.col ?? 0;
        const endLine = end?.line ?? startLine;
        const endCharacter = end && end.tokLen ? end.col + end.tokLen : begin?.tokLen != null ? startCharacter + begin.tokLen : startCharacter;
        return new FullPosition(startLine, startCharacter, endLine, endCharacter);
    }

    public static merge(leftMostPosition: FullPosition, rightMostPosition: FullPosition): FullPosition {
        return new FullPosition(
            leftMostPosition.getFirstLine(),
            leftMostPosition.getFirstCol(),
            rightMostPosition.getLastLine(),
            rightMostPosition.getLastCol()
        );
    }
}
