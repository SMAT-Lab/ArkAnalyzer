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
import { ArkReturnVoidStmt, Fact } from '../../../../src';
import { NumberConstant, StringConstant } from '../../../../src/core/base/Constant';

describe('Fact Test', () => {
    it('initializes with empty values set and empty valueMap', () => {
        const f = new Fact();
        expect(f.values).toBeInstanceOf(Set);
        expect(f.valueMap).toBeInstanceOf(Map);
        expect(f.values.size).toBe(0);
        expect(f.valueMap.size).toBe(0);
    });

    it('supports adding values to the set', () => {
        const f = new Fact();
        const a = new NumberConstant('1');
        const b = new NumberConstant('2');

        f.values.add(a);
        f.values.add(b);
        f.values.add(a); // duplicate should be a no-op for Sets

        expect(f.values.size).toBe(2);
        expect(f.values.has(a)).toBe(true);
        expect(f.values.has(b)).toBe(true);
    });

    it('supports mapping values to their most-recent defining Stmt', () => {
        const f = new Fact();
        const v = new NumberConstant('42');
        const def1 = new ArkReturnVoidStmt();
        const def2 = new ArkReturnVoidStmt();

        f.valueMap.set(v, def1);
        expect(f.valueMap.get(v)).toBe(def1);

        // Overwriting represents "most recent def wins" semantics.
        f.valueMap.set(v, def2);
        expect(f.valueMap.get(v)).toBe(def2);
        expect(f.valueMap.size).toBe(1);
    });

    it('keeps values-set and valueMap logically independent', () => {
        const f = new Fact();
        const v = new StringConstant('x');

        f.values.add(v);
        expect(f.valueMap.has(v)).toBe(false);

        const def = new ArkReturnVoidStmt();
        f.valueMap.set(v, def);
        expect(f.values.has(v)).toBe(true);
        expect(f.valueMap.get(v)).toBe(def);
    });

    it('different Fact instances hold independent collections', () => {
        const a = new Fact();
        const b = new Fact();
        const v = new NumberConstant('1');

        a.values.add(v);
        expect(a.values.size).toBe(1);
        expect(b.values.size).toBe(0);
    });

    it('permits clear() on both collections', () => {
        const f = new Fact();
        const v = new NumberConstant('1');
        f.values.add(v);
        f.valueMap.set(v, new ArkReturnVoidStmt());

        f.values.clear();
        f.valueMap.clear();
        expect(f.values.size).toBe(0);
        expect(f.valueMap.size).toBe(0);
    });
});
