import { SceneConfig } from "./Config";
import { Scene } from "../src/Scene";

let config: SceneConfig = new SceneConfig();

config.buildFromJson("./tests/AppTestConfig.json");
//config.buildFromJson("./tests/sample/AppTestConfig-sample.json");
//config.buildFromJson("./tests/AppTestConfigUnix.json");

//config.buildFromProjectDir("C:\\msys64\\home\\Yifei\\code\\applications_photos");

//let config: SceneConfig = new SceneConfig("./tests/AppTestConfigUnix.json");
function runScene(config: SceneConfig) {
    let projectScene: Scene = new Scene(config);
    debugger;
}
runScene(config);