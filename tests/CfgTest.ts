import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
const fs = require('fs');

export class CfgTest {
    private scene: Scene | null = null;

    public buildScene(): Scene {
        // tests\\resources\\cfg\\sample
        // tests\\resources\\cfg\\temp
        // D:\\Codes\\resources\\SE4OpenHarmony-main
        const config_path = "tests\\resources\\cfg\\CfgTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        return new Scene(config);
    }

    public testThreeAddresStmt() {
        let scene = this.buildScene();
        scene.inferTypes();

        for (const arkFile of scene.arkFiles) {
            console.log('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    let arkBody = arkMethod.getBody()
                    console.log('*** arkMethod: ', arkMethod.getName());
                    console.log('-- origalstmts:');

                    let originalCfg = arkBody.getOriginalCfg();
                    for (const origalstmt of originalCfg.getStmts()) {
                        // console.log(origalstmt.toString());
                        console.log(`'${origalstmt.toString()}' line: ${origalstmt.getPositionInfo()}, column: ${origalstmt.getColumn()}`);
                    }

                    console.log('\n-- threeAddresStmts:');
                    let cfg = arkBody.getCfg();
                    for (const threeAddresStmt of cfg.getStmts()) {
                        console.log(threeAddresStmt.toString());
                        // console.log(threeAddresStmt.toString(), ', original pos:', threeAddresStmt.getOriginPositionInfo(),
                        //     ', pos:', threeAddresStmt.getPositionInfo());
                        // console.log('- use');

                        // console.log(threeAddresStmt.getUses());

                    }

                    console.log('\n-- locals:');
                    for (const local of arkMethod.getBody().getLocals()) {
                        console.log(`local: ${local}, type: ${local.getType()}`);
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
// cfgTest.buildScene();
cfgTest.testThreeAddresStmt();
// cfgTest.testBlocks();

debugger