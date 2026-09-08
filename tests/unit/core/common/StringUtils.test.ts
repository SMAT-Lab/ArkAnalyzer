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

import { describe, expect, it } from 'vitest';
import { matchCallOpenParen } from '../../../../src/core/common/StringUtils';

describe('matchCallOpenParen', () => {
    it('matches a plain call', () => {
        expect(matchCallOpenParen('foo()', 'foo')).toBe(0);
        expect(matchCallOpenParen('a1.call1()', 'call1')).toBe(3);
    });

    it('plain name( is preferred over a longer prefix identifier', () => {
        expect(matchCallOpenParen('foofoo()', 'foo')).toBeNull();
        expect(matchCallOpenParen('x.foo()', 'foo')).toBe(2);
    });

    it('matches a parenthesized callee', () => {
        expect(matchCallOpenParen('(foo)()', 'foo')).toBe(1);
    });

    it('matches call with whitespace before paren via slow path', () => {
        expect(matchCallOpenParen('foo ()', 'foo')).toBe(0);
    });

    it('matches nested generics', () => {
        expect(matchCallOpenParen('foo<Bar<T>>()', 'foo')).toBe(0);
    });

    it('does not treat => as a generic closer', () => {
        expect(matchCallOpenParen('foo<() => void>()', 'foo')).toBe(0);
        expect(matchCallOpenParen('foo<(x: () => void) => string>()', 'foo')).toBe(0);
    });

    it('does not treat > or < inside string literal types as generic brackets', () => {
        expect(matchCallOpenParen("foo<'a>b'>()", 'foo')).toBe(0);
        expect(matchCallOpenParen('foo<"x<y">()', 'foo')).toBe(0);
    });

    it('does not treat > inside comments as a generic closer', () => {
        expect(matchCallOpenParen('foo<T /* > */>()', 'foo')).toBe(0);
        expect(matchCallOpenParen('foo<T // >\n>()', 'foo')).toBe(0);
    });

    it('does not treat > inside template literal types as a generic closer', () => {
        expect(matchCallOpenParen('foo<`a>b`>()', 'foo')).toBe(0);
        expect(matchCallOpenParen('foo<`${">"}`>()', 'foo')).toBe(0);
    });

    it('returns null when name is not followed by a call', () => {
        expect(matchCallOpenParen('foo', 'foo')).toBeNull();
        expect(matchCallOpenParen('(foo)', 'foo')).toBeNull();
        expect(matchCallOpenParen('foo < bar', 'foo')).toBeNull();
    });
});
