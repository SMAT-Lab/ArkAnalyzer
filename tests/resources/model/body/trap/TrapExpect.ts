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

export const TRAP_EXPECT_CASE1 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'try\')',
                    ],
                    preds: [0],
                    succes: [3],
                    exceptionalPreds: [],
                    exceptionalSucces: [2]
                },
            ],
            catchBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'catch\')',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [5]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'catch\')',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [5]
                },
            ],
            catchBlocks: [
                {
                    id: 5,
                    stmts: [
                        '%0 = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'finally\')',
                        'throw %0',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [2],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE2 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'try\')',
                    ],
                    preds: [0],
                    succes: [3],
                    exceptionalPreds: [],
                    exceptionalSucces: [2]
                },
            ],
            catchBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'catch\')',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE3 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'try\')',
                    ],
                    preds: [0],
                    succes: [2],
                    exceptionalPreds: [],
                    exceptionalSucces: [4]
                },
            ],
            catchBlocks: [
                {
                    id: 4,
                    stmts: [
                        '%0 = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'finally\')',
                        'throw %0',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [1],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE4 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'try\')',
                        'if 0 != 0',
                    ],
                    preds: [0],
                    succes: [2, 3],
                    exceptionalPreds: [],
                    exceptionalSucces: [2]
                },
                {
                    id: 2,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(1)',
                    ],
                    preds: [1],
                    succes: [4],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
                {
                    id: 3,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(2)',
                    ],
                    preds: [1],
                    succes: [4],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
                {
                    id: 4,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(3)',
                    ],
                    preds: [2, 3],
                    succes: [9],
                    exceptionalPreds: [],
                    exceptionalSucces: [5]
                },
            ],
            catchBlocks: [
                {
                    id: 5,
                    stmts: [
                        'e = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'catch\')',
                        'if 4 != 0',
                    ],
                    preds: [],
                    succes: [6, 7],
                    exceptionalPreds: [4],
                    exceptionalSucces: []
                },
                {
                    id: 6,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(5)',
                    ],
                    preds: [5],
                    succes: [8],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
                {
                    id: 7,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(6)',
                    ],
                    preds: [5],
                    succes: [8],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
                {
                    id: 8,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(7)',
                    ],
                    preds: [6, 7],
                    succes: [9],
                    exceptionalPreds: [],
                    exceptionalSucces: [14]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 5,
                    stmts: [
                        'e = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'catch\')',
                        'if 4 != 0',
                    ],
                    preds: [],
                    succes: [6, 7],
                    exceptionalPreds: [4],
                    exceptionalSucces: []
                },
                {
                    id: 6,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(5)',
                    ],
                    preds: [5],
                    succes: [8],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
                {
                    id: 7,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(6)',
                    ],
                    preds: [5],
                    succes: [8],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
                {
                    id: 8,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(7)',
                    ],
                    preds: [6, 7],
                    succes: [9],
                    exceptionalPreds: [],
                    exceptionalSucces: [14]
                },
            ],
            catchBlocks: [
                {
                    id: 14,
                    stmts: [
                        '%0 = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'finally\')',
                        'if 8 != 0',
                    ],
                    preds: [],
                    succes: [15, 16],
                    exceptionalPreds: [8],
                    exceptionalSucces: []
                },
                {
                    id: 15,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(9)',
                    ],
                    preds: [14],
                    succes: [17],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
                {
                    id: 16,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(10)',
                    ],
                    preds: [14],
                    succes: [17],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
                {
                    id: 17,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(11)',
                        'throw %0',

                    ],
                    preds: [15, 16],
                    succes: [],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE5 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'try\')',
                    ],
                    preds: [0],
                    succes: [3],
                    exceptionalPreds: [],
                    exceptionalSucces: [2]
                },
            ],
            catchBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'catch\')',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [5]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'catch\')',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [5]
                },
            ],
            catchBlocks: [
                {
                    id: 5,
                    stmts: [
                        '%0 = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'finally\')',
                        'throw %0',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [2],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE6 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'try\')',
                    ],
                    preds: [0],
                    succes: [2],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
                {
                    id: 2,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'inner try\')',
                    ],
                    preds: [1],
                    succes: [4],
                    exceptionalPreds: [],
                    exceptionalSucces: [3]
                },
                {
                    id: 4,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'inner finally\')',
                    ],
                    preds: [2, 3],
                    succes: [6],
                    exceptionalPreds: [],
                    exceptionalSucces: [5]
                },
            ],
            catchBlocks: [
                {
                    id: 5,
                    stmts: [
                        'e = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'catch\')',
                    ],
                    preds: [],
                    succes: [6],
                    exceptionalPreds: [4],
                    exceptionalSucces: [9]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 5,
                    stmts: [
                        'e = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'catch\')',
                    ],
                    preds: [],
                    succes: [6],
                    exceptionalPreds: [4],
                    exceptionalSucces: [9]
                },
            ],
            catchBlocks: [
                {
                    id: 9,
                    stmts: [
                        '%1 = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'finally\')',
                        'throw %1',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [5],
                    exceptionalSucces: []
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 2,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'inner try\')',
                    ],
                    preds: [1],
                    succes: [4],
                    exceptionalPreds: [],
                    exceptionalSucces: [3]
                },
            ],
            catchBlocks: [
                {
                    id: 3,
                    stmts: [
                        'innerE = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'inner catch\')',
                    ],
                    preds: [],
                    succes: [4],
                    exceptionalPreds: [2],
                    exceptionalSucces: [8]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 3,
                    stmts: [
                        'innerE = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'inner catch\')',
                    ],
                    preds: [],
                    succes: [4],
                    exceptionalPreds: [2],
                    exceptionalSucces: [8]
                },
            ],
            catchBlocks: [
                {
                    id: 8,
                    stmts: [
                        '%0 = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'inner finally\')',
                        'throw %0',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [3],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE7 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'i = 0',
                    ],
                    preds: [0],
                    succes: [3],
                    exceptionalPreds: [],
                    exceptionalSucces: [2]
                },
            ],
            catchBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                        'i = 1',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [9]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                        'i = 1',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [9]
                },
            ],
            catchBlocks: [
                {
                    id: 9,
                    stmts: [
                        '%1 = caughtexception: unknown',
                        'if i != 0',
                    ],
                    preds: [],
                    succes: [10, 11],
                    exceptionalPreds: [2],
                    exceptionalSucces: []
                },
                {
                    id: 10,
                    stmts: [
                        'i = 3',
                    ],
                    preds: [9],
                    succes: [11],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
                {
                    id: 11,
                    stmts: [
                        'throw %1',
                    ],
                    preds: [9, 10],
                    succes: [],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE8 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'i = 0',
                    ],
                    preds: [0],
                    succes: [3],
                    exceptionalPreds: [],
                    exceptionalSucces: [2]
                },
            ],
            catchBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                        'i = 1',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [8]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                        'i = 1',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [8]
                },
            ],
            catchBlocks: [
                {
                    id: 8,
                    stmts: [
                        '%0 = caughtexception: unknown',
                        'if i != 0',
                    ],
                    preds: [],
                    succes: [9, 10],
                    exceptionalPreds: [2],
                    exceptionalSucces: []
                },
                {
                    id: 9,
                    stmts: [
                        'i = 3',
                    ],
                    preds: [8],
                    succes: [10],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
                {
                    id: 10,
                    stmts: [
                        'throw %0',
                    ],
                    preds: [8, 9],
                    succes: [],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE13 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'result = true',
                    ],
                    preds: [0],
                    succes: [3],
                    exceptionalPreds: [],
                    exceptionalSucces: [2]
                },
            ],
            catchBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'catch\')',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [4]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'catch\')',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [4]
                },
            ],
            catchBlocks: [
                {
                    id: 4,
                    stmts: [
                        '%0 = caughtexception: unknown',
                        'return result',
                        'throw %0',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [2],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE14 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 3,
                    stmts: [
                        'i = 3',
                    ],
                    preds: [1, 2],
                    succes: [5],
                    exceptionalPreds: [],
                    exceptionalSucces: [4]
                },
            ],
            catchBlocks: [
                {
                    id: 4,
                    stmts: [
                        'innerE = caughtexception: unknown',
                        'i = 4',
                    ],
                    preds: [],
                    succes: [5],
                    exceptionalPreds: [3],
                    exceptionalSucces: [7]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 4,
                    stmts: [
                        'innerE = caughtexception: unknown',
                        'i = 4',
                    ],
                    preds: [],
                    succes: [5],
                    exceptionalPreds: [3],
                    exceptionalSucces: [7]
                },
            ],
            catchBlocks: [
                {
                    id: 7,
                    stmts: [
                        '%0 = caughtexception: unknown',
                        'i = 5',
                        'throw %0',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [4],
                    exceptionalSucces: []
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'i = 1',
                    ],
                    preds: [0],
                    succes: [3],
                    exceptionalPreds: [],
                    exceptionalSucces: [2]
                },
            ],
            catchBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                        'i = 2',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [8]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                        'i = 2',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [8]
                },
            ],
            catchBlocks: [
                {
                    id: 8,
                    stmts: [
                        '%1 = caughtexception: unknown',
                        'i = 3',
                    ],
                    preds: [],
                    succes: [9],
                    exceptionalPreds: [2],
                    exceptionalSucces: []
                },
                {
                    id: 9,
                    stmts: [
                        'i = 5',
                        'throw %1',
                    ],
                    preds: [8],
                    succes: [],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE15 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 3,
                    stmts: [
                        'i = 2',
                    ],
                    preds: [2],
                    succes: [5],
                    exceptionalPreds: [],
                    exceptionalSucces: [4]
                },
            ],
            catchBlocks: [
                {
                    id: 4,
                    stmts: [
                        'innerE = caughtexception: unknown',
                        'i = 3',
                    ],
                    preds: [],
                    succes: [5],
                    exceptionalPreds: [3],
                    exceptionalSucces: [8]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 4,
                    stmts: [
                        'innerE = caughtexception: unknown',
                        'i = 3',
                    ],
                    preds: [],
                    succes: [5],
                    exceptionalPreds: [3],
                    exceptionalSucces: [8]
                },
            ],
            catchBlocks: [
                {
                    id: 8,
                    stmts: [
                        '%0 = caughtexception: unknown',
                        'i = 4',
                        'throw %0',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [4],
                    exceptionalSucces: []
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'i = 1',
                    ],
                    preds: [0],
                    succes: [6],
                    exceptionalPreds: [],
                    exceptionalSucces: [2]
                },
            ],
            catchBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: []
                },
                {
                    id: 3,
                    stmts: [
                        'i = 2',
                    ],
                    preds: [2],
                    succes: [5],
                    exceptionalPreds: [],
                    exceptionalSucces: [4]
                },
                {
                    id: 5,
                    stmts: [
                        'i = 4',
                    ],
                    preds: [3, 4],
                    succes: [6],
                    exceptionalPreds: [],
                    exceptionalSucces: [9]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 2,
                    stmts: [
                        'e = caughtexception: unknown',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: []
                },
                {
                    id: 3,
                    stmts: [
                        'i = 2',
                    ],
                    preds: [2],
                    succes: [5],
                    exceptionalPreds: [],
                    exceptionalSucces: [4]
                },
                {
                    id: 5,
                    stmts: [
                        'i = 4',
                    ],
                    preds: [3, 4],
                    succes: [6],
                    exceptionalPreds: [],
                    exceptionalSucces: [9]
                },
            ],
            catchBlocks: [
                {
                    id: 9,
                    stmts: [
                        '%1 = caughtexception: unknown',
                        'i = 5',
                        'throw %1',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [5],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE16 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'i = 1',
                    ],
                    preds: [0],
                    succes: [3],
                    exceptionalPreds: [],
                    exceptionalSucces: [2]
                },
            ],
            catchBlocks: [
                {
                    id: 2,
                    stmts: [
                        'innerE = caughtexception: unknown',
                        'i = 2',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [7]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 2,
                    stmts: [
                        'innerE = caughtexception: unknown',
                        'i = 2',
                    ],
                    preds: [],
                    succes: [3],
                    exceptionalPreds: [1],
                    exceptionalSucces: [7]
                },
            ],
            catchBlocks: [
                {
                    id: 7,
                    stmts: [
                        '%0 = caughtexception: unknown',
                        'return i',
                        'throw %0',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [2],
                    exceptionalSucces: []
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'i = 1',
                    ],
                    preds: [0],
                    succes: [3],
                    exceptionalPreds: [],
                    exceptionalSucces: [2]
                },
                {
                    id: 3,
                    stmts: [
                        'return i',
                    ],
                    preds: [1, 2],
                    succes: [],
                    exceptionalPreds: [],
                    exceptionalSucces: [4]
                },
            ],
            catchBlocks: [
                {
                    id: 4,
                    stmts: [
                        'e = caughtexception: unknown',
                        'i = 3',
                    ],
                    preds: [],
                    succes: [5],
                    exceptionalPreds: [3],
                    exceptionalSucces: [8]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 4,
                    stmts: [
                        'e = caughtexception: unknown',
                        'i = 3',
                    ],
                    preds: [],
                    succes: [5],
                    exceptionalPreds: [3],
                    exceptionalSucces: [8]
                },
            ],
            catchBlocks: [
                {
                    id: 8,
                    stmts: [
                        '%1 = caughtexception: unknown',
                        'i = 4',
                        'throw %1',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [4],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE17 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'i = 1',
                    ],
                    preds: [0],
                    succes: [2],
                    exceptionalPreds: [],
                    exceptionalSucces: [3]
                },
            ],
            catchBlocks: [
                {
                    id: 3,
                    stmts: [
                        '%0 = caughtexception: unknown',
                        'return i',
                        'throw %0',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [1],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE18 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 4,
                    stmts: [
                    ],
                    preds: [0],
                    succes: [2],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
                {
                    id: 2,
                    stmts: [
                        'i = 2',
                    ],
                    preds: [0],
                    succes: [4],
                    exceptionalPreds: [],
                    exceptionalSucces: [3]
                },
            ],
            catchBlocks: [
                {
                    id: 3,
                    stmts: [
                        'e = caughtexception: unknown',
                        'i = 3',
                    ],
                    preds: [],
                    succes: [4],
                    exceptionalPreds: [2],
                    exceptionalSucces: [6]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 3,
                    stmts: [
                        'e = caughtexception: unknown',
                        'i = 3',
                    ],
                    preds: [],
                    succes: [4],
                    exceptionalPreds: [2],
                    exceptionalSucces: [6]
                },
            ],
            catchBlocks: [
                {
                    id: 6,
                    stmts: [
                        '%0 = caughtexception: unknown',
                        'i = 4',
                        'throw %0',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [3],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};

export const TRAP_EXPECT_CASE19 = {
    traps: [
        {
            tryBlocks: [
                {
                    id: 4,
                    stmts: [
                        'i = 4',
                    ],
                    preds: [2, 3],
                    succes: [6],
                    exceptionalPreds: [],
                    exceptionalSucces: [5]
                },
            ],
            catchBlocks: [
                {
                    id: 5,
                    stmts: [
                        'deepE = caughtexception: unknown',
                        'i = 5',
                    ],
                    preds: [],
                    succes: [6],
                    exceptionalPreds: [4],
                    exceptionalSucces: []
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 2,
                    stmts: [
                        'i = 2',
                    ],
                    preds: [1],
                    succes: [4],
                    exceptionalPreds: [],
                    exceptionalSucces: [3]
                },
            ],
            catchBlocks: [
                {
                    id: 3,
                    stmts: [
                        'innerE = caughtexception: unknown',
                        'i = 3',
                    ],
                    preds: [],
                    succes: [4],
                    exceptionalPreds: [2],
                    exceptionalSucces: [10]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 3,
                    stmts: [
                        'innerE = caughtexception: unknown',
                        'i = 3',
                    ],
                    preds: [],
                    succes: [4],
                    exceptionalPreds: [2],
                    exceptionalSucces: [10]
                },
            ],
            catchBlocks: [
                {
                    id: 10,
                    stmts: [
                        '%0 = caughtexception: unknown',
                        'i = 4',
                    ],
                    preds: [],
                    succes: [11],
                    exceptionalPreds: [3],
                    exceptionalSucces: []
                },
                {
                    id: 11,
                    stmts: [
                        'i = 6',
                        'throw %0',
                    ],
                    preds: [10],
                    succes: [],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 1,
                    stmts: [
                        'i = 1',
                    ],
                    preds: [0],
                    succes: [2],
                    exceptionalPreds: [],
                    exceptionalSucces: []
                },
                {
                    id: 2,
                    stmts: [
                        'i = 2',
                    ],
                    preds: [1],
                    succes: [4],
                    exceptionalPreds: [],
                    exceptionalSucces: [3]
                },
                {
                    id: 4,
                    stmts: [
                        'i = 4',
                    ],
                    preds: [2, 3],
                    succes: [6],
                    exceptionalPreds: [],
                    exceptionalSucces: [5]
                },
                {
                    id: 6,
                    stmts: [
                        'i = 6',
                    ],
                    preds: [4, 5],
                    succes: [8],
                    exceptionalPreds: [],
                    exceptionalSucces: [7]
                },
            ],
            catchBlocks: [
                {
                    id: 7,
                    stmts: [
                        'e = caughtexception: unknown',
                        'i = 7',
                    ],
                    preds: [],
                    succes: [8],
                    exceptionalPreds: [6],
                    exceptionalSucces: [12]
                },
            ],
        },
        {
            tryBlocks: [
                {
                    id: 7,
                    stmts: [
                        'e = caughtexception: unknown',
                        'i = 7',
                    ],
                    preds: [],
                    succes: [8],
                    exceptionalPreds: [6],
                    exceptionalSucces: [12]
                },
            ],
            catchBlocks: [
                {
                    id: 12,
                    stmts: [
                        '%1 = caughtexception: unknown',
                        'i = 8',
                        'throw %1',
                    ],
                    preds: [],
                    succes: [],
                    exceptionalPreds: [7],
                    exceptionalSucces: []
                },
            ],
        },
    ],
};
