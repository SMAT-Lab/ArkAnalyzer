
import { SceneConfig } from './Config';
import { Scene } from '../src/Scene';
import { PrinterBuilder } from '../src/save/PrinterBuilder';

let config: SceneConfig = new SceneConfig();
config.buildFromJson("./tests/SaveTestConfig.json");

function run(config: SceneConfig) {
    let scene: Scene = new Scene(config);
    for (let f of scene.arkFiles) {
        PrinterBuilder.dumpToDot(f);
        PrinterBuilder.dumpToTs(f);
    }
}

//let config: Config = new Config('save_test', join(__dirname, 'sample'), '');
run(config);