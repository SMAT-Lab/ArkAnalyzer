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
import { PackedSparseMap } from '../../src/utils/PackedSparseMap';

describe('PackedSparseMap Test', () => {
    it('getOrInsert returns the freshly-created value on first call', () => {
        const map = new PackedSparseMap(4, 1024);
        let called = 0;
        const v = map.getOrInsert(0, 10, () => { called++; return 42; });
        expect(v).toBe(42);
        expect(called).toBe(1);
    });

    it('getOrInsert returns the cached value without re-invoking the factory', () => {
        const map = new PackedSparseMap(4, 1024);
        let called = 0;
        const first = map.getOrInsert(0, 10, () => { called++; return 100; });
        const second = map.getOrInsert(0, 10, () => { called++; return 999; });
        expect(first).toBe(100);
        expect(second).toBe(100);
        expect(called).toBe(1);
    });

    it('keeps entries for distinct (owner, key) pairs isolated', () => {
        const map = new PackedSparseMap(4, 1024);
        expect(map.getOrInsert(0, 1, () => 11)).toBe(11);
        expect(map.getOrInsert(0, 2, () => 12)).toBe(12);
        expect(map.getOrInsert(1, 1, () => 21)).toBe(21);
        expect(map.getOrInsert(1, 2, () => 22)).toBe(22);
        expect(map.getOrInsert(0, 1, () => -1)).toBe(11);
        expect(map.getOrInsert(0, 2, () => -1)).toBe(12);
        expect(map.getOrInsert(1, 1, () => -1)).toBe(21);
        expect(map.getOrInsert(1, 2, () => -1)).toBe(22);
    });

    it('maintains correct results with out-of-order key insertion', () => {
        // Internal storage is kept sorted; verify lookups after descending inserts.
        const map = new PackedSparseMap(2, 1024);
        const inserted = [50, 10, 30, 20, 40, 5, 60];
        for (const k of inserted) {
            expect(map.getOrInsert(0, k, () => k * 2)).toBe(k * 2);
        }
        for (const k of inserted) {
            expect(map.getOrInsert(0, k, () => -1)).toBe(k * 2);
        }
    });

    it('grows owner capacity when accessing an owner beyond the initial size', () => {
        const map = new PackedSparseMap(1, 1024);
        expect(map.getOrInsert(50, 1, () => 500)).toBe(500);
        expect(map.getOrInsert(50, 1, () => -1)).toBe(500);
        expect(map.getOrInsert(100, 7, () => 700)).toBe(700);
        expect(map.getOrInsert(100, 7, () => -1)).toBe(700);
    });

    it('grows pool capacity under heavy insertion load', () => {
        const map = new PackedSparseMap(4, 4); // tiny pool forces multiple growths
        const count = 200;
        for (let i = 0; i < count; i++) {
            expect(map.getOrInsert(0, i, () => i + 1000)).toBe(i + 1000);
        }
        for (let i = 0; i < count; i++) {
            expect(map.getOrInsert(0, i, () => -1)).toBe(i + 1000);
        }
    });

    it('handles zero-valued keys/owners and negative stored values', () => {
        const map = new PackedSparseMap(4, 1024);
        expect(map.getOrInsert(0, 0, () => 7)).toBe(7);
        expect(map.getOrInsert(0, 0, () => -1)).toBe(7);
        expect(map.getOrInsert(1, 1, () => -42)).toBe(-42);
        expect(map.getOrInsert(1, 1, () => -1)).toBe(-42);
    });

    it('stress: many owners x many keys', () => {
        const map = new PackedSparseMap(8, 64);
        const owners = 10;
        const keysPerOwner = 50;
        for (let o = 0; o < owners; o++) {
            for (let k = 0; k < keysPerOwner; k++) {
                expect(map.getOrInsert(o, k, () => o * 1000 + k)).toBe(o * 1000 + k);
            }
        }
        for (let o = 0; o < owners; o++) {
            for (let k = 0; k < keysPerOwner; k++) {
                expect(map.getOrInsert(o, k, () => -1)).toBe(o * 1000 + k);
            }
        }
    });
});
