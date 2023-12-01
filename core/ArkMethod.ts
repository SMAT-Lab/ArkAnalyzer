import { ArkClass } from "./ArkClass";
import { ArkFile } from "./ArkFile";
import { ASTree, NodeA } from "./base/Ast";
import { CFG } from "./base/Cfg";
import { MethodSignature, MethodSubSignature } from "./ArkSignature";

export class ArkMethod {
    name: string | undefined;
    code: string;
    isExported: boolean = false;
    declaringArkFile: ArkFile;
    declaringClass: ArkClass | undefined;
    returnType: string | undefined;
    parameterTypes: string[] = [];
    //implementedInterfaces: ArkClass[] = [];
    cfg: CFG | null = null;
    modifier: string | undefined;
    methodSignature: MethodSignature | undefined;
    methodSubSignature: MethodSubSignature | undefined;

    constructor(methodNode: NodeA, declaringArkFile: ArkFile, declaringClass?: ArkClass | undefined) {
        this.code = methodNode.text;
        this.declaringArkFile = declaringArkFile;

        this.declaringClass = declaringClass;
        this.buildArkMethod(methodNode);
    }

    private buildArkMethod(methodNode: NodeA) {
        this.name = methodNode.functionHeadInfo.name;
        
        if (methodNode.modifiers.indexOf('ExportKeyWord')) {
            this.isExported = true;
        }

        this.parameterTypes = methodNode.functionHeadInfo.parameterTypes;
        this.returnType = methodNode.functionHeadInfo.returnType;

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