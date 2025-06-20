export const TEMPLATE_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'a = parameter0: T = int',
                'b = parameter1: T = int',
                'this = this: @template/template.cpp: %dflt',
                'if a > b'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        { id: 1, stmts: [ 'temp = a' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 2, stmts: [ 'temp = b' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 3, stmts: [ 'return temp' ], preds: [ 1, 2 ], succes: [] },
    ]
};

export const TEMPLATE_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'a = parameter0: Q',
                'b = parameter1: Q',
                'this = this: @template/template.cpp: %dflt',
                'if a > b'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        { id: 1, stmts: [ 'temp = a' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 2, stmts: [ 'temp = b' ], preds: [ 0 ], succes: [ 3 ] },
        { id: 3, stmts: [ 'return 2' ], preds: [ 1, 2 ], succes: [] },
    ]
};

export const TEMPLATE_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'a = parameter0: T1',
                'b = parameter1: T2',
                'this = this: @template/template.cpp: %dflt',
                `%0 = staticinvoke <@%unk/%unk: .cout()>('"First:"')`,
                '%1 = %0 << a',
                `%2 = %1 << '", Second"'`,
                '%3 = %2 << b',
                '%4 = %3 << endl',
                'return'
            ],
            preds: [],
            succes: []
        },
    ]
};
export const TEMPLATE_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @template/template.cpp: %dflt',
                'd = 2.718',
                'staticinvoke <@%unk/%unk: .undefined()>(destroy_ptr)',
                'return 0'
            ],
            preds: [],
            succes: []
        },
    ]
};

export const TEMPLATE_MYCONTAINER_CLASS = {
    fields: [
        'data1',
        'data2',
    ],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'instanceinvoke this.<@template/template.cpp: MyContainer.%instInit()>()',
                        'value1 = parameter0: T',
                        'value2 = parameter1: T',
                        'this = this: @template/template.cpp: MyContainer',
                        'return this'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'print',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @template/template.cpp: MyContainer',
                        '%0 = this.<@template/template.cpp: MyContainer.data1>',
                        '%1 = cout << %0',
                        'return'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'sum',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @template/template.cpp: MyContainer',
                        '%0 = this.<@template/template.cpp: MyContainer.data1>',
                        '%1 = this.<@template/template.cpp: MyContainer.data2>',
                        '%2 = %0 + %1',
                        'return %2'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        }
    ]
};