import fs from 'fs';
import { ArkClass } from "./core/model/ArkClass";
import { ArkFile } from "./core/model/ArkFile";
import { ArkMethod } from "./core/model/ArkMethod";
import { ArkNamespace } from "./core/model/ArkNamespace";
import { ClassSignature, MethodSignature, MethodSubSignature } from "./core/model/ArkSignature";
import { CallGraph } from "./callgraph/CallGraph"
import {ClassHierarchyAnalysis} from "./callgraph/ClassHierarchyAnalysis";

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
    classHierarchyCallGraph!: ClassHierarchyAnalysis;
    extendedClasses: Map<string, ArkClass[]> = new Map();
    constructor(name: string, files: string[], projectDir: string) {
        this.projectName = name;
        this.projectFiles = files;
        this.realProjectDir = fs.realpathSync(projectDir);
        this.genArkFiles();
        this.makeCallGraph();
        this.genExtendedClasses();
    }

    private genArkFiles() {
        for (let file of this.projectFiles) {
            let arkFile: ArkFile = new ArkFile(file, this.realProjectDir);
            this.arkFiles.push(arkFile);
        }
    }

    public getFile(fileName: string): ArkFile | null {
        for (let arkFile of this.arkFiles) {
            if (arkFile.name == fileName) {
                return arkFile;
            }
        }
        return null;
    }

    private genExtendedClasses() {
        let myArkClasses = this.getClasses();
        for (let cls of myArkClasses) {
            let clsFather = this.getFather(cls.classSignature);
            if (clsFather) {
                let sig = clsFather.classSignature.toString();
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

    public getMethod(arkFile: string, methodName: string, parameters: Map<string, string>, returnType: string[], arkClassType?: string): ArkMethod | null {
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

    private getMethodSignature(fileName: string, methodName: string, parameters: Map<string, string>, returnType: string[], classType?: string): MethodSignature {
        let methodSubSignature = new MethodSubSignature(methodName, parameters, returnType);
        let classSignature = this.getClassSignature(fileName, classType);
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
