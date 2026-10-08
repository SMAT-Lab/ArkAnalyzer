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

import { beforeEach, describe, expect, it } from 'vitest';
import { ArkClass } from '../../../../src/core/model/ArkClass';
import { ArkFile, Language } from '../../../../src/core/model/ArkFile';
import { ArkMethod } from '../../../../src/core/model/ArkMethod';
import { ArkNamespace } from '../../../../src/core/model/ArkNamespace';
import { ClassCategory } from '../../../../src/core/model/ArkClass';
import { Scene } from '../../../../src/Scene';
import { ClassSignature, FileSignature, MethodSignature, MethodSubSignature, NamespaceSignature } from '../../../../src/core/model/ArkSignature';
import { UnknownType } from '../../../../src/core/base/Type';
import { CxxModelUtils } from '../../../../src/frontend/cppFrontend/common/ModelUtils';

/**
 * Unit tests for short-name (originName) resolution after the removal of the
 * fuzzy prefix matching in ArkFile/ArkNamespace.getClassWithName:
 *  - cpp: CxxModelUtils.findClassByShortName composes full names along the
 *    enclosing-name chain and resolves them by exact ClassSignature lookup.
 *  - core: getClassWithName is exact-match only, with a linear exact fallback
 *    for manually built containers whose signature IDs are not set.
 */
describe('Short-name resolution without fuzzy prefix matching', () => {
    let scene: Scene;

    function buildFile(name: string): ArkFile {
        const file = new ArkFile(Language.CXX);
        file.setScene(scene);
        file.setFileSignature(new FileSignature('proj', `src/${name}`));
        return file;
    }

    function addClass(name: string, container: ArkFile | ArkNamespace): ArkClass {
        const ns = container instanceof ArkNamespace ? container : undefined;
        const cls = new ArkClass(container instanceof ArkNamespace ? container.getDeclaringFileID() : container.getFileSigID(), ns?.getNamespaceSigID());
        cls.setCategory(ClassCategory.CLASS);
        cls.setSignature(new ClassSignature(name, cls.getDeclaringFileID(), ns?.getNamespaceSigID()));
        if (ns) {
            ns.addArkClass(cls);
        } else {
            (container as ArkFile).addArkClass(cls);
        }
        return cls;
    }

    function addNamespace(name: string, file: ArkFile): ArkNamespace {
        const ns = new ArkNamespace(file.getFileSigID(), undefined, new NamespaceSignature(name, file.getFileSigID()));
        file.addNamespace(ns);
        return ns;
    }

    beforeEach(() => {
        scene = new Scene();
    });

    describe('cpp findClassByShortName (composed-name candidate chain)', () => {
        it('resolves a nested class by its bare short name (single level)', () => {
            const file = buildFile('single.cpp');
            const outer = addClass('OuterClass', file);
            const inner = addClass('InnerClass$OuterClass', file);

            const found = CxxModelUtils.findClassByShortName('InnerClass', outer);
            expect(found).toBeDefined();
            expect(found!.getClassSigID()).toBe(inner.getClassSigID());
        });

        it('resolves nested classes inside a namespace container', () => {
            const file = buildFile('ns.cpp');
            const ns = addNamespace('nsA', file);
            const outer = addClass('OuterClass', ns);
            const inner = addClass('InnerClass$OuterClass', ns);

            const found = CxxModelUtils.findClassByShortName('InnerClass', outer);
            expect(found).toBeDefined();
            expect(found!.getClassSigID()).toBe(inner.getClassSigID());
        });

        it('resolves multi-level nesting via the enclosing-name chain (innermost first)', () => {
            const file = buildFile('multi.cpp');
            // Top-level Outer, nested I2 (I2$Outer), doubly nested I (I$I2$Outer).
            const outer = addClass('Outer', file);
            const i2 = addClass('I2$Outer', file);
            const i = addClass('I$I2$Outer', file);

            // From I2's scope, 'I' should resolve to the sibling nested inside I2.
            const fromI2 = CxxModelUtils.findClassByShortName('I', i2);
            expect(fromI2).toBeDefined();
            expect(fromI2!.getClassSigID()).toBe(i.getClassSigID());

            // From Outer's scope, 'I2' resolves (single level).
            const fromOuter = CxxModelUtils.findClassByShortName('I2', outer);
            expect(fromOuter).toBeDefined();
            expect(fromOuter!.getClassSigID()).toBe(i2.getClassSigID());
        });

        it('resolves a method-local class (composed with the method separator)', () => {
            const file = buildFile('local.cpp');
            const outer = addClass('Outer', file);
            const method = new ArkMethod(
                outer.getClassSigID(),
                new MethodSignature(outer.getClassSigID(), new MethodSubSignature('m', [], UnknownType.getInstance(), false))
            );
            outer.addMethod(method);

            const local = addClass('L$Outer.m', file);
            const found = CxxModelUtils.findClassByShortName('L', outer, method);
            expect(found).toBeDefined();
            expect(found!.getClassSigID()).toBe(local.getClassSigID());

            // Without the method context the local class is not reachable.
            const withoutCtx = CxxModelUtils.findClassByShortName('L', outer);
            expect(withoutCtx).toBeNull();
        });

        it('short name shadows a same-name top-level class (inner scope first)', () => {
            const file = buildFile('shadow.cpp');
            const outer = addClass('Outer', file);
            const topLevelFoo = addClass('Foo', file);
            const nestedFoo = addClass('Foo$Outer', file);

            // Inside Outer's scope, 'Foo' resolves to the nested class, not the top-level one.
            const found = CxxModelUtils.findClassByShortName('Foo', outer);
            expect(found).toBeDefined();
            expect(found!.getClassSigID()).toBe(nestedFoo.getClassSigID());
            expect(found!.getClassSigID()).not.toBe(topLevelFoo.getClassSigID());
        });

        it('returns null for unknown names and rejects composed queries', () => {
            const file = buildFile('miss.cpp');
            const outer = addClass('Outer', file);

            expect(CxxModelUtils.findClassByShortName('Unknown', outer)).toBeNull();
            // A query already containing '$' is a composed name — not a short-name lookup.
            expect(CxxModelUtils.findClassByShortName('Inner$Outer', outer)).toBeNull();
        });
    });

    describe('core getClassWithName exact-match semantics', () => {
        it('file-level exact lookup resolves top-level classes via signature', () => {
            const file = buildFile('exact.ts');
            const foo = addClass('Foo', file);
            addClass('Foo$Bar', file);

            const found = file.getClassWithName('Foo');
            expect(found).toBeDefined();
            expect(found!.getClassSigID()).toBe(foo.getClassSigID());

            // Composed names resolve exactly by their full name.
            const composed = file.getClassWithName('Foo$Bar');
            expect(composed).toBeDefined();
        });

        it('originName prefix no longer matches (fuzzy branch removed)', () => {
            const file = buildFile('fuzzy.ts');
            addClass('Foo$Bar', file);

            // 'Bar' is not a class; 'Foo' does not match 'Foo$Bar' anymore.
            expect(file.getClassWithName('Bar')).toBeNull();
            // Note: 'Foo' would return null too — unless a real top-level 'Foo' exists,
            // which is asserted separately below with a real class present.
        });

        it('real top-level class still found while composed name is not reachable via prefix', () => {
            const file = buildFile('both.ts');
            const realFoo = addClass('Foo', file);
            const composed = addClass('Foo$Bar', file);

            const found = file.getClassWithName('Foo');
            expect(found).toBeDefined();
            expect(found!.getClassSigID()).toBe(realFoo.getClassSigID());
            expect(found!.getClassSigID()).not.toBe(composed.getClassSigID());
        });

        it('namespace-level exact lookup', () => {
            const file = buildFile('ns-exact.ts');
            const ns = addNamespace('nsX', file);
            const foo = addClass('Foo', ns);

            const found = ns.getClassWithName('Foo');
            expect(found).toBeDefined();
            expect(found!.getClassSigID()).toBe(foo.getClassSigID());
        });

        it('classes whose signature ownership mismatches the mount container are NOT found', () => {
            // The signature ownership is the single source of truth: a class interned
            // with a top-level signature but mounted into a namespace is invisible to
            // name lookups — no linear-scan fallback bridges the mismatch.
            const file = buildFile('mismatch.ts');
            const ns = addNamespace('nsM', file);

            const cls = new ArkClass(file.getFileSigID());
            cls.setSignature(new ClassSignature('Mismatch', file.getFileSigID(), undefined));
            ns.addArkClass(cls);

            expect(ns.getClassWithName('Mismatch')).toBeNull();
            expect(file.getClassWithName('Mismatch')).toBeNull();
        });

        it('manually built containers (no signature registered) look up safely', () => {
            // Manually built file whose signature was never set: fileSigID stays 0 (DEFAULT).
            // The signature-direct path misses (no class ever interned under the DEFAULT file)
            // and the lookup returns null safely.
            const file = new ArkFile(Language.TYPESCRIPT);
            expect(file.getFileSigID()).toBe(0);
            expect(file.getClassWithName('Anything')).toBeNull();
        });
    });
});
