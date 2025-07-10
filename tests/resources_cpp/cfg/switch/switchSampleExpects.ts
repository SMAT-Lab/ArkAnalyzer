export const SWITCH_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'if a == 2'
            ],
            preds: [],
            succes: [ 1, 5 ]
        },
        { id: 1, stmts: [ 'b = 2' ], preds: [ 0 ], succes: [ 2 ] },
        { id: 2, stmts: [ 'b = 3' ], preds: [ 1, 5 ], succes: [ 4 ] },
        { id: 3, stmts: [ 'b = 10' ], preds: [ 5 ], succes: [ 4 ] },
        { id: 4, stmts: [ 'return' ], preds: [ 2, 3 ], succes: [] },
        { id: 5, stmts: [ 'if a == 3' ], preds: [ 0 ], succes: [ 2, 3 ] },
    ]
};

export const SWITCH_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'if a == 2'
            ],
            preds: [],
            succes: [ 1, 5 ]
        },
        { id: 1, stmts: [ 'b = 2' ], preds: [ 0 ], succes: [ 2 ] },
        { id: 2, stmts: [ 'b = 3' ], preds: [ 1, 5 ], succes: [ 4 ] },
        { id: 3, stmts: [ 'b = 10' ], preds: [ 5 ], succes: [ 4 ] },
        { id: 4, stmts: [ 'return' ], preds: [ 2, 3 ], succes: [] },
        { id: 5, stmts: [ 'if a == 3' ], preds: [ 0 ], succes: [ 2, 3 ] },
    ]
};

export const SWITCH_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'if a == 2'
            ],
            preds: [],
            succes: [ 1, 8 ]
        },
        { id: 1, stmts: [ 'b = 2' ], preds: [ 0 ], succes: [ 2 ] },
        { id: 2, stmts: [ 'if b == 1' ], preds: [ 1, 8 ], succes: [ 3, 9 ] },
        { id: 3, stmts: [ 'b = 11' ], preds: [ 2 ], succes: [ 4 ] },
        { id: 4, stmts: [ 'b = 12' ], preds: [ 3, 9 ], succes: [ 5 ] },
        { id: 5, stmts: [ 'b = 100' ], preds: [ 4, 9 ], succes: [ 7 ] },
        { id: 6, stmts: [ 'b = 10' ], preds: [ 8 ], succes: [ 7 ] },
        { id: 7, stmts: [ 'return' ], preds: [ 5, 6 ], succes: [] },
        { id: 8, stmts: [ 'if a == 3' ], preds: [ 0 ], succes: [ 2, 6 ] },
        { id: 9, stmts: [ 'if b == 2' ], preds: [ 2 ], succes: [ 4, 5 ] },
    ]
};

export const SWITCH_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [ 'this = this: @switch/switchSample.cpp: %dflt', 'b = 1', 'i = 0' ],
            preds: [],
            succes: [ 1 ]
        },
        { id: 1, stmts: [ 'if i < 3' ], preds: [ 0, 8 ], succes: [ 2, 7 ] },
        { id: 2, stmts: [ 'if i == 2' ], preds: [ 1 ], succes: [ 3, 9 ] },
        { id: 3, stmts: [ 'b = 2' ], preds: [ 2 ], succes: [ 4 ] },
        { id: 4, stmts: [ 'b = 3' ], preds: [ 3, 9 ], succes: [ 8 ] },
        { id: 5, stmts: [ 'b = 10' ], preds: [ 9 ], succes: [ 6 ] },
        { id: 6, stmts: [ 'b = 100' ], preds: [ 5 ], succes: [ 8 ] },
        { id: 7, stmts: [ 'return' ], preds: [ 1 ], succes: [] },
        { id: 8, stmts: [ 'i = i + 1' ], preds: [ 4, 6 ], succes: [ 1 ] },
        { id: 9, stmts: [ 'if i == 3' ], preds: [ 2 ], succes: [ 4, 5 ] },
    ]
};

export const SWITCH_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [ 'this = this: @switch/switchSample.cpp: %dflt', 'a = 0', 'b = 1' ],
            preds: [],
            succes: [ 1 ]
        },
        { id: 1, stmts: [ 'b = 10' ], preds: [ 0 ], succes: [ 2 ] },
        { id: 2, stmts: [ 'a = 1', 'return' ], preds: [ 1 ], succes: [] },
    ]
};

export const SWITCH_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'a = a + 1'
            ],
            preds: [],
            succes: [ 1 ]
        },
        { id: 1, stmts: [ 'a = 1', 'return' ], preds: [ 0 ], succes: [] },
    ]
};

export const SWITCH_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'if a == 2'
            ],
            preds: [],
            succes: [ 1, 5 ]
        },
        { id: 1, stmts: [ 'b = 2' ], preds: [ 0 ], succes: [ 2 ] },
        { id: 2, stmts: [ 'b = 3' ], preds: [ 1, 5 ], succes: [ 4 ] },
        { id: 3, stmts: [ 'b = 4' ], preds: [ 6 ], succes: [ 4 ] },
        { id: 4, stmts: [ 'return' ], preds: [ 2, 3, 6 ], succes: [] },
        { id: 5, stmts: [ 'if a == 3' ], preds: [ 0 ], succes: [ 2, 6 ] },
        { id: 6, stmts: [ 'if a == 4' ], preds: [ 5 ], succes: [ 3, 4 ] },
    ]
};

export const SWITCH_EXPECT_CASE8 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'if a == 2'
            ],
            preds: [],
            succes: [ 1, 4 ]
        },
        { id: 1, stmts: [ 'b = 3' ], preds: [ 0, 4 ], succes: [ 3 ] },
        { id: 2, stmts: [ 'b = 10' ], preds: [ 4 ], succes: [ 3 ] },
        { id: 3, stmts: [ 'return' ], preds: [ 1, 2 ], succes: [] },
        { id: 4, stmts: [ 'if a == 3' ], preds: [ 0 ], succes: [ 1, 2 ] }
    ]
};

export const SWITCH_EXPECT_CASE9 = {
    blocks: [
        {
            id: 0,
            stmts: [ 'this = this: @switch/switchSample.cpp: %dflt', 'a = 0', 'b = 1' ],
            preds: [],
            succes: [ 1 ]
        },
        { id: 1, stmts: [ 'b = 10' ], preds: [ 0 ], succes: [ 2 ] },
        { id: 2, stmts: [ 'return' ], preds: [ 1 ], succes: [] }
    ]
};

export const SWITCH_EXPECT_CASE10 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'if a == 2'
            ],
            preds: [],
            succes: [ 1, 3 ]
        },
        { id: 1, stmts: [ 'b = 3' ], preds: [ 0, 3 ], succes: [ 2 ] },
        { id: 2, stmts: [ 'return' ], preds: [ 1, 3 ], succes: [] },
        { id: 3, stmts: [ 'if a == 3' ], preds: [ 0 ], succes: [ 1, 2 ] }
    ]
};

export const SWITCH_EXPECT_CASE11 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'if a == 2'
            ],
            preds: [],
            succes: [ 1, 3 ]
        },
        { id: 1, stmts: [ 'b = 3' ], preds: [ 0, 3 ], succes: [ 2 ] },
        { id: 2, stmts: [ 'return' ], preds: [ 1, 3 ], succes: [] },
        { id: 3, stmts: [ 'if a == 3' ], preds: [ 0 ], succes: [ 1, 2 ] }
    ]
};

export const SWITCH_EXPECT_CASE12 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'if a > 1',
                'ConditionalOperatorIfTrue0',
                '%0 = 12',
                'ConditionalOperatorIfFalse0',
                '%0 = 13',
                'ConditionalOperatorEnd0',
                'b = %0',
                'if a == 2'
            ],
            preds: [],
            succes: [ 1, 5 ]
        },
        { id: 1, stmts: [ 'b = 2' ], preds: [ 0 ], succes: [ 4 ] },
        { id: 2, stmts: [ 'b = 3' ], preds: [ 5 ], succes: [ 4 ] },
        { id: 3, stmts: [ 'b = 10' ], preds: [ 5 ], succes: [ 4 ] },
        { id: 4, stmts: [ 'return' ], preds: [ 1, 2, 3 ], succes: [] },
        { id: 5, stmts: [ 'if a == 3' ], preds: [ 0 ], succes: [ 2, 3 ] }
    ]
};

export const SWITCH_EXPECT_CASE13 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @switch/switchSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'if a == 2'
            ],
            preds: [],
            succes: [ 1, 8 ]
        },
        { id: 1, stmts: [ 'b = 2' ], preds: [ 0 ], succes: [ 4 ] },
        { id: 2, stmts: [ 'b = 3' ], preds: [ 8 ], succes: [ 4 ] },
        { id: 3, stmts: [ 'b = 10' ], preds: [ 8 ], succes: [ 4 ] },
        { id: 4, stmts: [ 'if a > 1' ], preds: [ 1, 2, 3 ], succes: [ 5, 6 ] },
        { id: 5, stmts: [ 'b = 12' ], preds: [ 4 ], succes: [ 7 ] },
        { id: 6, stmts: [ 'b = 13' ], preds: [ 4 ], succes: [ 7 ] },
        { id: 7, stmts: [ 'return' ], preds: [ 5, 6 ], succes: [] },
        { id: 8, stmts: [ 'if a == 3' ], preds: [ 0 ], succes: [ 2, 3 ] },
    ]
};


