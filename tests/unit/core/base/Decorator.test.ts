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
import { Decorator } from '../../../../src/core/base/Decorator';

describe('Decorator Test', () => {
    it('stores the kind passed via the constructor', () => {
        const d = new Decorator('Component');
        expect(d.getKind()).toBe('Component');
        expect(d.kind).toBe('Component');
    });

    it('defaults content and param to empty strings', () => {
        const d = new Decorator('State');
        expect(d.getContent()).toBe('');
        expect(d.getParam()).toBe('');
        expect(d.content).toBe('');
        expect(d.param).toBe('');
    });

    it('round-trips content via setContent/getContent', () => {
        const d = new Decorator('Link');
        d.setContent('Link');
        expect(d.getContent()).toBe('Link');
        d.setContent('Link2');
        expect(d.getContent()).toBe('Link2');
    });

    it('round-trips param via setParam/getParam', () => {
        const d = new Decorator('Prop');
        d.setParam('name');
        expect(d.getParam()).toBe('name');
        d.setParam('');
        expect(d.getParam()).toBe('');
    });

    it('toString uses the content, not the kind', () => {
        const d = new Decorator('Observed');
        expect(d.toString()).toBe('@');

        d.setContent('Observed');
        expect(d.toString()).toBe('@Observed');

        d.setContent('Observed("foo")');
        expect(d.toString()).toBe('@Observed("foo")');
    });

    it('exposes kind as a mutable public field', () => {
        const d = new Decorator('A');
        d.kind = 'B';
        expect(d.getKind()).toBe('B');
    });

    it('different instances do not share mutable state', () => {
        const a = new Decorator('Entry');
        const b = new Decorator('Component');

        a.setContent('Entry');
        a.setParam('main');
        b.setContent('Component');

        expect(a.getContent()).toBe('Entry');
        expect(a.getParam()).toBe('main');
        expect(b.getContent()).toBe('Component');
        expect(b.getParam()).toBe('');
    });

    it('handles empty and unicode content/param values', () => {
        const d = new Decorator('Builder');
        d.setContent('');
        d.setParam('');
        expect(d.toString()).toBe('@');

        d.setContent('装饰器');
        d.setParam('参数');
        expect(d.getContent()).toBe('装饰器');
        expect(d.getParam()).toBe('参数');
        expect(d.toString()).toBe('@装饰器');
    });
});
