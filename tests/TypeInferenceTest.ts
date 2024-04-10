import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { ArkBody } from "../src/core/model/ArkBody";
import Logger, { LOG_LEVEL } from "../src/utils/logger";

const logger = Logger.getLogger();
Logger.configure('out/TypeInferenceTest.log', LOG_LEVEL.WARN);

export class TypeInferenceTest {
    public buildScene(): Scene {
        // tests\\resources\\typeInference\\sample
        // tests\\resources\\typeInference\\moduleA
        // tests\\resources\\typeInference\\mainModule
        // const config_path = "tests\\resources\\typeInference\\ProjectTypeInferenceTestConfig.json";
        const config_path = "tests\\resources\\typeInference\\TypeInferenceTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        // Logger.setLogLevel(LOG_LEVEL.INFO);
        return new Scene(config);
    }

    public testLocalTypes() {
        let scene = this.buildScene();
        scene.inferTypes();
        logger.error(`after inferTypes`);
        this.printScene(scene);
    }

    public testFunctionReturnType() {
        let scene = this.buildScene();

        for (const arkFile of scene.arkFiles) {
            logger.error('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }

                    logger.error(arkMethod.getSubSignature().toString());
                }
            }
        }
    }

    private printStmts(body: ArkBody): void {
        logger.error('-- threeAddresStmts:');
        let cfg = body.getCfg();
        for (const threeAddresStmt of cfg.getStmts()) {
            logger.error(threeAddresStmt.toString());
        }
    }

    private printScene(scene: Scene): void {
        for (const arkFile of scene.arkFiles) {
            logger.error('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                logger.error('========= arkClass:', arkClass.getName(), ' =======');
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    logger.error('***** arkMethod: ', arkMethod.getName());

                    const body = arkMethod.getBody();
                    this.printStmts(body);

                    logger.error('-- locals:');
                    for (const local of arkMethod.getBody().getLocals()) {
                        logger.error('name: ' + local.toString() + ', type: ' + local.getType());
                    }
                    logger.error('***** end of arkMethod')
                }
            }
        }
    }

    public testTypeInference(): void {
        let scene = this.buildScene();
        scene.inferTypes();
    }
}

logger.error('type inference test start');
let typeInferenceTest = new TypeInferenceTest();
// typeInferenceTest.buildScene();
typeInferenceTest.testLocalTypes();
// typeInferenceTest.testTypeInference();
// typeInferenceTest.testFunctionReturnType();
logger.error('type inference test end');
