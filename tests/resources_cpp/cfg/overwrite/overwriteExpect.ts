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

export const OVERWRITE_PRINT_INFO_CASE1_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'a = parameter0: int',
                'b = parameter1: int',
                'this = this: @overwrite/overwriteSample.cpp: Calculator',
                '%0 = new @%unk/%unk: std::string',
                'instanceinvoke %0.<@%unk/%unk: std::string.constructor()>(\'Integer addition\')',
                'instanceinvoke this.<@overwrite/overwriteSample.cpp: Calculator.Log(string&)>(%0)',
                '%1 = a + b',
                'return %1',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const OVERWRITE_PRINT_INFO_CASE2_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'a = parameter0: double',
                'b = parameter1: double',
                'this = this: @overwrite/overwriteSample.cpp: Calculator',
                '%0 = new @%unk/%unk: std::string',
                'instanceinvoke %0.<@%unk/%unk: std::string.constructor()>(\'Decimal addition\')',
                'instanceinvoke this.<@overwrite/overwriteSample.cpp: Calculator.Log(string&)>(%0)',
                '%1 = a + b',
                'return %1',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const OVERWRITE_PRINT_INFO_CASE3_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'a = parameter0: int',
                'b = parameter1: int',
                'c = parameter2: int',
                'this = this: @overwrite/overwriteSample.cpp: Calculator',
                '%0 = new @%unk/%unk: std::string',
                'instanceinvoke %0.<@%unk/%unk: std::string.constructor()>(\'Three number addition\')',
                'instanceinvoke this.<@overwrite/overwriteSample.cpp: Calculator.Log(string&)>(%0)',
                '%1 = a + b',
                '%2 = %1 + c',
                'return %2',
            ],
            preds: [],
            succes: [],
        },
    ],
};
