import { Scene } from "../src/Scene";
import { TypeInference } from "../src/core/common/TypeInference";
import { ArkBody } from "../src/core/model/ArkBody";
import { SceneConfig } from "./Config";

export class TypeInferenceTest {
    public buildScene(): Scene {
        // D:\\Codes\\program_analysis\\static_framework\\ArkAnalyzer\\tests\\resources\\typeInference\\sample
        // D:\\Codes\\program_analysis\\static_framework\\ArkAnalyzer\\tests\\resources\\typeInference\\moduleA
        const config_path = "D:\\Codes\\program_analysis\\static_framework\\ArkAnalyzer\\tests\\resources\\typeInference\\TypeInferenceTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        return new Scene(config);
    }

    public testLocalTypes() {
        let scene = this.buildScene();
        const typeInference = new TypeInference(scene);

        for (const arkFile of scene.arkFiles) {
            console.log('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    console.log('*** arkMethod: ', arkMethod.getName());

                    const body = arkMethod.getBody();

                    if (body) {
                        typeInference.inferTypeInMethod(arkMethod);

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
typeInferenceTest.testLocalTypes();
// typeInferenceTest.testFunctionReturnType();
