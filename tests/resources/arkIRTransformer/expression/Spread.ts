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

function spreadArray1(): void {
    const arr1 = [1, 2, 3];
    const arr2 = [...arr1];
}

function spreadArray2(): void {
    const arr1 = [1, 2, 3];
    const arr2 = [4, 5, 6];
    const arr3 = [...arr1, ...arr2];
}

function spreadArray3(): void {
    const arr1 = [1, 2, 3];
    const arr2 = [1, ...arr1];
}

function spreadArray4(): void {
    const arr1 = [1, 2, 3];
    const arr2 = [4, 5, 6];
    const arr3 = [...arr1, 4, 5, 6, ...arr2];
}

function sum(a: number, b: number, c: number):number {
    return a + b + c;
}

function spreadParameters1(): void {
    const nums: [number, number, number] = [1, 2, 3];
    sum(...nums);
}

function spreadParameters2(): void {
    const nums1: [number] = [1];
    const nums2: [number, number] = [2, 3];
    sum(...nums1, ...nums2);
}

function spreadParameters3(): void {
    const a = 1;
    const b = 2;
    const nums3: [number] = [3];
    sum(a, b, ...nums3);
}

function normalParameters(): void {
    const a = 1;
    const b = 2;
    const c = 3;
    sum(a, b, c);
}