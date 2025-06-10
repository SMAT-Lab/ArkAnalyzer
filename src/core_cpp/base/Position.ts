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
const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'Position');

const LOW_BITS_SIZE = 16;
const LOW_BITS_MASK = 0xffff;
const HIGH_BITS_MASK = 0xffff0000;
const MIN_NUMBER = 0;
const MAX_NUMBER = 0xffff;
const INVALID_LINE = -1;

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
        let { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile));
        // line start from 1.
        return new LineColPosition(line + 1, character + 1);
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

    public static buildFromNode(node: ts.Node, sourceFile: ts.SourceFile): FullPosition {
        const { line: startLine, character: startCharacter } = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile));
        const { line: endLine, character: endCharacter } = ts.getLineAndCharacterOfPosition(sourceFile, node.getEnd());

        // line start from 1
        return new FullPosition(startLine + 1, startCharacter + 1, endLine + 1, endCharacter + 1);
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
