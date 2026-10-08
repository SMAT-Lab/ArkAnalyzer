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
import { SignatureModelCanonicalizer } from '../../src/core/common/SignatureModelCanonicalizer';
import { SignatureCanonicalizerRegistry } from '../../src/core/common/SignatureCanonicalizerRegistry';
import { FileSignature, ClassSignature } from '../../src/core/model/ArkSignature';
import { ArkFile, Language } from '../../src/core/model/ArkFile';
import { ArkClass, ClassCategory } from '../../src/core/model/ArkClass';

describe('SignatureModelCanonicalizer Test', () => {
    it('setModel/getModel round-trip', () => {
        const c = new SignatureModelCanonicalizer<FileSignature, ArkFile>();
        const sig = new FileSignature('proj', 'src/a.ts');
        const file = new ArkFile(Language.TYPESCRIPT);
        const id = c.getOrCreateId(sig);
        c.setModel(id, file);
        expect(c.getModel(id)).toBe(file);
    });

    it('getModel returns undefined for unregistered ID', () => {
        const c = new SignatureModelCanonicalizer<FileSignature, ArkFile>();
        expect(c.getModel(0)).toBeUndefined();
        expect(c.getModel(99)).toBeUndefined();
    });

    it('getModel returns undefined for ID 0 (DEFAULT)', () => {
        const c = new SignatureModelCanonicalizer<FileSignature, ArkFile>();
        c.getOrCreateId(FileSignature.DEFAULT); // ID 0
        expect(c.getModel(0)).toBeUndefined();
    });

    it('same signature value returns same ID and same model slot', () => {
        const c = new SignatureModelCanonicalizer<FileSignature, ArkFile>();
        const sig1 = new FileSignature('proj', 'src/a.ts');
        const sig2 = new FileSignature('proj', 'src/a.ts');
        const file1 = new ArkFile(Language.TYPESCRIPT);
        const id1 = c.getOrCreateId(sig1);
        c.setModel(id1, file1);
        const id2 = c.getOrCreateId(sig2);
        expect(id1).toBe(id2);
        expect(c.getModel(id2)).toBe(file1);
    });

    it('removeModel sets entry to undefined', () => {
        const c = new SignatureModelCanonicalizer<FileSignature, ArkFile>();
        const sig = new FileSignature('proj', 'src/a.ts');
        const file = new ArkFile(Language.TYPESCRIPT);
        const id = c.getOrCreateId(sig);
        c.setModel(id, file);
        expect(c.getModel(id)).toBe(file);
        c.removeModel(id);
        expect(c.getModel(id)).toBeUndefined();
    });

    it('removeModel does not recycle ID', () => {
        const c = new SignatureModelCanonicalizer<FileSignature, ArkFile>();
        const sig = new FileSignature('proj', 'src/a.ts');
        const id = c.getOrCreateId(sig);
        c.removeModel(id);
        const id2 = c.getOrCreateId(new FileSignature('proj', 'src/b.ts'));
        expect(id2).toBe(id + 1); // ID continues from where it left off
    });

    it('getModels returns all registered models excluding undefined', () => {
        const c = new SignatureModelCanonicalizer<FileSignature, ArkFile>();
        c.getOrCreateId(FileSignature.DEFAULT); // ID 0, no model
        const sig1 = new FileSignature('proj', 'src/a.ts');
        const sig2 = new FileSignature('proj', 'src/b.ts');
        const file1 = new ArkFile(Language.TYPESCRIPT);
        const file2 = new ArkFile(Language.TYPESCRIPT);
        c.setModel(c.getOrCreateId(sig1), file1);
        c.setModel(c.getOrCreateId(sig2), file2);
        const models = c.getModels();
        expect(models.length).toBe(2);
        expect(models).toContain(file1);
        expect(models).toContain(file2);
    });

    it('getModels excludes removed models', () => {
        const c = new SignatureModelCanonicalizer<FileSignature, ArkFile>();
        const sig1 = new FileSignature('proj', 'src/a.ts');
        const sig2 = new FileSignature('proj', 'src/b.ts');
        const file1 = new ArkFile(Language.TYPESCRIPT);
        const file2 = new ArkFile(Language.TYPESCRIPT);
        c.setModel(c.getOrCreateId(sig1), file1);
        const id2 = c.getOrCreateId(sig2);
        c.setModel(id2, file2);
        c.removeModel(id2);
        const models = c.getModels();
        expect(models.length).toBe(1);
        expect(models[0]).toBe(file1);
    });

    it('clear resets both signatures and models', () => {
        const c = new SignatureModelCanonicalizer<FileSignature, ArkFile>();
        const sig = new FileSignature('proj', 'src/a.ts');
        const file = new ArkFile(Language.TYPESCRIPT);
        c.setModel(c.getOrCreateId(sig), file);
        expect(c.size()).toBeGreaterThan(0);
        expect(c.getModels().length).toBe(1);
        c.clear();
        expect(c.size()).toBe(0);
        expect(c.getModels().length).toBe(0);
        expect(c.getModel(0)).toBeUndefined();
    });

    it('works with ClassSignature and ArkClass', () => {
        const c = new SignatureModelCanonicalizer<ClassSignature, ArkClass>();
        const fileSig = new FileSignature('proj', 'src/a.ts');
        // The value-object ClassSignature overload resolves the declaring file against the
        // GLOBAL registry — intern it there first (the local canonicalizer `c` is separate).
        SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getOrCreateId(fileSig);
        const classSig = new ClassSignature('MyClass', fileSig, null);
        const arkClass = new ArkClass();
        arkClass.setCategory(ClassCategory.CLASS);
        const id = c.getOrCreateId(classSig);
        expect(id).toBeGreaterThanOrEqual(0);
        c.setModel(id, arkClass);
        expect(c.getModel(id)).toBe(arkClass);
        expect(c.getModels().length).toBe(1);
    });
});
