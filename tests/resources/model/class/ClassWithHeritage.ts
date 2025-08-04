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

import { O } from './ClassWithConstructor';

class A {
    name: string = 'abc';
}

class B extends A {
    age: number = 123;
}

class Q extends B {
    constructor() {
        super();
    }
}

class C {
    c: number;
    constructor(c: number) {
        this.c = c;
    }

    foo(): void {}
}

class D extends C {
    d: string = 'd';

    goo(): void {
        this.foo();
        super.foo();
    }
}

class E extends C {
    e: string;

    constructor(c: number, e: string) {
        super(c);
        this.e = e;
    }

    foo(): string {
        return 'e-foo';
    }

    goo(): void {
        this.foo();
        super.foo();
    }
}

class F extends O {
    f: string;

    constructor(f: string) {
        super();
        this.f = f;
    }
}

class G extends D {
    f: string = 'g';

    goo(): void {
        this.foo();
    }
}

class H extends HH {
    h: string = 'h';

    constructor() {
        super();
    }
}
