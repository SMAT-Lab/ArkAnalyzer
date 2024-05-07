import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";

let config: SceneConfig = new SceneConfig();
//let config: SceneConfig = new SceneConfig("./tests/AppTestConfigUnix.json");


//config.buildFromJson("./tests/AppTestConfig.json");
//config.buildFromJson("./tests/sample/AppTestConfig-sample.json");
//config.buildFromJson("./tests/AppTestConfigUnix.json");

//config.buildFromProjectDir("C:\\msys64\\home\\Yifei\\code\\applications_photos");

function runScene4Json(config: SceneConfig) {
    let projectScene: Scene = new Scene(config);
    debugger;
}
async function runScene4Ide() {
    let config: SceneConfig = new SceneConfig();
    await config.buildFromIde(
        "scene",
        "D:/code/scene_xxx",
        "C:/msys64/home/xxx/code/yyyy",
        "D:/code/deveco-studio/sdk/xxx",
        "C:/mysys64/home/xxx/code/log/xx.log"
    );
}

runScene4Json(config);

//runScene4Ide();