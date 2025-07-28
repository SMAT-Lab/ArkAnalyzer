export const LAMBDA_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt',
                'func = %AM0$case1',
                'res = ptrinvoke <@%unk/%unk: .func()>(1)',
                `staticinvoke <@%unk/%unk: .printf()>('%d', res)`,
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const LAMBDA_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                "this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt",
                "a = 5",
                "func = %AM1$case2",
                "res = ptrinvoke <@lambdaFunc/lambdaFuncSample.cpp: %dflt.func([a], int)>(%closures0, 2)",
                "staticinvoke <@%unk/%unk: .printf()>('%d', res)",
                "return",
            ],
            preds: [],
            succes: []
        }
    ]
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
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const LAMBDA_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @lambdaFunc/lambdaFuncSample.cpp: %dflt',
                'func = %AM3$case4',
                'ptrinvoke <@%unk/%unk: .func()>(4)',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};