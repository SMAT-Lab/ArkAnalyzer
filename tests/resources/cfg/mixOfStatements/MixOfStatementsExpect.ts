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

export const MIX_OF_STATEMENTS_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @mixOfStatements/MixOfStatementsSample.ts: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'i = i + 1',
            ],
            preds: [0],
            succes: [3],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'instanceinvoke console.<@%unk/%unk: .log()>(e)',
            ],
            preds: [],
            succes: [3],
        },
        {
            id: 3,
            stmts: [
                'if i != 0',
            ],
            preds: [1, 2],
            succes: [4, 5],
        },
        {
            id: 4,
            stmts: [
                'j = i',
            ],
            preds: [3],
            succes: [6],
        },
        {
            id: 5,
            stmts: [
                'j = 0',
            ],
            preds: [3],
            succes: [6],
        },
        {
            id: 6,
            stmts: [
                'return',
            ],
            preds: [4, 5],
            succes: [],
        },
    ],
};

export const MIX_OF_STATEMENTS_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @mixOfStatements/MixOfStatementsSample.ts: %dflt',
                'i = 1',
                'if i === 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [
                'return',
            ],
            preds: [0],
            succes: [],
        },
        {
            id: 2,
            stmts: [
                'i = i + 1',
            ],
            preds: [0],
            succes: [4],
        },
        {
            id: 3,
            stmts: [
                'e = caughtexception: unknown',
                'instanceinvoke console.<@%unk/%unk: .log()>(e)',
            ],
            preds: [],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                'return',
            ],
            preds: [2, 3],
            succes: [],
        },
    ],
};

export const MIX_OF_STATEMENTS_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @mixOfStatements/MixOfStatementsSample.ts: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'i = 1',
            ],
            preds: [0],
            succes: [3],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'instanceinvoke console.<@%unk/%unk: .log()>(\'outer catch\', e)',
            ],
            preds: [],
            succes: [3],
        },
        {
            id: 3,
            stmts: [
                'if i === 1',
            ],
            preds: [1, 2],
            succes: [4, 6],
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
                'e = caughtexception: unknown',
                'instanceinvoke console.<@%unk/%unk: .log()>(\'inner catch\', e)',
            ],
            preds: [],
            succes: [6],
        },
        {
            id: 6,
            stmts: [
                'return',
            ],
            preds: [3, 4, 5],
            succes: [],
        },
        {
            id: 7,
            stmts: [
                '%0 = caughtexception: unknown',
                'if i === 1',
            ],
            preds: [],
            succes: [8, 9],
        },
        {
            id: 8,
            stmts: [
                'i = 2',
            ],
            preds: [7],
            succes: [9],
        },
        {
            id: 9,
            stmts: [
                'throw %0',
            ],
            preds: [7, 8],
            succes: [],
        },
    ],
};

export const MIX_OF_STATEMENTS_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @mixOfStatements/MixOfStatementsSample.ts: %dflt',
                'i = 0',
                'j = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if j < 10',
            ],
            preds: [0, 6],
            succes: [2, 5],
        },
        {
            id: 2,
            stmts: [
                'i = i + 1',
                'if j === 5',
            ],
            preds: [1],
            succes: [6, 3],
        },
        {
            id: 3,
            stmts: [
                'i = i - 1',
            ],
            preds: [2],
            succes: [6],
        },
        {
            id: 4,
            stmts: [
                'e = caughtexception: unknown',
                'instanceinvoke console.<@%unk/%unk: .log()>(e)',
            ],
            preds: [],
            succes: [6],
        },
        {
            id: 5,
            stmts: [
                'return',
            ],
            preds: [1],
            succes: [],
        },
        {
            id: 6,
            stmts: [
                'j = j + 1',
            ],
            preds: [2, 3, 5, 4],
            succes: [1],
        },
    ],
};