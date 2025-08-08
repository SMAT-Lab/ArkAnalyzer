/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

export const TYPEDEF_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @typedef/typedef.cpp: %dflt',
                'type @typedef/typedef.cpp: %dflt.main()#StrToVecMap = @std/map.h: map',
                "%0 = new @%unk/%unk: StrToVecMap",
                "instanceinvoke %0.<@%unk/%unk: StrToVecMap.constructor()>()",
                "myMap = %0",
                "%1 = myMap['key']",
                "instanceinvoke myMap['key'].<@%unk/%unk: .push_back()>(%1, 1)",
                'return'
            ],
            preds: [],
            succes: []
        },
    ]
};
