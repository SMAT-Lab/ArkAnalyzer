export const DERIVED_DATA_TYPE_EXPECT_CLASS = {
    blocks: [
        {
            methodName: '~MyClass',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @derivedDataType/derivedDataType.cpp: MyClass',
                        'return'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'instanceinvoke this.<@derivedDataType/derivedDataType.cpp: MyClass.%instInit()>()',
                        'name = parameter0: char',
                        'age = parameter1: int',
                        'this = this: @derivedDataType/derivedDataType.cpp: MyClass',
                        'this-><@derivedDataType/derivedDataType.cpp: MyClass.name> = name',
                        'this-><@derivedDataType/derivedDataType.cpp: MyClass.age> = age',
                        'return this'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'getHeight',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @derivedDataType/derivedDataType.cpp: MyClass',
                        'return height'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'getName',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @derivedDataType/derivedDataType.cpp: MyClass',
                        '%0 = this-><@derivedDataType/derivedDataType.cpp: MyClass.name>',
                        'return %0'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'setName',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'nameStr = parameter0: char',
                        'this = this: @derivedDataType/derivedDataType.cpp: MyClass',
                        'this-><@derivedDataType/derivedDataType.cpp: MyClass.name> = nameStr',
                        'return'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        }
    ]
};

export const DERIVED_DATA_TYPE_EXPECT_CLASS2 = {
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @derivedDataType/derivedDataType.cpp: DefaultClass',
                        'instanceinvoke this.<@derivedDataType/derivedDataType.cpp: DefaultClass.%instInit()>()',
                        'return this'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        }
    ]
};

export const DERIVED_DATA_TYPE_EXPECT_STRUCT = {
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'instanceinvoke this.<@derivedDataType/derivedDataType.cpp: MyStruct.%instInit()>()',
                        't = parameter0: string',
                        'a = parameter1: string',
                        's = parameter2: string',
                        'id = parameter3: int',
                        'this = this: @derivedDataType/derivedDataType.cpp: MyStruct',
                        'return this'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'printInfo',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @derivedDataType/derivedDataType.cpp: MyStruct',
                        '%0 = this.<@derivedDataType/derivedDataType.cpp: MyStruct.title>',
                        `staticinvoke <@%unk/%unk: .cout()>('"title of the book is :"', %0)`,
                        'return'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        }
    ]
};
