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

export const BASE_DATA_TYPE_EXPECT_MAIN = {
    blocks: [
        {
            id: 0,
            stmts: ['this = this: @baseDataType/baseDataType.cpp: %dflt', 'boolData = staticinvoke <@%unk/%unk: .IsChar()>(1)', 'if boolData != 0'],
            preds: [],
            succes: [1, 2],
        },
        {
            id: 1,
            stmts: [
                'charData1 = A',
                'charData2 = -10',
                'charData3 = 10',
                'wcharData1 = 好',
                "wcharData2 = 'hello'",
                'char16Data1 = A',
                "char16Data2 = 'hello'",
                'char32Data1 = U0001F600',
                "char32Data2 = 'hello'",
                "charData4 = ''",
                '%0 = new @%unk/%unk: std::basic_string<char>',
                "instanceinvoke %0.<@%unk/%unk: std::basic_string.constructor()>('hello')",
                'ss = %0'
            ],
            preds: [0],
            succes: [3],
        },
        {
            id: 2,
            stmts: [
                'shortData1 = -1',
                'shortData2 = 1',
                'intData1 = -10',
                'intData2 = 10',
                'longData1 = -100',
                'longData2 = 100',
                'long2Data1 = -1000',
                'long2Data2 = 1000',
                'floatData = 88.8',
                'doubleData1 = 88.888',
                'doubleData2 = 88.8888',
                'intData3 = 0',
                'floatData1 = 0',
                'doubleData3 = 0',
            ],
            preds: [0],
            succes: [3],
        },
        { id: 3, stmts: ['return 0'], preds: [1, 2], succes: [] },
    ],
};
