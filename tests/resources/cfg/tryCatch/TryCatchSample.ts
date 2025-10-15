/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

function case1(): void {
    let i = 0;
    try {
        if (i !== 0) {
            let y = 10 / i;
        }
    } catch (e) {
        console.log('i === 0');
    }
}

function case2(): void {
    try {
        let a = 1;
    } catch (e) {
        let b = 2;
    } finally {
        type FuncType = (p: string) => void;
        let c: FuncType = (p: string): number => {
            return 0;
        };
    }
}