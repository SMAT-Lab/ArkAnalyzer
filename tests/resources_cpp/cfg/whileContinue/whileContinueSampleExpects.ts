export const WHILE_CONTINUE_EXPECT_MAIN = {
    blocks: [
        {
            id: 0,
            stmts: [
                'num = parameter0: int',
                'this = this: @whileContinue/whileContinueSample.cpp: %dflt'
            ],
            preds: [],
            succes: [ 1 ]
        },
        {
            id: 1,
            stmts: [ 'if num > 0' ],
            preds: [ 0, 3, 4 ],
            succes: [ 2, 5 ]
        },
        { id: 2, stmts: [ 'if num == 2' ], preds: [ 1 ], succes: [ 3, 4 ] },
        { id: 3, stmts: [ 'num = num + 1' ], preds: [ 2 ], succes: [ 1 ] },
        { id: 4, stmts: [ 'num = num - 2' ], preds: [ 2 ], succes: [ 1 ] },
        { id: 5, stmts: [ 'return 0' ], preds: [ 1 ], succes: [] }
    ]
};