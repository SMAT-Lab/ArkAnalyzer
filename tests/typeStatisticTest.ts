import { Scene } from "../src/Scene";
import * as utils from "../src/utils/getAllFiles";
import { Config } from "./Config";

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
    //logger.info(mtd);
    //logger.info(mtd?.cfg);
    debugger;

    //let code = 'let age = myPerson.age + i;';
    //let codeTree = new ASTree(code);
    //codeTree.printAST();
}

//let config: Config = new Config("app_photo", "/Users/yifei/Documents/Code/applications_photos/common/src/main/ets");
//let config: Config = new Config("app_photo", "/Users/yifei/Documents/Code/applications_systemui");
//let config: Config = new Config("app_photo", "./tests/sample");
let config: Config = new Config("app_test", "/Users/yangyizhuo/WebstormProjects/ArkAnalyzer/tests/resources/cfg");
run(config);