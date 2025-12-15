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

export const WHILE_CONTINUE_EXPECT_MAIN = {
    blocks: [
        {
            id: 0,
            stmts: ['num = parameter0: int', 'this = this: @whileContinue/whileContinueSample.cpp: %dflt'],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['if num > 0'],
            preds: [0, 3, 4],
            succes: [2, 5],
        },
        { id: 2, stmts: ['if num == 2'], preds: [1], succes: [3, 4] },
        { id: 3, stmts: ['num = num + 1'], preds: [2], succes: [1] },
        { id: 4, stmts: ['num = num - 2'], preds: [2], succes: [1] },
        { id: 5, stmts: ['return 0'], preds: [1], succes: [] },
    ],
};

export const DO_WHILE_STMT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @whileContinue/whileContinueSample.cpp: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['i = i + 1', 'if i < 10'],
            preds: [0, 1],
            succes: [1, 2],
        },
        { id: 2, stmts: ['return'], preds: [1], succes: [] },
    ],
};

export const COMMA_EXPRESSION = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @whileContinue/whileContinueSample.cpp: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['i = i + 1', '%0 = i < 5', 'if %0 != 0'],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: ['staticinvoke <@%unk/%unk: .cout()>(\'i = \', i)'],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};

export const EMPTY_DO_WHILE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @whileContinue/whileContinueSample.cpp: %dflt',
                'count = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['count = count + 1', 'if count < 5'],
            preds: [0, 1],
            succes: [1, 2],
        },
        {
            id: 2,
            stmts: [
                'staticinvoke <@%unk/%unk: .cout()>(\'Final count: \', count)',
                'return',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const CONTINUE_DO_WHILE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @whileContinue/whileContinueSample.cpp: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['i = i + 1', '%0 = i % 2', 'if %0 == 0'],
            preds: [0, 2],
            succes: [2, 3],
        },
        { id: 2, stmts: ['if i < 5'], preds: [1, 3], succes: [1, 4] },
        {
            id: 3,
            stmts: [
                'staticinvoke <@%unk/%unk: .cout()>(\'After continue: \', i, \' (odd number)\')',
            ],
            preds: [1],
            succes: [2],
        },
        { id: 4, stmts: ['return'], preds: [2], succes: [] },
    ],
};

export const CONTINUE_WHILE_WITH_LOGICAL_OPERATORS = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @whileContinue/whileContinueSample.cpp: %dflt',
                'a = 0',
                'b = 10',
            ],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if a < 5'], preds: [0, 3, 4], succes: [7, 6] },
        {
            id: 2,
            stmts: [
                'staticinvoke <@%unk/%unk: .cout()>(\'a = \', a, \', b = \', b)',
                'if a < 5',
            ],
            preds: [7, 8],
            succes: [3, 4],
        },
        {
            id: 3,
            stmts: ['a = a + 1', 'b = b - 1'],
            preds: [2],
            succes: [1],
        },
        { id: 4, stmts: ['b = b + 1'], preds: [2], succes: [1] },
        { id: 5, stmts: ['return'], preds: [6, 8], succes: [] },
        { id: 6, stmts: ['if a >= 5'], preds: [1, 7], succes: [8, 5] },
        { id: 7, stmts: ['if b > 0'], preds: [1], succes: [2, 6] },
        { id: 8, stmts: ['if b < 20'], preds: [6], succes: [2, 5] },
    ],
};

export const CONTINUE_DO_WHILE_WITH_LOGICAL_OPERATORS = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @whileContinue/whileContinueSample.cpp: %dflt',
                'x = 0',
                'y = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'staticinvoke <@%unk/%unk: .cout()>(\'x = \', x, \', y = \', y)',
                'if x < 3',
            ],
            preds: [0, 6, 7],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: ['x = x + 1', 'if x < 5'],
            preds: [1, 3],
            succes: [6, 5],
        },
        { id: 3, stmts: ['y = y + 1'], preds: [1], succes: [2] },
        { id: 4, stmts: ['return'], preds: [5, 7], succes: [] },
        { id: 5, stmts: ['if x >= 5'], preds: [2, 6], succes: [7, 4] },
        { id: 6, stmts: ['if y < 2'], preds: [2], succes: [1, 5] },
        { id: 7, stmts: ['if y < 3'], preds: [5], succes: [1, 4] },
    ],
};