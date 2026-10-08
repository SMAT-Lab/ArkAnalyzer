/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
    AliasType,
    AliasTypeSignature,
    AnyType,
    ArrayType,
    BigIntType,
    BooleanType,
    ClassSignature,
    ClassType,
    FileSignature,
    FunctionType,
    GenericType,
    IntersectionType,
    LiteralType,
    Local,
    MethodSignature,
    MethodSubSignature,
    NeverType,
    NullType,
    NumberType,
    StringType,
    TupleType,
    TypeInference,
    UnclearReferenceType,
    UndefinedType,
    UnionType,
    UnknownType,
    VoidType,
} from '../../src';
import {
    PointerType,
    ReferenceType,
    CxxCharType,
    CxxIntType,
    CxxFloatingPointType,
    AutoType,
    Thread,
    TypeInfo,
    CxxNonType,
    CxxArrayType,
} from '../../src/frontend/cppFrontend/base/Type';
import { CxxTypeBitWidth, CxxTypeSigned } from '../../src/frontend/cppFrontend/base/Type';
import { KeyofTypeExpr, TypeQueryExpr } from '../../src/core/base/TypeExpr';
import { UNKNOWN_FILE_NAME, UNKNOWN_PROJECT_NAME } from '../../src/core/common/Const';
import { SignatureCanonicalizerRegistry } from '../../src/core/common/SignatureCanonicalizerRegistry';

describe('Type.isUnclear polymorphic semantics Test', () => {
    function makeMethodSignature(name: string): MethodSignature {
        return new MethodSignature(0, new MethodSubSignature(name, [], UnknownType.getInstance(), false));
    }

    function makeClearFileSig(): FileSignature {
        // A clear (non-DEFAULT) file signature must be interned before ClassSignature accepts it
        const fileSig = new FileSignature('proj', 'src/a.ts');
        SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getOrCreateId(fileSig);
        return fileSig;
    }

    it('leaf types: inherently unclear ones are true, concrete ones are false', () => {
        expect(UnknownType.getInstance().isUnclear()).toBe(true);
        expect(new UnclearReferenceType('Something').isUnclear()).toBe(true);
        expect(new GenericType('T').isUnclear()).toBe(true);
        // Unified semantics: null/undefined are concrete value types, not unresolvable
        // references. Their historical "unclear" identity carried placeholder signalling
        // for the inference engine, now made explicit at the consumer sites (see
        // LocalInference.preInfer / ModelInference.updateValueType / transferRight2Left).
        expect(NullType.getInstance().isUnclear()).toBe(false);
        expect(UndefinedType.getInstance().isUnclear()).toBe(false);

        expect(AnyType.getInstance().isUnclear()).toBe(false);
        expect(NumberType.getInstance().isUnclear()).toBe(false);
        expect(StringType.getInstance().isUnclear()).toBe(false);
        expect(BooleanType.getInstance().isUnclear()).toBe(false);
        expect(BigIntType.getInstance().isUnclear()).toBe(false);
        expect(VoidType.getInstance().isUnclear()).toBe(false);
        expect(NeverType.getInstance().isUnclear()).toBe(false);
        expect(new LiteralType('lit').isUnclear()).toBe(false);
    });

    it('ClassType: unclear-declaring file and bare Promise', () => {
        const unclearFileSig = new FileSignature(UNKNOWN_PROJECT_NAME, UNKNOWN_FILE_NAME);
        const clearFileSig = makeClearFileSig();

        const unclearDeclaring = new ClassType(new ClassSignature('Foo', unclearFileSig, null));
        expect(unclearDeclaring.isUnclear()).toBe(true);

        const clearDeclaring = new ClassType(new ClassSignature('Foo', clearFileSig, null));
        expect(clearDeclaring.isUnclear()).toBe(false);

        // Promise without real generic types is unclear (unresolved generic), with them it is not
        const barePromise = new ClassType(new ClassSignature('Promise', clearFileSig, null));
        expect(barePromise.isUnclear()).toBe(true);
        const promiseWithGenerics = new ClassType(new ClassSignature('Promise', clearFileSig, null), [NumberType.getInstance()]);
        expect(promiseWithGenerics.isUnclear()).toBe(false);
    });

    it('Union propagates the unified full semantics of its members', () => {
        // Unified semantics: a union is unclear iff any member is unclear. The historical
        // narrow predicate probe (which ignored Unknown/Null/Undefined members) was retired
        // together with containsUnclearOrGeneric; its inference-engine dependencies were
        // migrated to explicit placeholder checks (see tasks.md B5 unification work).
        expect(new UnionType([UnknownType.getInstance()]).isUnclear()).toBe(true);
        expect(new UnionType([NullType.getInstance()]).isUnclear()).toBe(false);
        expect(new UnionType([new UnclearReferenceType('X')]).isUnclear()).toBe(true);
        expect(new UnionType([new GenericType('T')]).isUnclear()).toBe(true);
        expect(new UnionType([NumberType.getInstance(), UnknownType.getInstance()]).isUnclear()).toBe(true);
        expect(new UnionType([NumberType.getInstance(), StringType.getInstance()]).isUnclear()).toBe(false);
        // Deep propagation through nested containers
        expect(new UnionType([new ArrayType(new UnclearReferenceType('X'), 1)]).isUnclear()).toBe(true);
        expect(new UnionType([new ArrayType(UnknownType.getInstance(), 1)]).isUnclear()).toBe(true);
        expect(new IntersectionType([new UnclearReferenceType('X')]).isUnclear()).toBe(true);
        expect(new IntersectionType([UnknownType.getInstance()]).isUnclear()).toBe(true);
        expect(new IntersectionType([NumberType.getInstance()]).isUnclear()).toBe(false);
        expect(new TupleType([new UnclearReferenceType('X')]).isUnclear()).toBe(true);
        expect(new TupleType([UnknownType.getInstance()]).isUnclear()).toBe(true);
        expect(new TupleType([NumberType.getInstance()]).isUnclear()).toBe(false);
    });

    it('Array propagates the unified full semantics of its base type', () => {
        expect(new ArrayType(UnknownType.getInstance(), 1).isUnclear()).toBe(true);
        expect(new ArrayType(new UnclearReferenceType('X'), 1).isUnclear()).toBe(true);
        expect(new ArrayType(new GenericType('T'), 1).isUnclear()).toBe(true);
        expect(new ArrayType(NumberType.getInstance(), 1).isUnclear()).toBe(false);
    });

    it('AliasType propagates the unclear semantics of its original type', () => {
        const sigA = new AliasTypeSignature('A', makeMethodSignature('host'));
        expect(new AliasType('A', UnknownType.getInstance(), sigA).isUnclear()).toBe(true);
        expect(new AliasType('A', new UnionType([NumberType.getInstance(), UnknownType.getInstance()]), sigA).isUnclear()).toBe(true);
        expect(new AliasType('A', new UnionType([NumberType.getInstance(), StringType.getInstance()]), sigA).isUnclear()).toBe(false);
        expect(new AliasType('A', NumberType.getInstance(), sigA).isUnclear()).toBe(false);
    });

    it('ClassType generic type arguments do not propagate (own-resolvability semantics)', () => {
        const clearFileSig = makeClearFileSig();
        const clearClassType = new ClassType(new ClassSignature('Foo', clearFileSig, null), [new UnclearReferenceType('X')]);
        // Foo<Unclear> is decided by the class reference's own resolvability — generic
        // arguments do not propagate (kept from the historical top-level semantics;
        // propagating them regressed keyof-typeof inference chains).
        expect(clearClassType.isUnclear()).toBe(false);
        expect(new UnionType([clearClassType]).isUnclear()).toBe(false);
        const cleanClassType = new ClassType(new ClassSignature('Foo', clearFileSig, null), [NumberType.getInstance()]);
        expect(cleanClassType.isUnclear()).toBe(false);
        expect(new UnionType([cleanClassType]).isUnclear()).toBe(false);
    });

    it('TypeQueryExpr and KeyofTypeExpr follow their operand types (core semantics incl. generateTypes)', () => {
        const unknownLocal = new Local('u', UnknownType.getInstance());
        const numberLocal = new Local('n', NumberType.getInstance());

        expect(new TypeQueryExpr(unknownLocal).isUnclear()).toBe(true);
        expect(new TypeQueryExpr(numberLocal).isUnclear()).toBe(false);
        // generateTypes carrying an unclear reference makes the query unclear (core semantics,
        // unified from the cpp twin that historically skipped generateTypes)
        expect(new TypeQueryExpr(numberLocal, [new UnclearReferenceType('X')]).isUnclear()).toBe(true);

        expect(new KeyofTypeExpr(UnknownType.getInstance()).isUnclear()).toBe(true);
        expect(new KeyofTypeExpr(NumberType.getInstance()).isUnclear()).toBe(false);
    });

    it('C++ PointerType/ReferenceType propagate their base type', () => {
        expect(new PointerType(new UnclearReferenceType('X'), 1).isUnclear()).toBe(true);
        expect(new PointerType(NumberType.getInstance(), 1).isUnclear()).toBe(false);
        expect(new ReferenceType(UnknownType.getInstance(), 0).isUnclear()).toBe(true);
        expect(new ReferenceType(NumberType.getInstance(), 0).isUnclear()).toBe(false);
        // Pointer uncertainty also propagates through containers (the historical
        // "predicate probe does not descend into pointers" special case was unified away)
        expect(new UnionType([new PointerType(new UnclearReferenceType('X'), 1)]).isUnclear()).toBe(true);
    });

    it('C++ leaf types are never unclear; inheritance chains resolve correctly', () => {
        expect(CxxCharType.getInstance().isUnclear()).toBe(false);
        expect(CxxIntType.getInstance(CxxTypeSigned.SIGNED, CxxTypeBitWidth.THIRTY_TWO_BITS).isUnclear()).toBe(false);
        expect(CxxFloatingPointType.getInstance().isUnclear()).toBe(false);
        expect(AutoType.getInstance().isUnclear()).toBe(false);
        expect(new Thread().isUnclear()).toBe(false);
        expect(new TypeInfo('ti', new UnclearReferenceType('X')).isUnclear()).toBe(false);
        // CxxNonType is a GenericType subtype: template-parameter semantics inherit true
        expect(new CxxNonType('NT').isUnclear()).toBe(true);
    });

    it('C++ CxxArrayType recurses into its base type (aligned with core ArrayType)', () => {
        // Historical bug fixed by the abstract-forced implementation: CxxArrayType used to
        // inherit the (then-default) false and never propagated its base type's uncertainty.
        expect(new CxxArrayType(new UnclearReferenceType('X'), 1).isUnclear()).toBe(true);
        expect(new CxxArrayType(new GenericType('T'), 1).isUnclear()).toBe(true);
        expect(new CxxArrayType(UnknownType.getInstance(), 1).isUnclear()).toBe(true);
        expect(new CxxArrayType(NumberType.getInstance(), 1).isUnclear()).toBe(false);
    });

    it('FunctionType generic type arguments do not propagate (own-resolvability semantics)', () => {
        const fnType = new FunctionType(makeMethodSignature('fn'), [new UnclearReferenceType('X')]);
        expect(fnType.isUnclear()).toBe(false);
        const cleanFnType = new FunctionType(makeMethodSignature('fn'), [NumberType.getInstance()]);
        expect(cleanFnType.isUnclear()).toBe(false);
    });

    it('self-referencing containers do not loop forever', () => {
        const union: UnionType = new UnionType([NumberType.getInstance()]);
        union.getTypes().push(union);
        expect(union.isUnclear()).toBe(false);

        const unclearUnion: UnionType = new UnionType([new UnclearReferenceType('X')]);
        unclearUnion.getTypes().push(unclearUnion);
        expect(unclearUnion.isUnclear()).toBe(true);
    });

    it('TypeInference.isUnclearType is a thin delegate of the polymorphic isUnclear', () => {
        expect(TypeInference.isUnclearType(null)).toBe(true);
        expect(TypeInference.isUnclearType(undefined)).toBe(true);
        expect(TypeInference.isUnclearType(UnknownType.getInstance())).toBe(true);
        expect(TypeInference.isUnclearType(NumberType.getInstance())).toBe(false);
        expect(TypeInference.isUnclearType(new UnionType([UnknownType.getInstance()]))).toBe(true);
        expect(TypeInference.isUnclearType(new UnionType([new UnclearReferenceType('X')]))).toBe(true);
        expect(TypeInference.isUnclearType(new UnionType([NumberType.getInstance(), StringType.getInstance()]))).toBe(false);
    });
});
