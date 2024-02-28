import { funcA1,n1 } from "../moduleA/A";
// import { funcAA1 } from "./AA";
import {AA} from "./AA";
import {A} from "../moduleA/A"

function importType(){
    const a=new n1.n3.c3();
    const b=new A();
    const c=funcA1();
    const m=new M();
}

function functionType(){
    const a=t();
    const m=new M();
    const b=m.f1()
    const c=n2.f2();
}

function t():number{
    return 1;
}

class M{
    constructor(){}
    f1():number{
        return 2;
    }
}



namespace n2{
    export function f2():number{
        return 2;
    }
    class c2{
        f2(){
            const c=new n1.c1();
        }
    }
}

// function testImportType(i: number, j: number): number {
//     i = funcA1();
//     j = funcAA1();
//     return i;
// }

// function testBasicType(): void {
//     let str1:string='s1';
//     let str2:string=`${str1} 2`;
// }

// function testArrayType(): void {
//     const a: number[][] = [[1, 2]];
//     const b = [1];
//     const y = b[0]
//     const x = a[y];
// }

// function testUnionType(): void {
//     let a: number | string = 1;
//     let b = a + 1
// }

// function testSysLibClassType(): void {
//     const a = new Array();
// }

// function testObjectLiteralExpression(): void {
//     let obj = { i: 1 }
// }

// function testArrowFunction(): void {
//     let sum = (x: number, y: number): number => {
//         return x + y;
//     }
// }

// function testParameterOfMethod(i: number): void {
//     let j = i;
// }

// function testObjectType() {
//     let obj: object = { i: 1 };
// }

// function testEmptyBody() {
// }


// function add(i: number, j: number): number {
//     return i + j;
// }

// function testFunctionReturnType() {
//     let i = 0, j = 0;
//     let k = add(i, j);
// }

// function print(s: string): void {

// }
// function testFunctionParaType() {
//     print('hello');
// }

// function testFunctionType(): void {
//     let a = [1, 2];
//     a.forEach(function (i) { });
// }

// function testTupleType(): void {
//     let a: [number, string] = [1, '2'];
//     // let b = [1, '2'];
// }

// class Foo {
//     // public static testNewObj(): void {
//     //     // let d = new Data();

//     //     let foo = new Foo();
//     // }

//     // public testInstanceInvoke(): void {
//     //     let f = new Foo();
//     //     f.testInstanceInvoke();
//     // }

//     private i: number = 0;
//     public testInstanceRef(): void {
//         let f = new Foo();
//         let j = f.i;
//     }
// }

// class Foo { }