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

import { assert, describe, it, vi } from 'vitest';
import path from 'path';
import { Scene, SceneConfig, getCxxSourceFileExtensions } from '../../../../src';
import { SignatureCanonicalizerRegistry } from '../../../../src/core/common/SignatureCanonicalizerRegistry';

/**
 * round32 守护用例：cpp 方法内局部 struct 的类型归属（零 include，不依赖
 * OHOS SDK——CI/本机全平台可跑）。
 *
 * 修复前：findClassByShortName 的 enclosing-name 链把 `%dflt` 排除（`%` 前缀
 * 统一跳过），顶层函数上下文（ctxClass=%dflt）的链恒空 → 局部类候选
 * `Person$%dflt.UseLocalStruct` 无法构造 → person 类型退化为 %unk stub
 * （CI structBinding case3 的 Person 失败根因，本文件为其零依赖最小复现）。
 * 修复后：`%dflt` 作为 file 级函数容器放行进链，局部类按挂载名命中。
 */
describe('cpp local class resolution Test', () => {
    it('method-local struct type belongs to the local class', () => {
        SignatureCanonicalizerRegistry.dispose();
        vi.spyOn(Scene.prototype, 'getSdkGlobal').mockReturnValue(null);
        const config = new SceneConfig({ supportFileExts: [...getCxxSourceFileExtensions()] });
        config.buildFromProjectDir(path.resolve(__dirname, '../../../cppResources/cfg/localClassMini'));
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();

        const file = scene.getFiles().find(f => f.getName().endsWith('localClassMini.cpp'));
        assert.isDefined(file);
        // 局部类按挂载名注册在文件上
        assert.isDefined(file!.getClassWithName('Person$%dflt.UseLocalStruct'));
        // 局部变量类型归属局部类（修复前为 %unk stub 'Person'）
        const person = file!.getDefaultClass().getMethodWithName('UseLocalStruct')?.getBody()?.getLocals().get('person');
        assert.isDefined(person);
        assert.equal(person!.getType().toString(), '@localClassMini/localClassMini.cpp: Person$%dflt.UseLocalStruct');
        vi.restoreAllMocks();
    });
});
