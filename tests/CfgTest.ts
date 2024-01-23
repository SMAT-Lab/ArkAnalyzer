import { Scene } from "../src/Scene";
import * as utils from "../src/utils/getAllFiles";
import { Config } from "./Config";
const fs = require('fs');

export class CfgTest {
    public testThreeAddresStmt() {
        // let config = new Config("ThreeAddresStmtTest", "D:\\codes\\tests\\applications_systemui\\common\\src\\main\\ets\\default");
        // let config = new Config("ThreeAddresStmtTest", "D:\\codes\\tests\\applications_systemui\\common\\src\\main\\ets\\default\\abilitymanager");
        // let config = new Config("ThreeAddresStmtTest", "D:\\codes\\tests\\applications_systemui");

        let config = new Config("ThreeAddresStmtTest", "D:\\codes\\openharmony\\applications\\applications_photos");


        const projectName: string = config.projectName;
        const input_dir: string = config.input_dir;

        let projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);

        // let projectFiles = ['D:\\codes\\openharmony\\applications\\applications_photos\\common\\src\\main\\ets\\default\\model\\browser\\AbsDataSource.ts']        
        // projectFiles = ['D:\\codes\\openharmony\\applications\\applications_photos\\common\\src\\main\\ets\\default\\access\\UserFileManagerAccess.ts']
        projectFiles = ['tests\\resources\\cfg\\cfgmain.ts'];

        let scene = new Scene(projectName, projectFiles, 'D:\\Codes\\ark-analyzer-mirror');

        for (const arkFile of scene.arkFiles) {
            console.log('=============== arkFile:', arkFile.name, ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    console.log('************ arkMethod:', arkMethod.name, ' **********');
                    console.log('-- origalstmts:');                    
                    for (const origalstmt of arkMethod.getOriginalCfg().getStmts()) {
                        console.log(origalstmt.toString());
                    }
                    console.log();                
                    console.log('-- threeAddresStmts:');
                    for (const threeAddresStmt of arkMethod.getCfg().getStmts()) {
                        console.log(threeAddresStmt.toString());
                    }
                }
            }
        }
    }
}



let cfgTest = new CfgTest();
cfgTest.testThreeAddresStmt();

debugger