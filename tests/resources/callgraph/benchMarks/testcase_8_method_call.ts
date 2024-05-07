// test case for method call 1
// 20/21
// 5/6
// testcase_8_method_call.ts
// 3(0)/3

import { Main } from "./lib/a";
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

let message = Main.printNumber(n)
console.log(message)
