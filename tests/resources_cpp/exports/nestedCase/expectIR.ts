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

export const BASE_DATA_EXPECT = {
    fields: ['id', 'type'],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'id_ = parameter0: int',
                        'type_ = parameter1: @nestedCase/include/namespaceB.h: SAME_NAMESPACE.INDENT_TYPE$BaseData',
                        'this = this: @nestedCase/include/namespaceB.h: SAME_NAMESPACE.BaseData',
                        'instanceinvoke this.<@nestedCase/include/namespaceB.h: SAME_NAMESPACE.BaseData.%instInit()>()',
                        'this.<@nestedCase/include/namespaceB.h: SAME_NAMESPACE.BaseData.id> = id_',
                        'this.<@nestedCase/include/namespaceB.h: SAME_NAMESPACE.BaseData.type> = type_',
                        'return this'
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        }
    ],
};

export const INNER_CLASS_EXPECT = {
    fields: ['inner_id', 'inner_name', 'inner_base'],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'id = parameter0: int',
                        'name = parameter1: string&',
                        'base = parameter2: @nestedCase/include/namespaceB.h: SAME_NAMESPACE.BaseData&',
                        'this = this: @nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass',
                        'instanceinvoke this.<@nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass.%instInit()>()',
                        'this.<@nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass.inner_id> = id',
                        'this.<@nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass.inner_name> = name',
                        'this.<@nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass.inner_base> = base',
                        'return this'
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'PrintFullInfo',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass',
                        '%0 = this.<@nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass.inner_id>',
                        '%1 = this.<@nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass.inner_name>',
                        '%2 = this.<@nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass.inner_base>',
                        '%3 = staticinvoke <@nestedCase/include/namespaceB.h: SAME_NAMESPACE.%dflt.GetId(@nestedCase/include/namespaceB.h: ' +
                        'SAME_NAMESPACE.BaseData&)>(%2)',
                        "staticinvoke <@%unk/%unk: .cout()>('InnerClass [ID: ', %0, ', inner_name: ', %1, '] | ', %3)",
                        'return'
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        }
    ],
};

