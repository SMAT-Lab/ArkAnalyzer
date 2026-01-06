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

export const FUNCPTR_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @functionPointer/functionPointer.cpp: %dflt',
                'funcPtr = undefined',
                'funcPtr = Add',
                'result = ptrinvoke <@functionPointer/functionPointer.cpp: %dflt.funcPtr(int, int)>(3, 4)',
                '%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'3 + 4 = \')',
                '%1 = staticinvoke <@%unk/%unk: .operator<<()>(%0, result)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%1, endl)',
                'return 0',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const FUNCPTR_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @functionPointer/functionPointer.cpp: %dflt',
                'staticinvoke <@functionPointer/functionPointer.cpp: %dflt.Greet(@functionPointer/functionPointer.cpp: %dflt.%AM0()*)>(GreetEnglish)',
                'staticinvoke <@functionPointer/functionPointer.cpp: %dflt.Greet(@functionPointer/functionPointer.cpp: %dflt.%AM0()*)>(GreetSpanish)',
                'return 0',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const FUNCPTR_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @functionPointer/functionPointer.cpp: %dflt',
                '%0 = newarray (double ()(double, double)*)',
                '%0[0] = Add',
                '%0[1] = Subtract',
                '%0[2] = Multiply',
                '%0[3] = Divide',
                'operations = %0',
                'x = 10',
                'y = 5',
                '%1 = newarray (char[4])',
                '%1[0] = +',
                '%1[1] = -',
                '%1[2] = *',
                '%1[3] = /',
                'opSymbols = %1',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        { id: 1, stmts: ['if i < 4'], preds: [0, 2], succes: [2, 3] },
        {
            id: 2,
            stmts: [
                '%2 = staticinvoke <@%unk/%unk: .operator<<()>(cout, x)',
                '%3 = staticinvoke <@%unk/%unk: .operator<<()>(%2, \' \')',
                '%4 = opSymbols[i]',
                '%5 = staticinvoke <@%unk/%unk: .operator<<()>(%3, %4)',
                '%6 = staticinvoke <@%unk/%unk: .operator<<()>(%5, \' \')',
                '%7 = staticinvoke <@%unk/%unk: .operator<<()>(%6, y)',
                '%8 = staticinvoke <@%unk/%unk: .operator<<()>(%7, \' = \')',
                '%9 = operations[i]',
                '%10 = staticinvoke <@%unk/%unk: .%9()>(x, y)',
                '%11 = staticinvoke <@%unk/%unk: .operator<<()>(%8, %10)',
                'staticinvoke <@%unk/%unk: .operator<<()>(%11, endl)',
                'i = i + 1',
            ],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return 0'], preds: [1], succes: [] },
    ],
};

export const FUNCPTR_EXPECT_GREET = {
    blocks: [
        {
            id: 0,
            stmts: [
                'greetFunc = parameter0: @functionPointer/functionPointer.cpp: %dflt.%AM0()*',
                'this = this: @functionPointer/functionPointer.cpp: %dflt',
                'ptrinvoke <@functionPointer/functionPointer.cpp: %dflt.greetFunc()>()',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const FUNCPTR_EXPECT_ADD = {
    blocks: [
        {
            id: 0,
            stmts: [
                'a = parameter0: int',
                'b = parameter1: int',
                'this = this: @functionPointer/functionPointer.cpp: %dflt',
                'if b == undefined',
            ],
            preds: [],
            succes: [1, 2],
        },
        { id: 1, stmts: ['b = 4'], preds: [0], succes: [2] },
        {
            id: 2,
            stmts: ['%0 = a + b', 'return %0'],
            preds: [1, 0],
            succes: [],
        },
    ],
};