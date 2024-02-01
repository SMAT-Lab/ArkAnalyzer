import * as ts from "typescript";

/**
 * This class is used to manage all the configurations set up for the analyzer.
 */
export class Config {

    project_dir:string;
    projectName:string;
    sdkName?: string;
    sdk_dir?:string;

    //functionTransformer: FunctionTransformer | null = null;
    //sceneTransformer: SceneTransformer | null = null;

    constructor(projectName:string, project_dir:string, sdkName?: string, sdk_dir?:string) {
        this.projectName = projectName;
        this.project_dir = project_dir;
        this.sdkName = sdkName;
        this.sdk_dir = sdk_dir;
    }
}