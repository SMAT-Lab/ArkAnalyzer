import fs from 'fs';
import path from 'path';

import { SceneConfig } from './Config';
import { AbstractCallGraph } from "./callgraph/AbstractCallGraphAlgorithm";
import { ClassHierarchyAnalysisAlgorithm } from "./callgraph/ClassHierarchyAnalysisAlgorithm";
import { RapidTypeAnalysisAlgorithm } from "./callgraph/RapidTypeAnalysisAlgorithm";
import { ImportInfo, updateSdkConfigPrefix } from './core/common/ImportBuilder';
import { TypeInference } from './core/common/TypeInference';
import { VisibleValue } from './core/common/VisibleValue';
import { ArkClass } from "./core/model/ArkClass";
import { ArkFile, buildArkFileFromFile } from "./core/model/ArkFile";
import { ArkMethod } from "./core/model/ArkMethod";
import { ArkNamespace } from "./core/model/ArkNamespace";
import { ClassSignature, FileSignature, MethodSignature, NamespaceSignature } from "./core/model/ArkSignature";
import Logger from "./utils/logger";

const logger = Logger.getLogger();

/**
 * The Scene class includes everything in the analyzed project.
 * We should be able to re-generate the project's code based on this class.
 */
export class Scene {
    projectName: string = '';
    projectFiles: string[] = [];
    realProjectDir: string;

    arkFiles: ArkFile[] = [];
    //sdkArkFiles: ArkFile[] = [];
    private targetProjectArkFilesMap: Map<string, ArkFile> = new Map<string, ArkFile>();
    private sdkArkFilestMap: Map<string, ArkFile> = new Map<string, ArkFile>();

    extendedClasses: Map<string, ArkClass[]> = new Map();
    globalImportInfos: ImportInfo[] = [];

    private ohosSdkPath: string;
    private kitSdkPath: string;
    private systemSdkPath: string;

    private otherSdkMap: Map<string, string>;

    private sdkFilesProjectMap: Map<string[], string> = new Map<string[], string>();

    // values that are visible in curr scope
    private visibleValue: VisibleValue = new VisibleValue();

    constructor(sceneConfig: SceneConfig) {
        this.projectName = sceneConfig.getTargetProjectName();
        this.projectFiles = sceneConfig.getProjectFiles();
        this.realProjectDir = fs.realpathSync(sceneConfig.getTargetProjectDirectory());

        this.ohosSdkPath = sceneConfig.getOhosSdkPath();
        this.kitSdkPath = sceneConfig.getKitSdkPath();
        this.systemSdkPath = sceneConfig.getSystemSdkPath();
        this.sdkFilesProjectMap = sceneConfig.getSdkFilesMap();

        this.otherSdkMap = sceneConfig.getOtherSdkMap();

        // add sdk reative path to Import builder
        this.configImportSdkPrefix();

        this.genArkFiles();

        //post actions

        this.collectProjectImportInfos();
    }

    private configImportSdkPrefix() {
        if (this.ohosSdkPath) {
            updateSdkConfigPrefix("ohos", path.relative(this.realProjectDir, this.ohosSdkPath));
        }
        if (this.kitSdkPath) {
            updateSdkConfigPrefix("kit", path.relative(this.realProjectDir, this.kitSdkPath));
        }
        if (this.systemSdkPath) {
            updateSdkConfigPrefix("system", path.relative(this.realProjectDir, this.systemSdkPath));
        }
        if (this.otherSdkMap) {
            this.otherSdkMap.forEach((value, key) => {
                updateSdkConfigPrefix(key, path.relative(this.realProjectDir, value));
            });
        }
    }

    private genArkFiles() {
        this.sdkFilesProjectMap.forEach((value, key) => {
            if (key.length != 0) {
                const sdkProjectName = value;
                let realSdkProjectDir = "";
                if (sdkProjectName == "ohos") {
                    realSdkProjectDir = fs.realpathSync(this.ohosSdkPath);
                }
                else if (sdkProjectName == "kit") {
                    realSdkProjectDir = fs.realpathSync(this.kitSdkPath);
                }
                else if (sdkProjectName == "system") {
                    realSdkProjectDir = fs.realpathSync(this.systemSdkPath);
                }
                else {
                    let sdkPath = this.otherSdkMap.get(value);
                    if (sdkPath) {
                        realSdkProjectDir = fs.realpathSync(sdkPath);
                    }
                }

                key.forEach((file) => {
                    logger.info('=== parse file:', file);
                    let arkFile: ArkFile = new ArkFile();
                    arkFile.setProjectName(sdkProjectName);
                    buildArkFileFromFile(file, realSdkProjectDir, arkFile);
                    arkFile.setScene(this);
                    this.sdkArkFilestMap.set(arkFile.getFileSignature().toString(), arkFile);
                });
            }
        });

        this.projectFiles.forEach((file) => {
            logger.info('=== parse file:', file);
            let arkFile: ArkFile = new ArkFile();
            arkFile.setProjectName(this.projectName);
            buildArkFileFromFile(file, this.realProjectDir, arkFile);
            arkFile.setScene(this);
            this.arkFiles.push(arkFile);
            this.targetProjectArkFilesMap.set(arkFile.getFileSignature().toString(), arkFile);
        });
    }

    public getFile(fileSignature: FileSignature): ArkFile | null {
        const foundFile = this.arkFiles.find(fl => fl.getFileSignature().toString() == fileSignature.toString());
        return foundFile || null;
    }

    public getFiles() {
        return this.arkFiles;
    }

    public getTargetProjectArkFilesMap() {
        return this.targetProjectArkFilesMap;
    }

    public getSdkArkFilestMap() {
        return this.sdkArkFilestMap;
    }

    public getNamespace(namespaceSignature: NamespaceSignature | string): ArkNamespace | null {
        let returnVal: ArkNamespace | null = null;
        if (namespaceSignature instanceof NamespaceSignature) {
            let fileSig = namespaceSignature.getDeclaringFileSignature();
            this.arkFiles.forEach((fl) => {
                if (fl.getFileSignature().toString() == fileSig.toString()) {
                    returnVal = fl.getNamespaceAllTheFile(namespaceSignature);
                }
            });
        }
        else {
            this.getAllNamespacesUnderTargetProject().forEach((ns) => {
                if (ns.getNamespaceSignature().toString() == namespaceSignature) {
                    returnVal = ns;
                }
            });
        }
        return returnVal;
    }

    public getClass(classSignature: ClassSignature | string): ArkClass | null {
        let returnVal: ArkClass | null = null;
        if (classSignature instanceof ClassSignature) {
            let fileSig = classSignature.getDeclaringFileSignature();
            this.arkFiles.forEach((fl) => {
                if (fl.getFileSignature().toString() == fileSig.toString()) {
                    returnVal = fl.getClassAllTheFile(classSignature);
                }
            });
        }
        else {
            this.getAllClassesUnderTargetProject().forEach((cls) => {
                if (cls.getSignature().toString() == classSignature) {
                    returnVal = cls;
                }
            });
        }
        return returnVal;
    }

    public getMethod(methodSignature: MethodSignature | string): ArkMethod | null {
        let returnVal: ArkMethod | null = null;
        if (methodSignature instanceof MethodSignature) {
            let fileSig = methodSignature.getDeclaringClassSignature().getDeclaringFileSignature();
            this.arkFiles.forEach((fl) => {
                if (fl.getFileSignature().toString() == fileSig.toString()) {
                    returnVal = fl.getMethodAllTheFile(methodSignature);
                }
            });
        }
        else {
            this.getAllMethodsUnderTargetProject().forEach((mtd) => {
                if (mtd.getSignature().toString() == methodSignature) {
                    returnVal = mtd;
                }
            });
        }
        return returnVal;
    }

    public getAllNamespacesUnderTargetProject(): ArkNamespace[] {
        let namespaces: ArkNamespace[] = [];
        this.arkFiles.forEach((fl) => {
            namespaces.push(...fl.getAllNamespacesUnderThisFile());
        });
        return namespaces;
    }

    public getAllClassesUnderTargetProject(): ArkClass[] {
        let namespaces: ArkClass[] = [];
        this.arkFiles.forEach((fl) => {
            namespaces.push(...fl.getAllClassesUnderThisFile());
        });
        return namespaces;
    }

    public getAllMethodsUnderTargetProject(): ArkMethod[] {
        let namespaces: ArkMethod[] = [];
        this.arkFiles.forEach((fl) => {
            namespaces.push(...fl.getAllMethodsUnderThisFile());
        });
        return namespaces;
    }

    public hasMainMethod(): boolean {
        return false;
    }

    //Get the set of entry points that are used to build the call graph.
    public getEntryPoints() {
        return [];
    }

    /** get values that is visible in curr scope */
    public getVisibleValue(): VisibleValue {
        return this.visibleValue;
    }

    public makeCallGraphCHA(entryPoints: MethodSignature[]): AbstractCallGraph {
        let callGraphCHA: AbstractCallGraph
        callGraphCHA = new ClassHierarchyAnalysisAlgorithm(this);
        callGraphCHA.loadCallGraph(entryPoints)
        return callGraphCHA
    }

    public makeCallGraphRTA(entryPoints: MethodSignature[]): AbstractCallGraph {
        // WIP
        let callGraphRTA: AbstractCallGraph
        callGraphRTA = new RapidTypeAnalysisAlgorithm(this);
        callGraphRTA.loadCallGraph(entryPoints)
        return callGraphRTA
    }

    /**
     * 对每个method方法体内部进行类型推导，将变量类型填入
     */
    public inferTypes() {
        const typeInference = new TypeInference(this);
        for (let arkFile of this.arkFiles) {
            for (let arkClass of arkFile.getClasses()) {
                for (let arkMethod of arkClass.getMethods()) {
                    typeInference.inferTypeInMethod(arkMethod);
                }
            }
        }
    }

    public inferSimpleTypes() {
        const typeInference = new TypeInference(this);
        for (let arkFile of this.arkFiles) {
            for (let arkClass of arkFile.getClasses()) {
                for (let arkMethod of arkClass.getMethods()) {
                    typeInference.inferSimpleTypeInMethod(arkMethod);
                }
            }
        }
    }

    private collectProjectImportInfos() {
        this.arkFiles.forEach((arkFile) => {
            arkFile.getImportInfos().forEach((importInfo) => {
                this.globalImportInfos.push(importInfo);
            });
        });
    }
}
