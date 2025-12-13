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
    let j = i > 0 ? i : -i;
    return j;
}

function case2(): number {
    let i = 0;
    let k = 0;
    let j = i > 0 ? k = i : -i;
    return j;
}

function case3(): number {
    let i = 0;
    let j = i < 0 ? i < -1 ? 1 : 2 : i > 1 ? 3 : 4;
    return j;
}

function case4(): number {
    let i = 0;
    let j = i < 0 ? (i < -1 ? 1 : 2) + 3 : 4;
    return j;
}

function case5(): number {
    let i = 0;
    let j = i < 0 ? i < -1 ? i < -2 ? 1 : 2 : 3 : 4;
    return j;
}

function case6(): number {
    let i = 0;
    let j = i > 0 ? i : -i;
    let k = j > 0 ? j : -j;
    return k;
}

function case7(): void {
    let i = 0;
    if (i > -1) {
        let j = i > 0 ? i : -i;
    }
}

function case8(): void {
    let i = 0;
    if (i > 0) {
        i = 1 ? 2 : 3;
        i = 4;
    } else {
        i = 5;
    }
    i = 6;
}