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
 * A memory-efficient Map-like structure where keys are integers and values are lists of integers.
 * Uses a static linked list approach based on TypedArrays (SoA) to avoid JS object overhead.
 * 
 * Memory per entry: 8 bytes (value + next pointer).
 * Memory per key: 4 bytes (head pointer).
 */
export class IntMap {
    private heads: Int32Array;
    private values: Int32Array;
    private nexts: Int32Array;
    private count: number = 0;
    private capacity: number;
    private keyRange: number;

    /**
     * @param keyRange - The maximum value of keys (nodeCapacity).
     * @param initialCapacity - The initial total number of values across all keys.
     */
    constructor(keyRange: number, initialCapacity: number = 1024) {
        this.keyRange = keyRange;
        this.capacity = initialCapacity;
        this.heads = new Int32Array(keyRange).fill(-1);
        this.values = new Int32Array(initialCapacity);
        this.nexts = new Int32Array(initialCapacity);
    }

    /**
     * Add a value to the list associated with the key.
     */
    public add(key: number, value: number): void {
        if (key >= this.keyRange) {
            this.resizeHeads(key + 1);
        }

        if (this.count >= this.capacity) {
            this.resizeCapacity();
        }

        const idx = this.count++;
        this.values[idx] = value;
        this.nexts[idx] = this.heads[key];
        this.heads[key] = idx;
    }

    /**
     * Check if the list for a key contains a value.
     */
    public contains(key: number, value: number): boolean {
        if (key >= this.keyRange) {
            return false;
        }
        let curr = this.heads[key];
        while (curr !== -1) {
            if (this.values[curr] === value) {
                return true;
            }
            curr = this.nexts[curr];
        }
        return false;
    }

    /**
     * Add a value only if it doesn't already exist in the key's list.
     */
    public addUnique(key: number, value: number): boolean {
        if (this.contains(key, value)) {
            return false;
        }
        this.add(key, value);
        return true;
    }

    /**
     * Get an iterator for the values associated with a key.
     * Efficient for loops: for (const v of map.getValues(key)) { ... }
     */
    public *getValues(key: number): IterableIterator<number> {
        if (key >= this.keyRange) {
            return;
        }
        let curr = this.heads[key];
        while (curr !== -1) {
            yield this.values[curr];
            curr = this.nexts[curr];
        }
    }

    /**
     * Get all values as an array (less efficient due to allocation).
     */
    public getAsArray(key: number): number[] {
        const result: number[] = [];
        if (key >= this.keyRange) {
            return result;
        }
        let curr = this.heads[key];
        while (curr !== -1) {
            result.push(this.values[curr]);
            curr = this.nexts[curr];
        }
        return result;
    }

    /**
     * Check if a key has any values.
     */
    public has(key: number): boolean {
        if (key >= this.keyRange) {
            return false;
        }
        return this.heads[key] !== -1;
    }

    private resizeHeads(newRange: number): void {
        const newHeads = new Int32Array(newRange * 2).fill(-1);
        newHeads.set(this.heads);
        this.heads = newHeads;
        this.keyRange = newHeads.length;
    }

    private resizeCapacity(): void {
        const newCapacity = this.capacity * 2;
        const newValues = new Int32Array(newCapacity);
        const newNexts = new Int32Array(newCapacity);
        newValues.set(this.values);
        newNexts.set(this.nexts);
        this.values = newValues;
        this.nexts = newNexts;
        this.capacity = newCapacity;
    }
}

