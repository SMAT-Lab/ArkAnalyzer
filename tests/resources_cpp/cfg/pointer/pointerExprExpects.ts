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
                'instanceinvoke %0.<@pointer/pointerExpr.cpp: MyClass.constructor()>(2)',
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
                'x = 1',
                'p = &x',
                'y = *p',
                '*p = 2',
                'p = p + 1',
                's-><@pointer/pointerExpr.cpp: MyStruct.id> = 0',
                `s-><@pointer/pointerExpr.cpp: MyStruct.name> = 'example'`,
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
                "*%11 = 'S'",
                '%12 = *ss-><@%unk/%unk: .size>',
                'size = *%12',
            ],
            preds: [0],
            succes: [2],
        },
        { id: 2, stmts: ['return'], preds: [1, 0], succes: [] },
    ],
};
