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
    try {
        return produce(1);
    } finally {
        return produce(2);
    }
}

function case4(): number {
    try {
        throw new Error();
    } catch (e) {
        return 1;
    } finally {
        return 2;
    }
}

function case5(): number {
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

function case6(): void {
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

function case7(): number {
    try {
        return 1;
    } catch (e) {
        return 3;
    } finally {
        return 2;
    }
}

function case8(): number {
    try {
        throw new Error();
    } finally {
        return 2;
    }
}

function case9(): number {
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

function case10(): number {
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

function case11(): number {
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

function case12(): number {
    let i = 0;
    try {
        try {
            if (i === 0) {
                console.log('inner try if', i);
                return 1;
            } else {
                i = 2;
                console.log('inner try else', i);
            }
        } finally {
            i = i + 10;
            console.log('inner finally', i);
        }
        console.log('out try', i);
        return 3;
    } finally {
        i = i + 100;
        console.log('out finally', i);
    }
    return 4;
}

function case13(): number {
    let i = 0;
    try {
        if (i === 0) {
            return 1;
        } else {
            return 2;
        }
    } finally {
        i = i + 10;
    }
}

function case14(): number {
    let i = 0;
    try {
        return 1;
    } finally {
        if (i === 0) {
            i = 2;
        } else {
            i = 3;
        }
    }
}

function case15(): number {
    let i = 0;
    try {
        return i++;
    } finally {
        i = i + 10;
    }
}

function case16(): number {
    let r = 0;
    try {
        r = 1;
    } catch (e) {
        return 3;
    } finally {
        r = 2;
    }
    return r;
}

function case17(): number {
    let i = 0;
    try {
        return 1;
    } finally {
        if (i === 0) {
            return 2;
        } else {
            i = 3;
        }
    }
}

function case18(): number {
    let r = 0;
    try {
        r = 1;
        throw new Error();
    } catch (e) {
        throw e;
    } finally {
        r = 2;
    }
    return r;
}

function case19(): number {
    try {
        return 1;
    } finally {
        throw new Error();
    }
}

function case20(): number {
    let r = 0;
    try {
        try {
            r = 1;
        } finally {
            r = 2;
        }
        r = 3;
    } finally {
        r = 4;
    }
    return r;
}

function case21(): number {
    let r = 0;
    try {
        try {
            return 1;
        } finally {
            r = 2;
        }
    } finally {
        r = 3;
    }
}

function case22(): number {
    try {
        try {
            return 1;
        } finally {
            return 2;
        }
    } finally {
        return 3;
    }
}

function case23(): number {
    try {
        try {
            return 1;
        } finally {
            return 2;
        }
    } finally {
        throw new Error();
    }
}

function case24(): number {
    let r = 0;
    try {
        try {
            return 1;
        } finally {
            throw new Error();
        }
    } catch (e) {
        r = 2;
    } finally {
        r = 3;
    }
    return r;
}

function case25(): number {
    let r = 0;
    try {
        try {
            throw new Error();
        } finally {
            r = 1;
        }
    } catch (e) {
        r = 2;
    } finally {
        r = 3;
    }
    return r;
}

function case26(): number {
    let r = 0;
    try {
        try {
            throw new Error();
        } catch (e) {
            r = 1;
        } finally {
            r = 2;
        }
        return 3;
    } finally {
        r = 4;
    }
}

function case27(): number {
    let r = 0;
    try {
        try {
            throw new Error();
        } catch (e) {
            return 1;
        } finally {
            r = 2;
        }
    } finally {
        r = 3;
    }
}

function case28(): number {
    let r = 0;
    try {
        try {
            throw new Error();
        } catch (e) {
            throw e;
        } finally {
            r = 1;
        }
    } catch (e2) {
        r = 2;
    } finally {
        r = 3;
    }
    return r;
}

function case29(): number {
    let r = 0;
    try {
        try {
            throw new Error();
        } catch (e) {
            throw e;
        } finally {
            r = 1;
        }
    } finally {
        r = 2;
    }
    return r;
}

function case30(): number {
    let i = 0;
    let r = 0;
    try {
        try {
            if (i === 0) {
                return 1;
            } else {
                return 2;
            }
        } finally {
            r = 3;
        }
    } finally {
        r = 4;
    }
}

function case31(): number {
    let r = 0;
    try {
        try {
            return produce(1);
        } finally {
            r = 2;
        }
    } finally {
        r = 3;
    }
}

function case32(): number {
    let r = 0;
    try {
        try {
            try {
                return 1;
            } finally {
                r = 2;
            }
        } finally {
            r = 3;
        }
    } finally {
        r = 4;
    }
}

function case33(): number {
    let r = 0;
    try {
        try {
            try {
                return 1;
            } finally {
                r = 2;
            }
        } finally {
            return 3;
        }
    } finally {
        r = 4;
    }
}

function case34(): number {
    let r = 0;
    try {
        try {
            r = 1;
        } finally {
            r = 2;
        }
        try {
            return 3;
        } finally {
            r = 4;
        }
    } finally {
        r = 5;
    }
}

function case35(): number {
    let r = 0;
    try {
        try {
            throw new Error();
        } catch (e) {
            r = 1;
        }
        return 2;
    } finally {
        r = 3;
    }
}

function case36(): number {
    let r = 0;
    try {
        try {
            r = 1;
        } catch (e) {
            r = 2;
        }
    } finally {
        r = 3;
    }
    return r;
}

function case37(): number {
    let r = 0;
    let i = 0;
    while (i < 1) {
        try {
            try {
                break;
            } finally {
                r = 1;
            }
        } finally {
            r = 2;
        }
    }
    return r;
}

function case38(): number {
    let r = 0;
    let i = 0;
    while (i < 1) {
        try {
            try {
                i = 1;
                continue;
            } finally {
                r = 1;
            }
        } finally {
            r = 2;
        }
    }
    return r;
}

function case39(): number {
    let r = 0;
    let i = 0;
    while (i < 1) {
        try {
            try {
                throw new Error();
            } catch (e) {
                break;
            } finally {
                r = 1;
            }
        } finally {
            r = 2;
        }
    }
    return r;
}

function case40(): number {
    let r = 0;
    let i = 0;
    while (i < 2) {
        try {
            try {
                return 1;
            } finally {
                i = 2;
                continue;
            }
        } finally {
            r = 3;
        }
    }
    return r;
}

function case41(): number {
    let r = 0;
    let i = 0;
    try {
        while (i < 1) {
            try {
                break;
            } finally {
                r = 1;
            }
        }
        r = 2;
    } finally {
        r = 3;
    }
    return r;
}

function case42(): number {
    let r = 0;
    try {
        throw new Error();
    } catch (e) {
        try {
            r = 1;
        } finally {
            r = 2;
        }
    } finally {
        r = 3;
    }
    return r;
}

function case43(): number {
    let r = 0;
    try {
        throw new Error();
    } catch (e) {
        try {
            return 1;
        } finally {
            r = 2;
        }
    } finally {
        r = 3;
    }
}

function case44(): number {
    let r = 0;
    try {
        throw new Error();
    } catch (e) {
        try {
            return 1;
        } finally {
            return 2;
        }
    } finally {
        r = 3;
    }
    return r;
}

function case45(): number {
    let r = 0;
    try {
        throw new Error();
    } catch (e) {
        try {
            throw e;
        } finally {
            r = 1;
        }
    } finally {
        r = 2;
    }
    return r;
}

function case46(): number {
    let r = 0;
    let i = 0;
    while (i < 1) {
        try {
            throw new Error();
        } catch (e) {
            try {
                break;
            } finally {
                r = 1;
            }
        } finally {
            r = 2;
        }
    }
    return r;
}

function case47(): number {
    let r = 0;
    try {
        return 1;
    } finally {
        try {
            r = 2;
        } finally {
            r = 3;
        }
    }
}

function case48(): number {
    let r = 0;
    try {
        return 1;
    } finally {
        try {
            return 2;
        } finally {
            r = 3;
        }
    }
}

function case49(): number {
    let r = 0;
    try {
        return 1;
    } finally {
        try {
            throw new Error();
        } catch (e) {
            r = 2;
        }
    }
}

function case50(): number {
    let r = 0;
    try {
        return 1;
    } finally {
        try {
            throw new Error();
        } finally {
            r = 2;
        }
    }
}

function case51(): number {
    let r = 0;
    try {
        throw new Error();
    } catch (e) {
        try {
            r = 1;
        } finally {
            r = 2;
        }
    } finally {
        try {
            r = 3;
        } finally {
            r = 4;
        }
    }
    return r;
}

function case52(): number {
    let i = 0;
    let r = 0;
    try {
        if (i === 0) {
            try {
                return 1;
            } finally {
                r = 2;
            }
        } else {
            try {
                throw new Error();
            } finally {
                r = 3;
            }
        }
    } catch (e) {
        r = 4;
    } finally {
        r = 5;
    }
    return r;
}

function case53(): void {
    let r = 0;
    try {
        try {
            return;
        } finally {
            r = 1;
        }
    } finally {
        r = 2;
    }
}

function case54(): number {
    let r = 0;
    try {
        try {
        } finally {
            r = 1;
        }
    } finally {
        r = 2;
    }
    return r;
}

function case55(): number {
    let r = 0;
    try {
        throw new Error();
    } catch (e) {
        try {
            try {
                return 1;
            } finally {
                r = 2;
            }
        } finally {
            r = 3;
        }
    } finally {
        r = 4;
    }
}

function case56(): number {
    let r = 0;
    try {
        try {
            return 1;
        } finally {
            try {
                r = 2;
            } finally {
                r = 3;
            }
        }
    } finally {
        r = 4;
    }
}

function case57(): number {
    let r = 0;
    try {
        try {
            throw new Error();
        } finally {
            try {
                r = 1;
            } finally {
                r = 2;
            }
        }
    } catch (e) {
        r = 3;
    } finally {
        r = 4;
    }
    return r;
}

function case58(): number {
    let i = 0;
    let r = 0;
    try {
        try {
            return 1;
        } finally {
            if (i === 0) {
                return 2;
            } else {
                r = 3;
            }
        }
    } finally {
        r = 4;
    }
}

function case59(): number {
    let r = 0;
    for (let i = 0; i < 1; i++) {
        try {
            try {
                continue;
            } finally {
                r = 1;
            }
        } finally {
            r = 2;
        }
    }
    return r;
}

function case60(): number {
    let r = 0;
    try {
        try {
            r = 1;
        } finally {
            r = 2;
        }
        throw new Error();
    } catch (e) {
        r = 3;
    } finally {
        r = 4;
    }
    return r;
}

function case61(): number {
    let r = 0;
    try {
        return 1;
    } finally {
        try {
            r = 2;
        } finally {
            return 3;
        }
    }
}

function case62(): number {
    let r = 0;
    try {
        try {
            return 1;
        } finally {
            throw new Error();
        }
    } finally {
        r = 2;
    }
    return r;
}
