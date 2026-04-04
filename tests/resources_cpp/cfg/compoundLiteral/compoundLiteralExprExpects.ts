/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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
                '%0 = AggregateExpr(%0.<@compoundLiteral/compoundLiteralExpr.cpp: Point.x> = 5,%0.<@compoundLiteral/compoundLiteralExpr.cpp: Point.y> = 8,%0.<@compoundLiteral/compoundLiteralExpr.cpp: Point.name> = c)',
                'q = %0',
                '%1 = AggregateExpr(1,2,3,4,5)',
                'arr = %1',
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
                '%0 = AggregateExpr(255,128,0)',
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
                '%1 = AggregateExpr(5,5)',
                '%0 = AggregateExpr(%1,10.5)',
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
                '%0 = AggregateExpr(\'Alice\',30)',
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
                '%1 = newarray (string[3])',
                '%1[0] = \'apple\'',
                '%1[1] = \'milk\'',
                '%1[2] = \'bread\'',
                '%0 = AggregateExpr(%1,100.5)',
                'list = %0',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};
