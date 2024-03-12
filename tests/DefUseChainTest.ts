import { Scene } from "../src/Scene";
import { ArkBody } from "../src/core/model/ArkBody";
import { SceneConfig } from "./Config";

export class TypeInferenceTest {
    public buildScene(): Scene {
        const config_path = "tests\\resources\\typeInference\\ProjectTypeInferenceTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        return new Scene(config);
    }

    public testLocalTypes() {
        let scene = this.buildScene();        

        for (const arkFile of scene.arkFiles) {
            logger.info('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    // if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                    //     continue;
                    // }
                    logger.info('*** arkMethod: ', arkMethod.getName());

                    const body = arkMethod.getBody();
                    this.printStmts(body);

                    for(const chain of body.getCfg().getDefUseChains()){
                        logger.info("value:"+chain.value.toString())
                        logger.info("def:"+chain.def.toString())
                        logger.info("use:"+chain.use.toString())
                    }
                    logger.info();

                }
            }
        }
    }



    private printStmts(body: ArkBody): void {
        logger.info('-- threeAddresStmts:');
        let cfg = body.getCfg();
        for (const threeAddresStmt of cfg.getStmts()) {
            logger.info(threeAddresStmt.toString());
        }
    }
}

let typeInferenceTest = new TypeInferenceTest();
// typeInferenceTest.buildScene();
typeInferenceTest.testLocalTypes();
// typeInferenceTest.testFunctionReturnType();
