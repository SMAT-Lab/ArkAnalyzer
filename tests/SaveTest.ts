import {join} from 'node:path';
import { Config } from './Config';
import { Scene } from '../src/Scene';
import * as utils from '../src/utils/getAllFiles';
import { PrinterBuilder } from '../src/save/PrinterBuilder';

function run(config: Config) {
    const projectName: string = config.projectName;
    const input_dir: string = config.input_dir;

    //(1)get all files under input_dir
    //TODO: add support for using tscconfig to get files
    const projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);

    //(2) Fill Scene class
    let scene: Scene = new Scene(projectName, projectFiles, './');
    for (let f of scene.arkFiles) {
        PrinterBuilder.dumpToDot(f);
        PrinterBuilder.dumpToTs(f);
    }
}

let config: Config = new Config('save_test', join(__dirname, 'sample'), '');
run(config);