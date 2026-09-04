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

import { describe, expect, it, beforeEach } from 'vitest';
import { CanonicalizerValidator } from '../../src/core/common/CanonicalizerValidator';
import { SignatureCanonicalizerRegistry } from '../../src/core/common/SignatureCanonicalizerRegistry';
import { SceneConfig } from '../../src/Config';
import { Scene } from '../../src/Scene';

// Isolated in its own file: the vitest forks pool isolates per FILE, so this suite starts
// with a fresh registry — required for the strongest end-to-end assertion below.
describe('CanonicalizerValidator end-to-end smoke Test', () => {
    // 单 Scene 单次构建生命周期：共享 registry 的二次构建为不支持场景（namespace
    // 挂载等全局查询判定在该场景下行为未定义）。本文件每个用例各自完整构建，
    // 遂逐用例 dispose 隔离，保证每个断言都在单次构建语义下成立。
    beforeEach(() => {
        SignatureCanonicalizerRegistry.dispose();
    });

    it('a full scene build + inferTypes leaves the file space completely clean', () => {
        const config = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/pta/Container');
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();

        // Validation is off by default (no side effects during inferTypes)…
        expect(scene.getOptions().validateCanonicalizers).toBeUndefined();
        // …and a normal build leaves the formal file space 100% clean.
        expect(CanonicalizerValidator.validateFileSpace()).toEqual([]);
    });

    it('validateAll returns true on a freshly built scene', () => {
        const config = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/pta/Container');
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
        expect(CanonicalizerValidator.validateAll()).toBe(true);
    });

    it('project/SDK ID boundary is set after build and fully consistent with projectFile flags', () => {
        const config = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/pta/Container');
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();

        const reg = SignatureCanonicalizerRegistry.getInstance();
        const boundary = reg.getFirstProjectFileSigID();
        const size = reg.fileSigCanonicalizer.size();

        // Boundary is set and strictly inside (SDK files before, project files after).
        expect(boundary).toBeGreaterThan(0);
        expect(boundary).toBeLessThan(size);

        // Cross-check every mounted model against both predicates and the flag itself.
        let sdkCount = 0;
        let projectCount = 0;
        for (let id = 1; id < size; id++) {
            const model = reg.fileSigCanonicalizer.getModel(id);
            if (model === undefined) {
                continue; // evicted entries have no say here
            }
            expect(reg.isProjectFileID(id)).toBe(model.isProjectFile());
            expect(reg.isSdkFileID(id)).toBe(!model.isProjectFile());
            if (model.isProjectFile()) {
                projectCount++;
            } else {
                sdkCount++;
            }
        }
        // The scene really has both kinds of files mounted.
        expect(sdkCount).toBeGreaterThan(0);
        expect(projectCount).toBeGreaterThan(0);
    });

    it('getFiles/getSdkArkFiles range-splitting is deeply equal to the legacy filter', () => {
        const config = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/pta/Container');
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();

        const models = SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getModels();
        // Legacy semantics recomputed via the flag filter (getModels preserves ID order).
        const legacyProject = models.filter(f => f.isProjectFile());
        const legacySdk = models.filter(f => !f.isProjectFile());

        // Deep equality: same length, same order (ID ascending), same instances.
        expect(scene.getFiles()).toEqual(legacyProject);
        expect(scene.getSdkArkFiles()).toEqual(legacySdk);
        // Together they partition the whole mounted space (ID 0 has no model).
        expect(scene.getFiles().length + scene.getSdkArkFiles().length).toBe(models.length);
    });

    it('getFiles/getSdkArkFiles return empty arrays before the boundary is marked', () => {
        // Fresh registry = boundary unmarked: strict range-splitting yields empty results.
        SignatureCanonicalizerRegistry.dispose();
        try {
            const scene = new Scene();
            expect(scene.getFiles()).toEqual([]);
            expect(scene.getSdkArkFiles()).toEqual([]);
        } finally {
            SignatureCanonicalizerRegistry.getInstance();
        }
    });

    it('a full scene build leaves the namespace space completely clean', () => {
        const config = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/pta/Container');
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();

        // 端到端：真实构建 + 类型推断后 namespace 空间全规则（N1a-N7c）零违规。
        expect(CanonicalizerValidator.validateNamespaceSpace()).toEqual([]);
        expect(CanonicalizerValidator.validateAll()).toBe(true);
        // 交叉一致：project 侧每个 ns 的 model 均可经 canonicalizer 按 ID 解析回自身。
        const reg = SignatureCanonicalizerRegistry.getInstance();
        for (const ns of scene.getNamespaces()) {
            expect(reg.namespaceSigCanonicalizer.getModel(ns.getNamespaceSigID())).toBe(ns);
        }
    });

    it('ClassType routing leaves the formal class space completely clean', () => {
        const config = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/pta/Container');
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();

        // ClassType 路由重构（formal 只读命中 / temp 兜底）的端到端效果，以完整
        // C 系规则（C1a-C7c）验证：真实构建 + 类型推断后 class 空间零违规——
        // 无 model-less 条目（C3）、挂载链完整（C7）。
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.classSigCanonicalizer.size()).toBeGreaterThan(1);
        expect(CanonicalizerValidator.validateClassSpace()).toEqual([]);
    });

    it('fieldRef routing writes neither formal space nor leaves temp empty at build time', () => {
        const config = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/pta/Container');
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        // 构建后（推断前）：formal field 空间只含 builder 注册的真实字段（有 model）；
        // fieldRef 的未注册签名（stub/占位）全部在 temp——field temp 从 0 变为可见。
        const buildStats = SignatureCanonicalizerRegistry.getTempSpacesStats();
        scene.buildSceneFromProjectDir(config);
        const afterBuild = SignatureCanonicalizerRegistry.getTempSpacesStats();

        // field temp 空间因 fieldRef 路由而出现条目（未解析 field 引用可见化）。
        expect(afterBuild.field.totalRegistered).toBeGreaterThan(buildStats.field.totalRegistered);

        scene.inferTypes();

        // 守护：fieldRef 路由全程不写 formal（formal 唯一写入门 = ArkField.setSignature，
        // 每条 formal field 条目仍应有 model——builder 全量挂载）。
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const size = reg.fieldSigCanonicalizer.size();
        expect(size).toBeGreaterThan(1);
        for (let id = 1; id < size; id++) {
            const model = reg.fieldSigCanonicalizer.getModel(id);
            if (model === undefined) {
                throw new Error(`field sig ID ${id} has no model`);
            }
        }
    });

    it('a full scene build leaves the field space completely clean (F1a-F7)', () => {
        const config = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/pta/Container');
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();

        // 端到端：真实构建 + 类型推断后 field 空间全规则零违规。
        // 若 F3 报告引用侧 ns 声明签名（合法无 model 形态），本断言将失败——
        // 届时按既定决策收窄 F3 口径并注记。
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.fieldSigCanonicalizer.size()).toBeGreaterThan(1);
        expect(CanonicalizerValidator.validateFieldSpace()).toEqual([]);
        expect(CanonicalizerValidator.validateAll()).toBe(true);
    });

    it('a full scene build leaves the method space completely clean (M1a-M7)', () => {
        const config = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/pta/Container');
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();

        // 端到端：真实构建 + 类型推断后 method 空间全规则零违规（M3 的
        // declare-only 合法态——SDK overload 声明条目——经 declaring class
        // 存活判定跳过，Phase 0 实证口径）。
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.methodSigCanonicalizer.size()).toBeGreaterThan(1);
        expect(CanonicalizerValidator.validateMethodSpace()).toEqual([]);
    });

    it('invokeExpr routing writes neither formal space nor leaves temp empty at build time', () => {
        SignatureCanonicalizerRegistry.dispose();
        const config = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/pta/Container');
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        const before = SignatureCanonicalizerRegistry.getTempSpacesStats();
        scene.buildSceneFromProjectDir(config);
        const afterBuild = SignatureCanonicalizerRegistry.getTempSpacesStats();

        // temp method 空间因 invoke expr 路由而出现条目（ArkUI stub / 动态方法
        // 占位等未解析 invoke 签名可见化）。
        expect(afterBuild.method.totalRegistered).toBeGreaterThan(before.method.totalRegistered);

        scene.inferTypes();

        // 守护：invoke expr 路由全程不写 formal（formal 写入 =
        // ArkMethod setImplementationSignature/setDeclareSignatures + addMethod，
        // 由 M3 实证口径与全规则零违规间接保证）。
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.methodSigCanonicalizer.size()).toBeGreaterThan(1);
        expect(CanonicalizerValidator.validateMethodSpace()).toEqual([]);
    });
});
