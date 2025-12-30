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

export const NAMESPACE_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @namespace/namespace.cpp: %dflt',
                'staticinvoke <@namespace/namespace.cpp: nsA.%dflt.Func()>()',
                'return'
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const NAMESPACE_SCHOOL_EXPECT = {
    classBlocks: [
        {
            className: '%dflt',
            fields: [],
            heritageClasses: [],
            blocks: [
                {
                    methodName: '%dflt',
                    blocks: [
                        {
                            id: 0,
                            stmts: ['this = this: @namespace/namespace.cpp: School.%dflt', 'return'],
                            preds: [],
                            succes: [],
                        },
                    ]
                },
            ]
        },
        {
            className: 'Student$University',
            fields: ['name', 'id'],
            heritageClasses: [],
            blocks: [
                {
                    methodName: 'constructor',
                    blocks: [
                        {
                            id: 0,
                            stmts: ['n = parameter0: string&', 'i = parameter1: int', 'this = this: @namespace/namespace.cpp: School.Student$University', 'instanceinvoke this.<@namespace/namespace.cpp: School.Student$University.%instInit()>()', 'this.<@namespace/namespace.cpp: School.Student$University.name> = n', 'this.<@namespace/namespace.cpp: School.Student$University.id> = i', 'return this'],
                            preds: [],
                            succes: [],
                        },
                    ]
                },
                {
                    methodName: 'display',
                    blocks: [
                        {
                            id: 0,
                            stmts: ['this = this: @namespace/namespace.cpp: School.Student$University', '%0 = this.<@namespace/namespace.cpp: School.Student$University.name>', '%1 = this.<@namespace/namespace.cpp: School.Student$University.id>', 'staticinvoke <@%unk/%unk: .cout()>(\'STUDENT_TEXT\', %0, \', \', \'ID_TEXT\', %1)', 'return'],
                            preds: [],
                            succes: [],
                        },
                    ]
                },
                {
                    methodName: '%statInit',
                    blocks: [
                        {
                            id: 0,
                            stmts: ['this = this: @namespace/namespace.cpp: School.Student$University', 'return'],
                            preds: [],
                            succes: [],
                        },
                    ]
                },
            ]
        },
        {
            className: 'University',
            fields: ['name'],
            heritageClasses: [],
            blocks: [
                {
                    methodName: 'constructor',
                    blocks: [
                        {
                            id: 0,
                            stmts: ['n = parameter0: string&', 'this = this: @namespace/namespace.cpp: School.University', 'instanceinvoke this.<@namespace/namespace.cpp: School.University.%instInit()>()', 'this.<@namespace/namespace.cpp: School.University.name> = n', 'return this'],
                            preds: [],
                            succes: [],
                        },
                    ]
                },
                {
                    methodName: 'welcome',
                    blocks: [
                        {
                            id: 0,
                            stmts: ['this = this: @namespace/namespace.cpp: School.University', '%0 = this.<@namespace/namespace.cpp: School.University.name>', 'staticinvoke <@%unk/%unk: .cout()>(\'WELCOME_TEXT\', %0)', 'return'],
                            preds: [],
                            succes: [],
                        },
                    ]
                },
                {
                    methodName: '%statInit',
                    blocks: [
                        {
                            id: 0,
                            stmts: ['this = this: @namespace/namespace.cpp: School.University', 'return'],
                            preds: [],
                            succes: [],
                        },
                    ]
                },
            ]
        },
    ],
    nestedNamespaces: [
        {
            namespaceName: '%AN0',
            classBlocks: [
                {
                    className: '%dflt',
                    fields: [],
                    heritageClasses: [],
                    blocks: [
                        {
                            methodName: '%dflt',
                            blocks: [
                                {
                                    id: 0,
                                    stmts: [
                                        'this = this: @namespace/namespace.cpp: School.%AN0.%dflt',
                                        '%0 = new @%unk/%unk: std::basic_string<char>',
                                        "instanceinvoke %0.<@%unk/%unk: std::basic_string.constructor()>('[Nested AnonymousSpace] ')",
                                        'kLogPrefix = %0',
                                        'g_local_counter = 0',
                                        'return'
                                    ],
                                    preds: [],
                                    succes: [],
                                },
                            ]
                        },
                        {
                            methodName: 'PrintInfoInNested',
                            blocks: [
                                {
                                    id: 0,
                                    stmts: [
                                        "this = this: @namespace/namespace.cpp: School.%AN0.%dflt",
                                        "%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, kLogPrefix)",
                                        "%1 = staticinvoke <@%unk/%unk: .operator<<()>(%0, 'Current counter value: ')",
                                        "%2 = staticinvoke <@%unk/%unk: .operator<<()>(%1, g_local_counter)",
                                        "staticinvoke <@%unk/%unk: .operator<<()>(%2, endl)",
                                        "return",
                                    ],
                                    preds: [],
                                    succes: [],
                                },
                            ]
                        },
                    ]
                },
                {
                    className: 'LocalHelperInNested',
                    fields: ['value_'],
                    heritageClasses: [],
                    blocks: [
                        {
                            methodName: 'constructor',
                            blocks: [
                                {
                                    id: 0,
                                    stmts: [
                                        'v = parameter0: int',
                                        'this = this: @namespace/namespace.cpp: School.%AN0.LocalHelperInNested',
                                        "instanceinvoke this.<@namespace/namespace.cpp: School.%AN0.LocalHelperInNested.%instInit()>()",
                                        'this.<@namespace/namespace.cpp: School.%AN0.LocalHelperInNested.value_> = v',
                                        'g_local_counter = g_local_counter + 1',
                                        'return this'
                                    ],
                                    preds: [],
                                    succes: [],
                                },
                            ]
                        },
                        {
                            methodName: 'GetValue',
                            blocks: [
                                {
                                    id: 0,
                                    stmts: [
                                        'this = this: @namespace/namespace.cpp: School.%AN0.LocalHelperInNested',
                                        '%0 = this-><@namespace/namespace.cpp: School.%AN0.LocalHelperInNested.value_>',
                                        'return %0'
                                    ],
                                    preds: [],
                                    succes: [],
                                },
                            ]
                        }
                    ]
                }
            ],
            nestedNamespaces: []
        },
    ]
};

export const NAMESPACE_AN0_EXPECT = {
    classBlocks: [
        {
            className: '%dflt',
            fields: [],
            heritageClasses: [],
            blocks: [
                {
                    methodName: '%dflt',
                    blocks: [
                        {
                            id: 0,
                            stmts: [
                                'this = this: @namespace/namespace.cpp: %AN0.%dflt',
                                '%0 = new @%unk/%unk: std::basic_string<char>',
                                "instanceinvoke %0.<@%unk/%unk: std::basic_string.constructor()>('[AnonymousSpace] ')",
                                'kLogPrefix = %0',
                                'g_local_counter = 0',
                                'return'
                            ],
                            preds: [],
                            succes: [],
                        },
                    ]
                },
                {
                    methodName: 'PrintInfo',
                    blocks: [
                        {
                            id: 0,
                            stmts: [
                                'this = this: @namespace/namespace.cpp: %AN0.%dflt',
                                '%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, kLogPrefix)',
                                "%1 = staticinvoke <@%unk/%unk: .operator<<()>(%0, 'Current counter value: ')",
                                '%2 = staticinvoke <@%unk/%unk: .operator<<()>(%1, g_local_counter)',
                                'staticinvoke <@%unk/%unk: .operator<<()>(%2, endl)',
                                'return'
                            ],
                            preds: [],
                            succes: [],
                        },
                    ]
                },
            ]
        },
        {
            className: 'LocalHelper',
            fields: ['value_'],
            heritageClasses: [],
            blocks: [
                {
                    methodName: 'constructor',
                    blocks: [
                        {
                            id: 0,
                            stmts: [
                                'v = parameter0: int',
                                'this = this: @namespace/namespace.cpp: %AN0.LocalHelper',
                                "instanceinvoke this.<@namespace/namespace.cpp: %AN0.LocalHelper.%instInit()>()",
                                'this.<@namespace/namespace.cpp: %AN0.LocalHelper.value_> = v',
                                'g_local_counter = g_local_counter + 1',
                                'return this'
                            ],
                            preds: [],
                            succes: [],
                        },
                    ]
                },
                {
                    methodName: 'GetValue',
                    blocks: [
                        {
                            id: 0,
                            stmts: [
                                'this = this: @namespace/namespace.cpp: %AN0.LocalHelper',
                                '%0 = this-><@namespace/namespace.cpp: %AN0.LocalHelper.value_>',
                                'return %0'
                            ],
                            preds: [],
                            succes: [],
                        },
                    ]
                }
            ]
        }
    ],
    nestedNamespaces: []
};

export const NAMESPACE_TEST_ANONYMOUS_NAMESPACE = {
    blocks: [
        {
            id: 0,
            stmts: [
                "this = this: @namespace/namespace.cpp: %dflt",
                "staticinvoke <@namespace/namespace.cpp: %AN0.%dflt.PrintInfo()>()",
                "g_local_counter = 5",
                "staticinvoke <@namespace/namespace.cpp: %AN0.%dflt.PrintInfo()>()",
                "%0 = new @namespace/namespace.cpp: %AN0.LocalHelper",
                "instanceinvoke %0.<@namespace/namespace.cpp: %AN0.LocalHelper.constructor(int)>(100)",
                "helper1 = %0",
                "staticinvoke <@namespace/namespace.cpp: %AN0.%dflt.PrintInfo()>()",
                "staticinvoke <@namespace/namespace.cpp: School.%AN0.%dflt.PrintInfoInNested()>()",
                "g_local_counter = 5",
                "staticinvoke <@namespace/namespace.cpp: School.%AN0.%dflt.PrintInfoInNested()>()",
                "%1 = new @namespace/namespace.cpp: School.%AN0.LocalHelperInNested",
                "instanceinvoke %1.<@namespace/namespace.cpp: School.%AN0.LocalHelperInNested.constructor(int)>(100)",
                "helper2 = %1",
                "staticinvoke <@namespace/namespace.cpp: School.%AN0.%dflt.PrintInfoInNested()>()",
                "return",
            ],
            preds: [],
            succes: [],
        },
    ],
};
