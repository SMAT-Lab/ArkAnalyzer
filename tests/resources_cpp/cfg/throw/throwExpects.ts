export const THROW_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'a = parameter0: int',
                'b = parameter1: int',
                'this = this: @throw/throwSample.cpp: %dflt',
                'if b == 0'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        {
            id: 1,
            stmts: [ `throw 'Division by zero condition!'` ],
            preds: [ 0 ],
            succes: [ 2 ]
        },
        {
            id: 2,
            stmts: [ '%0 = a / b', 'return %0' ],
            preds: [ 0, 1 ],
            succes: []
        }
    ]
};

export const THROW_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @throw/throwSample.cpp: %dflt',
                'x = 50',
                'y = 0',
                'z = 0'
            ],
            preds: [],
            succes: [ 1 ]
        },
        {
            id: 1,
            stmts: [ 'z = staticinvoke <@%unk/%unk: .division()>(x, y)' ],
            preds: [ 0 ],
            succes: [ 3 ]
        },
        {
            id: 2,
            stmts: [ 'msg = caughtexception: unknown' ],
            preds: [],
            succes: []
        },
        { id: 3, stmts: [], preds: [ 1 ], succes: [ 4 ] },
        { id: 4, stmts: [ 'return 0' ], preds: [ 3 ], succes: [] }
    ]
};

export const THROW_EXPECT_CASE3= {
    blocks: [
        {
            id: 0,
            stmts: [ 'this = this: @throw/throwSample.cpp: %dflt' ],
            preds: [],
            succes: [ 1 ]
        },
        {
            id: 1,
            stmts: [
                "staticinvoke <@%unk/%unk: .cout()>('before throw')",
                'throw 42',
                "staticinvoke <@%unk/%unk: .cout()>('after throw')"
            ],
            preds: [ 0 ],
            succes: [ 4 ]
        },
        {
            id: 2,
            stmts: [ 'e = caughtexception: unknown' ],
            preds: [],
            succes: [3]
        },
        { id: 3, stmts: ["staticinvoke <@%unk/%unk: .cout()>('Caught exception: ', e)"],
            preds: [ 2 ], succes: [] },
        { id: 4, stmts: [], preds: [ 1 ], succes: [5] },
        { id: 5, stmts: ['return'], preds: [ 4 ], succes: [] }
    ]
};