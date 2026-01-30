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

export const THROW_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: ['a = parameter0: int', 'b = parameter1: int', 'this = this: @throw/throwSample.cpp: %dflt', 'if b == 0'],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [`throw 'Division by zero condition!'`],
            preds: [0],
            succes: [2],
        },
        {
            id: 2,
            stmts: ['%0 = a / b', 'return %0'],
            preds: [0, 1],
            succes: [],
        },
    ],
};

export const THROW_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @throw/throwSample.cpp: %dflt',
                'x = 50',
                'y = 0',
                'z = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['z = staticinvoke <@%unk/%unk: .Division()>(x, y)'],
            preds: [0],
            succes: [3],
            exceptionalPreds: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: ['msg = caughtexception: char*'],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
            exceptionalSucces: [],
        },
        { id: 3, stmts: ['return 0'], preds: [1, 2], succes: [] },
    ],
};

export const THROW_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @throw/throwSample.cpp: %dflt'],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'before throw\')',
                'staticinvoke <@%unk/%unk: .operator<<()>(%0, endl)',
                'throw 42',
                '%1 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'after throw\')',
                'staticinvoke <@%unk/%unk: .operator<<()>(%1, endl)',
            ],
            preds: [0],
            succes: [3],
            exceptionalPreds: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: int',
                '%2 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Caught exception: \')',
                '%3 = staticinvoke <@%unk/%unk: .operator<<()>(%2, e)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%3, endl)',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
            exceptionalSucces: [],
        },
        { id: 3, stmts: ['return'], preds: [1, 2], succes: [] },
    ],
};
