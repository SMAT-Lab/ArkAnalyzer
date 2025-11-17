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

export const BINARY_CONDITIONAL_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'i = 0',
                'j = 0',
                'k = 1',
                '%0 = -i',
                'if %0 != 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['j = %0'], preds: [0], succes: [3] },
        { id: 2, stmts: ['j = k'], preds: [0], succes: [3] },
        { id: 3, stmts: ['return j'], preds: [1, 2], succes: [] },
    ],
};

export const BINARY_CONDITIONAL_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'c = 2',
                'if a > b',
            ],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['y = 1'], preds: [0], succes: [3] },
        { id: 2, stmts: ['y = c'], preds: [0], succes: [3] },
        { id: 3, stmts: ['return y'], preds: [1, 2], succes: [] },
    ],
};

export const BINARY_CONDITIONAL_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'x = 0',
                'y = 0',
                'x = x + 1',
                'if x != 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['y = x'], preds: [0], succes: [3] },
        { id: 2, stmts: ['y = 1'], preds: [0], succes: [3] },
        { id: 3, stmts: ['return y'], preds: [1, 2], succes: [] },
    ],
};

export const BINARY_CONDITIONAL_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'x = 0',
                'y = 0',
                '%0 = x',
                'x = x + 1',
                'if %0 != 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['y = %0'], preds: [0], succes: [3] },
        { id: 2, stmts: ['y = 1'], preds: [0], succes: [3] },
        { id: 3, stmts: ['return y'], preds: [1, 2], succes: [] },
    ],
};

export const BINARY_CONDITIONAL_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'i = 8',
                'if i < 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['j = 1'], preds: [0], succes: [6] },
        { id: 2, stmts: ['if i > 1'], preds: [0], succes: [3, 4] },
        { id: 3, stmts: ['%1 = 1'], preds: [2], succes: [5] },
        { id: 4, stmts: ['%1 = 0'], preds: [2], succes: [5] },
        { id: 5, stmts: ['j = %1'], preds: [3, 4], succes: [6] },
        { id: 6, stmts: ['return j'], preds: [1, 5], succes: [] },
    ],
};

export const BINARY_CONDITIONAL_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'i = 0',
                'j = 0',
                'k = 1',
                '%0 = i + j',
                '%1 = %0 + k',
                '%2 = %1 + 1',
                'if %2 != 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['j = %2'], preds: [0], succes: [3] },
        { id: 2, stmts: ['j = k'], preds: [0], succes: [3] },
        { id: 3, stmts: ['return j'], preds: [1, 2], succes: [] },
    ],
};
