import { NodeA } from "../base/Ast";
import { Property } from "../common/ClassInfoBuilder";
import { InterfaceMember, InterfaceProperty } from "../common/InterfaceInfoBuilder";
import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod, arkMethodNodeKind } from "./ArkMethod";
import { ArkNamespace } from "./ArkNamespace";
import { ClassSignature, InterfaceSignature, MethodSubSignature, methodSubSignatureCompare } from "./ArkSignature";

export class ArkInterface {
    private name: string;
    private code: string;
    private line: number = -1;
    private declaringArkFile: ArkFile;
    private declaringArkNamespace: ArkNamespace;
    private extendsNames: string[] = [];
    private fields: ArkField[] = [];
    //private properties: Property[] = [];
    private methods: ArkMethod[] = [];
    private modifiers: Set<string> = new Set<string>();
    private members: InterfaceMember[] = [];
    private declaringInstance: ArkFile | ArkNamespace;
    private declaringType: string;
    private arkSignature: string;
    private declaringSignature: string;
    private arkInstancesMap: Map<string, any> = new Map<string, any>();

    constructor() { }

    public build(interfaceNode: NodeA, declaringInstance: ArkFile | ArkNamespace) {
        this.setDeclaringInstance(declaringInstance);
        if (declaringInstance instanceof ArkFile) {
            this.setDeclaringType("ArkFile");
        }
        else {
            this.setDeclaringType("ArkNamespace");
        }
        this.setCode(interfaceNode.text);
        this.setLine(interfaceNode.line);
        this.buildArkInterfaceFromAstNode(interfaceNode);
    }

    private buildArkInterfaceFromAstNode(interfaceNode: NodeA) {
        if (!interfaceNode.interfaceNodeInfo) {
            throw new Error('Error: There is no interfaceNodeInfo for this interface!');
        }
        this.setName(interfaceNode.interfaceNodeInfo.interfaceName);
        this.genArkSignature();

        interfaceNode.interfaceNodeInfo.modifiers.forEach((modifier) => {
            this.addModifier(modifier);
        });

        for (let [key, value] of interfaceNode.interfaceNodeInfo.heritageClauses) {
            if (value == 'ExtendsKeyword') {
                this.addExtendsName(key);
            }
        }

        interfaceNode.interfaceNodeInfo.members.forEach((member) => {
            this.addMember(member);
            if (member instanceof ArkMethod) {
                let methodMember = (member as ArkMethod);
                methodMember.setDeclaringSignature(this.arkSignature);
                methodMember.setDeclaringArkClass(this.declaringArkFile.getDefaultClass());
                methodMember.genSignature();
                this.addArkInstance(methodMember.getArkSignature(), member);
                methodMember.getArkInstancesMap().forEach((value, key) => {
                    this.addArkInstance(key, value);
                });
            }
            if (member instanceof InterfaceProperty) {
                let memberInterfaceProperty = (member as InterfaceProperty);
                let field = new ArkField();
                field.buildFromArkInteraface(this, memberInterfaceProperty);
                this.addField(field);
                this.addArkInstance(field.getArkSignature(), field);
            }
        });
    }

    public getMembers() {
        return this.members;
    }

    public addMember(member: InterfaceMember) {
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

    public getLine() {
        return this.line;
    }

    public setLine(line: number) {
        this.line = line;
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

    public getExtendsNames() {
        return this.extendsNames;
    }

    public setExtendsNames(extendsNames: string[]) {
        this.extendsNames = extendsNames;
    }

    public addExtendsName(extendsName: string) {
        this.extendsNames.push(extendsName);
    }

    public hasExtendededInterface(interfaceName: string) {
        return (this.extendsNames.indexOf(interfaceName) > -1);
    }

    public getFields() {
        return this.fields;
    }

    public addField(field: ArkField) {
        this.fields.push(field);
    }

    public getProperties() {
        //return this.properties;
    }

    public addProperty(property: Property) {
        //this.properties.push(property);
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