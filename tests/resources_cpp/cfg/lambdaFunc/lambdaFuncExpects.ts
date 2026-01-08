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

export const LAMBDA_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt',
                'func = %AM0$Case1',
                'res = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.func(int)>(1)',
                "staticinvoke <@%unk/%unk: .printf()>('%d', res)",
                'return'
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
                'b = 6',
                'func = %AM1$Case2',
                'res = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.func([a], int)>(%closures0, 1)',
                "staticinvoke <@%unk/%unk: .printf()>('%d', res)",
                'allByValue = %AM2$Case2',
                'res = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.allByValue([a, b], int)>(%closures1, 1)',
                "staticinvoke <@%unk/%unk: .printf()>('%d', res)",
                'return'
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
                'func = %AM3$Case3',
                'res = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.func(int)>(1)',
                "staticinvoke <@%unk/%unk: .printf()>('%d', res)",
                'return'
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
            stmts: [
                'this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt',
                'func = %AM4$Case4',
                'ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.func(int)>(1)',
                'return'
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "x = 2",
                "y = 5",
                "byRef = %AM5$Case5",
                "res = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.byRef([x, y])>(%closures0)",
                "allByRef = %AM6$Case5",
                "res = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.allByRef([x, y])>(%closures1)",
                "partByRef = %AM7$Case5",
                "res = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.partByRef([x, y])>(%closures2)",
                "return",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "a = 5",
                "c = 10",
                "outer = %AM8$Case6",
                "res = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.outer([c, a], int)>(%closures0, 1)",
                "return",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: [
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "x = 2",
                "y = 5",
                "mutableLambda = %AM10$Case7",
                "res = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.mutableLambda([x, y])>(%closures0)",
                "return",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_CASE9 = {
    blocks: [
        {
            id: 0,
            stmts: [
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "genericLambda = %AM12$Case9",
                "res1 = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.genericLambda(auto, auto)>(1, 2)",
                "res2 = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.genericLambda(auto, auto)>(2, 2)",
                "explicitGenericLambda = %AM13$Case9",
                "res1 = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.explicitGenericLambda(T, U)>(1, 2)",
                "res2 = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.explicitGenericLambda(T, U)>(2, 2)",
                "return",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM0_Case1 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.Case1()',
    closures: [],
    genericTypes: [],
    blocks: [
        {
            id: 0,
            stmts: [
                "x = parameter0: int",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "%0 = x + 1",
                "return %0",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM1_Case2 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.Case2()',
    closures: ['a'],
    genericTypes: [],
    blocks: [
        {
            id: 0,
            stmts: [
                "%closures0 = parameter0: [a]",
                "x = parameter1: int",
                "a = %closures0.a",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "%0 = x + a",
                "return %0",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM2_Case2 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.Case2()',
    closures: ['a', 'b'],
    genericTypes: [],
    blocks: [
        {
            id: 0,
            stmts: [
                "%closures1 = parameter0: [a, b]",
                "x = parameter1: int",
                "a = %closures1.a",
                "b = %closures1.b",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "%0 = x + a",
                "%1 = %0 + b",
                "%2 = %1 + g_num",
                "return %2",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM3_Case3 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.Case3()',
    closures: [],
    genericTypes: [],
    blocks: [
        {
            id: 0,
            stmts: [
                "x = parameter0: int",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "%0 = x + 1",
                "return %0",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM4_Case4 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.Case4()',
    closures: [],
    genericTypes: [],
    blocks: [
        {
            id: 0,
            stmts: [
                "x = parameter0: int",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "staticinvoke <@%unk/%unk: .printf()>('%d', x)",
                "return",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM5_Case5 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.Case5()',
    closures: ['x', 'y'],
    genericTypes: [],
    blocks: [
        {
            id: 0,
            stmts: [
                "%closures0 = parameter0: [x, y]",
                "x = %closures0.x",
                "y = %closures0.y",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "x = x + 1",
                "%0 = x + y",
                "return %0",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM6_Case5 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.Case5()',
    closures: ['x', 'y'],
    genericTypes: [],
    blocks: [
        {
            id: 0,
            stmts: [
                "%closures1 = parameter0: [x, y]",
                "x = %closures1.x",
                "y = %closures1.y",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "x = x + 1",
                "y = y + 1",
                "%0 = x + y",
                "return %0",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM7_Case5 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.Case5()',
    closures: ['x', 'y'],
    genericTypes: [],
    blocks: [
        {
            id: 0,
            stmts: [
                "%closures2 = parameter0: [x, y]",
                "x = %closures2.x",
                "y = %closures2.y",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "x = x + 1",
                "%0 = x + y",
                "return %0",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM9_AM8_Case6 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.%AM8$Case6([c, a], int)',
    closures: ['a', 'b', 'x'],
    genericTypes: [],
    blocks: [
        {
            id: 0,
            stmts: [
                "%closures1 = parameter0: [a, b, x]",
                "a = %closures1.a",
                "b = %closures1.b",
                "x = %closures1.x",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "%0 = a + b",
                "%1 = %0 + x",
                "return %1",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM8_Case6 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.Case6()',
    closures: ['a', 'c'],
    genericTypes: [],
    blocks: [
        {
            id: 0,
            stmts: [
                "%closures0 = parameter0: [c, a]",
                "x = parameter1: int",
                "c = %closures0.c",
                "a = %closures0.a",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "b = 1",
                "inner = %AM9$%AM8$Case6",
                "%0 = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.inner([a, b, x])>(%closures1)",
                "%1 = %0 + c",
                "return %1",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM10_Case7 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.Case7()',
    closures: ['x', 'y'],
    genericTypes: [],
    blocks: [
        {
            id: 0,
            stmts: [
                "%closures0 = parameter0: [x, y]",
                "x = %closures0.x",
                "y = %closures0.y",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "x = x + 1",
                "y = y + 1",
                "%0 = x + y",
                "return %0",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM11_Case8 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.Case8()',
    closures: [],
    genericTypes: [],
    blocks: [
        {
            id: 0,
            stmts: [
                "x = parameter0: int",
                "y = parameter1: int",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "%0 = x + y",
                "return %0",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM12_Case9 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.Case9()',
    closures: [],
    genericTypes: [],
    blocks: [
        {
            id: 0,
            stmts: [
                "x = parameter0: auto",
                "y = parameter1: auto",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "%0 = x + y",
                "return %0",
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const LAMBDA_EXPECT_AM13_Case9 = {
    outerFunctionSignature: '@lambdaFunc/lambdaFuncSample.cpp: %dflt.Case9()',
    closures: [],
    genericTypes: ['T', 'U'],
    blocks: [
        {
            id: 0,
            stmts: [
                "x = parameter0: T",
                "y = parameter1: U",
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "%0 = x + y",
                "return %0",
            ],
            preds: [],
            succes: [],
        },
    ],
};