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
import { IntMap } from '../../src/utils/IntMap';

describe('IntMap Test', () => {
    it('newly constructed map contains no keys', () => {
        const map = new IntMap(8, 16);
        for (let k = 0; k < 8; k++) {
            expect(map.has(k)).toBe(false);
            expect(map.contains(k, 0)).toBe(false);
            expect(map.getAsArray(k)).toEqual([]);
            expect(Array.from(map.getValues(k))).toEqual([]);
        }
    });

    it('add stores values and preserves LIFO iteration order', () => {
        const map = new IntMap(4, 8);
        map.add(1, 10);
        map.add(1, 20);
        map.add(1, 30);

        expect(map.has(1)).toBe(true);
        // Values are prepended to the linked list, so iteration is reverse of insertion.
        expect(map.getAsArray(1)).toEqual([30, 20, 10]);
        expect(Array.from(map.getValues(1))).toEqual([30, 20, 10]);
    });

    it('contains reports membership correctly', () => {
        const map = new IntMap(4, 8);
        map.add(2, 100);
        map.add(2, 200);

        expect(map.contains(2, 100)).toBe(true);
        expect(map.contains(2, 200)).toBe(true);
        expect(map.contains(2, 300)).toBe(false);
        expect(map.contains(3, 100)).toBe(false);
    });

    it('addUnique skips duplicates but allows distinct values', () => {
        const map = new IntMap(4, 8);

        expect(map.addUnique(0, 7)).toBe(true);
        expect(map.addUnique(0, 7)).toBe(false); // duplicate
        expect(map.addUnique(0, 8)).toBe(true);

        expect(map.getAsArray(0).sort((a, b) => a - b)).toEqual([7, 8]);
    });

    it('keys are isolated from each other', () => {
        const map = new IntMap(4, 8);
        map.add(0, 1);
        map.add(1, 2);
        map.add(2, 3);

        expect(map.getAsArray(0)).toEqual([1]);
        expect(map.getAsArray(1)).toEqual([2]);
        expect(map.getAsArray(2)).toEqual([3]);
        expect(map.has(3)).toBe(false);
    });

    it('grows value capacity beyond initialCapacity', () => {
        const map = new IntMap(2, 2); // Tiny initial capacity forces resizeCapacity()
        const expected: number[] = [];
        for (let v = 0; v < 100; v++) {
            map.add(0, v);
            expected.push(v);
        }

        expect(map.has(0)).toBe(true);
        // Iteration is reverse of insertion order.
        expect(map.getAsArray(0)).toEqual(expected.slice().reverse());
        for (const v of expected) {
            expect(map.contains(0, v)).toBe(true);
        }
    });

    it('grows key range when adding with key >= initial keyRange', () => {
        const map = new IntMap(2, 8); // keyRange starts at 2

        // Keys 0/1 are within range; key 5 triggers resizeHeads().
        map.add(0, 10);
        map.add(5, 50);
        map.add(5, 51);

        expect(map.has(0)).toBe(true);
        expect(map.has(5)).toBe(true);
        expect(map.getAsArray(5)).toEqual([51, 50]);
        // Previously-added key is preserved across the resize.
        expect(map.getAsArray(0)).toEqual([10]);
        // Untouched key inside the new range stays empty.
        expect(map.has(4)).toBe(false);
    });

    it('getValues is a fresh iterator on each call', () => {
        const map = new IntMap(2, 8);
        map.add(0, 1);
        map.add(0, 2);

        const first = Array.from(map.getValues(0));
        const second = Array.from(map.getValues(0));
        expect(first).toEqual([2, 1]);
        expect(second).toEqual([2, 1]);
    });
});
