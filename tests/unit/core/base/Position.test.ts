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

import { describe, expect, it } from 'vitest';
import {
    FullPosition,
    LineColPosition,
    getColNo,
    getLineNo,
    setCol,
    setLine,
    setLineCol,
} from '../../../../src/core/base/Position';

const INVALID_LINE = -1;
const MAX_NUMBER = 0xffff;

describe('Position helpers (setLine/setCol/setLineCol/getLineNo/getColNo)', () => {
    it('round-trips typical line/col values', () => {
        const lc = setLineCol(12, 34);
        expect(getLineNo(lc)).toBe(12);
        expect(getColNo(lc)).toBe(34);
    });

    it('setLine/setCol preserve the other bit-field', () => {
        let lc = setCol(0, 7);
        lc = setLine(lc, 99);
        expect(getLineNo(lc)).toBe(99);
        expect(getColNo(lc)).toBe(7);

        lc = setLine(0, 50);
        lc = setCol(lc, 80);
        expect(getLineNo(lc)).toBe(50);
        expect(getColNo(lc)).toBe(80);
    });

    it('getLineNo/getColNo return INVALID_LINE when the stored value is zero', () => {
        expect(getLineNo(setLineCol(0, 5))).toBe(INVALID_LINE);
        expect(getColNo(setLineCol(0, 5))).toBe(5);
        expect(getLineNo(setLineCol(5, 0))).toBe(5);
        expect(getColNo(setLineCol(5, 0))).toBe(INVALID_LINE);
    });

    it('clamps values above the 16-bit range to MAX_NUMBER', () => {
        expect(getLineNo(setLine(0, 0x10_0000))).toBe(MAX_NUMBER);
        expect(getColNo(setCol(0, 0x10_0000))).toBe(MAX_NUMBER);
    });

    it('clamps negative line/col values up to 0 (which reads back as INVALID_LINE)', () => {
        expect(getLineNo(setLine(0, -5))).toBe(INVALID_LINE);
        expect(getColNo(setCol(0, -5))).toBe(INVALID_LINE);
    });

    it('supports the boundary values 1 and 0xffff', () => {
        const lcMin = setLineCol(1, 1);
        expect(getLineNo(lcMin)).toBe(1);
        expect(getColNo(lcMin)).toBe(1);
        const lcMax = setLineCol(MAX_NUMBER, MAX_NUMBER);
        expect(getLineNo(lcMax)).toBe(MAX_NUMBER);
        expect(getColNo(lcMax)).toBe(MAX_NUMBER);
    });
});

describe('LineColPosition', () => {
    it('exposes the constructor arguments via getters', () => {
        const p = new LineColPosition(10, 25);
        expect(p.getLineNo()).toBe(10);
        expect(p.getColNo()).toBe(25);
    });

    it('DEFAULT reports INVALID_LINE for line and col', () => {
        expect(LineColPosition.DEFAULT.getLineNo()).toBe(INVALID_LINE);
        expect(LineColPosition.DEFAULT.getColNo()).toBe(INVALID_LINE);
    });

    it('different instances are independent', () => {
        const a = new LineColPosition(1, 2);
        const b = new LineColPosition(3, 4);
        expect(a.getLineNo()).toBe(1);
        expect(a.getColNo()).toBe(2);
        expect(b.getLineNo()).toBe(3);
        expect(b.getColNo()).toBe(4);
    });
});

describe('FullPosition', () => {
    it('exposes first/last line and col via getters', () => {
        const p = new FullPosition(1, 2, 3, 4);
        expect(p.getFirstLine()).toBe(1);
        expect(p.getFirstCol()).toBe(2);
        expect(p.getLastLine()).toBe(3);
        expect(p.getLastCol()).toBe(4);
    });

    it('DEFAULT reports INVALID_LINE on all four positions', () => {
        expect(FullPosition.DEFAULT.getFirstLine()).toBe(INVALID_LINE);
        expect(FullPosition.DEFAULT.getFirstCol()).toBe(INVALID_LINE);
        expect(FullPosition.DEFAULT.getLastLine()).toBe(INVALID_LINE);
        expect(FullPosition.DEFAULT.getLastCol()).toBe(INVALID_LINE);
    });

    it('merge combines the left start with the right end, without mutating inputs', () => {
        const left = new FullPosition(5, 1, 5, 10);
        const right = new FullPosition(7, 4, 9, 20);
        const merged = FullPosition.merge(left, right);
        expect(merged.getFirstLine()).toBe(5);
        expect(merged.getFirstCol()).toBe(1);
        expect(merged.getLastLine()).toBe(9);
        expect(merged.getLastCol()).toBe(20);
        // Inputs unchanged.
        expect(left.getFirstLine()).toBe(5);
        expect(left.getLastLine()).toBe(5);
        expect(right.getFirstLine()).toBe(7);
        expect(right.getLastLine()).toBe(9);
    });

    it('merge takes endpoints literally (no reordering)', () => {
        // Documented contract: merge(left, right) uses left's start and right's end
        // even when right appears to precede left in source order.
        const left = new FullPosition(10, 1, 10, 5);
        const right = new FullPosition(1, 1, 1, 3);
        const merged = FullPosition.merge(left, right);
        expect(merged.getFirstLine()).toBe(10);
        expect(merged.getLastLine()).toBe(1);
    });
});
