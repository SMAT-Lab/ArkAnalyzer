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

class Case1 {
    static staticMethod(): void {
        console.log('static method');
    }

    static {
        console.log('static block');
    }
}

class Case2 {
    static {
        console.log('static block1');
    }
    static {
        console.log('static block2');
    }
}

class Case3 {
    static {
        console.log('static block1');
    }
    static field = 1;
    static {
        console.log('static block2');
    }
}

let globalClassField = 42;

class Case4 {
    static staticRef = globalClassField;
    instanceRef: number = globalClassField;
}