import { Stmt } from "./Stmt";
import * as ts from "typescript";

export class StmtGraph {
    statements: Stmt[]=[];


    // construct from ast
    constructor(funcRoot:ts.FunctionDeclaration|ts.FunctionExpression) {
        this.buildGraph(funcRoot);
    }


    public getNodes(): Stmt[] {
        return this.statements;
    }

    public getStartingStmt() {
    }

    // todo: 实现
    public successors(curr: Stmt): Stmt[] {
        return this.statements;
    }

    // todo: 实现
    public predecessors(curr: Stmt): Stmt[] {
        return this.statements;
    }


    // for test
    public printStmtGraph() {
        console.log('-------- statemnts of stmtgraph');
        for(const stmt of this.statements){
            console.log(stmt);
        }
    }


    private buildGraph(funcRoot:ts.FunctionDeclaration|ts.FunctionExpression) {
        let bodyStatements=funcRoot.body?.statements;
        if(!bodyStatements)       {
            return;
        }

        for(const stmt of bodyStatements){
            
        }    
    }
}