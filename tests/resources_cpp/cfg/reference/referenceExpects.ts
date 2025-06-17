export const REFERENCE_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'b = parameter0: double&',
                'this = this: @reference/reference.cpp: %dflt',
                'a = 1',
                'flag = true',
                'f = 1.02',
                "c = 'x'",
                'ref_a = a',
                'ref_flag = flag',
                'ref_f = f',
                'ref_c = c',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const REFERENCE_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @reference/reference.cpp: %dflt',
                'ptr = nullptr',
                'ref_to_ptr = ptr',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const REFERENCE_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @reference/reference.cpp: %dflt',
                '%0 = new @reference/reference.cpp: MyClass',
                'instanceinvoke %0.<@reference/reference.cpp: MyClass.constructor()>(5)',
                'a = %0',
                'b = a',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const REFERENCE_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @reference/reference.cpp: %dflt',
                'x = 1',
                'y = 2',
                'rr1 = 10',
                'rr2 = x + y',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};