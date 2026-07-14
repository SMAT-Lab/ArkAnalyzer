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
import { ModuleCache, HeapUsedEstimateState } from '../../src/frontend/common/ModuleCache';
import type { MemoryMonitor } from '../../src/frontend/common/MemoryMonitor';
import type { ModuleID } from '../../src/core/model/ArkModule';
import { ModuleDepthLevel } from '../../src/frontend/common/ModuleDepth';

/** Mock MemoryMonitor with controllable enabled state. */
function makeMockMonitor(enabled: boolean): MemoryMonitor {
    return { isEnabled: () => enabled } as unknown as MemoryMonitor;
}

describe('ModuleCache', () => {
    it('register / unregister / has / size', () => {
        const cache = new ModuleCache();
        expect(cache.size()).toBe(0);
        expect(cache.has(1)).toBe(false);

        cache.register(1);
        cache.register(2);
        expect(cache.size()).toBe(2);
        expect(cache.has(1)).toBe(true);
        expect(cache.has(2)).toBe(true);

        cache.unregister(1);
        expect(cache.size()).toBe(1);
        expect(cache.has(1)).toBe(false);
        expect(cache.has(2)).toBe(true);
    });

    it('does not evict when monitor is disabled', () => {
        const cache = new ModuleCache();
        const monitor = makeMockMonitor(false);
        const unloaded: ModuleID[] = [];
        cache.register(1);
        cache.register(2);
        const heapUsedState: HeapUsedEstimateState = { estimate: 1000, limit: 0 };
        cache.evict(new Set(), new Set(), monitor, id => unloaded.push(id), undefined, heapUsedState, () => 100);
        expect(unloaded).toEqual([]);
        expect(cache.size()).toBe(2);
    });

    it('does not evict when heapUsed estimate is within limit', () => {
        const cache = new ModuleCache();
        const monitor = makeMockMonitor(true);
        const unloaded: ModuleID[] = [];
        cache.register(1);
        const heapUsedState: HeapUsedEstimateState = { estimate: 500, limit: 1000 };
        cache.evict(new Set(), new Set(), monitor, id => unloaded.push(id), undefined, heapUsedState, () => 100);
        expect(unloaded).toEqual([]);
    });

    it('Phase 1 evicts non-protected modules in LRU order', () => {
        const cache = new ModuleCache();
        const monitor = makeMockMonitor(true);
        const unloaded: ModuleID[] = [];

        cache.register(1);
        cache.register(2);
        cache.register(3);

        const hard = new Set<ModuleID>([3]);
        const soft = new Set<ModuleID>([2]);
        const heapUsedState: HeapUsedEstimateState = { estimate: 1000, limit: 0 };
        const unloadFn = (id: ModuleID) => {
            unloaded.push(id);
            heapUsedState.estimate = 0;
        };
        cache.evict(hard, soft, monitor, unloadFn, undefined, heapUsedState, () => 500);

        expect(unloaded).toEqual([1]);
        expect(cache.has(1)).toBe(false);
        expect(cache.has(2)).toBe(true);
        expect(cache.has(3)).toBe(true);
    });

    it('Phase 1 evicts multiple non-protected modules until estimate drops below limit', () => {
        const cache = new ModuleCache();
        const monitor = makeMockMonitor(true);
        const unloaded: ModuleID[] = [];

        cache.register(1);
        cache.register(2);
        cache.register(3);

        const heapUsedState: HeapUsedEstimateState = { estimate: 1000, limit: 400 };
        const unloadFn = (id: ModuleID) => {
            unloaded.push(id);
        };
        // Each module decrease = 400; after 2nd unload, estimate = 1000-800=200 <= 400
        cache.evict(new Set(), new Set(), monitor, unloadFn, undefined, heapUsedState, () => 400);

        expect(unloaded).toEqual([1, 2]);
        expect(cache.has(1)).toBe(false);
        expect(cache.has(2)).toBe(false);
        expect(cache.has(3)).toBe(true);
    });

    it('hardprotected set is never evicted', () => {
        const cache = new ModuleCache();
        const monitor = makeMockMonitor(true);
        const unloaded: ModuleID[] = [];

        cache.register(1);
        cache.register(2);

        const hard = new Set<ModuleID>([1, 2]);
        const heapUsedState: HeapUsedEstimateState = { estimate: 1000, limit: 0 };
        cache.evict(hard, new Set(), monitor, id => unloaded.push(id), undefined, heapUsedState, () => 100);

        expect(unloaded).toEqual([]);
        expect(cache.size()).toBe(2);
    });

    it('SCC group: evicts all members together or none', () => {
        const cache = new ModuleCache();
        const monitor = makeMockMonitor(true);
        const unloaded: ModuleID[] = [];

        cache.register(1);
        cache.register(2);
        cache.register(3);

        const sccGroups = new Map<ModuleID, ModuleID[]>([
            [1, [1, 2]],
            [2, [1, 2]],
        ]);

        const hard = new Set<ModuleID>();
        const soft = new Set<ModuleID>([2]);

        const heapUsedState: HeapUsedEstimateState = { estimate: 1000, limit: 0 };
        const unloadFn = (id: ModuleID) => {
            unloaded.push(id);
        };

        cache.evict(hard, soft, monitor, unloadFn, sccGroups, heapUsedState, () => 500);

        expect(unloaded).toContain(3);
        expect(cache.has(1)).toBe(true);
        expect(cache.has(2)).toBe(true);
    });

    it('SCC group: all evictable when no member is protected', () => {
        const cache = new ModuleCache();
        const monitor = makeMockMonitor(true);
        const unloaded: ModuleID[] = [];

        cache.register(1);
        cache.register(2);

        const sccGroups = new Map<ModuleID, ModuleID[]>([
            [1, [1, 2]],
            [2, [1, 2]],
        ]);

        const heapUsedState: HeapUsedEstimateState = { estimate: 1000, limit: 0 };
        cache.evict(new Set(), new Set(), monitor, id => unloaded.push(id), sccGroups, heapUsedState, () => 500);

        expect(unloaded.sort()).toEqual([1, 2]);
        expect(cache.size()).toBe(0);
    });

    it('clear removes all entries including heapUsed table', () => {
        const cache = new ModuleCache();
        cache.register(1);
        cache.register(2);
        cache.recordHeapUsed(1, ModuleDepthLevel.BODIES, 100_000);
        expect(cache.size()).toBe(2);
        expect(cache.getHeapUsed(1, ModuleDepthLevel.BODIES)).toBe(100_000);

        cache.clear();
        expect(cache.size()).toBe(0);
        expect(cache.has(1)).toBe(false);
        expect(cache.getHeapUsed(1, ModuleDepthLevel.BODIES)).toBeUndefined();
    });

    // --- heapUsed table tests ---

    describe('heapUsed table', () => {
        it('recordHeapUsed stores value on first call', () => {
            const cache = new ModuleCache();
            cache.recordHeapUsed(1, ModuleDepthLevel.BODIES, 548_000);
            expect(cache.getHeapUsed(1, ModuleDepthLevel.BODIES)).toBe(548_000);
        });

        it('recordHeapUsed does not overwrite on second call (first-load only)', () => {
            const cache = new ModuleCache();
            cache.recordHeapUsed(1, ModuleDepthLevel.BODIES, 548_000);
            cache.recordHeapUsed(1, ModuleDepthLevel.BODIES, 999_000);
            expect(cache.getHeapUsed(1, ModuleDepthLevel.BODIES)).toBe(548_000);
        });

        it('recordHeapUsed stores separate values per depth level', () => {
            const cache = new ModuleCache();
            cache.recordHeapUsed(1, ModuleDepthLevel.SIGNATURES, 29_000);
            cache.recordHeapUsed(1, ModuleDepthLevel.BODIES, 548_000);
            expect(cache.getHeapUsed(1, ModuleDepthLevel.SIGNATURES)).toBe(29_000);
            expect(cache.getHeapUsed(1, ModuleDepthLevel.BODIES)).toBe(548_000);
        });

        it('getHeapUsed returns undefined for unrecorded module/level', () => {
            const cache = new ModuleCache();
            expect(cache.getHeapUsed(99, ModuleDepthLevel.BODIES)).toBeUndefined();
            cache.recordHeapUsed(1, ModuleDepthLevel.BODIES, 100);
            expect(cache.getHeapUsed(1, ModuleDepthLevel.SIGNATURES)).toBeUndefined();
        });

        it('unregister does not erase heapUsed table entry', () => {
            const cache = new ModuleCache();
            cache.register(1);
            cache.recordHeapUsed(1, ModuleDepthLevel.BODIES, 548_000);
            cache.unregister(1);
            expect(cache.getHeapUsed(1, ModuleDepthLevel.BODIES)).toBe(548_000);
        });

        it('eviction decrements heapUsedState.estimate by getHeapUsedDecrease for each module', () => {
            const cache = new ModuleCache();
            const monitor = makeMockMonitor(true);
            const unloaded: ModuleID[] = [];

            cache.register(1);
            cache.register(2);
            cache.register(3);

            const heapUsedDecreases = new Map<ModuleID, number>([
                [1, 300],
                [2, 200],
                [3, 500],
            ]);

            const heapUsedState: HeapUsedEstimateState = { estimate: 1000, limit: 500 };
            cache.evict(
                new Set(), new Set(), monitor,
                id => unloaded.push(id),
                undefined,
                heapUsedState,
                id => heapUsedDecreases.get(id) ?? 0
            );

            // estimate starts at 1000, limit=500
            // After module 1 (decrease=300): 1000-300=700 > 500 → continue
            // After module 2 (decrease=200): 700-200=500 <= 500 → stop
            expect(unloaded).toEqual([1, 2]);
            expect(heapUsedState.estimate).toBe(500);
            expect(cache.has(3)).toBe(true);
        });

        it('SCC group eviction sums heapUsed decreases for all members', () => {
            const cache = new ModuleCache();
            const monitor = makeMockMonitor(true);
            const unloaded: ModuleID[] = [];

            cache.register(1);
            cache.register(2);
            cache.register(3);

            const sccGroups = new Map<ModuleID, ModuleID[]>([
                [1, [1, 2]],
                [2, [1, 2]],
            ]);

            const heapUsedDecreases = new Map<ModuleID, number>([
                [1, 300],
                [2, 200],
                [3, 400],
            ]);

            const heapUsedState: HeapUsedEstimateState = { estimate: 1000, limit: 400 };
            cache.evict(
                new Set(), new Set(), monitor,
                id => unloaded.push(id),
                sccGroups,
                heapUsedState,
                id => heapUsedDecreases.get(id) ?? 0
            );

            // Module 3 is first in LRU (not in SCC), decrease=400: 1000-400=600 > 400 → continue
            // Module 1 is in SCC group [1,2], both evictable:
            //   member 1 decrease=300: 600-300=300 <= 400 → stop (but both members already evicted)
            //   member 2 decrease=200: 300-200=100
            expect(unloaded).toContain(3);
            expect(unloaded).toContain(1);
            expect(unloaded).toContain(2);
            expect(heapUsedState.estimate).toBe(100);
        });
    });
});
