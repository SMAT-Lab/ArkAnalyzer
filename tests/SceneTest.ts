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

    //(2) Fill Scene class
    let scene: Scene = new Scene(projectName, projectFiles);
    //HotPropertyAccessCheck(scene);

    //const fl = 'C:\\msys64\\home\\Yifei\\code\\ArkAnalyzer\\tests\\sample\\sample.ts';
    //const fl = '/Users/yifei/Documents/Code/ArkAnalyzer/tests/sample/sample.ts';
    //let mtd = scene.getMethod(fl, '_DEFAULT_ARK_METHOD', [], [], '_DEFAULT_ARK_CLASS');
    //console.log(mtd);
    //console.log(mtd?.cfg);
    debugger;
    
    //let code = 'let age = myPerson.age + i;';
    //let codeTree = new ASTree(code);
    //codeTree.printAST();
}

//let config: Config = new Config("app_photo", "/Users/yifei/Documents/Code/applications_photos/common/src/main/ets");
//let config: Config = new Config("app_photo", "/Users/yifei/Documents/Code/applications_systemui");
//let config: Config = new Config("app_photo", "./tests/sample");
let config: Config = new Config("app_test", "/Users/yifei/Documents/Code/test/HelloWorldApi9");
run(config);