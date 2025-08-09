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

export const USING_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @using/usingcase.cpp: %dflt', "staticinvoke <@%unk/%unk: .cout()>('[test_using_namespace] hello')", 'return'],
            preds: [],
            succes: [],
        },
    ],
};

export const USING_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                "staticinvoke <@%unk/%unk: .cout()>('[test_using_declaration] hello')",
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const USING_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                '%0 = new @using/usingcase.cpp: Derived',
                'instanceinvoke %0.<@using/usingcase.cpp: Derived.constructor()>()',
                'd = %0',
                'instanceinvoke d.<@using/usingcase.cpp: Derived.Foo()>(1)',
                'instanceinvoke d.<@using/usingcase.cpp: Derived.Foo()>(1.23)',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const USING_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [  "this = this: @using/usingcase.cpp: %dflt",
                        "c = RED",
                        "%0 = Color.<@%unk/%unk: .RED>",
                        "if c == %0",
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: ["staticinvoke <@%unk/%unk: .cout()>('[test_using_enum_member] Red\\n')"],
            preds: [0],
            succes: [2],
        },
        {
            id: 2,
            stmts: ['return'],
            preds: [1, 0],
            succes: [],
        },
    ],
};
