import { SceneConfig } from "./Config";
import { Scene } from "../src/Scene";

//let config: SceneConfig = new SceneConfig("./tests/AppTestConfig.json");
let config: SceneConfig = new SceneConfig("./tests/AppTestConfigUnix.json");
function runScene(config: SceneConfig) {
    let projectScene: Scene = new Scene(config);
    debugger;
}
runScene(config);