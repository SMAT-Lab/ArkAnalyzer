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

class Shadow {
    public top: number = 100;
}

class Outer {
    public m(): void {
        // Local class declared inside a method; references (new + type annotation)
        // must resolve to the local class, not to any same-name top-level class.
        let v: Local = new Local();
        v.x = 3;
        class Local {
            public x: number = 1;
        }
    }

    public n(): void {
        // A local class whose bare name shadows the top-level 'Shadow'.
        // The new expression must resolve to the LOCAL class (TS scope semantics),
        // not to the top-level Shadow.
        let s: Shadow = new Shadow();
        s.inner = 2;
        class Shadow {
            public inner: number = 2;
        }
    }

    public p(): void {
        // Local class referenced from a nested arrow function: the method scope chain
        // (arrow -> p) must resolve the class declared in the outer method.
        class Inner {
            public y: number = 1;
        }
        const f = (): Inner => {
            return new Inner();
        };
        f();
    }
}
