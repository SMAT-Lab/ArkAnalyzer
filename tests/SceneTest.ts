import { Config } from "../Config";
import { Scene } from "../Scene";
import * as utils from "../utils/utils";
import fs from 'fs';
import { ClassSignature } from "../core/ArkSignature";

function run(config: Config) {
    const projectName: string = config.projectName;
    const input_dir: string = config.input_dir;
    console.log(input_dir);
    debugger;

    //(1)get all files under input_dir
    //TODO: add support for using tscconfig to get files
    const projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);

    //(2) Fill Scene class
    let scene: Scene = new Scene(projectName, projectFiles);
    const fl = fs.realpathSync('./sample/sample.ts');
    let mtd = scene.getMethod(fl, 'foo', ['NumberKeyword'], ['NumberKeyword']);
    console.log(mtd);
    //console.log(mtd?.cfg);
    
    let clsSig = new ClassSignature(fl, "SecurityDoor");
    console.log(scene.getFather(clsSig));
}

let config: Config = new Config("sample", "./sample");
run(config);