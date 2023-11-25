import { ArkClass } from "./ArkClass";
import { ArkFile } from "./ArkFile";
import { ASTree, NodeA } from "./base/Ast";
import { CFG } from "./base/Cfg";
import { MethodSignature, MethodSubSignature } from "./ArkSignature";

export class ArkMethod {
    name: string;
    code: string;
    isExported: boolean = false;
    declaringArkFile: ArkFile;
    declaringClass: ArkClass | undefined;
    returnType: any;
    parameterTypes: any[] = [];
    implementedInterfaces: ArkClass[] = [];
    cfg: CFG | null = null;
    modifier: string;
    methodSignature: MethodSignature;
    methodSubSignature: MethodSubSignature;

    constructor(methodName: string, methodNode: NodeA, declaringArkFile: ArkFile, declaringClass?: ArkClass | undefined) {
        this.name = methodName;
        this.code = methodNode.text;
        this.declaringArkFile = declaringArkFile;

        this.declaringClass = declaringClass;
        this.buildArkMethod(methodNode);
    }

    private buildArkMethod(methodNode: NodeA) {
        // TODO: check
        if ('ExportDeclaration') {
            this.isExported = true;
        }
        this.cfg = new CFG(methodNode, this.name);
        this.genSignatures();
    }

    public getCFG() {
        return this.cfg;
    }

    public getModifier() {
        return this.modifier;
    }

    private genSignatures() {
        this.methodSubSignature = new MethodSubSignature(this.name, this.parameterTypes, this.returnType);
        this.methodSignature = new MethodSignature(this.declaringArkFile, this.methodSubSignature, this.declaringClass);
    }
}