import { Scene } from "../src/Scene";
import { ArkBody } from "../src/core/model/ArkBody";
import { SceneConfig } from "./Config";

export class TypeInferenceTest {
    public buildScene(): Scene {
        // tests\\resources\\typeInference\\sample
        // tests\\resources\\typeInference\\moduleA
        // tests\\resources\\typeInference\\mainModule
        // const config_path = "tests\\resources\\typeInference\\ProjectTypeInferenceTestConfig.json";
        const config_path = "tests\\resources\\typeInference\\TypeInferenceTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        return new Scene(config);
    }

    public testLocalTypes() {
        let scene = this.buildScene();        

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

                    console.log('-- locals:');
                    for (const local of arkMethod.getBody().getLocals()) {
                        console.log('name: ' + local.toString() + ', type: ' + local.getType());
                    }
                    console.log();

                }
            }
        }
    }

    public testFunctionReturnType() {
        let scene = this.buildScene();

        for (const arkFile of scene.arkFiles) {
            console.log('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }

                    console.log(arkMethod.getSubSignature().toString());
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
// typeInferenceTest.buildScene();
typeInferenceTest.testLocalTypes();
// typeInferenceTest.testFunctionReturnType();
