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

export const CONDITIONAL_OPERATOR_EXPECT_CASE1 = {
    in: {
        '0': '',
        '1': '0',
        '2': '0, 1',
        '3': '0, 1, 2',
        '4': '0, 1, 2',
        '5': '0, 2, 4',
        '6': '0, 2, 4',
        '7': '0, 1, 4, 6, 8, 10, 11',
        '8': '0, 2, 4',
        '9': '0, 1, 2',
        '10': '0, 1, 2',
        '11': '0, 1, 2'
    },
    out: {
        '0': '0',
        '1': '0, 1',
        '2': '0, 1, 2',
        '3': '0, 1, 2',
        '4': '0, 2, 4',
        '5': '0, 2, 4',
        '6': '0, 4, 6',
        '7': '0, 1, 4, 6, 8, 10, 11',
        '8': '0, 4, 8',
        '9': '0, 1, 2',
        '10': '0, 1, 10',
        '11': '0, 1, 11'
    }
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE2 = {
    in: {
        '0': '',
        '1': '0',
        '2': '0, 1',
        '3': '0, 1, 2',
        '4': '0, 1, 2, 3',
        '5': '0, 1, 2, 3, 4',
        '6': '0, 1, 2, 3, 4',
        '7': '0, 1, 2, 3, 4, 6',
        '8': '0, 1, 2, 3, 4, 6',
        '9': '0, 1, 2, 3, 4, 6, 8',
        '10': '0, 1, 2, 3, 4, 6, 8',
        '11': '0, 1, 2, 3, 6, 8, 10, 12, 13, 15, 16',
        '12': '0, 1, 2, 3, 4, 6, 8',
        '13': '0, 1, 2, 3, 4, 6',
        '14': '0, 1, 2, 3, 4',
        '15': '0, 1, 2, 3, 4',
        '16': '0, 1, 2, 3, 4'
    },
    out: {
        '0': '0',
        '1': '0, 1',
        '2': '0, 1, 2',
        '3': '0, 1, 2, 3',
        '4': '0, 1, 2, 3, 4',
        '5': '0, 1, 2, 3, 4',
        '6': '0, 1, 2, 3, 4, 6',
        '7': '0, 1, 2, 3, 4, 6',
        '8': '0, 1, 2, 3, 4, 6, 8',
        '9': '0, 1, 2, 3, 4, 6, 8',
        '10': '0, 1, 2, 3, 6, 8, 10',
        '11': '0, 1, 2, 3, 6, 8, 10, 12, 13, 15, 16',
        '12': '0, 1, 2, 3, 6, 8, 12',
        '13': '0, 1, 2, 3, 6, 13',
        '14': '0, 1, 2, 3, 4',
        '15': '0, 1, 2, 3, 15',
        '16': '0, 1, 2, 3, 16'
    }
};