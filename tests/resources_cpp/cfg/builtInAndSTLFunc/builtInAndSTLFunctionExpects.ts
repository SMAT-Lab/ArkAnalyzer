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
                "t1 = staticinvoke <@%unk/%unk: .typeid()>('int')",
                "t2 = staticinvoke <@%unk/%unk: .typeid()>('std::string')",
                'a = undefined',
                't3 = staticinvoke <@%unk/%unk: .typeid()>(a)',
                '%0 = &a',
                't4 = staticinvoke <@%unk/%unk: .typeid()>(%0)',
                '%1 = new @builtInAndSTLFunc/builtInAndSTLFunction.cpp: MyStruct',
                'instanceinvoke %1.<@builtInAndSTLFunc/builtInAndSTLFunction.cpp: MyStruct.constructor()>()',
                's = %1',
                't5 = staticinvoke <@%unk/%unk: .typeid()>(s)',
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
                "rank2 = staticinvoke <@%unk/%unk: .__array_rank()>('int[5][3]')",
                "dim1_size = staticinvoke <@%unk/%unk: .__array_extent()>('int[5][3]', 1)",
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
                '%0 = staticinvoke <@%unk/%unk: .foo()>()',
                'b = staticinvoke <@%unk/%unk: .CXXNoexceptExpr()>(%0)',
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
                '%0 = &counter',
                'staticinvoke <@%unk/%unk: .atomic_fetch_add()>(%0, 1)',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};
