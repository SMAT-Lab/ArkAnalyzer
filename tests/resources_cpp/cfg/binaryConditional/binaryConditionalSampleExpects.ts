export const BINARY_CONDITIONAL_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'i = 0',
                'j = 0',
                'k = 1',
                '%0 = -i',
                'if %0 != 0'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        { id: 1, stmts: [ 'j = -i' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 2, stmts: [ 'j = k' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 3, stmts: [ 'return j' ], preds: [ 1, 2 ], succes: [] },
    ]
};

export const BINARY_CONDITIONAL_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'c = 2',
                'if a > b'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        { id: 1, stmts: [ 'y = a > b' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 2, stmts: [ 'y = c' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 3, stmts: [ 'return y' ], preds: [ 1, 2 ], succes: [] },
    ]
};

export const BINARY_CONDITIONAL_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'x = 0',
                'y = 0',
                'x = x + 1',
                'if x != 0'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        { id: 1, stmts: [ 'x = x + 1', 'y = x' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 2, stmts: [ 'y = 3' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 3, stmts: [ 'return y' ], preds: [ 1, 2 ], succes: [] },
    ]
};

export const BINARY_CONDITIONAL_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'x = 0',
                'y = 0',
                'x = x + 1',
                'if x != 0'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        { id: 1, stmts: [ 'x = x + 1', 'y = x' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 2, stmts: [ 'y = 3' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 3, stmts: [ 'return y' ], preds: [ 1, 2 ], succes: [] },
    ]
};

export const BINARY_CONDITIONAL_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'i = 8',
                'if i < 0'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        { id: 1, stmts: [ 'j = i < 0' ], preds: [ 0 ], succes: [ 5 ] },
        { id: 2, stmts: [ 'if i > 1' ], preds: [ 0 ], succes: [ 3, 4 ] },
        { id: 3, stmts: [ 'j = i > 1' ], preds: [ 2 ], succes: [ 5 ] },
        { id: 4, stmts: [ 'j = 4' ], preds: [ 2 ], succes: [ 5 ] },
        { id: 5, stmts: [ 'return j' ], preds: [ 1, 3, 4 ], succes: [] },
    ]
};

export const BINARY_CONDITIONAL_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'i = 0',
                'j = 0',
                'k = 1',
                '%0 = i + j',
                '%1 = %0 + k',
                '%2 = %1 + 1',
                'if %2 != 0'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        {
            id: 1,
            stmts: [ '%3 = i + j', '%4 = %3 + k', 'j = %4 + 1' ],
            preds: [ 0 ],
            succes: [ 3 ]
        },
        { id: 2, stmts: [ 'j = k' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 3, stmts: [ 'return j' ], preds: [ 1, 2 ], succes: [] },
    ]
};