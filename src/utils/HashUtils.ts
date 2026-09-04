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
 * Hash primitives ported from HomeFlow's fact-id-hash-collision-design.
 *
 * These provide better avalanche properties than the FNV-1a variant in
 * `Canonicalizer.hashString` and the Java-style `CryptoUtils.hashcode`.
 *
 * Reference: doc/design/fact-id-hash-collision-design.md
 */

/** MurmurHash3-style string hash with full finalization mixing. */
export function hashString32(raw: string): number {
    let h1 = 0xdeadbeef;
    for (let i = 0; i < raw.length; i++) {
        const c = raw.charCodeAt(i);
        if (c >= 0xd800 && c <= 0xdbff && i + 1 < raw.length) {
            const next = raw.charCodeAt(i + 1);
            if (next >= 0xdc00 && next <= 0xdfff) {
                h1 = Math.imul(h1 ^ ((0x1f << 19) | ((c - 0xd800) << 10) | (next - 0xdc00)), 0x85ebca6b);
                i++;
                continue;
            }
        }
        h1 = Math.imul(h1 ^ c, 0x85ebca6b);
    }
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 16;
    return h1 >>> 0;
}

/** boost-style hash combine: mix a 32-bit value into an accumulated hash. */
export function hashCombineU32(seed: number, value: number): number {
    let h = seed >>> 0;
    h ^= Math.imul(value >>> 0, 0x9e3779b9);
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h ^= h >>> 13;
    return h >>> 0;
}

/** Combine an optional number: undefined mixes 0, defined mixes (1, value). */
export function hashCombineOptionalU32(seed: number, value: number | undefined): number {
    if (value === undefined) return hashCombineU32(seed, 0);
    return hashCombineU32(hashCombineU32(seed, 1), value);
}

/** Combine an optional string: undefined/empty mixes 0, defined mixes (1, hash). */
export function hashCombineOptionalString(seed: number, value: string | undefined): number {
    if (!value) return hashCombineU32(seed, 0);
    return hashCombineU32(hashCombineU32(seed, 1), hashString32(value));
}
