import { Scene } from "../src/Scene";
import { StaticSingleAssignmentFormer } from "../src/transformer/StaticSingleAssignmentFormer";
import * as utils from "../src/utils/getAllFiles";
import { Config } from "./Config";
const fs = require('fs');

export class SsaTest {
    public testStaticSingleAssignmentFormer() {
        // let config = new Config("ThreeAddresStmtTest", "D:\\codes\\tests\\applications_systemui\\common\\src\\main\\ets\\default");
        // let config = new Config("ThreeAddresStmtTest", "D:\\codes\\tests\\applications_systemui\\common\\src\\main\\ets\\default\\abilitymanager");
        // let config = new Config("ThreeAddresStmtTest", "D:\\codes\\tests\\applications_systemui");

        let config = new Config("ThreeAddresStmtTest", "D:\\codes\\openharmony\\applications\\applications_photos");


        const projectName: string = config.projectName;
        const input_dir: string = config.input_dir;

        let projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);

        // let projectFiles = ['D:\\codes\\openharmony\\applications\\applications_photos\\common\\src\\main\\ets\\default\\model\\browser\\AbsDataSource.ts']        
        // projectFiles = ['D:\\codes\\openharmony\\applications\\applications_photos\\common\\src\\main\\ets\\default\\access\\UserFileManagerAccess.ts']
        projectFiles = ['tests\\resources\\ssa\\main.ts'];

        let scene = new Scene(projectName, projectFiles, 'D:\\Codes\\ark-analyzer-mirror');
        let staticSingleAssignmentFormer = new StaticSingleAssignmentFormer();
        for (const arkFile of scene.arkFiles) {
            console.log('=============== arkFile:', arkFile.name, ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.name == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    console.log('************ arkMethod:', arkMethod.name, ' **********');
                    console.log('-- before ssa:');
                    for (const threeAddresStmt of arkMethod.getCfg().getStmts()) {
                        console.log(threeAddresStmt.toString());
                    }

                    let body = arkMethod.getBody();
                    staticSingleAssignmentFormer.transformBody(body);

                    console.log('-- after ssa:');
                    for (const threeAddresStmt of arkMethod.getCfg().getStmts()) {
                        console.log(threeAddresStmt.toString());
                    }

                    console.log('-- locals');
                    for (const local of arkMethod.getBody().getLocals()) {
                        console.log('ssa form:' + local.toString() + ', original form: ' + local.getOriginalValue()?.toString());
                    }
                }
            }
        }
    }
}



let ssaTest = new SsaTest();
ssaTest.testStaticSingleAssignmentFormer();

debugger