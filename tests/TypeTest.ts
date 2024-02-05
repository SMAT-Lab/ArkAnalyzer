import { Config, SceneConfig } from "./Config";
import { Scene } from "../src/Scene";

let config: SceneConfig = new SceneConfig();
config.buildFromJson("./tests/TypeTestConfig.json")
function runScene(config: SceneConfig) {
    let projectScene: Scene = new Scene(config);
    debugger;
}
runScene(config);

// "targetProjectName": "photos",
// "targetProjectDirectory": "./tests/resources/cfg",

// "ohosSdkPath": "../openharmony\\interface\\sdk-js\\api",
// "kitSdkPath": "../openharmony\\interface\\sdk-js\\kits",