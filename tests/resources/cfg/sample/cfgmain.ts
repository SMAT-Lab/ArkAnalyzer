

// function testSwitch() {
//     let expr = 'a';
//     switch (expr) {
//         case 'a':
//             console.log('a');
//             break;
//         case 'b':
//             console.log('b');
//         default:
//             console.log(`default`);
//     }
// }




// function testTryCatch() {
//     try {
//         let i = 0;
//         throw new Error('err');
//     } catch (e) {
//         console.log(e);
//     } finally {
//         console.log('finnaly');
//     }
//     let j = 0;
// }

// function testFor() {
//     for (const i of j) {

//     }
// }

// function testArrowFunc() {
//     let func = (i) => i + 1;
// }

// function testTemplatestrings() {
//     let a = 'str1';
//     let b = `template is ${a}`;
// }


// function testArrowFunc() {
//     let func = (i, j) => i + j;
//     func(1, 2);
// }


// function testDoWhile() {
//     let i = 0;
//     do {
//         i++;
//     } while (i < 10);
// }


// function outerFunc(): number {
//     return 0;
// }

class Test {
    // public func1(): number {
    //     return 0;
    // }

    // public func2(): Test {
    //     return new Test();
    // }

    // public static funcStatic(): number {
    //     return 0;
    // }

    // public testJointStr() {
    //     let i = 'str1', j = 'str2';
    //     let c = i + j;
    // }


    // public testTemplatestrings() {
    //     let str1: string = 'hello';
    //     let num1: number = 1;
    //     let str2: string = `boy, ${str1}, world. ${num1}`;
    // }

    // public testBasicType() {
    //     let flag: boolean = false;
    //     let a:boolean = flag;
    // }

    // public testArrayType() {
    //     let a: number[] = [1, 2, 3];
    // }

    // public testNestIf() {
    //     let i = 0;
    //     if (i) {
    //         // i = 3;
    //         switch (i) {
    //             case 1:
    //                 console.log('1');
    //                 break;
    //             case 2:
    //                 console.log('2');
    //         }
    //     }
    // }


    // public testUseMethodOfClass(): void {
    //     let t = new Test();
    //     let i = t.func1();
    //     // console.log(t.func1());
    // }

    // public testUseMethodOfClass(): void {
    //     let i = Test.funcStatic();
    //     // console.log(t.func1());
    // }

    // public testContinuousCall(): void {
    //     let i = this.func2().func1();
    // }

    // public testUseMethodOutOfClass(): void {
    //     let i = outerFunc();
    // }

    // public testUseMethodOutOfFile(): void {
    //     let i = funcA1();
    //     console.log(i);
    // }

    // public testUseMethodWithParaOutOfFile(): void {
    //     let i = funcAA2(1);
    //     console.log(i);
    // }


    handleUpsert() {
        (this.agcDataBase as Database).collection(Post).upsert(post);
    }
}

