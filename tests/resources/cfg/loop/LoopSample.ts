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
    const arr = [[1, 2], [3, 4]];
    for (const [a, b] of arr) {
        console.log(a, b);
    }
}

function case2(): void {
    const arr = [{ a: 1, b: 2 }, { a: 3, b: 4 }];
    for (const { a, b } of arr) {
        console.log(a, b);
    }
}

function testFor(): void {
    const arr = [1, 2, 3];
    for (const item of arr) {
        console.log(item);
    }
}

function testWhile(): void {
    const arr = [1, 2, 3];
    const iterator = arr[Symbol.iterator]();
    const next = iterator.next();
    while (!next.done) {
        let item = next.value;
        console.log(item);
    }
}
