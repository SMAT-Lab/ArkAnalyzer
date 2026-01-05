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

export const BINGING_EXPECT_BASICUSAGE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                '%0 = staticinvoke <@%unk/%unk: .make_pair()>(1, 2)',
                'x = %0[0]',
                'y = %0[1]',
                '%1 = new @%unk/%unk: std::pair<int,int>',
                'instanceinvoke %1.<@%unk/%unk: std::pair.constructor()>(3, 4)',
                '%2 = %1',
                'a = %2[0]',
                'b = %2[1]',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BINGING_EXPECT_REFERENCE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                'pair = staticinvoke <@%unk/%unk: .make_pair()>(10, 20)',
                '%0 = pair',
                'x = %0[0]',
                'y = %0[1]',
                'x = 100',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BINGING_EXPECT_TUPLEUSAGE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                '%0 = new @%unk/%unk: double',
                'instanceinvoke %0.<@%unk/%unk: double.constructor()>(95.5)',
                '%1 = staticinvoke <@%unk/%unk: .make_tuple()>(\'Alice\', 25, %0)',
                'name = %1[0]',
                'age = %1[1]',
                'score = %1[2]',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BINGING_EXPECT_STRUCT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                '%0 = AggregateExpr(\'Bob\',30,50000)',
                'person = %0',
                '%1 = new @structBinding/structBinding.cpp: Person$%dflt.StructUsage',
                'instanceinvoke %1.<@structBinding/structBinding.cpp: Person$%dflt.StructUsage.constructor()>(person)',
                '%2 = %1',
                'name = %2[0]',
                'age = %2[1]',
                'salary = %2[2]',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BINGING_EXPECT_MAP = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                '%0 = new @%unk/%unk: std::map<string,int>',
                '%1 = newarray (char[6]|int)',
                '%1[0] = \'Alice\'',
                '%1[1] = 90',
                '%2 = newarray (char[4]|int)',
                '%2[0] = \'Bob\'',
                '%2[1] = 85',
                '%3 = newarray (char[8]|int)',
                '%3[0] = \'Charlie\'',
                '%3[1] = 95',
                '%4 = newarray (std::pair<std::basic_string<char>, int>[0])',
                '%4[0] = %1',
                '%4[1] = %2',
                '%4[2] = %3',
                'instanceinvoke %0.<@%unk/%unk: std::map.constructor()>(%4)',
                'scores = %0',
                '%5 = instanceinvoke scores.<@%unk/%unk: .iterator()>()',
                '%5 = scores.<@%unk/%unk: std::map.begin>',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%6 = scores.<@%unk/%unk: std::map.end>',
                'if %5 == %6',
            ],
            preds: [0, 2],
            succes: [2, 6],
        },
        {
            id: 2,
            stmts: [
                '%7 = %5.<@CXX/std/BuiltinClass: IterableIterator.*>',
                'item = <unknown>%7',
                'staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Overall object access\')',
                '%5 = instanceinvoke %5.<@%unk/%unk: .iterator++()>()',
            ],
            preds: [1],
            succes: [1],
        },
        {
            id: 3,
            stmts: ['%9 = scores.<@%unk/%unk: std::map.end>',
                'if %8 == %9'],
            preds: [6, 4],
            succes: [4, 5],
        },
        {
            id: 4,
            stmts: [
                '%10 = %8.<@CXX/std/BuiltinClass: IterableIterator.*>',
                'name = %10[0]',
                'score = %10[1]',
                'staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Structured binding access\')',
                '%8 = instanceinvoke %8.<@%unk/%unk: .iterator++()>()',
            ],
            preds: [3],
            succes: [3],
        },
        { id: 5, stmts: ['return'], preds: [3], succes: [] },
        {
            id: 6,
            stmts: [
                '%8 = instanceinvoke scores.<@%unk/%unk: .iterator()>()',
                '%8 = scores.<@%unk/%unk: std::map.begin>',
            ],
            preds: [1],
            succes: [3],
        },
    ],
};

export const BINGING_EXPECT_FUNCTIONRETURN = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                '%0 = staticinvoke <@structBinding/structBinding.cpp: %dflt.GetStudentInfo()>()',
                'name = %0[0]',
                'age = %0[1]',
                'is_graduated = %0[2]',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BINGING_EXPECT_CONSTREFERENCE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                '%0 = new @%unk/%unk: double',
                'instanceinvoke %0.<@%unk/%unk: double.constructor()>(3.14)',
                'complex_data = staticinvoke <@%unk/%unk: .make_tuple()>(\'test\', 42, %0)',
                '%1 = complex_data',
                'str = %1[0]',
                'num = %1[1]',
                'pi = %1[2]',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};