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
    for (let arkFile of projectScene.getFiles()) {
        if (arkFile.getName() === "testcase_10_method_call.ts") {
            for (let arkClass of arkFile.getClasses()) {
                if (arkClass.getName() === "_DEFAULT_ARK_CLASS") {
                    for (let arkMethod of arkClass.getMethods()) {
                        if (arkMethod.getName() === "_DEFAULT_ARK_METHOD") {
                            entryPoints.push(arkMethod.getSignature())
                        }
                    }
                }
            }
        }
    }
    
    projectScene.inferTypes()
    // for (let arkFile of projectScene.getFiles()) {
    //     if (arkFile.getName() === "testcase_24_import.ts") {
    //         let locals = 0, methods = 0
    //         for (let arkClass of arkFile.getClasses()) {
    //             // if (arkClass.getName() === "_DEFAULT_ARK_CLASS") {
    //                 for (let arkMethod of arkClass.getMethods()) {
    //                     console.log("=========method========: "+arkMethod.getName())
    //                     // if (arkMethod.getName() === "main") {
    //                         console.log("\nLocals:")
    //                         for (let local of arkMethod.getBody().getLocals()) {
    //                             console.log(local.getName() + ": "+local.getType().toString())
    //                             locals ++
    //                         }
    //                         console.log("\nmethod signature:")
    //                         for (let stmt of arkMethod.getBody().getCfg().getStmts()) {
    //                             if (stmt.containsInvokeExpr()) {
    //                                 console.log(stmt.getInvokeExpr()?.getMethodSignature().toString())
    //                                 methods ++
    //                             }
    //                         }
    //                     // }
    //                 }
    //             // }
    //         }
    //         console.log("locals: "+locals)
    //         console.log("methods: "+methods)
    //     }
    // }
    let callGraph = projectScene.makeCallGraphCHA(entryPoints)
    // let callGraph = projectScene.makeCallGraphRTA(entryPoints)
    // let callGraph = projectScene.makeCallGraphVPA(entryPoints)
    let methods = callGraph.getMethods()
    let calls = callGraph.getCalls()
    printCallGraphDetails(methods, calls, config.getTargetProjectDirectory())
    debugger;
}
runScene(config);
