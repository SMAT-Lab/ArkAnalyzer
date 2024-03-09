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
        if (arkFile.getName() === "main.ts") {
            // console.log("filepath: "+arkFile.getFilePath())
            let tempMethod = arkFile.getDefaultClass().getMethods()
            entryPoints.push(tempMethod[0].getSignature())
            // console.log(tempMethod)
        }
    }
    // for (let arkFile of projectScene.arkFiles) {
    //     console.log("ArkFile: " + arkFile.getName())
    //     for (let arkClass of arkFile.getClasses()) {
    //         console.log("\tArkClass: " + arkClass.getName())
    //         for (let arkMethod of arkClass.getMethods()) {
    //             console.log("\t\tArkMethod: " + arkMethod.getName())
    //         }
    //     }
    // }
    let callGraph = projectScene.makeCallGraphCHA(entryPoints)
    let methods = callGraph.getMethods()
    let calls = callGraph.getCalls()
    // printCallGraphDetails(methods, calls, config.getTargetProjectDirectory())
    debugger;
}
runScene(config);
