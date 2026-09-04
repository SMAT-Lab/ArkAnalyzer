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
import path from 'path';
import { Scene, SceneConfig } from '../../src';
import { FileSignature } from '../../src/core/model/ArkSignature';
import { SignatureCanonicalizerRegistry } from '../../src/core/common/SignatureCanonicalizerRegistry';

// 独立文件（forks 按文件隔离）：以干净 registry 固化全局不变量——
// builtFileOrder（setFile 后序记录）为严格拓扑序（被依赖者在前），
// 推断期按其正序遍历即零排序（见 Scene.genArkFiles / Scene.inferTypes）。
//
// 资源形态：a→z、b→z、c→z、d→{b,c}（含菱形依赖）。
describe('builtFileOrder topological invariant Test', () => {
    const projectDir = path.join(__dirname, '../resources/reverseTopo');

    function orderOf(scene: Scene, fileName: string): number {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const id = reg.fileSigCanonicalizer.getExistingId(new FileSignature(scene.getProjectName(), fileName));
        return scene.getBuiltFileOrder().indexOf(id);
    }

    function assertTopological(scene: Scene): void {
        // 拓扑序：每条依赖边 (依赖方 → 被依赖方) 上，被依赖者序位在前。
        // （不比较 b/c 相对序——无依赖关系，顺序无约束）
        expect(orderOf(scene, 'z.ts')).toBeLessThan(orderOf(scene, 'a.ts'));
        expect(orderOf(scene, 'z.ts')).toBeLessThan(orderOf(scene, 'b.ts'));
        expect(orderOf(scene, 'z.ts')).toBeLessThan(orderOf(scene, 'c.ts'));
        expect(orderOf(scene, 'b.ts')).toBeLessThan(orderOf(scene, 'd.ts'));
        expect(orderOf(scene, 'c.ts')).toBeLessThan(orderOf(scene, 'd.ts'));
        // 序列完整覆盖全部 project 文件
        expect(scene.getBuiltFileOrder().length).toBe(5);
    }

    it('buildSceneFromProjectDir records a topological builtFileOrder', () => {
        SignatureCanonicalizerRegistry.dispose();
        const config = new SceneConfig();
        config.buildFromProjectDir(projectDir);
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        assertTopological(scene);
        expect(scene.getFiles().length).toBe(5);
    });

    it('buildSceneFromFiles records a topological builtFileOrder', () => {
        SignatureCanonicalizerRegistry.dispose();
        const config = new SceneConfig();
        config.buildConfig('reverseTopo', projectDir, [], [
            path.join(projectDir, 'a.ts'),
            path.join(projectDir, 'b.ts'),
            path.join(projectDir, 'c.ts'),
            path.join(projectDir, 'd.ts'),
            path.join(projectDir, 'z.ts'),
        ]);
        const scene = new Scene();
        scene.buildSceneFromFiles(config);
        assertTopological(scene);
        expect(scene.getFiles().length).toBe(5);
    });

    it('builtFileOrder iteration infers cross-file types (a.z resolves to Z)', () => {
        SignatureCanonicalizerRegistry.dispose();
        const config = new SceneConfig();
        config.buildFromProjectDir(projectDir);
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
        const field = scene.getFile(new FileSignature(scene.getProjectName(), 'a.ts'))?.getClassWithName('A')?.getFieldWithName('z');
        expect(field).toBeDefined();
        expect(field!.getType().toString()).toContain('Z');
    });
});
