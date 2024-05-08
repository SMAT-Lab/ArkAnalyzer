import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { ArkBody } from "../src/core/model/ArkBody";
import { StaticSingleAssignmentFormer } from "../src/transformer/StaticSingleAssignmentFormer";
import { PrinterBuilder } from "../src/save/PrinterBuilder"

export class TypeInferenceTest {
    public buildScene(): Scene {
        const config_path = "tests\\resources\\cfg\\CfgTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        return new Scene(config);
    }

    public testLocalTypes() {
        let scene = this.buildScene();
        scene.inferTypes();
        let staticSingleAssignmentFormer = new StaticSingleAssignmentFormer();
        let num = 0;
        for (const arkFile of scene.getFiles()) {
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getModifiers().has("PublicKeyword")) {
                        num++
                    }
                }
            }
        }
        console.log(num)
    }

    public testFunctionReturnType() {
        let scene = this.buildScene();

        for (const arkFile of scene.getFiles()) {
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

    public printStmts(body: ArkBody): void {
        console.log('-- threeAddresStmts:');
        let cfg = body.getCfg();
        for (const threeAddresStmt of cfg.getStmts()) {
            console.log(threeAddresStmt.toString());
        }
    }

    public testTypeInference(): void {
        let scene = this.buildScene();
        scene.inferTypes();
    }
}

let typeInferenceTest = new TypeInferenceTest();
typeInferenceTest.testLocalTypes();
