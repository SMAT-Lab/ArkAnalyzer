import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { ArkBody } from "../src/core/model/ArkBody";


export class Test {
    public buildScene(): Scene {
        const config_path = "tests\\resources\\defUseChain\\defUseChain.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        return new Scene(config);
    }

    public test() {
        let scene = this.buildScene();
        scene.inferTypes();

        for (const arkFile of scene.arkFiles) {
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    console.log('*** arkMethod: ', arkMethod.getName());

                    const cfg = arkMethod.getBody().getCfg();
                    cfg.buildDefUseChain();
                    for (const chain of cfg.getDefUseChains()){
                        console.log("variable: "+chain.value.toString()+", def: "+chain.def.toString()+", use: "+chain.use.toString());
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
