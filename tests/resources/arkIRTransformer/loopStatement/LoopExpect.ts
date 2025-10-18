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

export const FOR_STATEMENT_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loopStatement/ForStatementSample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if true == true',

            ],
            preds: [0, 1],
            succes: [1, 2],
        },
        {
            id: 2,
            stmts: [
                'return',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const FOR_STATEMENT_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loopStatement/ForStatementSample.ts: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 10',

            ],
            preds: [0, 3],
            succes: [3, 2],
        },
        {
            id: 3,
            stmts: [
                'i = i + 1',

            ],
            preds: [1],
            succes: [1],
        },
        {
            id: 2,
            stmts: [
                'return',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const FOR_STATEMENT_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loopStatement/ForStatementSample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if true == true',

            ],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: .log()>(\'case3\')',

            ],
            preds: [1],
            succes: [1],
        },
        {
            id: 3,
            stmts: [
                'return',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const FOR_STATEMENT_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loopStatement/ForStatementSample.ts: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 10',

            ],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: .log()>(\'case4\')',
                'i = i + 1',

            ],
            preds: [1],
            succes: [1],
        },
        {
            id: 3,
            stmts: [
                'return',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const FOR_STATEMENT_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loopStatement/ForStatementSample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if true == true',

            ],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                'if true != false',

            ],
            preds: [1, 2],
            succes: [2, 1],
        },
        {
            id: 3,
            stmts: [
                'return',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const FOR_STATEMENT_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loopStatement/ForStatementSample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if true == true',

            ],
            preds: [0, 2],
            succes: [2, 4],
        },
        {
            id: 2,
            stmts: [
                'if true != false',

            ],
            preds: [1, 3],
            succes: [3, 1],
        },
        {
            id: 3,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: .log()>(\'case6\')',

            ],
            preds: [2],
            succes: [2],
        },
        {
            id: 4,
            stmts: [
                'return',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const FOR_STATEMENT_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loopStatement/ForStatementSample.ts: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 10',

            ],
            preds: [0, 5],
            succes: [2, 4],
        },
        {
            id: 2,
            stmts: [
                'if i === 5',

            ],
            preds: [1],
            succes: [3, 5],
        },
        {
            id: 3,
            stmts: [
                'return 42',

            ],
            preds: [2],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                'return 0',
            ],
            preds: [1],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                'i = i + 1',
            ],
            preds: [2],
            succes: [1],
        },
    ],
};