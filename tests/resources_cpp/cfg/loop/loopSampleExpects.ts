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

export const LOOP_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @loop/loopSample.cpp: %dflt',
                '%0 = newarray (int[])[2]',
                '%0[0] = 1',
                '%0[1] = 2',
                '%1 = newarray (int[])[2]',
                '%1[0] = 3',
                '%1[1] = 4',
                '%2 = newarray (int[][])[2]',
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
                'c = %3.<@%unk/%unk: .0>',
                '%4 = arr[i]',
                'd = %4.<@%unk/%unk: .1>',
                "staticinvoke <@%unk/%unk: .printf()>('%d %d\\n', c, d)",
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
                '%2 = newarray (@loop/loopSample.cpp: Data[])[2]',
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
            stmts: ['%3 = arr[i].<@%unk/%unk: .a>', '%4 = arr[i].<@%unk/%unk: .b>', "staticinvoke <@%unk/%unk: .printf()>('%d %d\\n', %3, %4)", 'i = i + 1'],
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
            stmts: ["staticinvoke <@%unk/%unk: .printf()>('%d\\n', b)", 'return'],
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
            stmts: ["staticinvoke <@%unk/%unk: .printf()>('%d\\n', i)", 'i = i + 1'],
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
            stmts: ["staticinvoke <@%unk/%unk: .printf()>('%d\\n', i)", 'i = i + 1'],
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
            stmts: ["staticinvoke <@%unk/%unk: .printf()>('%d\\n', i)", 'i = i + 1'],
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
            stmts: ["staticinvoke <@%unk/%unk: .printf()>('%d\\n', i)", 'i = i + 1'],
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
                '%0 = new @%unk/%unk: std::map<int, std::basic_string<char>>',
                '%1 = new @%unk/%unk: const std::pair<const int, std::basic_string<char>>',
                "instanceinvoke %1.<@%unk/%unk: const std::pair<const int, std::basic_string<char>>.constructor()>(1, 'one')",
                '%2 = new @%unk/%unk: const std::pair<const int, std::basic_string<char>>',
                "instanceinvoke %2.<@%unk/%unk: const std::pair<const int, std::basic_string<char>>.constructor()>(2, 'two')",
                '%3 = new @%unk/%unk: const std::pair<const int, std::basic_string<char>>',
                "instanceinvoke %3.<@%unk/%unk: const std::pair<const int, std::basic_string<char>>.constructor()>(3, 'three')",
                '%4 = newarray (const std::pair<const int, std::basic_string<char>>[])[3]',
                '%4[0] = %1',
                '%4[1] = %2',
                '%4[2] = %3',
                'instanceinvoke %0.<@%unk/%unk: std::map<int, std::basic_string<char>>.constructor()>(%4)',
                'map1 = %0',
                '%5 = instanceinvoke map1.<@%unk/%unk: .Symbol.iterator()>()',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['%6 = instanceinvoke %5.<@%unk/%unk: .next()>()', '%7 = %6.<@ES2015/BuiltinClass: IteratorResult.done>', 'if %7 == true'],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%8 = map1.<@ES2015/BuiltinClass: IteratorResult.value>',
                'pair = <unknown>%8',
                '%9 = pair.<@%unk/%unk: .first>',
                '%10 = pair.<@%unk/%unk: .second>',
                '%11 = instanceinvoke %10.<@%unk/%unk: .c_str()>()',
                "staticinvoke <@%unk/%unk: .printf()>('%d %s\\n', %9, %11)",
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
                '%0 = new @%unk/%unk: std::map<int, std::basic_string<char>>',
                '%1 = new @%unk/%unk: const std::pair<const int, std::basic_string<char>>',
                "instanceinvoke %1.<@%unk/%unk: const std::pair<const int, std::basic_string<char>>.constructor()>(1, 'one')",
                '%2 = new @%unk/%unk: const std::pair<const int, std::basic_string<char>>',
                "instanceinvoke %2.<@%unk/%unk: const std::pair<const int, std::basic_string<char>>.constructor()>(2, 'two')",
                '%3 = new @%unk/%unk: const std::pair<const int, std::basic_string<char>>',
                "instanceinvoke %3.<@%unk/%unk: const std::pair<const int, std::basic_string<char>>.constructor()>(3, 'three')",
                '%4 = newarray (const std::pair<const int, std::basic_string<char>>[])[3]',
                '%4[0] = %1',
                '%4[1] = %2',
                '%4[2] = %3',
                'instanceinvoke %0.<@%unk/%unk: std::map<int, std::basic_string<char>>.constructor()>(%4)',
                'map2 = %0',
                '%5 = instanceinvoke map2.<@%unk/%unk: .Symbol.iterator()>()',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['%6 = instanceinvoke %5.<@%unk/%unk: .next()>()', '%7 = %6.<@ES2015/BuiltinClass: IteratorResult.done>', 'if %7 == true'],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%8 = map2.<@ES2015/BuiltinClass: IteratorResult.value>',
                'key = %8[0]',
                'value = %8[1]',
                '%8 = <unknown>%8',
                '%9 = instanceinvoke value.<@%unk/%unk: .c_str()>()',
                "staticinvoke <@%unk/%unk: .printf()>('%d %s\\n', key, %9)",
            ],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};
