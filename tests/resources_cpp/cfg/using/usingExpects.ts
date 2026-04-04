/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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
                '%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'[test_using_namespace] hello\')',
                'staticinvoke <@%unk/%unk: .operator<<()>(%0, endl)',
                'return',
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
                '%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'[test_using_declaration] hello\')',
                'staticinvoke <@%unk/%unk: .operator<<()>(%0, endl)',
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
                'c = @using/usingcase.cpp: Color.[static]RED',
                '%0 = @using/usingcase.cpp: Color.[static]RED',
                'if c == %0',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [
                'staticinvoke <@%unk/%unk: .operator<<()>(cout, \'[test_using_enum_member] Red\\n\')',
            ],
            preds: [0],
            succes: [2],
        },
        { id: 2, stmts: ['return'], preds: [1, 0], succes: [] },
    ],
};

export const USING_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                'v = staticinvoke <@using/usingcase.cpp: ns1.%dflt.Foo()>()',
                '%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'[test_namespace_using] v = \')',
                '%1 = staticinvoke <@%unk/%unk: .operator<<()>(%0, v)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%1, endl)',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const USING_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                '%0 = new @%unk/%unk: std::initializer_list<value_type>',
                '%1 = newarray (int[3])',
                '%1[0] = 1',
                '%1[1] = 2',
                '%1[2] = 3',
                'instanceinvoke %0.<@%unk/%unk: std::initializer_list.constructor()>(%1)',
                'return %0',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const USING_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                '%0 = new @%unk/%unk: std::map<float>',
                'instanceinvoke %0.<@%unk/%unk: std::map.constructor()>()',
                'm = %0',
                'm[1] = 3.14',
                '%1 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'[test_using_type_alias_template] m[1] = \')',
                '%2 = m[1]',
                '%3 = staticinvoke <@%unk/%unk: .operator<<()>(%1, %2)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%3, endl)',
                'return',
            ],
            preds: [],
            succes: [],
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
                '%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'[test_template_type_alias] x = \')',
                '%1 = staticinvoke <@%unk/%unk: .operator<<()>(%0, x)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%1, endl)',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const USING_EXPECT_CASE9 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                '%0 = new @%unk/%unk: std::vector<int>',
                '%1 = newarray (int[3])',
                '%1[0] = 1',
                '%1[1] = 2',
                '%1[2] = 3',
                'instanceinvoke %0.<@%unk/%unk: std::vector.constructor()>(%1)',
                'v = %0',
                '%2 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'[test_nested_alias_in_class] v[0] = \')',
                '%3 = v[0]',
                '%4 = staticinvoke <@%unk/%unk: .operator<<()>(%2, %3)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%4, endl)',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};
