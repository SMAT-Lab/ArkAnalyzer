/*
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

export const LOOP_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loop/LoopSample.ts: %dflt',
                '%0 = newarray (number)[2]',
                '%0[0] = 1',
                '%0[1] = 2',
                '%1 = newarray (number)[2]',
                '%1[0] = 3',
                '%1[1] = 4',
                '%2 = newarray (number[]|number[])[2]',
                '%2[0] = %0',
                '%2[1] = %1',
                'arr = %2',
                '%3 = instanceinvoke arr.<@%unk/%unk: .Symbol.iterator()>()',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%4 = instanceinvoke %3.<@%unk/%unk: .next()>()',
                '%5 = %4.<@ES2015/BuiltinClass: IteratorResult.done>',
                'if %5 == true',
            ],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%6 = %4.<@ES2015/BuiltinClass: IteratorResult.value>',
                '%7 = <unknown>%6',
                'a = %7[0]',
                'b = %7[1]',
                'instanceinvoke console.<@%unk/%unk: .log()>(a, b)',
            ],
            preds: [1],
            succes: [1],
        },
        {
            id: 3,
            stmts: [
                'return',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const LOOP_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loop/LoopSample.ts: %dflt',
                '%0 = new @loop/LoopSample.ts: %AC0$%dflt.case2',
                '%0 = instanceinvoke %0.<@loop/LoopSample.ts: %AC0$%dflt.case2.constructor()>()',
                '%1 = new @loop/LoopSample.ts: %AC1$%dflt.case2',
                '%1 = instanceinvoke %1.<@loop/LoopSample.ts: %AC1$%dflt.case2.constructor()>()',
                '%2 = newarray (@loop/LoopSample.ts: %AC0$%dflt.case2|@loop/LoopSample.ts: %AC1$%dflt.case2)[2]',
                '%2[0] = %0',
                '%2[1] = %1',
                'arr = %2',
                '%3 = instanceinvoke arr.<@%unk/%unk: .Symbol.iterator()>()',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%4 = instanceinvoke %3.<@%unk/%unk: .next()>()',
                '%5 = %4.<@ES2015/BuiltinClass: IteratorResult.done>',
                'if %5 == true',
            ],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%6 = %4.<@ES2015/BuiltinClass: IteratorResult.value>',
                '%7 = <unknown>%6',
                'a = %7.<@%unk/%unk: .a>',
                'b = %7.<@%unk/%unk: .b>',
                'instanceinvoke console.<@%unk/%unk: .log()>(a, b)',
            ],
            preds: [1],
            succes: [1],
        },
        {
            id: 3,
            stmts: [
                'return',
            ],
            preds: [1],
            succes: [],
        },
    ],
};