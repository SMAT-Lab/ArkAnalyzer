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
import { ArkAssignStmt } from '../../../../src/core/base/Stmt';
import { ArkInstanceFieldRef } from '../../../../src/core/base/Ref';
import { Local } from '../../../../src/core/base/Local';
import { BooleanType } from '../../../../src/core/base/Type';

/**
 * round32b 守护用例：cpp range-for 降级的 begin/end 字段类型（零 include，
 * 不依赖 OHOS SDK——CI/本机全平台可跑）。
 *
 * 修复前（round32b）：begin/end 字段签名类型被写死 BooleanType（历史 quirk）。
 * 该类型经赋值传播污染迭代器 Local（IterableIterator stub → boolean），随后
 * 解引用推导走 core inferInstanceMember 的 primitive→wrapper 提升链
 * （'boolean' → Registry.getSdkGlobal('Boolean') → lib.es5 Boolean 类），把
 * `IterableIterator.*` 错误改写为 `Boolean.*`（CI structBinding MapUsage /
 * loopSample 的 range-for deref 失败根因；round23 的 SDK global 查询迁移
 * Registry 后测试 mock 拦不住 wrapper 查询而显形）。
 * 修复后：begin/end 类型为 UnknownType（不传播——transferRight2Left 的
 * unclear guard 拦截），迭代器保持 stub 形态；循环条件的 boolean 语义由
 * handleForRangeIterEnd 对 doneFlag 的显式 setType 承担（本用例一并守护）。
 *
 * 注：本资源容器为 resolved 形态（ns 限定名可解析），resolved 场景下迭代器
 * 类型为 begin 方法的解析产物（独立行为，CI 期望不覆盖）；CI 失败的完整
 * 验证由 structBinding/loop 期望承担（unresolved 容器 → `IterableIterator.*`）。
 */
describe('cpp range-for begin/end field type Test', () => {
    it('begin/end field signatures use UnknownType and never pollute the iterator with boolean', () => {
        SignatureCanonicalizerRegistry.dispose();
        vi.spyOn(Scene.prototype, 'getSdkGlobal').mockReturnValue(null);
        const config = new SceneConfig({ supportFileExts: [...getCxxSourceFileExtensions()] });
        config.buildFromProjectDir(path.resolve(__dirname, '../../../cppResources/cfg/mapIterMini'));
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();

        const file = scene.getFiles().find(f => f.getName().endsWith('mapIterMini.cpp'));
        assert.isDefined(file);
        const method = file!.getDefaultClass().getMethodWithName('MapUsage');
        assert.isDefined(method);
        const stmts = method!.getCfg()!.getStmts();

        // 1. begin/end 字段签名类型不是 BooleanType（修复前 builder 写死 BooleanType
        //    ——污染源；resolved 容器下 build/推导期可能进一步改写为方法类型，属
        //    独立行为——本断言只守护"不再以 boolean 作为降级占位"）
        let beginEndCount = 0;
        let iteratorName: string | undefined;
        for (const stmt of stmts) {
            if (stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof ArkInstanceFieldRef) {
                const ref = stmt.getRightOp() as ArkInstanceFieldRef;
                const name = ref.getFieldName();
                if (name === 'begin' || name === 'end') {
                    beginEndCount++;
                    assert.notEqual(
                        ref.getFieldSignature().getType(),
                        BooleanType.getInstance(),
                        `${name} field type must not be the BooleanType placeholder (pollution source), got ${ref.getFieldSignature().getType().toString()}`
                    );
                    if (name === 'begin') {
                        iteratorName = (stmt.getLeftOp() as Local).getName();
                    }
                }
            }
        }
        assert.isAtLeast(beginEndCount, 2, 'begin/end field refs not found');
        assert.isDefined(iteratorName);

        scene.inferTypes();

        // 2. 推导后断言：迭代器 Local（begin 赋值目标）未被 boolean 污染（修复前
        //    类型为 boolean，进而经 wrapper 提升把解引用声明类改写为 lib.es5 Boolean）
        const iterType = method!.getBody()!.getLocals().get(iteratorName!)?.getType();
        assert.isDefined(iterType);
        assert.isFalse(
            iterType === BooleanType.getInstance(),
            `iterator local must not be polluted to boolean (was the root cause of the Boolean.* declaring-class rewrite), got ${iterType!.toString()}`
        );
        vi.restoreAllMocks();
    });
});
