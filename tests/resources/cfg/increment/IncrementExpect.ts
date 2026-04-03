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

export const INCREMENT_EXPECT_CASE1 = {
    blocks: [{
        id: 0,
        stmts: [
            'this = this: @increment/IncrementSample.ts: %dflt',
            'i = 0',
            '%0 = i',
            'i = i + 1',
            'j = %0',
            'i = i + 1',
            'j = i',
            'return j',
        ],
        preds: [
        ],
        succes: [
        ],
    },
    ],
};

export const INCREMENT_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @increment/IncrementSample.ts: %dflt',
                'i = 1',
                '%0 = i',
                'i = i + 1',
                'i = i + 1',
                '%1 = i * 2',
                'result = %0 + %1',
                'return result',
            ],
            preds: [
            ],
            succes: [
            ],
        },
    ],
};

export const INCREMENT_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @increment/IncrementSample.ts: %dflt',
                'i = 0',
                'i = i + 1',
                'if i > 1',
            ],
            preds: [
            ],
            succes: [
                1,
                2,
            ],
        },
        {
            id: 1,
            stmts: [
                '%0 = i',
                'i = i + 1',
                'j = %0',
            ],
            preds: [
                0,
            ],
            succes: [
            ],
        },
        {
            id: 2,
            stmts: [
                'i = i - 1',
                'j = i',
            ],
            preds: [
                0,
            ],
            succes: [
                3,
            ],
        },
        {
            id: 3,
            stmts: [
                'return j',
            ],
            preds: [
                2,
            ],
            succes: [
            ],
        },
    ],
};
export const INCREMENT_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @increment/IncrementSample.ts: %dflt',
                '%0 = newarray (number)[3]',
                '%0[0] = 1',
                '%0[1] = 2',
                '%0[2] = 3',
                'arr = %0',
                'i = 0',
                '%1 = i',
                'i = i + 1',
                'val = arr[%1]',
                'i = i + 1',
                'arr[i] = 4',
                'return val',
            ],
            preds: [
            ],
            succes: [
            ],
        },
    ],
};
export const INCREMENT_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @increment/IncrementSample.ts: %dflt',
                'i = 1',
                'i = i + 1',
                'result = staticinvoke <@%unk/%unk: .add()>(i)',
                'return result',
            ],
            preds: [
            ],
            succes: [
            ],
        },
    ],
};
export const INCREMENT_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @increment/IncrementSample.ts: %dflt',
                'i = 0',
                'i = i + 1',
                'if i > 0',
            ],
            preds: [
            ],
            succes: [
                1,
                2,
            ],
        },
        {
            id: 1,
            stmts: [
                'i = i + 1',
            ],
            preds: [
                0,
            ],
            succes: [
                4,
            ],
        },
        {
            id: 4,
            stmts: [
                'return i',
            ],
            preds: [
                1,
                2,
                3,
            ],
            succes: [
            ],
        },
        {
            id: 2,
            stmts: [
                '%0 = i',
                'i = i + 1',
                'if %0 != 0',
            ],
            preds: [
                0,
            ],
            succes: [
                3,
                4,
            ],
        },
        {
            id: 3,
            stmts: [
                'i = i + 1',
            ],
            preds: [
                2,
            ],
            succes: [
                4,
            ],
        },
    ],
};
export const INCREMENT_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @increment/IncrementSample.ts: %dflt',
                'i = 0',
            ],
            preds: [
            ],
            succes: [
                1,
            ],
        },
        {
            id: 1,
            stmts: [
                '%0 = i',
                'i = i + 1',
                'if %0 != 0',
            ],
            preds: [
                0,
                2,
            ],
            succes: [
                2,
                3,
            ],
        },
        {
            id: 2,
            stmts: [
                'i = i + 1',
                'if i != 0',
            ],
            preds: [
                1,
                2,
            ],
            succes: [
                2,
                1,
            ],
        },
        {
            id: 3,
            stmts: [
                'return i',
            ],
            preds: [
                1,
            ],
            succes: [
            ],
        },
    ],
};
export const INCREMENT_EXPECT_CASE8 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @increment/IncrementSample.ts: %dflt',
                'i = 0',
            ],
            preds: [
            ],
            succes: [
                1,
            ],
        },
        {
            id: 1,
            stmts: [
                'i = i + 1',
                'if i != 0',
            ],
            preds: [
                0,
                1,
                2,
            ],
            succes: [
                1,
                2,
            ],
        },
        {
            id: 2,
            stmts: [
                '%0 = i',
                'i = i + 1',
                'if %0 != 0',
            ],
            preds: [
                1,
            ],
            succes: [
                1,
                3,
            ],
        },
        {
            id: 3,
            stmts: [
                'return i',
            ],
            preds: [
                2,
            ],
            succes: [
            ],
        },
    ],
};
export const INCREMENT_EXPECT_CASE9 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @increment/IncrementSample.ts: %dflt',
                'sum = 0',
                'i = 0',
            ],
            preds: [
            ],
            succes: [
                1,
            ],
        },
        {
            id: 1,
            stmts: [
                '%0 = i',
                'i = i + 1',
                'if %0 != 0',
            ],
            preds: [
                0,
                4,
            ],
            succes: [
                2,
                3,
            ],
        },
        {
            id: 2,
            stmts: [
                'i = i + 1',
                'if i != 0',
            ],
            preds: [
                1,
                5,
            ],
            succes: [
                5,
                4,
            ],
        },
        {
            id: 5,
            stmts: [
                'i = i + 1',
            ],
            preds: [
                2,
            ],
            succes: [
                2,
            ],
        },
        {
            id: 4,
            stmts: [
                'i = i + 1',
            ],
            preds: [
                2,
            ],
            succes: [
                1,
            ],
        },
        {
            id: 3,
            stmts: [
                'return sum',
            ],
            preds: [
                1,
            ],
            succes: [
            ],
        },
    ],
};
export const INCREMENT_EXPECT_CASE10 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @increment/IncrementSample.ts: %dflt',
                'i = 0',
                'i = i + 1',
                'if i == 1',
            ],
            preds: [
            ],
            succes: [
                1,
                3,
            ],
        },
        {
            id: 1,
            stmts: [
                '%0 = i',
                'i = i + 1',
            ],
            preds: [
                0,
            ],
            succes: [
                2,
            ],
        },
        {
            id: 2,
            stmts: [
                'return i',
            ],
            preds: [
                1,
                3,
            ],
            succes: [
            ],
        },
        {
            id: 3,
            stmts: [
                'i = i + 1',
            ],
            preds: [
                0,
            ],
            succes: [
                2,
            ],
        },
    ],
};
export const INCREMENT_EXPECT_CASE11 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @increment/IncrementSample.ts: %dflt',
                'i = 3',
                '%0 = i',
                'i = i + 1',
                'i = i + 1',
                '%1 = instanceinvoke %0.<@%unk/%unk: .toString()>()',
                '%2 = instanceinvoke i.<@%unk/%unk: .toString()>()',
                '%3 = %1 + %2',
                'str = %3',
                'return str',
            ],
            preds: [
            ],
            succes: [
            ],
        },
    ],
};


