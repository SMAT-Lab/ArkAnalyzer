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

export const OPERATOR_EXPECT_RETURN = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @operators/cppOperators.cpp: %dflt', 'a = -1', 'a = a + 1', 'return a'],
            preds: [],
            succes: [],
        },
    ],
};

export const OPERATOR_EXPECT_NO_RETURN = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @operators/cppOperators.cpp: %dflt', 'b = -1', 'b = b - 1', 'return'],
            preds: [],
            succes: [],
        },
    ],
};

export const OPERATOR_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @operators/cppOperators.cpp: %dflt',
                '%0 = -1',
                'a = %0 + 1',
                'a = a + 1',
                'b = a - 0',
                'b = b + 1',
                'c = b * 1',
                'c = c + 1',
                'd = c / 1',
                'd = d - 1',
                'e = d % 2',
                'return e',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const OPERATOR_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @operators/cppOperators.cpp: %dflt', 'a = -1', 'b = 1', '%0 = a == b', '%1 = a > b', '%2 = %0 && %1', 'if %2 != 0'],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['a = a + b'], preds: [0], succes: [2] },
        {
            id: 2,
            stmts: ['%3 = a != b', '%4 = a < b', '%5 = %3 || %4', 'if %5 != 0'],
            preds: [0, 1],
            succes: [3, 4],
        },
        { id: 3, stmts: ['b = b + a'], preds: [2], succes: [4] },
        { id: 4, stmts: ['if a >= b'], preds: [2, 3], succes: [5, 6] },
        { id: 5, stmts: ['return a'], preds: [4], succes: [] },
        { id: 6, stmts: ['if a <= b'], preds: [4], succes: [7, 8] },
        { id: 7, stmts: ['return b'], preds: [6], succes: [] },
        {
            id: 8,
            stmts: ['%6 = a == b', '%7 = !%6', 'if %7 != 0'],
            preds: [6],
            succes: [9, 10],
        },
        { id: 9, stmts: ['%8 = -1', 'return %8'], preds: [8], succes: [] },
        { id: 10, stmts: ['return 0'], preds: [8], succes: [] },
    ],
};

export const OPERATOR_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @operators/cppOperators.cpp: %dflt',
                'a = -1',
                'a = a + 1',
                'a = a * 2',
                'a = a % 3',
                'a = a >> 4',
                'a = a ^ 5',
                'b = 1',
                'b = b - 1',
                'b = b / 2',
                'b = b << 3',
                'b = b & 4',
                'b = b | 5',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const OPERATOR_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @operators/cppOperators.cpp: %dflt',
                'a = 60',
                'b = 13',
                'c1 = a & b',
                'c2 = a | b',
                'c3 = a ^ b',
                'c4 = ~a',
                'c5 = a << 2',
                'c6 = a >> 2',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const OPERATOR_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @operators/cppOperators.cpp: %dflt',
                '%0 = new @operators/cppOperators.cpp: MyClass',
                "instanceinvoke %0.<@operators/cppOperators.cpp: MyClass.constructor(char, int)>('A', 2)",
                'aClass = %0',
                'age = instanceinvoke aClass.<@operators/cppOperators.cpp: MyClass.GetAge()>()',
                'j = sizeof(age)',
                'j = j + 1',
                '%1 = j + 1',
                '%2 = 2 + j',
                'i = %2',
                'staticinvoke <@%unk/%unk: .cout()>(i)',
                'return'
            ],
            preds: [],
            succes: [],
        },
    ],
};
