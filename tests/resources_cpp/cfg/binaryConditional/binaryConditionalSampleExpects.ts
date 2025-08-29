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

export const BINARY_CONDITIONAL_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'i = 0',
                'j = 0',
                'k = 1',
                '%0 = -i',
                'if %0 != 0',
                'ConditionalOperatorIfTrue0',
                '%1 = -i',
                'ConditionalOperatorIfFalse0',
                '%1 = k',
                'ConditionalOperatorEnd0',
                'j = %1',
                'return j',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BINARY_CONDITIONAL_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'a = 0',
                'b = 1',
                'c = 2',
                'if a > b',
                'ConditionalOperatorIfTrue0',
                '%0 = a > b',
                'ConditionalOperatorIfFalse0',
                '%0 = c',
                'ConditionalOperatorEnd0',
                'y = %0',
                'return y',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BINARY_CONDITIONAL_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'x = 0',
                'y = 0',
                'x = x + 1',
                'if x != 0',
                'ConditionalOperatorIfTrue0',
                'x = x + 1',
                '%0 = x',
                'ConditionalOperatorIfFalse0',
                '%0 = 1',
                'ConditionalOperatorEnd0',
                'y = %0',
                'return y',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BINARY_CONDITIONAL_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'x = 0',
                'y = 0',
                'x = x + 1',
                'if x != 0',
                'ConditionalOperatorIfTrue0',
                'x = x + 1',
                '%0 = x',
                'ConditionalOperatorIfFalse0',
                '%0 = 1',
                'ConditionalOperatorEnd0',
                'y = %0',
                'return y',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BINARY_CONDITIONAL_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'i = 8',
                'if i < 0',
                'ConditionalOperatorIfTrue0',
                '%0 = i < 0',
                'ConditionalOperatorIfFalse0',
                'if i > 1',
                'ConditionalOperatorIfTrue1',
                '%1 = i > 1',
                'ConditionalOperatorIfFalse1',
                '%1 = 0',
                'ConditionalOperatorEnd1',
                '%0 = %1',
                'ConditionalOperatorEnd0',
                'j = %0',
                'return j',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const BINARY_CONDITIONAL_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @binaryConditional/binaryConditionalSample.cpp: %dflt',
                'i = 0',
                'j = 0',
                'k = 1',
                '%0 = i + j',
                '%1 = %0 + k',
                '%2 = %1 + 1',
                'if %2 != 0',
                'ConditionalOperatorIfTrue0',
                '%3 = i + j',
                '%4 = %3 + k',
                '%5 = %4 + 1',
                'ConditionalOperatorIfFalse0',
                '%5 = k',
                'ConditionalOperatorEnd0',
                'j = %5',
                'return j',
            ],
            preds: [],
            succes: [],
        },
    ],
};
