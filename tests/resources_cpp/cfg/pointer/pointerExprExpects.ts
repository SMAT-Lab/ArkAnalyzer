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

export const POINTER_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'p = parameter0: int*',
                'pp = parameter1: int**',
                'this = this: @pointer/pointerExpr.cpp: %dflt',
                'q = p',
                '%0 = new @pointer/pointerExpr.cpp: MyClass',
                'instanceinvoke %0.<@pointer/pointerExpr.cpp: MyClass.constructor(int)>(2)',
                'clsPtr = %0',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const POINTER_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                's = parameter0: @pointer/pointerExpr.cpp: MyStruct*',
                's1 = parameter1: @pointer/pointerExpr.cpp: MyStruct',
                'this = this: @pointer/pointerExpr.cpp: %dflt',
                'num = 100',
                'constNum = 200',
                'p1 = &num',
                'p2 = &constNum',
                'p3 = &num',
                'p4 = &constNum',
                'p5 = undefined',
                'x = 1',
                'p = &x',
                'y = *p',
                '*p = 2',
                'p = p + 1',
                's-><@pointer/pointerExpr.cpp: MyStruct.id> = 0',
                "s-><@pointer/pointerExpr.cpp: MyStruct.name> = 'example'",
                'id = s1.<@pointer/pointerExpr.cpp: MyStruct.id>',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const POINTER_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'p = parameter0: int*',
                'pp = parameter1: int**',
                'ppp = parameter2: int***',
                'this = this: @pointer/pointerExpr.cpp: %dflt',
                'x = 1',
                'y = 2',
                'qq = pp',
                '%0 = *pp',
                '*%0 = 2',
                '%1 = &x',
                '*qq = %1',
                'ppp = &qq',
                '%3 = &y',
                '%2 = *ppp',
                '*%2 = %3',
                '%4 = *ppp',
                '%5 = *%4',
                '*qq = %5',
                '%6 = pp + 1',
                '%7 = *%6',
                '*%7 = 2',
                '%8 = new @pointer/pointerExpr.cpp: MyStruct',
                'instanceinvoke %8.<@pointer/pointerExpr.cpp: MyStruct.constructor()>()',
                's = %8',
                'if s != null',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [
                'ss = &s',
                '*ss-><@%unk/%unk: .id> = 2',
                '%9 = *ss',
                `*%9.<@%unk/%unk: .name> = 'example'`,
                '%10 = new @%unk/%unk: char',
                'instanceinvoke %10.<@%unk/%unk: char.constructor()>()',
                's-><@pointer/pointerExpr.cpp: MyStruct.size> = %10',
                '%11 = s-><@pointer/pointerExpr.cpp: MyStruct.size>',
                '*%11 = S',
                '%12 = *ss-><@%unk/%unk: .size>',
                'size = *%12',
            ],
            preds: [0],
            succes: [2],
        },
        { id: 2, stmts: ['return'], preds: [1, 0], succes: [] },
    ],
};

export const POINTER_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @pointer/pointerExpr.cpp: %dflt',
                'ptr1 = staticinvoke <@%unk/%unk: .make_unique()>(42)',
                '%0 = new @%unk/%unk: unique_ptr<int>',
                '%1 = new @%unk/%unk: int',
                'instanceinvoke %1.<@%unk/%unk: int.constructor()>(42)',
                'instanceinvoke %0.<@%unk/%unk: unique_ptr.constructor()>(%1)',
                'ptr2 = %0',
                '*ptr1 = 100',
                'rawPtr = instanceinvoke ptr1.<@%unk/%unk: .get()>()',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const POINTER_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @pointer/pointerExpr.cpp: %dflt',
                'ptr1 = staticinvoke <@%unk/%unk: .make_shared()>(42)',
                '%0 = new @%unk/%unk: shared_ptr<int>',
                '%1 = new @%unk/%unk: int',
                'instanceinvoke %1.<@%unk/%unk: int.constructor()>(42)',
                'instanceinvoke %0.<@%unk/%unk: shared_ptr.constructor()>(%1)',
                'ptr2 = %0',
                '*ptr1 = 100',
                'rawPtr = instanceinvoke ptr1.<@%unk/%unk: .get()>()',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const POINTER_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @pointer/pointerExpr.cpp: %dflt',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                'node1 = staticinvoke <@%unk/%unk: .make_shared()>(1)',
                'node2 = staticinvoke <@%unk/%unk: .make_shared()>(2)',
                'node1-><@%unk/%unk: .next> = node2',
                'node2-><@%unk/%unk: .parent> = node1',
                'return',
            ],
            preds: [0],
            succes: [],
        },
    ],
};

export const POINTER_NODE_CLASS1 = {
    fields: ['data', 'next', 'parent'],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'value = parameter0: int',
                        'this = this: @pointer/pointerExpr.cpp: Node',
                        'instanceinvoke this.<@pointer/pointerExpr.cpp: Node.%instInit()>()',
                        'this.<@pointer/pointerExpr.cpp: Node.data> = value',
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};