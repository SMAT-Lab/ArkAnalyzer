import { Scene } from "../src/Scene";
import { printCallGraphDetails } from "../src/utils/callGraphUtils";
import * as utils from "../src/utils/getAllFiles";
import { Config } from "./Config";

function run(config: Config) {
    const projectName: string = config.projectName;
    const input_dir: string = config.project_dir;

    //(1)get all files under input_dir
    //TODO: add support for using tscconfig to get files
    const projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);
    // logger.info(projectFiles)

    //(2) Fill Scene class
    let scene: Scene = new Scene(projectName, projectFiles,config.project_dir);

    let entryPoints = []
    for (let method of scene.getMethods()) {
        entryPoints.push(method.getSignature())
    }
    scene.makeCallGraphCHA(entryPoints)
    let methods = scene.classHierarchyCallGraph.getMethods()
    let calls = scene.classHierarchyCallGraph.getCalls()
    printCallGraphDetails(methods, calls, config.project_dir)

    // scene.getMethods()
    // for (let a of scene.arkFiles) {
    //     for (let clas of a.getClasses()) {
    //         if (clas.getSignature().toString() === "<main.ts>.<_DEFAULT_ARK_CLASS>")
    //             for (let method of clas.getMethods()) {
    //                 // logger.info(method.getName())
    //                 // logger.info(method.getBody().getLocals())
    //             }
    //     }
    // }
    // scene.classHierarchyCallGraph.printDetails()

}

//let config: Config = new Config("app_photo", "/Users/yifei/Documents/Code/applications_photos/common/src/main/ets");
//let config: Config = new Config("app_photo", "/Users/yifei/Documents/Code/applications_systemui");
// let config: Config = new Config("systemui", "./codeLab/codelabs2/NetworkManagement/NewsDataArkTS");
// let config: Config = new Config("systemui", "./codeLab/interface_sdk-js-master/");
// let config: Config = new Config("systemui", "/Users/yangyizhuo/WebstormProjects/ArkAnalyzer/tests/resources/type");
let config: Config = new Config("systemui", "/Users/yangyizhuo/WebstormProjects/ArkAnalyzer/tests/resources/callgraph", "");
run(config);