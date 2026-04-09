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

export const MALLOC_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @malloc/mallocSample.cpp: %dflt',
                'n = 5',
                '%0 = n * sizeof(*p)',
                '%1 = staticinvoke <@%unk/%unk: .malloc()>(%0)',
                'p = <CXXStaticCastExpr: int*>%1',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < n'], preds: [0, 2], succes: [2, 3] },
        {
            id: 2,
            stmts: [
                '%2 = i + 1',
                '%3 = <CXXStaticCastExpr: int>%2',
                'p[i] = %3',
                'i = i + 1',
            ],
            preds: [1],
            succes: [1],
        },
        {
            id: 3,
            stmts: ['staticinvoke <@%unk/%unk: .free()>(p)', 'return 0'],
            preds: [1],
            succes: [],
        },
    ],
};



