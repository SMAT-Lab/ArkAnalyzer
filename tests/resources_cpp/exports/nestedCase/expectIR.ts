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
                        '%0 = staticinvoke <@%unk/%unk: .operator<<()>(cout, \'InnerClass [ID: \')',
                        '%1 = this-><@nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass.inner_id>',
                        '%2 = staticinvoke <@%unk/%unk: .operator<<()>(%0, %1)',
                        '%3 = staticinvoke <@%unk/%unk: .operator<<()>(%2, \', inner_name: \')',
                        '%4 = this-><@nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass.inner_name>',
                        '%5 = staticinvoke <@%unk/%unk: .operator<<()>(%3, %4)',
                        '%6 = staticinvoke <@%unk/%unk: .operator<<()>(%5, \'] | \')',
                        '%7 = this-><@nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass.inner_base>',
                        '%8 = staticinvoke <@nestedCase/include/namespaceB.h: SAME_NAMESPACE.%dflt.GetId(@nestedCase/include/namespaceB.h: SAME_NAMESPACE.BaseData&)>(%7)',
                        '%9 = staticinvoke <@%unk/%unk: .operator<<()>(%6, %8)',
                        'staticinvoke <@%unk/%unk: .operator<<()>(%9, endl)',
                        'return'
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        }
    ],
};

export const MAIN_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @nestedCase/main.cpp: %dflt',
                '%0 = new @%unk/%unk: SAME_NAMESPACE::BaseData',
                '%1 = @%unk/%unk: struct SAME_NAMESPACE::BaseData.[static]MAP',
                'instanceinvoke %0.<@%unk/%unk: SAME_NAMESPACE::BaseData.constructor()>(1, %1)',
                'base = %0',
                '%2 = new @nestedCase/include/namespaceA.h: SAME_NAMESPACE.OuterClass',
                'instanceinvoke %2.<@nestedCase/include/namespaceA.h: SAME_NAMESPACE.OuterClass.constructor()>()',
                'outer = %2',
                'instanceinvoke outer.<@nestedCase/include/namespaceA.h: SAME_NAMESPACE.OuterClass.ProcessBase(@nestedCase/include/namespaceB.h: SAME_NAMESPACE.BaseData&)>(base)',
                '%3 = new @nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass',
                "instanceinvoke %3.<@nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass.constructor(int, string&, @nestedCase/include/namespaceB.h: SAME_NAMESPACE.BaseData&)>(1, 'AAA', base)",
                'inner = %3',
                'instanceinvoke outer.<@nestedCase/include/namespaceA.h: SAME_NAMESPACE.OuterClass.ProcessInner(@nestedCase/include/namespaceA.h: SAME_NAMESPACE.InnerClass$OuterClass&)>(inner)',
                'return 0',
            ],
            preds: [],
            succes: [],
        },
    ],
};