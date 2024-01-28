import fs from 'fs';
import { ArkClass } from "./core/model/ArkClass";
import { ArkFile } from "./core/model/ArkFile";
import { ArkMethod } from "./core/model/ArkMethod";
import { ArkNamespace } from "./core/model/ArkNamespace";
import { ClassSignature, MethodSignature, MethodSubSignature } from "./core/model/ArkSignature";
import { CallGraph } from "./callgraph/CallGraph"
import {ClassHierarchyAnalysis} from "./callgraph/ClassHierarchyAnalysis";
import {ClassHierarchyAnalysisAlgorithm} from "./callgraph/ClassHierarchyAnalysisAlgorithm";
import {AbstractCallGraphAlgorithm} from "./callgraph/AbstractCallGraphAlgorithm";
import { ImportInfo } from './core/common/ImportBuilder';

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
    constructor(name: string, files: string[], projectDir: string) {
        this.projectName = name;
        this.projectFiles = files;
        this.realProjectDir = fs.realpathSync(projectDir);
        this.genArkFiles();
        this.genExtendedClasses();
        this.typeReference();
    }

    private genArkFiles() {
        for (let file of this.projectFiles) {
            let arkFile: ArkFile = new ArkFile();
            arkFile.buildArkFileFromSourceFile(file, this.realProjectDir);
            arkFile.setScene(this);
            this.arkFiles.push(arkFile);
        }
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

    public makeCallGraphCHA(entryPoints: MethodSignature[]) {
        this.classHierarchyCallGraph = new ClassHierarchyAnalysisAlgorithm(this);
        this.classHierarchyCallGraph.loadCallGraph([this.arkFiles[2].getDefaultClass().getMethods()[0].getSignature()])
        this.classHierarchyCallGraph.printDetails()
    }

    /**
     * 对每个method方法体内部进行类型推导，将变量类型填入
     * @private
     */
    private typeReference() {
        for (let arkFile of this.arkFiles) {
            for (let arkClass of arkFile.getClasses()) {
                for (let arkMethod of arkClass.getMethods()) {
                    arkMethod.getBody().getCfg().typeReference()
                }
            }
        }
    }
}
