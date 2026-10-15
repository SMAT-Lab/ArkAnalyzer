/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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
    let r = 0;
    try {
        r = 1;
    } finally {
        r = 2;
    }
    return r;
}

function produce(n: number): number {
    return n;
}

function case2(): number {
    try {
        return 1;
    } finally {
        return 2;
    }
}

function case3(): number {
    let r = 0;
    try {
        return 1;
    } finally {
        r = 2;
    }
}

function case4(): number {
    try {
        return produce(1);
    } finally {
        return produce(2);
    }
}

function case5(): number {
    try {
        throw new Error();
    } catch (e) {
        return 1;
    } finally {
        return 2;
    }
}

function case6(): number {
    let r = 0;
    let i = 0;
    while (i < 1) {
        try {
            r = 1;
            break;
        } finally {
            r = 2;
        }
        i++;
    }
    return r;
}

function case7(): number {
    let r = 0;
    for (let i = 0; i < 1; i++) {
        try {
            r = 1;
            continue;
        } finally {
            r = 2;
        }
        r = 3;
    }
    return r;
}

function case8(): void {
    try {
        console.log('try');
        return;
    } catch (e) {
        console.log('catch');
    } finally {
        console.log('finally');
    }
    console.log('last');
}

function case9(): void {
    try {
        console.log('try');
        return;
    } catch (e) {
        console.log('catch');
        return;
    } finally {
        console.log('finally');
        return;
    }
    console.log('last');
}

function case10(): number {
    try {
        return 1;
    } catch (e) {
        return 3;
    } finally {
        return 2;
    }
}

function case11(): number {
    try {
        throw new Error();
    } finally {
        return 2;
    }
}

function case12(): number {
    let i = 0;
    try {
        try {
            i = 1;
        } finally {
            return i;
        }
    } finally {
        i = 4;
    }
    return i;
}

function case13(): number {
    let r = 0;
    for (let i = 0; i < 1; i++) {
        try {
            throw new Error();
        } catch (e) {
            r = 1;
            continue;
        } finally {
            r = 2;
        }
        r = 3;
    }
    return r;
}

function case14(): number {
    let i = 0;
    try {
        if (i === 0) {
            return i;
        } else {
            i = 1;
        }
    } finally {
        i = i + 1;
    }
    return i + 2;
}
