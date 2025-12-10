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
/**
 * 测试 this 字段访问的处理
 * 验证 PagThisRefNode 作为 baseNode 时的字段访问是否正确
 */

namespace ThisFieldAccessTest {
    export class MyClass {
        public name: string = "test";
        public value: number = 0;
        
        public method1(): void {
            // 直接访问 this 字段
            // @pta-expect: field-access(this.name) handled
            const n = this.name;
            
            // @pta-expect: field-access(this.value) handled
            this.value = 42;
        }
        
        public method2(): void {
            // 在不同的方法中访问 this 字段
            // @pta-expect: field-access(this.name) handled
            const n = this.name;
        }
    }
    
    export function test(): void {
        const obj = new MyClass();
        obj.method1();
        obj.method2();
    }
}

