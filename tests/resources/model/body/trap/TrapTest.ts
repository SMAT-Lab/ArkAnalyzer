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
    try {
        console.log('try');
    } catch (e) {
        console.log('catch');
    } finally {
        console.log('finally');
    }
}

function case2(): void {
    try {
        console.log('try');
    } catch (e) {
        console.log('catch');
    }
}

function case3(): void {
    try {
        console.log('try');
    } finally {
        console.log('finally');
    }
}

function case4(): void {
    try {
        console.log('try');
        if (0) {
            console.log(1);
        } else {
            console.log(2);
        }
        console.log(3);
    } catch (e) {
        console.log('catch');
        if (4) {
            console.log(5);
        } else {
            console.log(6);
        }
        console.log(7);
    } finally {
        console.log('finally');
        if (8) {
            console.log(9);
        } else {
            console.log(10);
        }
        console.log(11);
    }
}

function case5(): void {
    let i = 0;
    try {
        console.log('try');
    } catch (e) {
        console.log('catch');
    } finally {
        console.log('finally');
    }
    console.log(i);
}

function case6(): void {
    let i = 0;
    try {
        console.log('try');
        try {
            console.log('inner try');

        } catch (innerE) {
            console.log('inner catch');
        } finally {
            console.log('inner finally');
        }
    } catch (e) {
        console.log('catch');
    } finally {
        console.log('finally');
    }
    console.log(i);
}

function case7(): void {
    let i = -1;
    try {
        i = 0;
    } catch (e) {
        i = 1;
    } finally {
        if (i) {
            i = 3;
        }
    }
    let j = i ? 3 : 4;
    console.log(j);
}

function case8(): void {
    let i = -1;
    try {
        i = 0;
    } catch (e) {
        i = 1;
    } finally {
        if (i) {
            i = 3;
        }
    }
    if (i > 1) {
        i--;
    }
    console.log(i);
}

function case9(): void {
    try {
    } catch (e) {
        console.log('catch');
    }
}

function case10(): void {
    try {
    } catch (e) {
        console.log('catch');
    } finally {
        console.log('finally');
    }
}

function case11(): void {
    try {
    } finally {
        console.log('finally');
    }
}

function case12(): void {
    let i = 0;
    try {
    } catch (e) {
        i = 1;
    }
    console.log(i);
}