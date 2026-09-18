/**
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
 * ArkAnalyzer Bug Reproduction Tests
 * Tests for runtime bugs only. Code review issues are fixed directly.
 */

import { describe, it, expect } from 'vitest';
import { BigIntConstant } from '../../src/core/base/Constant';
import { BooleanType } from '../../src/core/base/Type';
import { MethodParameter } from '../../src/core/model/builder/ArkMethodBuilder';
import { MethodSubSignature, methodSubSignatureCompare, ClassSignature, FileSignature, FieldSignature } from '../../src/core/model/ArkSignature';
import { ArkField, FieldCategory } from '../../src/core/model/ArkField';
import { ArkClass, ClassCategory } from '../../src/core/model/ArkClass';
import { ArkFile, Language } from '../../src/core/model/ArkFile';
import { ArkNamespace } from '../../src/core/model/ArkNamespace';
import { SignatureCanonicalizerRegistry } from '../../src/core/common/SignatureCanonicalizerRegistry';
import { ArkBody } from '../../src/core/model/ArkBody';
import { Local } from '../../src/core/base/Local';
import { NamespaceSignature } from '../../src/core/model/ArkSignature';
import { Cfg } from '../../src/core/graph/Cfg';
import { FullPosition } from '../../src/core/base/Position';

describe('ArkAnalyzer Core Bug Reproduction', () => {
    // Bug 1: BigIntConstant missing 'n' suffix
    it('Bug 1: BigIntConstant cannot distinguish from normal numbers', () => {
        const bi = new BigIntConstant(BigInt(123));
        expect(bi.toString()).toBe('123n');
    });

    // Bug 2: Static/Instance method signature comparison ignores static flag
    it('Bug 2: Static and instance methods cannot be distinguished', () => {
        const params: MethodParameter[] = [];
        const retType = BooleanType.getInstance();
        const staticSig = new MethodSubSignature('foo', params, retType, true);
        const instanceSig = new MethodSubSignature('foo', params, retType, false);
        expect(methodSubSignatureCompare(staticSig, instanceSig)).toBe(false);
    });

    // Bug 4: setLocals appends instead of replacing
    it('Bug 4: setLocals incorrectly appends instead of replacing', () => {
        const cfg = new Cfg();
        const body = new ArkBody(new Set(), cfg);
        const local1 = new Local('a');
        const local2 = new Local('b');
        body.setLocals(new Set([local1]));
        expect(body.getLocals().has('a')).toBe(true);
        body.setLocals(new Set([local2]));
        // Expect only b, but actually keeps a (incorrect merge behavior)
        expect(body.getLocals().has('a')).toBe(false);
        expect(body.getLocals().has('b')).toBe(true);
    });

    // Bug 5: Interface field incorrectly judged as non-public
    it('Bug 5: Interface field incorrectly judged as non-public', () => {
        const file = new ArkFile(Language.TYPESCRIPT);
        const fileSig = new FileSignature('test', 'iface-field.ts');
        file.setFileSignature(fileSig);
        const cls = new ArkClass(file.getFileSigID());
        cls.setCategory(ClassCategory.INTERFACE);
        cls.setSignature(new ClassSignature('IfaceHost', fileSig, null));
        const field = new ArkField(cls.getClassSigID());
        field.setCategory(FieldCategory.PROPERTY_DECLARATION);
        // Interface members are public by default, but current implementation returns false
        expect(field.isPublic()).toBe(true);
    });

    // Bug 6: ArkClass.getStaticFields() scope leakage
    it('Bug 6: getStaticFields returns static fields of other classes', () => {
        const file = new ArkFile(Language.TYPESCRIPT);
        const fileSig = new FileSignature('test', 'test.ts');
        file.setFileSignature(fileSig);
        const cls1Sig = new ClassSignature('Class1', fileSig);
        const cls1 = new ArkClass(file.getFileSigID());
        cls1.setSignature(cls1Sig);
        const cls2Sig = new ClassSignature('Class2', fileSig);
        const cls2 = new ArkClass(file.getFileSigID());
        cls2.setSignature(cls2Sig);
        const staticField = new ArkField(cls2.getClassSigID());
        const fieldSig = new FieldSignature(
            'staticVar',
            SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getOrCreateId(cls2Sig),
            BooleanType.getInstance(),
            true
        );
        staticField.setSignature(fieldSig);
        staticField.addModifier(16); // ModifierType.STATIC
        cls2.addField(staticField);

        // cls1 has no static fields, should return empty
        const fields = cls1.getStaticFields();
        expect(fields.length).toBe(0); // Failure means returning fields of other classes
    });

    // Bug 7: Namespace with same name overwritten
    it('Bug 7: Namespace with same name overwritten (Fail proves bug exists)', () => {
        const file = new ArkFile(Language.TYPESCRIPT);
        const fileSig = new FileSignature('test', 'test.ts');
        file.setFileSignature(fileSig);
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSigID = reg.fileSigCanonicalizer.getOrCreateId(fileSig);
        // Regular construction: the parent namespace is interned (top-level under the
        // file) and the children's signatures declare the parent as their scope —
        // the signature ownership is the single source of truth for name lookups.
        const parent = new ArkNamespace(file.getFileSigID(), undefined, new NamespaceSignature('parent', fileSigID));
        parent.setOriginFullPositions([FullPosition.DEFAULT]);
        file.addNamespace(parent);

        const ns1 = new ArkNamespace(
            file.getFileSigID(),
            parent.getNamespaceSigID(),
            new NamespaceSignature('sub', file.getFileSigID(), parent.getNamespaceSigID())
        );
        ns1.setOriginFullPositions([FullPosition.DEFAULT]);

        const ns2 = new ArkNamespace(
            file.getFileSigID(),
            parent.getNamespaceSigID(),
            new NamespaceSignature('sub', file.getFileSigID(), parent.getNamespaceSigID())
        );
        ns2.setOriginFullPositions([FullPosition.DEFAULT]);

        parent.addNamespace(ns1);
        parent.addNamespace(ns2);

        // TypeScript allows namespace merging, allow keeping both or merging content
        // parent.getNamespaces().length should be >= 1, or support getting all namespaces with same name
        const retrieved = parent.getNamespaceWithName('sub');

        // Expect to find ns1 or merged namespace (should contain ns1 content)
        // Current implementation overwrites directly, only finds ns2
        expect(retrieved).toBe(ns1); // Failure proves ns1 is overwritten
    });

    // Bug 8: Cannot get class inside namespace
    it('Bug 8: Cannot get class inside namespace (Fail proves bug exists)', () => {
        const file = new ArkFile(Language.TYPESCRIPT);
        const fileSig = new FileSignature('test', 'test.ts');
        file.setFileSignature(fileSig);
        const ns = new ArkNamespace(
            file.getFileSigID(),
            undefined,
            new NamespaceSignature('MySpace', SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getOrCreateId(fileSig))
        );
        ns.setOriginFullPositions([FullPosition.DEFAULT]);
        // The class signature must declare the namespace as its scope — the signature
        // ownership is the single source of truth for name lookups.
        const clsSig = new ClassSignature('InnerClass', file.getFileSigID(), ns.getNamespaceSigID());
        const cls = new ArkClass();
        cls.setSignature(clsSig);
        ns.addArkClass(cls);
        file.addNamespace(ns);

        // Expect to find class inside namespace via getClassWithName
        // (file-level lookup recurses into namespaces)
        expect(file.getClassWithName('InnerClass')).not.toBeNull(); // Failure proves cannot find
    });
});
