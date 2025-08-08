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
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/conditionalOperator.cpp: %dflt',
                'i = 0',
                'if i > 0',
                'ConditionalOperatorIfTrue0',
                '%0 = i',
                'ConditionalOperatorIfFalse0',
                '%0 = -i',
                'ConditionalOperatorEnd0',
                'j = %0',
                'return j'
            ],
            preds: [],
            succes: []
        },
    ]
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/conditionalOperator.cpp: %dflt',
                'i = 0',
                'k = 0',
                'if i > 0',
                'ConditionalOperatorIfTrue0',
                'k = i',
                '%0 = k',
                'ConditionalOperatorIfFalse0',
                '%0 = -i',
                'ConditionalOperatorEnd0',
                'j = %0',
                'return j'
            ],
            preds: [],
            succes: []
        },
    ]
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/conditionalOperator.cpp: %dflt',
                'i = 0',
                'if i < 0',
                'ConditionalOperatorIfTrue0',
                '%0 = -1',
                'if i < %0',
                'ConditionalOperatorIfTrue1',
                '%1 = 1',
                'ConditionalOperatorIfFalse1',
                '%1 = 2',
                'ConditionalOperatorEnd1',
                '%2 = %1',
                'ConditionalOperatorIfFalse0',
                'if i > 1',
                'ConditionalOperatorIfTrue2',
                '%3 = 3',
                'ConditionalOperatorIfFalse2',
                '%3 = 4',
                'ConditionalOperatorEnd2',
                '%2 = %3',
                'ConditionalOperatorEnd0',
                'j = %2',
                'return j'
            ],
            preds: [],
            succes: []
        },
    ]
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/conditionalOperator.cpp: %dflt',
                'i = 0',
                'if i < 0',
                'ConditionalOperatorIfTrue0',
                '%0 = -1',
                'if i < %0',
                'ConditionalOperatorIfTrue1',
                '%1 = 1',
                'ConditionalOperatorIfFalse1',
                '%1 = 2',
                'ConditionalOperatorEnd1',
                '%2 = %1 + 3',
                'ConditionalOperatorIfFalse0',
                '%2 = 4',
                'ConditionalOperatorEnd0',
                'j = %2',
                'return j'
            ],
            preds: [],
            succes: []
        },
    ]
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/conditionalOperator.cpp: %dflt',
                'i = 0',
                'if i < 0',
                'ConditionalOperatorIfTrue0',
                '%0 = -1',
                'if i < %0',
                'ConditionalOperatorIfTrue1',
                '%1 = -2',
                'if i < %1',
                'ConditionalOperatorIfTrue2',
                '%2 = 1',
                'ConditionalOperatorIfFalse2',
                '%2 = 2',
                'ConditionalOperatorEnd2',
                '%3 = %2',
                'ConditionalOperatorIfFalse1',
                '%3 = 3',
                'ConditionalOperatorEnd1',
                '%4 = %3',
                'ConditionalOperatorIfFalse0',
                '%4 = 4',
                'ConditionalOperatorEnd0',
                'j = %4',
                'return'
            ],
            preds: [],
            succes: []
        },
    ]
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/conditionalOperator.cpp: %dflt',
                'i = 0',
                'if i > 0',
                'ConditionalOperatorIfTrue0',
                '%0 = i',
                'ConditionalOperatorIfFalse0',
                '%0 = -i',
                'ConditionalOperatorEnd0',
                'j = %0',
                'if j > 0',
                'ConditionalOperatorIfTrue1',
                '%1 = j',
                'ConditionalOperatorIfFalse1',
                '%1 = -j',
                'ConditionalOperatorEnd1',
                'k = %1',
                'return k'
            ],
            preds: [],
            succes: []
        },
    ]
};

export const CONDITIONAL_OPERATOR_EXPECT_CASE7 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @conditionalOperator/conditionalOperator.cpp: %dflt',
                'i = 0',
                '%0 = -1',
                'if i > %0'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        { id: 1,
          stmts: [ 'if i > 0',
                'ConditionalOperatorIfTrue0',
                '%1 = i',
                'ConditionalOperatorIfFalse0',
                '%1 = -i',
                'ConditionalOperatorEnd0',
                'j = %1'
            ],
          preds: [ 0 ],
          succes: [2]
        },
        { id: 2,
          stmts: [ 'return' ],
          preds: [ 1, 0 ],
          succes: []
        }
    ]
}