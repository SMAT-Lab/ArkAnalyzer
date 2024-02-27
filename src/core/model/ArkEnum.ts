import { NodeA } from "../base/Ast";

import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod} from "./ArkMethod";
import { ArkNamespace } from "./ArkNamespace";
import { MethodSubSignature, methodSubSignatureCompare } from "./ArkSignature";

export class ArkEnum {
    private name: string;
    private code: string;
    private declaringArkFile: ArkFile;
    private declaringArkNamespace: ArkNamespace;
    //private fields: ArkField[] = [];

    private methods: ArkMethod[] = [];
    private modifiers: Set<string> = new Set<string>();
    private members: ArkField[] = [];

    private arkSignature: string;
    private declaringInstance: ArkFile | ArkNamespace;
    private declaringType: string;
    private declaringSignature: string;
    private arkInstancesMap: Map<string, any> = new Map<string, any>();

    constructor() { }

    public buildFromArkFile(enumNode: NodeA, declaringArkFile: ArkFile) {
        this.setDeclaringArkFile(declaringArkFile);
        this.setDeclaringInstance(declaringArkFile);
        this.setDeclaringType("ArkFile");
        this.setCode(enumNode.text);
        this.buildArkEnumFromAstNode(enumNode);
    }

    public buildFromArkNamespace(enumNode: NodeA, declaringNamespace: ArkNamespace) {
        this.setDeclaringArkNamespace(declaringNamespace);
        this.setDeclaringInstance(declaringNamespace);
        this.setDeclaringType("ArkNamespace");
        this.setCode(enumNode.text);
        this.buildArkEnumFromAstNode(enumNode);
    }

    private buildArkEnumFromAstNode(enumNode: NodeA) {
        if (!enumNode.classNodeInfo) {
            throw new Error('Error: There is no enumNodeInfo for this enum struct!');
        }
        this.setName(enumNode.classNodeInfo.getClassName());
        this.genArkSignature();

        enumNode.classNodeInfo.getmodifiers().forEach((modifier) => {
            this.addModifier(modifier);
        });

        enumNode.classNodeInfo.getMembers().forEach((member) => {
            this.addMember(member);
        });
    }

    public getMembers() {
        return this.members;
    }

    public addMember(member: ArkField) {
        this.members.push(member);
    }

    public addArkInstance(arkSignature: string, arkInstance: any) {
        this.arkInstancesMap.set(arkSignature, arkInstance);
    }

    public getArkInstancesMap() {
        return this.arkInstancesMap;
    }

    public setDeclaringType(declaringType: string) {
        this.declaringType = declaringType;
    }

    public getDeclaringType() {
        return this.declaringType;
    }

    public getDeclaringInstance() {
        return this.declaringInstance;
    }

    public setDeclaringInstance(declaringInstance: ArkFile | ArkNamespace) {
        this.declaringInstance = declaringInstance;
    }

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

    public getDeclaringArkFile() {
        return this.declaringArkFile;
    }

    public setDeclaringArkFile(declaringArkFile: ArkFile) {
        this.declaringArkFile = declaringArkFile;
    }

    public getDeclaringArkNamespace() {
        return this.declaringArkNamespace;
    }

    public setDeclaringArkNamespace(declaringArkNamespace: ArkNamespace) {
        this.declaringArkNamespace = declaringArkNamespace;
    }

    public isExported(): boolean {
        return this.modifiers.has('ExportKeyword');
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
    }

    public getFields() {
        //return this.fields;
    }

    public addField(field: ArkField) {
        //this.fields.push(field);
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

    public getMethods() {
        return this.methods;
    }

    public getMethod(methodSubSignature: MethodSubSignature): ArkMethod | null {
        for (let mthd of this.methods) {
            if (methodSubSignatureCompare(mthd.getSubSignature(), methodSubSignature)) {
                return mthd;
            }
        }
        return null;
    }

    public addMethod(method: ArkMethod) {
        this.methods.push(method);
    }
}
console.log();