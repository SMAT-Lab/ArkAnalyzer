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

export const IF_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @if/ifSample.cpp: %dflt', 'i = g_num', 'j = undefined', 'if i > 0'],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['j = i'], preds: [0], succes: [3] },
        { id: 2, stmts: ['j = -i'], preds: [0], succes: [3] },
        { id: 3, stmts: ['return j'], preds: [1, 2], succes: [] },
    ],
};

export const IF_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @if/ifSample.cpp: %dflt', 'i = 0', 'k = 0', 'j = undefined', 'if i > 0'],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['k = i', 'j = k'], preds: [0], succes: [3] },
        { id: 2, stmts: ['j = -i'], preds: [0], succes: [3] },
        { id: 3, stmts: ['return j'], preds: [1, 2], succes: [] },
    ],
};

export const IF_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @if/ifSample.cpp: %dflt', 'i = 0', 'j = undefined', 'if i < 0'],
            preds: [],
            succes: [1, 4],
        },
        {
            id: 1,
            stmts: ['%0 = -1', 'if i < %0'],
            preds: [0],
            succes: [2, 3],
        },
        { id: 2, stmts: ['j = 1'], preds: [1], succes: [7] },
        { id: 3, stmts: ['j = 2'], preds: [1], succes: [7] },
        { id: 4, stmts: ['if i > 1'], preds: [0], succes: [5, 6] },
        { id: 5, stmts: ['j = 3'], preds: [4], succes: [7] },
        { id: 6, stmts: ['j = 4'], preds: [4], succes: [7] },
        { id: 7, stmts: ['return j'], preds: [2, 3, 5, 6], succes: [] },
    ],
};

export const IF_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @if/ifSample.cpp: %dflt', 'i = 0', 'j = undefined', 'if i < 0'],
            preds: [],
            succes: [1, 4],
        },
        {
            id: 1,
            stmts: ['%0 = -1', 'if i < %0'],
            preds: [0],
            succes: [2, 3],
        },
        { id: 2, stmts: ['j = 1 + 3'], preds: [1], succes: [5] },
        { id: 3, stmts: ['j = 2 + 3'], preds: [1], succes: [5] },
        { id: 4, stmts: ['j = 4'], preds: [0], succes: [5] },
        { id: 5, stmts: ['return j'], preds: [2, 3, 4], succes: [] },
    ],
};

export const IF_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @if/ifSample.cpp: %dflt', 'i = 0', 'j = undefined', 'if i < 0'],
            preds: [],
            succes: [1, 6],
        },
        {
            id: 1,
            stmts: ['%0 = -1', 'if i < %0'],
            preds: [0],
            succes: [2, 5],
        },
        {
            id: 2,
            stmts: ['%1 = -2', 'if i < %1'],
            preds: [1],
            succes: [3, 4],
        },
        { id: 3, stmts: ['j = 1'], preds: [2], succes: [7] },
        { id: 4, stmts: ['j = 2'], preds: [2], succes: [7] },
        { id: 5, stmts: ['j = 3'], preds: [1], succes: [7] },
        { id: 6, stmts: ['j = 4'], preds: [0], succes: [7] },
        { id: 7, stmts: ['return j'], preds: [3, 4, 5, 6], succes: [] },
    ],
};

export const IF_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @if/ifSample.cpp: %dflt', 'i = 0', 'j = undefined', 'if i > 0'],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['j = i'], preds: [0], succes: [3] },
        { id: 2, stmts: ['j = -i'], preds: [0], succes: [3] },
        {
            id: 3,
            stmts: ['k = undefined', 'if j > 0'],
            preds: [1, 2],
            succes: [4, 5],
        },
        { id: 4, stmts: ['k = j'], preds: [3], succes: [6] },
        { id: 5, stmts: ['k = -j'], preds: [3], succes: [6] },
        { id: 6, stmts: ['return k'], preds: [4, 5], succes: [] },
    ],
};

export const IF_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @if/ifSample.cpp: %dflt', 'i = 0', '%0 = -1', 'if i > %0'],
            preds: [],
            succes: [1, 4],
        },
        {
            id: 1,
            stmts: ['j = undefined', 'if i > 0'],
            preds: [0],
            succes: [2, 3],
        },
        { id: 2, stmts: ['j = i'], preds: [1], succes: [4] },
        { id: 3, stmts: ['j = -i'], preds: [1], succes: [4] },
        { id: 4, stmts: ['return'], preds: [0, 2, 3], succes: [] },
    ],
};

export const IF_EXPECT_CASE8 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @if/ifSample.cpp: %dflt',
                'a = 5',
                'b = 10',
                '%0 = a',
                'a = a + 1',
                '%1 = b > a',
                'if %1 != 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['return b'], preds: [0], succes: [] },
        { id: 2, stmts: ['return a'], preds: [0], succes: [] },
    ],
};

export const IF_EXPECT_CASE9 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'value = parameter0: T&',
                'this = this: @if/ifSample.cpp: %dflt',
                'if is_integral_v != 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [
                "%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, 'Integral: ')",
                'staticinvoke <@%unk/%unk: .operator<<()>(%0, endl)'
            ],
            preds: [0],
            succes: [5],
        },
        {
            id: 2,
            stmts: ['if is_floating_point_v != 0'],
            preds: [0],
            succes: [3, 4],
        },
        {
            id: 3,
            stmts: [
                "%1 = staticinvoke <@%unk/%unk: .operator<<()>(cout, 'Floating-point: ')",
                'staticinvoke <@%unk/%unk: .operator<<()>(%1, endl)'
            ],
            preds: [2],
            succes: [5],
        },
        {
            id: 4,
            stmts: [
                "%2 = staticinvoke <@%unk/%unk: .operator<<()>(cout, 'Other: ')",
                'staticinvoke <@%unk/%unk: .operator<<()>(%2, endl)'
            ],
            preds: [2],
            succes: [5],
        },
        { id: 5, stmts: ['return'], preds: [1, 3, 4], succes: [] },
    ],
};

export const IF_EXPECT_CASE10 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @if/ifSample.cpp: %dflt',
                'isReady = true',
                'hasPermission = false',
                'isEnabled = true',
                'isConnected = true',
                'if isReady != 0',
            ],
            preds: [],
            succes: [9, 8],
        },
        {
            id: 1,
            stmts: [
                '%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Condition met, execute operation\')',
                'staticinvoke <@%unk/%unk: .operator<<()>(%0, endl)',
            ],
            preds: [9, 10],
            succes: [3],
        },
        {
            id: 2,
            stmts: [
                '%1 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Conditions not met\')',
                'staticinvoke <@%unk/%unk: .operator<<()>(%1, endl)',
            ],
            preds: [8, 10],
            succes: [3],
        },
        {
            id: 3,
            stmts: ['a = 5', 'b = 10', 'c = 2', 'if b > a'],
            preds: [1, 2],
            succes: [4, 12],
        },
        { id: 4, stmts: ['return b'], preds: [3, 11, 12], succes: [] },
        { id: 5, stmts: ['if a < b'], preds: [11], succes: [13, 7] },
        { id: 6, stmts: ['return c'], preds: [13], succes: [] },
        { id: 7, stmts: ['return a'], preds: [5, 13], succes: [] },
        {
            id: 8,
            stmts: ['if isEnabled != 0'],
            preds: [0, 9],
            succes: [10, 2],
        },
        {
            id: 9,
            stmts: ['if hasPermission != 0'],
            preds: [0],
            succes: [1, 8],
        },
        {
            id: 10,
            stmts: ['if isConnected != 0'],
            preds: [8],
            succes: [1, 2],
        },
        { id: 11, stmts: ['if c > 0'], preds: [12], succes: [4, 5] },
        { id: 12, stmts: ['if b > c'], preds: [3], succes: [4, 11] },
        { id: 13, stmts: ['if a > c'], preds: [5], succes: [6, 7] },
    ],
};

export const IF_EXPECT_CASE11 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @if/ifSample.cpp: %dflt',
                'a = true',
                'b = false',
                'if a != 0',
            ],
            preds: [],
            succes: [1, 6],
        },
        {
            id: 1,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'The condition is true\')'],
            preds: [0, 6],
            succes: [3],
        },
        {
            id: 2,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'The condition is false\')'],
            preds: [6],
            succes: [3],
        },
        {
            id: 3,
            stmts: ['c = true', 'if b != 0'],
            preds: [1, 2],
            succes: [8, 7],
        },
        {
            id: 4,
            stmts: [
                '%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'This will be executed!\')',
                'staticinvoke <@%unk/%unk: .operator<<()>(%0, endl)',
            ],
            preds: [7, 8],
            succes: [5],
        },
        { id: 5, stmts: ['return'], preds: [4, 7], succes: [] },
        { id: 6, stmts: ['if b != 0'], preds: [0], succes: [1, 2] },
        { id: 7, stmts: ['if a != 0'], preds: [3, 8], succes: [4, 5] },
        { id: 8, stmts: ['if c != 0'], preds: [3], succes: [4, 7] },
    ],
};