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
    blocks: [
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
    ]
};
