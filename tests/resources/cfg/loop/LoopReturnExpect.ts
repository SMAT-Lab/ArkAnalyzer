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

export const LOOP_RETURN_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loop/LoopReturnSample.ts: %dflt',
                '%0 = newarray (number)[3]',
                '%0[0] = 1',
                '%0[1] = 2',
                '%0[2] = 3',
                'arr = %0',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%1 = arr.<@%unk/%unk: .length>',
                'if i < %1',
            ],
            preds: [0],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%2 = arr[i]',
                '%3 = %2 > 0',
                'return %3',
            ],
            preds: [1],
            succes: [],
        },
        {
            id: 3,
            stmts: [
                'return false',
            ],
            preds: [1],
            succes: [],
        },
    ],
};
