// test case for method call 1
// 25/25
// 8/8
// testcase_9_method_call.ts
// 6(0)/6

import { MacDonlad, fxxkkkkk } from "./lib/c";
console.log("Default_Method")
class Foo {
    public i: number = 0;
    public static j: number = 0;

    public static newFoo(): Foo {
        console.log("Foo.newFoo(){")
        console.log("}")
        return new Foo();
    }

    public getNumber(): number {
        console.log("Foo.getNumber(){")
        let i: number = 0;
        let j: number = 1;
        console.log("}")
        return i + j;
    }
}

class Bar {
    public useFoo(): void {
        console.log("Bar.useFoo(){")
        let foo = Foo.newFoo();
        let n = foo.getNumber();

        let ii = foo.i;
        let jj = Foo.j;
        console.log("}")
    }
}

let foo = Foo.newFoo();
let n = foo.getNumber();
let bar = new Bar()
let vid = bar.useFoo()
let mac = new MacDonlad()
let k = new fxxkkkkk.kfc()
