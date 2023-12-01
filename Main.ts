import { Config } from "./Config";
import { Scene } from "./Scene";
import { ArkClass } from "./core/ArkClass";
import { ArkMethod } from "./core/ArkMethod";
import { ArkFile } from "./core/ArkFile";
import * as utils from "./utils/utils";

function run(config: Config) {
    const projectName: string = config.projectName;
    const input_dir: string = config.input_dir;

    //(1)get all files under input_dir
    //TODO: add support for using tscconfig to get files
    const projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);

    //(2) Fill Scene class
    let scene: Scene = new Scene(projectName, projectFiles);

    //(3) Conduct Code Transformation
    //if (null != config.sceneTransformer) {
    //    config.sceneTransformer.internalTransform();
    //} else if (null != config.functionTransformer) {
    //    let classes: ArkClass[] = scene.getApplicationClasses();
    //    for (let cls in classes) {
    //        //let methods:ArkMethod[] = cls.getMethods();
    //    }
    //}

    //(4) Re-generate Code
}

let config:Config = new Config("sample", "./sample");
run(config);
debugger;