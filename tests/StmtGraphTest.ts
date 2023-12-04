import ts from "typescript";
import { StmtGraph } from "../core/graph/StmtGraph";
const fs = require('fs');

StmtGraph
export class StmtGraphTest {
    private loadStmtGraph(): StmtGraph {
        let filename = './tests/resources/cfg/main.ts';
        let codeAsString = fs.readFileSync(filename).toString();
        let sourceFile = ts.createSourceFile(filename, codeAsString, ts.ScriptTarget.Latest);
        return new StmtGraph(sourceFile);
    }

    public testStmtGraph() {
        let stmtGraph = this.loadStmtGraph();
        stmtGraph.printStmtGraph();
    }
}



let callGraphTest = new StmtGraphTest();
callGraphTest.testStmtGraph();