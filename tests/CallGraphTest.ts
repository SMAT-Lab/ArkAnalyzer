import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { MethodSignature } from "../src/core/model/ArkSignature";
import { printCallGraphDetails } from "../src/utils/callGraphUtils";
import Logger, { LOG_LEVEL } from "../src/utils/logger";

const logger = Logger.getLogger();

//let config: SceneConfig = new SceneConfig("./tests/AppTestConfig.json");
let config: SceneConfig = new SceneConfig()
config.buildFromJson("./tests/resources/callgraph/callGraphConfigUnix.json");
Logger.setLogLevel(LOG_LEVEL.INFO)
function runScene(config: SceneConfig) {
    let projectScene: Scene = new Scene(config);
    let entryPoints: MethodSignature[] = []
    // for (let method of projectScene.getMethods()) {
    //     entryPoints.push(method.getSignature())
    // }
    for (let arkFile of projectScene.arkFiles) {
        if (arkFile.getName() === "c.ts") {
            // logger.info("filepath: "+arkFile.getFilePath())
            let tempMethod = arkFile.getDefaultClass().getDefaultArkMethod()
            entryPoints.push(tempMethod!.getSignature())
            // let cla = arkFile.getClasses()[2]
            // for (let method of cla.getMethods()) {
            //     if (method.getName() == "onRun") {
            //         entryPoints.push(method.getSignature())
            //     }
            // }
            // logger.info(tempMethod)
        }
    }
    // for (let arkFile of projectScene.arkFiles) {
    //     logger.info("ArkFile: " + arkFile.getName())
    //     for (let arkClass of arkFile.getClasses()) {
    //         logger.info("\tArkClass: " + arkClass.getName())
    //         for (let arkMethod of arkClass.getMethods()) {
    //             logger.info("\t\tArkMethod: " + arkMethod.getName())
    //         }
    //     }
    // }
    projectScene.inferTypes()
    // let callGraph = projectScene.makeCallGraphCHA(entryPoints)
    // let callGraph = projectScene.makeCallGraphRTA(entryPoints)
    let callGraph = projectScene.makeCallGraphVPA(entryPoints)
    let methods = callGraph.getMethods()
    let calls = callGraph.getCalls()
    printCallGraphDetails(methods, calls, config.getTargetProjectDirectory())
    debugger;
}
runScene(config);
