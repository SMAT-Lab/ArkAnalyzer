export const OVERLOAD_PRINT_INFO_CASE1_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'x = parameter0: int',
                'this = this: @overload/overloadSample.cpp: %dflt',
                'staticinvoke <@%unk/%unk: .cout()>(x)',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const OVERLOAD_PRINT_INFO_CASE2_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'x = parameter0: char',
                'this = this: @overload/overloadSample.cpp: %dflt',
                'staticinvoke <@%unk/%unk: .cout()>(x)',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const OVERLOAD_PRINT_INFO_CASE3_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'x = parameter0: int',
                'y = parameter1: char',
                'this = this: @overload/overloadSample.cpp: %dflt',
                "staticinvoke <@%unk/%unk: .cout()>(x, ' ', y)",
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const OVERLOAD_CLASS_PERSON_EXPECT = {
    fields: [
        'name',
        'age'
    ],
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
                        "this.<@overload/overloadSample.cpp: Person.name> = 'Unknown'",
                        'this.<@overload/overloadSample.cpp: Person.age> = 0',
                        "staticinvoke <@%unk/%unk: .cout()>('Default constructor called')",
                        'return this'
                    ],
                    preds: [],
                    succes: []
                }
            ]
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
                        "staticinvoke <@%unk/%unk: .cout()>('Constructor with all parameters called')",
                        'return this'
                    ],
                    preds: [],
                    succes: []
                }
            ]
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
                        "staticinvoke <@%unk/%unk: .cout()>('Constructor with name called')",
                        'return this'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'printInfo()',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @overload/overloadSample.cpp: Person',
                        '%0 = this.<@overload/overloadSample.cpp: Person.name>',
                        '%1 = this.<@overload/overloadSample.cpp: Person.age>',
                        "staticinvoke <@%unk/%unk: .cout()>('Name: ', %0, ', Age: ', %1)",
                        'return'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        }
    ]
};

export const OVERLOAD_MAIN_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @overload/overloadSample.cpp: %dflt',
                'staticinvoke <@%unk/%unk: .printInfo()>(1)',
                "staticinvoke <@%unk/%unk: .printInfo()>('A')",
                "staticinvoke <@%unk/%unk: .printInfo()>(1, 'A')",
                '%0 = new @overload/overloadSample.cpp: Person',
                'instanceinvoke %0.<@overload/overloadSample.cpp: Person.constructor()>()',
                'p1 = %0',
                '%1 = new @overload/overloadSample.cpp: Person',
                "instanceinvoke %1.<@overload/overloadSample.cpp: Person.constructor()>('Alice', 30)",
                'p2 = %1',
                '%2 = new @overload/overloadSample.cpp: Person',
                "instanceinvoke %2.<@overload/overloadSample.cpp: Person.constructor()>('Charlie')",
                'p3 = %2',
                'instanceinvoke p1.<@overload/overloadSample.cpp: Person.printInfo()>()',
                'instanceinvoke p2.<@overload/overloadSample.cpp: Person.printInfo()>()',
                'instanceinvoke p3.<@overload/overloadSample.cpp: Person.printInfo()>()',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};