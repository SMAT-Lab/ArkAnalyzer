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

export const DERIVED_DATA_TYPE_EXPECT_CLASS = {
    fields: ['height', 'name', 'age'],
    heritageClasses: [],
    blocks: [
        {
            methodName: '~MyClass',
            blocks: [
                {
                    id: 0,
                    stmts: ['this = this: @derivedDataType/derivedDataType.cpp: MyClass', "staticinvoke <@%unk/%unk: .cout()>('delete')", 'return'],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'name = parameter0: char',
                        'age = parameter1: int',
                        'this = this: @derivedDataType/derivedDataType.cpp: MyClass',
                        'instanceinvoke this.<@derivedDataType/derivedDataType.cpp: MyClass.%instInit()>()',
                        'this-><@derivedDataType/derivedDataType.cpp: MyClass.name> = name',
                        'this-><@derivedDataType/derivedDataType.cpp: MyClass.age> = age',
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'GetHeight',
            blocks: [
                {
                    id: 0,
                    stmts: ['this = this: @derivedDataType/derivedDataType.cpp: MyClass', 'return height'],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'GetName',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @derivedDataType/derivedDataType.cpp: MyClass',
                        '%0 = this-><@derivedDataType/derivedDataType.cpp: MyClass.name>',
                        'return %0',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'SetName',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'nameStr = parameter0: char',
                        'this = this: @derivedDataType/derivedDataType.cpp: MyClass',
                        'this-><@derivedDataType/derivedDataType.cpp: MyClass.name> = nameStr',
                        'return',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};

export const DERIVED_DATA_TYPE_EXPECT_CLASS2 = {
    fields: ['name', 'age'],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @derivedDataType/derivedDataType.cpp: DefaultClass',
                        'instanceinvoke this.<@derivedDataType/derivedDataType.cpp: DefaultClass.%instInit()>()',
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};

export const DERIVED_DATA_TYPE_EXPECT_STRUCT = {
    fields: ['title', 'author', 'subject', 'bookId'],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        't = parameter0: string',
                        'a = parameter1: string',
                        's = parameter2: string',
                        'id = parameter3: int',
                        'this = this: @derivedDataType/derivedDataType.cpp: MyStruct',
                        'instanceinvoke this.<@derivedDataType/derivedDataType.cpp: MyStruct.%instInit()>()',
                        'this.<@derivedDataType/derivedDataType.cpp: MyStruct.title> = t',
                        'this.<@derivedDataType/derivedDataType.cpp: MyStruct.author> = a',
                        'this.<@derivedDataType/derivedDataType.cpp: MyStruct.subject> = s',
                        'this.<@derivedDataType/derivedDataType.cpp: MyStruct.bookId> = id',
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'PrintInfo',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @derivedDataType/derivedDataType.cpp: MyStruct',
                        '%0 = this.<@derivedDataType/derivedDataType.cpp: MyStruct.title>',
                        `staticinvoke <@%unk/%unk: .cout()>('title of the book is :', %0)`,
                        'return',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};
