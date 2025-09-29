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

export const WHILE_CONTINUE_EXPECT_MAIN = {
    blocks: [
        {
            id: 0,
            stmts: ['num = parameter0: int', 'this = this: @whileContinue/whileContinueSample.cpp: %dflt'],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['if num > 0'],
            preds: [0, 3, 4],
            succes: [2, 5],
        },
        { id: 2, stmts: ['if num == 2'], preds: [1], succes: [3, 4] },
        { id: 3, stmts: ['num = num + 1'], preds: [2], succes: [1] },
        { id: 4, stmts: ['num = num - 2'], preds: [2], succes: [1] },
        { id: 5, stmts: ['return 0'], preds: [1], succes: [] },
    ],
};

export const DO_WHILE_STMT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @whileContinue/whileContinueSample.cpp: %dflt',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['i = i + 1'], preds: [0, 2], succes: [2] },
        { id: 2, stmts: ['if i < 10'], preds: [1], succes: [1, 3] },
        { id: 3, stmts: ['return'], preds: [2], succes: [] },
    ],
};
