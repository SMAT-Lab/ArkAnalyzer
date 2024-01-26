import { ArkClass } from "./ArkClass";
import { ArkFile } from "./ArkFile";
import { ASTree, NodeA } from "../base/Ast";
import { ClassSignature, MethodSignature, MethodSubSignature } from "./ArkSignature";
import { ArkBody } from "./ArkBody";
import { BodyBuilder } from "../common/BodyBuilder";
import { Cfg } from "../graph/Cfg";

export class ArkMethod {
    name!: string;
    code: string;
    isExported: boolean = false;
    declaringArkFile: ArkFile;
    declaringClass: ArkClass;
    returnType: string[] = [];
    parameters: Map<string, string> = new Map();
    modifiers: Set<string> = new Set<string>();
    methodSignature!: MethodSignature;
    methodSubSignature!: MethodSubSignature;

    private body: ArkBody;

    constructor(methodNode: NodeA, declaringArkFile: ArkFile, declaringClass: ArkClass) {
        this.code = methodNode.text;
        this.declaringArkFile = declaringArkFile;
        this.declaringClass = declaringClass;
        if (methodNode.kind != 'MethodDeclaration' && methodNode.kind != 'Constructor' &&
            methodNode.kind != 'FunctionDeclaration' && methodNode.kind != 'GetAccessor' &&
            methodNode.kind != 'SetAccessor' && methodNode.kind != 'ArrowFunction' && methodNode.kind != 'FunctionExpression') {
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
        if (methodNode.kind != "SyntaxList") {
            methodNode = methodNode.children[methodNode.children.length - 1].children[1];
        }

        let bodyBuilder = new BodyBuilder(this.methodSignature, methodNode, declaringClass);
        this.body = bodyBuilder.build();
    }

    private buildDefaultArkMethod(methodNode: NodeA) {
        this.name = "_DEFAULT_ARK_METHOD";
    }

    private buildArkMethod(methodNode: NodeA) {
        if (!methodNode.methodNodeInfo) {
            throw new Error('Error: There is no methodNodeInfo for this method!');
        }
        this.name = methodNode.methodNodeInfo.name;
        this.modifiers = methodNode.methodNodeInfo.modifiers;

        //let mdfs:string[] = methodNode.methodNodeInfo.modifiers;
        if (this.modifiers.has('ExportKeyword')) {
            this.isExported = true;
        }

        this.parameters = methodNode.methodNodeInfo.parameters;
        this.returnType = methodNode.methodNodeInfo.returnType;
    }

    public getCfg(): Cfg {
        return this.body.getCfg();
    }

    public getOriginalCfg() {
        return this.body.getOriginalCfg();
    }

    public getBody(): ArkBody {
        return this.body;
    }

    public getModifier() {
        return this.modifiers;
    }

    private genSignatures() {
        this.methodSubSignature = new MethodSubSignature(this.name, this.parameters, this.returnType);
        this.methodSignature = new MethodSignature(this.methodSubSignature, this.declaringClass.classSignature);
    }
}