export const NULLSTMT_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [ 'this = this: @nullStmt/nullStmtSample.cpp: %dflt', 'return' ],
            preds: [],
            succes: []
        },
    ]
};

export const NULLSTMT_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @nullStmt/nullStmtSample.cpp: %dflt',
                'if true != 0'
            ],
            preds: [],
            succes: [ 1 ]
        },
        { id: 1, stmts: [ 'if false != 0' ], preds: [ 0 ], succes: [ 2 ] },
        { id: 2, stmts: [ 'return' ], preds: [ 1 ], succes: [] },
    ]
};

export const NULLSTMT_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [ 'this = this: @nullStmt/nullStmtSample.cpp: %dflt', 'i = 0' ],
            preds: [],
            succes: [ 1 ]
        },
        { id: 1, stmts: [ 'if i < 2' ], preds: [ 0, 3 ], succes: [ 3, 2 ] },
        { id: 2, stmts: [ 'return' ], preds: [ 1 ], succes: [] },
        { id: 3, stmts: [ 'i = i + 1' ], preds: [ 1 ], succes: [ 1 ] },
    ]
};

export const NULLSTMT_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [ 'this = this: @nullStmt/nullStmtSample.cpp: %dflt', 'count = 3' ],
            preds: [],
            succes: [ 1 ]
        },
        {
            id: 1,
            stmts: [ 'count = count - 1', 'if count > 0' ],
            preds: [ 0, 1 ],
            succes: [ 1, 4 ]
        },
        { id: 2, stmts: [ 'if i < 5' ], preds: [ 4, 5 ], succes: [ 5, 3 ] },
        { id: 3, stmts: [ 'return' ], preds: [ 2 ], succes: [] },
        { id: 4, stmts: [ 'i = 0' ], preds: [ 1 ], succes: [ 2 ] },
        { id: 5, stmts: [ 'i = i + 1' ], preds: [ 2 ], succes: [ 2 ] },
    ]
};

export const NULLSTMT_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [ 'this = this: @nullStmt/nullStmtSample.cpp: %dflt', 'option = 2' ],
            preds: [],
            succes: [ 1 ]
        },
        { id: 1, stmts: [ 'return' ], preds: [ 0 ], succes: [] },
    ]
};

export const NULLSTMT_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @nullStmt/nullStmtSample.cpp: %dflt',
                'x = 5',
                'x = x - 1',
                'if x > 0'
            ],
            preds: [ 0 ],
            succes: [ 0, 1 ]
        },
        { id: 1, stmts: [ 'return' ], preds: [ 0 ], succes: [] },
    ]
};

export const NULLSTMT_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: [ 'this = this: @nullStmt/nullStmtSample.cpp: %dflt' ],
            preds: [],
            succes: [ 1 ]
        },
        {
            id: 1,
            stmts: [ 'if true == true' ],
            preds: [ 0, 1 ],
            succes: [ 1, 2 ]
        },
        { id: 2, stmts: [ 'return' ], preds: [ 1 ], succes: [] },
    ]
};

export const NULLSTMT_EXPECT_CASE8 = {
    blocks: [
        {
            id: 0,
            stmts: [ 'this = this: @nullStmt/nullStmtSample.cpp: %dflt' ],
            preds: [],
            succes: [ 1 ]
        },
        { id: 1, stmts: [ 'if 1 != 0' ], preds: [ 0, 1 ], succes: [ 1, 2 ] },
        { id: 2, stmts: [ 'return' ], preds: [ 1 ], succes: [] },
    ]
};

export const NULLSTMT_EXPECT_CASE9 = {
    blocks: [
        {
            id: 0,
            stmts: [ 'this = this: @nullStmt/nullStmtSample.cpp: %dflt', 'i = 0' ],
            preds: [],
            succes: [ 1 ]
        },
        { id: 1, stmts: [ 'if i < 10' ], preds: [ 0, 2 ], succes: [ 2, 3 ] },
        { id: 2, stmts: [ 'i = i + 1' ], preds: [ 1 ], succes: [ 1 ] },
        { id: 3, stmts: [ 'return' ], preds: [ 1 ], succes: [] },
    ]
};

export const NULLSTMT_EXPECT_CASE10 = {
    blocks: [
        {
            id: 0,
            stmts: [ 'this = this: @nullStmt/nullStmtSample.cpp: %dflt', 'i = 0' ],
            preds: [],
            succes: [ 1 ]
        },
        { id: 1, stmts: [ 'if i < 2' ], preds: [ 0, 1 ], succes: [ 1, 2 ] },
        { id: 2, stmts: [ 'return' ], preds: [ 1 ], succes: [] },
    ]
};

export const NULLSTMT_EXPECT_CASE11 = {
    blocks: [
        {
            id: 0,
            stmts: [ 'this = this: @nullStmt/nullStmtSample.cpp: %dflt', 'i = 0' ],
            preds: [],
            succes: [ 1 ]
        },
        {
            id: 1,
            stmts: [ 'if true == true' ],
            preds: [ 0, 1 ],
            succes: [ 1, 2 ]
        },
        { id: 2, stmts: [ 'return' ], preds: [ 1 ], succes: [] },
    ]
};
