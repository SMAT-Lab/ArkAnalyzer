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

export const REFERENCE_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'b = parameter0: double&',
                'this = this: @reference/reference.cpp: %dflt',
                'a = 1',
                'flag = true',
                'f = 1.02',
                "c = 'x'",
                'ref_a = a',
                'ref_flag = flag',
                'ref_f = f',
                'ref_c = c',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const REFERENCE_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @reference/reference.cpp: %dflt', 'ptr = nullptr', 'ref_to_ptr = ptr', 'return'],
            preds: [],
            succes: [],
        },
    ],
};

export const REFERENCE_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @reference/reference.cpp: %dflt',
                '%0 = new @reference/reference.cpp: MyClass',
                'instanceinvoke %0.<@reference/reference.cpp: MyClass.constructor()>(5)',
                'a = %0',
                'b = a',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const REFERENCE_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @reference/reference.cpp: %dflt', 'x = 1', 'y = 2', 'rr1 = 10', 'rr2 = x + y', 'return'],
            preds: [],
            succes: [],
        },
    ],
};

export const REFERENCE_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: ['arg = parameter0: T&&', 'this = this: @reference/reference.cpp: %dflt', 'd1 = staticinvoke <@%unk/%unk: .forward()>(arg)', 'return'],
            preds: [],
            succes: [],
        },
    ],
};

export const REFERENCE_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @reference/reference.cpp: %dflt',
                'temp = 5',
                'ref_a = staticinvoke <@%unk/%unk: .move()>(temp)',
                'ref_a = 6',
                "str1 = 'Hello'",
                'str2 = staticinvoke <@%unk/%unk: .move()>(str1)',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};
