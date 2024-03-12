import { Scene } from "../src/Scene";
import { StaticSingleAssignmentFormer } from "../src/transformer/StaticSingleAssignmentFormer";
import * as utils from "../src/utils/getAllFiles";
import { Config } from "./Config";
const fs = require('fs');

export class SsaTest {
    public testStaticSingleAssignmentFormer() {
        let config = new Config("ThreeAddresStmtTest", "D:\\codes\\openharmony\\applications\\applications_photos");


        const projectName: string = config.projectName;
        const input_dir: string = config.input_dir;

        let projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);


        projectFiles = ['tests\\resources\\ssa\\main.ts'];

        let scene = new Scene(projectName, projectFiles, 'D:\\Codes\\ark-analyzer-mirror');
        let staticSingleAssignmentFormer = new StaticSingleAssignmentFormer();
        for (const arkFile of scene.arkFiles) {
            logger.info('=============== arkFile:', arkFile.name, ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.name == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    logger.info('************ arkMethod:', arkMethod.name, ' **********');
                    logger.info('-- before ssa:');
                    for (const threeAddresStmt of arkMethod.getCfg().getStmts()) {
                        logger.info(threeAddresStmt.toString());
                    }

                    let body = arkMethod.getBody();
                    staticSingleAssignmentFormer.transformBody(body);

                    logger.info('-- after ssa:');
                    for (const threeAddresStmt of arkMethod.getCfg().getStmts()) {
                        logger.info(threeAddresStmt.toString());
                    }

                    logger.info('-- locals');
                    for (const local of arkMethod.getBody().getLocals()) {
                        logger.info('ssa form:' + local.toString() + ', original form: ' + local.getOriginalValue()?.toString());
                    }
                }
            }
        }
    }
}



let ssaTest = new SsaTest();
ssaTest.testStaticSingleAssignmentFormer();

debugger