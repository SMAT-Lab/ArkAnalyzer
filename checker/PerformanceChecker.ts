import * as ts from 'typescript';

export class PerformanceChecker {
    public checkDeteleProperty(sourceFile: ts.SourceFile): void {
        let statements = sourceFile.statements;
        for (const stmt of statements) {
            checkDeleteStatement(stmt);
        }
        return

        function checkDeleteStatement(stmt: ts.Statement): void {
            if (ts.isExpressionStatement(stmt) && ts.isDeleteExpression(stmt.expression)) {
                let deleteExpression = stmt.expression as ts.DeleteExpression;
                if (ts.isPropertyAccessExpression(deleteExpression.expression) || ts.isElementAccessExpression(deleteExpression.expression)) {
                    console.log("Should not delele property, source text is \"", deleteExpression.getText(sourceFile), "\"");
                }
            }

            else if (ts.isFunctionDeclaration(stmt)) {
                if (stmt.body) {
                    let statements = stmt.body.statements;
                    for (const stmt of statements) {
                        checkDeleteStatement(stmt);
                    }
                }
            }
        }
    }
}