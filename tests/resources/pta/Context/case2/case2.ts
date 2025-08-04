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

namespace Context_Case_2 {
    class SimpleData {
        constructor(public name: string) { }
    }

    class Box {
        value: SimpleData | null = null;
    }

    function assign(container: Box, content: SimpleData): void {
        container.value = content;
    }

    function main(): void {
        // 调用点 1 (callsite 1)
        const boxA = new Box();
        const objA = new SimpleData('A'); // 使用 new 创建实例
        assign(boxA, objA);

        // 调用点 2 (callsite 2)
        const boxB = new Box();
        const objB = new SimpleData('B'); // 使用 new 创建实例
        assign(boxB, objB);
    }
}