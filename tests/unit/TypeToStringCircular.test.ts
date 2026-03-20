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

/**
 * Type.toString() circular reference test cases.
 *
 * Covers all known scenarios where toString recursion may cause stack overflow.
 *
 * ## 5 passing cases (no stack overflow)
 *
 * These types establish circular references but toString does NOT overflow:
 * - UnclearReferenceType, TupleType, AliasType, ClassType, AliasType+GenericType
 * - All use Array.join() which may have built-in cycle handling.
 *
 * ## 8 failing cases (stack overflow until fix)
 *
 * These trigger Maximum call stack size exceeded:
 * - UnionType/IntersectionType mutual inclusion (explicit t.toString())
 * - ArrayType baseType containing self
 * - GenericType constraint/defaultType self-reference
 * - FunctionType parameter type referencing the function
 * - Union→Array→Union chain
 */
import { assert, describe, it } from 'vitest';
import {
    AliasType,
    AliasTypeSignature,
    ArrayType,
    ClassSignature,
    ClassType,
    FileSignature,
    FunctionType,
    GenericType,
    IntersectionType,
    MethodSignature,
    MethodSubSignature,
    NumberType,
    TupleType,
    UnclearReferenceType,
    UnionType,
    UnknownType,
    VoidType,
} from '../../src';
import { UNKNOWN_KEYWORD } from '../../src/core/common/TSConst';
import { MethodParameter } from '../../src/core/model/builder/ArkMethodBuilder';

const TIMEOUT_MS = 5000;

describe('Type.toString circular reference - no stack overflow', () => {
    describe('UnionType circular (A ↔ B)', () => {
        it('UnionType A contains B, B contains A', { timeout: TIMEOUT_MS }, () => {
            // Construction: Create two UnionTypes, then mutate their private `types` array
            // so that A.types = [B] and B.types = [A]. getTypeString iterates and calls
            // t.toString() for each member, causing infinite recursion.
            const typeA = new UnionType([NumberType.getInstance()]);
            const typeB = new UnionType([NumberType.getInstance()]);
            (typeA as any).types = [typeB];
            (typeB as any).types = [typeA];

            // Verification: toString should complete without stack overflow (after fix).
            const result = typeA.toString();
            assert.isString(result);
            assert.equal(result, `((${UNKNOWN_KEYWORD}))`, 'UnionType A contains B, B contains A; anonymous uses unknown');
        });
    });

    describe('IntersectionType circular (A ↔ B)', () => {
        it('IntersectionType A contains B, B contains A', { timeout: TIMEOUT_MS }, () => {
            // Construction: Same as UnionType - mutate private `types` so A and B
            // reference each other. getTypeString uses t.toString() in forEach.
            const typeA = new IntersectionType([NumberType.getInstance()]);
            const typeB = new IntersectionType([NumberType.getInstance()]);
            (typeA as any).types = [typeB];
            (typeB as any).types = [typeA];

            // Verification: toString should complete without stack overflow (after fix).
            const result = typeA.toString();
            assert.isString(result);
            assert.equal(result, `((${UNKNOWN_KEYWORD}))`, 'IntersectionType A contains B, B contains A; anonymous uses unknown');
        });
    });

    describe('UnionType ↔ IntersectionType cross circular', () => {
        it('UnionType contains IntersectionType which contains UnionType', { timeout: TIMEOUT_MS }, () => {
            // Construction: Cross-type cycle - UnionType.types = [IntersectionType],
            // IntersectionType.types = [UnionType]. Both call t.toString() when iterating.
            const unionType = new UnionType([NumberType.getInstance()]);
            const interType = new IntersectionType([NumberType.getInstance()]);
            (unionType as any).types = [interType];
            (interType as any).types = [unionType];

            // Verification: toString should complete without stack overflow (after fix).
            const result = unionType.toString();
            assert.isString(result);
            assert.equal(result, `((${UNKNOWN_KEYWORD}))`, 'Union contains Inter contains Union; anonymous uses unknown');
        });
    });

    describe('UnclearReferenceType circular (genericTypes A ↔ B)', () => {
        it('Constructor with mutable arrays, push to form cycle - no overflow, outputs A<B<A<>>>', {
            timeout: TIMEOUT_MS
        }, () => {
            // Construction: Pass mutable arrays to constructor, then push the other type
            // into each. typeA.genericTypes = typesA = [typeB], typeB.genericTypes = typesB = [typeA].
            // getTypeString uses genericTypes.join(',') which calls toString on each element.
            const typesA: any[] = [];
            const typesB: any[] = [];
            const typeA = new UnclearReferenceType('A', typesA);
            const typeB = new UnclearReferenceType('B', typesB);
            typesA.push(typeB);
            typesB.push(typeA);

            // Verification: Does NOT overflow - cycle detected, back-reference uses type name "A".
            const result = typeA.toString();
            assert.isString(result);
            assert.equal(result, 'A<B<A>>', 'Cycle detected and replaced with type name back-reference');
        });
    });

    describe('TupleType self-reference', () => {
        it('TupleType contains itself in types array', { timeout: TIMEOUT_MS }, () => {
            // Construction: Pass empty array to constructor (stores reference), then push
            // the TupleType itself. tupleType.types = types = [tupleType].
            // getTypeString uses types.join(', ') which calls toString on each element.
            const types: any[] = [];
            const tupleType = new TupleType(types);
            types.push(tupleType);

            // Verification: Does NOT overflow - same Array.join path as UnclearReferenceType.
            const result = tupleType.toString();
            assert.isString(result);
            assert.equal(result, `[${UNKNOWN_KEYWORD}]`, 'TupleType self-ref uses unknown');
        });
    });

    describe('ArrayType circular (baseType contains ArrayType)', () => {
        it('ArrayType baseType is UnionType that contains the ArrayType', { timeout: TIMEOUT_MS }, () => {
            // Construction: Create ArrayType with placeholder baseType, create UnionType
            // containing the ArrayType, then set ArrayType.baseType = UnionType.
            // Cycle: ArrayType.toString -> baseType.toString (Union) -> t.toString (ArrayType) -> ...
            const arrType = new ArrayType(NumberType.getInstance(), 1);
            const unionType = new UnionType([arrType]);
            arrType.setBaseType(unionType);

            // Verification: toString should complete without stack overflow (after fix).
            const result = arrType.toString();
            assert.isString(result);
            assert.equal(result, `(${UNKNOWN_KEYWORD})[]`, 'ArrayType baseType cycle uses unknown');
        });
    });

    describe('AliasType circular (realGenericTypes A ↔ B)', () => {
        it('AliasType A.realGenericTypes contains B, B.realGenericTypes contains A', { timeout: TIMEOUT_MS }, () => {
            // Construction: Create two AliasTypes with shared MethodSignature, then
            // setRealGenericTypes([aliasB]) and setRealGenericTypes([aliasA]) respectively.
            // getTypeString uses realGenericTypes?.join(',') which calls toString on each.
            const methodSig = new MethodSignature(
                ClassSignature.DEFAULT,
                new MethodSubSignature('fn', [], VoidType.getInstance())
            );
            const sigA = new AliasTypeSignature('A', methodSig);
            const sigB = new AliasTypeSignature('B', methodSig);

            const aliasA = new AliasType('A', NumberType.getInstance(), sigA);
            const aliasB = new AliasType('B', NumberType.getInstance(), sigB);
            aliasA.setRealGenericTypes([aliasB]);
            aliasB.setRealGenericTypes([aliasA]);

            // Verification: Does NOT overflow - back-reference uses type name "A".
            const result = aliasA.toString();
            assert.isString(result);
            assert.include(result, '#A<', 'AliasType A with generic');
            assert.include(result, '#B<', 'AliasType B with generic');
            assert.match(result, /<A>/, 'Cycle back-ref to A');
        });
    });

    describe('GenericType self-reference (constraint)', () => {
        it('GenericType constraint references itself', { timeout: TIMEOUT_MS }, () => {
            // Construction: Create GenericType, setConstraint(self). getTypeString explicitly
            // calls constraint.toString(), causing infinite recursion (no Array.join).
            const genericT = new GenericType('T');
            genericT.setConstraint(genericT);

            // Verification: toString should complete - back-reference uses "T".
            const result = genericT.toString();
            assert.isString(result);
            assert.equal(result, 'T extends T', 'GenericType self-constraint uses name "T"');
        });
    });

    describe('GenericType self-reference (defaultType)', () => {
        it('GenericType defaultType references itself', { timeout: TIMEOUT_MS }, () => {
            // Construction: Create GenericType, setDefaultType(self). getTypeString explicitly
            // calls defaultType.toString(), causing infinite recursion.
            const genericT = new GenericType('T');
            genericT.setDefaultType(genericT);

            // Verification: toString should complete - back-reference uses "T".
            const result = genericT.toString();
            assert.isString(result);
            assert.equal(result, 'T = T', 'GenericType self-default uses name "T"');
        });
    });

    describe('ClassType circular (realGenericTypes A ↔ B)', () => {
        it('ClassType A.realGenericTypes contains B, B.realGenericTypes contains A', { timeout: TIMEOUT_MS }, () => {
            // Construction: Create two ClassTypes with different ClassSignatures, then
            // setRealGenericTypes to reference each other. getTypeString uses
            // realGenericTypes?.join(',') which calls toString on each.
            const sigA = new ClassSignature('A', FileSignature.DEFAULT, null);
            const sigB = new ClassSignature('B', FileSignature.DEFAULT, null);
            const classTypeA = new ClassType(sigA);
            const classTypeB = new ClassType(sigB);
            classTypeA.setRealGenericTypes([classTypeB]);
            classTypeB.setRealGenericTypes([classTypeA]);

            // Verification: Does NOT overflow - back-reference uses class signature.
            const result = classTypeA.toString();
            assert.isString(result);
            assert.include(result, 'A<', 'ClassType A with generic');
            assert.include(result, 'B<', 'ClassType B with generic');
            assert.match(result, /A<[^>]*A>/, 'Cycle back-ref to A');
        });
    });

    describe('FunctionType circular (parameter type references function)', () => {
        it('FunctionType param type is the FunctionType itself (recursive fn)', { timeout: TIMEOUT_MS }, () => {
            // Construction: Create MethodParameter with placeholder type, build MethodSubSignature
            // and MethodSignature, create FunctionType, then set param.type = funcType.
            // MethodSubSignature.toString() calls parameterType.toString() for each param.
            const param = new MethodParameter();
            param.setName('self');
            param.setType(UnknownType.getInstance()); // placeholder, will replace

            const subSig = new MethodSubSignature('recursive', [param], VoidType.getInstance());
            const methodSig = new MethodSignature(ClassSignature.DEFAULT, subSig);
            const funcType = new FunctionType(methodSig);
            param.setType(funcType);

            // Verification: toString should complete - FunctionType uses %unk for cycle.
            const result = funcType.toString();
            assert.isString(result);
            assert.include(result, 'recursive', 'Method name present');
            assert.include(result, UNKNOWN_KEYWORD, 'Cycle uses unknown placeholder');
        });
    });

    describe('AliasType with GenericType circular (genericTypes)', () => {
        it('AliasType genericTypes contains GenericType whose constraint references AliasType', {
            timeout: TIMEOUT_MS
        }, () => {
            // Construction: AliasType has genericTypes = [GenericType], GenericType has
            // constraint = AliasType. getTypeString uses genericTypes?.join(',') which
            // calls GenericType.toString(), which calls constraint.toString() = AliasType.toString().
            const methodSig = new MethodSignature(
                ClassSignature.DEFAULT,
                new MethodSubSignature('fn', [], VoidType.getInstance())
            );
            const sig = new AliasTypeSignature('T', methodSig);
            const aliasT = new AliasType('T', NumberType.getInstance(), sig);
            const genericT = new GenericType('T');
            genericT.setConstraint(aliasT);
            aliasT.setGenericTypes([genericT]);

            // Verification: Does NOT overflow - AliasType T contains GenericType T with constraint T.
            const result = aliasT.toString();
            assert.isString(result);
            assert.include(result, 'T', 'AliasType/GenericType name present');
        });
    });

    describe('AliasType circular (getSignature contains param type referencing self)', () => {
        it('AliasType signature MethodSubSignature has param type = the AliasType itself (type RecursiveFn = (x: RecursiveFn) => void)', {
            timeout: TIMEOUT_MS
        }, () => {
            // Construction: type RecursiveFn = (x: RecursiveFn) => void
            // AliasType.getTypeString calls getSignature().toString(), which chains to
            // MethodSubSignature.toString() -> parameterType.toString(). When param type
            // is the AliasType itself, we get infinite recursion (no visited set passed).
            const param = new MethodParameter();
            param.setName('x');
            param.setType(UnknownType.getInstance()); // placeholder

            const subSig = new MethodSubSignature('RecursiveFn', [param], VoidType.getInstance());
            const methodSig = new MethodSignature(ClassSignature.DEFAULT, subSig);
            const sig = new AliasTypeSignature('RecursiveFn', methodSig);
            const funcType = new FunctionType(methodSig);
            const aliasType = new AliasType('RecursiveFn', funcType, sig);

            param.setType(aliasType); // param type = AliasType itself

            // Verification: toString should complete without stack overflow.
            // Fix: getSignature().toString(visited) passes visited to MethodSubSignature
            // so parameterType uses toStringWithVisited(visited) for cycle detection.
            const result = aliasType.toString();
            assert.isString(result);
            assert.include(result, 'RecursiveFn', 'AliasType name present');
        });
    });

    describe('Complex chain: Union → Array → Union', () => {
        it('Union contains Array whose baseType is the Union', { timeout: TIMEOUT_MS }, () => {
            // Construction: UnionType.types = [ArrayType], ArrayType.baseType = UnionType.
            // Cycle: Union.toString -> forEach t.toString (Array) -> baseType.toString (Union) -> ...
            const unionType = new UnionType([NumberType.getInstance()]);
            const arrType = new ArrayType(unionType, 1);
            (unionType as any).types = [arrType];

            // Verification: toString should complete - Union contains Array of Union.
            const result = unionType.toString();
            assert.isString(result);
            assert.equal(result, `(${UNKNOWN_KEYWORD})[]`, 'Union->Array->Union cycle');
        });
    });
});
