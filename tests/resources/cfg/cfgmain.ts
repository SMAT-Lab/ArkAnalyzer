// function testSwitch() {
//     let expr = 'Papayas';
//     switch (expr) {
//       case 'Oranges':
//         console.log('Oranges are $0.59 a pound.');
//         break;
//       case 'Mangoes':
//       case 'Papayas':
//         console.log('Mangoes and papayas are $2.79 a pound.');
//         // Expected output: "Mangoes and papayas are $2.79 a pound."
//         break;
//       default:
//         console.log(`Sorry, we are out of ${expr}.`);
//     }    
// }

// function testTryCatch() {
//     try {
//         let i = 0;
//         throw new Error('err');
//     } catch (e) {
//         console.log(e);
//     } finally {
//         // console.log('finnaly');
//     }
//     let j = 0;
// }

// function testArrowFunc() {
//     let func = (i) => i + 1;
// }

// function testTemplatestrings() {
//     let a = 'str1';
//     let b = `template is ${a}`;
// }

function testCompoundAssignment() {
    let a = 1;
    a += 1;
}