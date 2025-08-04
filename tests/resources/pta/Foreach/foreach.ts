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

namespace Foreach {
    class MyCustomSpan {
        id: number;

        constructor(id: number) {
            this.id = id;
        }
    }

    function arrayForeach(): void {
        let ele = new MyCustomSpan(0);
        let ele2 = new MyCustomSpan(1);
        let arr = [ele, ele2];
        arr.forEach((value: MyCustomSpan, index: number) => {
            let temp = value;
        });
    }

    function setForeach(): void {
        let s = new Set();
        let ele = new MyCustomSpan(0);
        s.add(ele);
        s.forEach((value: MyCustomSpan) => {
            let temp = value;
        });
    }

    function mapForeach(): void {
        let s = new Map();
        let ele = new MyCustomSpan(0);
        s.set(0, ele);
        s.forEach((value: MyCustomSpan, index: number) => {
            let temp = value;
        });
    }

    function main(): void {
        arrayForeach();
        setForeach();
        mapForeach();
    }
}