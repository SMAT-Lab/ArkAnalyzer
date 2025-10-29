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

export const LIST_EXPECT_EXAMPLE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @stdInitializerListExpr/stdInitializerListExpr.cpp: %dflt',
                '%0 = newarray (int[])[5]',
                '%0[0] = 1',
                '%0[1] = 2',
                '%0[2] = 3',
                '%0[3] = 4',
                '%0[4] = 5',
                'list = %0',
                'return'
            ],
            preds: [],
            succes: []
        },
    ],
};

export const LIST_EXPECT_EXAMPLE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @stdInitializerListExpr/stdInitializerListExpr.cpp: %dflt',
                '%0 = newarray (int[])[3]',
                '%0[0] = 1',
                '%0[1] = 2',
                '%0[2] = 3',
                'staticinvoke <@%unk/%unk: .Func()>(%0)',
                '%1 = new @%unk/%unk: std::vector<int><int>',
                '%2 = newarray (int[])[4]',
                '%2[0] = 1',
                '%2[1] = 2',
                '%2[2] = 3',
                '%2[3] = 4',
                'instanceinvoke %1.<@%unk/%unk: std::vector<int>.constructor()>(%2)',
                'vec = %1',
                'return'
            ],
            preds: [],
            succes: []
        }
    ],
};

export const LIST_EXPECT_EXAMPLE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @stdInitializerListExpr/stdInitializerListExpr.cpp: %dflt',
                '%0 = new @stdInitializerListExpr/stdInitializerListExpr.cpp: MyClass',
                '%1 = newarray (int[])[4]',
                '%1[0] = 1',
                '%1[1] = 2',
                '%1[2] = 3',
                '%1[3] = 4',
                'instanceinvoke %0.<@stdInitializerListExpr/stdInitializerListExpr.cpp: MyClass.constructor()>(%1)',
                'obj = %0',
                'return'
            ],
            preds: [],
            succes: []
        }
    ],
};