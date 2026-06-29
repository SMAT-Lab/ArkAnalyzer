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

/**
 * Canonicalizer maps values of type `T` to dense, consecutive integer IDs
 * (starting at 0 and never reused). It auto-selects one of three strategies
 * based on the first registered item:
 *
 * - `objectIdentity`: O(1) lookup by storing the ID in a private Symbol
 *   property on the object. Selected for objects/functions when the default
 *   key extractor is used.
 * - `stringIdentity`: FNV-1a hash-based open addressing table backed by an
 *   `Int32Array`. Selected for strings when the default key extractor is used.
 * - `numberWithEquality`: hash-based open addressing that uses an external
 *   equality comparer. Selected when an equality comparer is provided and the
 *   extracted key is a number.
 *
 * IDs are allocated consecutively from 0 and are never reused. The class does
 * not provide `remove(id)` or `iterator()` methods.
 */

/** Active storage strategy of a {@link Canonicalizer}. */
export type CanonicalizerStrategy = 'uninitialized' | 'objectIdentity' | 'numberWithEquality' | 'stringIdentity';

/** Snapshot of the internal state of a {@link Canonicalizer}. */
export interface CanonicalizerStats {
    /** Currently active strategy. */
    strategy: CanonicalizerStrategy;
    /** Number of registered items. */
    size: number;
    /** Number of hash buckets (0 for `objectIdentity`). */
    bucketCount: number;
    /** Number of probe collisions observed during lookups. */
    collisionCount: number;
}

export class Canonicalizer<T> {
    private static readonly LOAD_FACTOR = 0.75;
    private static readonly INITIAL_BUCKET_COUNT = 16;

    private readonly keyExtractor: (item: T) => unknown;
    private readonly equalityComparer: ((a: T, b: T) => boolean) | undefined;
    private readonly usingDefaultKeyExtractor: boolean;
    private readonly idSymbol: symbol;

    private strategy: CanonicalizerStrategy = 'uninitialized';
    private list: T[] = [];
    private table: Int32Array | null = null;
    private tableHash: Int32Array | null = null;
    private bucketCount: number = 0;
    private collisionCount: number = 0;

    /**
     * @param keyExtractor - Extracts the comparison key from an item. Defaults to the identity function.
     * @param equalityComparer - Optional equality comparer used by the `numberWithEquality` strategy.
     */
    constructor(
        keyExtractor?: (item: T) => unknown,
        equalityComparer?: (a: T, b: T) => boolean
    ) {
        this.usingDefaultKeyExtractor = keyExtractor === undefined;
        this.keyExtractor = keyExtractor ?? ((item: T) => item);
        this.equalityComparer = equalityComparer;
        this.idSymbol = Symbol('canonicalizerId');
    }

    /**
     * Get the integer ID for `item`, allocating a new consecutive ID if it has
     * not been registered yet. IDs start at 0, increment consecutively, and are
     * never reused.
     */
    public getId(item: T): number {
        if (this.strategy === 'uninitialized') {
            this.selectStrategy(this.keyExtractor(item));
        }
        switch (this.strategy) {
            case 'objectIdentity':
                return this.getIdObjectIdentity(item);
            case 'stringIdentity':
                return this.getIdStringIdentity(item);
            case 'numberWithEquality':
                return this.getIdNumberWithEquality(item);
            default:
                throw new Error(`Canonicalizer.getId: strategy '${this.strategy}' is not supported`);
        }
    }

    /**
     * Get the integer ID for `item` only if it has already been registered.
     * Returns -1 otherwise. Never allocates a new ID.
     */
    public getExistingId(item: T): number {
        if (this.strategy === 'uninitialized') {
            return -1;
        }
        switch (this.strategy) {
            case 'objectIdentity':
                return this.getExistingIdObjectIdentity(item);
            case 'stringIdentity':
                return this.getExistingIdStringIdentity(item);
            case 'numberWithEquality':
                return this.getExistingIdNumberWithEquality(item);
            default:
                return -1;
        }
    }

    /**
     * Reverse lookup: return the item registered with `id`, or `undefined` when
     * `id` is out of bounds.
     */
    public get(id: number): T | undefined {
        if (id < 0 || id >= this.list.length) {
            return undefined;
        }
        return this.list[id];
    }

    /** Number of items currently registered. */
    public size(): number {
        return this.list.length;
    }

    /** Snapshot of the internal state. */
    public getStats(): CanonicalizerStats {
        return {
            strategy: this.strategy,
            size: this.list.length,
            bucketCount: this.strategy === 'objectIdentity' ? 0 : this.bucketCount,
            collisionCount: this.collisionCount,
        };
    }

    /**
     * Clear all mappings. For `objectIdentity`, the Symbol markers are removed
     * from the registered objects. After clearing the strategy resets to
     * `uninitialized` so the next `getId` re-selects a strategy.
     */
    public clear(): void {
        if (this.strategy === 'objectIdentity') {
            for (const obj of this.list) {
                if (obj !== null && obj !== undefined && Object.isExtensible(obj)) {
                    delete (obj as unknown as Record<symbol, unknown>)[this.idSymbol];
                }
            }
        }
        this.list = [];
        this.table = null;
        this.tableHash = null;
        this.bucketCount = 0;
        this.collisionCount = 0;
        this.strategy = 'uninitialized';
    }

    // ------------------------------------------------------------------
    // Strategy selection
    // ------------------------------------------------------------------

    private selectStrategy(key: unknown): void {
        if (this.equalityComparer !== undefined && typeof key === 'number') {
            this.strategy = 'numberWithEquality';
            this.initHashTable();
            return;
        }
        if (this.usingDefaultKeyExtractor) {
            if ((typeof key === 'object' && key !== null) || typeof key === 'function') {
                this.strategy = 'objectIdentity';
                return;
            }
            if (typeof key === 'string') {
                this.strategy = 'stringIdentity';
                this.initHashTable();
                return;
            }
        }
        throw new Error(
            `Canonicalizer: cannot select a strategy for key of type '${typeof key}'` +
                ` (defaultKeyExtractor=${this.usingDefaultKeyExtractor},` +
                ` hasEqualityComparer=${this.equalityComparer !== undefined})`,
        );
    }

    private initHashTable(): void {
        this.bucketCount = Canonicalizer.INITIAL_BUCKET_COUNT;
        this.table = new Int32Array(this.bucketCount).fill(-1);
        this.tableHash = new Int32Array(this.bucketCount);
    }

    // ------------------------------------------------------------------
    // objectIdentity strategy
    // ------------------------------------------------------------------

    private getIdObjectIdentity(item: T): number {
        const holder = item as unknown as Record<symbol, unknown>;
        const existing = holder[this.idSymbol];
        if (typeof existing === 'number') {
            return existing;
        }
        if (Object.isFrozen(item)) {
            throw new Error('Canonicalizer.getId: cannot assign an id to a frozen object');
        }
        const id = this.list.length;
        holder[this.idSymbol] = id;
        this.list.push(item);
        return id;
    }

    private getExistingIdObjectIdentity(item: T): number {
        const existing = (item as unknown as Record<symbol, unknown>)[this.idSymbol];
        return typeof existing === 'number' ? existing : -1;
    }

    // ------------------------------------------------------------------
    // stringIdentity strategy
    // ------------------------------------------------------------------

    private getIdStringIdentity(item: T): number {
        const hash = this.fnv1aString(item as unknown as string);
        const { id, slot } = this.findMatchOrSlot(hash, cid => this.list[cid] === item);
        if (id >= 0) {
            return id;
        }
        return this.placeNewItem(item, hash, slot);
    }

    private getExistingIdStringIdentity(item: T): number {
        const hash = this.fnv1aString(item as unknown as string);
        return this.findMatchOrSlot(hash, cid => this.list[cid] === item).id;
    }

    // ------------------------------------------------------------------
    // numberWithEquality strategy
    // ------------------------------------------------------------------

    private getIdNumberWithEquality(item: T): number {
        const key = this.keyExtractor(item) as number;
        const hash = this.hashNumber(key);
        const cmp = this.equalityComparer!;
        const { id, slot } = this.findMatchOrSlot(hash, cid => cmp(this.list[cid], item));
        if (id >= 0) {
            return id;
        }
        return this.placeNewItem(item, hash, slot);
    }

    private getExistingIdNumberWithEquality(item: T): number {
        const key = this.keyExtractor(item) as number;
        const hash = this.hashNumber(key);
        const cmp = this.equalityComparer!;
        return this.findMatchOrSlot(hash, cid => cmp(this.list[cid], item)).id;
    }

    // ------------------------------------------------------------------
    // Hash table helpers (stringIdentity + numberWithEquality)
    // ------------------------------------------------------------------

    /**
     * Probe the open-addressing table. Returns `{ id, slot }` where `id >= 0`
     * means a matching entry was found (slot is -1) and `id === -1` means no
     * match was found and `slot` points at the empty slot for insertion.
     */
    private findMatchOrSlot(hash: number, matches: (candidateId: number) => boolean): { id: number; slot: number } {
        const table = this.table!;
        const tableHash = this.tableHash!;
        const mask = this.bucketCount - 1;
        let slot = hash & mask;
        while (table[slot] !== -1) {
            if (tableHash[slot] === hash && matches(table[slot])) {
                return { id: table[slot], slot: -1 };
            }
            this.collisionCount++;
            slot = (slot + 1) & mask;
        }
        return { id: -1, slot };
    }

    private placeNewItem(item: T, hash: number, slot: number): number {
        const id = this.list.length;
        this.list.push(item);
        const table = this.table!;
        const tableHash = this.tableHash!;
        table[slot] = id;
        tableHash[slot] = hash;
        this.maybeResize();
        return id;
    }

    private maybeResize(): void {
        if (this.list.length / this.bucketCount < Canonicalizer.LOAD_FACTOR) {
            return;
        }
        this.bucketCount *= 2;
        const oldTable = this.table!;
        const oldHash = this.tableHash!;
        const newTable = new Int32Array(this.bucketCount).fill(-1);
        const newHash = new Int32Array(this.bucketCount);
        const mask = this.bucketCount - 1;
        for (let i = 0; i < oldTable.length; i++) {
            const id = oldTable[i];
            if (id === -1) {
                continue;
            }
            const h = oldHash[i];
            let slot = h & mask;
            while (newTable[slot] !== -1) {
                slot = (slot + 1) & mask;
            }
            newTable[slot] = id;
            newHash[slot] = h;
        }
        this.table = newTable;
        this.tableHash = newHash;
    }

    // ------------------------------------------------------------------
    // Hash functions
    // ------------------------------------------------------------------

    /** FNV-1a 32-bit hash for strings. */
    private fnv1aString(s: string): number {
        let hash = 0x811c9dc5;
        for (let i = 0; i < s.length; i++) {
            hash ^= s.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193);
        }
        return hash | 0;
    }

    /** 32-bit mixing hash for number keys. NaN and non-integers map to 0. */
    private hashNumber(n: number): number {
        let h = Math.imul(n | 0, 0x9e3779b1);
        h ^= h >>> 15;
        return h | 0;
    }
}
