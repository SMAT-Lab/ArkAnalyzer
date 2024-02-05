

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

import { funcAA2 } from "./AA";



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

// let j = 1

class Test {
    // public func1(): number {
    //     return 0;
    // }

    // public testUseMethodOfClass(): void {
    //     let t = new Test();
    //     let i = t.func1();
    // }

    // public testUseMethodOutOfClass(): void {
    //     let i = outerFunc();
    // }

    // public testUseMethodOutOfFile(): void {
    //     let i = funcA1();
    //     console.log(i);
    // }

    public testUseMethodWithParaOutOfFile(): void {
        let i = funcAA2(1);
        console.log(i);
    }
}

// function outerFunc(): number {
//     return 0;
// }
