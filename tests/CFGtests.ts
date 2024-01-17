import { Config } from "../Config";
import { Scene } from "../Scene";
import * as utils from "../utils/utils";
import fs from 'fs';
import { ClassSignature } from "../core/ArkSignature";
import { conditionStatement } from "../core/base/Cfg";
import { ASTree } from "../core/base/Ast";
import { HotPropertyAccessCheck } from "../checker/HotPropertyAccessCheck";

function run(config: Config) {
    const projectName: string = config.projectName;
    const input_dir: string = config.input_dir;

    //(1)get all files under input_dir
    //TODO: add support for using tscconfig to get files
    const projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);

    //(2) Fill Scene class
    let scene: Scene = new Scene(projectName, projectFiles);
    HotPropertyAccessCheck(scene);
    
    //let code = 'let age = myPerson.age + i;';
    //let codeTree = new ASTree(code);
    //codeTree.printAST();
}

//let config: Config = new Config("app_photo", "/Users/yifei/Documents/Code/applications_photos/common/src/main/ets");
//let config: Config = new Config("app_photo", "/Users/yifei/Documents/Code/applications_systemui");
let config: Config = new Config("systemui", "./codeLab/codelabs2/NetworkManagement/NewsDataArkTS");
// let config: Config = new Config("systemui", "./tests/resources/cfg");
run(config);