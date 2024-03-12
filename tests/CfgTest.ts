import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
const fs = require('fs');

export class CfgTest {
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

        for (const arkFile of scene.arkFiles) {
            logger.info('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    let arkBody = arkMethod.getBody()
                    logger.info('*** arkMethod: ', arkMethod.getName());
                    logger.info('-- origalstmts:');

                    let originalCfg = arkBody.getOriginalCfg();
                    for (const origalstmt of originalCfg.getStmts()) {
                        logger.info(origalstmt.toString());
                        // logger.info(origalstmt.toString()+', pos: '+origalstmt.getPositionInfo());
                    }
                    logger.info();
                    logger.info('-- threeAddresStmts:');
                    let cfg = arkBody.getCfg();
                    for (const threeAddresStmt of cfg.getStmts()) {
                        logger.info(threeAddresStmt.toString());
                        // logger.info(threeAddresStmt.toString(), ', original pos:', threeAddresStmt.getOriginPositionInfo(),
                        //     ', pos:', threeAddresStmt.getPositionInfo());
                        // logger.info('- use');

                        // logger.info(threeAddresStmt.getUses());

                    }

                    logger.info('-- locals:');
                    for (const local of arkMethod.getBody().getLocals()) {
                        logger.info(local.toString());
                    }
                    logger.info();
                }
            }
        }
    }


    public testBlocks() {
        let scene = this.buildScene();

        for (const arkFile of scene.arkFiles) {
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    logger.info('************ arkMethod:', arkMethod.getSignature().toString(), ' **********');
                    logger.info('StartingBlock:', arkMethod.getBody().getCfg().getStartingBlock());
                }
            }
        }
    }
}



let cfgTest = new CfgTest();
// cfgTest.buildScene();
cfgTest.testThreeAddresStmt();
// cfgTest.testBlocks();

// debugger