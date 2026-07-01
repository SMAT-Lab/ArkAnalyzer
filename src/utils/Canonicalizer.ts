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

const MIN_TABLE_CAPACITY = 16;
const DEFAULT_LOAD_FACTOR = 0.7;
const MAX_TABLE_CAPACITY = 0x40000000;

type CanonicalizerStrategy = 'uninitialized' | 'objectIdentity' | 'numberWithEquality' | 'stringIdentity';

interface CanonicalizerStats {
    strategy: CanonicalizerStrategy;
    size: number;
    bucketCount: number;
    collisionCount: number;
    maxChainLength: number;
    unsupportedKeyFailures: number;
}

function nextPowerOfTwoAtLeast(value: number): number {
    let capacity = MIN_TABLE_CAPACITY;
    while (capacity < value) {
        capacity *= 2;
        if (capacity > MAX_TABLE_CAPACITY) {
            throw new Error(`Canonicalizer table capacity ${value} exceeds supported capacity`);
        }
    }
    return capacity;
}

function mixNumber(value: number): number {
    let hash = Math.imul(value ^ 0x9e3779b9, 0x85ebca6b);
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x7feb352d);
    hash ^= hash >>> 15;
    return hash;
}

function hashString(value: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    hash ^= hash >>> 16;
    return hash;
}

/**
 * Utility class to map objects to dense integer IDs.
 * Used for performance optimization to replace object-based maps/sets with array-based structures.
 *
 * @template T - The type of items to canonicalize
 */
export class Canonicalizer<T> {
    // Array from integer ID to Item
    private list: T[] = [];

    private keyExtractor: (item: T) => unknown;
    private equalityComparer?: (a: T, b: T) => boolean;
    private readonly usesDefaultKeyExtractor: boolean;

    private strategy: CanonicalizerStrategy = 'uninitialized';
    private objectIdSymbol: symbol = Symbol('HomeFlowCanonicalizerId');

    private numberKeys: Int32Array = new Int32Array(0);
    private numberHeads: Int32Array = new Int32Array(0);
    private numberOccupied: Uint8Array = new Uint8Array(0);
    private stringHashes: Int32Array = new Int32Array(0);
    private stringHeads: Int32Array = new Int32Array(0);
    private stringOccupied: Uint8Array = new Uint8Array(0);
    private nextById: Int32Array = new Int32Array(0);

    private bucketCount: number = 0;
    private threshold: number = 0;
    private mask: number = 0;
    private collisionCount: number = 0;
    private maxChainLength: number = 0;
    private unsupportedKeyFailures: number = 0;

    private scratchFoundStored: T | undefined = undefined;

    /**
     * @param keyExtractor - Function to extract a unique key from an item.
     *                       Defaults to identity (using the item itself as key).
     */
    constructor( keyExtractor?: (item: T) => unknown,
                 equalityComparer?: (a: T, b: T) => boolean) {
        this.usesDefaultKeyExtractor = keyExtractor === undefined;
        this.keyExtractor = keyExtractor ?? ((i) => i);
        this.equalityComparer = equalityComparer;
    }

    /**
     * Get the unique integer ID for an item.
     * If the item (or its key) has been seen before, returns the existing ID.
     * Otherwise, assigns a new ID.
     */
    public getId(item: T): number {
        const key = this.keyExtractor(item);
        this.ensureStrategy(key, item);

        if (this.strategy === 'objectIdentity') {
            return this.getObjectIdentityId(item, key);
        }
        if (this.strategy === 'numberWithEquality') {
            return this.getNumberKeyId(key as number, item);
        }
        if (this.strategy === 'stringIdentity') {
            return this.getStringKeyId(key as string, item);
        }

        return this.failUnsupportedKey(key);
    }

    private hasDuplicateKeyResolver(item: T): item is T & { preferCanonicalRepresentative(existing: T): T } {
        return (
            item !== null &&
            item !== undefined &&
            typeof (item as { preferCanonicalRepresentative?: unknown })
                .preferCanonicalRepresentative === 'function'
        );
    }

    private maybeUpdateRepresentative(id: number, incoming: T, stored: T): void {
        if (this.hasDuplicateKeyResolver(incoming)) {
            this.list[id] = incoming.preferCanonicalRepresentative(stored);
        }
    }

    /**
     * Get the integer ID of an item if it already exists.
     * Returns -1 if the item has not been canonicalized.
     */
    public getExistingId(item: T): number {
        const key = this.keyExtractor(item);
        this.ensureStrategy(key, item);

        if (this.strategy === 'objectIdentity') {
            return this.getExistingObjectIdentityId(item, key);
        }
        if (this.strategy === 'numberWithEquality') {
            return this.getExistingNumberKeyId(key as number, item);
        }
        if (this.strategy === 'stringIdentity') {
            return this.getExistingStringKeyId(key as string, item);
        }

        return this.failUnsupportedKey(key);
    }

    /**
     * Get the item associated with an integer ID.
     */
    public get(id: number): T | undefined {
        return this.list[id];
    }

    /**
     * Get the total number of unique items seen so far.
     */
    public size(): number {
        return this.list.length;
    }

    public getStats(): CanonicalizerStats {
        return {
            strategy: this.strategy,
            size: this.list.length,
            bucketCount: this.bucketCount,
            collisionCount: this.collisionCount,
            maxChainLength: this.maxChainLength,
            unsupportedKeyFailures: this.unsupportedKeyFailures,
        };
    }

    /**
     * Clear all mappings.
     */
    public clear(): void {
        if (this.strategy === 'objectIdentity') {
            for (const item of this.list) {
                const candidate = item as unknown;
                if ((typeof candidate === 'object' && candidate !== null) || typeof candidate === 'function') {
                    delete (candidate as { [key: symbol]: number | undefined })[this.objectIdSymbol];
                }
            }
        }
        this.list = [];
        this.strategy = 'uninitialized';
        this.objectIdSymbol = Symbol('HomeFlowCanonicalizerId');
        this.numberKeys = new Int32Array(0);
        this.numberHeads = new Int32Array(0);
        this.numberOccupied = new Uint8Array(0);
        this.stringHashes = new Int32Array(0);
        this.stringHeads = new Int32Array(0);
        this.stringOccupied = new Uint8Array(0);
        this.nextById = new Int32Array(0);
        this.bucketCount = 0;
        this.threshold = 0;
        this.mask = 0;
        this.collisionCount = 0;
        this.maxChainLength = 0;
        this.unsupportedKeyFailures = 0;
    }

    private ensureStrategy(key: unknown, item: T): void {
        if (this.strategy !== 'uninitialized') {
            return;
        }

        if (!this.equalityComparer && this.usesDefaultKeyExtractor && this.isObjectLike(key) && key === item) {
            this.strategy = 'objectIdentity';
            return;
        }

        if (!this.equalityComparer && this.usesDefaultKeyExtractor && typeof key === 'string') {
            this.strategy = 'stringIdentity';
            this.initializeStringTable();
            return;
        }

        if (this.equalityComparer && typeof key === 'number' && Number.isInteger(key)) {
            this.strategy = 'numberWithEquality';
            this.initializeNumberTable();
            return;
        }

        this.failUnsupportedKey(key);
    }

    private getObjectIdentityId(item: T, key: unknown): number {
        if (!this.isObjectLike(key) || key !== item) {
            return this.failUnsupportedKey(key);
        }

        const objectKey = key as { [key: symbol]: number | undefined };
        const existing = objectKey[this.objectIdSymbol];
        if (existing !== undefined) {
            return existing;
        }

        if (!Object.isExtensible(key)) {
            throw new Error('Canonicalizer objectIdentity strategy requires extensible objects');
        }

        const id = this.list.length;
        objectKey[this.objectIdSymbol] = id;
        this.list.push(item);
        return id;
    }

    private getExistingObjectIdentityId(item: T, key: unknown): number {
        if (!this.isObjectLike(key) || key !== item) {
            return this.failUnsupportedKey(key);
        }
        const existing = (key as { [key: symbol]: number | undefined })[this.objectIdSymbol];
        return existing === undefined ? -1 : existing;
    }

    private getNumberKeyId(key: number, item: T): number {
        if (!Number.isInteger(key)) {
            return this.failUnsupportedKey(key);
        }
        const slot = this.findNumberSlot(key);
        if (this.numberOccupied[slot] !== 0) {
            let chainLength = 0;
            let id = this.numberHeads[slot];
            while (id !== -1) {
                chainLength++;
                const stored = this.list[id]!;
                if (this.equalityComparer!(item, stored)) {
                    this.scratchFoundStored = stored;
                    this.maybeUpdateRepresentative(id, item, stored);
                    this.updateMaxChainLength(chainLength);
                    return id;
                }
                id = this.nextById[id];
            }
            this.collisionCount++;
            this.updateMaxChainLength(chainLength + 1);
            return this.appendNumberId(slot, key, item);
        }

        return this.appendNumberBucket(slot, key, item);
    }

    private getExistingNumberKeyId(key: number, item: T): number {
        if (!Number.isInteger(key)) {
            return this.failUnsupportedKey(key);
        }
        const slot = this.findExistingNumberSlot(key);
        if (slot < 0) {
            return -1;
        }

        let id = this.numberHeads[slot];
        while (id !== -1) {
            if (this.equalityComparer!(item, this.list[id]!)) {
                return id;
            }
            id = this.nextById[id];
        }
        return -1;
    }

    private getStringKeyId(key: string, item: T): number {
        const hash = hashString(key);
        const slot = this.findStringSlot(hash, key);
        if (this.stringOccupied[slot] !== 0) {
            return this.findStringIdOrAppend(slot, key, item);
        }
        return this.appendStringBucket(slot, hash, item);
    }

    private getExistingStringKeyId(key: string, item: T): number {
        if (!this.usesDefaultKeyExtractor || item !== key as unknown as T) {
            return this.failUnsupportedKey(key);
        }

        const hash = hashString(key);
        const slot = this.findExistingStringSlot(hash, key);
        if (slot < 0) {
            return -1;
        }

        let id = this.stringHeads[slot];
        while (id !== -1) {
            if (this.list[id] === key as unknown as T) {
                return id;
            }
            id = this.nextById[id];
        }
        return -1;
    }

    private findStringIdOrAppend(slot: number, key: string, item: T): number {
        if (!this.usesDefaultKeyExtractor || item !== key as unknown as T) {
            return this.failUnsupportedKey(key);
        }

        let chainLength = 0;
        let id = this.stringHeads[slot];
        while (id !== -1) {
            chainLength++;
            if (this.list[id] === key as unknown as T) {
                this.updateMaxChainLength(chainLength);
                return id;
            }
            id = this.nextById[id];
        }
        this.collisionCount++;
        this.updateMaxChainLength(chainLength + 1);
        return this.appendStringId(slot, item);
    }

    private appendNumberBucket(slot: number, key: number, item: T): number {
        this.ensureBucketCapacityForInsert('numberWithEquality');
        const insertSlot = this.findNumberSlot(key);
        const id = this.list.length;
        this.ensureNextCapacity(id + 1);
        this.numberKeys[insertSlot] = key | 0;
        this.numberHeads[insertSlot] = id;
        this.numberOccupied[insertSlot] = 1;
        this.nextById[id] = -1;
        this.bucketCount++;
        this.updateMaxChainLength(1);
        this.list.push(item);
        return id;
    }

    private appendNumberId(slot: number, key: number, item: T): number {
        const id = this.list.length;
        this.ensureNextCapacity(id + 1);
        this.nextById[id] = this.numberHeads[slot];
        this.numberHeads[slot] = id;
        this.list.push(item);
        return id;
    }

    private appendStringBucket(slot: number, hash: number, item: T): number {
        this.ensureBucketCapacityForInsert('stringIdentity');
        const insertSlot = this.findStringSlot(hash, item as unknown as string);
        const id = this.list.length;
        this.ensureNextCapacity(id + 1);
        this.stringHashes[insertSlot] = hash;
        this.stringHeads[insertSlot] = id;
        this.stringOccupied[insertSlot] = 1;
        this.nextById[id] = -1;
        this.bucketCount++;
        this.updateMaxChainLength(1);
        this.list.push(item);
        return id;
    }

    private appendStringId(slot: number, item: T): number {
        const id = this.list.length;
        this.ensureNextCapacity(id + 1);
        this.nextById[id] = this.stringHeads[slot];
        this.stringHeads[slot] = id;
        this.list.push(item);
        return id;
    }

    private initializeNumberTable(expectedEntries: number = 1024): void {
        const capacity = nextPowerOfTwoAtLeast(Math.ceil(expectedEntries / DEFAULT_LOAD_FACTOR));
        this.numberKeys = new Int32Array(capacity);
        this.numberHeads = new Int32Array(capacity).fill(-1);
        this.numberOccupied = new Uint8Array(capacity);
        this.nextById = new Int32Array(Math.max(16, expectedEntries)).fill(-1);
        this.mask = capacity - 1;
        this.threshold = Math.max(1, Math.floor(capacity * DEFAULT_LOAD_FACTOR));
    }

    private initializeStringTable(expectedEntries: number = 1024): void {
        const capacity = nextPowerOfTwoAtLeast(Math.ceil(expectedEntries / DEFAULT_LOAD_FACTOR));
        this.stringHashes = new Int32Array(capacity);
        this.stringHeads = new Int32Array(capacity).fill(-1);
        this.stringOccupied = new Uint8Array(capacity);
        this.nextById = new Int32Array(Math.max(16, expectedEntries)).fill(-1);
        this.mask = capacity - 1;
        this.threshold = Math.max(1, Math.floor(capacity * DEFAULT_LOAD_FACTOR));
    }

    private ensureBucketCapacityForInsert(strategy: 'numberWithEquality' | 'stringIdentity'): void {
        if (this.bucketCount + 1 <= this.threshold) {
            return;
        }

        if (strategy === 'numberWithEquality') {
            this.rehashNumberTable(this.numberKeys.length * 2);
        } else {
            this.rehashStringTable(this.stringHashes.length * 2);
        }
    }

    private ensureNextCapacity(required: number): void {
        if (required <= this.nextById.length) {
            return;
        }
        let newCapacity = this.nextById.length === 0 ? 16 : this.nextById.length;
        while (newCapacity < required) {
            newCapacity *= 2;
        }
        const next = new Int32Array(newCapacity).fill(-1);
        next.set(this.nextById);
        this.nextById = next;
    }

    private findNumberSlot(key: number): number {
        let slot = mixNumber(key | 0) & this.mask;
        while (this.numberOccupied[slot] !== 0 && this.numberKeys[slot] !== (key | 0)) {
            slot = (slot + 1) & this.mask;
        }
        return slot;
    }

    private findExistingNumberSlot(key: number): number {
        let slot = mixNumber(key | 0) & this.mask;
        while (this.numberOccupied[slot] !== 0) {
            if (this.numberKeys[slot] === (key | 0)) {
                return slot;
            }
            slot = (slot + 1) & this.mask;
        }
        return -1;
    }

    private findStringSlot(hash: number, key: string): number {
        let slot = mixNumber(hash) & this.mask;
        while (this.stringOccupied[slot] !== 0) {
            if (this.stringHashes[slot] === hash && this.stringBucketContainsKey(slot, key)) {
                return slot;
            }
            slot = (slot + 1) & this.mask;
        }
        return slot;
    }

    private findExistingStringSlot(hash: number, key: string): number {
        let slot = mixNumber(hash) & this.mask;
        while (this.stringOccupied[slot] !== 0) {
            if (this.stringHashes[slot] === hash && this.stringBucketContainsKey(slot, key)) {
                return slot;
            }
            slot = (slot + 1) & this.mask;
        }
        return -1;
    }

    private stringBucketContainsKey(slot: number, key: string): boolean {
        let id = this.stringHeads[slot];
        while (id !== -1) {
            if (this.list[id] === key as unknown as T) {
                return true;
            }
            id = this.nextById[id];
        }
        return false;
    }

    private rehashNumberTable(newCapacity: number): void {
        this.initializeNumberTableWithCapacity(newCapacity);
        const items = this.list;
        this.list = [];
        for (const item of items) {
            const key = this.keyExtractor(item) as number;
            const slot = this.findNumberSlot(key);
            if (this.numberOccupied[slot] === 0) {
                this.appendNumberBucket(slot, key, item);
            } else {
                this.appendNumberId(slot, key, item);
            }
        }
    }

    private rehashStringTable(newCapacity: number): void {
        this.initializeStringTableWithCapacity(newCapacity);
        const items = this.list;
        this.list = [];
        for (const item of items) {
            const key = this.keyExtractor(item) as string;
            const hash = hashString(key);
            const slot = this.findStringSlot(hash, key);
            if (this.stringOccupied[slot] === 0) {
                this.appendStringBucket(slot, hash, item);
            } else {
                this.appendStringId(slot, item);
            }
        }
    }

    private initializeNumberTableWithCapacity(capacity: number): void {
        if (capacity > MAX_TABLE_CAPACITY) {
            throw new Error(`Canonicalizer number table capacity ${capacity} exceeds supported capacity`);
        }
        this.numberKeys = new Int32Array(capacity);
        this.numberHeads = new Int32Array(capacity).fill(-1);
        this.numberOccupied = new Uint8Array(capacity);
        this.nextById = new Int32Array(Math.max(16, this.list.length * 2)).fill(-1);
        this.mask = capacity - 1;
        this.threshold = Math.max(1, Math.floor(capacity * DEFAULT_LOAD_FACTOR));
        this.bucketCount = 0;
    }

    private initializeStringTableWithCapacity(capacity: number): void {
        if (capacity > MAX_TABLE_CAPACITY) {
            throw new Error(`Canonicalizer string table capacity ${capacity} exceeds supported capacity`);
        }
        this.stringHashes = new Int32Array(capacity);
        this.stringHeads = new Int32Array(capacity).fill(-1);
        this.stringOccupied = new Uint8Array(capacity);
        this.nextById = new Int32Array(Math.max(16, this.list.length * 2)).fill(-1);
        this.mask = capacity - 1;
        this.threshold = Math.max(1, Math.floor(capacity * DEFAULT_LOAD_FACTOR));
        this.bucketCount = 0;
    }

    private updateMaxChainLength(length: number): void {
        if (length > this.maxChainLength) {
            this.maxChainLength = length;
        }
    }

    private isObjectLike(value: unknown): boolean {
        return (typeof value === 'object' && value !== null) || typeof value === 'function';
    }

    private failUnsupportedKey(key: unknown): never {
        this.unsupportedKeyFailures++;
        const keyType = key === null ? 'null' : typeof key;
        throw new Error(`Canonicalizer does not support key type '${keyType}' without an explicit optimized strategy`);
    }

    /**
     * Returns the stored item that was found during the last successful
     * {@link getNumberKeyId} lookup, or `undefined` if no such lookup has
     * occurred. This is a scratch field carried over from the homeflow
     * implementation.
     */
    public getScratchFoundStored(): T | undefined {
        return this.scratchFoundStored;
    }
}
