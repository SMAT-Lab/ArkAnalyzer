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
        if (arkFile.getName() === "test2.ts") {
            for (let arkClass of arkFile.getAllClassesUnderThisFile()) {
                if (arkClass.getName() === "_DEFAULT_ARK_CLASS") {
                    for (let arkMethod of arkClass.getMethods()) {
                        if (arkMethod.getName() === "_DEFAULT_ARK_METHOD") {
                            // entryPoints.push(arkMethod.getSignature())
                        }
                    }
                }
            }
        }
    }
    
    projectScene.inferTypes()
    for (let arkFile of projectScene.arkFiles) {
        if (arkFile.getName() === "testcase_5_method_call.ts") {
            for (let arkClass of arkFile.getAllClassesUnderThisFile()) {
                if (arkClass.getName() === "_DEFAULT_ARK_CLASS") {
                    for (let arkMethod of arkClass.getMethods()) {
                        if (arkMethod.getName() === "_DEFAULT_ARK_METHOD") {
                            for (let local of arkMethod.getBody().getLocals()) {
                                console.log(local.getName() + ": "+local.getType().toString())
                            }
                        }
                    }
                }
            }
        }
    }
    // let callGraph = projectScene.makeCallGraphCHA(entryPoints)
    // let callGraph = projectScene.makeCallGraphRTA(entryPoints)
    // let callGraph = projectScene.makeCallGraphVPA(entryPoints)
    // let methods = callGraph.getMethods()
    // let calls = callGraph.getCalls()
    // printCallGraphDetails(methods, calls, config.getTargetProjectDirectory())
    debugger;
}
runScene(config);
