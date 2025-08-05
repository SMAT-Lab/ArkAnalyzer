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
                },
                {
                    id: 2,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(1)',
                    ],
                    preds: [1],
                    succes: [4],
                },
                {
                    id: 3,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(2)',
                    ],
                    preds: [1],
                    succes: [4],
                },
                {
                    id: 4,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(3)',
                    ],
                    preds: [2, 3],
                    succes: [9],
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
                },
                {
                    id: 6,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(5)',
                    ],
                    preds: [5],
                    succes: [8],
                },
                {
                    id: 7,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(6)',
                    ],
                    preds: [5],
                    succes: [8],
                },
                {
                    id: 8,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(7)',
                    ],
                    preds: [6, 7],
                    succes: [9],
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
                },
                {
                    id: 6,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(5)',
                    ],
                    preds: [5],
                    succes: [8],
                },
                {
                    id: 7,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(6)',
                    ],
                    preds: [5],
                    succes: [8],
                },
                {
                    id: 8,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(7)',
                    ],
                    preds: [6, 7],
                    succes: [9],
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
                },
                {
                    id: 15,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(9)',
                    ],
                    preds: [14],
                    succes: [17],
                },
                {
                    id: 16,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(10)',
                    ],
                    preds: [14],
                    succes: [17],
                },
                {
                    id: 17,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(11)',
                        'throw %0',

                    ],
                    preds: [15, 16],
                    succes: [],
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
                },
                {
                    id: 2,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'inner try\')',
                    ],
                    preds: [1],
                    succes: [4],
                },
                {
                    id: 4,
                    stmts: [
                        'instanceinvoke console.<@%unk/%unk: .log()>(\'inner finally\')',
                    ],
                    preds: [2, 3],
                    succes: [6],
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
                },
                {
                    id: 10,
                    stmts: [
                        'i = 3',
                    ],
                    preds: [9],
                    succes: [11],
                },
                {
                    id: 11,
                    stmts: [
                        'throw %1',
                    ],
                    preds: [9, 10],
                    succes: [],
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
                },
                {
                    id: 9,
                    stmts: [
                        'i = 3',
                    ],
                    preds: [8],
                    succes: [10],
                },
                {
                    id: 10,
                    stmts: [
                        'throw %0',
                    ],
                    preds: [8, 9],
                    succes: [],
                },
            ],
        },
    ],
};