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

namespace ArrayFieldOutTest {
    const arrayType = '[object Array]';
    
    class Clone {
        private static getClone = new Clone();

        public static getInstance() {
            return this.getClone;
        }

        private forEach(array, iteratee) {
            let index = -1;
            const length = array.length;

            while (++index < length) {
                iteratee(array[index], index);
            }
            return array;
        }

        private getInit(target) {
            const Ctor = target.constructor;
            return new Ctor();
        }

        public clone(target, map = new WeakMap()) {
            let cloneTargets;

            cloneTargets = this.getInit(target);

            return cloneTargets;
        }
    }

    class BtnStruct { }

    class Obj {
        private btnList: Array<BtnStruct> = [];

        foo(arr: Array<BtnStruct>) {
            
            this.btnList = Clone.getInstance().clone(arr);
            return arr.length;  
        }

        goo() {
            this.btnList[0] = new BtnStruct();
        }
    }

    export function main() {
        let obj = new Obj();
        obj.foo([]);
        obj.goo();
    }
}

