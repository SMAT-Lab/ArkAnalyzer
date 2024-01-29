import { NodeA } from "../base/Ast";
import { Property } from "../common/ClassBuilderInfo";
import { InterfaceMember } from "../common/InterfaceInfoBuilder";
import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod, arkMethodNodeKind } from "./ArkMethod";
import { ClassSignature, InterfaceSignature, MethodSubSignature, methodSubSignatureCompare } from "./ArkSignature";

export class ArkInterface {
    private name: string;
    private code: string;
    private declaringArkFile: ArkFile;
    private interfaceSignature: InterfaceSignature;
    private extendsNames: string[] = [];
    private fields: ArkField[] = [];
    private properties: Property[] = [];
    private methods: ArkMethod[] = [];
    private modifiers: Set<string> = new Set<string>();
    private members: InterfaceMember[] = [];

    constructor() { }

    public getMembers() {
        return this.members;
    }
    
    public addMember(member: InterfaceMember) {
        this.members.push(member);
    }

    public build(interfaceNode: NodeA, arkFile: ArkFile) {
        this.setDeclaringArkFile(arkFile);
        if (interfaceNode.kind == 'InterfaceDeclaration') {
            this.setCode(interfaceNode.text);
            this.buildArkInterfaceFromAstNode(interfaceNode);
            this.genSignature();
        }
    }

    private buildArkInterfaceFromAstNode(interfaceNode: NodeA) {
        if (!interfaceNode.interfaceNodeInfo) {
            throw new Error('Error: There is no interfaceNodeInfo for this interface!');
        }
        this.setName(interfaceNode.interfaceNodeInfo.interfaceName);
        this.genSignature();

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
        });
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

    public isExported(): boolean {
        return this.modifiers.has('ExportKeyword');
    }

    public getSignature() {
        return this.interfaceSignature;
    }

    public setSignature(interfaceSignature: InterfaceSignature) {
        this.interfaceSignature = interfaceSignature;
    }

    public genSignature() {
        let interfaceSig = new InterfaceSignature();
        interfaceSig.build(this.declaringArkFile.getName(), this.getName());
        this.setSignature(interfaceSig);
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
        return this.properties;
    }

    public addProperty(property: Property) {
        this.properties.push(property);
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