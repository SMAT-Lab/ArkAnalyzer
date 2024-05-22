import fs from "fs";
import path from "path";
import { spawnSync } from 'child_process';
import Logger, { LOG_LEVEL } from "./utils/logger";
import { removeSync } from "fs-extra";
import { transfer2UnixPath } from "./utils/pathTransfer";
import { fetchDependenciesFromFile } from "./utils/json5parser";

const logger = Logger.getLogger();

/**
 * This class is used to manage all the configurations set up for the analyzer.
 */
export class Config {

    project_dir: string;
    projectName: string;
    sdkName?: string;
    sdk_dir?: string;

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
    private targetProjectOriginDirectory: string = '';

    private etsSdkPath: string = "";
    private otherSdkMap: Map<string, string> = new Map();

    private sdkFiles: string[] = [];
    private sdkFilesMap: Map<string[], string> = new Map<string[], string>();
    private projectFiles: Map<string, string[]> = new Map<string, string[]>();
    private logPath: string = "./out/ArkAnalyzer.log";

    private hosEtsLoaderPath: string = '';
    private ohPkgContentMap: Map<string, { [k: string]: unknown }> = new Map<string, { [k: string]: unknown }>();

    constructor() { }

    public buildFromJson2(configJsonPath: string) {
        this.configJsonPath = configJsonPath;
        this.genConfig();
        this.getAllFiles();
    }

    private genConfig() {

        if (fs.existsSync(this.configJsonPath)) {
            let configurations = JSON.parse(fs.readFileSync(this.configJsonPath, "utf8"));
            this.targetProjectName = configurations.targetProjectName;
            this.targetProjectDirectory = configurations.targetProjectDirectory;
            this.logPath = configurations.logPath;
            Logger.configure(this.logPath, LOG_LEVEL.ERROR);

            this.etsSdkPath = configurations.etsSdkPath;

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
            throw new Error(`Your configJsonPath: "${this.configJsonPath}" is not exist.`);
        }
    }


    public async buildFromJson(configJsonPath: string) {
        if (fs.existsSync(configJsonPath)) {
            const configurations = JSON.parse(fs.readFileSync(configJsonPath, "utf8"));

            let otherSdks: otherSdk[] = [];
            for (let sdk of configurations.otherSdks) {
                otherSdks.push(JSON.parse(JSON.stringify(sdk)));
            }
            otherSdks.forEach((sdk) => {
                if (sdk.name && sdk.path) {
                    this.otherSdkMap.set(sdk.name, sdk.path);
                }
            });

            await this.buildConfig(
                configurations.targetProjectName,
                configurations.targetProjectOriginDirectory,
                configurations.targetProjectDirectory,
                configurations.etsSdkPath,
                configurations.logPath,
                configurations.nodePath
            )
        }
        else {
            throw new Error(`Your configJsonPath: "${configJsonPath}" is not exist.`);
        }
    }

    public buildFromProjectDir(targetProjectDirectory: string) {
        this.targetProjectDirectory = targetProjectDirectory;
        this.targetProjectName = path.basename(targetProjectDirectory);
        Logger.configure(this.logPath, LOG_LEVEL.ERROR);
        this.getAllFiles();
    }

    public async buildConfig(targetProjectName: string, targetProjectOriginDirectory: string, targetProjectDirectory: string,
        sdkEtsPath: string, logPath: string, nodePath: string) {
        this.targetProjectName = targetProjectName;
        this.targetProjectOriginDirectory = targetProjectOriginDirectory;
        this.targetProjectDirectory = path.join(targetProjectDirectory, targetProjectName);
        this.etsSdkPath = sdkEtsPath;
        this.hosEtsLoaderPath = path.join(sdkEtsPath, './build-tools/ets-loader');
        this.logPath = logPath;

        Logger.configure(this.logPath, LOG_LEVEL.ERROR);
        logger.info("Path of Node is: ", nodePath);
        if (nodePath != '') {
            let nodeVersion = spawnSync(nodePath, ['-v']).stdout.toString();
            logger.info('Node version is: ', nodeVersion);
        }
        else {
            logger.error('nodePath is empty!');
        }

        removeSync(transfer2UnixPath(targetProjectDirectory + '/' + this.targetProjectName));
        let output = spawnSync(nodePath,
            [path.join(__dirname, 'ets2ts.js'), this.hosEtsLoaderPath, this.targetProjectOriginDirectory, targetProjectDirectory, this.targetProjectName, this.logPath],
            { encoding: 'utf-8' }
        );
        if (output.status != 0) {
            logger.error('ets2ts err is: ', output.stderr);
        }

        this.getAllFiles();
    }

    private getAllFiles() {
        if (this.targetProjectDirectory) {
            this.projectFiles = getFiles2PkgMap(this.targetProjectDirectory, new Array<string>(), this.ohPkgContentMap);
        }
        else {
            throw new Error('TargetProjectDirectory is wrong.');
        }
        if (this.etsSdkPath) {
            let etsFiles: string[] = getFiles(this.etsSdkPath, "\\.d\\.ts\$");
            this.sdkFiles.push(...etsFiles);
            this.sdkFilesMap.set(etsFiles, "etsSdk");
        }
        if (this.otherSdkMap.size != 0) {
            this.otherSdkMap.forEach((value, key) => {
                let otherSdkFiles: string[] = getFiles(value, "\\.d\\.ts\$");
                this.sdkFiles.push(...otherSdkFiles);
                this.sdkFilesMap.set(otherSdkFiles, key);
            });
        }
    }

    public getTargetProjectName() {
        return this.targetProjectName;
    }

    public getTargetProjectDirectory() {
        return this.targetProjectDirectory;
    }

    public getTargetProjectOriginDirectory() {
        return this.targetProjectOriginDirectory;
    }

    public getProjectFiles() {
        return this.projectFiles;
    }

    public getSdkFiles() {
        return this.sdkFiles;
    }

    public getSdkFilesMap() {
        return this.sdkFilesMap;
    }

    public getEtsSdkPath() {
        return this.etsSdkPath;
    }

    public getOtherSdkMap() {
        return this.otherSdkMap;
    }

    public getLogPath(): string {
        return this.logPath;
    }

    public getOhPkgContentMap(): Map<string, { [k: string]: unknown }> {
        return this.ohPkgContentMap;
    }
}

function getFiles(srcPath: string, fileExt: string, tmpFiles: string[] = []) {

    let extReg = new RegExp(fileExt);

    if (!fs.existsSync(srcPath)) {
        logger.info("Input directory is not exist: ", srcPath);
        return tmpFiles;
    }

    const realSrc = fs.realpathSync(srcPath);

    let files2Do: string[] = fs.readdirSync(realSrc);
    for (let fileName of files2Do) {
        if (fileName == 'oh_modules' ||
            fileName == 'node_modules' ||
            fileName == 'ets-loader') {
            continue;
        }
        const realFile = path.resolve(realSrc, fileName);

        if (fs.statSync(realFile).isDirectory()) {
            getFiles(realFile, fileExt, tmpFiles);
        } else {
            if (extReg.test(realFile)) {
                tmpFiles.push(realFile);
            }
        }
    }

    return tmpFiles;
}

function getFiles2PkgMap(srcPath: string, ohPkgFiles: string[], ohPkgContentMap: Map<string, { [k: string]: unknown }>, tmpMap: Map<string, string[]> = new Map()) {

    if (!fs.existsSync(srcPath)) {
        logger.info("Input directory is not exist: ", srcPath);
        return tmpMap;
    }

    const realSrc = fs.realpathSync(srcPath);

    let files2Do: string[] = fs.readdirSync(realSrc);
    let ohPkgFilesOfThisDir: string[] = [];
    ohPkgFilesOfThisDir.push(...ohPkgFiles);
    files2Do.forEach((fl) => {
        if (fl == 'oh-package.json5') {
            let dirJson5 = path.resolve(realSrc, 'oh-package.json5');
            ohPkgFilesOfThisDir.push(dirJson5);
            ohPkgContentMap.set(dirJson5, fetchDependenciesFromFile(dirJson5));
        }
    });
    for (let fileName of files2Do) {
        if (fileName == 'oh_modules' ||
            fileName == 'node_modules' ||
            fileName == 'hvigorfile.ts') {
            continue;
        }
        const realFile = path.resolve(realSrc, fileName);

        if (fs.statSync(realFile).isDirectory()) {
            getFiles2PkgMap(realFile, ohPkgFilesOfThisDir, ohPkgContentMap, tmpMap);
        } else {
            const extReg = new RegExp("\\.ts\$");
            if (extReg.test(realFile)) {
                tmpMap.set(realFile, ohPkgFilesOfThisDir);
            }
        }
    }

    return tmpMap;
}