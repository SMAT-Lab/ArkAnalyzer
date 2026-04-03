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

function case1(): void {
    let num1 = 5;
    let result1 = 0;
    try {
        result1 = num1 / (num1 - 5);
        num1 = 10;
        let temp1 = result1 + num1;
        result1 = temp1 + 1;
    } catch (e) {
        result1 = -1;
        num1 = -5;
        let temp2 = result1 - num1;
        result1 = temp2 - 1;
    }
    num1 += 1;
    result1 *= 2;
    let final1 = num1 + result1;
    console.log(final1);
}

function case2(): void {
    let num2 = 100;
    let flag2 = false;
    try {
        num2 = Number('abc');
        if (isNaN(num2)) {
            throw new Error();
        }
        flag2 = true;
        num2 += 50;
        let temp3 = num2 + 10;
        num2 = temp3;
    } catch (e) {
        num2 = -100;
        flag2 = true;
        num2 -= 20;
        let temp4 = num2 - 5;
        num2 = temp4;
    } finally {
        type Handler2 = (err: Error) => void;
        const fn2: Handler2 = (err) => {
            console.log(err.message);
        };
        num2 += 10;
        flag2 = false;
        let temp5 = num2 * 2;
        num2 = temp5;
        fn2(new Error('test'));
    }
    let total2 = num2 + (flag2 ? 1 : 0);
    console.log(total2);
}

function case3(): void {
    let num3 = 1;
    let val3 = 2;
    try {
        if (num3 === 1) {
            throw new TypeError('test');
        }
        val3 = num3 * 10;
        num3 = val3 + 5;
        let temp6 = num3 + val3;
        num3 = temp6;
    } catch (e) {
        if (e instanceof TypeError) {
            val3 = num3 * 20;
            num3 = val3 - 3;
            let temp7 = num3 - val3;
            num3 = temp7;
        } else {
            val3 = num3 * 30;
            let temp8 = num3 + val3 * 2;
            val3 = temp8;
        }
    }
    num3 += val3;
    let res3 = num3 - val3;
    val3 = res3 * 2;
    let final3 = num3 + val3 + res3;
    console.log(final3);
}