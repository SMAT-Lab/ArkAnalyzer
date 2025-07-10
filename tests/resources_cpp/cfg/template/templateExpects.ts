export const TEMPLATE_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'a = parameter0: T = int',
                'b = parameter1: T = int',
                'this = this: @template/template.cpp: %dflt',
                'if a > b',
                'ConditionalOperatorIfTrue0',
                '%0 = a',
                'ConditionalOperatorIfFalse0',
                '%0 = b',
                'ConditionalOperatorEnd0',
                'temp = %0',
                'return temp'
            ],
            preds: [],
            succes: []
        },
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
                'if a > b',
                'ConditionalOperatorIfTrue0',
                '%0 = a',
                'ConditionalOperatorIfFalse0',
                '%0 = b',
                'ConditionalOperatorEnd0',
                'temp = %0',
                'return 2'
            ],
            preds: [],
            succes: []
        },
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
                `%0 = staticinvoke <@%unk/%unk: .cout()>('First:')`,
                '%1 = %0 << a',
                `%2 = %1 << ', Second'`,
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
                "this = this: @template/template.cpp: %dflt",
                "d = 2.718",
                "%0 = &d",
                "staticinvoke <@%unk/%unk: .destroy_ptr()>(%0)",
                "return 0",
            ],
            preds: [],
            succes: []
        },
    ]
};

export const TEMPLATE_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'args = parameter0: Args...',
                'this = this: @template/template.cpp: %dflt',
                '%0 = staticinvoke <@%unk/%unk: .undefined()>(args)',
                'return %0'
            ],
            preds: [],
            succes: []
        },
    ]
};

export const TEMPLATE_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                "this = this: @template/template.cpp: %dflt",
                "z = staticinvoke <@%unk/%unk: .sum()>(1, 2, 3, 4, 5, 6)",
                "return 0",
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