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

export const GOTO_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @goto/gotoSample.cpp: %dflt', 'j = undefined', 'num = 1', 'if num > 0'],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['num = num - 1'], preds: [0], succes: [4] },
        { id: 2, stmts: ['num = num + 1'], preds: [0], succes: [3] },
        { id: 3, stmts: ['j = 1'], preds: [2], succes: [4] },
        { id: 4, stmts: ['return 0'], preds: [1, 3], succes: [] },
    ],
};

export const GOTO_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @goto/gotoSample.cpp: %dflt', 'j = undefined', 'num = 1', 'if num > 0'],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['return 0'], preds: [0, 3], succes: [] },
        { id: 2, stmts: ['num = num + 1'], preds: [0], succes: [3] },
        { id: 3, stmts: ['j = 1'], preds: [2], succes: [1] },
    ],
};

export const GOTO_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @goto/gotoSample.cpp: %dflt', 'j = undefined', 'num = 1', 'if num == 0'],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['return 0'], preds: [0, 2, 3, 5], succes: [] },
        { id: 2, stmts: ['if num == 1'], preds: [0], succes: [1, 3] },
        { id: 3, stmts: ['if num == 2'], preds: [2], succes: [1, 4] },
        { id: 4, stmts: ['num = num + 1'], preds: [3], succes: [5] },
        { id: 5, stmts: ['j = 1'], preds: [4], succes: [1] },
    ],
};

export const GOTO_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @goto/gotoSample.cpp: %dflt', 'j = undefined', 'num = 1', 'if num == 0'],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['j = j + 1'], preds: [0, 7], succes: [3] },
        { id: 2, stmts: ['if num == 1'], preds: [0], succes: [3, 4] },
        { id: 3, stmts: ['j = j - 1'], preds: [1, 2], succes: [5] },
        { id: 4, stmts: ['if num == 2'], preds: [2], succes: [5, 6] },
        { id: 5, stmts: ['return 0'], preds: [3, 4], succes: [] },
        { id: 6, stmts: ['num = num + 1'], preds: [4], succes: [7] },
        { id: 7, stmts: ['j = 1'], preds: [6], succes: [1] },
    ],
};

export const GOTO_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @goto/gotoSample.cpp: %dflt', 'i = 0', 'j = undefined', 'if i < 0'],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['j = 1'], preds: [0], succes: [3] },
        { id: 2, stmts: ['j = 2'], preds: [0], succes: [3] },
        { id: 3, stmts: ['return j'], preds: [1, 2], succes: [] },
    ],
};

export const GOTO_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @goto/gotoSample.cpp: %dflt', 'j = undefined', 'num = 1', 'if num > 0'],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['return 0'], preds: [0, 3], succes: [] },
        { id: 2, stmts: ['num = num + 1'], preds: [0], succes: [3] },
        { id: 3, stmts: ['j = 1'], preds: [2], succes: [1] },
    ],
};

export const GOTO_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @goto/gotoSample.cpp: %dflt', 'i = 0', 'j = undefined', 'if i < 0'],
            preds: [],
            succes: [1, 4],
        },
        {
            id: 1,
            stmts: ['if i < 1'],
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

export const GOTO_EXPECT_CASE8 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @goto/gotoSample.cpp: %dflt', 'a = 0', 'b = 1', 'if a == 2'],
            preds: [],
            succes: [2, 4],
        },
        { id: 1, stmts: ['return'], preds: [2, 3], succes: [] },
        { id: 2, stmts: ['b = 3'], preds: [0, 4], succes: [1] },
        { id: 3, stmts: ['b = 10'], preds: [4], succes: [1] },
        { id: 4, stmts: ['if a == 3'], preds: [0], succes: [2, 3] },
    ],
};

export const GOTO_EXPECT_CASE9 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @goto/gotoSample.cpp: %dflt', 'a = 0', 'b = 1', 'if a == 2'],
            preds: [],
            succes: [2, 4],
        },
        { id: 1, stmts: ['return'], preds: [2, 3], succes: [] },
        { id: 2, stmts: ['b = 3'], preds: [0, 4], succes: [1] },
        { id: 3, stmts: ['b = 10'], preds: [4], succes: [1] },
        { id: 4, stmts: ['if a == 3'], preds: [0], succes: [2, 3] },
    ],
};

export const GOTO_EXPECT_CASE10 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @goto/gotoSample.cpp: %dflt', 'a = 0', 'b = 1'],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if b < 10'], preds: [0, 4], succes: [2, 3] },
        {
            id: 2,
            stmts: ['a = a + 2', 'if a > 5'],
            preds: [1],
            succes: [3, 4],
        },
        { id: 3, stmts: ['return'], preds: [1, 2], succes: [] },
        {
            id: 4,
            stmts: ['a = a - 1', 'b = b + 1'],
            preds: [2],
            succes: [1],
        },
    ],
};
