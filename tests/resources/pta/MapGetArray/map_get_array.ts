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
 * 测试 Map 类型混淆问题
 * 
 * 问题：不同类型的 Map 共享同一个 Map.field 节点
 * - Map<string, Function> 存储单个 Function
 * - Map<string, Function[]> 存储 Function 数组
 * 导致 Map.get() 返回值类型混淆
 */

namespace MapGetArrayTest {
    export class MapStoreFunction {
        private map1: Map<string, Function> = new Map();
        
        public register(name: string, cb: Function): void {
            this.map1.set(name, cb);
        }
        
        public call(name: string): void {
            const cb = this.map1.get(name);
            if (cb) {
                cb();
            }
        }
    }
    
    export class MapStoreFunctionArray {
        private map2: Map<string, Function[]> = new Map();
        
        public on(event: string, callback: Function): void {
            let cbs = this.map2.get(event);
            
            if (!cbs) {
                cbs = new Array<Function>();
                this.map2.set(event, cbs);
            }
            
            cbs.push(callback);
        }
        
        public emit(event: string): void {
            const cbs = this.map2.get(event);
            if (!cbs) return;
            
            const len = cbs.length;
            
            for (let i = 0; i < len; i++) {
                const cb = cbs[i];
                if (cb) cb();
            }
        }
    }
    
    export function main(): void {
        const mgr1 = new MapStoreFunction();
        mgr1.register("event", () => { console.log("1"); });
        mgr1.call("event");
        
        const mgr2 = new MapStoreFunctionArray();
        mgr2.on("event", () => { console.log("2"); });
        mgr2.emit("event");
    }
}
