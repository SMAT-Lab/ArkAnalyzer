/*
 * Copyright (c) 2025-2026 Huawei Device Co., Ltd.
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
    let a = 1;
    let b = 2;
    let c = 3;
    if (a > 0 && b > 0 && c > 0) {
    }
}

function case2(): void {
    let a = 1;
    let b = 2;
    if (a > 0 || b > 0) {
    }
}

function case3(): void {
    let a = 1;
    let b = 2;
    if (a > 0) {
        a = 10;
    } else if (a < 0 && b > 0) {
    }
}

function case4(): void {
    let a = 1;
    let b = 2;
    let c = 3;
    if (a > 0 && b > 0) {
    } else if (b > 0 || c > 0) {
    }
}

function case5(): void {
    let a = 1;
    let b = 2;
    if (a > 0 && b > 0) {
    } else {
        a = 10;
    }
}
