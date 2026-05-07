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
import * as crypto from 'crypto';
import { CryptoUtils } from '../../src/utils/crypto_utils';

describe('CryptoUtils.sha256', () => {
    it('returns a base64url-encoded SHA-256 hash', () => {
        const input = 'hello, ArkAnalyzer';
        const expected = crypto.createHash('sha256').update(input).digest('base64url');
        expect(CryptoUtils.sha256(input)).toBe(expected);
    });

    it('is deterministic, sensitive to input, and handles edge cases', () => {
        expect(CryptoUtils.sha256('abc')).toBe(CryptoUtils.sha256('abc'));
        expect(CryptoUtils.sha256('a')).not.toBe(CryptoUtils.sha256('b'));
        expect(CryptoUtils.sha256('')).toBe(crypto.createHash('sha256').update('').digest('base64url'));
        const cn = '方舟分析器 ArkAnalyzer 🚀';
        expect(CryptoUtils.sha256(cn)).toBe(crypto.createHash('sha256').update(cn).digest('base64url'));
    });

    it('uses base64url (no +, /, or = padding)', () => {
        expect(CryptoUtils.sha256('The quick brown fox')).not.toMatch(/[+/=]/);
    });
});

describe('CryptoUtils.hash', () => {
    it('delegates to the named algorithm', () => {
        const input = 'arkanalyzer';
        expect(CryptoUtils.hash(input, 'md5')).toBe(crypto.createHash('md5').update(input).digest('base64url'));
        expect(CryptoUtils.hash(input, 'sha1')).toBe(crypto.createHash('sha1').update(input).digest('base64url'));
    });

    it('matches sha256() when called with "sha256"', () => {
        const s = 'consistency check';
        expect(CryptoUtils.hash(s, 'sha256')).toBe(CryptoUtils.sha256(s));
    });

    it('throws for unknown algorithms', () => {
        expect(() => CryptoUtils.hash('x', 'not-a-real-algo')).toThrow();
    });
});

describe('CryptoUtils.hashcode', () => {
    it('returns 0 for the empty string and is deterministic', () => {
        expect(CryptoUtils.hashcode('')).toBe(0);
        expect(CryptoUtils.hashcode('abc')).toBe(CryptoUtils.hashcode('abc'));
    });

    it('matches Java String.hashCode reference values (31*h + c)', () => {
        expect(CryptoUtils.hashcode('a')).toBe(97);
        expect(CryptoUtils.hashcode('abc')).toBe(96354);
        expect(CryptoUtils.hashcode('Hello')).toBe(69609650);
    });

    it('differs for different inputs', () => {
        expect(CryptoUtils.hashcode('foo')).not.toBe(CryptoUtils.hashcode('bar'));
    });

    it('always returns a 32-bit signed integer', () => {
        const samples = ['', 'a', 'abc', 'Hello', 'x'.repeat(1000), '方舟'];
        for (const s of samples) {
            const h = CryptoUtils.hashcode(s);
            expect(Number.isInteger(h)).toBe(true);
            expect(h).toBeGreaterThanOrEqual(-(2 ** 31));
            expect(h).toBeLessThanOrEqual(2 ** 31 - 1);
            expect(h | 0).toBe(h);
        }
    });
});
