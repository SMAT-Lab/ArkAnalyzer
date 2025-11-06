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

export const CLOSURE_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'closure = parameter0: @closure/ClosureSample.ts: %dflt.%AM0(number)',
                'this = this: @closure/ClosureSample.ts: %dflt',
                'n2 = 2',
                'ptrinvoke <@%unk/%unk: .closure()>(n2)',
                'return'
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const CLOSURE_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                '%closures0 = parameter0: [n1]',
                'n = parameter1: unknown',
                'n1 = %closures0.n1',
                'this = this: @closure/ClosureSample.ts: %dflt',
                'n1 = n1 + n',
                'return'
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const CLOSURE_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'n = parameter0: number',
                'this = this: @closure/ClosureSample.ts: %dflt',
                'n1 = 1',
                'staticinvoke <@%unk/%unk: .callClosure()>(%AM1$case1)',
                'return n1'
            ],
            preds: [],
            succes: [],
        },
    ],
};