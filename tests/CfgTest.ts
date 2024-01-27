import { Scene } from "../src/Scene";
import * as utils from "../src/utils/getAllFiles";
import { Config } from "./Config";
const fs = require('fs');

export class CfgTest {
    private buildScene(): Scene {
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

        return new Scene(projectName, projectFiles, 'D:\\Codes\\ark-analyzer-mirror');
    }

    public testThreeAddresStmt() {
        let scene = this.buildScene();

        for (const arkFile of scene.arkFiles) {
            console.log('=============== arkFile:', arkFile.name, ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.name == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    console.log('************ arkMethod:', arkMethod.name, ' **********');
                    console.log('-- origalstmts:');
                    for (const origalstmt of arkMethod.getOriginalCfg().getStmts()) {
                        console.log(origalstmt.toString());
                    }
                    console.log();
                    console.log('-- threeAddresStmts:');
                    for (const threeAddresStmt of arkMethod.getCfg().getStmts()) {
                        console.log(threeAddresStmt.toString());
                        // console.log(threeAddresStmt.toString(), ', original pos:', threeAddresStmt.getOriginPositionInfo(),
                        //     ', pos:', threeAddresStmt.getPositionInfo());
                    }

                    console.log('-- locals:');
                    for (const local of arkMethod.getBody().getLocals()) {
                        console.log(local.toString());
                    }
                }
            }
        }
    }


    public testBlocks() {
        let scene = this.buildScene();

        for (const arkFile of scene.arkFiles) {
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    console.log('************ arkMethod:', arkMethod.name, ' **********');
                    console.log('StartingBlock:', arkMethod.getCfg().getStartingBlock());
                }
            }
        }
    }
}



let cfgTest = new CfgTest();
cfgTest.testThreeAddresStmt();
// cfgTest.testBlocks();

debugger