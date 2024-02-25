import { Scene } from "../src/Scene";
import { TypeInference } from "../src/core/common/TypeInference";
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
        const typeInference = new TypeInference();

        for (const arkFile of scene.arkFiles) {
            console.log('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    const body = arkMethod.getBody();
                    typeInference.inferTypeInBody(body);

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
}

let typeInferenceTest = new TypeInferenceTest();
typeInferenceTest.testLocalTypes();
// typeInferenceTest.testFunctionReturnType();
