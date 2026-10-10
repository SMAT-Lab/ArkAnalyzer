/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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
 * A reusable, allocation-free visited tracker for hot recursive resolutions that formerly
 * paid a `new Set()` (often as a default argument) per top-level call.
 *
 * Each logical traversal owns a segment: enter() marks a new base on the shared items array
 * and returns the previous base; has()/add() operate on [base, top); leave(prevBase) nulls
 * the segment out and restores the previous base, so nested top-level traversals stack safely
 * on one instance. Resets are cursor-based - truncating a V8 array with length=0 would drop
 * its backing store and reallocate on every refill. Membership is a linear pointer scan,
 * which beats Set hashing (~50ns/op) for the shallow depths these traversals reach.
 */
export class VisitedSegment<T> {
    private readonly items: T[] = [];
    private base = 0;
    private top = 0;

    public enter(): number {
        const prev = this.base;
        this.base = this.top;
        return prev;
    }

    /** Identity scan over the active segment; `null`/`undefined` never match, so a maybe-absent item can be passed directly. */
    public has(item: T | null | undefined): boolean {
        for (let i = this.base; i < this.top; i++) {
            if (this.items[i] === item) {
                return true;
            }
        }
        return false;
    }

    public add(item: T): void {
        this.items[this.top++] = item;
    }

    public isEmpty(): boolean {
        return this.top === this.base;
    }

    public leave(prevBase: number): void {
        const nullItem = null as unknown as T;
        for (let i = this.base; i < this.top; i++) {
            this.items[i] = nullItem;
        }
        this.top = this.base;
        this.base = prevBase;
    }
}
