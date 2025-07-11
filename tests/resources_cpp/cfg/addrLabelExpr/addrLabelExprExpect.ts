export const ADDRLABEL_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @addrLabelExpr/addrLabelExpr.cpp: %dflt',
                'ptr = my_label'
            ],
            preds: [],
            succes: [ 1 ]
        },
        { id: 1, stmts: [ 'return' ], preds: [ 0 ], succes: [  ] },
    ]
};

export const ADDRLABEL_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @addrLabelExpr/addrLabelExpr.cpp: %dflt',
                'ptr = my_label',
                'x = 0',
                'if x == 0'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        { id: 1, stmts: [], preds: [ 0 ], succes: [] },
        { id: 2, stmts: [ 'return' ], preds: [ 0 ], succes: [] },
    ]
};

export const ADDRLABEL_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @addrLabelExpr/addrLabelExpr.cpp: %dflt',
                'ptr1 = my_label1',
                'ptr2 = my_label2',
                'choice = 0'
            ],
            preds: [],
            succes: [ 1 ]
        },
        { id: 1, stmts: [ 'x = 1' ], preds: [ 0 ], succes: [] }
    ]
};