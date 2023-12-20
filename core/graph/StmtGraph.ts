import { 
    ArkStmt,
    ASTNode2ArkStatements
} from '../base/Stmt'
import * as ts from "typescript";

export class StmtGraph {
    statements: ArkStmt[]=[];


    // construct from ast
    constructor(funcRoot:ts.FunctionDeclaration|ts.FunctionExpression) {
        this.buildGraph(funcRoot);
    }


    public getNodes(): ArkStmt[] {
        return this.statements;
    }

    public getStartingStmt() {
    }

    // todo: 实现
    public successors(curr: ArkStmt): ArkStmt[] {
        return this.statements;
    }

    // todo: 实现
    public predecessors(curr: ArkStmt): ArkStmt[] {
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
            this.statements.push(...ASTNode2ArkStatements(stmt));
        }    
    }
}