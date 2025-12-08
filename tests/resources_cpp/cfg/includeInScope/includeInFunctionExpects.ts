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

export const INCLUDE_IN_FUNCTION_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @includeInScope/includeInScope.cpp: %dflt',
                'a = g_NUM',
                'b = a + 1',
                'c = staticinvoke <@includeInScope/includeInFunction.h: %dflt.add(int, int)>(a, b)',
                '%0 = new @includeInScope/includeInFunction.h: MyStruct',
                'instanceinvoke %0.<@includeInScope/includeInFunction.h: MyStruct.constructor()>()',
                'myStruct = %0',
                'myStruct.<@includeInScope/includeInFunction.h: MyStruct.age> = g_NUM',
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
            methodName: 'Process',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        "this = this: @includeInScope/includeInScope.cpp: IncludeInClass",
                        "a = 1",
                        "return",
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        }
    ],
};