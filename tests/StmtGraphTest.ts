import ts from "typescript";
import { StmtGraph } from "../core/graph/StmtGraph";
const fs = require('fs');

StmtGraph
export class StmtGraphTest {
    private loadStmtGraph(): StmtGraph {
        let filename = './tests/resources/cfg/main.ts';
        let codeAsString = fs.readFileSync(filename).toString();
        let sourceFile = ts.createSourceFile(filename, codeAsString, ts.ScriptTarget.Latest);
        let functionDeclaration = sourceFile.statements[0] as ts.FunctionDeclaration;       
        
        return new StmtGraph(functionDeclaration);
    }

    public testStmtGraph() {
        let stmtGraph = this.loadStmtGraph();
        stmtGraph.printStmtGraph();

        let stmts=stmtGraph.getNodes();
        console.log('\n---------- statement is callstatemnt or not ------------')
        for(const stmt of stmts){            
        }
    }
}



let callGraphTest = new StmtGraphTest();
callGraphTest.testStmtGraph();

debugger