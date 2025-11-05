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

export const OVERLOAD_PRINT_INFO_CASE1_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: ['x = parameter0: int', 'this = this: @overload/overloadSample.cpp: %dflt', 'staticinvoke <@%unk/%unk: .cout()>(x)', 'return'],
            preds: [],
            succes: [],
        },
    ],
};

export const OVERLOAD_PRINT_INFO_CASE2_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: ['x = parameter0: char', 'this = this: @overload/overloadSample.cpp: %dflt', 'staticinvoke <@%unk/%unk: .cout()>(x)', 'return'],
            preds: [],
            succes: [],
        },
    ],
};

export const OVERLOAD_PRINT_INFO_CASE3_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'x = parameter0: int',
                'y = parameter1: char',
                'this = this: @overload/overloadSample.cpp: %dflt',
                'staticinvoke <@%unk/%unk: .cout()>(x, \' \', y)',
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const OVERLOAD_CLASS_PERSON_EXPECT = {
    fields: ['name', 'age'],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @overload/overloadSample.cpp: Person',
                        'instanceinvoke this.<@overload/overloadSample.cpp: Person.%instInit()>()',
                        'this.<@overload/overloadSample.cpp: Person.name> = \'Unknown\'',
                        'this.<@overload/overloadSample.cpp: Person.age> = 0',
                        'staticinvoke <@%unk/%unk: .cout()>(\'Default constructor called\')',
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'constructor(string&, int)',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'n = parameter0: string&',
                        'a = parameter1: int',
                        'this = this: @overload/overloadSample.cpp: Person',
                        'instanceinvoke this.<@overload/overloadSample.cpp: Person.%instInit()>()',
                        'this.<@overload/overloadSample.cpp: Person.name> = n',
                        'this.<@overload/overloadSample.cpp: Person.age> = a',
                        'staticinvoke <@%unk/%unk: .cout()>(\'Constructor with all parameters called\')',
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'constructor(string&)',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'n = parameter0: string&',
                        'this = this: @overload/overloadSample.cpp: Person',
                        'instanceinvoke this.<@overload/overloadSample.cpp: Person.%instInit()>()',
                        'this.<@overload/overloadSample.cpp: Person.name> = n',
                        'this.<@overload/overloadSample.cpp: Person.age> = 0',
                        'staticinvoke <@%unk/%unk: .cout()>(\'Constructor with name called\')',
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'PrintInfo()',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @overload/overloadSample.cpp: Person',
                        '%0 = this.<@overload/overloadSample.cpp: Person.name>',
                        '%1 = this.<@overload/overloadSample.cpp: Person.age>',
                        'staticinvoke <@%unk/%unk: .cout()>(\'Name: \', %0, \', Age: \', %1)',
                        'return',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};

export const VECTOR_CLASS_EXPECT = {
    fields: ['x', 'y'],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'x = parameter0: double',
                        'y = parameter1: double',
                        'this = this: @overload/overloadSample.cpp: Vector',
                        'instanceinvoke this.<@overload/overloadSample.cpp: Vector.%instInit()>()',
                        'if x == undefined',
                    ],
                    preds: [],
                    succes: [1, 2],
                },
                { id: 1, stmts: ['x = 0'], preds: [0], succes: [2] },
                {
                    id: 2,
                    stmts: ['if y == undefined'],
                    preds: [1, 0],
                    succes: [3, 4],
                },
                { id: 3, stmts: ['y = 0'], preds: [2], succes: [4] },
                {
                    id: 4,
                    stmts: [
                        'this.<@overload/overloadSample.cpp: Vector.x> = x',
                        'this.<@overload/overloadSample.cpp: Vector.y> = y',
                        'return this',
                    ],
                    preds: [3, 2],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'operator+',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'other = parameter0: @overload/overloadSample.cpp: Vector&',
                        'this = this: @overload/overloadSample.cpp: Vector',
                        '%0 = new @overload/overloadSample.cpp: Vector',
                        '%1 = this.<@overload/overloadSample.cpp: Vector.x>',
                        '%2 = other.<@overload/overloadSample.cpp: Vector.x>',
                        '%3 = %1 + %2',
                        '%4 = this.<@overload/overloadSample.cpp: Vector.y>',
                        '%5 = other.<@overload/overloadSample.cpp: Vector.y>',
                        '%6 = %4 + %5',
                        'instanceinvoke %0.<@overload/overloadSample.cpp: Vector.constructor(double, double)>(%3, %6)',
                        'return %0',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'operator++',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @overload/overloadSample.cpp: Vector',
                        '%0 = this.<@overload/overloadSample.cpp: Vector.x>',
                        '%0 = %0 + 1',
                        '%1 = this.<@overload/overloadSample.cpp: Vector.y>',
                        '%1 = %1 + 1',
                        '%2 = *this',
                        'return %2',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'operator()',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'num1 = parameter0: int',
                        'num2 = parameter1: int',
                        'this = this: @overload/overloadSample.cpp: Vector',
                        '%0 = this.<@overload/overloadSample.cpp: Vector.x>',
                        '%1 = %0 + num1',
                        'this.<@overload/overloadSample.cpp: Vector.x> = %1',
                        '%2 = this.<@overload/overloadSample.cpp: Vector.y>',
                        '%3 = %2 + num2',
                        'this.<@overload/overloadSample.cpp: Vector.y> = %3',
                        '%4 = *this',
                        'return %4',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'operator<<',
            blocks: undefined,
        },
        {
            methodName: 'operator>>',
            blocks: undefined,
        },
    ],
};

export const OVERLOAD_COUT_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'os = parameter0: std::ostream&',
                'v = parameter1: @overload/overloadSample.cpp: Vector&',
                'this = this: @overload/overloadSample.cpp: %dflt',
                '%0 = v.<@overload/overloadSample.cpp: Vector.x>',
                '%1 = v.<@overload/overloadSample.cpp: Vector.y>',
                'staticinvoke <@%unk/%unk: .os()>(\'(\', %0, \', \', %1, \')\')',
                'return os',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const OVERLOAD_CIN_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'is = parameter0: std::istream&',
                'v = parameter1: @overload/overloadSample.cpp: Vector&',
                'this = this: @overload/overloadSample.cpp: %dflt',
                '%0 = v.<@overload/overloadSample.cpp: Vector.x>',
                '%1 = v.<@overload/overloadSample.cpp: Vector.y>',
                'staticinvoke <@%unk/%unk: .is()>(%0, %1)',
                'return is',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const OVERLOAD_USER_DEFINED_LITERAL_NUMBER_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: ['km = parameter0: long double', 'this = this: @overload/overloadSample.cpp: %dflt', '%0 = km * 1000', 'return %0'],
            preds: [],
            succes: [],
        },
    ],
};

export const OVERLOAD_USER_DEFINED_LITERAL_CHAR_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: ['c = parameter0: char', 'this = this: @overload/overloadSample.cpp: %dflt', 'return c'],
            preds: [],
            succes: [],
        },
    ],
};

export const OVERLOAD_MAIN_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @overload/overloadSample.cpp: %dflt',
                'staticinvoke <@overload/overloadSample.cpp: %dflt.PrintInfo(int)>(1)',
                'staticinvoke <@overload/overloadSample.cpp: %dflt.PrintInfo(int)>(\'A\')',
                'staticinvoke <@overload/overloadSample.cpp: %dflt.PrintInfo(int)>(1, \'A\')',
                '%0 = new @overload/overloadSample.cpp: Person',
                'instanceinvoke %0.<@overload/overloadSample.cpp: Person.constructor()>()',
                'p1 = %0',
                '%1 = new @overload/overloadSample.cpp: Person',
                'instanceinvoke %1.<@overload/overloadSample.cpp: Person.constructor()>(\'Alice\', 30)',
                'p2 = %1',
                '%2 = new @overload/overloadSample.cpp: Person',
                'instanceinvoke %2.<@overload/overloadSample.cpp: Person.constructor(string&)>(\'Charlie\')',
                'p3 = %2',
                'instanceinvoke p1.<@overload/overloadSample.cpp: Person.PrintInfo()>()',
                'instanceinvoke p2.<@overload/overloadSample.cpp: Person.PrintInfo()>()',
                'instanceinvoke p3.<@overload/overloadSample.cpp: Person.PrintInfo()>()',
                '%3 = new @overload/overloadSample.cpp: Vector',
                'instanceinvoke %3.<@overload/overloadSample.cpp: Vector.constructor(double, double)>(1, 2)',
                'a = %3',
                '%4 = new @overload/overloadSample.cpp: Vector',
                'instanceinvoke %4.<@overload/overloadSample.cpp: Vector.constructor(double, double)>(3, 4)',
                'b = %4',
                'c = instanceinvoke a.<@overload/overloadSample.cpp: Vector.operator+(@overload/overloadSample.cpp: Vector&)>(b)',
                'instanceinvoke c.<@overload/overloadSample.cpp: Vector.operator++()>()',
                'instanceinvoke c.<@overload/overloadSample.cpp: Vector.operator()(int, int)>(1, 1)',
                '%5 = new @overload/overloadSample.cpp: Vector',
                'instanceinvoke %5.<@overload/overloadSample.cpp: Vector.constructor(double, double)>()',
                'v = %5',
                'staticinvoke <@overload/overloadSample.cpp: %dflt.operator>>(std::istream&, @overload/overloadSample.cpp: Vector&)>(cin, v)',
                'staticinvoke <@%unk/%unk: .cout()>(\'Vector: \')',
                'staticinvoke <@overload/overloadSample.cpp: %dflt.operator<<(std::ostream&, @overload/overloadSample.cpp: Vector&)>(cout, v)',
                'staticinvoke <@%unk/%unk: .cout()>(\' ;\')',
                'staticinvoke <@overload/overloadSample.cpp: %dflt.operator<<(std::ostream&, @overload/overloadSample.cpp: Vector&)>(cout, v)',
                'staticinvoke <@%unk/%unk: .cout()>(\'aaa\')',
                'distance = staticinvoke <@overload/overloadSample.cpp: %dflt.operator""_km(long double)>(5.3)',
                `ch = staticinvoke <@overload/overloadSample.cpp: %dflt.operator""_c(char)>('a')`,
                'return',
            ],
            preds: [],
            succes: [],
        },
    ],
};
