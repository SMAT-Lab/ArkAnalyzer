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

interface User {
    id: number;
    name: string;
    age: number;
}

function forLoopCase(): { sumEven: number; countOdd: number } {
    let sumEven = 0;
    let countOdd = 0;
    let flag = false;
    const threshold = 8;

    for (let i = 1; i <= 15; i++) {
        if (i % 2 === 0) {
            sumEven += i;
            if (i > threshold) {
                sumEven += 1;
                flag = true;
            }
        } else {
            countOdd++;
            if (i % 3 === 0) {
                countOdd *= 2;
                flag = false;
            }
        }
        if (i % 5 === 0) {
            flag = false;
        }
    }

    if (sumEven > 50) {
        sumEven -= 3;
    }
    if (countOdd > 10) {
        countOdd = 10;
    }

    return { sumEven, countOdd };
}

function whileLoopCase(n: number): { total: number; even: number; odd: number } {
    let total = 1;
    let evenFactor = 1;
    let oddFactor = 1;
    let count = n;
    const max = 5000;

    while (count > 0 && total < max) {
        total *= count;
        if (count % 2 === 0) {
            evenFactor *= count;
            if (evenFactor > 100) {
                evenFactor /= 2;
            }
        } else {
            oddFactor *= count;
            if (oddFactor < 20) {
                oddFactor *= 2;
            }
        }
        count = count % 4 === 0 ? count - 2 : count - 1;
    }

    if (total >= max) {
        total = max;
        evenFactor = 0;
    }
    return { total, even: evenFactor, odd: oddFactor };
}

function doWhileLoopCase(init: number): { val: number; retry: number } {
    let input = init;
    let retryCount = 0;
    const min = 10;
    const max = 50;

    do {
        retryCount++;
        if (input < min) {
            input += 4;
            if (retryCount > 3) {
                input += 2;
            }
        } else if (input > max) {
            input -= 6;
        } else {
            break;
        }
    } while (retryCount < 8);

    if (input % 9 === 0) {
        input += 1;
    }
    return { val: input, retry: retryCount };
}

function forInLoopCase(): void {
    const user: User = { id: 101, name: 'Alice', age: 25 };
    let strRes = '';
    let numRes = 0;

    for (const key in user) {
        const val = user[key as keyof User];
        if (typeof val === 'number') {
            numRes += val;
            numRes = key === 'id' ? numRes * 0.1 : numRes;
        } else if (typeof val === 'string') {
            strRes += `${key}:${val};`;
            strRes = key === 'name' ? strRes.toUpperCase() : strRes;
        }
    }
    console.log(strRes, numRes);
}

function forOfLoopCase(): void {
    const nums = [10, 20, 30, 40];
    let doubleSum = 0;

    for (const num of nums) {
        doubleSum += num * 2;
        if (num % 20 === 0) {
            doubleSum += 5;
        }
    }

    const users = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 35 }];
    let ageSum = 0;
    for (const { name, age } of users) {
        ageSum += age;
        if (name.length > 2) {
            ageSum += 1;
        }
    }

    console.log(doubleSum, ageSum);
}
