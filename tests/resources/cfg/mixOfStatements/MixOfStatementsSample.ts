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

// Conditional statement appears after try...catch
function case1(): void {
    let i = 0;
    try {
        i++;
    } catch (e) {
        console.log(e);
    }
    let j = i ? i : 0;
}

// Conditional statement appears before try...catch
function case2(): void {
    let i = 1;
    if (i === 0) {
        return;
    }
    try {
        i++;
    } catch (e) {
        console.log(e);
    }
}

// The conditional branch in the finally block of a try...catch contains other try...catch
function case3(): void {
    let i = 0;
    try {
        i = 1;
    } catch (e) {
        console.log('outer catch', e);
    } finally {
        if (i === 1) {
            try {
                i = 2;
            } catch (e) {
                console.log('inner catch', e);
            }
        }
    }
}

// The for loop contains only a try...catch and the try block contains a conditional branch.
function case4(): void {
    let i = 0;
    for (let j = 0; j < 10; j++) {
        try {
            i++;
            if (j === 5) {
                continue;
            }
            i--;
        } catch (e) {
            console.log(e);
        }
    }
    return;
}