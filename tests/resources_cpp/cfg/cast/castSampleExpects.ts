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

export const CAST_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @cast/castSample.cpp: %dflt',
                'd = 3',
                'i = <CXXStaticCastExpr: double>d',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const CAST_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @cast/castSample.cpp: %dflt',
                'i = 2',
                'iFloat = <CStyleCastExpr: float>i',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const CAST_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @cast/castSample.cpp: %dflt',
                'ci = 2',
                '%0 = &ci',
                'pi = <CXXConstCastExpr: int*>%0',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const CAST_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @cast/castSample.cpp: %dflt',
                '%0 = new @cast/castSample.cpp: Circle',
                'instanceinvoke %0.<@cast/castSample.cpp: Circle.constructor()>()',
                's = %0',
                'c = <CXXDynamicCastExpr: @cast/castSample.cpp: Circle*>s',
                'if c != 0',
            ],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: ['instanceinvoke c.<@cast/castSample.cpp: Circle.Draw()>()'],
            preds: [0],
            succes: [2],
        },
        { id: 2, stmts: ['return'], preds: [1, 0], succes: [] },
    ],
};

export const CAST_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @cast/castSample.cpp: %dflt',
                '%0 = new @%unk/%unk: int',
                'instanceinvoke %0.<@%unk/%unk: int.constructor()>(42)',
                'pi = %0',
                'pd = <CXXReinterpretCastExpr: double*>pi',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const CAST_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @cast/castSample.cpp: %dflt',
                'x = <CXXFunctionalCastExpr: int>3.14',
                'y = <CXXFunctionalCastExpr: string>\'hello\'',
                '%0 = new @cast/castSample.cpp: Widget',
                'instanceinvoke %0.<@cast/castSample.cpp: Widget.constructor()>(42)',
                'w = <CXXFunctionalCastExpr: @cast/castSample.cpp: Widget>%0',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};
