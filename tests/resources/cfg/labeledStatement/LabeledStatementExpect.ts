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

export const LABEL_FOR_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'n = parameter0: number',
                'this = this: @labeledStatement/LabeledStatementSample.ts: %dflt',
                'r = 0',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if i < n',
            ],
            preds: [2, 0],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                'r = r + i',
                'i = i + 1',
            ],
            preds: [1],
            succes: [1],
        },
        {
            id: 3,
            stmts: [
                'return r',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const LABEL_SWITCH_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'n = parameter0: number',
                'this = this: @labeledStatement/LabeledStatementSample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if n == 0',
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
            succes: [4],
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
            preds: [2, 3],
            succes: [],
        },
    ],
};

export const LABEL_WHILE_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'n = parameter0: number',
                'this = this: @labeledStatement/LabeledStatementSample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'if r < n',
            ],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                'r = r + 1',
            ],
            preds: [1],
            succes: [1],
        },
        {
            id: 3,
            stmts: [
                'return r',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const LABEL_DO_WHILE_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'n = parameter0: number',
                'this = this: @labeledStatement/LabeledStatementSample.ts: %dflt',
                'r = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'r = r + 1',
                'if r < n',
            ],
            preds: [0, 1],
            succes: [1, 2],
        },
        {
            id: 2,
            stmts: [
                'return r',
            ],
            preds: [1],
            succes: [],
        },
    ],
};

export const LABEL_FOR_OF_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'arr = parameter0: number[]',
                'this = this: @labeledStatement/LabeledStatementSample.ts: %dflt',
                'r = 0',
                '%0 = instanceinvoke arr.<@%unk/%unk: .Symbol.iterator()>()',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%1 = instanceinvoke %0.<@%unk/%unk: .next()>()',
                '%2 = %1.<@ES2015/BuiltinClass: IteratorResult.done>',
                'if %2 != true',
            ],
            preds: [2, 0],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%3 = %1.<@ES2015/BuiltinClass: IteratorResult.value>',
                'item = <unknown>%3',
                'r = r + item',
            ],
            preds: [1],
            succes: [1],
        },
        {
            id: 3,
            stmts: [
                'return r',
            ],
            preds: [1],
            succes: [],
        },
    ],
};
