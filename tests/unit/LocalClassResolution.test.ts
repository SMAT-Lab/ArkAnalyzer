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

import { beforeAll, describe, expect, it } from 'vitest';
import path from 'path';
import { ArkAssignStmt, ArkInstanceFieldRef, ArkMethod, ArkNewExpr, Scene } from '../../src';
import { Stmt } from '../../src/core/base/Stmt';
import { ClassType } from '../../src/core/base/Type';
import { ClassSignature } from '../../src/core/model/ArkSignature';
import { buildScene } from './common';
import { SignatureCanonicalizerRegistry } from '../../src/core/common/SignatureCanonicalizerRegistry';

describe('Local class deterministic resolution (method scope chain)', () => {
    let scene: Scene;

    beforeAll((): void => {
        scene = buildScene(path.join(__dirname, '../resources/localClass'));
    });

    function getOuterClass() {
        const file = scene.getFiles().find(f => f.getName() === 'localClass.ts');
        expect(file).toBeDefined();
        const outer = file!.getClassWithName('Outer');
        expect(outer).toBeDefined();
        return outer!;
    }

    function collectNewExprs(mtd: ArkMethod): ArkNewExpr[] {
        const stmts: Stmt[] = mtd.getCfg()?.getStmts() ?? [];
        const result: ArkNewExpr[] = [];
        for (const stmt of stmts) {
            if (stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof ArkNewExpr) {
                result.push(stmt.getRightOp() as ArkNewExpr);
            }
        }
        return result;
    }

    it('registers local classes on the declaring method (bare name → SigID)', () => {
        const outer = getOuterClass();
        const m = outer.getMethodWithName('m');
        expect(m).toBeDefined();
        const sigID = m!.getLocalClassSigID('Local');
        expect(sigID).toBeDefined();
        const cls = SignatureCanonicalizerRegistry.getInstance().getArkClassById(sigID!);
        expect(cls).toBeDefined();
        expect(cls!.getName()).toBe('Local$Outer-m');
    });

    it('resolves `new Local()` to the local class with a formal (non-unclear) signature', () => {
        const outer = getOuterClass();
        const m = outer.getMethodWithName('m');
        const newExprs = collectNewExprs(m!);
        const localNew = newExprs.find(e => e.getClassType().getClassSignature().getClassName().startsWith('Local'));
        expect(localNew).toBeDefined();
        const sig = localNew!.getClassType().getClassSignature();
        expect(sig.getClassName()).toBe('Local$Outer-m');
        expect(sig.getDeclaringFileSigID()).not.toBe(0);
    });

    it('resolves the `let v: Local` type annotation to the local class', () => {
        const outer = getOuterClass();
        const m = outer.getMethodWithName('m');
        const stmts: Stmt[] = m!.getCfg()?.getStmts() ?? [];
        // `v.x = 3` — field access inference depends on v's annotated type resolving
        // to the local class.
        const fieldAssign = stmts.find(
            s =>
                s instanceof ArkAssignStmt &&
                (s as ArkAssignStmt).getLeftOp() instanceof ArkInstanceFieldRef &&
                ((s as ArkAssignStmt).getLeftOp() as ArkInstanceFieldRef).getFieldName() === 'x'
        );
        expect(fieldAssign).toBeDefined();
        const fieldRef = (fieldAssign as ArkAssignStmt).getLeftOp() as ArkInstanceFieldRef;
        const declaringSig = fieldRef.getFieldSignature().getDeclaringSignature();
        expect((declaringSig as ClassSignature).getClassName()).toBe('Local$Outer-m');
    });

    it('local class shadows the same-name top-level class (scope semantics fix)', () => {
        const outer = getOuterClass();
        const n = outer.getMethodWithName('n');
        expect(n).toBeDefined();
        // The top-level Shadow must still exist (exact name hit).
        const file = scene.getFiles().find(f => f.getName() === 'localClass.ts');
        expect(file!.getClassWithName('Shadow')).toBeDefined();
        const newExprs = collectNewExprs(n!);
        const shadowNew = newExprs.find(e => e.getClassType().getClassSignature().getClassName().startsWith('Shadow'));
        expect(shadowNew).toBeDefined();
        // Must resolve to the LOCAL Shadow ('Shadow$Outer-n'), not the top-level 'Shadow'.
        const sig = shadowNew!.getClassType().getClassSignature();
        expect(sig.getClassName()).toBe('Shadow$Outer-n');
        expect(sig.getDeclaringFileSigID()).not.toBe(0);
    });

    it('resolves a local class referenced from a nested arrow function (outer-method chain)', () => {
        const outer = getOuterClass();
        // The arrow function is a nested method attached to Outer; collect new exprs from it.
        const arrowMethods = outer.getMethods().filter(mtd => mtd.getName().startsWith('%AM'));
        const allNewExprs: ArkNewExpr[] = [];
        for (const mtd of arrowMethods) {
            allNewExprs.push(...collectNewExprs(mtd));
        }
        const innerNew = allNewExprs.find(e => e.getClassType().getClassSignature().getClassName().startsWith('Inner'));
        expect(innerNew).toBeDefined();
        const sig = innerNew!.getClassType().getClassSignature();
        expect(sig.getClassName()).toBe('Inner$Outer-p');
        expect(sig.getDeclaringFileSigID()).not.toBe(0);
    });

    it('arrow function return type resolves to the local class', () => {
        const outer = getOuterClass();
        const arrowMethods = outer.getMethods().filter(mtd => mtd.getName().startsWith('%AM'));
        expect(arrowMethods.length).toBeGreaterThan(0);
        const withInnerReturn = arrowMethods.find(
            mtd =>
                mtd.getSignature().getMethodSubSignature().getReturnType() instanceof ClassType &&
                (mtd.getSignature().getMethodSubSignature().getReturnType() as ClassType).getClassSignature().getClassName().startsWith('Inner')
        );
        expect(withInnerReturn).toBeDefined();
        const returnType = withInnerReturn!.getSignature().getMethodSubSignature().getReturnType() as ClassType;
        expect(returnType.getClassSignature().getClassName()).toBe('Inner$Outer-p');
    });
});
