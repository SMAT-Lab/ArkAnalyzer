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

function case1(): number {
    let i = 0;
    let j = i++;
    j = ++i;
    return j;
}

function case2(): number {
    let i = 1;
    let result = (i++) + (++i) * 2;
    return result;
}

function case3(): number {
    let i = 0;
    let j = (++i) > 1 ? i++ : --i;
    return j;
}

function case4(): number {
    let arr = [1, 2, 3];
    let i = 0;
    let val = arr[i++];
    arr[++i] = 4;
    return val;
}

function case5(): number {
    function add(x: number): number {
        return x++;
    }
    let i = 1;
    let result = add(++i);
    return result;
}


function case6(): number {
    let i = 0;
    if (++i > 0) {
        ++i;
    } else if (i++) {
        i++;
    }
    return i;
}

function case7(): number {
    let i = 0;
    while (i++) {
        while (++i) {

        }
    }
    return i;
}


function case8(): number {
    let i = 0;
    do {
        do {

        } while (++i);
    } while (i++);
    return i;
}

function case9(): number {
    let sum = 0;
    for (let i = 0; i++; i++) {
        for (; ++i; ++i) {

        }
    }
    return sum;
}

function case10(): number {
    let i = 0;
    switch (++i) {
        case 1:
            switch (i++) {
                case 1:

            }
            break;
        default:
            ++i;
            break;
    }
    return i;
}


function case11(): string {
    let i = 3;
    let str = `${i++}${++i}`;
    return str;
}
