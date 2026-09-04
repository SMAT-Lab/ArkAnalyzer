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

import { Canonicalizer } from '../../utils/Canonicalizer';

/**
 * Interface that signatures must implement to participate in hash-based canonicalization.
 *
 * Design ported from HomeFlow's fact-id-hash-collision-design (doc/design/fact-id-hash-collision-design.md).
 * The three-layer architecture:
 * - Layer 1: `getHashCode()` — 32-bit hash computed at construction time, cached in a readonly field
 * - Layer 2: `Canonicalizer<number>` with `numberWithEquality` strategy — open-addressing + chaining
 * - Layer 3: `equals()` — per-field semantic comparison, used when hash collisions occur
 */
export interface Canonicalizable {
    /** Stable 32-bit hash code. Two equal signatures must have the same hash code. */
    getHashCode(): number;
    /** Semantic equality. Used for collision resolution in Layer 2. */
    equals(other: this): boolean;
}

/**
 * A canonicalizer that deduplicates signatures by value semantics using hash + equals.
 *
 * Replaces the previous `toMapKey()`-string-based approach with a three-layer
 * hash-collision-handling architecture:
 *
 * 1. `sig.getHashCode()` returns a cached 32-bit hash (computed once at construction)
 * 2. `Canonicalizer<S>` with `numberWithEquality` strategy uses TypedArray hash tables
 *    with open addressing + chaining for collision handling
 * 3. `sig.equals()` does per-field comparison when hash collisions occur
 *
 * This eliminates the `list: string[]` storage of `toMapKey()` strings (~500 KB-1 MB
 * for 10k-level signatures) and avoids repeated string concatenation in `toMapKey()`.
 *
 * IDs are dense integers starting from 0.
 *
 * @template S - The signature type, must implement {@link Canonicalizable}
 */
export class SignatureCanonicalizer<S extends Canonicalizable> {
    private canonicalizer: Canonicalizer<S> = new Canonicalizer<S>(
        (s: S) => s.getHashCode(),
        (a: S, b: S) => a.equals(b)
    );

    /**
     * Get the unique integer ID for a signature.
     * If a signature with the same hash and `equals()` result has been seen before, returns the existing ID.
     * Otherwise, assigns a new ID and records the signature as the canonical instance.
     *
     * @param sig - The signature to canonicalize
     * @returns The integer ID (>= 0)
     */
    public getId(sig: S): number {
        return this.canonicalizer.getId(sig);
    }

    /**
     * Get the integer ID of a signature if it already exists.
     * Returns -1 if the signature has not been canonicalized.
     * Does not create a new ID or modify internal state.
     *
     * @param sig - The signature to query
     * @returns The integer ID (>= 0) if found, -1 otherwise
     */
    public getExistingId(sig: S): number {
        return this.canonicalizer.getExistingId(sig);
    }

    /**
     * Get the canonical signature instance associated with an integer ID.
     *
     * @param id - The integer ID
     * @returns The canonical signature instance, or `undefined` if the ID is out of bounds
     */
    public get(id: number): S | undefined {
        return this.canonicalizer.get(id);
    }

    /**
     * Canonicalize a signature and return the canonical single instance.
     *
     * After `intern()`, two signatures with the same `getHashCode()` and `equals()` will return
     * the exact same object reference, making `===` comparison safe.
     *
     * @param sig - The signature to intern
     * @returns The canonical single instance
     */
    public intern(sig: S): S {
        const id = this.canonicalizer.getId(sig);
        return this.canonicalizer.get(id)!;
    }

    /**
     * Get the total number of unique signatures registered so far.
     */
    public size(): number {
        return this.canonicalizer.size();
    }

    /**
     * Get hash table statistics (for debugging/profiling).
     */
    public getStats() {
        return this.canonicalizer.getStats();
    }

    /**
     * Clear all registered signatures and reset the canonicalizer.
     */
    public clear(): void {
        this.canonicalizer.clear();
    }
}
