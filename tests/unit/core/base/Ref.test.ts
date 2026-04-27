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
    ArkArrayRef,
    ArkCaughtExceptionRef,
    ArkInstanceFieldRef,
    ArkParameterRef,
    ArkReturnVoidStmt,
    ArkStaticFieldRef,
    ArkThisRef,
    ArrayType,
    ClassSignature,
    ClassType,
    ClosureFieldRef,
    FieldSignature,
    GlobalRef,
    Local,
    NumberType,
    StringType,
    UnknownType,
} from '../../../../src';
import { NumberConstant } from '../../../../src/core/base/Constant';

const intArrayType = new ArrayType(NumberType.getInstance(), 1);
const arrayLocal = new Local('arr', intArrayType);
const intIndex = new NumberConstant('0');
const sampleClassType = new ClassType(ClassSignature.DEFAULT);

describe('ArkArrayRef', () => {
    it('stores base and index from the constructor', () => {
        const ref = new ArkArrayRef(arrayLocal, intIndex);
        expect(ref.getBase()).toBe(arrayLocal);
        expect(ref.getIndex()).toBe(intIndex);
    });

    it('setBase and setIndex update the references', () => {
        const ref = new ArkArrayRef(arrayLocal, intIndex);
        const newBase = new Local('arr2', intArrayType);
        const newIdx = new NumberConstant('1');
        ref.setBase(newBase);
        ref.setIndex(newIdx);
        expect(ref.getBase()).toBe(newBase);
        expect(ref.getIndex()).toBe(newIdx);
    });

    it('getType returns the element type when base is ArrayType', () => {
        const ref = new ArkArrayRef(arrayLocal, intIndex);
        expect(ref.getType()).toBe(NumberType.getInstance());
    });

    it('getType falls back to UnknownType when base is not ArrayType', () => {
        const nonArr = new Local('x', NumberType.getInstance());
        const ref = new ArkArrayRef(nonArr, intIndex);
        expect(ref.getType()).toBe(UnknownType.getInstance());
    });

    it('getUses includes base and index plus their transitive uses', () => {
        const ref = new ArkArrayRef(arrayLocal, intIndex);
        const uses = ref.getUses();
        expect(uses).toContain(arrayLocal);
        expect(uses).toContain(intIndex);
    });

    it('toString uses base[index] formatting', () => {
        const ref = new ArkArrayRef(arrayLocal, intIndex);
        expect(ref.toString()).toBe('arr[0]');
    });
});

describe('ArkInstanceFieldRef', () => {
    it('exposes the base, field signature, field name and dynamic flag', () => {
        const sig = new FieldSignature('foo', ClassSignature.DEFAULT, NumberType.getInstance(), false);
        const base = new Local('obj', sampleClassType);
        const ref = new ArkInstanceFieldRef(base, sig);

        expect(ref.getBase()).toBe(base);
        expect(ref.getFieldSignature()).toBe(sig);
        expect(ref.getFieldName()).toBe('foo');
        expect(ref.isDynamic()).toBe(false);
        expect(ref.getType()).toBe(NumberType.getInstance());
    });

    it('honours the dynamic constructor flag', () => {
        const sig = new FieldSignature('bar', ClassSignature.DEFAULT, NumberType.getInstance());
        const ref = new ArkInstanceFieldRef(new Local('o'), sig, true);
        expect(ref.isDynamic()).toBe(true);
    });

    it('setBase / setFieldSignature update fields', () => {
        const sig1 = new FieldSignature('a', ClassSignature.DEFAULT, NumberType.getInstance());
        const sig2 = new FieldSignature('b', ClassSignature.DEFAULT, StringType.getInstance());
        const ref = new ArkInstanceFieldRef(new Local('o'), sig1);

        const newBase = new Local('o2');
        ref.setBase(newBase);
        ref.setFieldSignature(sig2);

        expect(ref.getBase()).toBe(newBase);
        expect(ref.getFieldSignature()).toBe(sig2);
        expect(ref.getFieldName()).toBe('b');
        expect(ref.getType()).toBe(StringType.getInstance());
    });

    it('getUses returns the base (plus its transitive uses)', () => {
        const sig = new FieldSignature('x', ClassSignature.DEFAULT, NumberType.getInstance());
        const base = new Local('o');
        const ref = new ArkInstanceFieldRef(base, sig);
        expect(ref.getUses()).toContain(base);
    });

    it('toString uses base.<fieldSignature> format', () => {
        const sig = new FieldSignature('x', ClassSignature.DEFAULT, NumberType.getInstance());
        const ref = new ArkInstanceFieldRef(new Local('o'), sig);
        const out = ref.toString();
        expect(out.startsWith('o.<')).toBe(true);
        expect(out.endsWith('>')).toBe(true);
    });
});

describe('ArkStaticFieldRef', () => {
    it('exposes signature, type and name through the AbstractFieldRef base', () => {
        const sig = new FieldSignature('S', ClassSignature.DEFAULT, NumberType.getInstance(), true);
        const ref = new ArkStaticFieldRef(sig);
        expect(ref.getFieldSignature()).toBe(sig);
        expect(ref.getFieldName()).toBe('S');
        expect(ref.getType()).toBe(NumberType.getInstance());
    });

    it('getUses is always empty', () => {
        const sig = new FieldSignature('S', ClassSignature.DEFAULT, NumberType.getInstance(), true);
        expect(new ArkStaticFieldRef(sig).getUses()).toEqual([]);
    });

    it('toString equals fieldSignature.toString()', () => {
        const sig = new FieldSignature('S', ClassSignature.DEFAULT, NumberType.getInstance(), true);
        const ref = new ArkStaticFieldRef(sig);
        expect(ref.toString()).toBe(sig.toString());
    });
});

describe('ArkParameterRef', () => {
    it('stores index and type from the constructor', () => {
        const ref = new ArkParameterRef(2, NumberType.getInstance());
        expect(ref.getIndex()).toBe(2);
        expect(ref.getType()).toBe(NumberType.getInstance());
    });

    it('setIndex and setType update the values', () => {
        const ref = new ArkParameterRef(0, NumberType.getInstance());
        ref.setIndex(7);
        ref.setType(StringType.getInstance());
        expect(ref.getIndex()).toBe(7);
        expect(ref.getType()).toBe(StringType.getInstance());
    });

    it('getUses is always empty', () => {
        expect(new ArkParameterRef(0, NumberType.getInstance()).getUses()).toEqual([]);
    });

    it('toString includes the index and type', () => {
        const ref = new ArkParameterRef(3, NumberType.getInstance());
        expect(ref.toString()).toContain('parameter3');
    });
});

describe('ArkThisRef', () => {
    it('stores the ClassType passed at construction', () => {
        const ref = new ArkThisRef(sampleClassType);
        expect(ref.getType()).toBe(sampleClassType);
    });

    it('getUses is always empty', () => {
        expect(new ArkThisRef(sampleClassType).getUses()).toEqual([]);
    });

    it('toString starts with "this:"', () => {
        const ref = new ArkThisRef(sampleClassType);
        expect(ref.toString().startsWith('this:')).toBe(true);
    });
});

describe('ArkCaughtExceptionRef', () => {
    it('stores and updates its type', () => {
        const ref = new ArkCaughtExceptionRef(NumberType.getInstance());
        expect(ref.getType()).toBe(NumberType.getInstance());
        ref.setType(StringType.getInstance());
        expect(ref.getType()).toBe(StringType.getInstance());
    });

    it('getUses is always empty', () => {
        expect(new ArkCaughtExceptionRef(NumberType.getInstance()).getUses()).toEqual([]);
    });

    it('toString starts with "caughtexception:"', () => {
        expect(new ArkCaughtExceptionRef(NumberType.getInstance()).toString().startsWith('caughtexception:')).toBe(true);
    });
});

describe('GlobalRef', () => {
    it('defaults ref to null and exposes the name', () => {
        const g = new GlobalRef('myGlobal');
        expect(g.getName()).toBe('myGlobal');
        expect(g.getRef()).toBeNull();
        expect(g.getUses()).toEqual([]);
        expect(g.getType()).toBe(UnknownType.getInstance());
    });

    it('reflects the wrapped value once setRef is called', () => {
        const g = new GlobalRef('g');
        const c = new NumberConstant('1');
        g.setRef(c);
        expect(g.getRef()).toBe(c);
        expect(g.getType()).toBe(NumberType.getInstance());
        expect(g.getUses()).toEqual([]); // NumberConstant.getUses() is empty
    });

    it('the constructor accepts an initial ref value', () => {
        const c = new NumberConstant('1');
        const g = new GlobalRef('g', c);
        expect(g.getRef()).toBe(c);
        expect(g.getType()).toBe(NumberType.getInstance());
    });

    it('addUsedStmts accepts a single stmt or array and preserves order', () => {
        const g = new GlobalRef('g');
        const s1 = new ArkReturnVoidStmt();
        const s2 = new ArkReturnVoidStmt();
        const s3 = new ArkReturnVoidStmt();

        g.addUsedStmts(s1);
        g.addUsedStmts([s2, s3]);
        expect(g.getUsedStmts()).toEqual([s1, s2, s3]);
    });

    it('toString returns the global name', () => {
        expect(new GlobalRef('foo').toString()).toBe('foo');
    });
});

describe('ClosureFieldRef', () => {
    it('exposes base, fieldName and type from the constructor', () => {
        const base = new Local('lex');
        const ref = new ClosureFieldRef(base, 'cap', NumberType.getInstance());
        expect(ref.getBase()).toBe(base);
        expect(ref.getFieldName()).toBe('cap');
        expect(ref.getType()).toBe(NumberType.getInstance());
    });

    it('getUses is always empty', () => {
        const ref = new ClosureFieldRef(new Local('lex'), 'x', NumberType.getInstance());
        expect(ref.getUses()).toEqual([]);
    });

    it('setType updates the stored type', () => {
        const ref = new ClosureFieldRef(new Local('lex'), 'x', UnknownType.getInstance());
        ref.setType(StringType.getInstance());
        expect(ref.getType()).toBe(StringType.getInstance());
    });

    it('toString uses base.fieldName format', () => {
        const ref = new ClosureFieldRef(new Local('lex'), 'cap', NumberType.getInstance());
        expect(ref.toString()).toBe('lex.cap');
    });
});
