// test case for method call 1
// 11/11
// 4/4
// testcase_9_method_call.ts

import { MacDonlad, fxxkkkkk } from "./lib/c";

class Foo {
    public i: number = 0;
    public static j: number = 0;

    public static newFoo(): Foo {
        return new Foo();
    }

    public getNumber(): number {
        let i: number = 0;
        let j: number = 1;
        return i + j;
    }
}

class Bar {
    public useFoo(): void {
        let foo = Foo.newFoo();
        let n = foo.getNumber();

        let ii = foo.i;
        let jj = Foo.j;
    }
}

let foo = Foo.newFoo();
let n = foo.getNumber();
let bar = new Bar()
let vid = bar.useFoo()
let mac = new MacDonlad()
let k = new fxxkkkkk.kfc()
