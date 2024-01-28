import { NodeA } from "../base/Ast";
import { Property } from "../common/ClassBuilderInfo";
import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod, arkMethodNodeKind } from "./ArkMethod";
import { ClassSignature, MethodSubSignature, methodSubSignatureCompare } from "./ArkSignature";

export class ArkInterface {
    private name: string;
    private code: string;
    private declaringArkFile: ArkFile;
    private interfaceSignature: ClassSignature;
    private extendsNames: string[] = [];
    private fields: ArkField[] = [];
    private properties: Property[] = [];
    private methods: ArkMethod[] = [];
    private modifiers: Set<string> = new Set<string>();

    constructor() { }

    public build(interfaceNode: NodeA, arkFile: ArkFile) {
        this.setDeclaringArkFile(arkFile);
        if (interfaceNode.kind == 'InterfaceDeclaration') {
            this.setCode(interfaceNode.text);
            this.buildArkInterfaceFromAstNode(interfaceNode);
        }
    }

    private buildArkInterfaceFromAstNode(interfaceNode: NodeA) {
        if (!interfaceNode.interfaceNodeInfo) {
            throw new Error('Error: There is no classNodeInfo for this class!');
        }
        this.setName(interfaceNode.classNodeInfo.className);
        this.genSignature();

        interfaceNode.classNodeInfo.modifiers.forEach((modifier) => {
            this.addModifier(modifier);
        });

        for (let [key, value] of interfaceNode.classNodeInfo.heritageClauses) {
            if (value == 'ExtendsKeyword') {
                this.setSuperClassName(key);
            }
            else {
                this.addImplementedInterfaceName(key);
            }
        }

        interfaceNode.interfaceNodeInfo.properties.forEach((property) => {
            this.addProperty(property);
        });

        this.getProperties().forEach((property) => {
            let field = new ArkField();
            field.buildFromArkClass(this, property);
            this.addField(field);
        });

        // generate ArkMethods of this interface
        for (let child of interfaceNode.children) {
            if (child.kind == 'SyntaxList') {
                for (let cld of child.children) {
                    if (arkMethodNodeKind.indexOf(cld.kind) > -1) {
                        let mthd: ArkMethod = new ArkMethod();
                        mthd.buildArkMethodFromAstNode(cld, this);
                        this.addMethod(mthd);
                    }
                }
            }
        }
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

    public setSignature(interfaceSignature: ClassSignature) {
        this.interfaceSignature = interfaceSignature;
    }

    public genSignature() {
        let classSig = new ClassSignature();
        classSig.build(this.declaringArkFile.getName(), this.getName());
        this.setSignature(classSig);
    }

    public getSuperClassName() {
        return this.extendsNames;
    }

    public setSuperClassName(extendsNames: string[]) {
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