import { Config } from "./Config";
import { Scene } from "./Scene";
import { ArkClass } from "./core/ArkClass";
import { ArkMethod } from "./core/ArkMethod";




function run(config:Config) {
    //(1) Construct ASTs
    //ast = ...

    //(2) Fill Scene class
    //Scene scene = parse(ast)
    let scene:Scene = new Scene();

    //(3) Conduct Code Transformation
    if (null != config.sceneTransformer) {
        config.sceneTransformer.internalTransform();
    } else if (null != config.functionTransformer) {
        let classes:ArkClass[] = scene.getApplicationClasses();
        for (let cls in classes) {
            //let methods:ArkMethod[] = cls.getMethods();
        }
    }

    //(4) Re-generate Code
}