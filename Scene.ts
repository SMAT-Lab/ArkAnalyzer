import { ArkClass } from "./core/ArkClass";
import { ArkFile } from "./core/ArkFile";
import { ArkMethod } from "./core/ArkMethod";
import { ArkNamespace } from "./core/ArkNamespace";
import { ClassSignature, MethodSignature, MethodSubSignature } from "./core/ArkSignature";
import { CallGraph } from "./callgraph/CallGraph"

/**
 * The Scene class includes everything in the analyzed project.
 * We should be able to re-generate the project's code based on this class.
 */
export class Scene {
    projectName: string = '';
    projectFiles: string[] = [];
    namespaces: ArkNamespace[] = [];
    classes: ArkClass[] = [];
    arkFiles: ArkFile[] = [];
    callgraph!: CallGraph;
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

    public getClasses(): ArkClass[] {
        return [];
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
        return [];
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
}
