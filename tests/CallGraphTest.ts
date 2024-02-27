import { SceneConfig } from "./Config";
import { Scene } from "../src/Scene";
import {printCallGraphDetails} from "../src/utils/callGraphUtils";
import {MethodSignature} from "../src/core/model/ArkSignature";

//let config: SceneConfig = new SceneConfig("./tests/AppTestConfig.json");
let config: SceneConfig = new SceneConfig()
config.buildFromJson("./tests/callGraphConfigUnix.json");
function runScene(config: SceneConfig) {
    let projectScene: Scene = new Scene(config);
    let entryPoints: MethodSignature[] = []
    // for (let method of projectScene.getMethods()) {
    //     entryPoints.push(method.getSignature())
    // }
    for (let arkFile of projectScene.arkFiles) {
        if (arkFile.getName() === "b.ts") {
            let tempMethod = arkFile.getDefaultClass().getMethods()
            for (let func of tempMethod) {
                // console.log(func.getName())
                if (func.getName() == "temp") {
                    entryPoints.push(func.getSignature())
                    // console.log(func.getBody().getLocals())
                }
            }
        }
    }
    projectScene.makeCallGraphCHA(entryPoints)
    let methods = projectScene.classHierarchyCallGraph.getMethods()
    let calls = projectScene.classHierarchyCallGraph.getCalls()
    // printCallGraphDetails(methods, calls, config.getTargetProjectDirectory())
    debugger;
}
runScene(config);
