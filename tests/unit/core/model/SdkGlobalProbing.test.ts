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
import { Scene, SceneConfig } from '../../../../src';
import { SignatureCanonicalizerRegistry } from '../../../../src/core/common/SignatureCanonicalizerRegistry';
import { ArkClass } from '../../../../src/core/model/ArkClass';
import { ArkField } from '../../../../src/core/model/ArkField';
import { ArkExport } from '../../../../src/core/model/ArkExport';

/**
 * 固化测试：SDK 全局符号多值存储 + 成员探测（copyMembers 跨实体/跨文件合并退役后）。
 *
 * 语义契约：
 *  1. 成员签名归属真实声明文件（版本判据主判据）——replace 等非首载文件成员
 *     经探测链命中且签名保留原文件；
 *  2. 全局符号类实体（getSdkGlobalMemberClasses 范围）的字段签名归属 == 挂载类
 *     （字段不变量；ns 级 copyNamespace 残留场景不在该范围）；
 *  3. 多实体列表完整（跨文件同名 interface 全登记，var 声明 local 在列）。
 */
describe('SDK global multi-value probing invariants', () => {
    let scene: Scene;

    beforeAll(() => {
        SignatureCanonicalizerRegistry.dispose();
        const config = new SceneConfig();
        config.buildFromProjectDir(path.resolve('tests/resources/sdkGlobalProbe'));
        config.getOptions().enableBuiltIn = true;
        scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
    });

    it('members declared in later lib files resolve via probing and keep their real declaring file', () => {
        const file = scene.getFiles().find(f => f.getName() === 'probe.ts');
        expect(file).toBeDefined();
        const stmts = file!.getDefaultClass().getMethodWithName('probe')!.getCfg()!.getStmts();
        const invokeStmts = stmts.map(s => s.toString());
        // String.replaceAll 声明于 lib.es2021.string（interface String 的跨文件增补，
        // 非首载 lib.es5）——探测命中且签名归属真实声明文件（版本判据固化）。
        const replaceAll = invokeStmts.find(s => s.includes('replaceAll'));
        expect(replaceAll).toBeDefined();
        expect(replaceAll!).toContain('lib.es2021.string.d.ts');
        // Array.includes 声明于 lib.es2016.array.include。
        const includes = invokeStmts.find(s => s.includes('includes'));
        expect(includes).toBeDefined();
        expect(includes!).toContain('lib.es2016.array.include.d.ts');
    });

    it('multi-value entity lists are complete (same-name interfaces across files + var local)', () => {
        // interface Promise：es5 骨架 + es2015.iterable + es2018.promise 等 + var local。
        const promiseEntities = SignatureCanonicalizerRegistry.getSdkGlobals('Promise');
        expect(promiseEntities.length).toBeGreaterThanOrEqual(3);
        expect(promiseEntities.some(e => e instanceof ArkClass && e.getDeclaringArkFile().getName() === 'lib.es5.d.ts')).toBe(true);
        const fileOf = (e: ArkExport): string | undefined => {
            const holder = e as unknown as { getDeclaringArkFile?: () => { getName(): string } };
            return holder.getDeclaringArkFile?.()?.getName();
        };
        expect(promiseEntities.some(e => fileOf(e) === 'lib.es2018.promise.d.ts')).toBe(true);
        // PromiseConstructor 实体含 es2021.promise（any 所在文件）。
        const ctorClasses = SignatureCanonicalizerRegistry.getSdkGlobalMemberClasses('Promise');
        const anyOwner = ctorClasses.find(c => c.getMethodWithName('any') !== null);
        expect(anyOwner).toBeDefined();
        expect(anyOwner!.getDeclaringArkFile().getName()).toBe('lib.es2021.promise.d.ts');
    });

    it('field signatures of global-symbol class entities belong to their mounting class', () => {
        // 字段不变量（全局符号全范围）：顶层实体（getSdkGlobalMemberClasses）+ ns 内
        // 类（getNamespacedSiblingClasses——跨文件同名 ns 的各实体内同名类）覆盖的
        // 全部类实体上，字段签名归属 == 挂载类（copyMembers/copyNamespace 跨实体/
        // 跨文件合并均已退役，成员物理留在声明实体）。
        let checked = 0;
        const visited = new Set<ArkClass>();
        const visit = (cls: ArkClass): void => {
            if (visited.has(cls)) {
                return;
            }
            visited.add(cls);
            for (const fld of cls.getFields() as ArkField[]) {
                const decl = fld.getSignature().getDeclaringClassSigID();
                expect(decl).toBe(cls.getClassSigID());
                checked++;
            }
            for (const sibling of SignatureCanonicalizerRegistry.getNamespacedSiblingClasses(cls)) {
                visit(sibling);
            }
        };
        for (const name of SignatureCanonicalizerRegistry.getInstance().sdkGlobalMap.keys()) {
            for (const cls of SignatureCanonicalizerRegistry.getSdkGlobalMemberClasses(name)) {
                visit(cls);
            }
        }
        // Sanity: the invariant is meaningful (SDK classes with fields were covered,
        // including ns-inner classes such as Intl.NumberFormatOptions across files).
        expect(checked).toBeGreaterThan(50);
    });
});

/**
 * Intl namespace member probing invariants (cross-file same-name namespace):
 * `Intl` is declared across lib.es5 + lib.es2017/2018/2019/2020/2021.intl —
 * members declared in later files (formatToParts@es2018.intl,
 * ResolvedNumberFormatOptions.notation@es2020.intl, PluralRules var@es2018.intl)
 * must stay resolvable with their real declaring file in the signature.
 * These assertions lock the CURRENT correct output (members carry real declaring
 * files via the legacy copyNamespace merging today; after the ns multi-value
 * probing switchover they must survive unchanged).
 */
describe('Intl cross-file namespace member probing invariants', () => {
    let scene: Scene;

    beforeAll(() => {
        SignatureCanonicalizerRegistry.dispose();
        const config = new SceneConfig();
        config.buildFromProjectDir(path.resolve('tests/resources/sdkGlobalProbe'));
        config.getOptions().enableBuiltIn = true;
        scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
    });

    function probeIntlStmts(): string[] {
        const file = scene.getFiles().find(f => f.getName() === 'probe-intl.ts');
        expect(file).toBeDefined();
        const stmts = file!.getDefaultClass().getMethodWithName('probeIntl')!.getCfg()!.getStmts();
        return stmts.map(s => s.toString());
    }

    it('new Intl.NumberFormat resolves via the es5 local constructor path', () => {
        const stmts = probeIntlStmts();
        const ctor = stmts.find(s => s.includes('construct-signature'));
        expect(ctor).toBeDefined();
        expect(ctor!).toContain('lib.es5.d.ts');
    });

    it('formatToParts keeps its real declaring file (lib.es2018.intl)', () => {
        const stmts = probeIntlStmts();
        const formatToParts = stmts.find(s => s.includes('formatToParts'));
        expect(formatToParts).toBeDefined();
        expect(formatToParts!).toContain('lib.es2018.intl.d.ts');
    });

    it('resolvedOptions().notation keeps its real declaring file (lib.es2020.intl)', () => {
        const stmts = probeIntlStmts();
        const notation = stmts.find(s => s.includes('notation'));
        expect(notation).toBeDefined();
        expect(notation!).toContain('lib.es2020.intl.d.ts');
    });

    it('Intl.PluralRules value access stays resolvable', () => {
        const stmts = probeIntlStmts();
        const pluralRules = stmts.find(s => s.includes('PluralRules'));
        expect(pluralRules).toBeDefined();
    });
});
