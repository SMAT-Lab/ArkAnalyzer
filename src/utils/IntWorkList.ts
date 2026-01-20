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
 * High-performance circular buffer worklist for integer IDs.
 * Uses Int32Array to avoid object allocation and GC overhead.
 */
export class IntWorkList {
    private buffer: Int32Array;
    private head: number = 0;
    private tail: number = 0;
    private count: number = 0;
    private capacity: number;
    private mask: number;

    // Default start with 1K capacity 
    constructor(initialCapacity: number = 1024) {
        // Ensure power of 2 capacity for efficient masking
        this.capacity = 1;
        while (this.capacity < initialCapacity) {
            this.capacity <<= 1;
        }
        this.mask = this.capacity - 1;
        this.buffer = new Int32Array(this.capacity);
    }

    /**
     * Add a value to the end of the worklist.
     */
    public push(value: number): void {
        if (this.count === this.capacity) {
            this.resize();
        }
        this.buffer[this.tail] = value;
        this.tail = (this.tail + 1) & this.mask;
        this.count++;
    }

    /**
     * Remove and return the value from the front of the worklist.
     * Returns undefined if empty.
     */
    public pop(): number | undefined {
        if (this.count === 0) {
            return undefined;
        }
        const value = this.buffer[this.head];
        this.head = (this.head + 1) & this.mask;
        this.count--;
        return value;
    }
    
    /**
     * Check if the worklist is empty.
     */
    public isEmpty(): boolean {
        return this.count === 0;
    }
    
    /**
     * Get the number of elements in the worklist.
     */
    public size(): number {
        return this.count;
    }

    /**
     * Double the capacity of the buffer.
     */
    private resize(): void {
        const oldCapacity = this.capacity;
        const newCapacity = oldCapacity << 1;
        const newBuffer = new Int32Array(newCapacity);
        
        // Copy data to the beginning of the new buffer to linearize it
        if (this.count > 0) {
            if (this.head < this.tail) {
                newBuffer.set(this.buffer.subarray(this.head, this.tail), 0);
            } else {
                const firstPartLen = oldCapacity - this.head;
                newBuffer.set(this.buffer.subarray(this.head, oldCapacity), 0);
                newBuffer.set(this.buffer.subarray(0, this.tail), firstPartLen);
            }
        }
        
        this.buffer = newBuffer;
        this.capacity = newCapacity;
        this.mask = newCapacity - 1;
        this.head = 0;
        this.tail = this.count;
    }
}
