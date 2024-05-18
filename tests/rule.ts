import * as ts from 'typescript';
let text = `
for (let x of a) {
    x++
}
`
const sourceFile = ts.createSourceFile(
    "example.ts",
    text,
    ts.ScriptTarget.Latest
);
const forstm = sourceFile.statements[0];
if (ts.isForOfStatement(forstm)) {
    console.log(forstm.initializer?.getText(sourceFile)+" of "+forstm.expression.getText(sourceFile))
}