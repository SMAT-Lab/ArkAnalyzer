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

function case1(): number {
    let i = 10;
    let j = 0;

    if (i > 5) {
        i = 20;
        j = i > 15 ? i : -i;
    } else {
        j = i < 0 ? i : i + 5;
    }

    return j;
}

function case2(): number {
    let i = -5;
    let k = 3;
    let m = 4;
    let j = 0;

    j = i < 0
        ? i < -3
            ? i < -6 ? k + 2 : m - 1
            : k * 3
        : i > 2
            ? i - m
            : i + k;

    return j;
}