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
import { cloneText } from '../../src/core/common/StringUtils';

describe('cloneText', () => {
    it('returns an empty string for empty input', () => {
        expect(cloneText('')).toBe('');
    });

    it('preserves the value of short strings', () => {
        expect(cloneText('a')).toBe('a');
        expect(cloneText('myVar')).toBe('myVar');
        expect(cloneText('twelve_chars')).toBe('twelve_chars');
    });

    it('preserves the value of strings at and beyond the gating length', () => {
        const thirteen = 'thirteen_char';
        expect(thirteen.length).toBe(13);
        expect(cloneText(thirteen)).toBe(thirteen);
        const long = 'a'.repeat(64);
        expect(cloneText(long)).toBe(long);
    });

    it('preserves non-ascii text', () => {
        expect(cloneText('名称')).toBe('名称');
        const longUnicode = '中文标识符'.repeat(8);
        expect(cloneText(longUnicode)).toBe(longUnicode);
    });

    it('returns a string derived from a slice with identical value', () => {
        const source = 'const abcdefghijklmnop = 1;'.repeat(10);
        const slice = source.slice(6, 24);
        expect(cloneText(slice)).toBe(slice);
    });
});
