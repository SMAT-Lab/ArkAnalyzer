import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { ArkBody } from "../src/core/model/ArkBody";
import Logger, { LOG_LEVEL } from "../src/utils/logger";

const logger = Logger.getLogger();

export class TypeInferenceTest {
    public buildScene(): Scene {
        // tests\\resources\\typeInference\\sample
        // tests\\resources\\typeInference\\moduleA
        // tests\\resources\\typeInference\\mainModule
        // const config_path = "tests\\resources\\typeInference\\ProjectTypeInferenceTestConfig.json";
        const config_path = "tests\\resources\\typeInference\\TypeInferenceTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        Logger.setLogLevel(LOG_LEVEL.INFO);
        return new Scene(config);
    }

    public testLocalTypes() {
        let scene = this.buildScene();
        scene.inferTypes();

        for (const arkFile of scene.arkFiles) {
            logger.info('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    logger.info('*** arkMethod: ', arkMethod.getName());

                    const body = arkMethod.getBody();
                    this.printStmts(body);

                    logger.info('-- locals:');
                    for (const local of arkMethod.getBody().getLocals()) {
                        logger.info('name: ' + local.toString() + ', type: ' + local.getType());
                    }                    
                }
            }
        }
    }

    public testFunctionReturnType() {
        let scene = this.buildScene();

        for (const arkFile of scene.arkFiles) {
            logger.info('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }

                    logger.info(arkMethod.getSubSignature().toString());
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
// // typeInferenceTest.buildScene();
typeInferenceTest.testLocalTypes();
// typeInferenceTest.testFunctionReturnType();
