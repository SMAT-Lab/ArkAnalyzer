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

function restElements1(): void {
    let [a, ...b] = [1, 2, 3];
    [a, ...b] = [4, 5, 6];
}

function restElements2(): void {
    let [...arr] = [1, 2, 3];
    [...arr] = [4, 5, 6];
}

function restElements3(): void {
    let [a, b, ...[c, d]] = [1, 2, 3, 4];
    [a, b, ...[c, d]] = [1, 2, 3, 4];
}

function restParameter(...numbers: number[]):number {
    return numbers.reduce((total, num) => total + num, 0);
}

function restParameterUse(): void {
    const arr = [1, 2, 3];
    restParameter(...arr);

    restParameter(1, 2, 3);
}