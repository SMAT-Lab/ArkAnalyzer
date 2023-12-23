import { Config } from "../Config";
import { Scene } from "../Scene";
import * as utils from "../utils/utils";
import fs from 'fs';
import { ClassSignature } from "../core/ArkSignature";

function run(config: Config) {
    const projectName: string = config.projectName;
    const input_dir: string = config.input_dir;

    //(1)get all files under input_dir
    //TODO: add support for using tscconfig to get files
    const projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);

    //(2) Fill Scene class
    let scene: Scene = new Scene(projectName, projectFiles);
    const fl = fs.realpathSync('./sample/sample.ts');
    let mtd = scene.getMethod(fl, 'foo', ['NumberKeyword'], ['NumberKeyword'], "_DEFAULT_ARK_CLASS");
    //let mtd = scene.getMethod(fl, '_DEFAULT_ARK_METHOD', [], [], "_DEFAULT_ARK_CLASS");
    //console.log(mtd?.modifier);
    console.log(mtd?.cfg?.declaringClass.classSignature);
    
    let clsSig = new ClassSignature(fl, "SecurityDoor");
    //console.log(scene.getFather(clsSig));
}

let config: Config = new Config("sample", "./sample");
run(config);