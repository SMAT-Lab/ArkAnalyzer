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

export const SUP_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @supplementary/supplementary.cpp: %dflt',
                '%0 = array (int[10])',
                '%0 = initArrayWith(0)',
                'a = %0',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const POST_AND = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @supplementary/supplementary.cpp: %dflt',
                'a = 0',
                '%0 = a',
                'a = a + 1',
                'b = %0',
                '%1 = a',
                'a = a + 1',
                'c = b + %1',
                'd = 0',
                '%2 = b',
                'b = b + 1',
                'd = %2',
                '%3 = c',
                'c = c + 1',
                '%4 = b',
                'b = b + 1',
                'd = %3 * %4',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < 4'], preds: [0, 8], succes: [8, 9] },
        { id: 2, stmts: ['if i < 4'], preds: [9, 10], succes: [10, 3] },
        {
            id: 3,
            stmts: ['%7 = a', 'a = a + 1', 'if %7 > 0'],
            preds: [2],
            succes: [4, 5],
        },
        { id: 4, stmts: ['b = 2'], preds: [3], succes: [5] },
        {
            id: 5,
            stmts: ['%8 = a', 'a = a + 1', 'if %8 > 0'],
            preds: [3, 4, 6],
            succes: [6, 7],
        },
        { id: 6, stmts: ['a = a - 1'], preds: [5], succes: [5] },
        {
            id: 7,
            stmts: ['a = a + 1', '%9 = a', 'a = a + 1', 'if %9 > 0'],
            preds: [5, 7],
            succes: [7, 11],
        },
        { id: 8, stmts: ['i = i + 1'], preds: [1], succes: [1] },
        { id: 9, stmts: ['i = 0', 'j = 1'], preds: [1], succes: [2] },
        {
            id: 10,
            stmts: ['%5 = i', 'i = i + 1', '%6 = j', 'j = j + 1'],
            preds: [2],
            succes: [2],
        },
        {
            id: 11,
            stmts: ['%10 = a', 'a = a + 1', 'if %10 > 0'],
            preds: [7],
            succes: [12, 13],
        },
        { id: 12, stmts: ['f = 1'], preds: [11], succes: [14] },
        { id: 13, stmts: ['f = 3'], preds: [11], succes: [14] },
        {
            id: 14,
            stmts: ['%12 = a', 'a = a + 1', 'if %12 != 0'],
            preds: [12, 13],
            succes: [15, 16],
        },
        { id: 15, stmts: ['e = %12'], preds: [14], succes: [17] },
        { id: 16, stmts: ['e = 3'], preds: [14], succes: [17] },
        {
            id: 17,
            stmts: [
                '%14 = array (int[10])',
                '%14 = initArrayWith(0)',
                'arr = %14',
                'idx = 1',
                '%15 = idx',
                'idx = idx + 1',
                'arr[%15] = 1',
                'return',
            ],
            preds: [15, 16],
            succes: [],
        },
    ],
};

export const DECLSTMT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @supplementary/supplementary.cpp: %dflt',
                'type @supplementary/supplementary.cpp: %dflt.DeclStmt()#myInt = int',
                'type @supplementary/supplementary.cpp: %dflt.DeclStmt()#A = int',
                'b = undefined',
                'b = 2',
                'a = b',
                'c = undefined',
                'd = 4',
                'x = 3',
                'i = 0',
                'j = 0',
            ],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < 5'], preds: [0, 2], succes: [2, 3] },
        {
            id: 2,
            stmts: ['j = j + 1', 'i = i + 1'],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};