// const stack: string = error instanceof Error ? (error.stack as string) : error;
// if (Object.prototype.hasOwnProperty.call(this.cache, stack)) {
//   return this.cache[stack];
// }

// // eslint-disable-next-line no-useless-escape
// const re = /^\s+at\s+(.+?\s+)?\(?([0-z._\-\\\/]+):(\d+):(\d+)\)?$/gm;
// let match: RegExpExecArray | null;
// let outStack = error.toString();

// while ((match = re.exec(stack))) {
//   if (match[2] === "main") {
//     const pos = this.consumer.originalPositionFor({
//       column: parseInt(match[4], 10),
//       line: parseInt(match[3], 10)
//     });

//     if (pos.line != null) {
//       if (pos.name) {
//         outStack += `\n    at ${pos.name} (${pos.source}:${pos.line}:${pos.column})`;
//       } else {
//         if (match[1]) {
//           // no original source file name known - use file name from given trace
//           outStack += `\n    at ${match[1]} (${pos.source}:${pos.line}:${pos.column})`;
//         } else {
//           // no original source file name known or in given trace - omit name
//           outStack += `\n    at ${pos.source}:${pos.line}:${pos.column}`;
//         }
//       }
//     } else {
//       // no known position
//       break;
//     }
//   } else {
//     // no more parseable lines
//     break;
//   }
// }
// abstract.b=c;
// abs.b.c=XMLDocument.yy
// this.cache[stack] = outStack
// return outStack;



let a = [1,2,3];

