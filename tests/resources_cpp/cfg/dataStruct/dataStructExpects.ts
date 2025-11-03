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

export const DATA_STRUCT_EXPECT_VECTOR = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @dataStruct/dataStruct.cpp: %dflt',
                '%0 = new @%unk/%unk: std::vector<int>',
                '%1 = newarray (int[])[5]',
                '%1[0] = 1',
                '%1[1] = 2',
                '%1[2] = 3',
                '%1[3] = 4',
                '%1[4] = 5',
                'instanceinvoke %0.<@%unk/%unk: std::vector.constructor()>(%1)',
                'vec1 = %0',
                'men = vec1[2]',
                'staticinvoke <@%unk/%unk: .cout()>(\'vec1[2]\', men)',
                'vec1[2] = 6',
                '%2 = vec1[2]',
                'staticinvoke <@%unk/%unk: .cout()>(%2)',
                '%3 = instanceinvoke vec1.<@std/vector.h: vector.back()>()',
                'staticinvoke <@%unk/%unk: .cout()>(%3)',
                '%4 = new @std/vector.h: vector',
                'instanceinvoke %4.<@%unk/%unk: vector.constructor()>()',
                'vec2 = %4',
                'instanceinvoke vec2.<@std/vector.h: vector.push_back()>(10)',
                'instanceinvoke vec2.<@std/vector.h: vector.push_back()>(20)',
                'instanceinvoke vec2.<@std/vector.h: vector.push_back()>(30)',
                '%5 = instanceinvoke vec2.<@std/vector.h: vector.size()>()',
                'staticinvoke <@%unk/%unk: .cout()>(\'size is\', %5, \'success\')',
                'instanceinvoke vec2.<@std/vector.h: vector.pop_back()>()',
                '%6 = instanceinvoke vec2.<@std/vector.h: vector.size()>()',
                'staticinvoke <@%unk/%unk: .cout()>(%6)',
                '%7 = new @std/vector.h: vector',
                'instanceinvoke %7.<@%unk/%unk: vector.constructor()>()',
                'vec3 = %7',
                'instanceinvoke vec3.<@std/vector.h: vector.reserve()>(10)',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < 10'], preds: [0, 2], succes: [2, 3] },
        {
            id: 2,
            stmts: [
                'instanceinvoke vec3.<@std/vector.h: vector.push_back()>(i)',
                '%8 = instanceinvoke vec3.<@std/vector.h: vector.capacity()>()',
                'staticinvoke <@%unk/%unk: .cout()>(%8)',
                'i = i + 1',
            ],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return'], preds: [1], succes: [] },
    ],
};

export const DATA_STRUCT_EXPECT_SET = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @dataStruct/dataStruct.cpp: %dflt',
                '%0 = new @%unk/%unk: std::set<int>',
                'instanceinvoke %0.<@%unk/%unk: std::set.constructor()>()',
                'set1 = %0',
                'instanceinvoke set1.<@std/set.h: set.insert()>(1)',
                'instanceinvoke set1.<@std/set.h: set.insert()>(2)',
                'instanceinvoke set1.<@std/set.h: set.insert()>(3)',
                '%1 = new @%unk/%unk: std::set<int>',
                '%2 = instanceinvoke set1.<@std/set.h: set.begin()>()',
                '%3 = instanceinvoke set1.<@std/set.h: set.end()>()',
                'instanceinvoke %1.<@%unk/%unk: std::set.constructor()>(%2, %3)',
                'set2 = %1',
                'a = instanceinvoke set2.<@std/set.h: set.find()>(2)',
                '%4 = new @%unk/%unk: iterator',
                'instanceinvoke %4.<@%unk/%unk: iterator.constructor()>(a)',
                'instanceinvoke set2.<@std/set.h: set.erase()>(%4)',
                '%5 = new @%unk/%unk: std::set<int>',
                'instanceinvoke %5.<@%unk/%unk: std::set.constructor()>(set1)',
                'set3 = %5',
                '%6 = instanceinvoke set3.<@std/set.h: set.count()>(3)',
                'staticinvoke <@%unk/%unk: .cout()>(%6)',
                'instanceinvoke set1.<@std/set.h: set.clear()>()',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const DATA_STRUCT_EXPECT_MAP = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @dataStruct/dataStruct.cpp: %dflt',
                '%0 = new @%unk/%unk: std::map<int,string>',
                '%1 = new @%unk/%unk: const std::pair<int,string>',
                'instanceinvoke %1.<@%unk/%unk: const std::pair.constructor()>(1, \'one\')',
                '%2 = new @%unk/%unk: const std::pair<int,string>',
                'instanceinvoke %2.<@%unk/%unk: const std::pair.constructor()>(2, \'two\')',
                '%3 = new @%unk/%unk: const std::pair<int,string>',
                'instanceinvoke %3.<@%unk/%unk: const std::pair.constructor()>(3, \'three\')',
                '%4 = newarray (const std::pair<const int, std::basic_string<char>>[])[3]',
                '%4[0] = %1',
                '%4[1] = %2',
                '%4[2] = %3',
                'instanceinvoke %0.<@%unk/%unk: std::map.constructor()>(%4)',
                'map1 = %0',
                '%5 = new @%unk/%unk: std::basic_string<char>',
                '%6 = map1[1]',
                'instanceinvoke %5.<@%unk/%unk: std::basic_string.constructor()>(%6)',
                'value1 = %5',
                '%7 = instanceinvoke map1.<@std/map.h: map.find()>(1)',
                '%8 = instanceinvoke map1.<@std/map.h: map.end()>()',
                'if %7 != %8',
                'it = instanceinvoke map1.<@std/map.h: map.begin()>()',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: ['%9 = map1[1]', 'staticinvoke <@%unk/%unk: .cout()>(%9)'],
            preds: [0],
            succes: [2],
        },
        {
            id: 2,
            stmts: [
                '%10 = instanceinvoke map1.<@std/map.h: map.end()>()',
                'if it != %10',
            ],
            preds: [0, 1, 3],
            succes: [3, 4],
        },
        {
            id: 3,
            stmts: [
                '%11 = it-><@std/map.h: map.second>',
                'staticinvoke <@%unk/%unk: .cout()>(%11)',
                'it = it + 1',
            ],
            preds: [2],
            succes: [2],
        },
        {
            id: 4,
            stmts: [
                '%12 = new @std/map.h: map',
                'instanceinvoke %12.<@%unk/%unk: map.constructor()>()',
                'map2 = %12',
                'map2[\'Alice\'] = 30',
                'map2[\'Bob\'] = 25',
                'map2[\'Charlie\'] = 35',
                'return',
            ],
            preds: [2],
            succes: [],
        },
    ],
};

export const DATA_STRUCT_EXPECT_MAP2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @dataStruct/dataStruct.cpp: %dflt',
                '%0 = new @std/unordered_map.h: unordered_map',
                'instanceinvoke %0.<@%unk/%unk: unordered_map.constructor()>()',
                'myMap = %0',
                'myMap[\'apple\'] = 10',
                '%1 = new @%unk/%unk: pair<char ()&[],int>',
                '%2 = staticinvoke <@%unk/%unk: .make_pair()>(\'banana\', 20)',
                'instanceinvoke %1.<@%unk/%unk: pair.constructor()>(%2)',
                'instanceinvoke myMap.<@std/unordered_map.h: unordered_map.insert()>(%1)',
                '%3 = myMap[\'apple\']',
                'staticinvoke <@%unk/%unk: .cout()>(%3)',
                '%4 = instanceinvoke myMap.<@std/unordered_map.h: unordered_map.at()>(\'banana\')',
                'staticinvoke <@%unk/%unk: .cout()>(%4)',
                '%5 = instanceinvoke myMap.<@std/unordered_map.h: unordered_map.find()>(\'orange\')',
                '%6 = instanceinvoke myMap.<@std/unordered_map.h: unordered_map.end()>()',
                'if %5 != %6',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['instanceinvoke myMap.<@std/unordered_map.h: unordered_map.erase()>(\'apple\')', 'return 0'],
            preds: [0],
            succes: [],
        },
    ],
};

export const DATA_STRUCT_EXPECT_QUEUE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @dataStruct/dataStruct.cpp: %dflt',
                '%0 = new @std/queue.h: queue',
                'instanceinvoke %0.<@%unk/%unk: queue.constructor()>()',
                'q = %0',
                'instanceinvoke q.<@std/queue.h: queue.push()>(10)',
                'instanceinvoke q.<@std/queue.h: queue.push()>(20)',
                'instanceinvoke q.<@std/queue.h: queue.push()>(30)',
                '%1 = instanceinvoke q.<@std/queue.h: queue.empty()>()',
                'if %1 != 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [`staticinvoke <@%unk/%unk: .cout()>('empty')`],
            preds: [0],
            succes: [2],
        },
        {
            id: 2,
            stmts: [
                '%2 = new @std/vector.h: vector',
                'instanceinvoke %2.<@%unk/%unk: vector.constructor()>()',
                'v = %2',
            ],
            preds: [0, 1],
            succes: [3],
        },
        {
            id: 3,
            stmts: ['%3 = instanceinvoke q.<@std/queue.h: queue.empty()>()', '%4 = !%3', 'if %4 != 0'],
            preds: [2, 4],
            succes: [4, 5],
        },
        {
            id: 4,
            stmts: [
                '%5 = instanceinvoke q.<@std/queue.h: queue.front()>()',
                'instanceinvoke v.<@std/vector.h: vector.push_back()>(%5)',
                'instanceinvoke q.<@std/queue.h: queue.pop()>()',
            ],
            preds: [3],
            succes: [3],
        },
        {
            id: 5,
            stmts: [
                'instanceinvoke q.<@std/queue.h: queue.pop()>()',
                '%6 = instanceinvoke q.<@std/queue.h: queue.front()>()',
                'staticinvoke <@%unk/%unk: .cout()>(%6)',
                'return 0',
            ],
            preds: [3],
            succes: [],
        },
    ],
};

export const DATA_STRUCT_EXPECT_DEQUE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @dataStruct/dataStruct.cpp: %dflt',
                '%0 = new @%unk/%unk: std::deque<int>',
                'instanceinvoke %0.<@%unk/%unk: std::deque.constructor()>()',
                'dq = %0',
                'instanceinvoke dq.<@std/deque.h: deque.push_back()>(1)',
                'instanceinvoke dq.<@std/deque.h: deque.push_front()>(2)',
                '%1 = instanceinvoke dq.<@std/deque.h: deque.front()>()',
                'staticinvoke <@%unk/%unk: .cout()>(%1)',
                'instanceinvoke dq.<@std/deque.h: deque.pop_front()>()',
                'return 0',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const DATA_STRUCT_EXPECT_STACK = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @dataStruct/dataStruct.cpp: %dflt',
                '%0 = new @std/stack.h: stack',
                'instanceinvoke %0.<@%unk/%unk: stack.constructor()>()',
                'myStack = %0',
                'instanceinvoke myStack.<@std/stack.h: stack.push()>(10)',
                'instanceinvoke myStack.<@std/stack.h: stack.push()>(20)',
                'instanceinvoke myStack.<@std/stack.h: stack.push()>(30)',
                '%1 = instanceinvoke myStack.<@std/stack.h: stack.top()>()',
                'staticinvoke <@%unk/%unk: .cout()>(%1)',
                'instanceinvoke myStack.<@std/stack.h: stack.pop()>()',
                '%2 = instanceinvoke myStack.<@std/stack.h: stack.empty()>()',
                'if %2 != 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [`staticinvoke <@%unk/%unk: .cout()>('Stack is empty')`],
            preds: [0],
            succes: [3],
        },
        {
            id: 2,
            stmts: ['%3 = instanceinvoke myStack.<@std/stack.h: stack.size()>()', 'staticinvoke <@%unk/%unk: .cout()>(%3)'],
            preds: [0],
            succes: [3],
        },
        { id: 3, stmts: ['return 0'], preds: [1, 2], succes: [] },
    ],
};

export const DATA_STRUCT_EXPECT_LIST = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @dataStruct/dataStruct.cpp: %dflt',
                '%0 = new @std/list.h: list',
                'instanceinvoke %0.<@%unk/%unk: list.constructor()>(5)',
                'list1 = %0',
                '%1 = new @%unk/%unk: std::list<int>',
                'instanceinvoke %1.<@%unk/%unk: std::list.constructor()>(5, 10)',
                'list2 = %1',
                '%2 = new @%unk/%unk: std::list<int>',
                '%3 = newarray (int[])[4]',
                '%3[0] = 1',
                '%3[1] = 2',
                '%3[2] = 3',
                '%3[3] = 4',
                'instanceinvoke %2.<@%unk/%unk: std::list.constructor()>(%3)',
                'list3 = %2',
                '%4 = new @std/list.h: list',
                'instanceinvoke %4.<@%unk/%unk: list.constructor()>()',
                'list4 = %4',
                'instanceinvoke list4.<@std/list.h: list.push_back()>(10)',
                'instanceinvoke list4.<@std/list.h: list.push_back()>(20)',
                'instanceinvoke list4.<@std/list.h: list.push_back()>(30)',
                '%5 = instanceinvoke list4.<@std/list.h: list.front()>()',
                'staticinvoke <@%unk/%unk: .cout()>(%5)',
                'instanceinvoke list4.<@std/list.h: list.pop_back()>()',
                'return 0',
            ],
            preds: [],
            succes: [],
        },
    ],
};
