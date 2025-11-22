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

export const TRAP_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @trap/cxxTrap.cpp: %dflt',
                'a = 1',
                'x = \'c\'',
                'flag = true',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['if a == 0'],
            preds: [0],
            succes: [2],
            exceptionalPreds: [],
            exceptionalSucces: [5, 4, 3],
        },
        {
            id: 2,
            stmts: ['a = 4', 'return'],
            preds: [1, 5, 4, 3],
            succes: [],
        },
        {
            id: 3,
            stmts: ['error = caughtexception: any', 'a = 7'],
            preds: [],
            succes: [2],
            exceptionalPreds: [1],
            exceptionalSucces: [],
        },
        {
            id: 4,
            stmts: ['e = caughtexception: runtime_error&', 'a = 5'],
            preds: [],
            succes: [2],
            exceptionalPreds: [1],
            exceptionalSucces: [],
        },
        {
            id: 5,
            stmts: ['e = caughtexception: logic_error&', 'a = 9', 'a = 2'],
            preds: [],
            succes: [2],
            exceptionalPreds: [1],
            exceptionalSucces: [],
        },
    ],
};