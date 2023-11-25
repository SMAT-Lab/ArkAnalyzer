import { ArkClass } from "./core/ArkClass";
import { ArkFile } from "./core/ArkFile";
import { ArkMethod } from "./core/ArkMethod";
import { ArkNamespace } from "./core/ArkNamespace";
import { ClassSignature, MethodSignature, MethodSubSignature } from "./core/ArkSignature";

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
    constructor(name: string, files: string[]) {
        this.projectName = name;
        this.projectFiles = files;
        this.genArkFiles();
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

    public getClass(classSignature:ClassSignature):ArkClass | null {
        return null;
    }

    public getMethods(): ArkMethod[] {
        return [];
    }

    public getMethod(methodSignature:MethodSignature): ArkMethod | null {
        for (let fl of this.arkFiles) {
            if (fl.name == methodSignature.arkFile.name) {
                return fl.getMethod(methodSignature);
            }
        }
        return null;
    }

    public getNamespaces(): ArkNamespace[] {
        return [];
    }

    public hasMainMethod(): boolean {
        return false;
    }

    public genCallGraph() {
        //
    }

    //Get the set of entry points that are used to build the call graph.
    public getEntryPoints() {
        return [];
    }

    public getMethodSignature(fileName: ArkFile, methodName: string, parameters: any[], returnType: any, classType?: ArkClass): MethodSignature {
        let methodSubSignature = new MethodSubSignature(methodName, parameters, returnType);
        return new MethodSignature(fileName, methodSubSignature, classType);
    }
}