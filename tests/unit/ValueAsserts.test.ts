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

import { describe, expect, it } from 'vitest';
import { ValueAsserts } from '../../src/utils/ValueAsserts';

describe('Test Value Assert', () => {
    ValueAsserts.enable();

    it('case1: assert defined', () => {
        const undefinedValue = undefined;
        const definedValue = 123;
        expect(() => {
            ValueAsserts.assertDefined(undefinedValue);
        }).toThrow('Assert failed: value is undefined');

        expect(() => {
            ValueAsserts.assertDefined(undefinedValue, 'test in unittest');
        }).toThrow('Assert failed: test in unittest');

        expect(() => {
            ValueAsserts.assertDefined(definedValue, 'test in unittest');
        }).not.toThrow();
    });

    it('case2: assert not empty', () => {
        const array = [1, 2, 3];
        const emptyArray: string[] = [];
        expect(() => {
            ValueAsserts.assertNotEmptyArray(emptyArray);
        }).toThrow('Assert failed: array is empty');

        expect(() => {
            ValueAsserts.assertNotEmptyArray(emptyArray, 'test in unittest');
        }).toThrow('Assert failed: test in unittest');

        expect(() => {
            ValueAsserts.assertNotEmptyArray(array, 'test in unittest');
        }).not.toThrow();
    });

    it('case3: assert general', () => {
        const array = [1, 2, 3];
        const emptyArray: string[] = [];
        expect(() => {
            ValueAsserts.assert(array.length > 3);
        }).toThrow('Assert failed: condition is false');

        expect(() => {
            ValueAsserts.assert(array.length > 3, 'test in unittest');
        }).toThrow('Assert failed: test in unittest');

        expect(() => {
            ValueAsserts.assert(emptyArray.length === 0, 'test in unittest');
        }).not.toThrow();
    });

    it('case4: disable assert', () => {
        ValueAsserts.disable();
        const array: string[] = [];
        const undefinedValue = undefined;
        expect(() => {
            ValueAsserts.assert(array.length > 3);
        }).not.toThrow();

        expect(() => {
            ValueAsserts.assertDefined(undefinedValue);
        }).not.toThrow();

        expect(() => {
            ValueAsserts.assertNotEmptyArray(array);
        }).not.toThrow();
    });
});