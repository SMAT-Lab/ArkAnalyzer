import fs from "fs";
import path from "path";

/**
 * This class is used to manage all the configurations set up for the analyzer.
 */
export class Config {

    project_dir: string;
    projectName: string;
    sdkName?: string;
    sdk_dir?: string;

    //functionTransformer: FunctionTransformer | null = null;
    //sceneTransformer: SceneTransformer | null = null;

    constructor(projectName: string, project_dir: string, sdkName?: string, sdk_dir?: string) {
        this.projectName = projectName;
        this.project_dir = project_dir;
        this.sdkName = sdkName;
        this.sdk_dir = sdk_dir;
    }
}

interface otherSdk {
    name: string;
    path: string;
}

export class SceneConfig {
    private configJsonPath: string = "";

    private targetProjectName: string = "";
    private targetProjectDirectory: string = "";

    private ohosSdkPath: string = "";
    private kitSdkPath: string = "";
    private systemSdkPath: string = "";

    private otherSdkMap: Map<string, string> = new Map();

    private sdkFiles: string[] = [];
    private projectFiles: string[] = [];

    constructor() { }

    public buildFromJson(configJsonPath: string) {
        this.configJsonPath = configJsonPath;
        this.genConfig();
        this.getAllFiles();
    }

    public buildFromProjectDir(targetProjectDirectory: string) {
        this.targetProjectDirectory = targetProjectDirectory;
        this.targetProjectName = path.basename(targetProjectDirectory);
        this.getAllFiles();
    }

    private genConfig() {

        if (fs.existsSync(this.configJsonPath)) {
            let configurations = JSON.parse(fs.readFileSync(this.configJsonPath, "utf8"));


            this.targetProjectName = configurations.targetProjectName;
            this.targetProjectDirectory = configurations.targetProjectDirectory;

            this.ohosSdkPath = configurations.ohosSdkPath;
            this.kitSdkPath = configurations.kitSdkPath;
            this.systemSdkPath = configurations.systemSdkPath;

            let otherSdks: otherSdk[] = [];
            for (let sdk of configurations.otherSdks) {
                otherSdks.push(JSON.parse(JSON.stringify(sdk)));
            }
            otherSdks.forEach((sdk) => {
                if (sdk.name && sdk.path) {
                    this.otherSdkMap.set(sdk.name, sdk.path);
                }
            });
        }
        else {
            console.log("Your configJsonPath: <", this.configJsonPath, "> is not exist.");
        }
    }

    private getAllFiles() {
        if (this.targetProjectDirectory) {
            let tmpFiles: string[] = getFiles(this.targetProjectDirectory, "\\.ts\$");
            this.projectFiles.push(...tmpFiles);
        }
        else {
            throw new Error('TargetProjectDirectory is wrong.');
        }
        if (this.ohosSdkPath) {
            let ohosFiles: string[] = getFiles(this.ohosSdkPath, "\\.d\\.ts\$");
            this.sdkFiles.push(...ohosFiles);
        }
        if (this.kitSdkPath) {
            let kitFiles: string[] = getFiles(this.kitSdkPath, "\\.d\\.ts\$");
            this.sdkFiles.push(...kitFiles);
        }
        if (this.systemSdkPath) {
            let systemFiles: string[] = getFiles(this.systemSdkPath, "\\.d\\.ts\$");
            this.sdkFiles.push(...systemFiles);
        }
        if (this.otherSdkMap.size != 0) {
            this.otherSdkMap.forEach((value, key) => {
                let otherSdkFiles: string[] = getFiles(value, "\\.d\\.ts\$");
                this.sdkFiles.push(...otherSdkFiles);
            });
        }
    }

    public getTargetProjectName() {
        return this.targetProjectName;
    }

    public getTargetProjectDirectory() {
        return this.targetProjectDirectory;
    }

    public getProjectFiles() {
        return this.projectFiles;
    }

    public getSdkFiles() {
        return this.sdkFiles;
    }

    public getOhosSdkPath() {
        return this.ohosSdkPath;
    }

    public getKitSdkPath() {
        return this.kitSdkPath;
    }

    public getSystemSdkPath() {
        return this.systemSdkPath;
    }

    public getOtherSdkMap() {
        return this.otherSdkMap;
    }
}

function getFiles(srcPath: string, fileExt: string, tmpFiles: string[] = []) {

    let extReg = new RegExp(fileExt);

    if (!fs.existsSync(srcPath)) {
        console.log("Input directory is not exist: ", srcPath);
        return tmpFiles;
    }

    const realSrc = fs.realpathSync(srcPath);

    fs.readdirSync(realSrc).forEach(filename => {
        const realFile = path.resolve(realSrc, filename);

        if (fs.statSync(realFile).isDirectory()) {
            getFiles(realFile, fileExt, tmpFiles);
        } else {
            if (extReg.test(realFile)) {
                tmpFiles.push(realFile);
            }
        }
    })

    return tmpFiles;
}