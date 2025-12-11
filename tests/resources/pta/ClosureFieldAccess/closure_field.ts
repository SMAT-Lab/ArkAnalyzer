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
 * 闭包中访问字段
 * 
 * 问题：在闭包/箭头函数中访问 this.field 时，
 * this 的指针集可能错误地包含函数节点，
 */

namespace ClosureFieldAccessTest {
    
    class BroadCast {
        on(event: string, callback: Function): void {
            callback();
        }
        
        emit(event: string, args: any[]): void {}
        
        off(event: string, callback: Function | null): void {}
    }
    
    class Manager {
        private static instance: Manager = new Manager();
        
        static getInstance(): Manager {
            return this.instance;
        }
        
        getBroadCast(): BroadCast {
            return new BroadCast();
        }
    }
    
    class TestClass {
        private appBroadCast: BroadCast = Manager.getInstance().getBroadCast();
        private value: number = 0;
        
        testMethod(): void {
            // 问题场景：在箭头函数（闭包）中访问 this.appBroadCast
            // 修复前：this 的指针集错误地包含函数节点
            // 访问 this.appBroadCast 时 basePt 为 PagFuncNode，导致报错
            this.appBroadCast.on("event", (): void => {
                this.value = 42;
                
                // 修复前这里会报错：baseNode type: PagFuncNode
                this.appBroadCast.emit("event", [this.value]);
            });
        }
        
        testMethod2(): void {
            this.appBroadCast.on("outer", (): void => {
                this.appBroadCast.on("inner", (): void => {
                    this.appBroadCast.off("inner", null);
                });
            });
        }
    }
    
    export function main() {
        let obj = new TestClass();
        
        obj.testMethod();
        obj.testMethod2();
    }
}

