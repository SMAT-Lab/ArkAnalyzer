import { Config } from "./Config";
import { Scene } from "../src/Scene";
import * as utils from "../src/utils/getAllFiles";
import fs from 'fs';
import { ClassSignature } from "../src/core/model/ArkSignature";
import { ASTree } from "../src/core/base/Ast";
import { HotPropertyAccessCheck } from "./checker/HotPropertyAccessCheck";

function run(config: Config) {
    const projectName: string = config.projectName;
    const input_dir: string = config.input_dir;

    //(1)get all files under input_dir
    //TODO: add support for using tscconfig to get files
    const projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);
    // console.log(projectFiles)

    //(2) Fill Scene class
    let scene: Scene = new Scene(projectName, projectFiles,config.input_dir);

    scene.makeCallGraphCHA([scene.arkFiles[2].getDefaultClass().getMethods()[0].getSignature()])

    // for (let a of scene.arkFiles) {
    //     for (let clas of a.getClasses()) {
    //         for (let method of clas.getMethods())
    //             if (method.getName() == "invokeParam") {
    //                 console.log(method.getName())
    //                 console.log(method.getBody().getLocals())
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