import { ArkClass } from "./core/ArkClass";
import { ArkFile } from "./core/ArkFile";
import { ArkMethod } from "./core/ArkMethod";
import { ArkNamespace } from "./core/ArkNamespace";
import { ClassSignature, MethodSignature, MethodSubSignature } from "./core/ArkSignature";
import { CallGraph } from "./callgraph/CallGraph"
import {ClassHierarchyAnalysis} from "./callgraph/ClassHierarchyAnalysis";

/**
 * The Scene class includes everything in the analyzed project.
 * We should be able to re-generate the project's code based on this class.
 */
export class Scene {
    projectName: string = '';
    projectFiles: string[] = [];
    namespaces: ArkNamespace[] = [];
    //allClasses: Map<ArkFile, ArkClass> = new Map([]);
    arkFiles: ArkFile[] = [];
    callgraph!: CallGraph;
    classHierarchyCallGraph!: ClassHierarchyAnalysis;
    constructor(name: string, files: string[]) {
        this.projectName = name;
        this.projectFiles = files;
        this.genArkFiles();
        this.makeCallGraph();
    }

    private genArkFiles() {
        for (let file of this.projectFiles) {
            let arkFile: ArkFile = new ArkFile(file);
            this.arkFiles.push(arkFile);
        }
    }

    // Returns a chain of the application classes in this scene.
    public getApplicationClasses(): ArkClass[] {
        return [];
    }
    public getFile(fileName: string): ArkFile | null {
        for (let arkFile of this.arkFiles) {
            if (arkFile.name == fileName) {
                return arkFile;
            }
        }
        return null;
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
            for (let cls of fl.classes) {
                if (cls.isExported && cls.name == arkClassType) {
                    return cls;
                }
            }
        }
        return null;
    }

    public getClass(arkFile: string, arkClassType: string): ArkClass | null {
        const fl = this.arkFiles.find((obj) => {
            return obj.name === arkFile;
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
        let thisArkFile = this.getFile(classSignature.arkFile);
        if (thisArkFile == null) {
            throw new Error('No ArkFile found.');
        }
        let thisArkClass = thisArkFile.getClass(classSignature);
        if (thisArkClass == null) {
            throw new Error('No ArkClass found.');
        }
        let fatherName = thisArkClass?.superClassName;
        if (!fatherName) {
            return null;
        }
        // get father locally
        for (let cls of thisArkFile.getClasses()) {
            if (cls.name == fatherName) {
                return cls;
            }
        }
        // get father globally
        return this.getClassGlobally(fatherName);
    }

    public getMethod(arkFile: string, methodName: string, parameters: string[], returnType: string[], arkClassType?: string): ArkMethod | null {
        const fl = this.arkFiles.find((obj) => {
            return obj.name === arkFile;
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
            if (method.methodSubSignature.methodName == methodName) {
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

    private getMethodSignature(fileName: string, methodName: string, parameters: string[], returnType: string[], classType?: string): MethodSignature {
        let methodSubSignature = new MethodSubSignature(methodName, parameters, returnType);
        let classSignature = classType ? this.getClassSignature(fileName, classType) : this.getClassSignature(fileName, undefined);
        return new MethodSignature(methodSubSignature, classSignature);
    }
    private getClassSignature(arkFile: string, classType: string | undefined): ClassSignature {
        return new ClassSignature(arkFile, classType);
    }

    public makeCallGraph(): void {
        this.callgraph = new CallGraph(new Set<string>, new Map<string, string[]>);
        this.callgraph.processFiles(this.projectFiles);
    }

    public makeCallGraphCHA() {
        this.classHierarchyCallGraph = new ClassHierarchyAnalysis(new Set<string>, new Map<string, string[]>);
        this.classHierarchyCallGraph.processFiles(this.arkFiles);
    }
}
