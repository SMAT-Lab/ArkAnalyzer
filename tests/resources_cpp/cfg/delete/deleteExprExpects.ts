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

export const DELETE_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @delete/deleteExpr.cpp: %dflt',
                '%0 = new @%unk/%unk: int',
                'instanceinvoke %0.<@%unk/%unk: int.constructor()>()',
                'a = %0',
                '%1 = delete a',
                'a = null',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const DELETE_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @delete/deleteExpr.cpp: %dflt', '%0 = newarray (int*)[10]', 'arr = %0', '%1 = delete[] arr', 'arr = null', 'return'],
            preds: [],
            succes: [],
        },
    ],
};

export const DELETE_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @delete/deleteExpr.cpp: %dflt',
                '%0 = new @delete/deleteExpr.cpp: Animal',
                'instanceinvoke %0.<@delete/deleteExpr.cpp: Animal.constructor()>()',
                'a = %0',
                '%1 = delete a',
                'a = null',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const DELETE_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @delete/deleteExpr.cpp: %dflt',
                '%0 = new @delete/deleteExpr.cpp: MyStruct',
                'instanceinvoke %0.<@delete/deleteExpr.cpp: MyStruct.constructor()>()',
                'ss = %0',
                '%1 = delete ss-><@delete/deleteExpr.cpp: MyStruct.a>',
                '%2 = delete ss',
                'ss = null',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};
