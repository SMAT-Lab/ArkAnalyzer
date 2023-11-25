import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod } from "./ArkMethod";
import { ArkNamespace } from "./ArkNamespace";
import { NodeA } from "./base/Ast";
import { MethodSubSignature, ClassSignature } from "./ArkSignature";


export class ArkClass {
    name: string;
    code: string | null;
    declaringArkFile: ArkFile;
    classSignature: ClassSignature;
    isExported: boolean = false;
    superClass: ArkClass | null;
    implementedInterfaces: ArkClass[] = [];//TODO: check
    fields: ArkField[] = [];
    methods: ArkMethod[] = [];

    constructor(name: string, clsNode: NodeA, arkFile:ArkFile) {
        this.name = name;
        this.code = clsNode.text;
        this.superClass = null;
        this.declaringArkFile = arkFile;
        this.buildArkClass(clsNode);
    }

    private buildArkClass(nsNode: NodeA) {
        this.classSignature = new ClassSignature(this.declaringArkFile, this.name);

        for (let child of nsNode.children) {
            if (child.kind == 'FunctionDeclaration') {
                let name: string = 'mthdName';
                let mthd: ArkMethod = new ArkMethod(name, child, this.declaringArkFile, this);
                this.methods.push(mthd);
            }
        }
    }

    //TODO
    public getMethod(methodSubSignature: MethodSubSignature): ArkMethod | null {
        for (let mthd of this.methods) {
            if (mthd.methodSubSignature == methodSubSignature) {
                return mthd;
            }
        }
        return null;
    }

    public getMethods(): ArkMethod[] {
        return this.methods;
    }
}