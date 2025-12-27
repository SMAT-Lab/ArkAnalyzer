/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

export const Declaration_Expect_IR = {
    stmts: [
        {
            text: 'this = this: @assignment/DeclarationTest.ts: %dflt',
            operandOriginalPositions: [
                null, null,
            ],
        },
        {
            text: 'a = 1',
            operandOriginalPositions: [
                [16, 5, 16, 6], [16, 9, 16, 10],
            ],
        },
        {
            text: 'b = 2',
            operandOriginalPositions: [
                [17, 5, 17, 6], [17, 9, 17, 10],
            ],
        },
        {
            text: 'c = 3',
            operandOriginalPositions: [
                [17, 12, 17, 13], [17, 16, 17, 17],
            ],
        },
        {
            text: 'd = undefined',
            operandOriginalPositions: [
                [18, 5, 18, 6], [-1, -1, -1, -1],
            ],
        },
        {
            text: 'e = 4',
            operandOriginalPositions: [
                [20, 7, 20, 8], [20, 11, 20, 12],
            ],
        },
        {
            text: 'f = 5',
            operandOriginalPositions: [
                [21, 7, 21, 8], [21, 11, 21, 12],
            ],
        },
        {
            text: 'g = 6',
            operandOriginalPositions: [
                [21, 14, 21, 15], [21, 18, 21, 19],
            ],
        },
        {
            text: 'return',
            operandOriginalPositions: [],
        },
    ],
};

export const CompoundAssignment_Expect_IR = {
    stmts: [
        {
            text: 'this = this: @assignment/CompoundAssignmentTest.ts: %dflt',
            operandOriginalPositions: [
                null, null,
            ],
        },
        {
            text: 'a = 1',
            operandOriginalPositions: [
                [16, 5, 16, 6], [16, 9, 16, 10],
            ],
        },
        {
            text: 'a = a + 2',
            operandOriginalPositions: [
                [17, 1, 17, 2], [17, 1, 17, 7], [17, 1, 17, 2], [17, 6, 17, 7],
            ],
        },
        {
            text: 'a = a - 3',
            operandOriginalPositions: [
                [18, 1, 18, 2], [18, 1, 18, 7], [18, 1, 18, 2], [18, 6, 18, 7],
            ],
        },
        {
            text: 'a = a * 4',
            operandOriginalPositions: [
                [19, 1, 19, 2], [19, 1, 19, 7], [19, 1, 19, 2], [19, 6, 19, 7],
            ],
        },
        {
            text: 'a = a / 5',
            operandOriginalPositions: [
                [20, 1, 20, 2], [20, 1, 20, 7], [20, 1, 20, 2], [20, 6, 20, 7],
            ],
        },
        {
            text: 'a = a ** 6',
            operandOriginalPositions: [
                [21, 1, 21, 2], [21, 1, 21, 8], [21, 1, 21, 2], [21, 7, 21, 8],
            ],
        },
        {
            text: 'a = a & 7',
            operandOriginalPositions: [
                [23, 1, 23, 2], [23, 1, 23, 7], [23, 1, 23, 2], [23, 6, 23, 7],
            ],
        },
        {
            text: 'a = a | 8',
            operandOriginalPositions: [
                [24, 1, 24, 2], [24, 1, 24, 7], [24, 1, 24, 2], [24, 6, 24, 7],
            ],
        },
        {
            text: 'a = a ^ 9',
            operandOriginalPositions: [
                [25, 1, 25, 2], [25, 1, 25, 7], [25, 1, 25, 2], [25, 6, 25, 7],
            ],
        },
        {
            text: 'a = a << 10',
            operandOriginalPositions: [
                [27, 1, 27, 2], [27, 1, 27, 9], [27, 1, 27, 2], [27, 7, 27, 9],
            ],
        },
        {
            text: 'a = a >> 11',
            operandOriginalPositions: [
                [28, 1, 28, 2], [28, 1, 28, 9], [28, 1, 28, 2], [28, 7, 28, 9],
            ],
        },
        {
            text: 'a = a >>> 12',
            operandOriginalPositions: [
                [29, 1, 29, 2], [29, 1, 29, 10], [29, 1, 29, 2], [29, 8, 29, 10],
            ],
        },
        {
            text: 'b = \'hello\'',
            operandOriginalPositions: [
                [31, 5, 31, 6], [31, 9, 31, 16],
            ],
        },
        {
            text: 'b = b + \' world\'',
            operandOriginalPositions: [
                [32, 1, 32, 2], [32, 1, 32, 14], [32, 1, 32, 2], [32, 6, 32, 14],
            ],
        },
        {
            text: 'c = 1',
            operandOriginalPositions: [
                [34, 5, 34, 6], [34, 9, 34, 10],
            ],
        },
        {
            text: 'c = c + 1',
            operandOriginalPositions: [
                [35, 1, 35, 2], [35, 1, 35, 4], [35, 1, 35, 2], [-1, -1, -1, -1],
            ],
        },
        {
            text: 'c = c + 1',
            operandOriginalPositions: [
                [36, 3, 36, 4], [36, 1, 36, 4], [36, 3, 36, 4], [-1, -1, -1, -1],
            ],
        },
        {
            text: 'c = c - 1',
            operandOriginalPositions: [
                [37, 1, 37, 2], [37, 1, 37, 4], [37, 1, 37, 2], [-1, -1, -1, -1],
            ],
        },
        {
            text: 'c = c - 1',
            operandOriginalPositions: [
                [38, 3, 38, 4], [38, 1, 38, 4], [38, 3, 38, 4], [-1, -1, -1, -1],
            ],
        },
        {
            text: 'return',
            operandOriginalPositions: [],
        },
    ],
};

export const Destructuring_Expect_IR = {
    stmts: [
        {
            text: 'this = this: @assignment/DestructuringSample.ts: %dflt',
            operandOriginalPositions: [null, null],
        },
        {
            text: '%1 = newarray (number)[2]',
            operandOriginalPositions: [[16, 16, 16, 22], [16, 16, 16, 22], [-1, -1, -1, -1]],
        },
        {
            text: '%1[0] = 7',
            operandOriginalPositions: [[16, 16, 16, 22], [16, 16, 16, 22], [-1, -1, -1, -1], [16, 17, 16, 18]],
        },
        {
            text: '%1[1] = 8',
            operandOriginalPositions: [[16, 16, 16, 22], [16, 16, 16, 22], [-1, -1, -1, -1], [16, 20, 16, 21]],
        },
        {
            text: '%0 = %1',
            operandOriginalPositions: [[16, 5, 16, 13], [16, 16, 16, 22]],
        },
        {
            text: 'd1 = %0[0]',
            operandOriginalPositions: [[16, 6, 16, 8], [16, 5, 16, 13], [16, 5, 16, 13], [-1, -1, -1, -1]],
        },
        {
            text: 'd2 = %0[1]',
            operandOriginalPositions: [[16, 10, 16, 12], [16, 5, 16, 13], [16, 5, 16, 13], [-1, -1, -1, -1]],
        },
        {
            text: '%3 = new @assignment/DestructuringSample.ts: %AC0$%dflt-%dflt',
            operandOriginalPositions: [[17, 20, 17, 36], [17, 20, 17, 36]],
        },
        {
            text: '%3 = instanceinvoke %3.<@assignment/DestructuringSample.ts: %AC0$%dflt-%dflt.constructor()>()',
            operandOriginalPositions: [[17, 20, 17, 36], [17, 20, 17, 36], [17, 20, 17, 36]],
        },
        {
            text: '%2 = %3',
            operandOriginalPositions: [[17, 7, 17, 17], [17, 20, 17, 36]],
        },
        {
            text: 'd3 = %2.<@assignment/DestructuringSample.ts: %AC0$%dflt-%dflt.d3>',
            operandOriginalPositions: [[17, 9, 17, 11], [17, 7, 17, 17], [17, 7, 17, 17]],
        },
        {
            text: 'd4 = %2.<@assignment/DestructuringSample.ts: %AC0$%dflt-%dflt.d4>',
            operandOriginalPositions: [[17, 13, 17, 15], [17, 7, 17, 17], [17, 7, 17, 17]],
        },
        {
            text: '%5 = new @assignment/DestructuringSample.ts: %AC1$%dflt-%dflt',
            operandOriginalPositions: [[18, 28, 18, 44], [18, 28, 18, 44]],
        },
        {
            text: '%5 = instanceinvoke %5.<@assignment/DestructuringSample.ts: %AC1$%dflt-%dflt.constructor()>()',
            operandOriginalPositions: [[18, 28, 18, 44], [18, 28, 18, 44], [18, 28, 18, 44]],
        },
        {
            text: '%4 = %5',
            operandOriginalPositions: [[18, 7, 18, 25], [18, 28, 18, 44]],
        },
        {
            text: 'd7 = %4.<@assignment/DestructuringSample.ts: %AC1$%dflt-%dflt.d5>',
            operandOriginalPositions: [[18, 9, 18, 15], [18, 7, 18, 25], [18, 7, 18, 25]],
        },
        {
            text: 'd8 = %4.<@assignment/DestructuringSample.ts: %AC1$%dflt-%dflt.d6>',
            operandOriginalPositions: [[18, 17, 18, 23], [18, 7, 18, 25], [18, 7, 18, 25]],
        },
        {
            text: 'd9 = 0',
            operandOriginalPositions: [[19, 5, 19, 7], [19, 10, 19, 11]],
        },
        {
            text: 'd10 = 0',
            operandOriginalPositions: [[20, 5, 20, 8], [20, 11, 20, 12]],
        },
        {
            text: '%7 = newarray (number)[2]',
            operandOriginalPositions: [[21, 13, 21, 19], [21, 13, 21, 19], [-1, -1, -1, -1]],
        },
        {
            text: '%7[0] = 7',
            operandOriginalPositions: [[21, 13, 21, 19], [21, 13, 21, 19], [-1, -1, -1, -1], [21, 14, 21, 15]],
        },
        {
            text: '%7[1] = 8',
            operandOriginalPositions: [[21, 13, 21, 19], [21, 13, 21, 19], [-1, -1, -1, -1], [21, 17, 21, 18]],
        },
        {
            text: '%6 = %7',
            operandOriginalPositions: [[21, 1, 21, 10], [21, 13, 21, 19]],
        },
        {
            text: 'd9 = %6[0]',
            operandOriginalPositions: [[21, 2, 21, 4], [21, 1, 21, 10], [21, 1, 21, 10], [-1, -1, -1, -1]],
        },
        {
            text: 'd10 = %6[1]',
            operandOriginalPositions: [[21, 6, 21, 9], [21, 1, 21, 10], [21, 1, 21, 10], [-1, -1, -1, -1]],
        },
        {
            text: '%9 = new @assignment/DestructuringSample.ts: %AC2$%dflt-%dflt',
            operandOriginalPositions: [[22, 26, 22, 44], [22, 26, 22, 44]],
        },
        {
            text: '%9 = instanceinvoke %9.<@assignment/DestructuringSample.ts: %AC2$%dflt-%dflt.constructor()>()',
            operandOriginalPositions: [[22, 26, 22, 44], [22, 26, 22, 44], [22, 26, 22, 44]],
        },
        {
            text: '%8 = %9',
            operandOriginalPositions: [[22, 2, 22, 23], [22, 26, 22, 44]],
        },
        {
            text: 'd9 = %8.<@assignment/DestructuringSample.ts: %AC2$%dflt-%dflt.d11>',
            operandOriginalPositions: [[22, 4, 22, 11], [22, 2, 22, 23], [22, 2, 22, 23]],
        },
        {
            text: 'd10 = %8.<@assignment/DestructuringSample.ts: %AC2$%dflt-%dflt.d12>',
            operandOriginalPositions: [[22, 13, 22, 21], [22, 2, 22, 23], [22, 2, 22, 23]],
        },
        {
            text: 'return',
            operandOriginalPositions: [],
        },
    ],
};