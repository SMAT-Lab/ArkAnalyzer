export const COMPOUND_LITERAL_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @compoundLiteral/compoundLiteralExpr.cpp: %dflt',
                '%0 = new @compoundLiteral/compoundLiteralExpr.cpp: Point',
                "instanceinvoke %0.<@compoundLiteral/compoundLiteralExpr.cpp: Point.constructor()>(5, 8, 'c')",
                'q = %0',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const COMPOUND_LITERAL_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @compoundLiteral/compoundLiteralExpr.cpp: %dflt',
                '%0 = new @compoundLiteral/compoundLiteralExpr.cpp: Color',
                'instanceinvoke %0.<@compoundLiteral/compoundLiteralExpr.cpp: Color.constructor()>(255, 128, 0)',
                'c1 = %0',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const COMPOUND_LITERAL_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @compoundLiteral/compoundLiteralExpr.cpp: %dflt',
                '%0 = new @compoundLiteral/compoundLiteralExpr.cpp: Circle',
                '%1 = new @compoundLiteral/compoundLiteralExpr.cpp: Point',
                'instanceinvoke %1.<@compoundLiteral/compoundLiteralExpr.cpp: Point.constructor()>(5, 5)',
                'instanceinvoke %0.<@compoundLiteral/compoundLiteralExpr.cpp: Circle.constructor()>(%1, 10.5)',
                'circ1 = %0',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const COMPOUND_LITERAL_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @compoundLiteral/compoundLiteralExpr.cpp: %dflt',
                '%0 = new @compoundLiteral/compoundLiteralExpr.cpp: Person',
                `instanceinvoke %0.<@compoundLiteral/compoundLiteralExpr.cpp: Person.constructor()>('"Alice"', 30)`,
                'p2 = %0',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const COMPOUND_LITERAL_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @compoundLiteral/compoundLiteralExpr.cpp: %dflt',
                '%0 = new @compoundLiteral/compoundLiteralExpr.cpp: ShoppingList',
                '%1 = new @%unk/%unk: std::vector<std::basic_string<char>>',
                '%2 = newarray (std::basic_string<char>[])[3]',
                `%2[0] = '"苹果"'`,
                `%2[1] = '"牛奶"'`,
                `%2[2] = '"面包"'`,
                'instanceinvoke %1.<@%unk/%unk: std::vector<std::basic_string<char>>.constructor()>(%2)',
                'instanceinvoke %0.<@compoundLiteral/compoundLiteralExpr.cpp: ShoppingList.constructor()>(%1, 100.5)',
                'list = %0',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};
