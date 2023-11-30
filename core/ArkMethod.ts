import { ArkClass } from "./ArkClass";
import { ArkFile } from "./ArkFile";
import { ASTree, NodeA } from "./base/Ast";
import { CFG } from "./base/Cfg";
import { MethodSignature, MethodSubSignature } from "./ArkSignature";
import { ExportDeclaration } from "ts-morph";

export class ArkMethod {
    name: string;
    code: string;
    isExported: boolean = false;
    declaringArkFile: ArkFile;
    declaringClass: ArkClass | undefined;
    returnType: any;
    parameterTypes: any[] = [];
    //implementedInterfaces: ArkClass[] = [];
    cfg: CFG | null = null;
    modifier: string;
    methodSignature: MethodSignature;
    methodSubSignature: MethodSubSignature;

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