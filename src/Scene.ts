import fs from 'fs';
import path from 'path';

import { SceneConfig } from '../tests/Config';
import { AbstractCallGraphAlgorithm } from "./callgraph/AbstractCallGraphAlgorithm";
import { CallGraph } from "./callgraph/CallGraph";
import { Type } from './core/base/Type';
import { ImportInfo, updateSdkConfigPrefix } from './core/common/ImportBuilder';
import { MethodParameter } from './core/common/MethodInfoBuilder';
import { TypeInference } from './core/common/TypeInference';
import { ArkClass } from "./core/model/ArkClass";
import { ArkFile, buildArkFileFromFile } from "./core/model/ArkFile";
import { ArkMethod } from "./core/model/ArkMethod";
import { ArkNamespace } from "./core/model/ArkNamespace";
import { ClassSignature, FileSignature, MethodSignature, MethodSubSignature, NamespaceSignature } from "./core/model/ArkSignature";

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

    callgraph: CallGraph;
    classHierarchyCallGraph: AbstractCallGraphAlgorithm;
    extendedClasses: Map<string, ArkClass[]> = new Map();
    globalImportInfos: ImportInfo[] = [];

    /* // Deprecated
    arkInstancesMap: Map<string, any> = new Map<string, any>();

    arkFileMaps: Map<string, any> = new Map<string, any>();
    arkNamespaceMaps: Map<string, any> = new Map<string, any>();
    arkInterfaceMaps: Map<string, any> = new Map<string, any>();
    arkClassMaps: Map<string, any> = new Map<string, any>();
    arkMethodMaps: Map<string, any> = new Map<string, any>(); */

    private ohosSdkPath: string;
    private kitSdkPath: string;
    private systemSdkPath: string;

    private otherSdkMap: Map<string, string>;

    //private sdkFiles: string[];
    private sdkFilesProjectMap: Map<string[], string> = new Map<string[], string>();

    constructor(sceneConfig: SceneConfig) {
        this.projectName = sceneConfig.getTargetProjectName();
        this.projectFiles = sceneConfig.getProjectFiles();
        this.realProjectDir = fs.realpathSync(sceneConfig.getTargetProjectDirectory());

        this.ohosSdkPath = sceneConfig.getOhosSdkPath();
        this.kitSdkPath = sceneConfig.getKitSdkPath();
        this.systemSdkPath = sceneConfig.getSystemSdkPath();
        //this.sdkFiles = sceneConfig.getSdkFiles();
        this.sdkFilesProjectMap = sceneConfig.getSdkFilesMap();

        this.otherSdkMap = sceneConfig.getOtherSdkMap();

        // add sdk reative path to Import builder
        this.configImportSdkPrefix();

        this.genArkFiles();

        //post actions

        /* // Deprecated
        this.collectArkInstances(); */

        //this.genExtendedClasses();
        this.collectProjectImportInfos();
        //this.inferTypes();
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
                    console.log('=== parse file:', file);
                    let arkFile: ArkFile = new ArkFile();
                    arkFile.setProjectName(sdkProjectName);
                    buildArkFileFromFile(file, realSdkProjectDir, arkFile);
                    arkFile.setScene(this);
                    //this.sdkArkFiles.push(arkFile);
                    this.sdkArkFilestMap.set(arkFile.getFileSignature().toString(), arkFile);
                });
            }
        });

        this.projectFiles.forEach((file) => {
            console.log('=== parse file:', file);
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

    //TODO: move to type inference
    /* private genExtendedClasses() {
        let myArkClasses = this.getClasses();
        for (let cls of myArkClasses) {
            let clsFather = this.getFather(cls.getSignature());
            if (clsFather) {
                let sig = clsFather.getSignature().toString();
                if (this.extendedClasses.has(sig)) {
                    this.extendedClasses.get(sig)!.push(cls);
                }
                else {
                    this.extendedClasses.set(sig, [cls]);
                }
            }
        }
    } */

    public getFiles() {
        return this.arkFiles;
    }

    public getTargetProjectArkFilesMap() {
        return this.targetProjectArkFilesMap;
    }

    public getSdkArkFilestMap() {
        return this.sdkArkFilestMap;
    }

    /* public getNamespaces(): ArkNamespace[] {
        let arkNamespaces: ArkNamespace[] = [];
        this.arkFiles.forEach((fl) => {
            arkNamespaces.push(...fl.getNamespaces());
        });
        return arkNamespaces;
    } */

    /* public getClasses(): ArkClass[] {
        let arkClasses: ArkClass[] = [];
        for (let fl of this.arkFiles) {
            arkClasses.push(...fl.getClasses());
        }
        return arkClasses;
    } */

    /* public getMethods(): ArkMethod[] {
        let arkMethods: ArkMethod[] = [];

        let arkClasses = this.getClasses();
        for (let arkClass of arkClasses) {
            let methods: ArkMethod[] = arkClass.getMethods();
            arkMethods.push(...methods);
        }

        return arkMethods;
    } */

    //TODO: move to type inference
    /* public getClassGlobally(arkClassName: string): ArkClass | null {
        for (let fl of this.arkFiles) {
            for (let cls of fl.getClasses()) {
                if (cls.isExported() && cls.getName() == arkClassName) {
                    return cls;
                }
            }
        }
        return null;
    } */

    /* public getClass(arkFile: string, arkClassType: string): ArkClass | null {
        const fl = this.arkFiles.find((obj) => {
            return obj.getName() === arkFile;
        })
        if (!fl) {
            return null;
        }
        const claSig = this.getClassSignature(arkFile, arkClassType);
        return fl.getClass(claSig);
    } */

    /* public getFather(classSignature: ClassSignature): ArkClass | null {
        let thisArkFile = this.getFile(classSignature.getDeclaringFileSignature().getFileName());
        if (thisArkFile == null) {
            throw new Error('No ArkFile found.');
        }
        let thisArkClass = thisArkFile.getClass(classSignature);
        if (thisArkClass == null) {
            throw new Error('No ArkClass found.');
        }
        let fatherName = thisArkClass?.getSuperClassName();
        if (!fatherName) {
            return null;
        }
        // get father locally
        for (let cls of thisArkFile.getClasses()) {
            if (cls.getName() == fatherName) {
                return cls;
            }
        }
        // get father globally
        return this.getClassGlobally(fatherName);
    } */

    /* public getMethod(arkFile: string, methodName: string, parameters: MethodParameter[], returnType: Type, arkClassType: string): ArkMethod | null {
        const fl = this.arkFiles.find((obj) => {
            return obj.getName() === arkFile;
        })
        if (!fl) {
            return null;
        }
        const mtdSig = this.getMethodSignature(arkFile, methodName, parameters, returnType, arkClassType);
        return fl.getMethod(mtdSig);
    } */

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

    /* public getMethodByName(methodName: string): ArkMethod[] {
        let arkMethods: ArkMethod[] = [];
        for (let method of this.getMethods()) {
            if (method.getSubSignature().getMethodName() == methodName) {
                arkMethods.push(method);
            }
        }

        return arkMethods;
    } */

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

    /* private getMethodSignature(fileName: string, methodName: string, parameters: MethodParameter[], returnType: Type, className: string): MethodSignature {
        let methodSubSignature = new MethodSubSignature();
        methodSubSignature.setMethodName(methodName);
        methodSubSignature.setParameters(parameters);
        methodSubSignature.setReturnType(returnType);

        let classSignature = this.getClassSignature(fileName, className);

        let methodSignature = new MethodSignature();
        methodSignature.setDeclaringClassSignature(classSignature);
        methodSignature.setMethodSubSignature(methodSubSignature)

        return methodSignature;
    } */

    /* private getClassSignature(fileName: string, className: string): ClassSignature {
        let classSig = new ClassSignature();
        let fileSig = new FileSignature();
        fileSig.setFileName(fileName);
        fileSig.setProjectName(this.projectName);
        classSig.setClassName(className);
        classSig.setDeclaringFileSignature(fileSig);
        return classSig;
    } */

    public makeCallGraph(): void {
        this.callgraph = new CallGraph(new Set<string>, new Map<string, string[]>);
        this.callgraph.processFiles(this.projectFiles);
    }


    // public makeCallGraphCHA(entryPoints: MethodSignature[]) {
    //     this.classHierarchyCallGraph = new ClassHierarchyAnalysisAlgorithm(this);
    //     this.classHierarchyCallGraph.loadCallGraph(entryPoints)
    //     // this.classHierarchyCallGraph.printDetails()
    // }

    /**
     * 对每个method方法体内部进行类型推导，将变量类型填入
     * @private
     */
    private inferTypes() {
        const typeInference = new TypeInference(this);
        for (let arkFile of this.arkFiles) {
            // console.log('=== file:', arkFile.getFilePath());
            for (let arkClass of arkFile.getClasses()) {
                // console.log('== class:', arkClass.getName());
                for (let arkMethod of arkClass.getMethods()) {
                    // console.log('= method:', arkMethod.getName());
                    typeInference.inferTypeInMethod(arkMethod);
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

    /* // Deprecated
    public addArkInstance(arkSignature: string, arkInstance: any) {
        this.arkInstancesMap.set(arkSignature, arkInstance);
    }

    public addArkInstance2FileMap(arkSignature: string, arkInstance: any) {
        this.arkFileMaps.set(arkSignature, arkInstance);
    }

    public addArkInstance2NamespaceMap(arkSignature: string, arkInstance: any) {
        this.arkNamespaceMaps.set(arkSignature, arkInstance);
    }

    public addArkInstance2ClassMap(arkSignature: string, arkInstance: any) {
        this.arkClassMaps.set(arkSignature, arkInstance);
    }

    public addArkInstance2InterfaceMap(arkSignature: string, arkInstance: any) {
        this.arkInterfaceMaps.set(arkSignature, arkInstance);
    }

    public addArkInstance2MethodMap(arkSignature: string, arkInstance: any) {
        this.arkMethodMaps.set(arkSignature, arkInstance);
    } */

    /* // Deprecated
    private collectArkInstances() {
        this.arkFiles.forEach((arkFile) => {
            this.addArkInstance(arkFile.getArkSignature(), arkFile);
            this.addArkInstance2FileMap(arkFile.getArkSignature(), arkFile);
            arkFile.getArkInstancesMap().forEach((value, key) => {
                this.addArkInstance(key, value);
                if (value instanceof ArkNamespace) {
                    this.addArkInstance2NamespaceMap(key, value);
                }
                else if (value instanceof ArkInterface) {
                    this.addArkInstance2InterfaceMap(key, value);
                }
                else if (value instanceof ArkClass) {
                    this.addArkInstance2ClassMap(key, value);
                }
                else if (value instanceof ArkMethod) {
                    this.addArkInstance2MethodMap(key, value);
                }
            });
        });
    } */

    /* // Deprecated
    public getArkInstancesMap() {
        return this.arkInstancesMap;
    } */
}
