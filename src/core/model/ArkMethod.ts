import { NodeA } from "../base/Ast";
import { Type, UnknownType } from "../base/Type";
import { BodyBuilder } from "../common/BodyBuilder";
import { MethodParameter } from "../common/MethodInfoBuilder";
import { Cfg } from "../graph/Cfg";
import { ArkBody } from "./ArkBody";
import { ArkClass } from "./ArkClass";
import { ArkFile } from "./ArkFile";
import { MethodSignature, MethodSubSignature } from "./ArkSignature";

export const arkMethodNodeKind = ['MethodDeclaration', 'Constructor', 'FunctionDeclaration', 'GetAccessor',
    'SetAccessor', 'ArrowFunction', 'FunctionExpression'];

export class ArkMethod {
    private name: string;
    private code: string;
    private line: number = -1;
    private declaringArkFile: ArkFile;
    private declaringArkClass: ArkClass;

    private returnType: Type = UnknownType.getInstance();
    private parameters: MethodParameter[] = [];
    private modifiers: Set<string> = new Set<string>();
    private typeParameters: Type[] = [];

    private methodSignature: MethodSignature;
    private methodSubSignature: MethodSubSignature;

    private body: ArkBody;

    /* // Deprecated
    private arkSignature: string;
    private declaringSignature: string;
    private arkInstancesMap: Map<string, any> = new Map<string, any>(); */

    constructor() { }

    /* // Deprecated
    public addArkInstance(arkSignature: string, arkInstance: any) {
        this.arkInstancesMap.set(arkSignature, arkInstance);
    }

    public getArkInstancesMap() {
        return this.arkInstancesMap;
    }

    public setDeclaringSignature(declaringSignature: string) {
        this.declaringSignature = declaringSignature;
    }

    public getArkSignature() {
        return this.arkSignature;
    }

    public setArkSignature(arkSignature: string) {
        this.arkSignature = arkSignature;
    }

    public genArkSignature() {
        this.arkSignature = this.declaringSignature + '.' + this.name;
    } */

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

    public getLine() {
        return this.line;
    }

    public setLine(line: number) {
        this.line = line;
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

    public isDefaultArkMethod(): boolean {
        return this.getName() === "_DEFAULT_ARK_METHOD";
    }

    public getParameters() {
        return this.parameters;
    }

    public addParameter(methodParameter: MethodParameter) {
        this.parameters.push(methodParameter);
    }

    public getReturnType() {
        return this.returnType;
    }

    public setReturnType(type: Type) {
        this.returnType = type;
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
        let mtdSubSig = new MethodSubSignature();
        mtdSubSig.setMethodName(this.name);
        mtdSubSig.setParameters(this.parameters);
        mtdSubSig.setReturnType(this.returnType);
        this.setSubSignature(mtdSubSig);

        let mtdSig = new MethodSignature();
        mtdSig.setDeclaringClassSignature(this.declaringArkClass.getSignature());
        mtdSig.setMethodSubSignature(mtdSubSig);
        this.setSignature(mtdSig);

        /* // Deprecated
        this.genArkSignature(); */
    }

    public getModifiers() {
        return this.modifiers;
    }

    public addModifier(name: string) {
        this.modifiers.add(name);
    }

    public getTypeParameter() {
        return this.typeParameters;
    }

    public addTypeParameter(typeParameter: Type) {
        this.typeParameters.push(typeParameter);
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

    public getCfg(): Cfg {
        return this.body.getCfg();
    }

    public getOriginalCfg() {
        return this.body.getOriginalCfg();
    }
}

export function buildArkMethodFromArkClass(methodNode: NodeA, declaringClass: ArkClass, mtd: ArkMethod) {

    mtd.setDeclaringArkClass(declaringClass);
    mtd.setDeclaringArkFile();

    if (arkMethodNodeKind.indexOf(methodNode.kind) > -1) {
        buildNormalArkMethodFromAstNode(methodNode, mtd);
    }
    else {
        mtd.setName("_DEFAULT_ARK_METHOD");
    }
    mtd.genSignature();

    if (methodNode.kind != "SyntaxList") {
        methodNode = methodNode.children[methodNode.children.length - 1].children[1];
    }
    let bodyBuilder = new BodyBuilder(mtd.getSignature(), methodNode, mtd);
    mtd.setBody(bodyBuilder.build());
}

export function buildNormalArkMethodFromAstNode(methodNode: NodeA, mtd: ArkMethod) {
    mtd.setCode(methodNode.text);
    mtd.setLine(methodNode.line);

    if (!methodNode.methodNodeInfo) {
        throw new Error('Error: There is no methodNodeInfo for this method!');
    }
    mtd.setName(methodNode.methodNodeInfo.name);

    methodNode.methodNodeInfo.modifiers.forEach((modifier) => {
        mtd.addModifier(modifier);
    });
    methodNode.methodNodeInfo.parameters.forEach(methodParameter => {
        mtd.addParameter(methodParameter);
    });

    mtd.setReturnType(methodNode.methodNodeInfo.returnType);


    methodNode.methodNodeInfo.typeParameters.forEach((typeParameter) => {
        mtd.addTypeParameter(typeParameter);
    });
}