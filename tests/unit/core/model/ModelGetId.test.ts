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

import { describe, expect, it, beforeAll } from 'vitest';
import {
    ArkField,
    ArkMethod,
    FieldSignature,
    MethodSignature,
    MethodSubSignature,
    Scene,
    SceneConfig,
    UnknownType,
} from '../../../../src';
import { SignatureCanonicalizerRegistry } from '../../../../src/core/common/SignatureCanonicalizerRegistry';

describe('Model getId Test', () => {
    let scene: Scene;

    beforeAll(() => {
        SignatureCanonicalizerRegistry.dispose();
        const config = new SceneConfig();
        config.buildFromProjectDir('tests/resources/model/class');
        scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
    });

    it('getId equals the canonicalizer SigID for all four 1:1 model kinds', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();

        const file = scene.getFiles()[0];
        expect(file.getId()).toBe(file.getFileSigID());
        expect(file.getId()).toBeGreaterThan(0);

        const cls = scene.getClasses().find(c => c.getName() === 'TestClass');
        expect(cls).toBeDefined();
        expect(cls!.getId()).toBe(cls!.getClassSigID());
        expect(cls!.getId()).toBeGreaterThan(0);

        const ns = scene.getNamespaces()[0];
        if (ns) {
            expect(ns.getId()).toBe(ns.getNamespaceSigID());
            expect(ns.getId()).toBeGreaterThan(0);
        }

        const field = new ArkField(cls!.getClassSigID(), new FieldSignature('unitField', cls!.getClassSigID(), UnknownType.getInstance(), false));
        expect(field.getId()).toBe(field.getFieldSigID());
        expect(field.getId()).toBeGreaterThan(0);

        expect(reg.classSigCanonicalizer.get(cls!.getId())).toBeDefined();
        expect(reg.classSigCanonicalizer.getModel(cls!.getId())).toBe(cls);
        expect(reg.fieldSigCanonicalizer.getModel(field.getId())).toBe(field);
    });

    it('ArkMethod getId follows the getSignature selection: impl first, declare[0] fallback', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();

        const cls = scene.getClasses().find(c => c.getName() === 'TestClass');
        const method = cls!.getMethods().find(m => m.getName() === 'testMethod');
        expect(method).toBeDefined();

        expect(method!.getId()).toBe(method!.getMethodSigID());
        expect(method!.getId()).toBeGreaterThan(0);
        expect(reg.methodSigCanonicalizer.getModel(method!.getId())).toBe(method);
        expect(method!.getSignature()).toBe(reg.methodSigCanonicalizer.get(method!.getId()));

        const declareOnly = new ArkMethod(cls!.getClassSigID());
        const subSig = new MethodSubSignature('declared', [], UnknownType.getInstance(), false);
        const declSig = new MethodSignature(cls!.getClassSigID(), subSig);
        const declId = reg.methodSigCanonicalizer.getOrCreateId(declSig);
        declareOnly.setDeclareSignatures([declSig]);
        expect(declareOnly.getMethodSigID()).toBeUndefined();
        expect(declareOnly.getId()).toBe(declId);
        expect(declareOnly.getSignature()).toBe(reg.methodSigCanonicalizer.get(declareOnly.getId()));
    });
});
