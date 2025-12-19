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
    let a = 5;
    let b = 10;
    let c = a + b;
    let loopCount = 0;

    switch (a % 3) {
        case 1:
            a = 10;
            b = c - 5;
            c = a * b;
        case 2:
            loopCount++;
            a = loopCount * 2;
            b = a + c;
            if (b > 100) {
                c = b - 50;
            }
        default:
            a = c % 7;
            b = loopCount + a;
            c = b * loopCount + 15;
            loopCount = c - a;
            if (loopCount < 10) {
                a = 99;
            }
    }
}

function case2(): void {
    let x = 8;
    let y = 15;
    let z = x - y;
    let flag = false;

    switch (Math.floor(x / 3)) {
        case 2:
            x = 20;
            y = x + z;
            z = y - 5;
            flag = true;
            break;
        case 3:
            y = 30;
            x = y - z;
            z = x * 2;
            flag = false;
            break;
        default:
            z = 40;
            x = z + y;
            y = x - 10;
            flag = (x > y);
            if (flag) {
                x = 50;
            } else {
                y = 60;
            }
    }
}

function case3(): void {
    let p = 12;
    let q = 7;
    let r = p % q;
    let temp = 0;
    let count = 3;

    switch (r + count) {
        case 5:
            p = q * count;
            q = p - r;
            temp = q + r;
            r = temp / 2;
            count--;
        case 6:
            p = temp + count;
            q = r * 4;
            temp = p + q;
            if (temp > 50) {
                r = temp - 20;
                count = r % 5;
            }
            break;
        default:
            p = count * 8;
            q = p / 4;
            temp = q + r;
            r = temp * 3;
            count = temp + r;
            if (count < 20) {
                p = 100;
                q = 200;
            } else {
                r = 300;
                temp = 400;
            }
    }
}