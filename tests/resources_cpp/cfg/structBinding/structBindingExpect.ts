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

export const REFERENCE_EXPECT_BASICUSAGE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                '%0 = new @%unk/%unk: pair<typename __unwrap_ref_decay<int>::type, typename __unwrap_ref_decay<int>::type>',
                '%1 = staticinvoke <@%unk/%unk: .make_pair()>(1, 2)',
                'instanceinvoke %0.<@%unk/%unk: pair<typename __unwrap_ref_decay<int>::type, typename __unwrap_ref_decay<int>::type>.constructor()>(%1)',
                'x = %0[0]',
                'y = %0[1]',
                'a = staticinvoke <@%unk/%unk: .undefined()>(std, pair, 3, 4)[0]',
                'b = staticinvoke <@%unk/%unk: .undefined()>(std, pair, 3, 4)[1]',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const REFERENCE_EXPECT_REFERENCE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                '%0 = new @%unk/%unk: pair<typename __unwrap_ref_decay<int>::type, typename __unwrap_ref_decay<int>::type>',
                '%1 = staticinvoke <@%unk/%unk: .make_pair()>(10, 20)',
                'instanceinvoke %0.<@%unk/%unk: pair<typename __unwrap_ref_decay<int>::type, typename __unwrap_ref_decay<int>::type>.constructor()>(%1)',
                'pair = %0',
                'x = pair[0]',
                'y = pair[1]',
                'x = 100',
                'return'],
            preds: [],
            succes: [],
        },
    ],
};

export const REFERENCE_EXPECT_TUPLEUSAGE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                'name = staticinvoke <@%unk/%unk: .make_tuple()>(\'Alice\', 25, 95.5)[0]',
                'age = staticinvoke <@%unk/%unk: .make_tuple()>(\'Alice\', 25, 95.5)[1]',
                'score = staticinvoke <@%unk/%unk: .make_tuple()>(\'Alice\', 25, 95.5)[2]',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const REFERENCE_EXPECT_STRUCT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                '%0 = new @structBinding/structBinding.cpp: Person',
                'instanceinvoke %0.<@structBinding/structBinding.cpp: Person.constructor()>(\'Bob\', 30, 50000)',
                'person = %0',
                '%1 = new @structBinding/structBinding.cpp: Person',
                'instanceinvoke %1.<@structBinding/structBinding.cpp: Person.constructor()>(person)',
                'name = %1[0]',
                'age = %1[1]',
                'salary = %1[2]',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const REFERENCE_EXPECT_MAP = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                '%0 = new @%unk/%unk: std::map<std::basic_string<char>, int>',
                '%1 = new @%unk/%unk: const std::pair<const std::basic_string<char>, int>',
                'instanceinvoke %1.<@%unk/%unk: const std::pair<const std::basic_string<char>, int>.constructor()>(\'Alice\', 90)',
                '%2 = new @%unk/%unk: const std::pair<const std::basic_string<char>, int>',
                'instanceinvoke %2.<@%unk/%unk: const std::pair<const std::basic_string<char>, int>.constructor()>(\'Bob\', 85)',
                '%3 = new @%unk/%unk: const std::pair<const std::basic_string<char>, int>',
                'instanceinvoke %3.<@%unk/%unk: const std::pair<const std::basic_string<char>, int>.constructor()>(\'Charlie\', 95)',
                '%4 = newarray (const std::pair<const std::basic_string<char>, int>[])[3]',
                '%4[0] = %1',
                '%4[1] = %2',
                '%4[2] = %3',
                'instanceinvoke %0.<@%unk/%unk: std::map<std::basic_string<char>, int>.constructor()>(%4)',
                'scores = %0',
                '%5 = instanceinvoke scores.<@%unk/%unk: .Symbol.iterator()>()',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'item = <unknown>%8',
                '%5 = instanceinvoke scores.<@%unk/%unk: .Symbol.iterator()>()',
                '%6 = instanceinvoke %5.<@built-in/lib.es2015.iterable.d.ts: Iterator.next([]|[undefined])>()',
            ],
            preds: [0, 1],
            succes: [1, 4],
        },
        {
            id: 2,
            stmts: [
                'name = %12[0]', 'score = %12[1]', '%12 = <unknown>%12',
            ],
            preds: [4, 2],
            succes: [2, 3],
        },
        {
            id: 3,
            stmts: [
                'return',
            ],
            preds: [2],
            succes: [],
        },
        {
            id: 4,
            stmts: [
                '%9 = instanceinvoke scores.<@%unk/%unk: .Symbol.iterator()>()',
            ],
            preds: [1],
            succes: [2],
        },
    ],
};

export const REFERENCE_EXPECT_GETSTRUCTINFO = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                '%0 = staticinvoke <@%unk/%unk: .undefined()>(\'David\', 22, true)',
                'return %0',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const REFERENCE_EXPECT_FUNCTIONRETURN = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                'name = staticinvoke <@%unk/%unk: .get_student_info()>()[0]',
                'age = staticinvoke <@%unk/%unk: .get_student_info()>()[1]',
                'is_graduated = staticinvoke <@%unk/%unk: .get_student_info()>()[2]',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const REFERENCE_EXPECT_CONSTREFERENCE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @structBinding/structBinding.cpp: %dflt',
                'complex_data = staticinvoke <@%unk/%unk: .make_tuple()>(\'test\', 42, 3.14)',
                'str = complex_data[0]',
                'num = complex_data[1]',
                'pi = complex_data[2]',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};