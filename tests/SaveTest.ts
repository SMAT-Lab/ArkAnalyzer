import { SceneConfig } from '../src/Config';
import { Scene } from '../src/Scene';
import { PrinterBuilder } from '../src/save/PrinterBuilder';
import { join } from 'path';

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir(join(__dirname, 'resources', 'save'));

async function run(config: SceneConfig) {
    let scene: Scene = new Scene(config);
    let printer: PrinterBuilder = new PrinterBuilder();
    for (let f of scene.arkFiles) {
        for (let cls of f.getClasses()) {
            if (cls.hasViewTree()) {
                let viewTree = await cls.getViewTree();
                console.log(viewTree);
            }
        }
        //printer.dumpToDot(f);
        printer.dumpToTs(f);
    }
}
run(config);