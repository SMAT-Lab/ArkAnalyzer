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

export const SWITCH_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                '%0 = @switch/switchSample.cpp: NumConstant.[static]TWO',
                'if a == %0',
            ],
            preds: [],
            succes: [1, 5],
        },
        { id: 1, stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TWO'], preds: [0], succes: [2] },
        { id: 2, stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]THREE'], preds: [1, 5], succes: [4] },
        { id: 3, stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TEN'], preds: [5], succes: [4] },
        { id: 4, stmts: ['return'], preds: [2, 3], succes: [] },
        {
            id: 5,
            stmts: [
                '%1 = @switch/switchSample.cpp: NumConstant.[static]THREE',
                'if a == %1',
            ],
            preds: [0],
            succes: [2, 3],
        },
    ],
};

export const SWITCH_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                '%0 = @switch/switchSample.cpp: NumConstant.[static]TWO',
                'if a == %0',
            ],
            preds: [],
            succes: [1, 5],
        },
        { id: 1, stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TWO'], preds: [0], succes: [2] },
        { id: 2, stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]THREE'], preds: [1, 5], succes: [4] },
        { id: 3, stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TEN'], preds: [5], succes: [4] },
        { id: 4, stmts: ['return'], preds: [2, 3], succes: [] },
        {
            id: 5,
            stmts: [
                '%1 = @switch/switchSample.cpp: NumConstant.[static]THREE',
                'if a == %1',
            ],
            preds: [0],
            succes: [2, 3],
        },
    ],
};

export const SWITCH_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                '%0 = @switch/switchSample.cpp: NumConstant.[static]TWO',
                'if a == %0',
            ],
            preds: [],
            succes: [1, 8],
        },
        { id: 1, stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TWO'], preds: [0], succes: [2] },
        {
            id: 2,
            stmts: [
                '%2 = @switch/switchSample.cpp: NumConstant.[static]FOUR',
                'if b == %2',
            ],
            preds: [1, 8],
            succes: [3, 9],
        },
        { id: 3, stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]FOUR'], preds: [2], succes: [4] },
        { id: 4, stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]FIVE'], preds: [3, 9], succes: [5] },
        { id: 5, stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]SIX'], preds: [4, 9], succes: [7] },
        { id: 6, stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TEN'], preds: [8], succes: [7] },
        { id: 7, stmts: ['return'], preds: [5, 6], succes: [] },
        {
            id: 8,
            stmts: [
                '%1 = @switch/switchSample.cpp: NumConstant.[static]THREE',
                'if a == %1',
            ],
            preds: [0],
            succes: [2, 6],
        },
        {
            id: 9,
            stmts: [
                '%3 = @switch/switchSample.cpp: NumConstant.[static]FIVE',
                'if b == %3',
            ],
            preds: [2],
            succes: [4, 5],
        },
    ],
};

export const SWITCH_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'b = @switch/switchSample.cpp: NumConstant.[static]ONE',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%0 = @switch/switchSample.cpp: NumConstant.[static]THREE',
                'if i < %0',
            ],
            preds: [0, 8],
            succes: [2, 7],
        },
        {
            id: 2,
            stmts: [
                '%1 = @switch/switchSample.cpp: NumConstant.[static]TWO',
                'if i == %1',
            ],
            preds: [1],
            succes: [3, 9],
        },
        { id: 3, stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TWO'], preds: [2], succes: [4] },
        { id: 4, stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]THREE'], preds: [3, 9], succes: [8] },
        {
            id: 5,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TEN'],
            preds: [9],
            succes: [6],
        },
        {
            id: 6,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TEN'],
            preds: [5],
            succes: [8],
        },
        { id: 7, stmts: ['return'], preds: [1], succes: [] },
        { id: 8, stmts: ['i = i + 1'], preds: [4, 6], succes: [1] },
        {
            id: 9,
            stmts: [
                '%2 = @switch/switchSample.cpp: NumConstant.[static]THREE',
                'if i == %2',
            ],
            preds: [2],
            succes: [4, 5],
        },
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
        {
            id: 1,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TEN'],
            preds: [0],
            succes: [2],
        },
        {
            id: 2,
            stmts: ['a = @switch/switchSample.cpp: NumConstant.[static]ONE', 'return'],
            preds: [1],
            succes: [],
        },
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
                '%0 = @switch/switchSample.cpp: NumConstant.[static]ONE',
                'if a == %0',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]ONE'],
            preds: [0],
            succes: [3],
        },
        { id: 2, stmts: ['b = 0'], preds: [0], succes: [3] },
        { id: 3, stmts: ['return'], preds: [1, 2], succes: [] },
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
                '%0 = @switch/switchSample.cpp: NumConstant.[static]TWO',
                'if a == %0',
            ],
            preds: [],
            succes: [1, 6],
        },
        {
            id: 1,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TWO'],
            preds: [0],
            succes: [2],
        },
        {
            id: 2,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]THREE'],
            preds: [1, 6],
            succes: [5],
        },
        {
            id: 3,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]FOUR'],
            preds: [7],
            succes: [4],
        },
        {
            id: 4,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TEN'],
            preds: [3, 7],
            succes: [5],
        },
        { id: 5, stmts: ['return'], preds: [2, 4], succes: [] },
        {
            id: 6,
            stmts: [
                '%1 = @switch/switchSample.cpp: NumConstant.[static]THREE',
                'if a == %1',
            ],
            preds: [0],
            succes: [2, 7],
        },
        {
            id: 7,
            stmts: [
                '%2 = @switch/switchSample.cpp: NumConstant.[static]FOUR',
                'if a == %2',
            ],
            preds: [6],
            succes: [3, 4],
        },
    ],
};

export const SWITCH_EXPECT_CASE8 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                '%0 = @switch/switchSample.cpp: NumConstant.[static]TWO',
                'if a == %0',
            ],
            preds: [],
            succes: [1, 4],
        },
        {
            id: 1,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]THREE'],
            preds: [0, 4],
            succes: [3],
        },
        {
            id: 2,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TEN'],
            preds: [4],
            succes: [3],
        },
        { id: 3, stmts: ['return'], preds: [1, 2], succes: [] },
        {
            id: 4,
            stmts: [
                '%1 = @switch/switchSample.cpp: NumConstant.[static]THREE',
                'if a == %1',
            ],
            preds: [0],
            succes: [1, 2],
        },
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
                '%0 = @switch/switchSample.cpp: NumConstant.[static]TWO',
                'if a == %0',
            ],
            preds: [],
            succes: [1, 5],
        },
        {
            id: 1,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TWO'],
            preds: [0],
            succes: [4],
        },
        {
            id: 2,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]THREE'],
            preds: [5],
            succes: [4],
        },
        {
            id: 3,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TEN'],
            preds: [5],
            succes: [4],
        },
        { id: 4, stmts: ['return'], preds: [1, 2, 3], succes: [] },
        {
            id: 5,
            stmts: [
                '%1 = @switch/switchSample.cpp: NumConstant.[static]THREE',
                'if a == %1',
            ],
            preds: [0],
            succes: [2, 3],
        },
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
                '%0 = @switch/switchSample.cpp: NumConstant.[static]TWO',
                'if a == %0',
            ],
            preds: [],
            succes: [1, 4],
        },
        {
            id: 1,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]THREE'],
            preds: [0, 4],
            succes: [3],
        },
        { id: 2, stmts: ['b = 0'], preds: [4], succes: [3] },
        { id: 3, stmts: ['return'], preds: [1, 2], succes: [] },
        {
            id: 4,
            stmts: [
                '%1 = @switch/switchSample.cpp: NumConstant.[static]THREE',
                'if a == %1',
            ],
            preds: [0],
            succes: [1, 2],
        },
    ],
};

export const SWITCH_EXPECT_CASE11 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                '%0 = @switch/switchSample.cpp: NumConstant.[static]TWO',
                'if a == %0',
            ],
            preds: [],
            succes: [1, 3],
        },
        {
            id: 1,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]THREE'],
            preds: [0, 3],
            succes: [2],
        },
        { id: 2, stmts: ['return'], preds: [1, 3], succes: [] },
        {
            id: 3,
            stmts: [
                '%1 = @switch/switchSample.cpp: NumConstant.[static]THREE',
                'if a == %1',
            ],
            preds: [0],
            succes: [1, 2],
        },
    ],
};

export const SWITCH_EXPECT_CASE12 = {
    blocks: [
        {
            id: 0,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TWO'],
            preds: [8],
            succes: [3],
        },
        {
            id: 1,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]THREE'],
            preds: [4],
            succes: [3],
        },
        {
            id: 2,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TEN'],
            preds: [4],
            succes: [3],
        },
        { id: 3, stmts: ['return'], preds: [0, 1, 2], succes: [] },
        {
            id: 4,
            stmts: [
                '%3 = @switch/switchSample.cpp: NumConstant.[static]THREE',
                'if a == %3',
            ],
            preds: [8],
            succes: [1, 2],
        },
        {
            id: 5,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                '%0 = @switch/switchSample.cpp: NumConstant.[static]ONE',
                'if a > %0',
            ],
            preds: [],
            succes: [6, 7],
        },
        {
            id: 6,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TWO'],
            preds: [5],
            succes: [8],
        },
        { id: 7, stmts: ['b = 3'], preds: [5], succes: [8] },
        {
            id: 8,
            stmts: [
                '%2 = @switch/switchSample.cpp: NumConstant.[static]TWO',
                'if a == %2',
            ],
            preds: [6, 7],
            succes: [0, 4],
        },
    ],
};

export const SWITCH_EXPECT_CASE13 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                '%0 = @switch/switchSample.cpp: NumConstant.[static]TWO',
                'if a == %0',
            ],
            preds: [],
            succes: [1, 8],
        },
        {
            id: 1,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TWO'],
            preds: [0],
            succes: [4],
        },
        {
            id: 2,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]THREE'],
            preds: [8],
            succes: [4],
        },
        {
            id: 3,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TEN'],
            preds: [8],
            succes: [4],
        },
        {
            id: 4,
            stmts: [
                '%2 = @switch/switchSample.cpp: NumConstant.[static]ONE',
                'if a > %2',
            ],
            preds: [1, 2, 3],
            succes: [5, 6],
        },
        {
            id: 5,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]TWO'],
            preds: [4],
            succes: [7],
        },
        {
            id: 6,
            stmts: ['b = @switch/switchSample.cpp: NumConstant.[static]THREE'],
            preds: [4],
            succes: [7],
        },
        { id: 7, stmts: ['return'], preds: [5, 6], succes: [] },
        {
            id: 8,
            stmts: [
                '%1 = @switch/switchSample.cpp: NumConstant.[static]THREE',
                'if a == %1',
            ],
            preds: [0],
            succes: [2, 3],
        },
    ],
};

export const SWITCH_EXPECT_NEST = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'game = 1',
                'difficulty = 2',
                'if game == 1',
            ],
            preds: [],
            succes: [1, 10],
        },
        {
            id: 1,
            stmts: [
                'staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Shooting Game - \')',
                'staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Shooting Game2 - \')',
                'if difficulty == 1',
            ],
            preds: [0],
            succes: [2, 11],
        },
        {
            id: 2,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Easy Mode\\n\')'],
            preds: [1],
            succes: [9],
        },
        {
            id: 3,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Normal Mode\\n\')'],
            preds: [11],
            succes: [9],
        },
        {
            id: 4,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Hard Mode\\n\')'],
            preds: [12],
            succes: [9],
        },
        {
            id: 5,
            stmts: [
                'staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Racing Game - \')',
                'if difficulty == 1',
            ],
            preds: [10],
            succes: [6, 13],
        },
        {
            id: 6,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Beginner Track\\n\')'],
            preds: [5],
            succes: [9],
        },
        {
            id: 7,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Intermediate Track\\n\')'],
            preds: [13],
            succes: [9],
        },
        {
            id: 8,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Invalid Game\\n\')'],
            preds: [10],
            succes: [9],
        },
        {
            id: 9,
            stmts: ['return'],
            preds: [
                8, 2, 3, 4,
                6, 7, 12, 13,
            ],
            succes: [],
        },
        { id: 10, stmts: ['if game == 2'], preds: [0], succes: [5, 8] },
        {
            id: 11,
            stmts: ['if difficulty == 2'],
            preds: [1],
            succes: [3, 12],
        },
        {
            id: 12,
            stmts: ['if difficulty == 3'],
            preds: [11],
            succes: [4, 9],
        },
        {
            id: 13,
            stmts: ['if difficulty == 2'],
            preds: [5],
            succes: [7, 9],
        },
    ],
};

export const SWITCH_EXPECT_PROCESS_CHOICE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'choice = 2',
                'if choice == 1',
            ],
            preds: [],
            succes: [1, 6],
        },
        {
            id: 1,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Selected one\\n\')'],
            preds: [0],
            succes: [5],
        },
        {
            id: 2,
            stmts: [
                'count = 5',
                '%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Selected two, Count=\')',
                '%1 = staticinvoke <@%unk/%unk: .operator<<()>(%0, count)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%1, endl)',
            ],
            preds: [6],
            succes: [5],
        },
        {
            id: 3,
            stmts: [
                '%2 = new @%unk/%unk: std::basic_string',
                'instanceinvoke %2.<@%unk/%unk: std::basic_string.constructor()>(\'Hello\')',
                'message = %2',
                '%3 = staticinvoke <@%unk/%unk: .operator<<()>(cout, message)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%3, \' from case three\\n\')',
            ],
            preds: [7],
            succes: [5],
        },
        {
            id: 4,
            stmts: [
                'staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Invalid Option\\n\')',
                'return',
            ],
            preds: [7],
            succes: [],
        },
        { id: 5, stmts: ['return'], preds: [1, 2, 3], succes: [] },
        { id: 6, stmts: ['if choice == 2'], preds: [0], succes: [2, 7] },
        { id: 7, stmts: ['if choice == 3'], preds: [6], succes: [3, 4] },
    ],
};


export const SWITCH_EXPECT_PROCESS_VALUE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'value = parameter0: T',
                'this = this: @switch/switchSample.cpp: %dflt',
                'if sizeof(T) == 4',
            ],
            preds: [],
            succes: [1, 5],
        },
        { id: 1, stmts: ['if value == 0'], preds: [0], succes: [2, 11] },
        {
            id: 2,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Zero\\n\')'],
            preds: [1],
            succes: [10],
        },
        {
            id: 3,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'One\\n\')'],
            preds: [11],
            succes: [10],
        },
        {
            id: 4,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Other Integer\\n\')'],
            preds: [11],
            succes: [10],
        },
        {
            id: 5,
            stmts: ['if sizeof(T) == 1'],
            preds: [0],
            succes: [6, 10],
        },
        {
            id: 6,
            stmts: ['if value == CHAR_A'],
            preds: [5],
            succes: [7, 12],
        },
        {
            id: 7,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Letter A\\n\')'],
            preds: [6],
            succes: [10],
        },
        {
            id: 8,
            stmts: ['staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Letter B\\n\')'],
            preds: [12],
            succes: [10],
        },
        {
            id: 9,
            stmts: [
                'staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Other Character\\n\')',
                'return',
            ],
            preds: [12],
            succes: [],
        },
        {
            id: 10,
            stmts: ['return'],
            preds: [2, 3, 4, 5, 7, 8],
            succes: [],
        },
        { id: 11, stmts: ['if value == 1'], preds: [1], succes: [3, 4] },
        {
            id: 12,
            stmts: ['if value == CHAR_B'],
            preds: [6],
            succes: [8, 9],
        },
    ],
};

export const SWITCH_EXPECT_TEST_CONST = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'num = 1',
                'staticinvoke <@switch/switchSample.cpp: %dflt.ProcessValue(T)>(num)',
                'ch = CHAR_A',
                'staticinvoke <@switch/switchSample.cpp: %dflt.ProcessValue(T)>(ch)',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};
