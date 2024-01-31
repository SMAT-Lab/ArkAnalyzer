import * as ts from "typescript";

/**
 * This class is used to manage all the configurations set up for the analyzer.
 */
export class Config {

    input_dir:string;
    projectName:string;
    api_dir:string;

    //functionTransformer: FunctionTransformer | null = null;
    //sceneTransformer: SceneTransformer | null = null;

    constructor(projectName:string, input_dir:string, api_dir:string) {
        this.projectName = projectName;
        this.input_dir = input_dir;
        this.api_dir = api_dir;
    }
}