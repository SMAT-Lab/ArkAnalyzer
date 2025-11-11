/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

export const TRY_CATCH_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatch/TryCatchSample.ts: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i !== 0',
            ],
            preds: [0],
            succes: [2, 4],
            exceptionalPreds: [],
            exceptionalSucces: [3]
        },
        {
            id: 2,
            stmts: [
                'y = 10 / i',
            ],
            preds: [1],
            succes: [4],
            exceptionalPreds: [],
            exceptionalSucces: [3]
        },
        {
            id: 3,
            stmts: [
                'e = caughtexception: unknown',
                "instanceinvoke console.<@%unk/%unk: .log()>('i === 0')"
            ],
            preds: [],
            succes: [4],
            exceptionalPreds: [1, 2],
            exceptionalSucces: []
        },
        {
            id: 4,
            stmts: [
                'return',
            ],
            preds: [1, 2, 3],
            succes: [],
        },
    ],
};

export const TRY_CATCH_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @tryCatch/TryCatchSample.ts: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'a = 1',
            ],
            preds: [0],
            succes: [3],
            exceptionalPreds: [],
            exceptionalSucces: [2]
        },
        {
            id: 2,
            stmts: [
                'e = caughtexception: unknown',
                'b = 2',
            ],
            preds: [],
            succes: [3],
            exceptionalPreds: [1],
            exceptionalSucces: [5]
        },
        {
            id: 3,
            stmts: [
                'type @tryCatch/TryCatchSample.ts: %dflt.case2()#FuncType = @tryCatch/TryCatchSample.ts: %dflt.%AM0(string)',
                'c = %AM1$case2',
            ],
            preds: [1, 2],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                'return',
            ],
            preds: [3],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                '%0 = caughtexception: unknown',
                'type @tryCatch/TryCatchSample.ts: %dflt.case2()#FuncType = @tryCatch/TryCatchSample.ts: %dflt.%AM0(string)',
                'c = %AM1$case2',
                'throw %0'
            ],
            preds: [],
            succes: [],
            exceptionalPreds: [2],
            exceptionalSucces: []
        },
    ],
};