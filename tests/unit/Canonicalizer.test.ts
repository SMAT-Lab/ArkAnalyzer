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
import { Canonicalizer } from '../../src/utils/Canonicalizer';

describe('Canonicalizer Test', () => {
    it('getId allocates consecutive ids starting at 0', () => {
        const c = new Canonicalizer<object>();
        expect(c.getId({})).toBe(0);
        expect(c.getId({})).toBe(1);
        expect(c.getId({})).toBe(2);
    });

    it('getId is idempotent for the same object', () => {
        const c = new Canonicalizer<object>();
        const obj = { tag: 'x' };
        const id = c.getId(obj);
        expect(c.getId(obj)).toBe(id);
        expect(c.size()).toBe(1);
    });

    it('get returns the registered item by id', () => {
        const c = new Canonicalizer<object>();
        const obj = { tag: 'reverse' };
        const id = c.getId(obj);
        expect(c.get(id)).toBe(obj);
    });

    it('get returns undefined for out-of-bounds ids', () => {
        const c = new Canonicalizer<object>();
        expect(c.get(0)).toBeUndefined();
        expect(c.get(-1)).toBeUndefined();
        c.getId({});
        expect(c.get(5)).toBeUndefined();
    });

    it('size reports the number of registered items', () => {
        const c = new Canonicalizer<object>();
        expect(c.size()).toBe(0);
        c.getId({});
        expect(c.size()).toBe(1);
        c.getId({});
        expect(c.size()).toBe(2);
    });

    it('getExistingId returns the same id as getId for registered items', () => {
        const c = new Canonicalizer<object>();
        const obj = { tag: 'reg' };
        const id = c.getId(obj);
        expect(c.getExistingId(obj)).toBe(id);
    });

    it('getExistingId returns -1 for unregistered items without allocating', () => {
        const c = new Canonicalizer<object>();
        c.getId({}); // id 0
        const before = c.size();
        expect(c.getExistingId({ tag: 'unregistered' })).toBe(-1);
        expect(c.size()).toBe(before);
    });

    it('getExistingId returns -1 on an uninitialized canonicalizer', () => {
        const c = new Canonicalizer<object>();
        expect(c.getExistingId({})).toBe(-1);
        expect(c.size()).toBe(0);
    });

    it('clear resets all mappings and the strategy', () => {
        const c = new Canonicalizer<object>();
        const obj = { tag: 'clear' };
        c.getId(obj);
        expect(c.size()).toBe(1);
        c.clear();
        expect(c.size()).toBe(0);
        expect(c.getStats().strategy).toBe('uninitialized');
        expect(c.get(0)).toBeUndefined();
        // After clear the Symbol marker is gone, so the object gets a fresh id.
        expect(c.getId(obj)).toBe(0);
    });

    it('getStats reports strategy, size, bucketCount and collisionCount', () => {
        const c = new Canonicalizer<object>();
        c.getId({});
        c.getId({});
        const stats = c.getStats();
        expect(stats.strategy).toBe('objectIdentity');
        expect(stats.size).toBe(2);
        expect(stats.bucketCount).toBe(0);
        expect(stats.collisionCount).toBe(0);
    });

    it('auto-selects objectIdentity for objects', () => {
        const c = new Canonicalizer<object>();
        c.getId({ a: 1 });
        expect(c.getStats().strategy).toBe('objectIdentity');
    });

    it('auto-selects stringIdentity for strings', () => {
        const c = new Canonicalizer<string>();
        c.getId('hello');
        expect(c.getStats().strategy).toBe('stringIdentity');
    });

    it('auto-selects numberWithEquality for numbers with a comparer', () => {
        const c = new Canonicalizer<number>(undefined, (a, b) => a === b);
        c.getId(42);
        expect(c.getStats().strategy).toBe('numberWithEquality');
    });

    it('objectIdentity throws when passed a frozen object', () => {
        const c = new Canonicalizer<object>();
        const frozen = Object.freeze({ tag: 'frozen' });
        expect(() => c.getId(frozen)).toThrow();
        expect(c.size()).toBe(0);
        // getExistingId does not throw, it just reports not registered.
        expect(c.getExistingId(frozen)).toBe(-1);
    });

    it('handles different concrete object types under objectIdentity', () => {
        class A {}
        class B {}
        const c = new Canonicalizer<object>();
        const a = new A();
        const b = new B();
        const arr = [1, 2, 3];
        const fn = (): number => 0;
        expect(c.getId(a)).toBe(0);
        expect(c.getId(b)).toBe(1);
        expect(c.getId(arr)).toBe(2);
        expect(c.getId(fn)).toBe(3);
        // idempotent across mixed types
        expect(c.getId(a)).toBe(0);
        expect(c.getId(fn)).toBe(3);
        expect(c.size()).toBe(4);
        expect(c.get(0)).toBe(a);
        expect(c.get(3)).toBe(fn);
    });

    it('stringIdentity canonicalizes strings by value', () => {
        const c = new Canonicalizer<string>();
        expect(c.getId('a')).toBe(0);
        expect(c.getId('b')).toBe(1);
        // Same string value yields the same id, even from a different reference.
        expect(c.getId('a')).toBe(0);
        expect(c.size()).toBe(2);
    });

    it('stringIdentity supports reverse lookup and existing-id queries', () => {
        const c = new Canonicalizer<string>();
        expect(c.getId('alpha')).toBe(0);
        expect(c.getId('beta')).toBe(1);
        expect(c.get(0)).toBe('alpha');
        expect(c.get(1)).toBe('beta');
        expect(c.getExistingId('alpha')).toBe(0);
        expect(c.getExistingId('gamma')).toBe(-1);
    });

    it('stringIdentity resizes its bucket table under heavy load', () => {
        const c = new Canonicalizer<string>();
        const n = 200;
        for (let i = 0; i < n; i++) {
            c.getId(`str${i}`);
        }
        expect(c.size()).toBe(n);
        for (let i = 0; i < n; i++) {
            expect(c.getExistingId(`str${i}`)).toBe(i);
            expect(c.get(i)).toBe(`str${i}`);
        }
        expect(c.getStats().bucketCount).toBeGreaterThan(0);
    });

    it('numberWithEquality canonicalizes with a custom key extractor and comparer', () => {
        interface Pt {
            x: number;
            y: number;
        }
        const c = new Canonicalizer<Pt>(
            p => p.x,
            (a, b) => a.x === b.x
        );
        const p1: Pt = { x: 1, y: 10 };
        const p2: Pt = { x: 1, y: 20 }; // same x => equal per comparer
        const p3: Pt = { x: 2, y: 30 };
        expect(c.getId(p1)).toBe(0);
        expect(c.getId(p2)).toBe(0);
        expect(c.getId(p3)).toBe(1);
        expect(c.size()).toBe(2);
        expect(c.getStats().strategy).toBe('numberWithEquality');
        expect(c.get(0)).toBe(p1);
    });

    it('numberWithEquality resizes under heavy load', () => {
        const c = new Canonicalizer<number>(undefined, (a, b) => a === b);
        const n = 300;
        for (let i = 0; i < n; i++) {
            expect(c.getId(i)).toBe(i);
        }
        expect(c.size()).toBe(n);
        for (let i = 0; i < n; i++) {
            expect(c.getExistingId(i)).toBe(i);
            expect(c.get(i)).toBe(i);
        }
        expect(c.getStats().bucketCount).toBeGreaterThan(0);
    });
});
