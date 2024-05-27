// export class BaiduAIDictSimpleMeans {
//     from: string;
//     word_symbol: string;
//     word_name: string;
//     means: MeansInSimple[];
//     static fromJSON(json: Object): BaiduAIDictSimpleMeans {
//         let tmp = new BaiduAIDictSimpleMeans();
//         if (json) {
//             tmp.from = json['from'];
//             tmp.word_name = json['word_name'];
//             let symbolsJSON: JSON[] = json['symbols'];
//             if (symbolsJSON && symbolsJSON.length > 0) {
//                 tmp.word_symbol = symbolsJSON[0]['word_symbol'];
//                 //由于输入不会有回车，这里 parts 只会返回一个，parts.means也只会有一个
//                 let partsJSON: JSON[] = symbolsJSON[0]['parts'];
//                 if (partsJSON && partsJSON.length > 0) {
//                     let meansJSON: JSON[] = partsJSON[0]['means'];
//                     if (meansJSON && meansJSON.length > 0) {
//                         tmp.means = [];
//                         meansJSON.forEach((json) => {
//                             let mean: MeansInSimple = new MeansInSimple();
//                             mean.part = json['part'];
//                             mean.text = json['text'];
//                             if (mean.text && mean.text.length > 0) {
//                             }
//                             else {
//                                 mean.text = json['word_mean'];
//                             }
//                             let meansInMeansJSON: JSON[] = json['means'];
//                             if (meansInMeansJSON && meansInMeansJSON.length > 0) {
//                                 mean.means = [];
//                                 meansInMeansJSON.forEach((value) => {
//                                     mean.means.push(JSON.stringify(value));
//                                 });
//                             }
//                             tmp.means.push(mean);
//                         });
//                     }
//                 }
//             }
//         }
//         return tmp;
//     }
// }

import {b} from "vitest/dist/suite-ynYMzeLu";

function foreachTest() {
    let a = [1, 2, 3];
    a.forEach(x => {
        let b = [4, 5];
        b.forEach(x => {
            let c = 1;
        })
    })
}
