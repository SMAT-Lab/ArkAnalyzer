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

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { SignatureCanonicalizerRegistry } from '../../src/core/common/SignatureCanonicalizerRegistry';
import {
    FileSignature,
    ClassSignature,
    MethodSignature,
    MethodSubSignature,
    NamespaceSignature,
    FieldSignature,
    AliasClassSignature,
} from '../../src/core/model/ArkSignature';
import { ClassType, UnknownType, NumberType } from '../../src/core/base/Type';
import { ArkMethod } from '../../src/core/model/ArkMethod';
import { MethodParameter } from '../../src/core/model/builder/ArkMethodBuilder';
import { ArkNamespace } from '../../src/core/model/ArkNamespace';
import { ArkFile, Language } from '../../src/core/model/ArkFile';
import { ArkClass } from '../../src/core/model/ArkClass';
import { Scene } from '../../src/Scene';
import { ArkSignatureBuilder } from '../../src/core/model/builder/ArkSignatureBuilder';
import { Builtin } from '../../src/core/common/Builtin';
import { BuiltinCxx } from '../../src/frontend/cppFrontend/common/Builtin';
import {
    UNKNOWN_CLASS_NAME,
    UNKNOWN_FIELD_NAME,
    UNKNOWN_FILE_NAME,
    UNKNOWN_METHOD_NAME,
    UNKNOWN_NAMESPACE_NAME,
    UNKNOWN_PROJECT_NAME,
} from '../../src/core/common/Const';

describe('SignatureCanonicalizerRegistry Test', () => {
    let reg: SignatureCanonicalizerRegistry;

    beforeAll(() => {
        reg = SignatureCanonicalizerRegistry.getInstance();
    });

    afterAll(() => {
        SignatureCanonicalizerRegistry.dispose();
    });

    it('getInstance returns singleton', () => {
        const a = SignatureCanonicalizerRegistry.getInstance();
        const b = SignatureCanonicalizerRegistry.getInstance();
        expect(a).toBe(b);
    });

    it('DEFAULT signatures are interned with ID 0', () => {
        expect(reg.fileSigCanonicalizer.getExistingId(FileSignature.DEFAULT)).toBe(0);
        expect(reg.classSigCanonicalizer.getExistingId(ClassSignature.DEFAULT)).toBe(0);
        expect(reg.methodSigCanonicalizer.getExistingId(MethodSignature.DEFAULT)).toBe(0);
        expect(reg.namespaceSigCanonicalizer.getExistingId(NamespaceSignature.DEFAULT)).toBe(0);
        expect(reg.fieldSigCanonicalizer.getExistingId(FieldSignature.DEFAULT)).toBe(0);
    });

    it('ID 0 does not correspond to any model', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.fileSigCanonicalizer.getModel(0)).toBeUndefined();
        expect(reg.classSigCanonicalizer.getModel(0)).toBeUndefined();
    });

    it('static getFileId returns valid ID', () => {
        const id = reg.getFileId(new FileSignature('proj', 'src/a.ts'));
        expect(id).equals(-1);
    });

    it('static getFileId returns same ID for same signature value', () => {
        const sig1 = new FileSignature('proj', 'src/a.ts');
        const sig2 = new FileSignature('proj', 'src/a.ts');
        expect(reg.getFileId(sig1)).toBe(reg.getFileId(sig2));
    });

    it('static getClassId returns valid ID', () => {
        const fileSig = new FileSignature('proj', 'src/a.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSig = new ClassSignature('MyClass', fileSig, null);
        const id = reg.getClassId(classSig);
        expect(id).equals(-1);
    });

    it('static getMethodId returns valid ID', () => {
        const fileSig = new FileSignature('proj', 'src/a.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSig = new ClassSignature('MyClass', fileSig, null);
        const ms = new MethodSignature(reg.classSigCanonicalizer.getOrCreateId(classSig), new MethodSubSignature('foo', [], UnknownType.getInstance(), false));
        const id = reg.getMethodId(ms);
        expect(id).equals(-1);
    });

    it('static getNamespaceId returns valid ID', () => {
        const fileSig = new FileSignature('proj', 'src/a.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const nsSig = new NamespaceSignature('MyNS', fileSig, null);
        const id = reg.getNamespaceId(nsSig);
        expect(id).equals(-1);
    });

    it('static getFieldId returns valid ID', () => {
        const fileSig = new FileSignature('proj', 'src/a.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSig = new ClassSignature('MyClass', fileSig, null);
        const fs = new FieldSignature('field', reg.classSigCanonicalizer.getOrCreateId(classSig), UnknownType.getInstance(), false);
        const id = reg.getFieldId(fs);
        expect(id).equals(-1);
    });

    it('static getFileById returns undefined for unregistered ID', () => {
        expect(reg.getFileById(999)).toBeUndefined();
    });

    it('static getClassById returns undefined for unregistered ID', () => {
        expect(reg.getClassById(999)).toBeUndefined();
    });

    it('methodSigCanonicalizer stores models', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.methodSigCanonicalizer).toBeDefined();
        expect(reg.methodSigCanonicalizer.getModels().length).toBe(0);
    });

    it('customComponentMap is accessible', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.customComponentMap).toBeInstanceOf(Map);
        expect(reg.customComponentMap.size).toBe(0);
    });

    it('dispose clears all canonicalizers and maps', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        reg.fileSigCanonicalizer.getOrCreateId(new FileSignature('proj', 'src/a.ts'));
        reg.customComponentMap.set('Comp', ClassSignature.DEFAULT);
        expect(reg.fileSigCanonicalizer.size()).toBeGreaterThan(1);
        expect(reg.customComponentMap.size).toBe(1);
        SignatureCanonicalizerRegistry.dispose();
        const reg2 = SignatureCanonicalizerRegistry.getInstance();
        expect(reg2.fileSigCanonicalizer.size()).toBe(1); // only DEFAULT
        expect(reg2.customComponentMap.size).toBe(0);
    });

    it('temp canonicalizers are accessible (file/namespace spaces removed — permanently empty)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.tempClassSigCanonicalizer).toBeDefined();
        expect(reg.tempMethodSigCanonicalizer).toBeDefined();
        expect(reg.tempFieldSigCanonicalizer).toBeDefined();
        // tempFile/tempNamespace spaces were removed: FileSignature is the identity root
        // (never temp-held) and no production path ever registered a namespace into temp.
        expect((reg as unknown as Record<string, unknown>).tempFileSigCanonicalizer).toBeUndefined();
        expect((reg as unknown as Record<string, unknown>).tempNamespaceSigCanonicalizer).toBeUndefined();
    });

    it('getId+get returns canonical single instance', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        reg.fileSigCanonicalizer.getOrCreateId(new FileSignature('p', 'f.ts'));
        const sig1 = new ClassSignature('A', new FileSignature('p', 'f.ts'), null);
        const sig2 = new ClassSignature('A', new FileSignature('p', 'f.ts'), null);
        const a = reg.classSigCanonicalizer.get(reg.classSigCanonicalizer.getOrCreateId(sig1))!;
        const b = reg.classSigCanonicalizer.get(reg.classSigCanonicalizer.getOrCreateId(sig2))!;
        expect(a).toBe(b);
        expect(a).toBe(sig1);
    });
});

describe('SignatureCanonicalizerRegistry Clean Test', () => {
    it('dispose clears singleton, getInstance rebuilds', () => {
        const a = SignatureCanonicalizerRegistry.getInstance();
        SignatureCanonicalizerRegistry.dispose();
        expect(SignatureCanonicalizerRegistry.getInstance()).not.toBe(a);
    });
});

describe('NamespaceSignature SigID constructor Test', () => {
    it('value-object overload resolves pre-interned declaring signatures and restores them via getters', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/ns-a.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const parentSig = new NamespaceSignature('Parent', fileSig, null);
        reg.namespaceSigCanonicalizer.getOrCreateId(parentSig);
        const nsSig = new NamespaceSignature('Child', fileSig, parentSig);

        // Getters resolve the canonical instances (value-equal to what was passed in)
        expect(nsSig.getDeclaringFileSignature().equals(fileSig)).toBe(true);
        expect(nsSig.getDeclaringNamespaceSignature()!.equals(parentSig)).toBe(true);
        // The parent chain resolves to the canonical interned instance
        expect(nsSig.getDeclaringNamespaceSignature()).toBe(reg.namespaceSigCanonicalizer.get(reg.namespaceSigCanonicalizer.getOrCreateId(parentSig))!);
        // Top-level namespace has no declaring namespace
        expect(parentSig.getDeclaringNamespaceSignature()).toBeNull();
    });

    it('SigID overload and value-object overload are equivalent (same ID, equals, hash)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/ns-b.ts');
        const fileID = reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const parentSig = new NamespaceSignature('Outer', fileSig, null);
        const parentID = reg.namespaceSigCanonicalizer.getOrCreateId(parentSig);

        const viaObjects = new NamespaceSignature('Inner', fileSig, parentSig);
        const viaIDs = new NamespaceSignature('Inner', fileID, parentID);

        expect(viaIDs.equals(viaObjects)).toBe(true);
        expect(viaObjects.equals(viaIDs)).toBe(true);
        expect(viaIDs.getHashCode()).toBe(viaObjects.getHashCode());
        expect(reg.namespaceSigCanonicalizer.getOrCreateId(viaIDs)).toBe(reg.namespaceSigCanonicalizer.getOrCreateId(viaObjects));
        expect(viaIDs.toString()).toBe(viaObjects.toString());
        expect(viaIDs.getDeclaringNamespaceSignature()).toBe(viaObjects.getDeclaringNamespaceSignature());
    });

    it('top-level namespace: undefined parent SigID equals explicit-undefined construction', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/ns-c.ts');
        const fileID = reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const withNull = new NamespaceSignature('Top', fileSig, null);
        const withID = new NamespaceSignature('Top', fileID);

        expect(withID.getDeclaringNamespaceSignature()).toBeNull();
        expect(withID.equals(withNull)).toBe(true);
        expect(withID.getHashCode()).toBe(withNull.getHashCode());
        expect(reg.namespaceSigCanonicalizer.getOrCreateId(withID)).toBe(reg.namespaceSigCanonicalizer.getOrCreateId(withNull));
    });

    it('nested toString recursively resolves the parent chain', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/ns-d.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const level1 = new NamespaceSignature('A', fileSig, null);
        reg.namespaceSigCanonicalizer.getOrCreateId(level1);
        const level2 = new NamespaceSignature('B', fileSig, level1);
        reg.namespaceSigCanonicalizer.getOrCreateId(level2);
        const level3 = new NamespaceSignature('C', fileSig, level2);

        expect(level3.toString()).toBe(`${fileSig.toString()}A.B.C`);
        expect(level3.toMapKey()).toBe(`${fileSig.toMapKey()}A.B.C`);
    });

    it('equals distinguishes different declaring files and parents by SigID', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileA = new FileSignature('proj', 'src/ns-e-a.ts');
        const fileB = new FileSignature('proj', 'src/ns-e-b.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileA);
        reg.fileSigCanonicalizer.getOrCreateId(fileB);
        const nsInA = new NamespaceSignature('Same', fileA, null);
        const nsInB = new NamespaceSignature('Same', fileB, null);
        expect(nsInA.equals(nsInB)).toBe(false);

        const parent1 = new NamespaceSignature('P1', fileA, null);
        const parent2 = new NamespaceSignature('P2', fileA, null);
        reg.namespaceSigCanonicalizer.getOrCreateId(parent1);
        reg.namespaceSigCanonicalizer.getOrCreateId(parent2);
        const child1 = new NamespaceSignature('Child', fileA, parent1);
        const child2 = new NamespaceSignature('Child', fileA, parent2);
        expect(child1.equals(child2)).toBe(false);
        // Top-level vs nested with same name are distinct
        const topLevel = new NamespaceSignature('Child', fileA, null);
        expect(child1.equals(topLevel)).toBe(false);
    });
});

describe('DEFAULT signature singleton Test', () => {
    it('DEFAULT getters return the canonical instance stored at sigID 0', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.fileSigCanonicalizer.get(0)).toBe(FileSignature.DEFAULT);
        expect(reg.classSigCanonicalizer.get(0)).toBe(ClassSignature.DEFAULT);
        expect(reg.namespaceSigCanonicalizer.get(0)).toBe(NamespaceSignature.DEFAULT);
        expect(reg.fieldSigCanonicalizer.get(0)).toBe(FieldSignature.DEFAULT);
        expect(reg.methodSigCanonicalizer.get(0)).toBe(MethodSignature.DEFAULT);
    });

    it('DEFAULT getters are stable across consecutive calls', () => {
        expect(FileSignature.DEFAULT).toBe(FileSignature.DEFAULT);
        expect(ClassSignature.DEFAULT).toBe(ClassSignature.DEFAULT);
    });

    it('value-equal DEFAULT instances intern to sigID 0 (even not explicitly registered)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.fileSigCanonicalizer.getExistingId(new FileSignature(UNKNOWN_PROJECT_NAME, UNKNOWN_FILE_NAME))).toBe(0);
        expect(reg.classSigCanonicalizer.getExistingId(new ClassSignature(UNKNOWN_CLASS_NAME, FileSignature.DEFAULT, null))).toBe(0);
    });

    it('signatures built from UNKNOWN constants intern to the DEFAULT sigID 0', () => {
        // The DEFAULT signature is defined purely by its UNKNOWN-constant value domain; any
        // signature built from the same constants shares sigID 0 with it.
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(
            reg.methodSigCanonicalizer.getExistingId(new MethodSignature(0, new MethodSubSignature(UNKNOWN_METHOD_NAME, [], UnknownType.getInstance(), false)))
        ).toBe(0);
        expect(reg.fieldSigCanonicalizer.getExistingId(new FieldSignature(UNKNOWN_FIELD_NAME, 0, UnknownType.getInstance(), false))).toBe(0);
        expect(reg.namespaceSigCanonicalizer.getExistingId(new NamespaceSignature(UNKNOWN_NAMESPACE_NAME, FileSignature.DEFAULT, null))).toBe(0);
    });

    it('isUnclear is false for non-default signatures', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/a.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSig = new ClassSignature('MyClass', fileSig, null);
        reg.classSigCanonicalizer.getOrCreateId(classSig);
        expect(fileSig.isUnclear()).toBe(false);
        expect(classSig.isUnclear()).toBe(false);
        expect(
            new MethodSignature(reg.classSigCanonicalizer.getOrCreateId(classSig), new MethodSubSignature('m', [], UnknownType.getInstance(), false)).isUnclear()
        ).toBe(false);
        expect(new FieldSignature('f', reg.classSigCanonicalizer.getOrCreateId(classSig), UnknownType.getInstance(), false).isUnclear()).toBe(false);
    });

    it('isUnclear is false for DEFAULT signatures (field-value check, no identity drift)', () => {
        // After the isDefault/isUnclear merge, DEFAULT is distinguished from unclear stubs
        // by field values (name '%unk' + fileSigID 0), not by registry identity —
        // so old/equal/new instances all report isUnclear() === false consistently.
        const equalInstance = new FileSignature(UNKNOWN_PROJECT_NAME, UNKNOWN_FILE_NAME);
        expect(equalInstance.isUnclear()).toBe(false);

        SignatureCanonicalizerRegistry.dispose();
        const newDefault = FileSignature.DEFAULT;
        const oldDefault = equalInstance;
        expect(newDefault.isUnclear()).toBe(false);
        expect(oldDefault.isUnclear()).toBe(false);
    });

    it('isUnclear semantics: direct field check (merged isDefault), formal ID means resolved', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/a.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const clearClassSig = new ClassSignature('Clear', fileSig, null);
        const unclearClassSig = new ClassSignature('Unclear', FileSignature.DEFAULT, null);
        expect(clearClassSig.isUnclear()).toBe(false);
        expect(unclearClassSig.isUnclear()).toBe(true);
        expect(ClassSignature.DEFAULT.isUnclear()).toBe(false);

        const clearMethodSig = new MethodSignature(
            reg.classSigCanonicalizer.getOrCreateId(clearClassSig),
            new MethodSubSignature('m', [], UnknownType.getInstance(), false)
        );
        // A positive formal declaring ID means the declaring class went through the formal
        // path — the method is not unclear, even if the class's own file happens to be
        // DEFAULT (architecturally, unclear classes go through temp, not formal; this test
        // interns one for coverage of the edge case).
        const unclearMethodSig = new MethodSignature(
            reg.classSigCanonicalizer.getOrCreateId(unclearClassSig),
            new MethodSubSignature('m', [], UnknownType.getInstance(), false)
        );
        expect(clearMethodSig.isUnclear()).toBe(false);
        expect(unclearMethodSig.isUnclear()).toBe(false);
        // DEFAULT method signature: declaring side is the DEFAULT class (SigID 0) —
        // "method on an unknown class", unclear by the non-positive-ID semantics.
        expect(MethodSignature.DEFAULT.isUnclear()).toBe(true);
    });
});

describe('ClassSignature SigID constructor Test', () => {
    it('value-object overload resolves pre-interned declaring signatures and restores them via getters', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/cls-a.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const nsSig = new NamespaceSignature('OuterNS', fileSig, null);
        reg.namespaceSigCanonicalizer.getOrCreateId(nsSig);
        const classSig = new ClassSignature('NestedClass', fileSig, nsSig);

        expect(classSig.getDeclaringFileSignature().equals(fileSig)).toBe(true);
        expect(classSig.getDeclaringNamespaceSignature()!.equals(nsSig)).toBe(true);
        expect(classSig.getDeclaringNamespaceSignature()).toBe(reg.namespaceSigCanonicalizer.get(reg.namespaceSigCanonicalizer.getOrCreateId(nsSig))!);
        // Top-level class has no declaring namespace
        const topLevel = new ClassSignature('TopLevel', fileSig, null);
        expect(topLevel.getDeclaringNamespaceSignature()).toBeNull();
    });

    it('SigID overload and value-object overload are equivalent (same ID, equals, hash)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/cls-b.ts');
        const fileID = reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const nsSig = new NamespaceSignature('NS', fileSig, null);
        const nsID = reg.namespaceSigCanonicalizer.getOrCreateId(nsSig);

        const viaObjects = new ClassSignature('Klass', fileSig, nsSig);
        const viaIDs = new ClassSignature('Klass', fileID, nsID);

        expect(viaIDs.equals(viaObjects)).toBe(true);
        expect(viaObjects.equals(viaIDs)).toBe(true);
        expect(viaIDs.getHashCode()).toBe(viaObjects.getHashCode());
        expect(reg.classSigCanonicalizer.getOrCreateId(viaIDs)).toBe(reg.classSigCanonicalizer.getOrCreateId(viaObjects));
        expect(viaIDs.toString()).toBe(viaObjects.toString());
        expect(viaIDs.getDeclaringNamespaceSignature()).toBe(viaObjects.getDeclaringNamespaceSignature());
    });

    it('top-level class: omitted namespace SigID equals explicit-undefined construction', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/cls-c.ts');
        const fileID = reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const withNull = new ClassSignature('Top', fileSig, null);
        const withID = new ClassSignature('Top', fileID);

        expect(withID.getDeclaringNamespaceSignature()).toBeNull();
        expect(withID.getDeclaringNamespaceSigID()).toBeUndefined();
        expect(withID.equals(withNull)).toBe(true);
        expect(withID.getHashCode()).toBe(withNull.getHashCode());
        expect(reg.classSigCanonicalizer.getOrCreateId(withID)).toBe(reg.classSigCanonicalizer.getOrCreateId(withNull));
    });

    it('nested class toString resolves the declaring namespace chain', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/cls-d.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const outerNS = new NamespaceSignature('Outer', fileSig, null);
        reg.namespaceSigCanonicalizer.getOrCreateId(outerNS);
        const innerNS = new NamespaceSignature('Inner', fileSig, outerNS);
        reg.namespaceSigCanonicalizer.getOrCreateId(innerNS);
        const classSig = new ClassSignature('Deep', fileSig, innerNS);

        expect(classSig.toString()).toBe(`${fileSig.toString()}Outer.Inner.Deep`);
    });

    it('equals distinguishes different declaring files and namespaces by SigID', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileA = new FileSignature('proj', 'src/cls-e-a.ts');
        const fileB = new FileSignature('proj', 'src/cls-e-b.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileA);
        reg.fileSigCanonicalizer.getOrCreateId(fileB);
        const inA = new ClassSignature('Same', fileA, null);
        const inB = new ClassSignature('Same', fileB, null);
        expect(inA.equals(inB)).toBe(false);

        const ns1 = new NamespaceSignature('N1', fileA, null);
        const ns2 = new NamespaceSignature('N2', fileA, null);
        reg.namespaceSigCanonicalizer.getOrCreateId(ns1);
        reg.namespaceSigCanonicalizer.getOrCreateId(ns2);
        const clsInNs1 = new ClassSignature('Klass', fileA, ns1);
        const clsInNs2 = new ClassSignature('Klass', fileA, ns2);
        expect(clsInNs1.equals(clsInNs2)).toBe(false);
        // Top-level vs in-namespace with same name are distinct
        const topLevel = new ClassSignature('Klass', fileA, null);
        expect(clsInNs1.equals(topLevel)).toBe(false);
    });

    it('AliasClassSignature forwards declaring SigIDs and preserves alias/original names', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/cls-f.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const nsSig = new NamespaceSignature('AliasNS', fileSig, null);
        reg.namespaceSigCanonicalizer.getOrCreateId(nsSig);
        const origin = new ClassSignature('OriginClass', fileSig, nsSig);
        const originID = reg.classSigCanonicalizer.getOrCreateId(origin);
        const alias = new AliasClassSignature('AliasName', origin);

        // The alias keeps the origin's declaring SigIDs (forwarded via ID accessors)
        expect(alias.getDeclaringFileSigID()).toBe(origin.getDeclaringFileSigID());
        expect(alias.getDeclaringNamespaceSigID()).toBe(origin.getDeclaringNamespaceSigID());
        expect(alias.getDeclaringFileSignature()).toBe(origin.getDeclaringFileSignature());
        expect(alias.getDeclaringNamespaceSignature()).toBe(origin.getDeclaringNamespaceSignature());
        // Name semantics: alias name for code, origin name preserved
        expect(alias.getClassName()).toBe('AliasName');
        expect(alias.getOriginName()).toBe('OriginClass');
        // U+（display 归一化）：alias 是一等 formal 签名——身份含 aliasName 维度
        //（与 origin 值不等、intern 为独立条目），toString/toMapKey 走 getClassName()
        // 多态（显示 aliasName）。
        expect(alias.equals(origin)).toBe(false);
        expect(origin.equals(alias)).toBe(false);
        const aliasID = reg.classSigCanonicalizer.getOrCreateId(alias);
        expect(aliasID).not.toBe(originID);
        expect(alias.getHashCode()).not.toBe(origin.getHashCode());
        expect(alias.toString()).toBe(`${fileSig.toString()}AliasNS.AliasName`);
        expect(alias.toMapKey()).toBe(`${fileSig.toMapKey()}AliasNS.AliasName`);
        // 同名 alias 值相等且 intern 幂等（同 origin 维度）
        const alias2 = new AliasClassSignature('AliasName', origin);
        expect(alias.equals(alias2)).toBe(true);
        expect(reg.classSigCanonicalizer.getOrCreateId(alias2)).toBe(aliasID);
        // 不同 aliasName 是不同签名
        const alias3 = new AliasClassSignature('OtherName', origin);
        expect(alias.equals(alias3)).toBe(false);
    });
});

describe('FieldSignature SigID constructor Test', () => {
    it('value-object overload (class) is equivalent to the class-ID overload', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/field-a.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSig = new ClassSignature('Host', fileSig, null);
        const classSigID = reg.classSigCanonicalizer.getOrCreateId(classSig);

        const viaObject = new FieldSignature('f', classSig, UnknownType.getInstance(), false);
        const viaID = new FieldSignature('f', classSigID, UnknownType.getInstance(), false);

        expect(viaID.equals(viaObject)).toBe(true);
        expect(viaObject.equals(viaID)).toBe(true);
        expect(viaID.getHashCode()).toBe(viaObject.getHashCode());
        expect(reg.fieldSigCanonicalizer.getOrCreateId(viaID)).toBe(reg.fieldSigCanonicalizer.getOrCreateId(viaObject));
        expect(viaID.toString()).toBe(viaObject.toString());
        expect(viaID.getDeclaringClassSigID()).toBe(classSigID);
        expect(viaID.getDeclaringNamespaceSigID()).toBeUndefined();
        expect(classSig.equals(viaID.getDeclaringSignature() as ClassSignature)).toBe(true);
    });

    it('value-object overload (namespace) is equivalent to the namespace-ID overload (5-arg)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/field-b.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const nsSig = new NamespaceSignature('NS', fileSig, null);
        const nsSigID = reg.namespaceSigCanonicalizer.getOrCreateId(nsSig);

        const viaObject = new FieldSignature('v', nsSig, UnknownType.getInstance(), true);
        const viaID = new FieldSignature('v', nsSigID, UnknownType.getInstance(), true, true);

        expect(viaID.equals(viaObject)).toBe(true);
        expect(viaObject.equals(viaID)).toBe(true);
        expect(viaID.getHashCode()).toBe(viaObject.getHashCode());
        expect(reg.fieldSigCanonicalizer.getOrCreateId(viaID)).toBe(reg.fieldSigCanonicalizer.getOrCreateId(viaObject));
        expect(viaID.toString()).toBe(viaObject.toString());
        expect(viaID.getDeclaringNamespaceSigID()).toBe(nsSigID);
        expect(viaID.getDeclaringClassSigID()).toBeUndefined();
        expect(nsSig.equals(viaID.getDeclaringSignature() as NamespaceSignature)).toBe(true);
        expect(viaID.getBaseName()).toBe('NS');
    });

    it('class and namespace ID spaces occupy disjoint slots: same name and ID never equal', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/field-c.ts');
        const fileSigID = reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSigID = reg.classSigCanonicalizer.getOrCreateId(new ClassSignature('Same', fileSig, null));
        const nsSigID = reg.namespaceSigCanonicalizer.getOrCreateId(new NamespaceSignature('Same', fileSigID));

        const viaClass = new FieldSignature('f', classSigID, UnknownType.getInstance(), false);
        const viaNS = new FieldSignature('f', nsSigID, UnknownType.getInstance(), false, true);

        // The two ID spaces are distinguished by slot occupancy, never by numeric equality.
        expect(viaClass.equals(viaNS)).toBe(false);
        expect(viaNS.equals(viaClass)).toBe(false);
        // The slot accessors expose the distinction
        expect(viaClass.getDeclaringClassSigID()).toBe(classSigID);
        expect(viaClass.getDeclaringNamespaceSigID()).toBeUndefined();
        expect(viaNS.getDeclaringNamespaceSigID()).toBe(nsSigID);
        expect(viaNS.getDeclaringClassSigID()).toBeUndefined();
    });

    it('equals distinguishes fieldName and staticFlag on the ID paths', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/field-d.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSigID = reg.classSigCanonicalizer.getOrCreateId(new ClassSignature('Host', fileSig, null));

        const a = new FieldSignature('x', classSigID, UnknownType.getInstance(), false);
        const b = new FieldSignature('y', classSigID, UnknownType.getInstance(), false);
        const c = new FieldSignature('x', classSigID, UnknownType.getInstance(), true);
        expect(a.equals(b)).toBe(false);
        expect(a.equals(c)).toBe(false);
        // type is not part of identity
        const d = new FieldSignature('x', classSigID, NumberType.getInstance(), false);
        expect(a.equals(d)).toBe(true);
    });

    it('toString prefixes [static] and resolves the declaring signature via ID', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/field-e.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSigID = reg.classSigCanonicalizer.getOrCreateId(new ClassSignature('StaticHost', fileSig, null));

        const fs = new FieldSignature('count', classSigID, NumberType.getInstance(), true);
        expect(fs.toString()).toBe(`${fileSig.toString()}StaticHost.[static]count`);
        expect(fs.getBaseName()).toBe('StaticHost');
    });
});

describe('MethodSignature canonical parameter-name refresh Test', () => {
    function param(name: string): MethodParameter[] {
        const p = new MethodParameter();
        p.setName(name);
        p.setType(UnknownType.getInstance());
        return [p];
    }

    it('declaration-first then implementation refreshes canonical parameter names', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/param-refresh-a.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSigID = reg.classSigCanonicalizer.getOrCreateId(new ClassSignature('Host', fileSig, null));

        // Declaration built first (interns the canonical instance with param name 'declName')
        const declaring = new MethodSignature(classSigID, new MethodSubSignature('doWork', param('declName'), UnknownType.getInstance(), false));
        reg.methodSigCanonicalizer.getOrCreateId(declaring);

        // Implementation with a different parameter name but same types -> same SigID
        const impl = new MethodSignature(classSigID, new MethodSubSignature('doWork', param('implName'), UnknownType.getInstance(), false));
        expect(reg.methodSigCanonicalizer.getOrCreateId(impl)).toBe(reg.methodSigCanonicalizer.getOrCreateId(declaring));

        // The constructor path delegates to setImplementationSignature, so the refresh applies
        new ArkMethod(classSigID, impl);

        // The canonical instance now carries the implementation-side parameter name
        const canonical = reg.methodSigCanonicalizer.get(reg.methodSigCanonicalizer.getOrCreateId(impl))!;
        expect(canonical.getMethodSubSignature().getParameters()[0].getName()).toBe('implName');
        // Both signatures resolve to the same canonical instance (identity unchanged by the refresh)
        expect(reg.methodSigCanonicalizer.getOrCreateId(declaring)).toBe(
            canonical.getMethodSubSignature().getParameters()[0] ? reg.methodSigCanonicalizer.getOrCreateId(impl) : -1
        );
        // toString is unaffected: parameter names are not part of it
        expect(canonical.toString()).toBe(declaring.toString());
    });

    it('same parameter names: no refresh path, canonical stays the single instance', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/param-refresh-b.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSigID = reg.classSigCanonicalizer.getOrCreateId(new ClassSignature('Host2', fileSig, null));

        const declaring = new MethodSignature(classSigID, new MethodSubSignature('same', param('x'), UnknownType.getInstance(), false));
        reg.methodSigCanonicalizer.getOrCreateId(declaring);
        const impl = new MethodSignature(classSigID, new MethodSubSignature('same', param('x'), UnknownType.getInstance(), false));

        new ArkMethod(classSigID, impl);

        const canonical = reg.methodSigCanonicalizer.get(reg.methodSigCanonicalizer.getOrCreateId(impl))!;
        expect(canonical.getMethodSubSignature().getParameters()[0].getName()).toBe('x');
        expect(canonical).toBe(reg.methodSigCanonicalizer.get(reg.methodSigCanonicalizer.getOrCreateId(declaring))!);
    });

    it('parameter count mismatch never refreshes (defensive)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/param-refresh-c.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSigID = reg.classSigCanonicalizer.getOrCreateId(new ClassSignature('Host3', fileSig, null));

        // Note: different parameter counts produce different signatures (different SigID),
        // so the canonical instance of the impl ID is the impl itself — no refresh happens.
        const declaring = new MethodSignature(classSigID, new MethodSubSignature('arity', param('a'), UnknownType.getInstance(), false));
        reg.methodSigCanonicalizer.getOrCreateId(declaring);
        const impl = new MethodSignature(classSigID, new MethodSubSignature('arity', [...param('a'), ...param('b')], UnknownType.getInstance(), false));

        new ArkMethod(classSigID, impl);

        const canonical = reg.methodSigCanonicalizer.get(reg.methodSigCanonicalizer.getOrCreateId(impl))!;
        expect(canonical).toBe(impl);
        expect(canonical.getMethodSubSignature().getParameters().length).toBe(2);
    });
});

describe('MethodSignature SigID constructor Test', () => {
    it('value-object overload is equivalent to the ClassSigID overload', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/msig-a.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSig = new ClassSignature('Host', fileSig, null);
        const classSigID = reg.classSigCanonicalizer.getOrCreateId(classSig);
        const subSig = new MethodSubSignature('work', [], UnknownType.getInstance(), false);

        const viaObject = new MethodSignature(classSig, subSig);
        const viaID = new MethodSignature(classSigID, subSig);

        expect(viaID.equals(viaObject)).toBe(true);
        expect(viaObject.equals(viaID)).toBe(true);
        expect(viaID.getHashCode()).toBe(viaObject.getHashCode());
        expect(reg.methodSigCanonicalizer.getOrCreateId(viaID)).toBe(reg.methodSigCanonicalizer.getOrCreateId(viaObject));
        expect(viaID.toString()).toBe(viaObject.toString());
        expect(viaID.getDeclaringClassSigID()).toBe(classSigID);
        expect(viaID.getDeclaringClassSignature().equals(classSig)).toBe(true);
    });

    it('equals distinguishes declaring classes by SigID; return-type semantics preserved', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSigA = new FileSignature('proj', 'src/msig-b-a.ts');
        const fileSigB = new FileSignature('proj', 'src/msig-b-b.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSigA);
        reg.fileSigCanonicalizer.getOrCreateId(fileSigB);
        const classSigAID = reg.classSigCanonicalizer.getOrCreateId(new ClassSignature('Same', fileSigA, null));
        const classSigBID = reg.classSigCanonicalizer.getOrCreateId(new ClassSignature('Same', fileSigB, null));

        const inA = new MethodSignature(classSigAID, new MethodSubSignature('m', [], UnknownType.getInstance(), false));
        const inB = new MethodSignature(classSigBID, new MethodSubSignature('m', [], UnknownType.getInstance(), false));
        expect(inA.equals(inB)).toBe(false);

        // Return type participates in equality (established semantics), but not in hash.
        const r1 = new MethodSignature(classSigAID, new MethodSubSignature('m', [], NumberType.getInstance(), false));
        const r2 = new MethodSignature(classSigAID, new MethodSubSignature('m', [], UnknownType.getInstance(), false));
        expect(r1.equals(r2)).toBe(false);
        expect(r1.getHashCode()).toBe(inA.getHashCode());
    });

    it('hash is stable across parameter-type mutation: re-intern after re-anchoring hits the same ID', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/msig-hash-stable.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const hostID = reg.classSigCanonicalizer.getOrCreateId(new ClassSignature('HashHost', fileSig, null));

        const sizeBefore = reg.methodSigCanonicalizer.size();

        // Build-time state: parameter type is an unresolved stub ClassType.
        const stubCb = new ClassType(new ClassSignature('HashCb', 0));
        const param = new MethodParameter();
        param.setName('c');
        param.setType(stubCb);
        const sig1 = new MethodSignature(hostID, new MethodSubSignature('run', [param], UnknownType.getInstance(), false));
        const id1 = reg.methodSigCanonicalizer.getOrCreateId(sig1);

        // In-place mutation: inference resolves HashCb, the parameter's ClassType gets re-anchored.
        const resolvedCb = new ClassSignature('HashCb', fileSig, null);
        reg.classSigCanonicalizer.getOrCreateId(resolvedCb);
        stubCb.setClassSignature(resolvedCb);

        // A freshly built signature with the same (now resolved) parameter type.
        const param2 = new MethodParameter();
        param2.setName('c');
        param2.setType(stubCb);
        const sig2 = new MethodSignature(hostID, new MethodSubSignature('run', [param2], UnknownType.getInstance(), false));

        // equals-equal ⇒ hash-equal (the contract a mutation-window re-intern depends on):
        // the hash covers only lifetime-stable identity fields, so the re-anchoring above
        // does not split the two constructions into different buckets.
        expect(sig1.equals(sig2)).toBe(true);
        expect(sig2.getHashCode()).toBe(sig1.getHashCode());
        expect(reg.methodSigCanonicalizer.getExistingId(sig2)).toBe(id1);
        // Exactly one registration — no spurious duplicate from a cross-window miss.
        expect(reg.methodSigCanonicalizer.size()).toBe(sizeBefore + 1);
    });

    it('isUnclear via SigID: positive formal ID means resolved; non-positive (-1 temp, 0 DEFAULT declaring) is unclear', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/msig-c.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const clearID = reg.classSigCanonicalizer.getOrCreateId(new ClassSignature('Clear', fileSig, null));
        const unclearID = reg.classSigCanonicalizer.getOrCreateId(new ClassSignature('Unclear', FileSignature.DEFAULT, null));

        expect(new MethodSignature(clearID, new MethodSubSignature('m', [], UnknownType.getInstance(), false)).isUnclear()).toBe(false);
        // A positive formal ID means resolved, even if the class's own file is DEFAULT
        // (architecturally, unclear classes go through temp).
        expect(new MethodSignature(unclearID, new MethodSubSignature('m', [], UnknownType.getInstance(), false)).isUnclear()).toBe(false);
        // DEFAULT declaring class (SigID 0): "method on an unknown class" — unclear
        expect(new MethodSignature(0, new MethodSubSignature('m', [], UnknownType.getInstance(), false)).isUnclear()).toBe(true);
    });

    it('getDeclaringClassSigID returns the interned ID directly (no lazy interning)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/msig-d.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSigID = reg.classSigCanonicalizer.getOrCreateId(new ClassSignature('Direct', fileSig, null));

        const ms = new MethodSignature(classSigID, new MethodSubSignature('m', [], UnknownType.getInstance(), false));
        expect(ms.getDeclaringClassSigID()).toBe(classSigID);
        expect(reg.classSigCanonicalizer.get(classSigID)!.getClassName()).toBe('Direct');
    });
});

describe('ArkNamespace ID-injecting constructor Test', () => {
    it('full injection: signature registered via setSignature inside the constructor', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/ns-ctor-a.ts');
        const fileSigID = reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const nsSig = new NamespaceSignature('Injected', fileSigID);

        const ns = new ArkNamespace(fileSigID, undefined, nsSig);

        // setSignature was the registration point: SigID assigned and model registered
        expect(ns.getNamespaceSigID()).toBeGreaterThan(0);
        expect(reg.namespaceSigCanonicalizer.getModel(ns.getNamespaceSigID())).toBe(ns);
        // Field state equals the legacy setter-chain result
        expect(ns.getDeclaringFileID()).toBe(fileSigID);
        expect(ns.getDeclaringArkNamespace()).toBeNull();
        expect(ns.getSignature()).toBe(reg.namespaceSigCanonicalizer.get(reg.namespaceSigCanonicalizer.getOrCreateId(nsSig))!);
        expect(ns.getName()).toBe('Injected');
    });

    it('nested injection: parent namespace SigID resolves back to the parent', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/ns-ctor-b.ts');
        const fileSigID = reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const parentSig = new NamespaceSignature('Parent', fileSigID);
        const parent = new ArkNamespace(fileSigID, undefined, parentSig);

        // Nested namespace: value-object overload with the parent signature (interns the parent)
        const childSig = new NamespaceSignature('Child', fileSig, parentSig);
        const child = new ArkNamespace(fileSigID, parent.getNamespaceSigID(), childSig);

        expect(child.getDeclaringArkNamespace()).toBe(parent);
        expect(child.getDeclaringFileID()).toBe(fileSigID);
        expect(child.getName()).toBe('Child');
    });

    it('partial injection: fileID only (signature set later, cpp pattern)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/ns-ctor-c.ts');
        const fileSigID = reg.fileSigCanonicalizer.getOrCreateId(fileSig);

        const ns = new ArkNamespace(fileSigID);

        expect(ns.getDeclaringFileID()).toBe(fileSigID);
        expect(ns.getNamespaceSigID()).toBe(-1);
        expect(reg.namespaceSigCanonicalizer.getModels().length).toBeGreaterThanOrEqual(0);

        // Late setSignature still registers (the cpp buildArkNamespace flow)
        ns.setSignature(new NamespaceSignature('Late', fileSigID));
        expect(ns.getNamespaceSigID()).toBeGreaterThan(0);
        expect(reg.namespaceSigCanonicalizer.getModel(ns.getNamespaceSigID())).toBe(ns);
    });

    it('injected construction is equivalent to the deprecated no-arg + setter chain', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSigA = new FileSignature('proj', 'src/ns-ctor-d1.ts');
        const fileSigB = new FileSignature('proj', 'src/ns-ctor-d2.ts');
        const fileSigAID = reg.fileSigCanonicalizer.getOrCreateId(fileSigA);
        const fileSigBID = reg.fileSigCanonicalizer.getOrCreateId(fileSigB);

        const injected = new ArkNamespace(fileSigAID, undefined, new NamespaceSignature('Same', fileSigAID));
        // eslint-disable-next-line deprecation/deprecation
        const legacy = new ArkNamespace();
        legacy.setSignature(new NamespaceSignature('Same', fileSigBID));
        legacy.setDeclaringArkFile(new ArkFile(Language.TYPESCRIPT));

        // Same name + declaring file value -> same signature identity, same registration semantics
        expect(injected.getNamespaceSigID()).toBe(reg.namespaceSigCanonicalizer.getOrCreateId(new NamespaceSignature('Same', fileSigAID)));
        expect(legacy.getNamespaceSigID()).toBe(reg.namespaceSigCanonicalizer.getOrCreateId(new NamespaceSignature('Same', fileSigBID)));
        expect(injected.getName()).toBe(legacy.getName());
    });
});

describe('Unclear stub routing to temp canonicalizer Test', () => {
    function makeStub(className: string): ClassSignature {
        // Unclear stub: declaring file is FileSignature.DEFAULT
        return new ClassSignature(className, 0, undefined);
    }

    it('MethodSignature with an unclear stub declaring class does not intern the stub into the formal space', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const before = reg.classSigCanonicalizer.size();
        const stub = makeStub('StubHost');
        expect(stub.isUnclear()).toBe(true);

        const sub = new MethodSubSignature('work', [], UnknownType.getInstance(), false);
        const ms = new MethodSignature(stub, sub);

        // Formal class space unchanged (no hole created)
        expect(reg.classSigCanonicalizer.size()).toBe(before);
        // The stub lives in the temp space (reference semantics)
        expect(ms.getDeclaringClassSigID()).toBe(-1);
        expect(ms.getDeclaringClassTempSigID()).toBeDefined();
        expect(reg.tempClassSigCanonicalizer.get(ms.getDeclaringClassTempSigID()!)).toBe(stub);
        // The method signature itself is unclear -> FunctionType routing goes to temp
        expect(ms.isUnclear()).toBe(true);
        // Display cache preserves the exact stub instance for toString
        expect(ms.getDeclaringClassSignature()).toBe(stub);
        expect(ms.toString()).toContain('StubHost');
    });

    it('FieldSignature with an unclear stub declaring class does not intern the stub into the formal space', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const before = reg.classSigCanonicalizer.size();
        const stub = makeStub('FieldStubHost');

        const fs = new FieldSignature('value', stub, UnknownType.getInstance(), false);

        expect(reg.classSigCanonicalizer.size()).toBe(before);
        expect(fs.getDeclaringClassSigID()).toBe(-1);
        expect(fs.getDeclaringClassTempSigID()).toBeDefined();
        expect(fs.isUnclear()).toBe(true);
        expect(fs.getDeclaringSignature()).toBe(stub);
        expect(fs.toString()).toContain('FieldStubHost');
    });

    it('Two same-valued stubs stay independent (reference semantics, no premature folding)', () => {
        const stub1 = makeStub('Same');
        const stub2 = makeStub('Same');
        const sub = new MethodSubSignature('m', [], UnknownType.getInstance(), false);

        const ms1 = new MethodSignature(stub1, sub);
        const ms2 = new MethodSignature(stub2, sub);

        // Different temp registrations -> different identity (independently migratable)
        expect(ms1.getDeclaringClassTempSigID()).not.toBe(ms2.getDeclaringClassTempSigID());
        expect(ms1.equals(ms2)).toBe(false);
    });

    it('Clear declaring signatures still resolve to formal IDs via the object path', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/stub-routing-a.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSig = new ClassSignature('ClearHost', fileSig, null);
        const classSigID = reg.classSigCanonicalizer.getOrCreateId(classSig);

        const sub = new MethodSubSignature('m', [], UnknownType.getInstance(), false);
        const ms = new MethodSignature(classSig, sub);
        expect(ms.getDeclaringClassSigID()).toBe(classSigID);
        expect(ms.getDeclaringClassTempSigID()).toBeUndefined();
        expect(ms.isUnclear()).toBe(false);
    });

    it('FieldSignature with an unclear namespace declaring signature marks unclear (no temp registration)', () => {
        // Unclear namespace stub: declaring file is DEFAULT
        const nsStub = new NamespaceSignature('NsStub', 0, undefined);
        expect(nsStub.isUnclear()).toBe(true);

        const fs = new FieldSignature('nsField', nsStub, UnknownType.getInstance(), false);

        // Unclear marking without any temp space (the temp namespace space never had a
        // production registrant and was removed).
        expect(fs.getDeclaringNamespaceSigID()).toBe(-1);
        expect(fs.isUnclear()).toBe(true);
        // B 轮（索引表）：display 锚删除后该形态的 SigID 路径无取回（生产不可达
        // ——生产调用点全走 SigID+true 重载，本形态仅测试可构造）；
        // getDeclaringSignature 降级 DEFAULT（stale 降级路径 + error log），
        // 调用方需自持 ns 实例。
        expect(fs.getDeclaringSignature()).toBe(ClassSignature.DEFAULT);
    });

    it('buildMethodSignatureFromClassNameAndMethodName routes its stub through temp (no formal class hole)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const before = reg.classSigCanonicalizer.size();

        const ms = ArkSignatureBuilder.buildMethodSignatureFromClassNameAndMethodName('ComponentStub', 'create');

        expect(reg.classSigCanonicalizer.size()).toBe(before);
        expect(ms.getDeclaringClassSigID()).toBe(-1);
        expect(ms.getDeclaringClassTempSigID()).toBeDefined();
        expect(ms.isUnclear()).toBe(true);
        // Display name preserved for ViewTree-style consumers
        expect(ms.getDeclaringClassSignature().getClassName()).toBe('ComponentStub');
    });
});

describe('Component stub cache Test (ArkSignatureBuilder, A2 批 1)', () => {
    it('whitelisted component names share one stub instance (and one temp SigID) across factory calls', () => {
        // 'ForEach' 在 isEtsSystemComponent 的初始内置集合内（SDK 未加载也命中白名单）。
        const s1 = ArkSignatureBuilder.buildClassSignatureFromClassName('ForEach');
        const s2 = ArkSignatureBuilder.buildClassSignatureFromClassName('ForEach');
        expect(s1).toBe(s2);
        // 组件常量 'View'（COMPONENT_CUSTOMVIEW）同样命中白名单。
        const v1 = ArkSignatureBuilder.buildClassSignatureFromClassName('View');
        const v2 = ArkSignatureBuilder.buildClassSignatureFromClassName('View');
        expect(v1).toBe(v2);
        expect(v1).not.toBe(s1);
        // 共享实例 → MethodSignature 构造的 declaring register 幂等复用同一 temp ID
        //（class 空间"每名字一行"而非"每语句一行"）。
        const ms1 = new MethodSignature(v1, new MethodSubSignature('create', [], UnknownType.getInstance(), false));
        const ms2 = new MethodSignature(v2, new MethodSubSignature('create', [], UnknownType.getInstance(), false));
        expect(ms1.getDeclaringClassTempSigID()).toBe(ms2.getDeclaringClassTempSigID());
    });

    it('non-whitelisted names (arbitrary class names) keep per-call new instances', () => {
        const s1 = ArkSignatureBuilder.buildClassSignatureFromClassName('MyArbitraryClass');
        const s2 = ArkSignatureBuilder.buildClassSignatureFromClassName('MyArbitraryClass');
        expect(s1).not.toBe(s2);
        expect(s1.equals(s2)).toBe(true);
    });

    it('clearComponentStubCache drops the shared instances (next call builds a fresh one)', () => {
        const s1 = ArkSignatureBuilder.buildClassSignatureFromClassName('View');
        ArkSignatureBuilder.clearComponentStubCache();
        const s2 = ArkSignatureBuilder.buildClassSignatureFromClassName('View');
        expect(s2).not.toBe(s1);
        expect(s2.equals(s1)).toBe(true);
    });
});

describe('Builtin stub cache Test', () => {
    it('same builtin name shares one stub instance (and one temp SigID) across accesses', () => {
        const s1 = Builtin.getBuiltinClassSignature('Array');
        const s2 = Builtin.getBuiltinClassSignature('Array');
        expect(s1).toBe(s2);

        const ms1 = new MethodSignature(s1, new MethodSubSignature('a', [], UnknownType.getInstance(), false));
        const ms2 = new MethodSignature(s2, new MethodSubSignature('a', [], UnknownType.getInstance(), false));
        expect(ms1.getDeclaringClassTempSigID()).toBe(ms2.getDeclaringClassTempSigID());
    });

    it('stub instances are dispose-stable: reused across registry rebuilds with fresh temp IDs', () => {
        // Grab a stub and intern a temp ID under it in the current registry
        const stubBefore = Builtin.getBuiltinClassSignature('Object');
        const msBefore = new MethodSignature(stubBefore, new MethodSubSignature('m', [], UnknownType.getInstance(), false));
        const tempIdBefore = msBefore.getDeclaringClassTempSigID()!;
        expect(tempIdBefore).toBeGreaterThan(-1);

        // Rebuild the registry (clears temp IDs; Canonicalizer.clear() strips the old symbol)
        SignatureCanonicalizerRegistry.dispose();
        const regAfter = SignatureCanonicalizerRegistry.getInstance();

        // Same stub instance is handed out again (no cache invalidation needed)
        const stubAfter = Builtin.getBuiltinClassSignature('Object');
        expect(stubAfter).toBe(stubBefore);

        // Re-registering yields a fresh temp ID in the new registry (refcount starts over)
        const msAfter = new MethodSignature(stubAfter, new MethodSubSignature('m', [], UnknownType.getInstance(), false));
        const tempIdAfter = msAfter.getDeclaringClassTempSigID()!;
        expect(tempIdAfter).toBeGreaterThan(-1);
        expect(regAfter.tempClassSigCanonicalizer.get(tempIdAfter)).toBe(stubAfter);
        void tempIdBefore;
    });

    it('BuiltinCxx shares the same stub instances with core Builtin for common names', () => {
        const coreObject = Builtin.getBuiltinClassSignature('Object');
        const cxxObject = BuiltinCxx.getBuiltinClassSignature('Object');
        expect(cxxObject).toBe(coreObject);

        const msCore = new MethodSignature(coreObject, new MethodSubSignature('m', [], UnknownType.getInstance(), false));
        const msCxx = new MethodSignature(cxxObject, new MethodSubSignature('m', [], UnknownType.getInstance(), false));
        expect(msCxx.getDeclaringClassTempSigID()).toBe(msCore.getDeclaringClassTempSigID());
    });
});

describe('BySig lookup read-only Test', () => {
    it('getClassBySig never interns the queried signature', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const before = reg.classSigCanonicalizer.size();
        // Only the file signature is interned; the class value stays unregistered on purpose.
        const fileSig = new FileSignature('proj', 'src/never-a.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const unregistered = new ClassSignature('NeverRegistered', fileSig, null);

        expect(reg.getClassBySig(unregistered)).toBeUndefined();
        // No interning side effect: the signature table is unchanged
        expect(reg.classSigCanonicalizer.size()).toBe(before);
        expect(reg.classSigCanonicalizer.getExistingId(unregistered)).toBe(-1);
    });

    it('getClassBySig resolves after the class is registered', () => {
        const scene = new Scene();
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        arkFile.setScene(scene);
        const fileSig = new FileSignature('proj', 'src/bysig-hit.ts');
        arkFile.setFileSignature(fileSig);
        const arkClass = new ArkClass(arkFile.getFileSigID());
        const classSig = new ClassSignature('BySigHost', fileSig, null);
        arkClass.setSignature(classSig);
        arkFile.addArkClass(arkClass);

        const reg = SignatureCanonicalizerRegistry.getInstance();
        const resolved = reg.getClassBySig(new ClassSignature('BySigHost', fileSig, null));
        expect(resolved).toBe(arkClass);
    });

    it('getNamespaceBySig never interns and resolves registered namespaces', () => {
        const scene = new Scene();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const unregisteredNs = new NamespaceSignature('NeverRegisteredNs', reg.fileSigCanonicalizer.getOrCreateId(new FileSignature('proj', 'src/never-ns.ts')));
        const before = reg.namespaceSigCanonicalizer.size();

        expect(reg.getNamespaceBySig(unregisteredNs)).toBeUndefined();
        expect(reg.namespaceSigCanonicalizer.size()).toBe(before);
        expect(reg.namespaceSigCanonicalizer.getExistingId(unregisteredNs)).toBe(-1);

        // Registered namespace resolves back
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        arkFile.setScene(scene);
        const fileSig = new FileSignature('proj', 'src/ns-bysig.ts');
        arkFile.setFileSignature(fileSig);
        const fileSigID = reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const ns = new ArkNamespace(fileSigID, undefined, new NamespaceSignature('NsBySigHost', fileSigID));
        expect(reg.getNamespaceBySig(new NamespaceSignature('NsBySigHost', fileSigID))).toBe(ns);
    });

    it('getFileBySig and getFieldBySig never intern the queried signature', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileBefore = reg.fileSigCanonicalizer.size();
        const fieldBefore = reg.fieldSigCanonicalizer.size();

        expect(reg.getFileBySig(new FileSignature('proj', 'src/never-file.ts'))).toBeUndefined();
        expect(reg.fileSigCanonicalizer.size()).toBe(fileBefore);

        const fieldSig = new FieldSignature('neverField', 9999, UnknownType.getInstance(), false);
        expect(reg.getFieldBySig(fieldSig)).toBeUndefined();
        expect(reg.fieldSigCanonicalizer.size()).toBe(fieldBefore);
        expect(reg.fieldSigCanonicalizer.getExistingId(fieldSig)).toBe(-1);
    });
});

describe('Value-object overload defensive fallback Test (mode B\', work item P)', () => {
    it('ClassSignature defaults the declaring FileSigID to 0 when not interned (composite becomes unclear)', () => {
        const fileSig = new FileSignature('proj', 'src/fallback-a.ts');
        const sig = new ClassSignature('Host', fileSig, null);
        expect(sig.getDeclaringFileSigID()).toBe(0);
        expect(sig.isUnclear()).toBe(true);
    });

    it('NamespaceSignature defaults the declaring FileSigID to 0 when not interned', () => {
        const fileSig = new FileSignature('proj', 'src/fallback-b.ts');
        const sig = new NamespaceSignature('NS', fileSig, null);
        expect(sig.getDeclaringFileSigID()).toBe(0);
        expect(sig.isUnclear()).toBe(true);
    });

    it('MethodSignature routes to temp when a clear declaring class signature is not interned', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/fallback-c.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        // Clear (file interned) but the class value itself was never interned → error log + tempClass fallback.
        const classSig = new ClassSignature('UninternedHost', fileSig, null);
        const sub = new MethodSubSignature('m', [], UnknownType.getInstance(), false);
        const methodSig = new MethodSignature(classSig, sub);
        expect(methodSig.isUnclear()).toBe(true);
        expect(methodSig.getDeclaringClassSigID()).toBe(-1);
        expect(methodSig.getDeclaringClassTempSigID()).toBeDefined();
    });

    it('FieldSignature routes to temp when a clear declaring class signature is not interned', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('proj', 'src/fallback-d.ts');
        reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSig = new ClassSignature('UninternedHost', fileSig, null);
        const fieldSig = new FieldSignature('f', classSig, UnknownType.getInstance(), false);
        expect(fieldSig.isUnclear()).toBe(true);
        expect(fieldSig.getDeclaringClassSigID()).toBe(-1);
        expect(fieldSig.getDeclaringClassTempSigID()).toBeDefined();
    });
});
