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
 * PackedSparseMap - A memory-efficient sparse index with packed storage.
 * 
 * Implements a two-level indexing structure:
 * - First level: Owner-based segmentation (sparse)
 * - Second level: Sorted key-value pairs within each owner (packed)
 * 
 */
export class PackedSparseMap {
    private offsets: Int32Array;
    private lengths: Int32Array;
    private capacities: Int32Array;
    private keys: Int32Array;
    private values: Int32Array;
    private poolSize: number = 0;
    private poolCapacity: number;

    constructor(initialOwnerCapacity: number, initialPoolCapacity: number) {
        const ownerSize = Math.max(1, initialOwnerCapacity);
        this.offsets = new Int32Array(ownerSize).fill(0);
        this.lengths = new Int32Array(ownerSize).fill(0);
        this.capacities = new Int32Array(ownerSize).fill(0);
        this.poolCapacity = Math.max(1024, initialPoolCapacity);
        this.keys = new Int32Array(this.poolCapacity);
        this.values = new Int32Array(this.poolCapacity);
    }

    public getOrInsert(owner: number, key: number, createValue: () => number): number {
        this.ensureOwnerCapacity(owner);

        const offset = this.offsets[owner];
        const length = this.lengths[owner];
        const searchResult = this.binarySearch(offset, length, key);
        if (searchResult.found) {
            return this.values[offset + searchResult.index];
        }

        this.ensureOwnerListCapacity(owner, length + 1);

        const updatedOffset = this.offsets[owner];
        const updatedLength = this.lengths[owner];
        const insertPos = this.binarySearchInsertPosition(updatedOffset, updatedLength, key);

        for (let i = updatedLength; i > insertPos; i--) {
            this.keys[updatedOffset + i] = this.keys[updatedOffset + i - 1];
            this.values[updatedOffset + i] = this.values[updatedOffset + i - 1];
        }

        const value = createValue();
        this.keys[updatedOffset + insertPos] = key;
        this.values[updatedOffset + insertPos] = value;
        this.lengths[owner] = updatedLength + 1;
        return value;
    }

    private binarySearch(offset: number, length: number, key: number): { found: boolean; index: number } {
        let low = 0;
        let high = length - 1;

        while (low <= high) {
            const mid = (low + high) >>> 1;
            const current = this.keys[offset + mid];
            if (current === key) {
                return { found: true, index: mid };
            }
            if (current < key) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return { found: false, index: low };
    }

    private binarySearchInsertPosition(offset: number, length: number, key: number): number {
        return this.binarySearch(offset, length, key).index;
    }

    private ensureOwnerCapacity(owner: number): void {
        if (owner < this.offsets.length) {
            return;
        }
        let newSize = this.offsets.length;
        if (newSize === 0) {
            newSize = 1;
        }
        while (newSize <= owner) {
            newSize <<= 1;
        }
        this.resizeOwners(newSize);
    }

    private ensureOwnerListCapacity(owner: number, required: number): void {
        const cap = this.capacities[owner];
        if (cap >= required) {
            return;
        }

        const newCap = cap === 0 ? Math.max(4, required) : Math.max(cap << 1, required);
        this.ensurePoolCapacity(newCap);

        const oldOffset = this.offsets[owner];
        const len = this.lengths[owner];
        const newOffset = this.poolSize;

        for (let i = 0; i < len; i++) {
            this.keys[newOffset + i] = this.keys[oldOffset + i];
            this.values[newOffset + i] = this.values[oldOffset + i];
        }

        this.offsets[owner] = newOffset;
        this.capacities[owner] = newCap;
        this.poolSize += newCap;
    }

    private ensurePoolCapacity(additional: number): void {
        const required = this.poolSize + additional;
        if (required <= this.poolCapacity) {
            return;
        }
        let newCapacity = Math.max(this.poolCapacity << 1, 1024);
        while (newCapacity < required) {
            newCapacity <<= 1;
        }

        const newKeys = new Int32Array(newCapacity);
        const newValues = new Int32Array(newCapacity);
        newKeys.set(this.keys);
        newValues.set(this.values);

        this.keys = newKeys;
        this.values = newValues;
        this.poolCapacity = newCapacity;
    }

    private resizeOwners(newSize: number): void {
        const newOffsets = new Int32Array(newSize);
        const newLengths = new Int32Array(newSize);
        const newCaps = new Int32Array(newSize);
        newOffsets.set(this.offsets);
        newLengths.set(this.lengths);
        newCaps.set(this.capacities);
        this.offsets = newOffsets;
        this.lengths = newLengths;
        this.capacities = newCaps;
    }
}

