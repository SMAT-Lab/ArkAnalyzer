import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { ArkBody } from "../src/core/model/ArkBody";
import { StaticSingleAssignmentFormer } from "../src/transformer/StaticSingleAssignmentFormer";

export class TypeInferenceTest {
    public buildScene(): Scene {
        // tests\\resources\\typeInference\\sample
        // tests\\resources\\typeInference\\moduleA
        // tests\\resources\\typeInference\\mainModule
        const config_path = "tests\\resources\\type\\TypeTestConfig.json";
        // const config_path = "tests\\resources\\typeInference\\TypeInferenceTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        // Logger.setLogLevel(LOG_LEVEL.INFO);
        return new Scene(config);
    }

    public testLocalTypes() {
        let scene = this.buildScene();
        scene.inferTypes();
        // scene.inferSimpleTypes();
        let staticSingleAssignmentFormer = new StaticSingleAssignmentFormer();
        for (const arkFile of scene.arkFiles) {
            console.log('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    console.log('*** arkMethod: ', arkMethod.getName());

                    const body = arkMethod.getBody();
                    console.log("*****before ssa")
                    this.printStmts(body);
                    console.log("*****after ssa")
                    staticSingleAssignmentFormer.transformBody(body);
                    this.printStmts(body);

                    
                    // console.log('-- locals:');
                    // for (const local of arkMethod.getBody().getLocals()) {
                    //     console.log('name: ' + local.toString() + ', type: ' + local.getType());
                    // }
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
