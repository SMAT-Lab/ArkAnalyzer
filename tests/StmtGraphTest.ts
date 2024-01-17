import ts from "typescript";
import { StmtGraph } from "../src/core/base/StmtGraph";
import { Config } from "./Config";
const fs = require('fs');
import * as utils from "../src/utils/getAllFiles";
import { Scene } from "../src/Scene";

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
        // let config = new Config("ThreeAddresStmtTest", "D:\\codes\\tests\\applications_systemui");

        let config = new Config("ThreeAddresStmtTest", "D:\\codes\\openharmony\\applications\\applications_photos");


        const projectName: string = config.projectName;
        const input_dir: string = config.input_dir;

        let projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);

        // let projectFiles = ['D:\\codes\\openharmony\\applications\\applications_photos\\common\\src\\main\\ets\\default\\model\\browser\\AbsDataSource.ts']        
        projectFiles = ['D:\\codes\\openharmony\\applications\\applications_photos\\common\\src\\main\\ets\\default\\access\\UserFileManagerAccess.ts']        
        // let projectFiles = ['tests\\resources\\cfg\\main.ts'];

        let scene = new Scene(projectName, projectFiles);

        for (const arkFile of scene.arkFiles) {
            console.log('=============== arkFile:', arkFile.name, ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {                    
                    // console.log('********* arkMethod:', arkMethod.name, ' ***********');
                    arkMethod.cfg.printThreeAddressStmts();
                }
            }
        }
    }
}



let stmtGraphTest = new StmtGraphTest();
stmtGraphTest.testThreeAddresStmt();

debugger