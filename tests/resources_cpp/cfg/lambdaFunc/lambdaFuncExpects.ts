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

export const LAMBDA_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt',
                'func = %AM0$case1',
                'res = ptrinvoke <@%unk/%unk: .func()>(1)',
                `staticinvoke <@%unk/%unk: .printf()>('%d', res)`,
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt',
                'a = 5',
                'func = %AM1$case2',
                'res = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.func([a], int)>(%closures0, 2)',
                "staticinvoke <@%unk/%unk: .printf()>('%d', res)",
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt',
                'func = %AM2$case3',
                'res = ptrinvoke <@%unk/%unk: .func()>(3)',
                `staticinvoke <@%unk/%unk: .printf()>('%d', res)`,
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt', 'func = %AM3$case4', 'ptrinvoke <@%unk/%unk: .func()>(4)', 'return'],
            preds: [],
            succes: [],
        },
    ],
};
