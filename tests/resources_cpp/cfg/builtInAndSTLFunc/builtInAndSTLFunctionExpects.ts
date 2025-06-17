export const BUILT_IN_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @builtInAndSTLFunc/builtInAndSTLFunction.cpp: %dflt',
                "t1 = staticinvoke <@%unk/%unk: .typeid()>('int')",
                "t2 = staticinvoke <@%unk/%unk: .typeid()>('std::string')",
                'a = undefined',
                't3 = staticinvoke <@%unk/%unk: .typeid()>(a)',
                '%0 = &a',
                't4 = staticinvoke <@%unk/%unk: .typeid()>(%0)',
                '%1 = new @builtInAndSTLFunc/builtInAndSTLFunction.cpp: MyStruct',
                'instanceinvoke %1.<@builtInAndSTLFunc/builtInAndSTLFunction.cpp: MyStruct.constructor()>()',
                's = %1',
                't5 = staticinvoke <@%unk/%unk: .typeid()>(s)',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const BUILT_IN_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @builtInAndSTLFunc/builtInAndSTLFunction.cpp: %dflt',
                'arr2 = undefined',
                "rank2 = staticinvoke <@%unk/%unk: .__array_rank()>('int[5][3]')",
                "dim1_size = staticinvoke <@%unk/%unk: .__array_extent()>('int[5][3]', 1)",
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const BUILT_IN_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @builtInAndSTLFunc/builtInAndSTLFunction.cpp: %dflt',
                '%0 = staticinvoke <@%unk/%unk: .foo()>()',
                'b = staticinvoke <@%unk/%unk: .CXXNoexceptExpr()>(%0)',
                'return 0'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const BUILT_IN_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @builtInAndSTLFunc/builtInAndSTLFunction.cpp: %dflt',
                '%0 = &counter',
                'staticinvoke <@%unk/%unk: .atomic_fetch_add()>(%0, 1)',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};