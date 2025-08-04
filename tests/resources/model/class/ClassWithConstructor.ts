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

class ClassWithNoConstructor {
    test(a: string): void {
        console.log('no constructor');
    }
}

class ClassWithNoParamConstructor {
    a: number;

    constructor() {
        this.a = 123;
    }
}

class ClassWithParamsConstructor {
    static a: number = 123;
    private b: string;

    constructor(b: string) {
        this.b = b;
    }
}

class ClassWithSuperConstructor extends ClassWithParamsConstructor {
    c: boolean;

    constructor(b: string, c: boolean) {
        super(b);
        this.c = c;
    }
}

class ClassWithParamProperty {
    static x: number = 456;
    y: string = 'abc';

    constructor(
        public a: number = 123,
        private readonly b: string,
        protected c: boolean,
        e: string = 'abc',
        public d?: string,
    ) {
        console.log('this is constructor method');
    }
}

export class O {
    o: string = 'o';

    constructor() {
    }
}
