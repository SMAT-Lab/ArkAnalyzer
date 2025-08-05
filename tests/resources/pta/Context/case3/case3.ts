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

namespace Context_Case_3 {
    class Base { }

    class A {
        field: Base;

        setField(value: Base): void {
            this.field = value;
        }

        getField(): Base {
            return this.field;
        }
    }

    function main(): void {
        let base = new Base();
        main2(base);
    }

    function main2(base: Base): void {
        let a = new A();
        main3(base, a);
    }

    function main3(base: Base, a: A): void {
        a.setField(base);
        main4(a);
    }

    function main4(a: A): void {
        let b = a.getField();
    }
}