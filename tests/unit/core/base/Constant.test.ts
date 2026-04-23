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
import {
    BigIntConstant,
    BooleanConstant,
    Constant,
    NullConstant,
    NumberConstant,
    StringConstant,
    UndefinedConstant,
} from '../../../../src/core/base/Constant';
import {
    BigIntType,
    BooleanType,
    NullType,
    NumberType,
    StringType,
    UndefinedType,
} from '../../../../src/core/base/Type';

describe('Constant (base)', () => {
    it('stores the value/type passed via the constructor', () => {
        const c = new Constant('42', NumberType.getInstance());
        expect(c.getValue()).toBe('42');
        expect(c.getType()).toBe(NumberType.getInstance());
    });

    it('getUses() always returns an empty array', () => {
        const c = new Constant('1', NumberType.getInstance());
        expect(c.getUses()).toEqual([]);
        expect(Array.isArray(c.getUses())).toBe(true);
    });

    it('toString quotes string-typed values with single quotes', () => {
        const s = new Constant('hi', StringType.getInstance());
        expect(s.toString()).toBe("'hi'");
    });

    it('toString returns the raw value for non-string types', () => {
        const n = new Constant('42', NumberType.getInstance());
        const b = new Constant('true', BooleanType.getInstance());
        expect(n.toString()).toBe('42');
        expect(b.toString()).toBe('true');
    });
});

describe('BooleanConstant', () => {
    it('constructor converts the boolean to its string form', () => {
        expect(new BooleanConstant(true).getValue()).toBe('true');
        expect(new BooleanConstant(false).getValue()).toBe('false');
    });

    it('reports BooleanType as its type', () => {
        expect(new BooleanConstant(true).getType()).toBe(BooleanType.getInstance());
    });

    it('getInstance returns a cached singleton per value', () => {
        const t1 = BooleanConstant.getInstance(true);
        const t2 = BooleanConstant.getInstance(true);
        const f1 = BooleanConstant.getInstance(false);
        const f2 = BooleanConstant.getInstance(false);

        expect(t1).toBe(t2);
        expect(f1).toBe(f2);
        expect(t1).not.toBe(f1);
        expect(t1.getValue()).toBe('true');
        expect(f1.getValue()).toBe('false');
    });

    it('inherits Constant behaviour (toString, getUses)', () => {
        const b = BooleanConstant.getInstance(true);
        expect(b.toString()).toBe('true');
        expect(b.getUses()).toEqual([]);
    });
});

describe('NumberConstant', () => {
    it('stores the value verbatim and uses NumberType', () => {
        const n = new NumberConstant('3.14');
        expect(n.getValue()).toBe('3.14');
        expect(n.getType()).toBe(NumberType.getInstance());
        expect(n.toString()).toBe('3.14');
    });

    it('preserves integer, zero, negative, and scientific representations', () => {
        expect(new NumberConstant('0').getValue()).toBe('0');
        expect(new NumberConstant('-5').getValue()).toBe('-5');
        expect(new NumberConstant('1e10').getValue()).toBe('1e10');
    });
});

describe('BigIntConstant', () => {
    it('appends an "n" suffix to the string form of the bigint', () => {
        expect(new BigIntConstant(BigInt(0)).getValue()).toBe('0n');
        expect(new BigIntConstant(BigInt(42)).getValue()).toBe('42n');
        expect(new BigIntConstant(BigInt(-7)).getValue()).toBe('-7n');
    });

    it('reports BigIntType as its type', () => {
        expect(new BigIntConstant(BigInt(1)).getType()).toBe(BigIntType.getInstance());
    });

    it('toString returns the raw value (unquoted)', () => {
        expect(new BigIntConstant(BigInt(100)).toString()).toBe('100n');
    });
});

describe('StringConstant', () => {
    it('stores the value and uses StringType', () => {
        const s = new StringConstant('hello');
        expect(s.getValue()).toBe('hello');
        expect(s.getType()).toBe(StringType.getInstance());
    });

    it('toString wraps the value in single quotes', () => {
        expect(new StringConstant('hello').toString()).toBe("'hello'");
        expect(new StringConstant('').toString()).toBe("''");
        expect(new StringConstant('方舟').toString()).toBe("'方舟'");
    });

    it('does not escape embedded single quotes (documents current behaviour)', () => {
        // The current implementation simply wraps with '...'; callers that
        // need escaping are expected to pre-escape their inputs.
        expect(new StringConstant("a'b").toString()).toBe("'a'b'");
    });
});

describe('NullConstant', () => {
    it('returns a cached singleton via getInstance()', () => {
        expect(NullConstant.getInstance()).toBe(NullConstant.getInstance());
    });

    it('has value "null" and NullType', () => {
        const n = NullConstant.getInstance();
        expect(n.getValue()).toBe('null');
        expect(n.getType()).toBe(NullType.getInstance());
        expect(n.toString()).toBe('null');
    });
});

describe('UndefinedConstant', () => {
    it('returns a cached singleton via getInstance()', () => {
        expect(UndefinedConstant.getInstance()).toBe(UndefinedConstant.getInstance());
    });

    it('has value "undefined" and UndefinedType', () => {
        const u = UndefinedConstant.getInstance();
        expect(u.getValue()).toBe('undefined');
        expect(u.getType()).toBe(UndefinedType.getInstance());
        expect(u.toString()).toBe('undefined');
    });
});
