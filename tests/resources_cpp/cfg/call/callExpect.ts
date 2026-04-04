/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License"); * you may not use this file except in compliance with the License.
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

export const CXXMEMBERCALL_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @call/call.cpp: %dflt',
                '%0 = new @call/call.cpp: Foo',
                'instanceinvoke %0.<@call/call.cpp: Foo.constructor()>()',
                'f = %0',
                'instanceinvoke f.<@call/call.cpp: Foo.Bar()>(42)',
                'return',
            ],
            preds: [],
            succes: [],
        },

    ],
};

export const CXXMETHODDEFAULT_CASE2_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'x = parameter0: int',
                'y = parameter1: int',
                'this = this: @call/call.cpp: %dflt',
                'if x == undefined',
            ],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['x = 0'], preds: [0], succes: [2] },
        {
            id: 2,
            stmts: ['if y == undefined'],
            preds: [1, 0],
            succes: [3, 4],
        },
        { id: 3, stmts: ['y = 1'], preds: [2], succes: [4] },
        {
            id: 4,
            stmts: ['x = x + 1', 'y = y - 1', 'return'],
            preds: [3, 2],
            succes: [],
        },
    ],
};

export const CXXMETHODDEFAULT_CASE3_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'c = parameter0: char',
                'this = this: @call/call.cpp: %dflt',
                'if c == undefined',
            ],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['c = o'], preds: [0], succes: [2] },
        {
            id: 2,
            stmts: ['c = c + 1', 'return'],
            preds: [1, 0],
            succes: [],
        },
    ],
};