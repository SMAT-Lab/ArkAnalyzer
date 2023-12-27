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

        for (const stmt of stmts) {
            let astNode = stmt.astNode;
            let lineno = stmt.line;
            const sourceCode = stmt.code;
            if (astNode?.kind == "ExpressionStatement") {
                for (const child of astNode.children) {
                    if (child.kind == "DeleteExpression") {
                        for (const grandson of child.children) {
                            if (grandson.kind == "PropertyAccessExpression" || grandson.kind == "ElementAccessExpression") {
                                console.log("Should not delele property, line:", lineno, ", source text is \"" + sourceCode + "\"");
                            }
                        }
                    }
                }
            }
        }
    }
}