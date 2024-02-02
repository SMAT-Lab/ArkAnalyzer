import fs from 'fs';
import path from 'path';
import { AbstractCallGraphAlgorithm } from "./callgraph/AbstractCallGraphAlgorithm";
import { CallGraph } from "./callgraph/CallGraph";
import { ImportInfo, updateSdkConfigPrefix } from './core/common/ImportBuilder';
import { ArkClass } from "./core/model/ArkClass";
import { ArkFile } from "./core/model/ArkFile";
import { ArkInterface } from './core/model/ArkInterface';
import { ArkMethod } from "./core/model/ArkMethod";
import { ArkNamespace } from "./core/model/ArkNamespace";
import { ClassSignature, MethodSignature, MethodSubSignature } from "./core/model/ArkSignature";

/**
 * The Scene class includes everything in the analyzed project.
 * We should be able to re-generate the project's code based on this class.
 */
export class Scene {
    projectName: string = '';
    projectFiles: string[] = [];
    realProjectDir: string;
    namespaces: ArkNamespace[] = [];
    arkFiles: ArkFile[] = [];
    callgraph!: CallGraph;
    classHierarchyCallGraph!: AbstractCallGraphAlgorithm;
    extendedClasses: Map<string, ArkClass[]> = new Map();
    globalImportInfos: ImportInfo[] = [];

    arkInstancesMap: Map<string, any> = new Map<string, any>();
    arkFileMaps: Map<string, any> = new Map<string, any>();
    arkNamespaceMaps: Map<string, any> = new Map<string, any>();
    arkInterfaceMaps: Map<string, any> = new Map<string, any>();
    arkClassMaps: Map<string, any> = new Map<string, any>();
    arkMethodMaps: Map<string, any> = new Map<string, any>();

    sdkName: string | undefined;
    sdkFiles: string[] | undefined;
    sdk_dir: string | undefined;

    //apiArkInstancesMap: Map<string, any> | undefined;
    //globalInstancesMap: Map<string, any> = new Map<string, any>();
    constructor(projectName: string, projectFiles: string[], projectDir: string, sdkName?: string, sdkFiles?: string[], sdk_dir?: string) {
        this.projectName = projectName;
        this.projectFiles = projectFiles;
        this.sdkName = sdkName;
        this.sdkFiles = sdkFiles;
        this.sdk_dir = sdk_dir;
        this.realProjectDir = fs.realpathSync(projectDir);
        //this.apiArkInstancesMap = apiArkInstancesMap;
        this.genArkFiles();
        this.genExtendedClasses();
        this.generateGlobalImportInfos();
        this.typeReference();
    }

    private genArkFiles() {
        if (this.sdkName && this.sdkFiles && this.sdk_dir) {
            updateSdkConfigPrefix(this.sdkName, path.relative(this.realProjectDir, this.sdk_dir));
            this.sdkFiles.forEach((file) => {
                let arkFile: ArkFile = new ArkFile();
                arkFile.buildArkFileFromSourceFile(file, this.realProjectDir);
                arkFile.setScene(this);
                this.arkFiles.push(arkFile);
            });
            this.collectArkInstances(this.arkFiles);
        }

        let tmpArkFiles: ArkFile[] = [];
        this.projectFiles.forEach((file) => {
            let arkFile: ArkFile = new ArkFile();
            arkFile.buildArkFileFromSourceFile(file, this.realProjectDir);
            arkFile.setScene(this);
            this.arkFiles.push(arkFile);
            tmpArkFiles.push(arkFile);
        });
        this.collectArkInstances(tmpArkFiles);
    }

    public getFile(fileName: string): ArkFile | null {
        for (let arkFile of this.arkFiles) {
            if (arkFile.getName() == fileName) {
                return arkFile;
            }
        }
        return null;
    }

    private genExtendedClasses() {
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
    }

    public getClasses(): ArkClass[] {
        let arkClasses: ArkClass[] = [];
        for (let fl of this.arkFiles) {
            arkClasses.push(...fl.getClasses());
        }
        return arkClasses;
    }

    public getClassGlobally(arkClassType: string): ArkClass | null {
        for (let fl of this.arkFiles) {
            for (let cls of fl.getClasses()) {
                if (cls.isExported() && cls.getName() == arkClassType) {
                    return cls;
                }
            }
        }
        return null;
    }

    public getClass(arkFile: string, arkClassType: string): ArkClass | null {
        const fl = this.arkFiles.find((obj) => {
            return obj.getName() === arkFile;
        })
        if (!fl) {
            return null;
        }
        const claSig = this.getClassSignature(arkFile, arkClassType);
        return fl.getClass(claSig);
    }

    public getMethods(): ArkMethod[] {
        let arkMethods: ArkMethod[] = [];

        let arkClasses = this.getClasses();
        for (let arkClass of arkClasses) {
            let methods: ArkMethod[] = arkClass.getMethods();
            arkMethods.push(...methods);
        }

        return arkMethods;
    }

    public getFather(classSignature: ClassSignature): ArkClass | null {
        let thisArkFile = this.getFile(classSignature.getArkFile());
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
    }

    public getMethod(arkFile: string, methodName: string, parameters: Map<string, string>, returnType: string[], arkClassType: string): ArkMethod | null {
        const fl = this.arkFiles.find((obj) => {
            return obj.getName() === arkFile;
        })
        if (!fl) {
            return null;
        }
        const mtdSig = this.getMethodSignature(arkFile, methodName, parameters, returnType, arkClassType);
        return fl.getMethod(mtdSig);
    }

    public getMethodByName(methodName: string): ArkMethod[] {
        let arkMethods: ArkMethod[] = [];
        for (let method of this.getMethods()) {
            if (method.getSubSignature().getMethodName() == methodName) {
                arkMethods.push(method);
            }
        }

        return arkMethods;
    }

    public getNamespaces(): ArkNamespace[] {
        return [];
    }

    public hasMainMethod(): boolean {
        return false;
    }

    //Get the set of entry points that are used to build the call graph.
    public getEntryPoints() {
        return [];
    }

    private getMethodSignature(fileName: string, methodName: string, parameters: Map<string, string>, returnType: string[], classType: string): MethodSignature {
        let methodSubSignature = new MethodSubSignature();
        methodSubSignature.build(methodName, parameters, returnType);
        let classSignature = this.getClassSignature(fileName, classType);
        let methodSignature = new MethodSignature();
        methodSignature.build(methodSubSignature, classSignature);
        return methodSignature;
    }
    private getClassSignature(arkFile: string, classType: string): ClassSignature {
        let classSig = new ClassSignature();
        classSig.build(arkFile, classType);
        return classSig;
    }

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
    private typeReference() {
        for (let arkFile of this.arkFiles) {
            for (let arkClass of arkFile.getClasses()) {
                for (let arkMethod of arkClass.getMethods()) {
                    // console.log(arkMethod.getArkSignature())
                    arkMethod.getBody().getCfg().typeReference()
                    // console.log(arkMethod.getBody().getLocals())
                }
            }
        }
    }


    private generateGlobalImportInfos() {
        this.arkFiles.forEach((arkFile) => {
            arkFile.getImportInfos().forEach((importInfo) => {
                this.globalImportInfos.push(importInfo);
            });
        });
    }

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
    }

    private collectArkInstances(arkFiles: ArkFile[]) {
        arkFiles.forEach((arkFile) => {
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
    }

    public getArkInstancesMap() {
        return this.arkInstancesMap;
    }
}
