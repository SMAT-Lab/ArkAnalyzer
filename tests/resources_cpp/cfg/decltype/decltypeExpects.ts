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

export const AUTO_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @decltype/decltype.cpp: %dflt',
                'a = 5',
                '%0 = new @%unk/%unk: std::vector<int><int>',
                '%1 = newarray (int[])[3]',
                '%1[0] = 1',
                '%1[1] = 2',
                '%1[2] = 3',
                'instanceinvoke %0.<@%unk/%unk: std::vector<int>.constructor()>(%1)',
                'vec = %0',
                'it = instanceinvoke vec.<@std/vector.h: vector.begin()>()',
                'it2 = vec[0]',
                'lambda = %AM0$AutoTest',
                'return'
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const DECLTYPE_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @decltype/decltype.cpp: %dflt', 'a = 10', 'w = 10', 'b = 5', 'y = b', 'c = 10', 'y = c', 'z = 42', 'return'],
            preds: [],
            succes: [],
        },
    ],
};
