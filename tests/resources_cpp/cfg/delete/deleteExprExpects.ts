export const DELETE_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @delete/deleteExpr.cpp: %dflt',
                '%0 = new @%unk/%unk: int',
                'instanceinvoke %0.<@%unk/%unk: int.constructor()>()',
                'a = %0',
                '%1 = delete a',
                'a = nullptr',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const DELETE_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @delete/deleteExpr.cpp: %dflt',
                '%0 = newarray (int)[10]',
                'arr = %0',
                '%1 = delete arr',
                'arr = nullptr',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const DELETE_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @delete/deleteExpr.cpp: %dflt',
                '%0 = new @delete/deleteExpr.cpp: Animal',
                'instanceinvoke %0.<@delete/deleteExpr.cpp: Animal.constructor()>()',
                'a = %0',
                '%1 = delete a',
                'a = nullptr',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const DELETE_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @delete/deleteExpr.cpp: %dflt',
                '%0 = new @delete/deleteExpr.cpp: myStruct',
                'instanceinvoke %0.<@delete/deleteExpr.cpp: myStruct.constructor()>()',
                'ss = %0',
                '%1 = delete ss-><@delete/deleteExpr.cpp: myStruct.a>',
                '%2 = delete ss',
                'ss = nullptr',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};