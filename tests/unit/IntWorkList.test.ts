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
import { IntWorkList } from '../../src/utils/IntWorkList';

describe('IntWorkList Test', () => {
    it('new worklist is empty', () => {
        const wl = new IntWorkList();
        expect(wl.isEmpty()).toBe(true);
        expect(wl.size()).toBe(0);
        expect(wl.pop()).toBeUndefined();
    });

    it('push/pop preserves FIFO order', () => {
        const wl = new IntWorkList(8);
        wl.push(1);
        wl.push(2);
        wl.push(3);

        expect(wl.size()).toBe(3);
        expect(wl.isEmpty()).toBe(false);
        expect(wl.pop()).toBe(1);
        expect(wl.pop()).toBe(2);
        expect(wl.pop()).toBe(3);
        expect(wl.pop()).toBeUndefined();
        expect(wl.isEmpty()).toBe(true);
    });

    it('size decreases with each pop', () => {
        const wl = new IntWorkList(4);
        wl.push(10);
        wl.push(20);
        expect(wl.size()).toBe(2);
        wl.pop();
        expect(wl.size()).toBe(1);
        wl.pop();
        expect(wl.size()).toBe(0);
        expect(wl.isEmpty()).toBe(true);
    });

    it('handles interleaved push and pop with circular wrap', () => {
        // Capacity is rounded up to the next power of two (>= 4 here).
        const wl = new IntWorkList(4);

        wl.push(1);
        wl.push(2);
        wl.push(3);
        expect(wl.pop()).toBe(1);
        expect(wl.pop()).toBe(2);

        // After two pops, head has advanced. New pushes should wrap around.
        wl.push(4);
        wl.push(5);
        wl.push(6);

        expect(wl.size()).toBe(4);
        expect(wl.pop()).toBe(3);
        expect(wl.pop()).toBe(4);
        expect(wl.pop()).toBe(5);
        expect(wl.pop()).toBe(6);
        expect(wl.pop()).toBeUndefined();
    });

    it('resizes when capacity is exceeded and preserves order (head < tail)', () => {
        const wl = new IntWorkList(2); // effective capacity = 2
        wl.push(100);
        wl.push(200);
        // Third push triggers resize while head < tail.
        wl.push(300);

        expect(wl.size()).toBe(3);
        expect(wl.pop()).toBe(100);
        expect(wl.pop()).toBe(200);
        expect(wl.pop()).toBe(300);
        expect(wl.isEmpty()).toBe(true);
    });

    it('resizes correctly when buffer has wrapped around (head > tail)', () => {
        const wl = new IntWorkList(2); // capacity = 2
        wl.push(1);
        wl.push(2);
        expect(wl.pop()).toBe(1); // head advances, making a hole at index 0
        wl.push(3); // wraps to index 0; now head=1, tail=1 (full)
        wl.push(4); // triggers resize; at this point head > tail in the wrapped sense

        expect(wl.size()).toBe(3);
        expect(wl.pop()).toBe(2);
        expect(wl.pop()).toBe(3);
        expect(wl.pop()).toBe(4);
        expect(wl.pop()).toBeUndefined();
    });

    it('survives a large push/pop workload (multiple resizes)', () => {
        const wl = new IntWorkList(4);
        const n = 5000;

        for (let i = 0; i < n; i++) {
            wl.push(i);
        }
        expect(wl.size()).toBe(n);

        for (let i = 0; i < n; i++) {
            expect(wl.pop()).toBe(i);
        }
        expect(wl.isEmpty()).toBe(true);
        expect(wl.pop()).toBeUndefined();
    });

    it('can be reused after being drained', () => {
        const wl = new IntWorkList(8);
        wl.push(1);
        wl.push(2);
        wl.pop();
        wl.pop();
        expect(wl.isEmpty()).toBe(true);

        wl.push(42);
        expect(wl.size()).toBe(1);
        expect(wl.pop()).toBe(42);
        expect(wl.isEmpty()).toBe(true);
    });
});
