/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

import { Constants, myNamespaceA } from './constants';
import sensor from '@ohos.sensor';

class Sample {
    public sampleMethod(): Sample;
    public sampleMethod(input: number): Sample;
    public sampleMethod(input?: number): Sample {
        return new Sample();
    }

}

function test_new_array(): void {
    let arr11: number[] = new Array(Constants.ARRAY_SIZE);
    let index = 0;
    let a2 = arr11[2];
    let a = 1;
    let b = 2;
    let c = Constants.INFO[a + b];
    let s = Constants.INFO[a];
    let n = Constants.INFO[3];
    let y = Constants.INFO['b'];
}

function testArray(): void {
    const arr13: number[] = new Array();
    arr13[0] = 1;
    let a13 = arr13[0] + 1;

}

function arrayExpr(): void {
    new Array<number>();
    new Array<string>();
    new Array<Sample>();
    new Array<string | Sample>(2);
    new Array();
}

function arrayLiteral(): void {
    let arr1: number[] = [1, 1.1, 2];
    const arr2 = ['a', 'c'];
    const arr3 = [new Sample()];
    const arr4 = [1, 'hello'];
    const arr5 = [];
    const arr6 = [1, 'hello', new Sample()];
}

function testEnumValue(): void {
    sensor.off(sensor.SensorId.GRAVITY);
    sensor.off(5);
}

function returnWithAny(): any[] {
    return ['greet'];
}


function ResponseType(type: ResponseType): void {
    console.log('yes' + myNamespaceA.a);
}


class ClassA {
    private y = 1;
}

function testFieldType(): void {
    declare const anyVarTest: any;
    declare const nestedAnyTest: { prop: any };
    let testPoint = nestedAnyTest[anyVarTest];
    let key = 'a';
    let ain = new ClassA();
    let str = ain[key];
    let anyType = ain['key'];
}

let out = 10;

function test1(): number {
    let a = new ClassA();
    let x = a.y + out;
}

function foo(): void {
    class Test {
        name: string = 'test';
    }

    let t = new Test();
    console.info(t.name);
}

function testArrayFrom(): void {
    let arr1 = Array.from<number>(new Set<number>([1, 2, 3]));
    let arr2 = Array.from('hello');
}

let fileGV = 1;

namespace testGV1 {
    let counter = 0;

    function increment(): void {
        counter += fileGV;
    }
}

export interface TestInterface {
    callf(): string
}

function genericFunction<T extends TestInterface>(a: T): void {
    a.callf();
}

function testArrayInstacnceOf(): void {
    let a = ['1', 2, false];
    if (a instanceof Array) {
        console.info(a);
    }
}

class IConfig {
    id: string;
}

class Config2 extends IConfig {
    id: string;

    ffff(): void {
        console.log('xx');
    }
}

interface CCContext {
    queryConfig<T extends IConfig = Config2>(id: string): T
}

function test2(c: CCContext): void {
    let a = c.queryConfig('aa');
    a.ffff();
}

enum Week {
    MON = 0,
    TUE = '1'
}

class BaseChangeInfer {
    string2String(): void {
        const str = 'string';
        str.length;
        str.toUpperCase();
    }

    number2Number(): void {
        const str = 13;
        str.toPrecision(2);
    }

    boolean2Boolean(): void {
        const str = true;
        str.valueOf();
    }

    bigint2Wrapper(str: bigint): void {
        str.toLocaleString();
        str[Symbol.toStringTag];
    }

    literal2Wrapper(a: '1', b: false, c: 3): void {
        a.length;
        a.charAt(0);
        b.valueOf();
        c.toExponential();
    }

    function2Wrapper(callback: () => void, d: Function): void {
        callback.name;
        callback();
        d.length;
        d().toString();
    }

    enum2Wrapper(v: Week): void {
        Week.MON.valueOf();
        let t: Week = Week.MON;
        t.valueOf();
        Week.TUE.valueOf();
        t = Week.TUE;
    }

}

class NameSpaceLocalTest {
    foo(): void {
        let a = new Intl.NumberFormat('123');
    }
}

class ArrayCatTest {
    foo(): void {
        const arr1 = [1, 2, 3];
        const arr2 = [4, 5];
        const arr3 = [...arr1, ...arr2];
    }

    goo(): void {
        const arr11 = callSomeMethod1();
        const arr22 = callSomeMethod2();
        const arr33 = [...arr11, ...arr22];
    }
}

class ChangePtrTest {
    fieldA = (data: number): void => {
        console.log(data);
    };

    fieldB: Function = (data: number): void => {
        console.log(data);
    };

    fieldC: Function | undefined;

    callField(): void {
        // 正确表示为ArkPtrInvokeExpr，funcPtr指向this.fieldA
        this.fieldA(111);
        // 错误表示为ArkInstanceInvokeExpr，methodSignature为A.fieldB方法，但是calss A没有fieldB方法，所以methodSignature中的param为空，return type为Unknown
        this.fieldB(222);
        // 错误表示为ArkInstanceInvokeExpr，methodSignature为A.fieldC方法，但是calss A没有fieldC方法，所以methodSignature中的param为空，return type为Unknown
        if (this.fieldC) {
            this.fieldC(333);
        }
    }
}

class AA {
    static x = 'x';

    static get Str(): string {
        return 'a';
    }

    static set Str(str: string) {
        AA.x = str;
    }

    private _count: number;
    get count(): number {
        return this._count;
    }

    set count(value: number) {
        this._count = value;
    }

    test(): void {
        let str = AA.Str;
        AA.Str = str;
        let aa = new AA();
        let n = aa.count;
        aa.count = n;
    }
}