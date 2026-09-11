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
import { ClassSignature, FieldSignature, FileSignature, NamespaceSignature } from '../../src/core/model/ArkSignature';
import { UnknownType, NumberType, StringType } from '../../src/core/base/Type';
import { SignatureCanonicalizerRegistry } from '../../src/core/common/SignatureCanonicalizerRegistry';

describe('FieldSignature.toMapKey Test', () => {
    const reg = SignatureCanonicalizerRegistry.getInstance();
    const fileSig = new FileSignature('testProject', 'src/foo.ts');
    reg.fileSigCanonicalizer.getId(fileSig);
    const classSigID = reg.classSigCanonicalizer.getId(new ClassSignature('MyClass', fileSig, null));

    it('returns same key for same declaringSignature + fieldName + staticFlag', () => {
        const fs1 = new FieldSignature('name', classSigID, UnknownType.getInstance(), false);
        const fs2 = new FieldSignature('name', classSigID, NumberType.getInstance(), false);
        expect(fs1.toMapKey()).toBe(fs2.toMapKey());
    });

    it('returns different keys for different fieldNames', () => {
        const fs1 = new FieldSignature('name', classSigID, UnknownType.getInstance(), false);
        const fs2 = new FieldSignature('age', classSigID, UnknownType.getInstance(), false);
        expect(fs1.toMapKey()).not.toBe(fs2.toMapKey());
    });

    it('returns different keys for static vs non-static', () => {
        const fs1 = new FieldSignature('count', classSigID, NumberType.getInstance(), false);
        const fs2 = new FieldSignature('count', classSigID, NumberType.getInstance(), true);
        expect(fs1.toMapKey()).not.toBe(fs2.toMapKey());
    });

    it('type change does not affect key', () => {
        const fs = new FieldSignature('value', classSigID, UnknownType.getInstance(), false);
        const keyBefore = fs.toMapKey();
        fs.setType(StringType.getInstance());
        const keyAfter = fs.toMapKey();
        expect(keyBefore).toBe(keyAfter);
    });

    it('returns different keys for different declaringSignatures', () => {
        const classSigID2 = reg.classSigCanonicalizer.getId(new ClassSignature('OtherClass', fileSig, null));
        const fs1 = new FieldSignature('name', classSigID, UnknownType.getInstance(), false);
        const fs2 = new FieldSignature('name', classSigID2, UnknownType.getInstance(), false);
        expect(fs1.toMapKey()).not.toBe(fs2.toMapKey());
    });

    it('returns different keys for namespace vs class declaringSignature', () => {
        const nsSigID = reg.namespaceSigCanonicalizer.getId(new NamespaceSignature('MyNamespace', reg.fileSigCanonicalizer.getId(fileSig)));
        const fs1 = new FieldSignature('name', classSigID, UnknownType.getInstance(), false);
        const fs2 = new FieldSignature('name', nsSigID, UnknownType.getInstance(), false, true);
        expect(fs1.toMapKey()).not.toBe(fs2.toMapKey());
    });

    it('static flag prefix is [static]', () => {
        const fs = new FieldSignature('count', classSigID, NumberType.getInstance(), true);
        expect(fs.toMapKey()).toContain('[static]count');
    });

    it('non-static flag has no [static] prefix', () => {
        const fs = new FieldSignature('count', classSigID, NumberType.getInstance(), false);
        expect(fs.toMapKey()).not.toContain('[static]');
    });

    it('toMapKey matches toString when the declaring chain is identity-projected', () => {
        // Since FileSignature.toMapKey became the collision-free identity projection
        // (= toString), the recursive toMapKey chain no longer diverges from toString
        // for a clear (formal) declaring class — the legacy "hash + basename" format
        // difference at the file layer is gone.
        const fs = new FieldSignature('name', classSigID, UnknownType.getInstance(), false);
        expect(fs.toMapKey()).toBe(fs.toString());
    });

    it('DEFAULT is defined and has toMapKey', () => {
        expect(FieldSignature.DEFAULT).toBeDefined();
        expect(typeof FieldSignature.DEFAULT.toMapKey()).toBe('string');
    });

    it('same logical field with different instances returns same key', () => {
        const fs1 = new FieldSignature('name', classSigID, UnknownType.getInstance(), false);
        const fs2 = new FieldSignature('name', classSigID, NumberType.getInstance(), false);
        expect(fs1.toMapKey()).toBe(fs2.toMapKey());
    });
});
