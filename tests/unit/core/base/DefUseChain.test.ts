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
import { ArkReturnVoidStmt, DefUseChain } from '../../../../src';
import { NumberConstant } from '../../../../src/core/base/Constant';

describe('DefUseChain Test', () => {
    it('stores value/def/use passed via the constructor', () => {
        const v = new NumberConstant('1');
        const def = new ArkReturnVoidStmt();
        const use = new ArkReturnVoidStmt();

        const chain = new DefUseChain(v, def, use);
        expect(chain.value).toBe(v);
        expect(chain.def).toBe(def);
        expect(chain.use).toBe(use);
    });

    it('permits def and use to refer to the same Stmt instance', () => {
        const v = new NumberConstant('42');
        const stmt = new ArkReturnVoidStmt();
        const chain = new DefUseChain(v, stmt, stmt);

        expect(chain.def).toBe(stmt);
        expect(chain.use).toBe(stmt);
        expect(chain.def).toBe(chain.use);
    });

    it('does not mutate the passed-in value/def/use', () => {
        const v = new NumberConstant('7');
        const def = new ArkReturnVoidStmt();
        const use = new ArkReturnVoidStmt();

        new DefUseChain(v, def, use);

        expect(v.getValue()).toBe('7');
        expect(def).toBeInstanceOf(ArkReturnVoidStmt);
        expect(use).toBeInstanceOf(ArkReturnVoidStmt);
    });

    it('different chains are independent', () => {
        const v1 = new NumberConstant('1');
        const v2 = new NumberConstant('2');
        const d1 = new ArkReturnVoidStmt();
        const d2 = new ArkReturnVoidStmt();
        const u1 = new ArkReturnVoidStmt();
        const u2 = new ArkReturnVoidStmt();

        const a = new DefUseChain(v1, d1, u1);
        const b = new DefUseChain(v2, d2, u2);

        expect(a.value).not.toBe(b.value);
        expect(a.def).not.toBe(b.def);
        expect(a.use).not.toBe(b.use);
    });

    it('fields are writable (no readonly enforcement at runtime)', () => {
        const v1 = new NumberConstant('1');
        const v2 = new NumberConstant('2');
        const def = new ArkReturnVoidStmt();
        const use = new ArkReturnVoidStmt();
        const chain = new DefUseChain(v1, def, use);

        chain.value = v2;
        expect(chain.value).toBe(v2);
    });
});
