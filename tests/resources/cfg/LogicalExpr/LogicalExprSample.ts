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

function case1(): void {
    let i = 0;
    let j = 0;
    let k = 0;
    while (i < 20 && i !== 7) {
        if (j < 10) {
            for (let m = 0; (m < 5 && m !== 2) || m === 9; m++) {
                k++;
            }
            j++;
        }
        i++;
    }
    return;
}

function case2(): void {
    let a = 0;
    let b = 0;
    for (let i = 0; (i < 15 && i !== 3) || i === 20; i++) {
        do {
            while (b < 8 && b !== 4) {
                a++;
                b++;
            }
        } while (a < 50);
        a++;
    }
    return;
}

function case3(): void {
    let x = 0;
    let y = 0;
    do {
        while (x < 12) {
            for (let i = 0; i < 6 && i !== 2; i++) {
                y++;
            }
            x++;
        }
    } while ((x < 30 && x !== 10) || x === 40);
    return;
}

function case4(): void {
    let p = 0;
    let q = 0;
    while (p < 8 || p === 16) {
        if (q < 5 && p !== 1) {
            do {
                p++;
                q++;
            } while ((q < 6 && q !== 2) || q === 12);
        }
        p++;
    }
    return;
}

function case5(): void {
    let m = 0;
    let n = 0;
    for (let i = 0; i < 10; i++) {
        while ((m < 12 && m !== 5) || m === 18) {
            do {
                m++;
                n++;
            } while (n < 8 && n !== 3);
            m++;
        }
    }
    return;
}
