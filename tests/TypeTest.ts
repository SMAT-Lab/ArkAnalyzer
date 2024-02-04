import { Config, SceneConfig } from "./Config";
import { Scene } from "../src/Scene";

let config: SceneConfig = new SceneConfig("./tests/TypeTestConfig.json");
function runScene(config: SceneConfig) {
    let projectScene: Scene = new Scene(config);
    debugger;
}
runScene(config);