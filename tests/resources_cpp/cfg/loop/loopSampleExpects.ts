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

export const LOOP_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loop/loopSample.cpp: %dflt',
                '%0 = newarray (int[2])',
                '%0[0] = 1',
                '%0[1] = 2',
                '%1 = newarray (int[2])',
                '%1[0] = 3',
                '%1[1] = 4',
                '%2 = newarray (int[2][2])',
                '%2[0] = %0',
                '%2[1] = %1',
                'arr = %2',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < 2'], preds: [0, 2], succes: [2, 3] },
        {
            id: 2,
            stmts: [
                '%3 = arr[i]',
                'c = %3[0]',
                '%4 = arr[i]',
                'd = %4[1]',
                'staticinvoke <@%unk/%unk: .printf()>(\'%d %d\\n\', c, d)',
                'i = i + 1',
            ],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};

export const LOOP_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loop/loopSample.cpp: %dflt',
                '%0 = new @loop/loopSample.cpp: Data',
                'instanceinvoke %0.<@loop/loopSample.cpp: Data.constructor()>(1, 2)',
                '%1 = new @loop/loopSample.cpp: Data',
                'instanceinvoke %1.<@loop/loopSample.cpp: Data.constructor()>(3, 4)',
                '%2 = newarray (@loop/loopSample.cpp: Data[2])',
                '%2[0] = %0',
                '%2[1] = %1',
                'arr = %2',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < 2'], preds: [0, 2], succes: [2, 3] },
        {
            id: 2,
            stmts: ['%3 = arr[i].<@loop/loopSample.cpp: Data.a>', '%4 = arr[i].<@loop/loopSample.cpp: Data.b>', 'staticinvoke <@%unk/%unk: .printf()>(\'%d %d\\n\', %3, %4)', 'i = i + 1'],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};

export const LOOP_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @loop/loopSample.cpp: %dflt', 'b = 0', 'i = 0'],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < 2'], preds: [0, 2], succes: [2, 3] },
        {
            id: 2,
            stmts: ['b = b + 1', 'i = i + 1'],
            preds: [1],
            succes: [1],
        },
        {
            id: 3,
            stmts: ['staticinvoke <@%unk/%unk: .printf()>(\'%d\\n\', b)', 'return'],
            preds: [1],
            succes: [],
        },
    ],
};

export const LOOP_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @loop/loopSample.cpp: %dflt', 'i = 0'],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < 2'], preds: [0, 2], succes: [2, 3] },
        {
            id: 2,
            stmts: ['staticinvoke <@%unk/%unk: .printf()>(\'%d\\n\', i)', 'i = i + 1'],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};

export const LOOP_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @loop/loopSample.cpp: %dflt', 'i = 0'],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['if true == true'],
            preds: [0, 3],
            succes: [2, 4],
        },
        { id: 2, stmts: ['if i > 2'], preds: [1], succes: [4, 3] },
        {
            id: 3,
            stmts: ['staticinvoke <@%unk/%unk: .printf()>(\'%d\\n\', i)', 'i = i + 1'],
            preds: [2],
            succes: [1],
        },
        { id: 4, stmts: ['return'], preds: [1, 2], succes: [] },
    ],
};

export const LOOP_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @loop/loopSample.cpp: %dflt', 'i = 0'],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < 2'], preds: [0, 2], succes: [2, 3] },
        {
            id: 2,
            stmts: ['staticinvoke <@%unk/%unk: .printf()>(\'%d\\n\', i)', 'i = i + 1'],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};

export const LOOP_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @loop/loopSample.cpp: %dflt', 'i = 0'],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['if i <= 2'],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: ['staticinvoke <@%unk/%unk: .printf()>(\'%d\\n\', i)', 'i = i + 1'],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};

export const LOOP_EXPECT_CASE8 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loop/loopSample.cpp: %dflt',
                '%0 = new @%unk/%unk: std::map<int,string>',
                '%1 = newarray (int|char[4])',
                '%1[0] = 1',
                '%1[1] = \'one\'',
                '%2 = newarray (int|char[4])',
                '%2[0] = 2',
                '%2[1] = \'two\'',
                '%3 = newarray (int|char[6])',
                '%3[0] = 3',
                '%3[1] = \'three\'',
                '%4 = newarray (std::pair<int, std::basic_string<char>>[0])',
                '%4[0] = %1',
                '%4[1] = %2',
                '%4[2] = %3',
                'instanceinvoke %0.<@%unk/%unk: std::map.constructor()>(%4)',
                'map1 = %0',
                '%5 = instanceinvoke map1.<@%unk/%unk: .iterator()>()',
                '%5 = map1.<@%unk/%unk: std::map.begin>',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['%6 = map1.<@%unk/%unk: std::map.end>', 'if %5 == %6'],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%7 = %5.<@CXX/std/BuiltinClass: IterableIterator.*>',
                'pair = undefined',
                'pair = <unknown>%7',
                '%8 = pair.<@%unk/%unk: .first>',
                '%9 = pair.<@%unk/%unk: .second>',
                '%10 = instanceinvoke %9.<@%unk/%unk: .c_str()>()',
                'staticinvoke <@%unk/%unk: .printf()>(\'%d %s\\n\', %8, %10)',
                '%5 = instanceinvoke %5.<@%unk/%unk: .iterator++()>()',
            ],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};

export const LOOP_EXPECT_CASE9 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loop/loopSample.cpp: %dflt',
                '%0 = new @%unk/%unk: std::map<int,string>',
                '%1 = newarray (int|char[4])',
                '%1[0] = 1',
                '%1[1] = \'one\'',
                '%2 = newarray (int|char[4])',
                '%2[0] = 2',
                '%2[1] = \'two\'',
                '%3 = newarray (int|char[6])',
                '%3[0] = 3',
                '%3[1] = \'three\'',
                '%4 = newarray (std::pair<int, std::basic_string<char>>[0])',
                '%4[0] = %1',
                '%4[1] = %2',
                '%4[2] = %3',
                'instanceinvoke %0.<@%unk/%unk: std::map.constructor()>(%4)',
                'map2 = %0',
                '%5 = instanceinvoke map2.<@%unk/%unk: .iterator()>()',
                '%5 = map2.<@%unk/%unk: std::map.begin>',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['%6 = map2.<@%unk/%unk: std::map.end>', 'if %5 == %6'],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%7 = %5.<@CXX/std/BuiltinClass: IterableIterator.*>',
                'key = value[0]',
                'value = <unknown>%7',
                '%8 = instanceinvoke value.<@%unk/%unk: .c_str()>()',
                'staticinvoke <@%unk/%unk: .printf()>(\'%d %s\\n\', key, %8)',
                '%5 = instanceinvoke %5.<@%unk/%unk: .iterator++()>()',
            ],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};

export const LOOP_EXPECT_CASE10 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loop/loopSample.cpp: %dflt',
                '%0 = new @%unk/%unk: std::vector<int>',
                '%1 = newarray (int[5])',
                '%1[0] = 1',
                '%1[1] = 2',
                '%1[2] = 3',
                '%1[3] = 4',
                '%1[4] = 5',
                'instanceinvoke %0.<@%unk/%unk: std::vector.constructor()>(%1)',
                'num = %0',
                'it = instanceinvoke num.<@%unk/%unk: std::vector.begin()>()',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%2 = instanceinvoke num.<@%unk/%unk: std::vector.end()>()',
                'if it != %2',
            ],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                'staticinvoke <@%unk/%unk: .printf()>(\'%d\\n\', undefined)',
                'it = it + 1',
            ],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};

export const LOOP_EXPECT_CASE11 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loop/loopSample.cpp: %dflt',
                '%0 = new @%unk/%unk: std::vector<int>',
                '%1 = newarray (int[5])',
                '%1[0] = 1',
                '%1[1] = 2',
                '%1[2] = 3',
                '%1[3] = 4',
                '%1[4] = 5',
                'instanceinvoke %0.<@%unk/%unk: std::vector.constructor()>(%1)',
                'num = %0',
                '%2 = instanceinvoke num.<@%unk/%unk: .iterator()>()',
                '%2 = num.<@%unk/%unk: std::vector.begin>',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['%3 = num.<@%unk/%unk: std::vector.end>', 'if %2 == %3'],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%4 = %2.<@CXX/std/BuiltinClass: IterableIterator.*>',
                'a = undefined',
                'a = <unknown>%4',
                'staticinvoke <@%unk/%unk: .operator<<()>(cout, a)',
                '%2 = instanceinvoke %2.<@%unk/%unk: .iterator++()>()',
            ],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};

export const LOOP_EXPECT_CASE12 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @loop/loopSample.cpp: %dflt', 'i = 0'],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < 10'], preds: [0, 6], succes: [8, 7] },
        { id: 2, stmts: ['if i < 10'], preds: [8, 9], succes: [3, 4] },
        {
            id: 3,
            stmts: [
                '%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'First condition active: i = \')',
                '%1 = staticinvoke <@%unk/%unk: .operator<<()>(%0, i)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%1, endl)',
            ],
            preds: [2],
            succes: [6],
        },
        {
            id: 4,
            stmts: [
                '%2 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Second condition active: i = \')',
                '%3 = staticinvoke <@%unk/%unk: .operator<<()>(%2, i)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%3, endl)',
            ],
            preds: [2],
            succes: [6],
        },
        { id: 5, stmts: ['return'], preds: [7, 9], succes: [] },
        { id: 6, stmts: ['i = i + 1'], preds: [3, 4], succes: [1] },
        { id: 7, stmts: ['if i >= 10'], preds: [1, 8], succes: [9, 5] },
        { id: 8, stmts: ['if i != 5'], preds: [1], succes: [2, 7] },
        { id: 9, stmts: ['if i < 15'], preds: [7], succes: [2, 5] },
    ],
};

export const LOOP_EXPECT_CASE13 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @loop/loopSample.cpp: %dflt', 'i = 0'],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < 5'], preds: [0, 5], succes: [7, 4] },
        { id: 2, stmts: ['if j < 3'], preds: [6, 3], succes: [3, 8] },
        {
            id: 3,
            stmts: [
                '%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'i = \')',
                '%1 = staticinvoke <@%unk/%unk: .operator<<()>(%0, i)',
                '%2 = staticinvoke <@%unk/%unk: .operator<<()>(%1, \', j = \')',
                '%3 = staticinvoke <@%unk/%unk: .operator<<()>(%2, j)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%3, endl)',
                'j = j + 1',
            ],
            preds: [2, 9],
            succes: [2],
        },
        { id: 4, stmts: ['return'], preds: [1, 7], succes: [] },
        { id: 5, stmts: ['i = i + 1'], preds: [8, 9], succes: [1] },
        { id: 6, stmts: ['j = 0'], preds: [7], succes: [2] },
        { id: 7, stmts: ['if i != 3'], preds: [1], succes: [6, 4] },
        { id: 8, stmts: ['if j >= 3'], preds: [2], succes: [9, 5] },
        { id: 9, stmts: ['if j < 5'], preds: [8], succes: [3, 5] },
    ],
};

export const LOOP_EXPECT_CASE14 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loop/loopSample.cpp: %dflt',
                'count = 0',
                'i = 0',
                'ok = i < 2',
            ],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if ok != 0'], preds: [0, 2], succes: [2, 3] },
        {
            id: 2,
            stmts: ['count = count + 1', 'i = i + 1'],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};