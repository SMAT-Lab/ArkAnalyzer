export const COMPOUND_LITERAL_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                "this = this: @compoundLiteral/compoundLiteralExpr.cpp: %dflt",
                "%0 = new @compoundLiteral/compoundLiteralExpr.cpp: Point",
                "instanceinvoke %0.<@compoundLiteral/compoundLiteralExpr.cpp: Point.constructor()>(5, 8, 'c')",
                "x = 5",
                "y = 8",
                "name = 'c'",
                "%1 = newarray (struct Point[][][])[3]",
                "%1[0] = x",
                "%1[1] = y",
                "%1[2] = name",
                "q = %0",
                "return",
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
                "this = this: @compoundLiteral/compoundLiteralExpr.cpp: %dflt",
                "%0 = new @compoundLiteral/compoundLiteralExpr.cpp: Color",
                "instanceinvoke %0.<@compoundLiteral/compoundLiteralExpr.cpp: Color.constructor()>()",
                "%1 = newarray (struct Color[][][])[3]",
                "%1[0] = 255",
                "%1[1] = 128",
                "%1[2] = 0",
                "c1 = %0",
                "return",
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
                "this = this: @compoundLiteral/compoundLiteralExpr.cpp: %dflt",
                "%0 = new @compoundLiteral/compoundLiteralExpr.cpp: Circle",
                "instanceinvoke %0.<@compoundLiteral/compoundLiteralExpr.cpp: Circle.constructor()>()",
                "%1 = new @compoundLiteral/compoundLiteralExpr.cpp: Point",
                "instanceinvoke %1.<@compoundLiteral/compoundLiteralExpr.cpp: Point.constructor()>()",
                "%2 = newarray (Point[][])[2]",
                "%2[0] = 5",
                "%2[1] = 5",
                "%3 = newarray (Circle[][])[2]",
                "%3[0] = %1",
                "%3[1] = 10.5",
                "circ1 = %0",
                "return",
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
                "this = this: @compoundLiteral/compoundLiteralExpr.cpp: %dflt",
                "%0 = new @compoundLiteral/compoundLiteralExpr.cpp: Person",
                "instanceinvoke %0.<@compoundLiteral/compoundLiteralExpr.cpp: Person.constructor()>()",
                "%1 = newarray (Person[][])[2]",
                "%1[0] = 'Alice'",
                "%1[1] = 30",
                "p2 = %0",
                "return",
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
                "this = this: @compoundLiteral/compoundLiteralExpr.cpp: %dflt",
                "%0 = new @compoundLiteral/compoundLiteralExpr.cpp: ShoppingList",
                "instanceinvoke %0.<@compoundLiteral/compoundLiteralExpr.cpp: ShoppingList.constructor()>()",
                "%1 = new @%unk/%unk: std::vector<std::basic_string<char>>",
                "%2 = newarray (std::basic_string<char>[])[3]",
                "%2[0] = '苹果'",
                "%2[1] = '牛奶'",
                "%2[2] = '面包'",
                "instanceinvoke %1.<@%unk/%unk: std::vector<std::basic_string<char>>.constructor()>(%2)",
                "%3 = newarray (ShoppingList[][])[2]",
                "%3[0] = %1",
                "%3[1] = 100.5",
                "list = %0",
                "return",
            ],
            preds: [],
            succes: []
        }
    ]
};
