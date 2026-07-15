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
