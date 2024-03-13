import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { ArkBody } from "../src/core/model/ArkBody";


export class TypeInferenceTest {
    public buildScene(): Scene {
        const config_path = "tests\\resources\\ifds\\ifdsTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        return new Scene(config);
    }

    public testLocalTypes() {
        let scene = this.buildScene();
        scene.inferTypes();

        for (const arkFile of scene.arkFiles) {
            console.log('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    console.log('*** arkMethod: ', arkMethod.getName());

                    const body = arkMethod.getBody();
                    this.printStmts(body);

                    
                }
            }
        }
    }



    private printStmts(body: ArkBody): void {
        console.log('-- threeAddresStmts:');
        let cfg = body.getCfg();
        for (const threeAddresStmt of cfg.getStmts()) {
            console.log(threeAddresStmt.toString());
        }
    }
}

let typeInferenceTest = new TypeInferenceTest();
// // typeInferenceTest.buildScene();
typeInferenceTest.testLocalTypes();
// typeInferenceTest.testFunctionReturnType();
