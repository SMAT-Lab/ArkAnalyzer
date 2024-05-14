import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { ArkBody } from "../src/core/model/ArkBody";


export class Test {
    public buildScene(): Scene {
        const config_path = "tests\\resources\\cfg\\CfgTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        return new Scene(config);
    }

    public test() {
        let scene = this.buildScene();
        scene.inferTypes();
        const classMap = scene.getClassMap();

        for (const arkFile of scene.getFiles()) {
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    console.log('*** arkMethod: ', arkMethod.getName());

                    const body = arkMethod.getBody();
                    const blocks = [...body.getCfg().getBlocks()]
                    for (let i = 0; i < blocks.length; i++){

                        const block = blocks[i]
                        console.log("block"+i)
                        for (const stmt of block.getStmts()){
                            console.log("  " + stmt.toString())
                        }
                        let text = "next:"
                        for (const next of block.getSuccessors()){
                            text += blocks.indexOf(next) + ' ';
                        }
                        console.log(text);
                    }
                    
                    
                }
            }
        }
    }



    public testTypeInference(): void {
        let scene = this.buildScene();
        scene.inferTypes();
    }
}

let t = new Test();
t.test();
