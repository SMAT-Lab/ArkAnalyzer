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

function testDotDotDotToken(arr1: number[], ...arr2: number[]): void {
    console.log('This is a function for testing dotDotDotToken.');
}

function testObjectTypeParam(obj: object): void {
    console.log('This is a function for testing parameter of object type.');
}

function outerFunction1(): void {
    innerFunction1();

    function innerFunction1(): void {
        console.log('This is nested function with function declaration.');

        function innerInnerFunction1(): void {
            console.log('This is nested function in nested function with function declaration.');
        }

        innerInnerFunction1();
    }
}

function outerFunction2(): (param: string) => void {
    let innerFunction2 = 2;
    return function innerFunction2(param: string): void {
        console.log(`This is nested function with return statement. param ${param}`);
    };
}

function outerFunction3(): void {
    const innerFunction3 = function (): void {
        console.log('This is nested function with function expression.');
    };
    innerFunction3();
}

function outerFunction4(): void {
    const innerFunction4 = (): void => {
        console.log('This is nested function with arrow function.');
    };
    innerFunction4();
}

function outerFunction5(n: number): number {
    function factorial(n: number): number {
        if (n === 0 || n === 1) {
            return 1;
        }
        return n * factorial(n - 1);
    }

    return factorial(n);
}

class NestedTestClass {
    public outerMethod(): () => void {
        innerFunction1();

        function innerFunction1(): void {
            console.log('innerFunction1');
        }

        const innerFunction2 = function (): void {
            console.log('innerFunction2');
        };
        const innerFunction3 = (): void => {
            console.log('innerFunction3');
        };
        innerFunction2();
        innerFunction3();
        return () => {
            console.log('innerFunction4');
        };
    }
}

interface InterfaceA {
    optionalMethod?(): void
}

class ClassA {
    optionalMethod?(): void {
    }
}

type MyType = {
    requiredMethod(): string;
    optionalMethod?(): string;
};

const myObject: {
    requiredMethod(): void;
    optionalMethod?(): void;
};

function paramWithInitializer(a: string, x: number = 5, y = 'abc', z: number = x + 1): number {
    console.log(a + y);
    return (x + z);
}

function getA(): number {
    return 1;
}

const condition = true;

function paramWithComplicatedInitializer(a = getA(), b = condition ? 'true' : 'false', c: string): void {
    console.log(a + b);
}

function paramInitializerWithIfBranch(a = 3): number {
    if (a > 0) {
        return a;
    } else {
        return -a;
    }
}

function paramInitializerWithTernary(a = 3): number {
    let b: number;
    a > 0 ? b = a : b = -a;
    return b;
}

function paramInitializerWithTryCatch(a = 3): void {
    try {
        console.log(a);
    } catch (e) {
        console.log(e);
    }
}

function paramInitializerWithForLoop(a = 3): void {
    for (let i = 0; i < a; i++) {
        console.log(i);
    }
}

function paramInitializerWithSwitch(a = 3): void {
    switch (a) {
        case 1:
            console.log(a + 1);
            break;
        default:
            console.log(a);
    }

}

function returnFunc(): Function {
    const nestedReturnFunc = (): void => {

    };
    return nestedReturnFunc;
}

function func(): Function {
    return returnFunc;
}

let globalNumber = 2;

function assign2Global(): void {
    globalNumber = 3;
}

function constructor(): void {
}

namespace ConstructorTest {
    export function constructor(): void { }
}
