import classTransformer from '../src/callgraph/classTransformer';
import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";

let config: SceneConfig = new SceneConfig()
config.buildFromJson("./tests/resources/classTransformer/classTransformer.json");
function runScene(config: SceneConfig) {
    let projectScene: Scene = new Scene(config);
    
    projectScene.inferTypes()
    
    classTransformer.genClasses(projectScene.getClasses())
    debugger;
}
runScene(config);
