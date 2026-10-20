/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

export const TRY_FINALLY_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'r = 1',
            ],
            preds: [0],
            succes: [2],
            exceptionalSucces: [4],
        },
        {
            id: 2,
            stmts: [
                'r = 2',
            ],
            preds: [1],
            succes: [3],
        },
        {
            id: 3,
            stmts: [
                'return r',
            ],
            preds: [2],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 2',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%1 = 1',
            ],
            preds: [0],
            succes: [3],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%0 = caughtexception: unknown',
                'return 2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                'return 2',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = staticinvoke <@%unk/%unk: .produce()>(1)',
            ],
            preds: [0],
            succes: [3],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%2 = caughtexception: unknown',
                '%1 = staticinvoke <@%unk/%unk: .produce()>(2)',
                'return %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                '%1 = staticinvoke <@%unk/%unk: .produce()>(2)',
                'return %1',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                '%2 = 1',
            ],
            preds: [],
            succes: [4],
            exceptionalPreds: [1],
            exceptionalSucces: [3],
        },
        {
            id: 3,
            stmts: [
                '%1 = caughtexception: unknown',
                'return 2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
        {
            id: 4,
            stmts: [
                'return 2',
            ],
            preds: [2],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 1',
            ],
            preds: [0],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                'r = 1',
            ],
            preds: [1],
            succes: [5],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                'return r',
            ],
            preds: [1, 5],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 2',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
        {
            id: 5,
            stmts: [
                'r = 2',
            ],
            preds: [2],
            succes: [3],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: .log()>(\'try\')',
                '%1 = undefined',
            ],
            preds: [0],
            succes: [6],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'instanceinvoke console.<@%unk/%unk: .log()>(\'catch\')',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
            exceptionalSucces: [5],
        },
        {
            id: 3,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: .log()>(\'finally\')',
            ],
            preds: [2],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: .log()>(\'last\')',
                'return',
            ],
            preds: [3],
            succes: [],
        },
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
        },
        {
            id: 6,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: .log()>(\'finally\')',
            ],
            preds: [1],
            succes: [7],
        },
        {
            id: 7,
            stmts: [
                'return %1',
            ],
            preds: [6],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%1 = 1',
            ],
            preds: [0],
            succes: [4],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                '%2 = 3',
            ],
            preds: [],
            succes: [5],
            exceptionalPreds: [1],
            exceptionalSucces: [3],
        },
        {
            id: 3,
            stmts: [
                '%0 = caughtexception: unknown',
                'return 2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
        {
            id: 4,
            stmts: [
                'return 2',
            ],
            preds: [1],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                'return 2',
            ],
            preds: [2],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE8 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%1 = caughtexception: unknown',
                'return 2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE9 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
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
            succes: [2],
            exceptionalSucces: [3],
        },
        {
            id: 2,
            stmts: [
                '%2 = i',
            ],
            preds: [1],
            succes: [5],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                '%0 = caughtexception: unknown',
                '%3 = i',
            ],
            preds: [],
            succes: [7],
            exceptionalPreds: [1],
            exceptionalSucces: [4],
        },
        {
            id: 4,
            stmts: [
                '%1 = caughtexception: unknown',
                'i = 4',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2, 3],
        },
        {
            id: 5,
            stmts: [
                'i = 4',
            ],
            preds: [2],
            succes: [6],
        },
        {
            id: 6,
            stmts: [
                'return %2',
            ],
            preds: [5],
            succes: [],
        },
        {
            id: 7,
            stmts: [
                'i = 4',
            ],
            preds: [3],
            succes: [8],
        },
        {
            id: 8,
            stmts: [
                'return %3',
            ],
            preds: [7],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE10 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 1',
            ],
            preds: [0, 6],
            succes: [2, 4],
        },
        {
            id: 2,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [1],
            succes: [],
            exceptionalSucces: [3],
        },
        {
            id: 3,
            stmts: [
                'e = caughtexception: unknown',
                'r = 1',
            ],
            preds: [],
            succes: [6],
            exceptionalPreds: [2],
            exceptionalSucces: [5],
        },
        {
            id: 4,
            stmts: [
                'return r',
            ],
            preds: [1],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
        },
        {
            id: 6,
            stmts: [
                'r = 2',
                'i = i + 1',
            ],
            preds: [3],
            succes: [1],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE11 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i === 0',
            ],
            preds: [0],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%2 = i',
            ],
            preds: [1],
            succes: [7],
            exceptionalSucces: [6],
        },
        {
            id: 3,
            stmts: [
                'i = 1',
            ],
            preds: [1],
            succes: [4],
            exceptionalSucces: [6],
        },
        {
            id: 4,
            stmts: [
                'i = i + 1',
            ],
            preds: [3],
            succes: [5],
        },
        {
            id: 5,
            stmts: [
                '%0 = i + 2',
                'return %0',
            ],
            preds: [4],
            succes: [],
        },
        {
            id: 6,
            stmts: [
                '%1 = caughtexception: unknown',
                'i = i + 1',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2, 3],
        },
        {
            id: 7,
            stmts: [
                'i = i + 1',
            ],
            preds: [2],
            succes: [8],
        },
        {
            id: 8,
            stmts: [
                'return %2',
            ],
            preds: [7],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE12 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i === 0',
            ],
            preds: [0],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: .log()>(\'inner try if\', i)',
                '%1 = 1',
            ],
            preds: [1],
            succes: [7],
            exceptionalSucces: [6],
        },
        {
            id: 3,
            stmts: [
                'i = 2',
                'instanceinvoke console.<@%unk/%unk: .log()>(\'inner try else\', i)',
            ],
            preds: [1],
            succes: [4],
            exceptionalSucces: [6],
        },
        {
            id: 4,
            stmts: [
                'i = i + 10',
                'instanceinvoke console.<@%unk/%unk: .log()>(\'inner finally\', i)',
            ],
            preds: [3],
            succes: [5],
        },
        {
            id: 5,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: .log()>(\'out try\', i)',
                '%3 = 3',
            ],
            preds: [4],
            succes: [11],
            exceptionalSucces: [8],
        },
        {
            id: 6,
            stmts: [
                '%0 = caughtexception: unknown',
                'i = i + 10',
                'instanceinvoke console.<@%unk/%unk: .log()>(\'inner finally\', i)',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2, 3],
            exceptionalSucces: [8],
        },
        {
            id: 7,
            stmts: [
                'i = i + 10',
                'instanceinvoke console.<@%unk/%unk: .log()>(\'inner finally\', i)',
            ],
            preds: [2],
            succes: [9],
        },
        {
            id: 8,
            stmts: [
                '%2 = caughtexception: unknown',
                'i = i + 100',
                'instanceinvoke console.<@%unk/%unk: .log()>(\'out finally\', i)',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [6, 5],
        },
        {
            id: 9,
            stmts: [
                'i = i + 100',
                'instanceinvoke console.<@%unk/%unk: .log()>(\'out finally\', i)',
            ],
            preds: [7],
            succes: [10],
        },
        {
            id: 10,
            stmts: [
                'return %1',
            ],
            preds: [9],
            succes: [],
        },
        {
            id: 11,
            stmts: [
                'i = i + 100',
                'instanceinvoke console.<@%unk/%unk: .log()>(\'out finally\', i)',
            ],
            preds: [5],
            succes: [12],
        },
        {
            id: 12,
            stmts: [
                'return %3',
            ],
            preds: [11],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE13 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i === 0',
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
            succes: [5],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                '%2 = 2',
            ],
            preds: [1],
            succes: [7],
            exceptionalSucces: [4],
        },
        {
            id: 4,
            stmts: [
                '%0 = caughtexception: unknown',
                'i = i + 10',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2, 3],
        },
        {
            id: 5,
            stmts: [
                'i = i + 10',
            ],
            preds: [2],
            succes: [6],
        },
        {
            id: 6,
            stmts: [
                'return %1',
            ],
            preds: [5],
            succes: [],
        },
        {
            id: 7,
            stmts: [
                'i = i + 10',
            ],
            preds: [3],
            succes: [8],
        },
        {
            id: 8,
            stmts: [
                'return %2',
            ],
            preds: [7],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE14 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%1 = 1',
            ],
            preds: [0],
            succes: [6],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%0 = caughtexception: unknown',
                'if i === 0',
            ],
            preds: [],
            succes: [3, 4],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                'i = 2',
            ],
            preds: [2],
            succes: [5],
        },
        {
            id: 4,
            stmts: [
                'i = 3',
            ],
            preds: [2],
            succes: [5],
        },
        {
            id: 5,
            stmts: [
                'throw %0',
            ],
            preds: [3, 4],
            succes: [],
        },
        {
            id: 6,
            stmts: [
                'if i === 0',
            ],
            preds: [1],
            succes: [7, 8],
        },
        {
            id: 7,
            stmts: [
                'i = 2',
            ],
            preds: [6],
            succes: [9],
        },
        {
            id: 8,
            stmts: [
                'i = 3',
            ],
            preds: [6],
            succes: [9],
        },
        {
            id: 9,
            stmts: [
                'return %1',
            ],
            preds: [7, 8],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE15 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = i',
                'i = i + 1',
            ],
            preds: [0],
            succes: [3],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%1 = caughtexception: unknown',
                'i = i + 10',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                'i = i + 10',
            ],
            preds: [1],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                'return %0',
            ],
            preds: [3],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE16 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'r = 1',
            ],
            preds: [0],
            succes: [3],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                '%1 = 3',
            ],
            preds: [],
            succes: [6],
            exceptionalPreds: [1],
            exceptionalSucces: [5],
        },
        {
            id: 3,
            stmts: [
                'r = 2',
            ],
            preds: [1],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                'return r',
            ],
            preds: [3],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 2',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
        {
            id: 6,
            stmts: [
                'r = 2',
            ],
            preds: [2],
            succes: [7],
        },
        {
            id: 7,
            stmts: [
                'return %1',
            ],
            preds: [6],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE17 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%1 = 1',
            ],
            preds: [0],
            succes: [5],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%0 = caughtexception: unknown',
                'if i === 0',
            ],
            preds: [],
            succes: [3, 4],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                'return 2',
            ],
            preds: [2],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                'i = 3',
                'throw %0',
            ],
            preds: [2],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                'if i === 0',
            ],
            preds: [1],
            succes: [6, 7],
        },
        {
            id: 6,
            stmts: [
                'return 2',
            ],
            preds: [5],
            succes: [],
        },
        {
            id: 7,
            stmts: [
                'i = 3',
            ],
            preds: [5],
            succes: [8],
        },
        {
            id: 8,
            stmts: [
                'return %1',
            ],
            preds: [7],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE18 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'r = 1',
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'throw e',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [3],
        },
        {
            id: 3,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE19 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%2 = 1',
            ],
            preds: [0],
            succes: [3],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%1 = caughtexception: unknown',
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE20 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'r = 1',
            ],
            preds: [0],
            succes: [2],
            exceptionalSucces: [6],
        },
        {
            id: 2,
            stmts: [
                'r = 2',
            ],
            preds: [1],
            succes: [3],
        },
        {
            id: 3,
            stmts: [
                'r = 3',
            ],
            preds: [2],
            succes: [4],
            exceptionalSucces: [7],
        },
        {
            id: 4,
            stmts: [
                'r = 4',
            ],
            preds: [3],
            succes: [5],
        },
        {
            id: 5,
            stmts: [
                'return r',
            ],
            preds: [4],
            succes: [],
        },
        {
            id: 6,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 2',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [7],
        },
        {
            id: 7,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 4',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [6, 3],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE21 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%1 = 1',
            ],
            preds: [0],
            succes: [4],
            exceptionalSucces: [3],
        },
        {
            id: 2,
            stmts: [
                'return',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 3,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 2',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [5],
        },
        {
            id: 4,
            stmts: [
                'r = 2',
            ],
            preds: [1],
            succes: [6],
        },
        {
            id: 5,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 3',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
        },
        {
            id: 6,
            stmts: [
                'r = 3',
            ],
            preds: [4],
            succes: [7],
        },
        {
            id: 7,
            stmts: [
                'return %1',
            ],
            preds: [6],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE22 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%1 = 1',
            ],
            preds: [0],
            succes: [3],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%0 = caughtexception: unknown',
                '%4 = 2',
            ],
            preds: [],
            succes: [6],
            exceptionalPreds: [1],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                '%3 = 2',
            ],
            preds: [1],
            succes: [5],
            exceptionalSucces: [4],
        },
        {
            id: 4,
            stmts: [
                '%2 = caughtexception: unknown',
                'return 3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3, 2],
        },
        {
            id: 5,
            stmts: [
                'return 3',
            ],
            preds: [3],
            succes: [],
        },
        {
            id: 6,
            stmts: [
                'return 3',
            ],
            preds: [2],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE23 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%2 = 1',
            ],
            preds: [0],
            succes: [3],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%1 = caughtexception: unknown',
                '%5 = 2',
            ],
            preds: [],
            succes: [6],
            exceptionalPreds: [1],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                '%4 = 2',
            ],
            preds: [1],
            succes: [5],
            exceptionalSucces: [4],
        },
        {
            id: 4,
            stmts: [
                '%3 = caughtexception: unknown',
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3, 2],
        },
        {
            id: 5,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [3],
            succes: [],
        },
        {
            id: 6,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [2],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE24 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%2 = 1',
            ],
            preds: [0],
            succes: [6],
            exceptionalSucces: [5],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'r = 2',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [6, 5],
            exceptionalSucces: [7],
        },
        {
            id: 3,
            stmts: [
                'r = 3',
            ],
            preds: [2],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                'return r',
            ],
            preds: [3],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                '%1 = caughtexception: unknown',
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [2],
        },
        {
            id: 6,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [1],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 7,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 3',
                'throw %3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE25 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [5],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'r = 2',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [5],
            exceptionalSucces: [6],
        },
        {
            id: 3,
            stmts: [
                'r = 3',
            ],
            preds: [2],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                'return r',
            ],
            preds: [3],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 1',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [2],
        },
        {
            id: 6,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 3',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE26 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'r = 1',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
            exceptionalSucces: [5],
        },
        {
            id: 3,
            stmts: [
                'r = 2',
            ],
            preds: [2],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                '%3 = 3',
            ],
            preds: [3],
            succes: [7],
            exceptionalSucces: [6],
        },
        {
            id: 5,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
            exceptionalSucces: [6],
        },
        {
            id: 6,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 4',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [5, 4],
        },
        {
            id: 7,
            stmts: [
                'r = 4',
            ],
            preds: [4],
            succes: [8],
        },
        {
            id: 8,
            stmts: [
                'return %3',
            ],
            preds: [7],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE27 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                '%2 = 1',
            ],
            preds: [],
            succes: [5],
            exceptionalPreds: [1],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                'return',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
            exceptionalSucces: [6],
        },
        {
            id: 5,
            stmts: [
                'r = 2',
            ],
            preds: [2],
            succes: [7],
        },
        {
            id: 6,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 3',
                'throw %3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [4],
        },
        {
            id: 7,
            stmts: [
                'r = 3',
            ],
            preds: [5],
            succes: [8],
        },
        {
            id: 8,
            stmts: [
                'return %2',
            ],
            preds: [7],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE28 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'throw e',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [6],
        },
        {
            id: 3,
            stmts: [
                'e2 = caughtexception: unknown',
                'r = 2',
            ],
            preds: [],
            succes: [4],
            exceptionalPreds: [6],
            exceptionalSucces: [7],
        },
        {
            id: 4,
            stmts: [
                'r = 3',
            ],
            preds: [3],
            succes: [5],
        },
        {
            id: 5,
            stmts: [
                'return r',
            ],
            preds: [4],
            succes: [],
        },
        {
            id: 6,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 1',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
            exceptionalSucces: [3],
        },
        {
            id: 7,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 3',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE29 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'throw e',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                'return r',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 1',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
            exceptionalSucces: [5],
        },
        {
            id: 5,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 2',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [4],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE30 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'i = 0',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i === 0',
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
            succes: [6],
            exceptionalSucces: [5],
        },
        {
            id: 3,
            stmts: [
                '%2 = 2',
            ],
            preds: [1],
            succes: [7],
            exceptionalSucces: [5],
        },
        {
            id: 4,
            stmts: [
                'return',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 3',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2, 3],
            exceptionalSucces: [8],
        },
        {
            id: 6,
            stmts: [
                'r = 3',
            ],
            preds: [2],
            succes: [9],
        },
        {
            id: 7,
            stmts: [
                'r = 3',
            ],
            preds: [3],
            succes: [11],
        },
        {
            id: 8,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 4',
                'throw %3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [5],
        },
        {
            id: 9,
            stmts: [
                'r = 4',
            ],
            preds: [6],
            succes: [10],
        },
        {
            id: 10,
            stmts: [
                'return %1',
            ],
            preds: [9],
            succes: [],
        },
        {
            id: 11,
            stmts: [
                'r = 4',
            ],
            preds: [7],
            succes: [12],
        },
        {
            id: 12,
            stmts: [
                'return %2',
            ],
            preds: [11],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE31 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = staticinvoke <@%unk/%unk: .produce()>(1)',
            ],
            preds: [0],
            succes: [4],
            exceptionalSucces: [3],
        },
        {
            id: 2,
            stmts: [
                'return',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 3,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [5],
        },
        {
            id: 4,
            stmts: [
                'r = 2',
            ],
            preds: [1],
            succes: [6],
        },
        {
            id: 5,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 3',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
        },
        {
            id: 6,
            stmts: [
                'r = 3',
            ],
            preds: [4],
            succes: [7],
        },
        {
            id: 7,
            stmts: [
                'return %0',
            ],
            preds: [6],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE32 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%1 = 1',
            ],
            preds: [0],
            succes: [3],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 2',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                'r = 2',
            ],
            preds: [1],
            succes: [5],
        },
        {
            id: 4,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 3',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
            exceptionalSucces: [6],
        },
        {
            id: 5,
            stmts: [
                'r = 3',
            ],
            preds: [3],
            succes: [7],
        },
        {
            id: 6,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 4',
                'throw %3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [4],
        },
        {
            id: 7,
            stmts: [
                'r = 4',
            ],
            preds: [5],
            succes: [8],
        },
        {
            id: 8,
            stmts: [
                'return %1',
            ],
            preds: [7],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE33 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%1 = 1',
            ],
            preds: [0],
            succes: [3],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 2',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                'r = 2',
            ],
            preds: [1],
            succes: [5],
        },
        {
            id: 4,
            stmts: [
                '%2 = caughtexception: unknown',
                '%5 = 3',
            ],
            preds: [],
            succes: [9],
            exceptionalPreds: [2],
            exceptionalSucces: [6],
        },
        {
            id: 5,
            stmts: [
                '%4 = 3',
            ],
            preds: [3],
            succes: [7],
            exceptionalSucces: [6],
        },
        {
            id: 6,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 4',
                'throw %3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [5, 4],
        },
        {
            id: 7,
            stmts: [
                'r = 4',
            ],
            preds: [5],
            succes: [8],
        },
        {
            id: 8,
            stmts: [
                'return %4',
            ],
            preds: [7],
            succes: [],
        },
        {
            id: 9,
            stmts: [
                'r = 4',
            ],
            preds: [4],
            succes: [10],
        },
        {
            id: 10,
            stmts: [
                'return %5',
            ],
            preds: [9],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE34 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'r = 1',
            ],
            preds: [0],
            succes: [2],
            exceptionalSucces: [5],
        },
        {
            id: 2,
            stmts: [
                'r = 2',
            ],
            preds: [1],
            succes: [3],
        },
        {
            id: 3,
            stmts: [
                '%2 = 3',
            ],
            preds: [2],
            succes: [7],
            exceptionalSucces: [6],
        },
        {
            id: 4,
            stmts: [
                'return',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 2',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [8],
        },
        {
            id: 6,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 4',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
            exceptionalSucces: [8],
        },
        {
            id: 7,
            stmts: [
                'r = 4',
            ],
            preds: [3],
            succes: [9],
        },
        {
            id: 8,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 5',
                'throw %3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [5, 6],
        },
        {
            id: 9,
            stmts: [
                'r = 5',
            ],
            preds: [7],
            succes: [10],
        },
        {
            id: 10,
            stmts: [
                'return %2',
            ],
            preds: [9],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE35 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'r = 1',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                '%2 = 2',
            ],
            preds: [2],
            succes: [5],
            exceptionalSucces: [4],
        },
        {
            id: 4,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 3',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
        },
        {
            id: 5,
            stmts: [
                'r = 3',
            ],
            preds: [3],
            succes: [6],
        },
        {
            id: 6,
            stmts: [
                'return %2',
            ],
            preds: [5],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE36 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'r = 1',
            ],
            preds: [0],
            succes: [3],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'r = 2',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
            exceptionalSucces: [5],
        },
        {
            id: 3,
            stmts: [
                'r = 3',
            ],
            preds: [1, 2],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                'return r',
            ],
            preds: [3],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 3',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE37 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 1',
            ],
            preds: [0],
            succes: [4, 2],
        },
        {
            id: 2,
            stmts: [
                'return r',
            ],
            preds: [1, 6],
            succes: [],
        },
        {
            id: 3,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 1',
                'throw %0',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                'r = 1',
            ],
            preds: [1],
            succes: [6],
            exceptionalSucces: [5],
        },
        {
            id: 5,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [4],
        },
        {
            id: 6,
            stmts: [
                'r = 2',
            ],
            preds: [4],
            succes: [2],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE38 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 1',
            ],
            preds: [0, 7],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                'i = 1',
            ],
            preds: [1],
            succes: [5],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                'return r',
            ],
            preds: [1],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 1',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
            exceptionalSucces: [6],
        },
        {
            id: 5,
            stmts: [
                'r = 1',
            ],
            preds: [2],
            succes: [7],
            exceptionalSucces: [6],
        },
        {
            id: 6,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [5, 4],
        },
        {
            id: 7,
            stmts: [
                'r = 2',
            ],
            preds: [5],
            succes: [1],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE39 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 1',
            ],
            preds: [0],
            succes: [2, 4],
        },
        {
            id: 2,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [1],
            succes: [],
            exceptionalSucces: [3],
        },
        {
            id: 3,
            stmts: [
                'e = caughtexception: unknown',
            ],
            preds: [],
            succes: [6],
            exceptionalPreds: [2],
            exceptionalSucces: [5],
        },
        {
            id: 4,
            stmts: [
                'return r',
            ],
            preds: [1, 8],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 1',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
            exceptionalSucces: [7],
        },
        {
            id: 6,
            stmts: [
                'r = 1',
            ],
            preds: [3],
            succes: [8],
            exceptionalSucces: [7],
        },
        {
            id: 7,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 2',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [6, 5],
        },
        {
            id: 8,
            stmts: [
                'r = 2',
            ],
            preds: [6],
            succes: [4],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE40 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 2',
            ],
            preds: [0, 7, 8],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%1 = 1',
            ],
            preds: [1],
            succes: [5],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                'return r',
            ],
            preds: [1],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                '%0 = caughtexception: unknown',
                'i = 2',
            ],
            preds: [],
            succes: [8],
            exceptionalPreds: [2],
            exceptionalSucces: [6],
        },
        {
            id: 5,
            stmts: [
                'i = 2',
            ],
            preds: [2],
            succes: [7],
            exceptionalSucces: [6],
        },
        {
            id: 6,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 3',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [5, 4],
        },
        {
            id: 7,
            stmts: [
                'r = 3',
            ],
            preds: [5],
            succes: [1],
        },
        {
            id: 8,
            stmts: [
                'r = 3',
            ],
            preds: [4],
            succes: [1],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE41 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 1',
            ],
            preds: [0],
            succes: [6, 2],
        },
        {
            id: 2,
            stmts: [
                'r = 2',
            ],
            preds: [1, 6],
            succes: [3],
            exceptionalSucces: [7],
        },
        {
            id: 3,
            stmts: [
                'r = 3',
            ],
            preds: [2],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                'return r',
            ],
            preds: [3],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 1',
                'throw %0',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 6,
            stmts: [
                'r = 1',
            ],
            preds: [1],
            succes: [2],
        },
        {
            id: 7,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 3',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE42 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                'r = 1',
            ],
            preds: [2],
            succes: [4],
            exceptionalSucces: [7],
        },
        {
            id: 4,
            stmts: [
                'r = 2',
            ],
            preds: [3],
            succes: [5],
            exceptionalSucces: [8],
        },
        {
            id: 5,
            stmts: [
                'r = 3',
            ],
            preds: [4],
            succes: [6],
        },
        {
            id: 6,
            stmts: [
                'return r',
            ],
            preds: [5],
            succes: [],
        },
        {
            id: 7,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
            exceptionalSucces: [8],
        },
        {
            id: 8,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 3',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [4, 7],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE43 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                '%2 = 1',
            ],
            preds: [2],
            succes: [5],
            exceptionalSucces: [4],
        },
        {
            id: 4,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
            exceptionalSucces: [6],
        },
        {
            id: 5,
            stmts: [
                'r = 2',
            ],
            preds: [3],
            succes: [7],
        },
        {
            id: 6,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 3',
                'throw %3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [4],
        },
        {
            id: 7,
            stmts: [
                'r = 3',
            ],
            preds: [5],
            succes: [8],
        },
        {
            id: 8,
            stmts: [
                'return %2',
            ],
            preds: [7],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE44 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                '%2 = 1',
            ],
            preds: [2],
            succes: [5],
            exceptionalSucces: [4],
        },
        {
            id: 4,
            stmts: [
                '%1 = caughtexception: unknown',
                '%5 = 2',
            ],
            preds: [],
            succes: [9],
            exceptionalPreds: [3],
            exceptionalSucces: [6],
        },
        {
            id: 5,
            stmts: [
                '%4 = 2',
            ],
            preds: [3],
            succes: [7],
            exceptionalSucces: [6],
        },
        {
            id: 6,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 3',
                'throw %3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [5, 4],
        },
        {
            id: 7,
            stmts: [
                'r = 3',
            ],
            preds: [5],
            succes: [8],
        },
        {
            id: 8,
            stmts: [
                'return %4',
            ],
            preds: [7],
            succes: [],
        },
        {
            id: 9,
            stmts: [
                'r = 3',
            ],
            preds: [4],
            succes: [10],
        },
        {
            id: 10,
            stmts: [
                'return %5',
            ],
            preds: [9],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE45 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                'throw e',
            ],
            preds: [2],
            succes: [],
            exceptionalSucces: [4],
        },
        {
            id: 4,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 1',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
            exceptionalSucces: [5],
        },
        {
            id: 5,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 2',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [4],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE46 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 1',
            ],
            preds: [0],
            succes: [2, 4],
        },
        {
            id: 2,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [1],
            succes: [],
            exceptionalSucces: [3],
        },
        {
            id: 3,
            stmts: [
                'e = caughtexception: unknown',
            ],
            preds: [],
            succes: [6],
            exceptionalPreds: [2],
        },
        {
            id: 4,
            stmts: [
                'return r',
            ],
            preds: [1, 8],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 1',
                'throw %1',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 6,
            stmts: [
                'r = 1',
            ],
            preds: [3],
            succes: [8],
            exceptionalSucces: [7],
        },
        {
            id: 7,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 2',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [6],
        },
        {
            id: 8,
            stmts: [
                'r = 2',
            ],
            preds: [6],
            succes: [4],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE47 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%2 = 1',
            ],
            preds: [0],
            succes: [5],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                'r = 3',
                'throw %1',
            ],
            preds: [2],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 3',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
        {
            id: 5,
            stmts: [
                'r = 2',
            ],
            preds: [1],
            succes: [6],
            exceptionalSucces: [7],
        },
        {
            id: 6,
            stmts: [
                'r = 3',
            ],
            preds: [5],
            succes: [8],
        },
        {
            id: 7,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 3',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [5],
        },
        {
            id: 8,
            stmts: [
                'return %2',
            ],
            preds: [6],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE48 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%3 = 1',
            ],
            preds: [0],
            succes: [6],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%2 = caughtexception: unknown',
                '%1 = 2',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                'r = 3',
            ],
            preds: [2],
            succes: [5],
        },
        {
            id: 4,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 3',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
        {
            id: 5,
            stmts: [
                'return %1',
            ],
            preds: [3],
            succes: [],
        },
        {
            id: 6,
            stmts: [
                '%1 = 2',
            ],
            preds: [1],
            succes: [7],
            exceptionalSucces: [8],
        },
        {
            id: 7,
            stmts: [
                'r = 3',
            ],
            preds: [6],
            succes: [9],
        },
        {
            id: 8,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 3',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [6],
        },
        {
            id: 9,
            stmts: [
                'return %1',
            ],
            preds: [7],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE49 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%2 = 1',
            ],
            preds: [0],
            succes: [4],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%1 = caughtexception: unknown',
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [3],
        },
        {
            id: 3,
            stmts: [
                'e = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
        {
            id: 4,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [1],
            succes: [],
            exceptionalSucces: [5],
        },
        {
            id: 5,
            stmts: [
                'e = caughtexception: unknown',
                'r = 2',
            ],
            preds: [],
            succes: [6],
            exceptionalPreds: [4],
        },
        {
            id: 6,
            stmts: [
                'return %2',
            ],
            preds: [5],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE50 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%3 = 1',
            ],
            preds: [0],
            succes: [4],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%2 = caughtexception: unknown',
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [3],
        },
        {
            id: 3,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
        {
            id: 4,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [1],
            succes: [],
            exceptionalSucces: [5],
        },
        {
            id: 5,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [4],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE51 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                'r = 1',
            ],
            preds: [2],
            succes: [4],
            exceptionalSucces: [8],
        },
        {
            id: 4,
            stmts: [
                'r = 2',
            ],
            preds: [3],
            succes: [5],
            exceptionalSucces: [10],
        },
        {
            id: 5,
            stmts: [
                'r = 3',
            ],
            preds: [4],
            succes: [6],
            exceptionalSucces: [9],
        },
        {
            id: 6,
            stmts: [
                'r = 4',
            ],
            preds: [5],
            succes: [7],
        },
        {
            id: 7,
            stmts: [
                'return r',
            ],
            preds: [6],
            succes: [],
        },
        {
            id: 8,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
            exceptionalSucces: [10],
        },
        {
            id: 9,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 4',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [5],
        },
        {
            id: 10,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 3',
            ],
            preds: [],
            succes: [11],
            exceptionalPreds: [4, 8],
            exceptionalSucces: [12],
        },
        {
            id: 11,
            stmts: [
                'r = 4',
                'throw %3',
            ],
            preds: [10],
            succes: [],
        },
        {
            id: 12,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 4',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [10],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE52 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'i = 0',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i === 0',
            ],
            preds: [0],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%2 = 1',
            ],
            preds: [1],
            succes: [8],
            exceptionalSucces: [7],
        },
        {
            id: 3,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [1],
            succes: [],
            exceptionalSucces: [9],
        },
        {
            id: 4,
            stmts: [
                'e = caughtexception: unknown',
                'r = 4',
            ],
            preds: [],
            succes: [5],
            exceptionalPreds: [7, 9],
            exceptionalSucces: [10],
        },
        {
            id: 5,
            stmts: [
                'r = 5',
            ],
            preds: [4],
            succes: [6],
        },
        {
            id: 6,
            stmts: [
                'return r',
            ],
            preds: [5],
            succes: [],
        },
        {
            id: 7,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
            exceptionalSucces: [4],
        },
        {
            id: 8,
            stmts: [
                'r = 2',
            ],
            preds: [2],
            succes: [11],
        },
        {
            id: 9,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 3',
                'throw %3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
            exceptionalSucces: [4],
        },
        {
            id: 10,
            stmts: [
                '%4 = caughtexception: unknown',
                'r = 5',
                'throw %4',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [4],
        },
        {
            id: 11,
            stmts: [
                'r = 5',
            ],
            preds: [8],
            succes: [12],
        },
        {
            id: 12,
            stmts: [
                'return %2',
            ],
            preds: [11],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE53 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%1 = undefined',
            ],
            preds: [0],
            succes: [4],
            exceptionalSucces: [3],
        },
        {
            id: 2,
            stmts: [
                'return',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 3,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 1',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [5],
        },
        {
            id: 4,
            stmts: [
                'r = 1',
            ],
            preds: [1],
            succes: [6],
        },
        {
            id: 5,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 2',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
        },
        {
            id: 6,
            stmts: [
                'r = 2',
            ],
            preds: [4],
            succes: [7],
        },
        {
            id: 7,
            stmts: [
                'return %1',
            ],
            preds: [6],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE54 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'r = 1',
            ],
            preds: [0],
            succes: [2],
            exceptionalSucces: [4],
        },
        {
            id: 2,
            stmts: [
                'r = 2',
            ],
            preds: [1],
            succes: [3],
        },
        {
            id: 3,
            stmts: [
                'return r',
            ],
            preds: [2],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 2',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE55 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                '%2 = 1',
            ],
            preds: [2],
            succes: [5],
            exceptionalSucces: [4],
        },
        {
            id: 4,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
            exceptionalSucces: [6],
        },
        {
            id: 5,
            stmts: [
                'r = 2',
            ],
            preds: [3],
            succes: [7],
        },
        {
            id: 6,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 3',
                'throw %3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [4],
            exceptionalSucces: [8],
        },
        {
            id: 7,
            stmts: [
                'r = 3',
            ],
            preds: [5],
            succes: [9],
        },
        {
            id: 8,
            stmts: [
                '%4 = caughtexception: unknown',
                'r = 4',
                'throw %4',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [6],
        },
        {
            id: 9,
            stmts: [
                'r = 4',
            ],
            preds: [7],
            succes: [10],
        },
        {
            id: 10,
            stmts: [
                'return %2',
            ],
            preds: [9],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE56 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%2 = 1',
            ],
            preds: [0],
            succes: [6],
            exceptionalSucces: [3],
        },
        {
            id: 2,
            stmts: [
                'return',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 3,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
            ],
            preds: [],
            succes: [4],
            exceptionalPreds: [1],
            exceptionalSucces: [5],
        },
        {
            id: 4,
            stmts: [
                'r = 3',
                'throw %1',
            ],
            preds: [3],
            succes: [],
            exceptionalSucces: [9],
        },
        {
            id: 5,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 3',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [3],
            exceptionalSucces: [9],
        },
        {
            id: 6,
            stmts: [
                'r = 2',
            ],
            preds: [1],
            succes: [7],
            exceptionalSucces: [8],
        },
        {
            id: 7,
            stmts: [
                'r = 3',
            ],
            preds: [6],
            succes: [10],
        },
        {
            id: 8,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 3',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [6],
            exceptionalSucces: [9],
        },
        {
            id: 9,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 4',
                'throw %3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [8, 4, 5],
        },
        {
            id: 10,
            stmts: [
                'r = 4',
            ],
            preds: [7],
            succes: [11],
        },
        {
            id: 11,
            stmts: [
                'return %2',
            ],
            preds: [10],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE57 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [0],
            succes: [],
            exceptionalSucces: [5],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'r = 3',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [6, 7],
            exceptionalSucces: [8],
        },
        {
            id: 3,
            stmts: [
                'r = 4',
            ],
            preds: [2],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                'return r',
            ],
            preds: [3],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 1',
            ],
            preds: [],
            succes: [6],
            exceptionalPreds: [1],
            exceptionalSucces: [7],
        },
        {
            id: 6,
            stmts: [
                'r = 2',
                'throw %2',
            ],
            preds: [5],
            succes: [],
            exceptionalSucces: [2],
        },
        {
            id: 7,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [5],
            exceptionalSucces: [2],
        },
        {
            id: 8,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 4',
                'throw %3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE58 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'i = 0',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%1 = 1',
            ],
            preds: [0],
            succes: [6],
            exceptionalSucces: [3],
        },
        {
            id: 2,
            stmts: [
                'return',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 3,
            stmts: [
                '%0 = caughtexception: unknown',
                'if i === 0',
            ],
            preds: [],
            succes: [4, 5],
            exceptionalPreds: [1],
        },
        {
            id: 4,
            stmts: [
                '%4 = 2',
            ],
            preds: [3],
            succes: [12],
            exceptionalSucces: [9],
        },
        {
            id: 5,
            stmts: [
                'r = 3',
                'throw %0',
            ],
            preds: [3],
            succes: [],
            exceptionalSucces: [9],
        },
        {
            id: 6,
            stmts: [
                'if i === 0',
            ],
            preds: [1],
            succes: [7, 8],
        },
        {
            id: 7,
            stmts: [
                '%3 = 2',
            ],
            preds: [6],
            succes: [10],
            exceptionalSucces: [9],
        },
        {
            id: 8,
            stmts: [
                'r = 3',
            ],
            preds: [6],
            succes: [14],
        },
        {
            id: 9,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 4',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [7, 4, 5],
        },
        {
            id: 10,
            stmts: [
                'r = 4',
            ],
            preds: [7],
            succes: [11],
        },
        {
            id: 11,
            stmts: [
                'return %3',
            ],
            preds: [10],
            succes: [],
        },
        {
            id: 12,
            stmts: [
                'r = 4',
            ],
            preds: [4],
            succes: [13],
        },
        {
            id: 13,
            stmts: [
                'return %4',
            ],
            preds: [12],
            succes: [],
        },
        {
            id: 14,
            stmts: [
                'r = 4',
            ],
            preds: [8],
            succes: [15],
        },
        {
            id: 15,
            stmts: [
                'return %1',
            ],
            preds: [14],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE59 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < 1',
            ],
            preds: [3, 0],
            succes: [5, 2],
        },
        {
            id: 2,
            stmts: [
                'return r',
            ],
            preds: [1],
            succes: [],
        },
        {
            id: 3,
            stmts: [
                'i = i + 1',
            ],
            preds: [6, 7],
            succes: [1],
        },
        {
            id: 4,
            stmts: [
                '%0 = caughtexception: unknown',
                'r = 1',
                'throw %0',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                'r = 1',
            ],
            preds: [1],
            succes: [7],
            exceptionalSucces: [6],
        },
        {
            id: 6,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [5],
        },
        {
            id: 7,
            stmts: [
                'r = 2',
            ],
            preds: [5],
            succes: [3],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE60 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'r = 1',
            ],
            preds: [0],
            succes: [2],
            exceptionalSucces: [7],
        },
        {
            id: 2,
            stmts: [
                'r = 2',
            ],
            preds: [1],
            succes: [3],
        },
        {
            id: 3,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [2],
            succes: [],
            exceptionalSucces: [4],
        },
        {
            id: 4,
            stmts: [
                'e = caughtexception: unknown',
                'r = 3',
            ],
            preds: [],
            succes: [5],
            exceptionalPreds: [7, 3],
            exceptionalSucces: [8],
        },
        {
            id: 5,
            stmts: [
                'r = 4',
            ],
            preds: [4],
            succes: [6],
        },
        {
            id: 6,
            stmts: [
                'return r',
            ],
            preds: [5],
            succes: [],
        },
        {
            id: 7,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
                'throw %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [4],
        },
        {
            id: 8,
            stmts: [
                '%2 = caughtexception: unknown',
                'r = 4',
                'throw %2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [4],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE61 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%2 = 1',
            ],
            preds: [0],
            succes: [5],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%1 = caughtexception: unknown',
                'r = 2',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                'return 3',
            ],
            preds: [2],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                '%0 = caughtexception: unknown',
                'return 3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
        {
            id: 5,
            stmts: [
                'r = 2',
            ],
            preds: [1],
            succes: [6],
            exceptionalSucces: [7],
        },
        {
            id: 6,
            stmts: [
                'return 3',
            ],
            preds: [5],
            succes: [],
        },
        {
            id: 7,
            stmts: [
                '%0 = caughtexception: unknown',
                'return 3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [5],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE62 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatchFinally/TryFinallySample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%2 = 1',
            ],
            preds: [0],
            succes: [4],
            exceptionalSucces: [3],
        },
        {
            id: 2,
            stmts: [
                'return r',
            ],
            preds: [],
            succes: [],
        },
        {
            id: 3,
            stmts: [
                '%1 = caughtexception: unknown',
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
            exceptionalSucces: [5],
        },
        {
            id: 4,
            stmts: [
                '%0 = new @%unk/%unk: Error',
                '%0 = instanceinvoke %0.<@%unk/%unk: Error.constructor()>()',
                'throw %0',
            ],
            preds: [1],
            succes: [],
            exceptionalSucces: [5],
        },
        {
            id: 5,
            stmts: [
                '%3 = caughtexception: unknown',
                'r = 2',
                'throw %3',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [4, 3],
        },
    ],
};
