/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

// instance invoke
a1.call1();
let a2 = a3.call2();
let a4 = a3.call3(para1, para2);
a4.call4(a3.field1);

// static invoke
call10();
let a20 = call20();
let a40 = call30(para10, para20);

// call chain
let a200 = call200().call300(para100, para200);

// ptr invoke expr test
function returnFunc1(): () => void {
    const nestedReturnFunc:()=>void = () => {
        /* Empty */
    };
    nestedReturnFunc();

    return nestedReturnFunc;
}

function returnFunc2(): () => () => void {
    return returnFunc1;
}

function callFuncReturned(): void {
    returnFunc2()()();
}

async function promiseCall(): Promise<void> {
    const promise = new Promise((resolve) => {
        resolve(42);
    });
    await promise;
}
