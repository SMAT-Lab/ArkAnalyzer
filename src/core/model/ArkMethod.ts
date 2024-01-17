import { ArkClass } from "./ArkClass";
import { ArkFile } from "./ArkFile";
import { ASTree, NodeA } from "../base/Ast";
import { Cfg } from "../Cfg";
import { ClassSignature, MethodSignature, MethodSubSignature } from "./ArkSignature";

export class ArkMethod {
    name!: string;
    code: string;
    isExported: boolean = false;
    declaringArkFile: ArkFile;
    declaringClass: ArkClass;
    returnType: string[] = [];
    parameterTypes: string[] = [];
    originalCfg!: Cfg;
    cfg: Cfg;
    modifiers: string[] = [];
    methodSignature!: MethodSignature;
    methodSubSignature!: MethodSubSignature;

    constructor(methodNode: NodeA, declaringArkFile: ArkFile, declaringClass: ArkClass) {
        this.code = methodNode.text;
        this.declaringArkFile = declaringArkFile;
        this.declaringClass = declaringClass;
        if (methodNode.kind != 'MethodDeclaration' && methodNode.kind != 'Constructor' && methodNode.kind != 'FunctionDeclaration') {
            this.buildDefaultArkMethod(methodNode);
        }
        else {
            this.buildArkMethod(methodNode);
        }
        this.genSignatures();
        // try{
        //     this.cfg = new CFG(methodNode, this.name, this.declaringClass);

        // }catch(error){
        //     console.log(declaringArkFile.name+"."+declaringClass.name+"."+this.name);
        //     console.log(error)
        // }
        if(methodNode.kind!="SyntaxList"){
            methodNode=methodNode.children[methodNode.children.length-1].children[1];
        }
        this.cfg = new Cfg(methodNode, this.name, this.declaringClass);
    }

    private buildDefaultArkMethod(methodNode: NodeA) {
        this.name = "_DEFAULT_ARK_METHOD";
    }

    private buildArkMethod(methodNode: NodeA) {
        this.name = methodNode.functionHeadInfo.name;
        this.modifiers = methodNode.functionHeadInfo.modifiers;
        
        //let mdfs:string[] = methodNode.functionHeadInfo.modifiers;
        if (this.modifiers.find(element => element === 'ExportKeyword')) {
            this.isExported = true;
        }

        this.parameterTypes = methodNode.functionHeadInfo.parameterTypes;
        this.returnType = methodNode.functionHeadInfo.returnType;
    }

    public getCfg() {
        return this.cfg;
    }

    public getModifier() {
        return this.modifiers;
    }

    private genSignatures() {
        this.methodSubSignature = new MethodSubSignature(this.name, this.parameterTypes, this.returnType);
        this.methodSignature = new MethodSignature(this.methodSubSignature, this.declaringClass.classSignature);
    }
}