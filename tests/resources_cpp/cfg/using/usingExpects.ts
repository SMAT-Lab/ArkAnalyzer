export const USING_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                "staticinvoke <@%unk/%unk: .cout()>('[test_using_namespace] hello')",
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const USING_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                'using std::cout = std',
                'using std::endl = std',
                "staticinvoke <@%unk/%unk: .cout()>('[test_using_declaration] hello')",
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const USING_EXPECT_CASE3= {
    blocks: [
        {
            id: 0,
            stmts: [
                "this = this: @using/usingcase.cpp: %dflt",
                "%0 = new @using/usingcase.cpp: Derived",
                "instanceinvoke %0.<@using/usingcase.cpp: Derived.constructor()>()",
                "d = %0",
                "instanceinvoke d.<@using/usingcase.cpp: Derived.foo()>(1)",
                "instanceinvoke d.<@using/usingcase.cpp: Derived.foo()>(1.23)",
                "return",
            ],
            preds: [],
            succes: []
        }
    ]
};

export const USING_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @using/usingcase.cpp: %dflt',
                'using Color::Red = using Red::Red',
                'c = Red',
                'if c == Red'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        {
            id: 1,
            stmts: [ "staticinvoke <@%unk/%unk: .cout()>('[test_using_enum_member] Red\\n')" ],
            preds: [ 0 ],
            succes: [ 2 ]
        },
        {
            id: 2,
            stmts: [ 'return' ],
            preds: [ 1, 0 ],
            succes: []
        }
    ]
};