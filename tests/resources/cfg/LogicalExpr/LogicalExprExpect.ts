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

export const LOGICAL_EXPR_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @LogicalExpr/LogicalExprSample.ts: %dflt',
                'i = 0',
                'j = 0',
                'k = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 20',
            ],
            preds: [0, 6],
            succes: [9, 7],
        },
        {
            id: 2,
            stmts: [
                'if j < 10',
            ],
            preds: [9],
            succes: [8, 6],
        },
        {
            id: 3,
            stmts: [
                'if m < 5',
            ],
            preds: [8, 4],
            succes: [12, 11],
        },
        {
            id: 4,
            stmts: [
                'k = k + 1',
                'm = m + 1',
            ],
            preds: [11],
            succes: [3],
        },
        {
            id: 5,
            stmts: [
                'j = j + 1',
            ],
            preds: [11],
            succes: [6],
        },
        {
            id: 6,
            stmts: [
                'i = i + 1',
            ],
            preds: [2, 5],
            succes: [1],
        },
        {
            id: 7,
            stmts: [
                'return',
            ],
            preds: [1, 9],
            succes: [],
        },
        {
            id: 8,
            stmts: [
                'm = 0',
            ],
            preds: [2],
            succes: [3],
        },
        {
            id: 9,
            stmts: [
                'if i !== 7',
            ],
            preds: [1],
            succes: [2, 7],
        },
        {
            id: 10,
            stmts: [
                'k = k + 1',
                'm = m + 1',
            ],
            preds: [12],
            succes: [3],
        },
        {
            id: 11,
            stmts: [
                'if m === 9',
            ],
            preds: [3, 12],
            succes: [4, 5],
        },
        {
            id: 12,
            stmts: [
                'if m !== 2',
            ],
            preds: [3],
            succes: [10, 11],
        }
    ],
};

export const LOGICAL_EXPR_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @LogicalExpr/LogicalExprSample.ts: %dflt',
                'a = 0',
                'b = 0',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 15',
            ],
            preds: [5, 0],
            succes: [9, 8],
        },
        {
            id: 2,
            stmts: [
                'if b < 8',
            ],
            preds: [3, 4, 8],
            succes: [10, 4],
        },
        {
            id: 3,
            stmts: [
                'a = a + 1',
                'b = b + 1',
            ],
            preds: [10, 11],
            succes: [2],
        },
        {
            id: 4,
            stmts: [
                'if a < 50',
            ],
            preds: [2, 10, 7, 11],
            succes: [2, 5],
        },
        {
            id: 5,
            stmts: [
                'a = a + 1',
                'i = i + 1',
            ],
            preds: [4],
            succes: [1],
        },
        {
            id: 6,
            stmts: [
                'return',
            ],
            preds: [8],
            succes: [],
        },
        {
            id: 7,
            stmts: [
                'if b < 8',
            ],
            preds: [9],
            succes: [11, 4],
        },
        {
            id: 8,
            stmts: [
                'if i === 20',
            ],
            preds: [1, 9],
            succes: [2, 6],
        },
        {
            id: 9,
            stmts: [
                'if i !== 3',
            ],
            preds: [1],
            succes: [7, 8],
        },
        {
            id: 10,
            stmts: [
                'if b !== 4',
            ],
            preds: [2],
            succes: [3, 4],
        },
        {
            id: 11,
            stmts: [
                'if b !== 4',
            ],
            preds: [7],
            succes: [3, 4],
        }
    ],
};

export const LOGICAL_EXPR_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @LogicalExpr/LogicalExprSample.ts: %dflt',
                'x = 0',
                'y = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if x < 12',
            ],
            preds: [0, 4, 10],
            succes: [7, 5],
        },
        {
            id: 2,
            stmts: [
                'if i < 6',
            ],
            preds: [7, 3],
            succes: [8, 4],
        },
        {
            id: 3,
            stmts: [
                'y = y + 1',
                'i = i + 1',
            ],
            preds: [8],
            succes: [2],
        },
        {
            id: 4,
            stmts: [
                'x = x + 1',
            ],
            preds: [2, 8],
            succes: [1],
        },
        {
            id: 5,
            stmts: [
                'if x < 30',
            ],
            preds: [1],
            succes: [11, 10],
        },
        {
            id: 6,
            stmts: [
                'return',
            ],
            preds: [10],
            succes: [],
        },
        {
            id: 7,
            stmts: [
                'i = 0',
            ],
            preds: [1],
            succes: [2],
        },
        {
            id: 8,
            stmts: [
                'if i !== 2',
            ],
            preds: [2],
            succes: [3, 4],
        },
        {
            id: 9,
            stmts: [
                'if x < 12',
            ],
            preds: [11],
            succes: [7, 5],
        },
        {
            id: 10,
            stmts: [
                'if x === 40',
            ],
            preds: [5, 11],
            succes: [1, 6],
        },
        {
            id: 11,
            stmts: [
                'if x !== 10',
            ],
            preds: [5],
            succes: [9, 10],
        }
    ],
};

export const LOGICAL_EXPR_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @LogicalExpr/LogicalExprSample.ts: %dflt',
                'p = 0',
                'q = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if p < 8',
            ],
            preds: [0, 4],
            succes: [6, 7],
        },
        {
            id: 2,
            stmts: [
                'if q < 5',
            ],
            preds: [7],
            succes: [8, 4],
        },
        {
            id: 3,
            stmts: [
                'p = p + 1',
                'q = q + 1',
                'if q < 6',
            ],
            preds: [8, 10, 12],
            succes: [11, 10],
        },
        {
            id: 4,
            stmts: [
                'p = p + 1',
            ],
            preds: [2, 8, 10, 6, 12],
            succes: [1],
        },
        {
            id: 5,
            stmts: [
                'return',
            ],
            preds: [7],
            succes: [],
        },
        {
            id: 6,
            stmts: [
                'if q < 5',
            ],
            preds: [1],
            succes: [12, 4],
        },
        {
            id: 7,
            stmts: [
                'if p === 16',
            ],
            preds: [1],
            succes: [2, 5],
        },
        {
            id: 8,
            stmts: [
                'if p !== 1',
            ],
            preds: [2],
            succes: [3, 4],
        },
        {
            id: 9,
            stmts: [
                'p = p + 1',
                'q = q + 1',
                'if q < 6',
                'If(&&)1',
                'if q !== 2',
                'IfEnd1',
            ],
            preds: [11],
            succes: [],
        },
        {
            id: 10,
            stmts: [
                'if q === 12',
            ],
            preds: [3, 11],
            succes: [3, 4],
        },
        {
            id: 11,
            stmts: [
                'if q !== 2',
            ],
            preds: [3],
            succes: [9, 10],
        },
        {
            id: 12,
            stmts: [
                'if p !== 1',
            ],
            preds: [6],
            succes: [3, 4],
        }
    ],
};

export const LOGICAL_EXPR_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @LogicalExpr/LogicalExprSample.ts: %dflt',
                'm = 0',
                'n = 0',
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
            preds: [6, 0],
            succes: [2, 5],
        },
        {
            id: 2,
            stmts: [
                'if m < 12',
            ],
            preds: [1, 4],
            succes: [9, 8],
        },
        {
            id: 3,
            stmts: [
                'm = m + 1',
                'n = n + 1',
                'if n < 8',
            ],
            preds: [8, 10, 11],
            succes: [10, 4],
        },
        {
            id: 4,
            stmts: [
                'm = m + 1',
            ],
            preds: [3, 10, 7, 11],
            succes: [2],
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
                'i = i + 1',
            ],
            preds: [8],
            succes: [1],
        },
        {
            id: 7,
            stmts: [
                'm = m + 1',
                'n = n + 1',
                'if n < 8',
            ],
            preds: [9],
            succes: [11, 4],
        },
        {
            id: 8,
            stmts: [
                'if m === 18',
            ],
            preds: [2, 9],
            succes: [3, 6],
        },
        {
            id: 9,
            stmts: [
                'if m !== 5',
            ],
            preds: [2],
            succes: [7, 8],
        },
        {
            id: 10,
            stmts: [
                'if n !== 3',
            ],
            preds: [3],
            succes: [3, 4],
        },
        {
            id: 11,
            stmts: [
                'if n !== 3',
            ],
            preds: [7],
            succes: [3, 4],
        }
    ],
};

