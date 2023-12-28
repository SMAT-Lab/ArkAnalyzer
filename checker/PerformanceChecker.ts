import * as ts from 'typescript';
import { ArkFile } from '../core/ArkFile';
import { statement } from '../core/base/Cfg';

export class PerformanceChecker {
    public checkDeteleProperty(arkFile: ArkFile) {
        let stmts: statement[] = [];
        for (const arkClass of arkFile.getClasses()) {
            for (const arkMethod of arkClass.getMethods()) {
                stmts.push(...arkMethod.cfg.statementArray);
            }
        }

        let sourceText = arkFile.ast.sourceFile.text;
        for (const stmt of stmts) {
            let astNode = stmt.astNode;
            let lineno = stmt.line;
            const sourceCode = stmt.code;
            if (astNode?.kind == "ExpressionStatement") {
                for (const child of astNode.children) {
                    if (child.kind == "DeleteExpression") {
                        for (const grandson of child.children) {
                            if (grandson.kind == "PropertyAccessExpression" || grandson.kind == "ElementAccessExpression") {
                                console.log("Should not delele property, line: " + getLineNumber(sourceText, astNode.start) + ", source text is \"" + sourceCode + "\"");
                            }
                        }
                    }
                }
            }
        }

        function getLineNumber(fileContent: string, charPosition: number): number {
            let lineNumber = 1;
            for (let i = 0; i < charPosition && i < fileContent.length; i++) {
                if (fileContent[i] === '\n') {
                    lineNumber++;
                }
            }
            return lineNumber;
        }
    }
}