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

export const TEMPLATE_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'a = parameter0: T = int',
                'b = parameter1: T = int',
                'this = this: @template/template.cpp: %dflt',
                'if a > b',
            ],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['temp = a'], preds: [0], succes: [3] },
        { id: 2, stmts: ['temp = b'], preds: [0], succes: [3] },
        { id: 3, stmts: ['return temp'], preds: [1, 2], succes: [] },
    ],
};

export const TEMPLATE_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'a = parameter0: Q',
                'b = parameter1: Q',
                'this = this: @template/template.cpp: %dflt',
                'if a > b',
            ],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['temp = a'], preds: [0], succes: [3] },
        { id: 2, stmts: ['temp = b'], preds: [0], succes: [3] },
        { id: 3, stmts: ['return 2'], preds: [1, 2], succes: [] },
    ],
};

export const TEMPLATE_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'a = parameter0: T1',
                'b = parameter1: T2',
                'this = this: @template/template.cpp: %dflt',
                'staticinvoke <@%unk/%unk: .cout()>(\'First:\', a, \', Second\', b)',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};
export const TEMPLATE_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @template/template.cpp: %dflt', 'd = 2.718', '%0 = &d', 'staticinvoke <@%unk/%unk: .DestroyPtr()>(%0)', 'return 0'],
            preds: [],
            succes: [],
        },
    ],
};

export const TEMPLATE_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'args = parameter0: Args...',
                'this = this: @template/template.cpp: %dflt',
                'return CxxFolderExpr(args+...)',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const TEMPLATE_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @template/template.cpp: %dflt', 'z = staticinvoke <@%unk/%unk: .Sum()>(1, 2, 3, 4, 5, 6)', 'return 0'],
            preds: [],
            succes: [],
        },
    ],
};

export const TEMPLATE_MYCONTAINER_CLASS = {
    fields: ['data1', 'data2'],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'value1 = parameter0: T',
                        'value2 = parameter1: T',
                        'this = this: @template/template.cpp: MyContainer',
                        'instanceinvoke this.<@template/template.cpp: MyContainer.%instInit()>()',
                        'this.<@template/template.cpp: MyContainer.data1> = value1',
                        'this.<@template/template.cpp: MyContainer.data2> = value2',
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'print',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @template/template.cpp: MyContainer',
                        '%0 = this.<@template/template.cpp: MyContainer.data1>',
                        'staticinvoke <@%unk/%unk: .cout()>(%0)',
                        'return',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'sum',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @template/template.cpp: MyContainer',
                        '%0 = this.<@template/template.cpp: MyContainer.data1>',
                        '%1 = this.<@template/template.cpp: MyContainer.data2>',
                        '%2 = %0 + %1',
                        'return %2',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};

export const TEMPLATE_FIXEDARRAY_CLASS = {
    fields: [
        'data',
    ],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'size',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @template/template.cpp: FixedArray',
                        'return N',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};