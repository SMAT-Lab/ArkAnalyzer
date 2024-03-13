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
//     const arr1:number[] = new Array<number>(2);
//     const arr2 = [1, 2];    
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

// function testFunctionTypeBasic(): void {
//     let a = [1, 2];
//     a.forEach(function (i) { });
// }

// function testTupleType(): void {
//     let a: [number, string] = [1, '2'];
//     // let b = [1, '2'];
// }

// function testFunctionTypeComplex(): void {
//     let cat = new Cat();
//     cat.sound();
// }

// function useAnimal(animal: Animal): void {
//     animal.sound();
// }

// function testTupleType(): void {
//     let a: [number, string] = [1, '2'];
//     // let b = [1, '2'];
// }

function testNewArray(): void {
    // let a = new Array(1, 2, 3);
    // let b = new Array(1);
    // let c = new Array('1');

    // let d:number[] = new Array(1);
    // let e: number[] = new Array<number>(1);
    // let f: number[] = new Array<number>(1, 2);

    // let g = new Array<number>(1, 2);

    let sz = 100;
    let a = new Array<number>(sz);
    let b = a[0];
}

// function testRegularExpressionLiteral() {
//     let str = '1';
//     let f = /^[a-z]*$/.test(str)
// }

// abstract class Animal {
//     public sound() { };
// }

// class Cat implements Animal {
//     public sound(): void {
//     }
// }



// class Foo {
//     // public static testNewObj(): void {
//     //     // let d = new Data();

//     //     let bar: Bar = new Bar();
//     // }

//     // public testInstanceInvoke(): void {
//     //     let f = new Foo();
//     //     f.testInstanceInvoke();
//     // }

//     private i = new Map<number, number>();
//     public testInstanceRef(): void {
//         let f = new Foo();
//         let j = f.i;
//     }
// }