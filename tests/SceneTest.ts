import { Scene } from "../src/Scene";
import { SceneConfig } from "./Config";

class  SceneTest{
    public buildScene(): Scene {
        // tests\\resources\\scene\\mainModule
        const config_path = "tests\\resources\\scene\\SceneTestConfig.json";        
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        return new Scene(config);
    }
}

let sceneTest = new SceneTest();
sceneTest.buildScene();