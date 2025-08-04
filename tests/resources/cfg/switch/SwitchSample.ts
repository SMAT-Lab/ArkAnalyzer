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
    let a = 0;
    let b = 1;
    switch (a) {
        case 2:
            b = 2;
        case 3:
            b = 3;
            break;
        default:
            b = 10;
    }
}

function case2(): void {
    let a = 0;
    let b = 1;
    switch (a) {
        case 2: {
            let b = 2;
        }
        case 3: {
            let b = 3;
            break;
        }
        default:
            let b = 10;
    }
}

function case3(): void {
    let a = 0;
    let b = 1;
    switch (a) {
        case 2:
            b = 2;
        case 3:
            switch (b) {
                case 1:
                    b = 11;
                case 2:
                    b = 12;
                default:
                    b = 100;
            }
            break;
        default:
            b = 10;
    }
}

function case4(): void {
    let b = 1;
    for (let i = 0; i < 3; i++) {
        switch (i) {
            case 2:
                b = 2;
            case 3:
                b = 3;
                continue;
            default:
                b = 10;
        }
        b = 100;
    }
}

function case5(): void {
    let a = 0;
    let b = 1;
    switch (a) {
        default:
            b = 10;
    }
}

function case6(): void {
    let a = 0;
    let b = 1;
    switch (a++) {
    }
    a = 1;
}

function case7(): void {
    let a = 0;
    let b = 1;
    switch (a) {
        case 2:
            b = 2;
        case 3:
            b = 3;
            break;
        case 4:
            b = 4;
    }
}

function case8(): void {
    let a = 0;
    let b = 1;
    switch (a) {
        case 2:
        case 3:
            b = 3;
            break;
        default:
            b = 10;
    }
}

function case9(): void {
    let a = 0;
    let b = 1;
    switch (a) {
        case 2:
        case 3:
        default:
            b = 10;
    }
}

function case10(): void {
    let a = 0;
    let b = 1;
    switch (a) {
        case 2:
        case 3:
            b = 3;
    }
}

function case11(): void {
    let a = 0;
    let b = 1;
    switch (a) {
        case 2:
        case 3:
            b = 3;
            break;
        default:
    }
}

function case12(): void {
    let a = 0;
    let b = a > 1 ? 12 : 13;
    switch (a) {
        case 2:
            b = 2;
            break;
        case 3:
            b = 3;
            break;
        default:
            b = 10;
            break;
    }
}

function case13(): void {
    let a = 0;
    let b = 1;
    switch (a) {
        case 2:
            b = 2;
            break;
        case 3:
            b = 3;
            break;
        default:
            b = 10;
            break;
    }
    b = a > 1 ? 12 : 13;
}

function case14(): void {
    let a = 0;
    switch (a) {
        case 1: 
            return;
        case 2:
            return;
    }
    a = 1;
}