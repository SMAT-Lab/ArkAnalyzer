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

function case13(): boolean {
    let result = false;
    try {
        result = true;
    } catch (e) {
        console.log('catch');
    } finally {
        return result;
    }
}

function case14(): number {
    let i = 0;
    try {
        i = 1;
    } catch (e) {
        i = 2;
    } finally {
        try {
            i = 3;
        } catch (innerE) {
            i = 4;
        } finally {
            i = 5;
        }
    }
    return i;
}

function case15(): number {
    let i = 0;
    try {
        i = 1;
    } catch (e) {
        try {
            i = 2;
        } catch (innerE) {
            i = 3;
        } finally {
            i = 4;
        }
    } finally {
        i = 5;
    }
    return i;
}

function case16(): number {
    let i = 0;
    try {
        try {
            i = 1;
        } catch (innerE) {
            i = 2;
        } finally {
            return i;
        }
    } catch (e) {
        i = 3;
    } finally {
        i = 4;
    }
    return i;
}

function case17(): number {
    let i = 0;
    try {
        i = 1;
    } finally {
        return i;
    }
}

function case18(): number {
    let i = 0;
    try {
        try {
        } catch (innerE) {
            i = 1;
        }
        i = 2;
    } catch (e) {
        i = 3;
    } finally {
        i = 4;
    }
    return i;
}

function case19(): number {
    let i = 0;
    try {
        i = 1;
        try {
            i = 2;
        } catch (innerE) {
            i = 3;
        } finally {
            try {
                i = 4;
            } catch (deepE) {
                i = 5;
            }
            i = 6;
        }
    } catch (e) {
        i = 7;
    } finally {
        i = 8;
    }
    return i;
}

function case20(): number {
    let i = 0;
    try {
        i = 1;
    } catch (e) {
        try {
            i = 2;
        } catch (innerE) {
            i = 3;
        }
    }
    return i;
}

function case21(): string {
    try {
        return 'ok';
    } catch (err) {
        try {
            return 'retry';
        } catch (err2) {
            console.log('retry failed');
        }
    }
    return '';
}

function case22(): number {
    let i = 0;
    try {
        i = 1;
    } catch (error) {
        i = 2;
    }
    try {
        i = 3;
    } catch (error) {
        try {
            i = 4;
        } catch (err) {
            i = 5;
        }
    }
    return i;
}