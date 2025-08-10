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

export const SWITCH_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @switch/switchSample.cpp: %dflt', 'a = 0', 'b = 1', 'if a == TWO'],
            preds: [],
            succes: [1, 5],
        },
        { id: 1, stmts: ['b = TWO'], preds: [0], succes: [2] },
        { id: 2, stmts: ['b = THREE'], preds: [1, 5], succes: [4] },
        { id: 3, stmts: ['b = TEN'], preds: [5], succes: [4] },
        { id: 4, stmts: ['return'], preds: [2, 3], succes: [] },
        { id: 5, stmts: ['if a == THREE'], preds: [0], succes: [2, 3] },
    ],
};

export const SWITCH_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @switch/switchSample.cpp: %dflt', 'a = 0', 'b = 1', 'if a == TWO'],
            preds: [],
            succes: [1, 5],
        },
        { id: 1, stmts: ['b = TWO'], preds: [0], succes: [2] },
        { id: 2, stmts: ['b = THREE'], preds: [1, 5], succes: [4] },
        { id: 3, stmts: ['b = TEN'], preds: [5], succes: [4] },
        { id: 4, stmts: ['return'], preds: [2, 3], succes: [] },
        { id: 5, stmts: ['if a == THREE'], preds: [0], succes: [2, 3] },
    ],
};

export const SWITCH_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @switch/switchSample.cpp: %dflt', 'a = 0', 'b = 1', 'if a == TWO'],
            preds: [],
            succes: [1, 8],
        },
        { id: 1, stmts: ['b = TWO'], preds: [0], succes: [2] },
        { id: 2, stmts: ['if b == ONE'], preds: [1, 8], succes: [3, 9] },
        { id: 3, stmts: ['b = ONE'], preds: [2], succes: [4] },
        { id: 4, stmts: ['b = TWO'], preds: [3, 9], succes: [5] },
        { id: 5, stmts: ['b = TEN'], preds: [4, 9], succes: [7] },
        { id: 6, stmts: ['b = TEN'], preds: [8], succes: [7] },
        { id: 7, stmts: ['return'], preds: [5, 6], succes: [] },
        { id: 8, stmts: ['if a == THREE'], preds: [0], succes: [2, 6] },
        { id: 9, stmts: ['if b == TWO'], preds: [2], succes: [4, 5] },
    ],
};

export const SWITCH_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @switch/switchSample.cpp: %dflt', 'b = ONE', 'i = 0'],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < THREE'], preds: [0, 8], succes: [2, 7] },
        { id: 2, stmts: ['if i == TWO'], preds: [1], succes: [3, 9] },
        { id: 3, stmts: ['b = TWO'], preds: [2], succes: [4] },
        { id: 4, stmts: ['b = THREE'], preds: [3, 9], succes: [8] },
        { id: 5, stmts: ['b = TEN'], preds: [9], succes: [6] },
        { id: 6, stmts: ['b = TEN'], preds: [5], succes: [8] },
        { id: 7, stmts: ['return'], preds: [1], succes: [] },
        { id: 8, stmts: ['i = i + 1'], preds: [4, 6], succes: [1] },
        { id: 9, stmts: ['if i == THREE'], preds: [2], succes: [4, 5] },
    ],
};

export const SWITCH_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @switch/switchSample.cpp: %dflt', 'a = 0', 'b = 1'],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['b = TEN'], preds: [0], succes: [2] },
        { id: 2, stmts: ['a = ONE', 'return'], preds: [1], succes: [] },
    ],
};

export const SWITCH_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'a = a + 1',
                'if a == ONE'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        { id: 1, stmts: [ 'b = ONE' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 2, stmts: [ 'b = 0' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 3, stmts: [ 'return' ], preds: [ 1, 2 ], succes: [] }
    ],
};

export const SWITCH_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'if a == TWO'
            ],
            preds: [],
            succes: [ 1, 6 ]
        },
        { id: 1, stmts: [ 'b = TWO' ], preds: [ 0 ], succes: [ 2 ] },
        { id: 2, stmts: [ 'b = THREE' ], preds: [ 1, 6 ], succes: [ 5 ] },
        { id: 3, stmts: [ 'b = FOUR' ], preds: [ 7 ], succes: [ 4 ] },
        { id: 4, stmts: [ 'b = TEN' ], preds: [ 3, 7 ], succes: [ 5 ] },
        { id: 5, stmts: [ 'return' ], preds: [ 2, 4 ], succes: [] },
        { id: 6, stmts: [ 'if a == THREE' ], preds: [ 0 ], succes: [ 2, 7 ] },
        { id: 7, stmts: [ 'if a == FOUR' ], preds: [ 6 ], succes: [ 3, 4 ] }
    ],
};

export const SWITCH_EXPECT_CASE8 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @switch/switchSample.cpp: %dflt', 'a = 0', 'b = 1', 'if a == TWO'],
            preds: [],
            succes: [1, 4],
        },
        { id: 1, stmts: ['b = THREE'], preds: [0, 4], succes: [3] },
        { id: 2, stmts: ['b = TEN'], preds: [4], succes: [3] },
        { id: 3, stmts: ['return'], preds: [1, 2], succes: [] },
        { id: 4, stmts: ['if a == THREE'], preds: [0], succes: [1, 2] },
    ],
};

export const SWITCH_EXPECT_CASE9 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'if a == TWO'
            ],
            preds: [],
            succes: [ 1, 5 ]
        },
        { id: 1, stmts: [ 'b = TWO' ], preds: [ 0 ], succes: [ 4 ] },
        { id: 2, stmts: [ 'b = THREE' ], preds: [ 5 ], succes: [ 4 ] },
        { id: 3, stmts: [ 'b = TEN' ], preds: [ 5 ], succes: [ 4 ] },
        { id: 4, stmts: [ 'return' ], preds: [ 1, 2, 3 ], succes: [] },
        { id: 5, stmts: [ 'if a == THREE' ], preds: [ 0 ], succes: [ 2, 3 ] }
    ],
};

export const SWITCH_EXPECT_CASE10 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'if a == TWO'
            ],
            preds: [],
            succes: [ 1, 4 ]
        },
        { id: 1, stmts: [ 'b = THREE' ], preds: [ 0, 4 ], succes: [ 3 ] },
        { id: 2, stmts: [ 'b = 0' ], preds: [ 4 ], succes: [ 3 ] },
        { id: 3, stmts: [ 'return' ], preds: [ 1, 2 ], succes: [] },
        { id: 4, stmts: [ 'if a == THREE' ], preds: [ 0 ], succes: [ 1, 2 ] }
    ],
};

export const SWITCH_EXPECT_CASE11 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @switch/switchSample.cpp: %dflt', 'a = 0', 'b = 1', 'if a == TWO'],
            preds: [],
            succes: [1, 3],
        },
        { id: 1, stmts: ['b = THREE'], preds: [0, 3], succes: [2] },
        { id: 2, stmts: ['return'], preds: [1, 3], succes: [] },
        { id: 3, stmts: ['if a == THREE'], preds: [0], succes: [1, 2] },
    ],
};

export const SWITCH_EXPECT_CASE12 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'if a > ONE',
                'ConditionalOperatorIfTrue0',
                '%0 = TWO',
                'ConditionalOperatorIfFalse0',
                '%0 = 3',
                'ConditionalOperatorEnd0',
                'b = %0',
                'if a == TWO',
            ],
            preds: [],
            succes: [1, 5],
        },
        { id: 1, stmts: ['b = TWO'], preds: [0], succes: [4] },
        { id: 2, stmts: ['b = THREE'], preds: [5], succes: [4] },
        { id: 3, stmts: ['b = TEN'], preds: [5], succes: [4] },
        { id: 4, stmts: ['return'], preds: [1, 2, 3], succes: [] },
        { id: 5, stmts: ['if a == THREE'], preds: [0], succes: [2, 3] },
    ],
};

export const SWITCH_EXPECT_CASE13 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @switch/switchSample.cpp: %dflt', 'a = 0', 'b = 1', 'if a == TWO'],
            preds: [],
            succes: [1, 8],
        },
        { id: 1, stmts: ['b = TWO'], preds: [0], succes: [4] },
        { id: 2, stmts: ['b = THREE'], preds: [8], succes: [4] },
        { id: 3, stmts: ['b = TEN'], preds: [8], succes: [4] },
        { id: 4, stmts: ['if a > ONE'], preds: [1, 2, 3], succes: [5, 6] },
        { id: 5, stmts: ['b = TWO'], preds: [4], succes: [7] },
        { id: 6, stmts: ['b = THREE'], preds: [4], succes: [7] },
        { id: 7, stmts: ['return'], preds: [5, 6], succes: [] },
        { id: 8, stmts: ['if a == THREE'], preds: [0], succes: [2, 3] },
    ],
};
