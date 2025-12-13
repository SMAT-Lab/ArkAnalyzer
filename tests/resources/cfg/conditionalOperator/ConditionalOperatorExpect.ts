/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

export const CONDITIONAL_OPERATOR_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/ConditionalOperatorSample.ts: %dflt',
                'i = 0',
                'if i > 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [
                'j = i',
            ],
            preds: [0],
            succes: [3],
        },
        {
            id: 2,
            stmts: [
                'j = -i',
            ],
            preds: [0],
            succes: [3],
        },
        {
            id: 3,
            stmts: [
                'return j',
            ],
            preds: [1, 2],
            succes: [],
        },
    ],
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/ConditionalOperatorSample.ts: %dflt',
                'i = 0',
                'k = 0',
                'if i > 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [
                'k = i',
                'j = k',
            ],
            preds: [0],
            succes: [3],
        },
        {
            id: 2,
            stmts: [
                'j = -i',
            ],
            preds: [0],
            succes: [3],
        },
        {
            id: 3,
            stmts: [
                'return j',
            ],
            preds: [1, 2],
            succes: [],
        },
    ],
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/ConditionalOperatorSample.ts: %dflt',
                'i = 0',
                'if i < 0',
            ],
            preds: [],
            succes: [1, 4],
        },
        {
            id: 1,
            stmts: [
                '%0 = -1',
                'if i < %0',
            ],
            preds: [0],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                'j = 1',
            ],
            preds: [1],
            succes: [7],
        },
        {
            id: 3,
            stmts: [
                'j = 2',
            ],
            preds: [1],
            succes: [7],
        },
        {
            id: 4,
            stmts: [
                'if i > 1',
            ],
            preds: [0],
            succes: [5, 6],
        },
        {
            id: 5,
            stmts: [
                'j = 3',
            ],
            preds: [4],
            succes: [7],
        },
        {
            id: 6,
            stmts: [
                'j = 4',
            ],
            preds: [4],
            succes: [7],
        },
        {
            id: 7,
            stmts: [
                'return j',
            ],
            preds: [2, 3, 5, 6],
            succes: [],
        },
    ],
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/ConditionalOperatorSample.ts: %dflt',
                'i = 0',
                'if i < 0',
            ],
            preds: [],
            succes: [1, 5],
        },
        {
            id: 1,
            stmts: [
                '%0 = -1',
                'if i < %0',
            ],
            preds: [0],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%1 = 1',
            ],
            preds: [1],
            succes: [4],
        },
        {
            id: 3,
            stmts: [
                '%1 = 2',
            ],
            preds: [1],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                'j = %1 + 3',
            ],
            preds: [2, 3],
            succes: [6],
        },
        {
            id: 5,
            stmts: [
                'j = 4',
            ],
            preds: [0],
            succes: [6],
        },
        {
            id: 6,
            stmts: [
                'return j',
            ],
            preds: [4, 5],
            succes: [],
        },
    ],
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/ConditionalOperatorSample.ts: %dflt',
                'i = 0',
                'if i < 0',
            ],
            preds: [],
            succes: [1, 6],
        },
        {
            id: 1,
            stmts: [
                '%0 = -1',
                'if i < %0',
            ],
            preds: [0],
            succes: [2, 5],
        },
        {
            id: 2,
            stmts: [
                '%1 = -2',
                'if i < %1',
            ],
            preds: [1],
            succes: [3, 4],
        },
        {
            id: 3,
            stmts: [
                'j = 1',
            ],
            preds: [2],
            succes: [7],
        },
        {
            id: 4,
            stmts: [
                'j = 2',
            ],
            preds: [2],
            succes: [7],
        },
        {
            id: 5,
            stmts: [
                'j = 3',
            ],
            preds: [1],
            succes: [7],
        },
        {
            id: 6,
            stmts: [
                'j = 4',
            ],
            preds: [0],
            succes: [7],
        },
        {
            id: 7,
            stmts: [
                'return j',
            ],
            preds: [3, 4, 5, 6],
            succes: [],
        },
    ],
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/ConditionalOperatorSample.ts: %dflt',
                'i = 0',
                'if i > 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [
                'j = i',
            ],
            preds: [0],
            succes: [3],
        },
        {
            id: 2,
            stmts: [
                'j = -i',
            ],
            preds: [0],
            succes: [3],
        },
        {
            id: 3,
            stmts: [
                'if j > 0',
            ],
            preds: [1, 2],
            succes: [4, 5],
        },
        {
            id: 4,
            stmts: [
                'k = j',
            ],
            preds: [3],
            succes: [6],
        },
        {
            id: 5,
            stmts: [
                'k = -j',
            ],
            preds: [3],
            succes: [6],
        },
        {
            id: 6,
            stmts: [
                'return k',
            ],
            preds: [4, 5],
            succes: [],
        },
    ],
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/ConditionalOperatorSample.ts: %dflt',
                'i = 0',
                '%0 = -1',
                'if i > %0',
            ],
            preds: [],
            succes: [2, 1],
        },
        {
            id: 2,
            stmts: [
                'if i > 0',
            ],
            preds: [0],
            succes: [3, 4],
        },
        {
            id: 3,
            stmts: [
                'j = i',
            ],
            preds: [2],
            succes: [1],
        },
        {
            id: 4,
            stmts: [
                'j = -i',
            ],
            preds: [2],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'return',
            ],
            preds: [0, 3, 4],
            succes: [],
        },
    ],
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE8 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/ConditionalOperatorSample.ts: %dflt',
                'i = 0',
                'if i > 0',
            ],
            preds: [],
            succes: [3, 1],
        },
        {
            id: 3,
            stmts: [
                'if 1 != 0',
            ],
            preds: [0],
            succes: [4, 5],
        },
        {
            id: 4,
            stmts: [
                'i = 2',
            ],
            preds: [3],
            succes: [6],
        },
        {
            id: 5,
            stmts: [
                'i = 3',
            ],
            preds: [3],
            succes: [6],
        },
        {
            id: 6,
            stmts: [
                'i = 4',
            ],
            preds: [4, 5],
            succes: [2],
        },
        {
            id: 1,
            stmts: [
                'i = 5',
            ],
            preds: [0],
            succes: [2],
        },
        {
            id: 2,
            stmts: [
                'i = 6',
                'return',
            ],
            preds: [1, 6],
            succes: [],
        },
    ],
};