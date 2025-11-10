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
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                "staticinvoke <@%unk/%unk: .cout()>('[test_using_namespace] hello')",
                'return'
            ],
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
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                "c = @using/usingcase.cpp: Color.[static]RED",
                "%0 = @using/usingcase.cpp: Color.[static]RED",
                'if c == %0'
            ],
            preds: [],
            succes: [1, 2]
        },
        {
            id: 1,
            stmts: [
                "staticinvoke <@%unk/%unk: .cout()>('[test_using_enum_member] Red\\n')"
            ],
            preds: [0],
            succes: [2]
        },
        { id: 2, stmts: ['return'], preds: [1, 0], succes: [] }
    ],
};

export const USING_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                'v = staticinvoke <@using/usingcase.cpp: ns1.%dflt.Foo()>()',
                "staticinvoke <@%unk/%unk: .cout()>('[test_namespace_using] v = ', v)",
                'return'
            ],
            preds: [],
            succes: []
        },
    ],
};

export const USING_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                '%0 = new @std/vector.h: vector',
                '%1 = newarray (int[])[3]',
                '%1[0] = 1',
                '%1[1] = 2',
                '%1[2] = 3',
                'instanceinvoke %0.<@std/vector.h: vector.constructor()>(%1)',
                'return %0'
            ],
            preds: [],
            succes: []
        },
    ],
};

export const USING_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                '%0 = new @std/map.h: map<float>',
                'instanceinvoke %0.<@std/map.h: map.constructor()>()',
                'm = %0',
                'm[1] = 3.14',
                '%1 = m[1]',
                "staticinvoke <@%unk/%unk: .cout()>('[test_using_type_alias_template] m[1] = ', %1)",
                'return'
            ],
            preds: [],
            succes: []
        },
    ],
};

export const USING_EXPECT_CASE8 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                'x = 3.14',
                "staticinvoke <@%unk/%unk: .cout()>('[test_template_type_alias] x = ', x)",
                'return'
            ],
            preds: [],
            succes: []
        },
    ],
};

export const USING_EXPECT_CASE9 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                '%0 = new @std/vector.h: vector<int>',
                '%1 = newarray (int[])[3]',
                '%1[0] = 1',
                '%1[1] = 2',
                '%1[2] = 3',
                'instanceinvoke %0.<@std/vector.h: vector.constructor()>(%1)',
                'v = %0',
                '%2 = v[0]',
                "staticinvoke <@%unk/%unk: .cout()>('[test_nested_alias_in_class] v[0] = ', %2)",
                'return'
            ],
            preds: [],
            succes: []
        },
    ],
};
