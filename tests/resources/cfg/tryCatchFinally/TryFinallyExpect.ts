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
                'return 1',
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
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'return 1',
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
        },
        {
            id: 3,
            stmts: [
                'r = 2',
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
                '%0 = staticinvoke <@%unk/%unk: %unk.produce()>(1)',
                'return %0',
            ],
            preds: [0],
            succes: [3],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                '%2 = caughtexception: unknown',
                '%1 = staticinvoke <@%unk/%unk: %unk.produce()>(2)',
                'return %1',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [1],
        },
        {
            id: 3,
            stmts: [
                '%1 = staticinvoke <@%unk/%unk: %unk.produce()>(2)',
                'return %1',
            ],
            preds: [1],
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
            succes: [3],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'return 1',
            ],
            preds: [],
            succes: [5],
            exceptionalPreds: [1],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                'return 2',
            ],
            preds: [1],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                '%1 = caughtexception: unknown',
                'return 2',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
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

export const TRY_FINALLY_EXPECT_CASE6 = {
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

export const TRY_FINALLY_EXPECT_CASE7 = {
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
            preds: [0, 5],
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
            preds: [1],
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
                'i = i + 1',
            ],
            preds: [2],
            succes: [1],
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
                'instanceinvoke console.<@%unk/%unk: %unk.log()>(\'try\')',
                'return',
            ],
            preds: [0],
            succes: [6],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'instanceinvoke console.<@%unk/%unk: %unk.log()>(\'catch\')',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
            exceptionalSucces: [5],
        },
        {
            id: 3,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: %unk.log()>(\'finally\')',
            ],
            preds: [2],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: %unk.log()>(\'last\')',
                'return',
            ],
            preds: [3],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                '%0 = caughtexception: unknown',
                'instanceinvoke console.<@%unk/%unk: %unk.log()>(\'finally\')',
                'throw %0',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
        {
            id: 6,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: %unk.log()>(\'finally\')',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const TRY_FINALLY_EXPECT_CASE9 = {
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
                'instanceinvoke console.<@%unk/%unk: %unk.log()>(\'try\')',
                'return',
            ],
            preds: [0],
            succes: [4],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'instanceinvoke console.<@%unk/%unk: %unk.log()>(\'catch\')',
                'return',
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
                'instanceinvoke console.<@%unk/%unk: %unk.log()>(\'finally\')',
                'return',
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
        },
        {
            id: 4,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: %unk.log()>(\'finally\')',
                'return',
            ],
            preds: [1],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                'instanceinvoke console.<@%unk/%unk: %unk.log()>(\'finally\')',
                'return',
            ],
            preds: [2],
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
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'return 1',
            ],
            preds: [0],
            succes: [4],
            exceptionalSucces: [2],
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'return 3',
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

export const TRY_FINALLY_EXPECT_CASE11 = {
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
            succes: [2],
            exceptionalSucces: [3],
        },
        {
            id: 2,
            stmts: [
                'return 2',
            ],
            preds: [1],
            succes: [],
        },
        {
            id: 3,
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
                'i = 1',
            ],
            preds: [0],
            succes: [2],
            exceptionalSucces: [3],
        },
        {
            id: 2,
            stmts: [
                'return i',
            ],
            preds: [1],
            succes: [5],
            exceptionalSucces: [4],
        },
        {
            id: 3,
            stmts: [
                '%0 = caughtexception: unknown',
                'return i',
            ],
            preds: [],
            succes: [6],
            exceptionalPreds: [1],
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
            exceptionalPreds: [2],
        },
        {
            id: 5,
            stmts: [
                'i = 4',
            ],
            preds: [2],
            succes: [],
        },
        {
            id: 6,
            stmts: [
                'i = 4',
            ],
            preds: [3],
            succes: [],
        },
    ],
};
