import { NodeA } from "../base/Ast";
import { BodyBuilder } from "../common/BodyBuilder";
import { ArkBody } from "./ArkBody";
import { ArkClass } from "./ArkClass";
import { ArkFile } from "./ArkFile";
import { MethodSignature, MethodSubSignature } from "./ArkSignature";

export const arkMethodNodeKind = ['MethodDeclaration', 'Constructor', 'FunctionDeclaration', 'GetAccessor',
    'SetAccessor', 'ArrowFunction', 'FunctionExpression'];

export class ArkMethod {
    private name: string;
    private code: string;
    private declaringArkFile: ArkFile;
    private declaringArkClass: ArkClass;
    private returnType: string[] = [];
    private parameters: Map<string, string> = new Map();
    private modifiers: Set<string> = new Set<string>();
    private methodSignature: MethodSignature;
    private methodSubSignature: MethodSubSignature;
    private body: ArkBody;

    constructor() { }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getCode() {
        return this.code;
    }

    public setCode(code: string) {
        this.code = code;
    }

    public getDeclaringArkClass() {
        return this.declaringArkClass;
    }

    public setDeclaringArkClass(declaringArkClass: ArkClass) {
        this.declaringArkClass = declaringArkClass;
    }

    public getDeclaringArkFile() {
        return this.declaringArkFile;
    }

    public setDeclaringArkFile() {
        this.declaringArkFile = this.getDeclaringArkClass().getDeclaringArkFile();
    }

    public isExported(): boolean {
        return this.modifiers.has('ExportKeyword');
    }

    public getParameters() {
        return this.parameters;
    }

    public addParameter(parameterName: string, parameterType: string) {
        this.parameters.set(parameterName, parameterType);
    }

    public getReturnType() {
        return this.returnType;
    }

    public addReturnType(type: string) {
        this.returnType.push(type);
    }

    public getSignature() {
        return this.methodSignature;
    }

    public setSignature(methodSignature: MethodSignature) {
        this.methodSignature = methodSignature;
    }

    public getSubSignature() {
        return this.methodSubSignature;
    }

    public setSubSignature(methodSubSignature: MethodSubSignature) {
        this.methodSubSignature = methodSubSignature;
    }

    public genSignature() {
        let mtgSubSig = new MethodSubSignature();
        mtgSubSig.build(this.getName(), this.getParameters(), this.getReturnType());
        this.setSubSignature(mtgSubSig);
        let mtdSig = new MethodSignature();
        mtdSig.build(this.methodSubSignature, this.getDeclaringArkClass().getSignature());
        this.setSignature(mtdSig);
    }

    public getModifiers() {
        return this.modifiers;
    }

    public addModifier(name: string) {
        this.modifiers.add(name);
    }

    public containsModifier(name: string) {
        return this.modifiers.has(name);
    }

    public getBody() {
        return this.body;
    }

    public setBody(body: ArkBody) {
        this.body = body;
    }

    //public getCfg(): Cfg {
    //    return this.body.getCfg();
    //}

    //public getOriginalCfg() {
    //    return this.body.getOriginalCfg();
    //}

    public buildArkMethodFromAstNode(methodNode: NodeA, declaringClass: ArkClass) {
        this.setCode(methodNode.text);
        this.setDeclaringArkClass(declaringClass);
        this.setDeclaringArkFile();
        if (arkMethodNodeKind.indexOf(methodNode.kind) > -1) {
            this.buildNormalArkMethodFromAstNode(methodNode);
        }
        else {
            this.buildDefaultArkMethodFromAstNode(methodNode);
        }
        this.genSignature();

        if (methodNode.kind != "SyntaxList") {
            methodNode = methodNode.children[methodNode.children.length - 1].children[1];
        }
        let bodyBuilder = new BodyBuilder(this.methodSignature, methodNode, this);
        this.setBody(bodyBuilder.build());
    }

    private buildDefaultArkMethodFromAstNode(methodNode: NodeA) {
        this.setName("_DEFAULT_ARK_METHOD");
    }

    private buildNormalArkMethodFromAstNode(methodNode: NodeA) {
        if (!methodNode.methodNodeInfo) {
            throw new Error('Error: There is no methodNodeInfo for this method!');
        }
        this.setName(methodNode.methodNodeInfo.name);

        methodNode.methodNodeInfo.modifiers.forEach((modifier) => {
            this.addModifier(modifier);
        });

        methodNode.methodNodeInfo.parameters.forEach((value, key) => {
            this.addParameter(key, value);
        });
        methodNode.methodNodeInfo.returnType.forEach((type) => {
            this.addReturnType(type);
        });
    }
}