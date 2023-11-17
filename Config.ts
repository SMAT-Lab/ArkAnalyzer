
/**
 * This class is used to manage all the configurations set up for the analyzer.
 */
export class Config {

    input_dir:string;

    functionTransformer: FunctionTransformer | null = null;
    sceneTransformer: SceneTransformer | null = null;

    constructor(input_dir:string) {
        this.input_dir = input_dir;
    }
}