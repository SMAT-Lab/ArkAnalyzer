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
import { SignatureCanonicalizer, Canonicalizable } from '../../src/core/common/SignatureCanonicalizer';
import { hashString32 } from '../../src/utils/HashUtils';

interface TestSig extends Canonicalizable {
    name: string;
    toMapKey(): string;
}

function makeSig(name: string): TestSig {
    const hash = hashString32(name);
    return {
        name,
        toMapKey: () => name,
        getHashCode: () => hash,
        equals: (other: TestSig) => other.name === name,
    };
}

describe('SignatureCanonicalizer Test', () => {
    it('getId returns the same ID for signatures with the same toMapKey', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        const sig1 = makeSig('foo');
        const sig2 = makeSig('foo');
        const id1 = c.getId(sig1);
        const id2 = c.getId(sig2);
        expect(id1).toBe(id2);
        expect(id1).toBe(0);
    });

    it('getId returns different IDs for signatures with different toMapKey', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        expect(c.getId(makeSig('foo'))).toBe(0);
        expect(c.getId(makeSig('bar'))).toBe(1);
    });

    it('getId allocates consecutive IDs starting at 0', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        expect(c.getId(makeSig('a'))).toBe(0);
        expect(c.getId(makeSig('b'))).toBe(1);
        expect(c.getId(makeSig('c'))).toBe(2);
    });

    it('getId+get returns the canonical single instance', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        const sig1 = makeSig('foo');
        const sig2 = makeSig('foo');
        const a = c.get(c.getId(sig1))!;
        const b = c.get(c.getId(sig2))!;
        expect(a).toBe(sig1);
        expect(b).toBe(sig1);
        expect(a).toBe(b);
    });

    it('getId+get returns the input signature on first registration', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        const sig = makeSig('first');
        expect(c.get(c.getId(sig))!).toBe(sig);
    });

    it('getExistingId returns the existing ID without creating a new one', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        const sig = makeSig('foo');
        const id = c.getId(sig);
        expect(c.getExistingId(makeSig('foo'))).toBe(id);
        expect(c.size()).toBe(1);
    });

    it('getExistingId returns -1 for unregistered signatures', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        c.getId(makeSig('foo'));
        expect(c.getExistingId(makeSig('bar'))).toBe(-1);
        expect(c.size()).toBe(1);
    });

    it('getExistingId does not modify internal state', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        c.getId(makeSig('foo'));
        const sizeBefore = c.size();
        c.getExistingId(makeSig('unregistered'));
        expect(c.size()).toBe(sizeBefore);
    });

    it('get returns the canonical instance by ID', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        const sig = makeSig('foo');
        const id = c.getId(sig);
        expect(c.get(id)).toBe(sig);
    });

    it('get returns undefined for out-of-bounds IDs', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        expect(c.get(0)).toBeUndefined();
        expect(c.get(-1)).toBeUndefined();
        c.getId(makeSig('foo'));
        expect(c.get(99)).toBeUndefined();
    });

    it('size reports the number of unique signatures', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        expect(c.size()).toBe(0);
        c.getId(makeSig('a'));
        expect(c.size()).toBe(1);
        c.getId(makeSig('a'));
        expect(c.size()).toBe(1);
        c.getId(makeSig('b'));
        expect(c.size()).toBe(2);
    });

    it('clear resets the canonicalizer to empty state', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        c.getId(makeSig('a'));
        c.getId(makeSig('b'));
        expect(c.size()).toBe(2);
        c.clear();
        expect(c.size()).toBe(0);
        expect(c.get(0)).toBeUndefined();
    });

    it('after clear, IDs are reallocated from 0', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        c.getId(makeSig('a'));
        c.getId(makeSig('b'));
        c.clear();
        expect(c.getId(makeSig('c'))).toBe(0);
    });

    it('value-semantic deduplication: different objects with same toMapKey share ID', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        const sig1 = makeSig('shared');
        const sig2 = makeSig('shared');
        const sig3 = makeSig('shared');
        const id1 = c.getId(sig1);
        const id2 = c.getId(sig2);
        const id3 = c.getId(sig3);
        expect(id1).toBe(id2);
        expect(id2).toBe(id3);
        expect(c.size()).toBe(1);
    });

    it('getId+get ensures === comparison safety', () => {
        const c = new SignatureCanonicalizer<TestSig>();
        const sig1 = makeSig('foo');
        const sig2 = makeSig('foo');
        expect(sig1 === sig2).toBe(false);
        const a = c.get(c.getId(sig1))!;
        const b = c.get(c.getId(sig2))!;
        expect(a === b).toBe(true);
    });
});
