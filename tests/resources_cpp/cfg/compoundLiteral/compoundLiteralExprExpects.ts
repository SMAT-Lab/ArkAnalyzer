/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const COMPOUND_LITERAL_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @compoundLiteral/compoundLiteralExpr.cpp: %dflt',
                '%0 = new @compoundLiteral/compoundLiteralExpr.cpp: Point',
                "instanceinvoke %0.<@compoundLiteral/compoundLiteralExpr.cpp: Point.constructor()>(5, 8, 'c')",
                '%0.<@compoundLiteral/compoundLiteralExpr.cpp: Point.x> = 5',
                '%0.<@compoundLiteral/compoundLiteralExpr.cpp: Point.y> = 8',
                "%0.<@compoundLiteral/compoundLiteralExpr.cpp: Point.name> = 'c'",
                'q = %0',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
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
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
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
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const COMPOUND_LITERAL_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @compoundLiteral/compoundLiteralExpr.cpp: %dflt',
                '%0 = new @compoundLiteral/compoundLiteralExpr.cpp: Person',
                "instanceinvoke %0.<@compoundLiteral/compoundLiteralExpr.cpp: Person.constructor()>('Alice', 30)",
                'p2 = %0',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const COMPOUND_LITERAL_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @compoundLiteral/compoundLiteralExpr.cpp: %dflt',
                '%0 = new @compoundLiteral/compoundLiteralExpr.cpp: ShoppingList',
                '%1 = new @%unk/%unk: std::vector<std::basic_string<char>>',
                '%2 = newarray (string[])[3]',
                "%2[0] = '苹果'",
                "%2[1] = '牛奶'",
                "%2[2] = '面包'",
                'instanceinvoke %1.<@%unk/%unk: std::vector<std::basic_string<char>>.constructor()>(%2)',
                'instanceinvoke %0.<@compoundLiteral/compoundLiteralExpr.cpp: ShoppingList.constructor()>(%1, 100.5)',
                'list = %0',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};
