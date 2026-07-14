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

import type { ModuleID } from '../../core/model/ArkModule';
import type { MemoryMonitor } from './MemoryMonitor';
import { ModuleDepthLevel } from './ModuleDepth';

/**
 * Mutable heapUsed estimate tracking state used during eviction.
 *
 * `estimate` starts at the actual heapUsed measured before eviction and is
 * decremented by the heapUsed table value of each unloaded/downgraded module.
 * Eviction stops when `estimate` falls to or below `limit`.
 */
export interface HeapUsedEstimateState {
    estimate: number;
    limit: number;
}

/**
 * Maintains the set of currently-loaded modules and evicts them when memory pressure
 * exceeds the threshold.
 *
 * This class performs Phase 1 only: evicting modules that are neither in the hard nor soft
 * protected set (not depended on by the current or subsequent modules), in LRU order. The
 * caller ({@link ModuleBuilder.evictIfNeeded}) handles the subsequent phases:
 * - **Phase 2** — downgrade protected dependencies to dependencyLoadLevel (release method
 *   bodies/AST, keep signatures), in reverse-topo order.
 * - **Phase 3** — if still over threshold, evict the protected dependencies (full unload),
 *   in reverse-topo order.
 *
 * The hard protected set contains modules that must never be evicted (the current target
 * module and its dependency closure). The soft protected set contains modules that are
 * directly depended on by not-yet-loaded modules (evicting them causes reload overhead
 * but is safe).
 *
 * SCC groups: if a module belongs to a cyclic dependency group (size > 1), the entire
 * group is treated as a unit — either all members are evictable or none is evicted.
 *
 * ## heapUsed Table
 *
 * A heapUsed table ({@link heapUsedTable}) records the heapUsed increment observed during
 * the first load of each module at each depth level. This table is:
 * - Populated on first load only (subsequent reloads do not update it).
 * - Not cleared on module unload (persists across load/unload cycles).
 * - Cleared only on full cache reset ({@link clear}).
 *
 * During eviction, the table provides estimated heapUsed decreases for unload/downgrade
 * via the `getHeapUsedDecrease` callback — only one actual heapUsed measurement is taken
 * at the start of eviction, and all subsequent tracking uses table values.
 *
 * @category frontend/common
 */
export class ModuleCache {
    private loadedModules: Set<ModuleID> = new Set();
    private accessOrder: ModuleID[] = [];

    /**
     * Per-module heapUsed table, indexed by depth level.
     * Records the heapUsed increment (bytes) from the first load of each module at each level.
     * Persists across unload/load cycles; cleared only by {@link clear}.
     */
    private heapUsedTable: Map<ModuleID, Map<ModuleDepthLevel, number>> = new Map();

    /** Register a module as loaded. */
    public register(moduleId: ModuleID): void {
        if (!this.loadedModules.has(moduleId)) {
            this.loadedModules.add(moduleId);
            this.accessOrder.push(moduleId);
        }
    }

    /** Unregister a module (called after it has been unloaded). Does NOT clear the heapUsed table. */
    public unregister(moduleId: ModuleID): void {
        if (this.loadedModules.delete(moduleId)) {
            const idx = this.accessOrder.indexOf(moduleId);
            if (idx >= 0) {
                this.accessOrder.splice(idx, 1);
            }
        }
    }

    /** Whether the given module is currently loaded. */
    public has(moduleId: ModuleID): boolean {
        return this.loadedModules.has(moduleId);
    }

    /** Number of currently loaded modules. */
    public size(): number {
        return this.loadedModules.size;
    }

    /** All currently loaded module IDs. */
    public getLoadedModules(): ModuleID[] {
        return Array.from(this.loadedModules);
    }

    /** Remove all entries from the cache, including the heapUsed table. */
    public clear(): void {
        this.loadedModules.clear();
        this.accessOrder.length = 0;
        this.heapUsedTable.clear();
    }

    /**
     * Record the heapUsed increment for a module at the given depth level.
     *
     * Only records on the first load (when no entry exists for this module+level pair).
     * Subsequent reloads do not update the value. Module unload does not erase it.
     *
     * @param moduleId - The module ID.
     * @param level - The depth level at which the module was loaded.
     * @param heapUsedBytes - The heapUsed increment (bytes) observed during loading.
     */
    public recordHeapUsed(moduleId: ModuleID, level: ModuleDepthLevel, heapUsedBytes: number): void {
        let levelMap = this.heapUsedTable.get(moduleId);
        if (!levelMap) {
            levelMap = new Map();
            this.heapUsedTable.set(moduleId, levelMap);
        }
        if (!levelMap.has(level)) {
            levelMap.set(level, heapUsedBytes);
        }
    }

    /**
     * Get the recorded heapUsed for a module at the given depth level.
     *
     * @returns The recorded heapUsed in bytes, or `undefined` if not yet recorded.
     */
    public getHeapUsed(moduleId: ModuleID, level: ModuleDepthLevel): number | undefined {
        return this.heapUsedTable.get(moduleId)?.get(level);
    }

    /**
     * Evict loaded modules until the heapUsed estimate is below the limit (or no more candidates remain).
     *
     * This performs Phase 1 only: evicting modules that are neither in the hard nor soft protected
     * set. Downgrading (Phase 2) and evicting protected dependencies (Phase 3) are handled by
     * the caller (ModuleBuilder.evictIfNeeded).
     *
     * Instead of calling `process.memoryUsage()` after each unload, this method uses the
     * {@link HeapUsedEstimateState} to track the estimated heapUsed. The `getHeapUsedDecrease`
     * callback provides the estimated heapUsed decrease for each module (from the heapUsed table
     * or fallback).
     *
     * @param hardProtectedSet - Modules that must never be evicted.
     * @param softProtectedSet - Modules that should not be evicted in Phase 1.
     * @param monitor - The memory monitor (used only for `isEnabled()` guard).
     * @param unloadFn - Callback to unload a module by ID.
     * @param sccGroups - Optional SCC group map; members of the same group are evicted together.
     * @param heapUsedState - Mutable heapUsed estimate state; `estimate` is decremented as modules are evicted.
     * @param getHeapUsedDecrease - Callback returning the estimated heapUsed decrease (bytes) for a module.
     */
    public evict(
        hardProtectedSet: Set<ModuleID>,
        softProtectedSet: Set<ModuleID>,
        monitor: MemoryMonitor,
        unloadFn: (moduleId: ModuleID) => void,
        sccGroups: Map<ModuleID, ModuleID[]> | undefined,
        heapUsedState: HeapUsedEstimateState,
        getHeapUsedDecrease: (moduleId: ModuleID) => number
    ): void {
        if (!monitor.isEnabled() || heapUsedState.estimate <= heapUsedState.limit) {
            return;
        }

        // Phase 1: evict modules not in hard or soft protected set, in LRU order
        const phase1Protected = new Set<ModuleID>([...hardProtectedSet, ...softProtectedSet]);
        this.evictFromList([...this.accessOrder], phase1Protected, unloadFn, sccGroups, heapUsedState, getHeapUsedDecrease);
    }

    private evictFromList(
        list: ModuleID[],
        protectedSet: Set<ModuleID>,
        unloadFn: (moduleId: ModuleID) => void,
        sccGroups: Map<ModuleID, ModuleID[]> | undefined,
        heapUsedState: HeapUsedEstimateState,
        getHeapUsedDecrease: (moduleId: ModuleID) => number
    ): void {
        for (const moduleId of list) {
            if (heapUsedState.estimate <= heapUsedState.limit) {
                return;
            }
            if (!this.loadedModules.has(moduleId) || protectedSet.has(moduleId)) {
                continue;
            }

            if (sccGroups && this.tryEvictSCCGroup(moduleId, protectedSet, unloadFn, sccGroups, heapUsedState, getHeapUsedDecrease)) {
                continue;
            }

            const decrease = getHeapUsedDecrease(moduleId);
            unloadFn(moduleId);
            this.unregister(moduleId);
            heapUsedState.estimate -= decrease;
        }
    }

    /**
     * Try to evict an SCC group as a unit. Returns true if the module belongs to an SCC group
     * (size > 1) and the group was handled (either evicted or skipped due to protected members).
     * Returns false if the module is not part of a multi-member SCC group.
     *
     * When evicting, the heapUsed decrease for each group member is obtained from
     * `getHeapUsedDecrease` and subtracted from `heapUsedState.estimate`.
     */
    private tryEvictSCCGroup(
        moduleId: ModuleID,
        protectedSet: Set<ModuleID>,
        unloadFn: (moduleId: ModuleID) => void,
        sccGroups: Map<ModuleID, ModuleID[]>,
        heapUsedState: HeapUsedEstimateState,
        getHeapUsedDecrease: (moduleId: ModuleID) => number
    ): boolean {
        const group = sccGroups.get(moduleId);
        if (!group || group.length <= 1) {
            return false;
        }
        // All members must be evictable and currently loaded
        const blocked = group.some(m => protectedSet.has(m) || !this.loadedModules.has(m));
        if (!blocked) {
            for (const m of group) {
                const decrease = getHeapUsedDecrease(m);
                unloadFn(m);
                this.unregister(m);
                heapUsedState.estimate -= decrease;
            }
        }
        return true;
    }
}
