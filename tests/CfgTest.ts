import { Scene } from "../src/Scene";
import { SceneConfig } from "./Config";
const fs = require('fs');

export class CfgTest {
    private buildScene(): Scene {
        let config: SceneConfig = new SceneConfig("D:\\Codes\\ark-analyzer-mirror\\tests\\resources\\cfg\\CfgTestConfig.json");
        return new Scene(config);
    }

    public testThreeAddresStmt() {
        let scene = this.buildScene();

        for (const arkFile of scene.arkFiles) {
            console.log('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    let arkBody = arkMethod.getBody()
                    console.log('************ arkMethod:', arkMethod.getSignature().toString(), ' **********');
                    console.log('-- origalstmts:');

                    let originalCfg = arkBody.getOriginalCfg();
                    for (const origalstmt of originalCfg.getStmts()) {
                        console.log(origalstmt.toString());
                    }
                    console.log();
                    console.log('-- threeAddresStmts:');
                    let cfg = arkBody.getCfg();
                    for (const threeAddresStmt of cfg.getStmts()) {
                        console.log(threeAddresStmt.toString());
                        // console.log(threeAddresStmt.toString(), ', original pos:', threeAddresStmt.getOriginPositionInfo(),
                        //     ', pos:', threeAddresStmt.getPositionInfo());
                    }

                    console.log('-- locals:');
                    for (const local of arkMethod.getBody().getLocals()) {
                        console.log(local.toString());
                    }
                    console.log();                    
                }
            }
        }
    }


    public testBlocks() {
        let scene = this.buildScene();

        for (const arkFile of scene.arkFiles) {
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    console.log('************ arkMethod:', arkMethod.getSignature().toString(), ' **********');
                    console.log('StartingBlock:', arkMethod.getBody().getCfg().getStartingBlock());
                }
            }
        }
    }
}



let cfgTest = new CfgTest();
cfgTest.testThreeAddresStmt();
// cfgTest.testBlocks();

// debugger