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


function testArrowFunc() {
    let func = (i, j) => i + j;
    func(1, 2);
}
