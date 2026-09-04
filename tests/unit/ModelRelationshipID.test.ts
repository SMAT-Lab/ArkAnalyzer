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
import { ArkFile, Language } from '../../src/core/model/ArkFile';
import { ArkClass, ClassCategory } from '../../src/core/model/ArkClass';
import { ArkField } from '../../src/core/model/ArkField';
import { ArkMethod } from '../../src/core/model/ArkMethod';
import { FileSignature, ClassSignature, FieldSignature, MethodSignature, MethodSubSignature } from '../../src/core/model/ArkSignature';
import { UnknownType } from '../../src/core/base/Type';
import { MethodParameter } from '../../src/core/model/builder/ArkMethodBuilder';
import { buildDefaultArkClassFromArkFile } from '../../src/core/model/builder/ArkClassBuilder';
import { SignatureCanonicalizerRegistry } from '../../src/core/common/SignatureCanonicalizerRegistry';
import { buildScene } from './common';
import path from 'path';
import ts from 'ohos-typescript';

describe('Model Relationship ID Test', () => {
    it('ArkFile.getDefaultClassID returns valid ID after scene setup', () => {
        const scene = new Scene();
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        arkFile.setScene(scene);
        const fileSig = new FileSignature('proj', 'src/test.ts');
        arkFile.setFileSignature(fileSig);
        const defaultClass = new ArkClass(arkFile.getFileSigID());
        defaultClass.setCategory(ClassCategory.CLASS);
        const classSig = new ClassSignature('DefaultClass', fileSig, null);
        defaultClass.setSignature(classSig);
        arkFile.setDefaultClass(defaultClass);

        const classID = arkFile.getDefaultClassID();
        expect(classID).toBeGreaterThan(0);
        expect(classID).toBe(scene.getClassSigCanonicalizer().getExistingId(classSig));
    });

    it('ArkFile.getDefaultClassID returns -1 before scene setup', () => {
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        expect(arkFile.getDefaultClassID()).toBe(-1);
    });

    it('ArkClass.getDeclaringFileID returns valid ID after scene setup', () => {
        const scene = new Scene();
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        const fileSig = new FileSignature('proj', 'src/test.ts');
        arkFile.setFileSignature(fileSig);
        const arkClass = new ArkClass(arkFile.getFileSigID());
        const classSig = new ClassSignature('MyClass', fileSig, null);
        arkClass.setSignature(classSig);

        const fileID = arkClass.getDeclaringFileID();
        expect(fileID).toBeGreaterThan(0);
        expect(fileID).toBe(scene.getFileSigCanonicalizer().getExistingId(fileSig));
    });

    it('ArkClass.getDeclaringFileID returns -1 before scene setup', () => {
        const arkClass = new ArkClass();
        expect(arkClass.getDeclaringFileID()).toBe(-1);
    });

    it('ArkField.getDeclaringClassID returns valid ID after scene setup', () => {
        const scene = new Scene();
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        const fileSig = new FileSignature('proj', 'src/test.ts');
        arkFile.setFileSignature(fileSig);
        const arkClass = new ArkClass(arkFile.getFileSigID());
        const classSig = new ClassSignature('MyClass', fileSig, null);
        arkClass.setSignature(classSig);

        const field = new ArkField(arkClass.getClassSigID());
        field.setSignature(
            new FieldSignature('myField', SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getId(classSig), UnknownType.getInstance(), false)
        );

        const classID = field.getDeclaringClassID();
        expect(classID).toBeGreaterThan(0);
        expect(classID).toBe(scene.getClassSigCanonicalizer().getExistingId(classSig));
    });

    it('ArkField.getDeclaringClassID returns -1 before scene setup', () => {
        const field = new ArkField();
        expect(field.getDeclaringClassID()).toBe(-1);
    });

    it('ArkField.setDeclaringClassID sets ID directly', () => {
        const field = new ArkField(42);
        expect(field.getDeclaringClassID()).toBe(42);
    });

    it('ArkField.clearAllReferences resets ID and scene', () => {
        const field = new ArkField(42);
        field.clearAllReferences();
        expect(field.getDeclaringClassID()).toBe(-1);
    });

    it('ArkField.getDeclaringArkClass resolves the same class object from the ID', () => {
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        const fileSig = new FileSignature('proj', 'src/field-resolve.ts');
        arkFile.setFileSignature(fileSig);
        const arkClass = new ArkClass(arkFile.getFileSigID());
        arkClass.setSignature(new ClassSignature('FieldResolveHost', fileSig, null));

        const field = new ArkField(arkClass.getClassSigID());
        expect(field.getDeclaringArkClass()).toBe(arkClass);
    });

    it('ArkField signature is interned, registered, and restored via fieldSigID', () => {
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        const fileSig = new FileSignature('proj', 'src/field-sig.ts');
        arkFile.setFileSignature(fileSig);
        const arkClass = new ArkClass(arkFile.getFileSigID());
        arkClass.setSignature(new ClassSignature('FieldSigHost', fileSig, null));

        const field = new ArkField(arkClass.getClassSigID());
        const fieldSig = new FieldSignature('sigField', arkClass.getClassSigID(), UnknownType.getInstance(), false);
        field.setSignature(fieldSig);

        expect(field.getFieldSigID()).toBeGreaterThan(0);
        expect(field.getSignature().toString()).toBe(fieldSig.toString());
        expect(field.getName()).toBe('sigField');
        expect(field.getType()).toBe(UnknownType.getInstance());

        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.fieldSigCanonicalizer.getExistingId(fieldSig)).toBe(field.getFieldSigID());
        expect(reg.fieldSigCanonicalizer.getModel(field.getFieldSigID())).toBe(field);
    });

    it('ArkField signature mutate via getSignature().setType() affects the canonical instance', () => {
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        const fileSig = new FileSignature('proj', 'src/field-mutate.ts');
        arkFile.setFileSignature(fileSig);
        const arkClass = new ArkClass(arkFile.getFileSigID());
        arkClass.setSignature(new ClassSignature('FieldMutateHost', fileSig, null));

        const field = new ArkField(arkClass.getClassSigID());
        const fieldSig = new FieldSignature('mutateField', arkClass.getClassSigID(), UnknownType.getInstance(), false);
        field.setSignature(fieldSig);

        // Mutating the restored canonical signature keeps identity stable (type is not part
        // of hash/equals) and is visible through a re-intern of the same field signature.
        const canonical = field.getSignature();
        canonical.setType(UnknownType.getInstance());
        expect(field.getSignature()).toBe(canonical);
        expect(field.getFieldSigID()).toBe(SignatureCanonicalizerRegistry.getInstance().fieldSigCanonicalizer.getExistingId(fieldSig));
    });

    it('ID is cached after first computation', () => {
        const scene = new Scene();
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        arkFile.setScene(scene);
        const fileSig = new FileSignature('proj', 'src/cache.ts');
        arkFile.setFileSignature(fileSig);
        const defaultClass = new ArkClass(arkFile.getFileSigID());
        const classSig = new ClassSignature('CachedClass', fileSig, null);
        defaultClass.setSignature(classSig);
        arkFile.setDefaultClass(defaultClass);

        const id1 = arkFile.getDefaultClassID();
        const id2 = arkFile.getDefaultClassID();
        expect(id1).toBe(id2);
        expect(id1).toBeGreaterThan(0);
    });
});

describe('ArkMethod declaring class ID Test', () => {
    function setupClass(scene: Scene, className: string, filePath: string): { arkFile: ArkFile; arkClass: ArkClass; classSig: ClassSignature } {
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        arkFile.setScene(scene);
        const fileSig = new FileSignature('proj', filePath);
        arkFile.setFileSignature(fileSig);
        const arkClass = new ArkClass(arkFile.getFileSigID());
        const classSig = new ClassSignature(className, fileSig, null);
        arkClass.setSignature(classSig);
        return { arkFile, arkClass, classSig };
    }

    it('setDeclaringArkClass interns the declaring class ID', () => {
        const scene = new Scene();
        const { arkClass, classSig } = setupClass(scene, 'MethodHost', 'src/method-host.ts');

        const method = new ArkMethod(arkClass.getClassSigID());
        const classID = method.getDeclaringClassID();
        expect(classID).toBeGreaterThan(0);
        expect(classID).toBe(arkClass.getClassSigID());
        expect(classID).toBe(scene.getClassSigCanonicalizer().getExistingId(classSig));
    });

    it('getDeclaringArkClass resolves the same class object from the ID', () => {
        const scene = new Scene();
        const { arkClass } = setupClass(scene, 'ResolvedHost', 'src/resolved-host.ts');

        const method = new ArkMethod(arkClass.getClassSigID());

        expect(method.getDeclaringArkClass()).toBe(arkClass);
    });

    it('getDeclaringClassID returns -1 before any setup', () => {
        const method = new ArkMethod();
        expect(method.getDeclaringClassID()).toBe(-1);
    });

    it('setDeclaringClassID sets the ID directly', () => {
        const method = new ArkMethod(42);
        expect(method.getDeclaringClassID()).toBe(42);
    });

    it('clearAllReferences resets the declaring class ID to -1', () => {
        const scene = new Scene();
        const { arkClass } = setupClass(scene, 'ClearedHost', 'src/cleared-host.ts');

        const method = new ArkMethod(arkClass.getClassSigID());
        expect(method.getDeclaringClassID()).toBeGreaterThan(0);

        method.clearAllReferences();
        expect(method.getDeclaringClassID()).toBe(-1);
    });

    it('default method of a default class gets the correct declaring class ID via real builder', () => {
        const scene = new Scene();
        const arkFile = new ArkFile(Language.ARKTS1_1);
        arkFile.setScene(scene);
        arkFile.setFileSignature(new FileSignature('proj', 'src/default-method.ts'));

        const defaultClass = new ArkClass(arkFile.getFileSigID());
        const sourceFile = ts.createSourceFile('default-method.ts', 'let a = 1;', ts.ScriptTarget.ES2021, true);
        buildDefaultArkClassFromArkFile(defaultClass, sourceFile);
        arkFile.setDefaultClass(defaultClass);

        const defaultMethod = defaultClass.getDefaultArkMethod();
        expect(defaultMethod).not.toBeNull();

        // The declaring class ID must be interned and match the default class's own ClassSigID
        const classID = defaultMethod!.getDeclaringClassID();
        expect(classID).toBeGreaterThan(0);
        expect(classID).toBe(defaultClass.getClassSigID());

        // The class must be resolvable back to the exact same object
        expect(defaultMethod!.getDeclaringArkClass()).toBe(defaultClass);

        // The declaring file must resolve through the class ID chain
        expect(defaultMethod!.getDeclaringArkFile()).toBe(arkFile);
        expect(defaultMethod!.getDeclaringArkFileID()).toBe(arkFile.getFileSigID());
    });
});

describe('ArkMethod outer method SigID Test', () => {
    function setupClassAndMethod(scene: Scene, className: string, methodName: string): ArkMethod {
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        arkFile.setScene(scene);
        const fileSig = new FileSignature('proj', `src/${className}.ts`);
        arkFile.setFileSignature(fileSig);
        const arkClass = new ArkClass(arkFile.getFileSigID());
        arkClass.setSignature(new ClassSignature(className, fileSig, null));

        const methodSig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature(methodName, [], UnknownType.getInstance(), false));
        const method = new ArkMethod(arkClass.getClassSigID(), methodSig);
        SignatureCanonicalizerRegistry.registerMethod(method);
        return method;
    }

    it('setOuterMethod interns the outer method SigID', () => {
        const scene = new Scene();
        const outer = setupClassAndMethod(scene, 'OuterHost', 'outerFunction');

        const nested = new ArkMethod();
        nested.setOuterMethod(outer);

        const outerSigID = nested.getOuterMethodSigID();
        expect(outerSigID).toBeGreaterThan(0);
        expect(outerSigID).toBe(outer.getMethodSigID());
        expect(outerSigID).toBe(scene.getMethodSigCanonicalizer().getExistingId(outer.getSignature()));
    });

    it('getOuterMethod resolves the same method object from the SigID', () => {
        const scene = new Scene();
        const outer = setupClassAndMethod(scene, 'ResolveHost', 'outerFunction');

        const nested = new ArkMethod();
        nested.setOuterMethod(outer);

        expect(nested.getOuterMethod()).toBe(outer);
    });

    it('getOuterMethodSigID returns undefined when no outer method is set', () => {
        const method = new ArkMethod();
        expect(method.getOuterMethodSigID()).toBeUndefined();
        expect(method.getOuterMethod()).toBeUndefined();
    });

    it('setOuterMethodSigID sets the SigID directly', () => {
        const method = new ArkMethod();
        method.setOuterMethodSigID(42);
        expect(method.getOuterMethodSigID()).toBe(42);
    });

    it('setOuterMethodSigID treats non-positive IDs as none', () => {
        const method = new ArkMethod();
        method.setOuterMethodSigID(-1);
        expect(method.getOuterMethodSigID()).toBeUndefined();
        method.setOuterMethodSigID(0);
        expect(method.getOuterMethodSigID()).toBeUndefined();
    });

    it('clearAllReferences resets the outer method SigID to undefined', () => {
        const scene = new Scene();
        const outer = setupClassAndMethod(scene, 'ClearHost', 'outerFunction');

        const nested = new ArkMethod();
        nested.setOuterMethod(outer);
        expect(nested.getOuterMethodSigID()).toBeGreaterThan(0);

        nested.clearAllReferences();
        expect(nested.getOuterMethodSigID()).toBeUndefined();
        expect(nested.getOuterMethod()).toBeUndefined();
    });
});

describe('ArkMethod outer method SigID real build Test', () => {
    it('nested methods built via real scene get correct outer method SigIDs', () => {
        SignatureCanonicalizerRegistry.dispose();
        const scene = buildScene(path.join(__dirname, '../resources/pta/closure'));
        const arkFile = scene.getFiles().find(f => f.getName() === 'closure.ts');
        expect(arkFile).toBeDefined();

        const ns = arkFile!.getNamespaceWithName('ClosureTest');
        expect(ns).not.toBeNull();

        const basicTest = ns!.getClassWithName('BasicTest');
        expect(basicTest).not.toBeNull();

        const outer = basicTest!.getMethodWithName('basicOuterMethod1');
        expect(outer).not.toBeNull();
        expect(outer!.getMethodSigID()).toBeGreaterThan(0);

        // Collect nested methods whose outer method resolves to `basicOuterMethod1`
        const nestedMethods = basicTest!.getMethods().filter(m => m.getName().endsWith(`$${outer!.getName()}`) && m.getOuterMethod() === outer);
        expect(nestedMethods.length).toBeGreaterThan(0);

        for (const nested of nestedMethods) {
            const sigID = nested.getOuterMethodSigID();
            expect(sigID).toBeGreaterThan(0);
            expect(sigID).toBe(outer!.getMethodSigID());
            expect(nested.getOuterMethod()).toBe(outer);
        }

        SignatureCanonicalizerRegistry.dispose();
    });
});

describe('ArkMethod signature SigID storage Test', () => {
    function setupClass(scene: Scene, className: string): { arkFile: ArkFile; arkClass: ArkClass } {
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        arkFile.setScene(scene);
        const fileSig = new FileSignature('proj', `src/${className}.ts`);
        arkFile.setFileSignature(fileSig);
        const arkClass = new ArkClass(arkFile.getFileSigID());
        arkClass.setSignature(new ClassSignature(className, fileSig, null));
        return { arkFile, arkClass };
    }

    it('declare-only method: impl is null, sigID is undefined, getSignature falls back to declare[0]', () => {
        const scene = new Scene();
        const { arkClass } = setupClass(scene, 'DeclOnlyHost');

        const declareSig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('declaredOnly', [], UnknownType.getInstance(), false));
        const method = new ArkMethod(arkClass.getClassSigID(), undefined, declareSig);

        expect(method.getImplementationSignature()).toBeNull();
        expect(method.getMethodSigID()).toBeUndefined();
        expect(method.getDeclareSigIDs()).toBeDefined();
        expect(method.getDeclareSigIDs()!.length).toBe(1);
        expect(method.getDeclareSignatures()![0].toString()).toBe(declareSig.toString());
        expect(method.getSignature().toString()).toBe(declareSig.toString());
    });

    it('declare signature is registered for O(1) reverse lookup when added to a class', () => {
        const scene = new Scene();
        const { arkClass } = setupClass(scene, 'DeclRegHost');

        const declareSig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('declaredReg', [], UnknownType.getInstance(), false));
        const method = new ArkMethod(arkClass.getClassSigID(), undefined, declareSig);

        const reg = SignatureCanonicalizerRegistry.getInstance();
        // Before addMethod: interned but not yet registered (builder merging still owns the slot).
        const id = reg.methodSigCanonicalizer.getExistingId(declareSig);
        expect(id).toBeGreaterThan(0);
        expect(reg.methodSigCanonicalizer.getModel(id)).toBeUndefined();

        arkClass.addMethod(method);
        expect(reg.methodSigCanonicalizer.getModel(id)).toBe(method);
    });

    it('impl method: sigID is interned and model registered', () => {
        const scene = new Scene();
        const { arkClass } = setupClass(scene, 'ImplHost');

        const implSig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('implemented', [], UnknownType.getInstance(), false));
        const method = new ArkMethod(arkClass.getClassSigID(), implSig);

        expect(method.getMethodSigID()).toBeGreaterThan(0);
        expect(method.getImplementationSignature()!.toString()).toBe(implSig.toString());
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.methodSigCanonicalizer.getModel(method.getMethodSigID()!)).toBe(method);
    });

    it('setDeclareSignatureWithIndex updates the stored ID and restores the new signature', () => {
        const scene = new Scene();
        const { arkClass } = setupClass(scene, 'DeclIdxHost');

        const sigA = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('declA', [], UnknownType.getInstance(), false));
        const sigB = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('declB', [], UnknownType.getInstance(), false));
        const method = new ArkMethod(arkClass.getClassSigID(), undefined, sigA);

        method.setDeclareSignatureWithIndex(sigB, 0);

        expect(method.getDeclareSignatures()!.length).toBe(1);
        expect(method.getDeclareSignatures()![0].toString()).toBe(sigB.toString());
        expect(method.getDeclareSigIDs()![0]).toBe(SignatureCanonicalizerRegistry.getInstance().methodSigCanonicalizer.getExistingId(sigB));
    });

    it('getDeclareSignatures returns a copy: mutations do not affect internal storage', () => {
        const scene = new Scene();
        const { arkClass } = setupClass(scene, 'CopyHost');

        const sigA = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('copyA', [], UnknownType.getInstance(), false));
        const sigB = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('copyB', [], UnknownType.getInstance(), false));
        const method = new ArkMethod(arkClass.getClassSigID(), undefined, [sigA, sigB]);

        const copy = method.getDeclareSignatures()!;
        copy.pop();
        expect(method.getDeclareSignatures()!.length).toBe(2);
    });

    it('clearAllReferences resets both methodSigID and declareSigIDs', () => {
        const scene = new Scene();
        const { arkClass } = setupClass(scene, 'ClearSigHost');

        const sig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('clearSig', [], UnknownType.getInstance(), false));
        const method = new ArkMethod(arkClass.getClassSigID(), sig);
        expect(method.getMethodSigID()).toBeGreaterThan(0);

        method.clearAllReferences();
        expect(method.getMethodSigID()).toBeUndefined();
        expect(method.getDeclareSigIDs()).toBeUndefined();
        expect(method.getImplementationSignature()).toBeNull();
    });

    it('impl arbitration: same-class siblings do not overwrite each other (TS overload merging)', () => {
        const scene = new Scene();
        const { arkClass } = setupClass(scene, 'ArbitrationSiblingHost');

        const sharedSig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('shared', [], UnknownType.getInstance(), false));
        const method1 = new ArkMethod(arkClass.getClassSigID(), sharedSig);
        new ArkMethod(arkClass.getClassSigID(), sharedSig);

        const reg = SignatureCanonicalizerRegistry.getInstance();
        const id = reg.methodSigCanonicalizer.getExistingId(sharedSig);
        expect(id).toBeGreaterThan(0);
        // Same-class sibling: the first registration wins; addMethod registers the final winner.
        expect(reg.methodSigCanonicalizer.getModel(id)).toBe(method1);
    });

    it('impl arbitration: cross-class second set of the same signature wins (non-C++)', () => {
        const scene = new Scene();
        const { arkClass: hostA } = setupClass(scene, 'ArbitrationHostA');
        const { arkClass: hostB } = setupClass(scene, 'ArbitrationHostB');

        // The declaring class signature of the shared signature belongs to hostA.
        const sharedSig = new MethodSignature(hostA.getClassSigID(), new MethodSubSignature('shared', [], UnknownType.getInstance(), false));
        new ArkMethod(hostA.getClassSigID(), sharedSig);
        const method2 = new ArkMethod(hostB.getClassSigID(), sharedSig);

        const reg = SignatureCanonicalizerRegistry.getInstance();
        const id = reg.methodSigCanonicalizer.getExistingId(sharedSig);
        expect(id).toBeGreaterThan(0);
        // Cross-class: last-wins (method2 holds the slot now)
        expect(reg.methodSigCanonicalizer.getModel(id)).toBe(method2);
    });
});

describe('Scene.getMethod fast path Test', () => {
    function setupClassWithMethods(scene: Scene, className: string): ArkClass {
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        arkFile.setScene(scene);
        const fileSig = new FileSignature(scene.getProjectName() || 'proj', `src/${className}.ts`);
        arkFile.setFileSignature(fileSig);
        const arkClass = new ArkClass(arkFile.getFileSigID());
        arkClass.setSignature(new ClassSignature(className, fileSig, null));
        arkFile.addArkClass(arkClass);
        scene.setFile(arkFile);
        return arkClass;
    }

    it('resolves declare-only methods via the O(1) canonicalizer path', () => {
        const scene = new Scene();
        const arkClass = setupClassWithMethods(scene, 'FastPathHost');

        const declareSig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('fastPath', [], UnknownType.getInstance(), false));
        const method = new ArkMethod(arkClass.getClassSigID(), undefined, declareSig);
        arkClass.addMethod(method);

        const resolved = scene.getMethod(declareSig);
        expect(resolved).toBe(method);
    });

    it('resolves SDK-like (non-project) signatures via the fast path', () => {
        const scene = new Scene();
        // class in a different project namespace (like SDK classes)
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        arkFile.setScene(scene);
        const fileSig = new FileSignature('@ohos-scope', 'sdk-file.ts');
        arkFile.setFileSignature(fileSig);
        const sdkClass = new ArkClass(arkFile.getFileSigID());
        sdkClass.setSignature(new ClassSignature('SdkClass', fileSig, null));
        arkFile.addArkClass(sdkClass);
        scene.setFile(arkFile);

        const sdkSig = new MethodSignature(sdkClass.getClassSigID(), new MethodSubSignature('sdkMethod', [], UnknownType.getInstance(), false));
        const sdkMethod = new ArkMethod(sdkClass.getClassSigID(), undefined, sdkSig);
        // addMethod registers the model: the (former isProject-restricted) fast path must hit
        // for SDK signatures too.
        sdkClass.addMethod(sdkMethod);

        const resolved = scene.getMethod(sdkSig);
        expect(resolved).toBe(sdkMethod);
    });

    it('does not intern queried-but-unknown signatures', () => {
        const scene = new Scene();
        const arkClass = setupClassWithMethods(scene, 'NoInternHost');
        const unknownSig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('neverSeen', [], UnknownType.getInstance(), false));

        expect(scene.getMethod(unknownSig)).toBeNull();
        expect(SignatureCanonicalizerRegistry.getInstance().methodSigCanonicalizer.getExistingId(unknownSig)).toBe(-1);
    });
});

describe('ArkClass method SigID index Test', () => {
    function setupClassWithMethod(
        scene: Scene,
        className: string,
        methodName: string,
        isStatic: boolean = false
    ): { arkClass: ArkClass; method: ArkMethod; sig: MethodSignature } {
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        arkFile.setScene(scene);
        const fileSig = new FileSignature('proj', `src/${className}.ts`);
        arkFile.setFileSignature(fileSig);
        const arkClass = new ArkClass(arkFile.getFileSigID());
        arkClass.setSignature(new ClassSignature(className, fileSig, null));

        const sig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature(methodName, [], UnknownType.getInstance(), isStatic));
        const method = new ArkMethod(arkClass.getClassSigID(), sig);
        return { arkClass, method, sig };
    }

    it('addMethod indexes the method and getMethods restores it', () => {
        const scene = new Scene();
        const { arkClass, method } = setupClassWithMethod(scene, 'IndexHost', 'indexed');
        arkClass.addMethod(method);

        const methods = arkClass.getMethods(true);
        expect(methods.length).toBe(1);
        expect(methods[0]).toBe(method);
        expect(arkClass.getTopMethodCount()).toBe(1);
        expect(arkClass.getTopMethodSigIDs()![0]).toBe(method.getMethodSigID());
    });

    it('declare-only methods are indexed via their first declare SigID', () => {
        const scene = new Scene();
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        arkFile.setScene(scene);
        const fileSig = new FileSignature('proj', 'src/decl-index.ts');
        arkFile.setFileSignature(fileSig);
        const arkClass = new ArkClass(arkFile.getFileSigID());
        arkClass.setSignature(new ClassSignature('DeclIndexHost', fileSig, null));

        const declareSig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('declared', [], UnknownType.getInstance(), false));
        const method = new ArkMethod(arkClass.getClassSigID(), undefined, declareSig);
        arkClass.addMethod(method);

        expect(arkClass.getTopMethodCount()).toBe(1);
        expect(arkClass.getTopMethodSigIDs()![0]).toBe(method.getDeclareSigIDs()![0]);
        expect(arkClass.getMethods(true)[0]).toBe(method);
    });

    it('methodMatchesName: nested methods are found by their plain origin name', () => {
        const scene = new Scene();
        const { arkClass } = setupClassWithMethod(scene, 'NestedNameHost', 'plainMethod');
        const { method: nested } = setupClassWithMethod(scene, 'NestedNameHost', '%nestedFunc$outerFunc');
        arkClass.addMethod(nested);

        // Full composed name and plain origin name both resolve the nested method
        expect(arkClass.getMethodsWithName('%nestedFunc$outerFunc').map(m => m.getName())).toEqual(['%nestedFunc$outerFunc']);
        expect(arkClass.getMethodsWithName('nestedFunc').map(m => m.getName())).toEqual(['%nestedFunc$outerFunc']);
        // The outer-method part does not match
        expect(arkClass.getMethodsWithName('outerFunc')).toEqual([]);
    });

    it('same-name replacement preserves the first index position (TS: last addMethod wins)', () => {
        const scene = new Scene();
        const { arkClass, sig } = setupClassWithMethod(scene, 'ReplaceHost', 'replaced');
        const first = new ArkMethod(arkClass.getClassSigID(), sig);

        const arkFile = new ArkFile(Language.TYPESCRIPT);
        arkFile.setScene(scene);
        const fileSig = new FileSignature('proj', 'src/ReplaceHost-other.ts');
        arkFile.setFileSignature(fileSig);
        const otherClass = new ArkClass(arkFile.getFileSigID());
        otherClass.setSignature(new ClassSignature('ReplaceOtherHost', fileSig, null));
        const other = new ArkMethod(
            otherClass.getClassSigID(),
            new MethodSignature(otherClass.getClassSigID(), new MethodSubSignature('otherMethod', [], UnknownType.getInstance(), false))
        );

        arkClass.addMethod(first);
        arkClass.addMethod(other);
        expect(arkClass.getTopMethodCount()).toBe(2);

        // Same name replaces in place (position 0 kept), not appended
        const { method: second } = setupClassWithMethod(scene, 'ReplaceHost', 'replaced');
        arkClass.addMethod(second);
        expect(arkClass.getTopMethodCount()).toBe(2);
        const names = arkClass.getMethods(true).map(m => m.getName());
        expect(names[0]).toBe('replaced');
        expect(names[1]).toBe('otherMethod');
        // The final winner is the last added method
        expect(arkClass.getMethodWithName('replaced')).toBe(second);
    });

    it('removeMethod removes exactly the given method, keeping same-name siblings', () => {
        const scene = new Scene();
        const { arkClass, method: kept } = setupClassWithMethod(scene, 'RemoveHost', 'kept');
        const { method: removed } = setupClassWithMethod(scene, 'RemoveHost', 'removed');
        arkClass.addMethod(kept);
        arkClass.addMethod(removed);
        expect(arkClass.getTopMethodCount()).toBe(2);

        expect(arkClass.removeMethod(removed)).toBe(true);
        expect(arkClass.getTopMethodCount()).toBe(1);
        expect(arkClass.getMethods(true).map(m => m.getName())).toEqual(['kept']);
    });

    it('clearAllReferences resets the method index', () => {
        const scene = new Scene();
        const { arkClass, method } = setupClassWithMethod(scene, 'ClearIdxHost', 'cleared');
        arkClass.addMethod(method);
        expect(arkClass.getTopMethodCount()).toBe(1);

        arkClass.clearAllReferences();
        expect(arkClass.getTopMethodCount()).toBe(0);
        expect(arkClass.getTopMethodSigIDs()).toBeNull();
        expect(arkClass.getMethods(true)).toEqual([]);
    });
});

describe('ArkMethod ID-injecting constructor Test', () => {
    function setupClass(scene: Scene, className: string): ArkClass {
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        arkFile.setScene(scene);
        const fileSig = new FileSignature('proj', `src/${className}.ts`);
        arkFile.setFileSignature(fileSig);
        const arkClass = new ArkClass(arkFile.getFileSigID());
        arkClass.setSignature(new ClassSignature(className, fileSig, null));
        return arkClass;
    }

    it('full injection: impl signature registered via setImplementationSignature inside the constructor', () => {
        const scene = new Scene();
        const arkClass = setupClass(scene, 'CtorFullHost');
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const implSig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('work', [], UnknownType.getInstance(), false));

        const method = new ArkMethod(arkClass.getClassSigID(), implSig);

        // setImplementationSignature ran inside: SigID assigned, model registered, canonical restored
        expect(method.getMethodSigID()).toBeGreaterThan(0);
        expect(reg.methodSigCanonicalizer.getModel(method.getMethodSigID()!)).toBe(method);
        expect(method.getDeclaringClassID()).toBe(arkClass.getClassSigID());
        expect(method.getImplementationSignature()!.toString()).toBe(implSig.toString());
        expect(method.getDeclaringArkClass()).toBe(arkClass);
    });

    it('declare-only injection: interning happens inside, registration completed by addMethod', () => {
        const scene = new Scene();
        const arkClass = setupClass(scene, 'CtorDeclHost');
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const declareSig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('declared', [], UnknownType.getInstance(), false));

        const method = new ArkMethod(arkClass.getClassSigID(), undefined, declareSig);

        expect(method.getMethodSigID()).toBeUndefined();
        expect(method.getDeclareSigIDs()!.length).toBe(1);
        const id = reg.methodSigCanonicalizer.getExistingId(declareSig);
        expect(id).toBeGreaterThan(0);
        expect(reg.methodSigCanonicalizer.getModel(id)).toBeUndefined();

        arkClass.addMethod(method);
        expect(reg.methodSigCanonicalizer.getModel(id)).toBe(method);
    });

    it('outerMethodSigID injection: nested relation resolves back to the outer method', () => {
        const scene = new Scene();
        const arkClass = setupClass(scene, 'CtorOuterHost');
        const outerSig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('outer', [], UnknownType.getInstance(), false));
        const outer = new ArkMethod(arkClass.getClassSigID(), outerSig);

        const nestedSig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('nested', [], UnknownType.getInstance(), false));
        const nested = new ArkMethod(arkClass.getClassSigID(), nestedSig, undefined, outer.getMethodSigID());

        expect(nested.getOuterMethodSigID()).toBe(outer.getMethodSigID());
        expect(nested.getOuterMethod()).toBe(outer);
        // Non-positive outer SigID is normalized to none (setOuterMethodSigID semantics)
        const plain = new ArkMethod(arkClass.getClassSigID(), undefined, undefined, -1);
        expect(plain.getOuterMethodSigID()).toBeUndefined();
    });

    it('injected construction is equivalent to the deprecated no-arg + setter chain', () => {
        const scene = new Scene();
        const arkClass = setupClass(scene, 'CtorEquivHost');
        const reg = SignatureCanonicalizerRegistry.getInstance();

        const implSig = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('equiv', [], UnknownType.getInstance(), false));
        const injected = new ArkMethod(arkClass.getClassSigID(), implSig);

        const implSig2 = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('equiv', [], UnknownType.getInstance(), false));
        // eslint-disable-next-line deprecation/deprecation
        const legacy = new ArkMethod(arkClass.getClassSigID(), implSig2);

        // Same signature value -> same SigID; both registered as models of their own slot value
        expect(injected.getMethodSigID()).toBe(legacy.getMethodSigID());
        expect(injected.getDeclaringClassID()).toBe(legacy.getDeclaringClassID());
        // Legacy registration overwrites the slot (same-class sibling arbitration keeps the first)
        expect(reg.methodSigCanonicalizer.getModel(injected.getMethodSigID()!)).toBe(injected);
    });

    it('parameter-name refresh applies through the constructor path', () => {
        const scene = new Scene();
        const arkClass = setupClass(scene, 'CtorRefreshHost');
        const reg = SignatureCanonicalizerRegistry.getInstance();

        // Declaration first (interns the canonical instance with param name 'declName')
        const declaring = new MethodSignature(
            arkClass.getClassSigID(),
            new MethodSubSignature('refresh', [newParam('declName')], UnknownType.getInstance(), false)
        );
        reg.methodSigCanonicalizer.getId(declaring);

        // Implementation with a different parameter name -> the constructor path must refresh
        const impl = new MethodSignature(arkClass.getClassSigID(), new MethodSubSignature('refresh', [newParam('implName')], UnknownType.getInstance(), false));
        new ArkMethod(arkClass.getClassSigID(), impl);

        const canonical = reg.methodSigCanonicalizer.get(reg.methodSigCanonicalizer.getId(impl))!;
        expect(canonical.getMethodSubSignature().getParameters()[0].getName()).toBe('implName');

        function newParam(name: string) {
            const p = new MethodParameter();
            p.setName(name);
            p.setType(UnknownType.getInstance());
            return p;
        }
    });
});
