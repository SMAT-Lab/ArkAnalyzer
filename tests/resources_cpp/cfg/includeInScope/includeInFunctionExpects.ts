export const INCLUDE_IN_FUNCTION_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @includeInScope/includeInScope.cpp: %dflt',
                'a = g_NUM',
                'b = a + 1',
                'c = staticinvoke <@%unk/%unk: .add()>(a, b)',
                '%0 = new @%unk/%unk: MyStr',
                'instanceinvoke %0.<@%unk/%unk: MyStr.constructor()>()',
                'myStr = %0',
                'myStr.<@%unk/%unk: MyStr.age> = 10',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};


export const INCLUDE_IN_CLASS_CASE1 = {
    fields: ['data'],
    blocks: [
        {
            methodName: 'process',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        "this = this: @includeInScope/includeInScope.cpp: IncludeInClass",
                        "staticinvoke <@%unk/%unk: .cout()>('Using optimized processing')",
                        "return",
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        }
    ],
};