import ts from "typescript";
import { StmtGraph } from "../core/graph/StmtGraph";
import { Config } from "../Config";
const fs = require('fs');
import * as utils from "../utils/utils";
import { Scene } from "../Scene";

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

        let stmts = stmtGraph.getNodes();
        console.log('\n---------- statement is callstatemnt or not ------------')
        for (const stmt of stmts) {
        }
    }


    public testThreeAddresStmt() {
        // let config = new Config("ThreeAddresStmtTest", "D:\\codes\\tests\\applications_systemui\\common\\src\\main\\ets\\default");
        // let config = new Config("ThreeAddresStmtTest", "D:\\codes\\tests\\applications_systemui\\common\\src\\main\\ets\\default\\abilitymanager");
        let config = new Config("ThreeAddresStmtTest", "D:\\codes\\tests\\applications_systemui");
    
        const projectName: string = config.projectName;
        const input_dir: string = config.input_dir;

        const projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);

        // let projectFiles = ['D:\\codes\\tests\\applications_systemui\\common\\src\\main\\ets\\default\\CommonStyleManager.ts']


        let scene = new Scene(projectName, projectFiles);

        // for (const arkFile of scene.arkFiles) {
        //     console.log('=============== arkFile:', arkFile.name, ' ================');
        //     for (const arkClass of arkFile.getClasses()) {
        //         for (const arkMethod of arkClass.getMethods()) {
        //             console.log();
        //             console.log('********* arkMethod:', arkMethod.name, ' ***********');
        //             arkMethod.cfg.printThreeAddressStmts();
        //         }
        //     }
        // }
    }
}



let stmtGraphTest = new StmtGraphTest();
stmtGraphTest.testThreeAddresStmt();

debugger