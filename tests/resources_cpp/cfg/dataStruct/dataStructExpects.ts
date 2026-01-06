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

export const DATA_STRUCT_EXPECT_VECTOR = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @dataStruct/dataStruct.cpp: %dflt',
                '%0 = new @%unk/%unk: std::vector<int>',
                '%1 = newarray (int[5])',
                '%1[0] = 1',
                '%1[1] = 2',
                '%1[2] = 3',
                '%1[3] = 4',
                '%1[4] = 5',
                'instanceinvoke %0.<@%unk/%unk: std::vector.constructor()>(%1)',
                'vec1 = %0',
                'men = vec1[2]',
                '%2 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'vec1[2]\')',
                '%3 = staticinvoke <@%unk/%unk: .operator<<()>(%2, men)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%3, endl)',
                'vec1[2] = 6',
                '%4 = vec1[2]',
                '%5 = staticinvoke <@%unk/%unk: .operator<<()>(cout, %4)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%5, endl)',
                '%6 = instanceinvoke vec1.<@%unk/%unk: std::vector.back()>()',
                '%7 = staticinvoke <@%unk/%unk: .operator<<()>(cout, %6)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%7, endl)',
                '%8 = new @%unk/%unk: std::vector<int>',
                'instanceinvoke %8.<@%unk/%unk: std::vector.constructor()>()',
                'vec2 = %8',
                'instanceinvoke vec2.<@%unk/%unk: std::vector.push_back()>(10)',
                'instanceinvoke vec2.<@%unk/%unk: std::vector.push_back()>(20)',
                'instanceinvoke vec2.<@%unk/%unk: std::vector.push_back()>(30)',
                '%9 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'size is\')',
                '%10 = instanceinvoke vec2.<@%unk/%unk: std::vector.size()>()',
                '%11 = staticinvoke <@%unk/%unk: .operator<<()>(%9, %10)',
                '%12 = staticinvoke <@%unk/%unk: .operator<<()>(%11, \'success\')',
                'staticinvoke <@%unk/%unk: .operator<<()>(%12, endl)',
                'instanceinvoke vec2.<@%unk/%unk: std::vector.pop_back()>()',
                '%13 = instanceinvoke vec2.<@%unk/%unk: std::vector.size()>()',
                '%14 = staticinvoke <@%unk/%unk: .operator<<()>(cout, %13)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%14, endl)',
                '%15 = new @%unk/%unk: std::vector<int>',
                'instanceinvoke %15.<@%unk/%unk: std::vector.constructor()>()',
                'vec3 = %15',
                'instanceinvoke vec3.<@%unk/%unk: std::vector.reserve()>(10)',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < 10'], preds: [0, 2], succes: [2, 3] },
        {
            id: 2,
            stmts: [
                'instanceinvoke vec3.<@%unk/%unk: std::vector.push_back()>(i)',
                '%16 = instanceinvoke vec3.<@%unk/%unk: std::vector.capacity()>()',
                '%17 = staticinvoke <@%unk/%unk: .operator<<()>(cout, %16)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%17, endl)',
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
                'instanceinvoke set1.<@%unk/%unk: std::set.insert()>(1)',
                'instanceinvoke set1.<@%unk/%unk: std::set.insert()>(2)',
                'instanceinvoke set1.<@%unk/%unk: std::set.insert()>(3)',
                '%1 = new @%unk/%unk: std::set<int>',
                '%2 = instanceinvoke set1.<@%unk/%unk: std::set.begin()>()',
                '%3 = instanceinvoke set1.<@%unk/%unk: std::set.end()>()',
                'instanceinvoke %1.<@%unk/%unk: std::set.constructor()>(%2, %3)',
                'set2 = %1',
                'a = instanceinvoke set2.<@%unk/%unk: std::set.find()>(2)',
                '%4 = new @%unk/%unk: std::__tree_const_iterator<int,std::__tree_node<int,void >**,long long>',
                'instanceinvoke %4.<@%unk/%unk: std::__tree_const_iterator.constructor()>(a)',
                'instanceinvoke set2.<@%unk/%unk: std::set.erase()>(%4)',
                '%5 = new @%unk/%unk: std::set<int>',
                'instanceinvoke %5.<@%unk/%unk: std::set.constructor()>(set1)',
                'set3 = %5',
                '%6 = instanceinvoke set3.<@%unk/%unk: std::set.count()>(3)',
                '%7 = staticinvoke <@%unk/%unk: .operator<<()>(cout, %6)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%7, endl)',
                'instanceinvoke set1.<@%unk/%unk: std::set.clear()>()',
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
                '%1 = newarray (int|char[4])',
                '%1[0] = 1',
                '%1[1] = \'one\'',
                '%2 = newarray (int|char[4])',
                '%2[0] = 2',
                '%2[1] = \'two\'',
                '%3 = newarray (int|char[6])',
                '%3[0] = 3',
                '%3[1] = \'three\'',
                '%4 = newarray (std::pair<int, std::string>[0])',
                '%4[0] = %1',
                '%4[1] = %2',
                '%4[2] = %3',
                'instanceinvoke %0.<@%unk/%unk: std::map.constructor()>(%4)',
                'map1 = %0',
                '%5 = new @%unk/%unk: std::string',
                '%6 = map1[1]',
                'instanceinvoke %5.<@%unk/%unk: std::string.constructor()>(%6)',
                'value1 = %5',
                '%7 = instanceinvoke map1.<@%unk/%unk: std::map.find()>(1)',
                '%8 = instanceinvoke map1.<@%unk/%unk: std::map.end()>()',
                'if %7 != %8',
                'it = instanceinvoke map1.<@%unk/%unk: std::map.begin()>()',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [
                '%9 = map1[1]',
                '%10 = staticinvoke <@%unk/%unk: .operator<<()>(cout, %9)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%10, endl)',
            ],
            preds: [0],
            succes: [2],
        },
        {
            id: 2,
            stmts: [
                '%11 = instanceinvoke map1.<@%unk/%unk: std::map.end()>()',
                'if it != %11',
            ],
            preds: [0, 1, 3],
            succes: [3, 4],
        },
        {
            id: 3,
            stmts: [
                '%12 = it-><@%unk/%unk: .second>',
                '%13 = staticinvoke <@%unk/%unk: .operator<<()>(cout, %12)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%13, endl)',
                'it = it + 1',
            ],
            preds: [2],
            succes: [2],
        },
        {
            id: 4,
            stmts: [
                '%14 = new @%unk/%unk: std::map<string,int>',
                'instanceinvoke %14.<@%unk/%unk: std::map.constructor()>()',
                'map2 = %14',
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
                '%0 = new @%unk/%unk: std::unordered_map<string,int>',
                'instanceinvoke %0.<@%unk/%unk: std::unordered_map.constructor()>()',
                'myMap = %0',
                'myMap[\'apple\'] = 10',
                '%1 = new @%unk/%unk: std::pair<typename __unwrap_ref_decay<char ()[0]&,typename __unwrap_ref_decay<int>::type>',
                '%2 = staticinvoke <@%unk/%unk: .make_pair()>(\'banana\', 20)',
                'instanceinvoke %1.<@%unk/%unk: std::pair.constructor()>(%2)',
                'instanceinvoke myMap.<@%unk/%unk: std::unordered_map.insert()>(%1)',
                '%3 = myMap[\'apple\']',
                '%4 = staticinvoke <@%unk/%unk: .operator<<()>(cout, %3)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%4, endl)',
                '%5 = new @%unk/%unk: std::string',
                'instanceinvoke %5.<@%unk/%unk: std::string.constructor()>(\'banana\')',
                '%6 = instanceinvoke myMap.<@%unk/%unk: std::unordered_map.at()>(%5)',
                '%7 = staticinvoke <@%unk/%unk: .operator<<()>(cout, %6)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%7, endl)',
                '%8 = new @%unk/%unk: std::string',
                'instanceinvoke %8.<@%unk/%unk: std::string.constructor()>(\'orange\')',
                '%9 = instanceinvoke myMap.<@%unk/%unk: std::unordered_map.find()>(%8)',
                '%10 = instanceinvoke myMap.<@%unk/%unk: std::unordered_map.end()>()',
                'if %9 != %10',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%11 = new @%unk/%unk: std::string',
                'instanceinvoke %11.<@%unk/%unk: std::string.constructor()>(\'apple\')',
                'instanceinvoke myMap.<@%unk/%unk: std::unordered_map.erase()>(%11)',
                'return 0',
            ],
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
                '%0 = new @%unk/%unk: std::queue<int>',
                'instanceinvoke %0.<@%unk/%unk: std::queue.constructor()>()',
                'q = %0',
                'instanceinvoke q.<@%unk/%unk: std::queue.push()>(10)',
                'instanceinvoke q.<@%unk/%unk: std::queue.push()>(20)',
                'instanceinvoke q.<@%unk/%unk: std::queue.push()>(30)',
                '%1 = instanceinvoke q.<@%unk/%unk: std::queue.empty()>()',
                'if %1 != 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [
                '%2 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'empty\')',
                'staticinvoke <@%unk/%unk: .operator<<()>(%2, endl)',
            ],
            preds: [0],
            succes: [2],
        },
        {
            id: 2,
            stmts: [
                '%3 = new @%unk/%unk: std::vector<int>',
                'instanceinvoke %3.<@%unk/%unk: std::vector.constructor()>()',
                'v = %3',
            ],
            preds: [0, 1],
            succes: [3],
        },
        {
            id: 3,
            stmts: [
                '%4 = instanceinvoke q.<@%unk/%unk: std::queue.empty()>()',
                '%5 = !%4',
                'if %5 != 0',
            ],
            preds: [2, 4],
            succes: [4, 5],
        },
        {
            id: 4,
            stmts: [
                '%6 = instanceinvoke q.<@%unk/%unk: std::queue.front()>()',
                'instanceinvoke v.<@%unk/%unk: std::vector.push_back()>(%6)',
                'instanceinvoke q.<@%unk/%unk: std::queue.pop()>()',
            ],
            preds: [3],
            succes: [3],
        },
        {
            id: 5,
            stmts: [
                'instanceinvoke q.<@%unk/%unk: std::queue.pop()>()',
                '%7 = instanceinvoke q.<@%unk/%unk: std::queue.front()>()',
                '%8 = staticinvoke <@%unk/%unk: .operator<<()>(cout, %7)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%8, endl)',
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
                'instanceinvoke dq.<@%unk/%unk: std::deque.push_back()>(1)',
                'instanceinvoke dq.<@%unk/%unk: std::deque.push_front()>(2)',
                '%1 = instanceinvoke dq.<@%unk/%unk: std::deque.front()>()',
                'staticinvoke <@%unk/%unk: .operator<<()>(cout, %1)',
                'instanceinvoke dq.<@%unk/%unk: std::deque.pop_front()>()',
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
                '%0 = new @%unk/%unk: std::stack<int>',
                'instanceinvoke %0.<@%unk/%unk: std::stack.constructor()>()',
                'myStack = %0',
                'instanceinvoke myStack.<@%unk/%unk: std::stack.push()>(10)',
                'instanceinvoke myStack.<@%unk/%unk: std::stack.push()>(20)',
                'instanceinvoke myStack.<@%unk/%unk: std::stack.push()>(30)',
                '%1 = instanceinvoke myStack.<@%unk/%unk: std::stack.top()>()',
                '%2 = staticinvoke <@%unk/%unk: .operator<<()>(cout, %1)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%2, endl)',
                'instanceinvoke myStack.<@%unk/%unk: std::stack.pop()>()',
                '%3 = instanceinvoke myStack.<@%unk/%unk: std::stack.empty()>()',
                'if %3 != 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [
                '%4 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'Stack is empty\')',
                'staticinvoke <@%unk/%unk: .operator<<()>(%4, endl)',
            ],
            preds: [0],
            succes: [3],
        },
        {
            id: 2,
            stmts: [
                '%5 = instanceinvoke myStack.<@%unk/%unk: std::stack.size()>()',
                '%6 = staticinvoke <@%unk/%unk: .operator<<()>(cout, %5)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%6, endl)',
            ],
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
                '%0 = new @%unk/%unk: std::list<int>',
                'instanceinvoke %0.<@%unk/%unk: std::list.constructor()>(5)',
                'list1 = %0',
                '%1 = new @%unk/%unk: std::list<int>',
                'instanceinvoke %1.<@%unk/%unk: std::list.constructor()>(5, 10)',
                'list2 = %1',
                '%2 = new @%unk/%unk: std::list<int>',
                '%3 = newarray (int[4])',
                '%3[0] = 1',
                '%3[1] = 2',
                '%3[2] = 3',
                '%3[3] = 4',
                'instanceinvoke %2.<@%unk/%unk: std::list.constructor()>(%3)',
                'list3 = %2',
                '%4 = new @%unk/%unk: std::list<int>',
                'instanceinvoke %4.<@%unk/%unk: std::list.constructor()>()',
                'list4 = %4',
                'instanceinvoke list4.<@%unk/%unk: std::list.push_back()>(10)',
                'instanceinvoke list4.<@%unk/%unk: std::list.push_back()>(20)',
                'instanceinvoke list4.<@%unk/%unk: std::list.push_back()>(30)',
                '%5 = instanceinvoke list4.<@%unk/%unk: std::list.front()>()',
                '%6 = staticinvoke <@%unk/%unk: .operator<<()>(cout, %5)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%6, endl)',
                'instanceinvoke list4.<@%unk/%unk: std::list.pop_back()>()',
                'return 0',
            ],
            preds: [],
            succes: [],
        },
    ],
};
