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
import { LRUCache, clearLRUCache } from '../../src/utils/LRUCacheDecorator';

// Applies the decorator manually so these tests don't require experimentalDecorators.
function decorate(
    holder: object,
    methodName: string,
    factory: () => (target: object, prop: string, desc: PropertyDescriptor) => void
): void {
    const desc = Object.getOwnPropertyDescriptor(holder, methodName)!;
    factory()(holder, methodName, desc);
    Object.defineProperty(holder, methodName, desc);
}

describe('LRUCacheDecorator Test', () => {
    it('caches return value and reuses it on identical args', () => {
        let calls = 0;
        const obj = {
            compute(x: number): number {
                calls++;
                return x * 2;
            },
        };
        decorate(obj, 'compute', () => LRUCache());

        expect(obj.compute(3)).toBe(6);
        expect(obj.compute(3)).toBe(6);
        expect(obj.compute(3)).toBe(6);
        expect(calls).toBe(1);
    });

    it('uses different keys for different arguments', () => {
        let calls = 0;
        const obj = {
            compute(x: number): number {
                calls++;
                return x + 1;
            },
        };
        decorate(obj, 'compute', () => LRUCache());

        expect(obj.compute(1)).toBe(2);
        expect(obj.compute(2)).toBe(3);
        expect(obj.compute(3)).toBe(4);
        expect(calls).toBe(3);

        obj.compute(1);
        obj.compute(2);
        expect(calls).toBe(3);
    });

    it('evicts least-recently-used entries when maxSize is reached', () => {
        let calls = 0;
        const obj = {
            compute(x: number): number {
                calls++;
                return x * 10;
            },
        };
        decorate(obj, 'compute', () => LRUCache(2));

        obj.compute(1);
        obj.compute(2);
        // Cache = {1,2}. Inserting 3 evicts LRU (1).
        obj.compute(3);
        expect(calls).toBe(3);

        obj.compute(1); // recomputed
        expect(calls).toBe(4);

        obj.compute(3); // still cached
        expect(calls).toBe(4);
    });

    it('promotes a cache hit to most-recently-used', () => {
        let calls = 0;
        const obj = {
            compute(x: number): number {
                calls++;
                return x;
            },
        };
        decorate(obj, 'compute', () => LRUCache(2));

        obj.compute(1); // [1]
        obj.compute(2); // [1,2]
        obj.compute(1); // hit -> [2,1]
        obj.compute(3); // inserts 3, evicts 2
        expect(calls).toBe(3);

        obj.compute(1);
        expect(calls).toBe(3);

        obj.compute(2); // was evicted
        expect(calls).toBe(4);
    });

    it('supports a custom key generator', () => {
        let calls = 0;
        const obj = {
            lookup(path: string): string {
                calls++;
                return path;
            },
        };
        decorate(obj, 'lookup', () => LRUCache(16, (p: string) => p.toLowerCase()));

        expect(obj.lookup('Foo.ts')).toBe('Foo.ts');
        expect(obj.lookup('FOO.TS')).toBe('Foo.ts'); // case-insensitive hit
        expect(obj.lookup('foo.ts')).toBe('Foo.ts');
        expect(calls).toBe(1);
    });

    it('clearLRUCache drops all cached entries', () => {
        let calls = 0;
        const obj = {
            compute(x: number): number {
                calls++;
                return x;
            },
        };
        decorate(obj, 'compute', () => LRUCache());

        obj.compute(1);
        obj.compute(2);
        obj.compute(1); // hit
        expect(calls).toBe(2);

        clearLRUCache(obj, 'compute');

        obj.compute(1);
        obj.compute(2);
        expect(calls).toBe(4);
    });

    it('clearLRUCache is a no-op for non-decorated or missing methods', () => {
        const obj = {
            plain(): number {
                return 1;
            },
        };

        expect(() => clearLRUCache(obj, 'plain')).not.toThrow();
        expect(() => clearLRUCache(obj, 'missing')).not.toThrow();
    });

    it('handles multi-argument methods via default join-based key', () => {
        let calls = 0;
        const obj = {
            sum(a: number, b: number): number {
                calls++;
                return a + b;
            },
        };
        decorate(obj, 'sum', () => LRUCache());

        obj.sum(1, 2);
        obj.sum(1, 2);
        obj.sum(2, 1); // different key
        expect(calls).toBe(2);
    });
});
