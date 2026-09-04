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
import { Scene } from '../../src/Scene';
import { SignatureCanonicalizerRegistry } from '../../src/core/common/SignatureCanonicalizerRegistry';
import { FileSignature, ClassSignature, MethodSignature, MethodSubSignature, NamespaceSignature, FieldSignature } from '../../src/core/model/ArkSignature';
import { ArkFile, Language } from '../../src/core/model/ArkFile';
import { UnknownType } from '../../src/core/base/Type';

describe('Scene Canonicalizer Integration Test', () => {
    it('DEFAULT signatures are interned to formal canonicalizers with ID 0', () => {
        const scene = new Scene();
        expect(scene.getFileSigCanonicalizer().getExistingId(FileSignature.DEFAULT)).toBe(0);
        expect(scene.getClassSigCanonicalizer().getExistingId(ClassSignature.DEFAULT)).toBe(0);
        expect(scene.getMethodSigCanonicalizer().getExistingId(MethodSignature.DEFAULT)).toBe(0);
        expect(scene.getNamespaceSigCanonicalizer().getExistingId(NamespaceSignature.DEFAULT)).toBe(0);
        expect(scene.getFieldSigCanonicalizer().getExistingId(FieldSignature.DEFAULT)).toBe(0);
    });

    it('internFileSig returns same ID for same FileSignature value', () => {
        new Scene();
        const sig1 = new FileSignature('proj', 'src/a.ts');
        const sig2 = new FileSignature('proj', 'src/a.ts');
        const id1 = SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getId(sig1);
        const id2 = SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getId(sig2);
        expect(id1).toBe(id2);
        expect(id1).toBeGreaterThan(0);
    });

    it('internFileSig returns different IDs for different FileSignature values', () => {
        new Scene();
        const id1 = SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getId(new FileSignature('proj', 'src/a.ts'));
        const id2 = SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getId(new FileSignature('proj', 'src/b.ts'));
        expect(id1).not.toBe(id2);
    });

    it('internClassSig returns same ID for same ClassSignature value', () => {
        new Scene();
        const fileSig = new FileSignature('proj', 'src/a.ts');
        SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getId(fileSig);
        const sig1 = new ClassSignature('MyClass', fileSig, null);
        const sig2 = new ClassSignature('MyClass', fileSig, null);
        expect(SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getId(sig1)).toBe(
            SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getId(sig2)
        );
    });

    it('internMethodSig returns same ID for same MethodSignature value', () => {
        new Scene();
        const fileSig = new FileSignature('proj', 'src/a.ts');
        SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getId(fileSig);
        const classSig = new ClassSignature('MyClass', fileSig, null);
        const ms1 = new MethodSignature(
            SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getId(classSig),
            new MethodSubSignature('foo', [], UnknownType.getInstance(), false)
        );
        const ms2 = new MethodSignature(
            SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getId(classSig),
            new MethodSubSignature('foo', [], UnknownType.getInstance(), false)
        );
        expect(SignatureCanonicalizerRegistry.getInstance().methodSigCanonicalizer.getId(ms1)).toBe(
            SignatureCanonicalizerRegistry.getInstance().methodSigCanonicalizer.getId(ms2)
        );
    });

    it('internNamespaceSig returns same ID for same NamespaceSignature value', () => {
        new Scene();
        const fileSig = new FileSignature('proj', 'src/a.ts');
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSigID = reg.fileSigCanonicalizer.getId(fileSig);
        const sig1 = new NamespaceSignature('MyNS', fileSigID);
        const sig2 = new NamespaceSignature('MyNS', fileSigID);
        expect(reg.namespaceSigCanonicalizer.getId(sig1)).toBe(reg.namespaceSigCanonicalizer.getId(sig2));
    });

    it('filesMap uses integer keys after internFileSig', () => {
        const scene = new Scene();
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        const fileSig = new FileSignature('proj', 'src/test.ts');
        arkFile.setFileSignature(fileSig);
        scene.setFile(arkFile);
        const id = SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getId(fileSig);
        expect(id).toBeGreaterThan(0);
        scene.addSdkArkFile(arkFile);
        expect(scene.getFile(fileSig)).toBe(arkFile);
    });

    it('dispose clears all canonicalizers', () => {
        const scene = new Scene();
        SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getId(new FileSignature('proj', 'src/a.ts'));
        SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getId(new ClassSignature('C', new FileSignature('proj', 'src/a.ts'), null));
        expect(scene.getFileSigCanonicalizer().size()).toBeGreaterThan(1);
        expect(scene.getClassSigCanonicalizer().size()).toBeGreaterThan(1);
        scene.dispose();
        expect(scene.getFileSigCanonicalizer().size()).toBe(1);
        expect(scene.getClassSigCanonicalizer().size()).toBe(1);
    });

    it('clear resets canonicalizers and re-interns DEFAULTs', () => {
        const scene = new Scene();
        SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getId(new FileSignature('proj', 'src/a.ts'));
        expect(scene.getFileSigCanonicalizer().size()).toBeGreaterThan(1);
        scene.clear();
        expect(scene.getFileSigCanonicalizer().size()).toBe(1);
        expect(scene.getFileSigCanonicalizer().getExistingId(FileSignature.DEFAULT)).toBe(0);
    });

    it('getExistingId returns -1 for unregistered signatures', () => {
        const scene = new Scene();
        const sig = new FileSignature('proj', 'src/notregistered.ts');
        expect(scene.getFileSigCanonicalizer().getExistingId(sig)).toBe(-1);
    });

    it('intern returns canonical single instance', () => {
        const scene = new Scene();
        // The earlier dispose/clear cases wiped prior registrations: re-intern the file value.
        SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getId(new FileSignature('p', 'f.ts'));
        const sig1 = new ClassSignature('A', new FileSignature('p', 'f.ts'), null);
        const sig2 = new ClassSignature('A', new FileSignature('p', 'f.ts'), null);
        const a = scene.getClassSigCanonicalizer().intern(sig1);
        const b = scene.getClassSigCanonicalizer().intern(sig2);
        expect(a).toBe(b);
        expect(a).toBe(sig1);
    });
});
