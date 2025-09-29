/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

export const BUILT_IN_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @builtInAndSTLFunc/builtInAndSTLFunction.cpp: %dflt',
                't1 = noexcept(undefined)',
                't2 = noexcept(std)',
                'a = undefined',
                't3 = noexcept(a)',
                't4 = noexcept(&a)',
                '%0 = new @builtInAndSTLFunc/builtInAndSTLFunction.cpp: MyStruct',
                'instanceinvoke %0.<@builtInAndSTLFunc/builtInAndSTLFunction.cpp: MyStruct.constructor()>()',
                's = %0',
                't5 = noexcept(s)',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BUILT_IN_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @builtInAndSTLFunc/builtInAndSTLFunction.cpp: %dflt',
                'arr2 = undefined',
                'rank2 = __array_rank(arr2)',
                'dim1Size = __array_extent(arr2,1)',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BUILT_IN_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @builtInAndSTLFunc/builtInAndSTLFunction.cpp: %dflt',
                'b = noexcept(staticinvoke <@%unk/%unk: .Foo()>())',
                'return 0',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BUILT_IN_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @builtInAndSTLFunc/builtInAndSTLFunction.cpp: %dflt',
                '%0 = &g_counter',
                'staticinvoke <@%unk/%unk: .atomic_fetch_add()>(%0, 1)',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BUILT_IN_EXPECT_CASE4_LINUX = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @builtInAndSTLFunc/builtInAndSTLFunction.cpp: %dflt',
                '%0 = &g_counter',
                'staticinvoke <@%unk/%unk: .__c11_atomic_fetch_add()>(%0, 1, 5)',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};
