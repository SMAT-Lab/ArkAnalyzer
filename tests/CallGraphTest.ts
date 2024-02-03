import { SceneConfig } from "./Config";
import { Scene } from "../src/Scene";
import {printCallGraphDetails} from "../src/utils/callGraphUtils";

//let config: SceneConfig = new SceneConfig("./tests/AppTestConfig.json");
let config: SceneConfig = new SceneConfig("./tests/callGraphConfigUnix.json");
function runScene(config: SceneConfig) {
    let projectScene: Scene = new Scene(config);
    let entryPoints = []
    for (let method of projectScene.getMethods()) {
        entryPoints.push(method.getSignature())
    }
    projectScene.makeCallGraphCHA(entryPoints)
    let methods = projectScene.classHierarchyCallGraph.getMethods()
    let calls = projectScene.classHierarchyCallGraph.getCalls()
    // printCallGraphDetails(methods, calls, config.getTargetProjectDirectory())
    debugger;
}
runScene(config);
