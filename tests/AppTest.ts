import { Config } from "./Config";
import { Scene } from "../src/Scene";
import * as utils from "../src/utils/getAllFiles";
import fs from 'fs';
import path from 'path';
import { ClassSignature } from "../src/core/model/ArkSignature";
import { ASTree } from "../src/core/base/Ast";
import { HotPropertyAccessCheck } from "./checker/HotPropertyAccessCheck";
import { ArkFile } from "../src/core/model/ArkFile";
import { ArkClass } from "../src/core/model/ArkClass";
import { ArkInterface } from "../src/core/model/ArkInterface";

function run(config: Config) {
    const projectName: string = config.projectName;
    const project_dir: string = config.project_dir;
    const sdkName: string | undefined = config.sdkName;
    const sdk_dir: string | undefined = config.sdk_dir;

    const sdkFiles: string[] = utils.getAllFiles(sdk_dir!, ['.ts']);
    const projectFiles: string[] = utils.getAllFiles(project_dir, ['.ts']);

    //let apiScene: Scene = new Scene("sdk-js", apiFiles, api_dir!);
    //const apiArkInstancesMap = apiScene.getArkInstancesMap();
    let projectScene: Scene = new Scene(projectName, projectFiles, project_dir, sdkName, sdkFiles, sdk_dir);
    //let projectScene: Scene = new Scene(projectName, projectFiles, input_dir);
    const projectInstancesMap = projectScene.getArkInstancesMap();

    projectInstancesMap.forEach((value, key) => {
        if (value instanceof ArkInterface) {
            //console.log("####", key);
        }
    });

    //HotPropertyAccessCheck(scene);


    debugger;

    //let code = 'let age = myPerson.age + i;';
    //let codeTree = new ASTree(code);
    //codeTree.printAST();
}

//const input_dir = "C:\\msys64\\home\\Yifei\\code\\HelloWorldApi9";
const input_dir = "C:\\msys64\\home\\Yifei\\code\\applications_photos";
const api_dir = "C:\\msys64\\home\\Yifei\\code\\openharmony\\interface\\sdk-js\\api";
//let config: Config = new Config("app_photo", "/Users/yifei/Documents/Code/applications_photos/common/src/main/ets");
//let config: Config = new Config("app_photo", "/Users/yifei/Documents/Code/applications_systemui");
//let config: Config = new Config("app_photo", "./tests/sample");
//let config: Config = new Config("app_test", "/Users/yifei/Documents/Code/test/HelloWorldApi9");
//let config: Config = new Config("app_test", "C:\\msys64\\home\\Yifei\\code\\HelloWorldApi9")
let config: Config = new Config("app_test", input_dir, "ohos", api_dir);
//let config: Config = new Config("app_test", "C:\\msys64\\home\\Yifei\\code\\applications_photos\\resultTsDir\\common\\src\\main\\ets\\default\\view-bak");
run(config);