import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod, arkMethodNodeKind } from "./ArkMethod";
import { ArkNamespace } from "./ArkNamespace";
import { NodeA } from "../base/Ast";
import { MethodSubSignature, ClassSignature, methodSubSignatureCompare } from "./ArkSignature";
import { Property } from "../common/ClassInfoBuilder";


export class ArkClass {
    private name: string;
    private originType: string = "Class";
    private code: string;

    private declaringArkFile: ArkFile;
    private declaringArkNamespace: ArkNamespace;

    private declaringSignature: string;
    private arkInstancesMap: Map<string, any> = new Map<string, any>();
    private arkSignature: string;
    private classSignature: ClassSignature;

    private superClassName: string = '';
    private superClass: ArkClass;
    private implementedInterfaceNames: string[] = [];
    private fields: ArkField[] = [];
    private properties: Property[] = [];
    private defaultMethod: ArkMethod;
    private modifiers: Set<string> = new Set<string>();
    private typeParameters: string[] = [];

    private methods: ArkMethod[] = [];

    constructor() { }

    public buildDefaultArkClassFromArkFile(clsNode: NodeA, arkFile: ArkFile) {
        this.setDeclaringArkFile(arkFile);
        this.buildDefaultArkClass(clsNode);
    }

    public buildDefaultArkClassFromArkNamespace(clsNode: NodeA, arkNamespace: ArkNamespace) {
        this.setDeclaringArkNamespace(arkNamespace);
        this.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
        this.buildDefaultArkClass(clsNode);
    }

    public buildNormalArkClassFromArkFile(clsNode: NodeA, arkFile: ArkFile) {
        this.setDeclaringArkFile(arkFile);
        this.setCode(clsNode.text);
        this.buildNormalArkClass(clsNode);
    }

    public buildNormalArkClassFromArkNamespace(clsNode: NodeA, arkNamespace: ArkNamespace) {
        this.setDeclaringArkNamespace(arkNamespace);
        this.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
        this.setCode(clsNode.text);
        this.buildNormalArkClass(clsNode);
    }

    public buildDefaultArkClass(clsNode: NodeA) {
        this.setName("_DEFAULT_ARK_CLASS");
        this.genSignature();
        this.genDefaultArkMethod(clsNode);
    }

    private buildNormalArkClass(clsNode: NodeA) {
        if (!clsNode.classNodeInfo) {
            throw new Error('Error: There is no classNodeInfo for this ClassDeclaration!');
        }
        this.setName(clsNode.classNodeInfo.getClassName());
        this.originType = clsNode.classNodeInfo.getOriginType();
        this.genSignature();

        clsNode.classNodeInfo.getmodifiers().forEach((modifier) => {
            this.addModifier(modifier);
        });

        for (let [key, value] of clsNode.classNodeInfo.getHeritageClauses()) {
            if (value == 'ExtendsKeyword') {
                this.setSuperClassName(key);
            }
            else {
                this.addImplementedInterfaceName(key);
            }
        }

        this.fields = clsNode.classNodeInfo.getMembers();
        this.fields.forEach((filed) => {
            filed.setDeclaringClass(this);
            filed.genSignature();
        });

        clsNode.classNodeInfo.getTypeParameters().forEach((typeParameter) => {
            this.addTypeParameter(typeParameter);
        });

        // generate ArkMethods of this class
        for (let child of clsNode.children) {
            if (child.kind == 'SyntaxList') {
                for (let cld of child.children) {
                    if (arkMethodNodeKind.indexOf(cld.kind) > -1) {
                        let mthd: ArkMethod = new ArkMethod();
                        
                        mthd.setDeclaringSignature(this.arkSignature);

                        mthd.buildArkMethodFromArkClass(cld, this);
                        this.addMethod(mthd);

                        this.addArkInstance(mthd.getArkSignature(), mthd);
                        mthd.getArkInstancesMap().forEach((value, key) => {
                            this.addArkInstance(key, value);
                        });
                    }
                }
            }
        }
    }

    public addArkInstance(arkSignature: string, arkInstance: any) {
        this.arkInstancesMap.set(arkSignature, arkInstance);
    }

    public getArkInstancesMap() {
        return this.arkInstancesMap;
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

    public isDefaultArkClass(): boolean {
        return this.getName() === "_DEFAULT_ARK_CLASS";
    }

    public getSignature() {
        return this.classSignature;
    }

    public setSignature(classSig: ClassSignature) {
        this.classSignature = classSig;
    }

    public genSignature() {
        let classSig = new ClassSignature();
        classSig.setClassName(this.name);
        classSig.setDeclaringFileSignature(this.declaringArkFile.getFileSignature());
        if (this.declaringArkNamespace) {
            classSig.setDeclaringNamespaceSignature(this.declaringArkNamespace.getNamespaceSignature());
        }
        this.setSignature(classSig);
        this.genArkSignature();
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

    public getSuperClassName() {
        return this.superClassName;
    }

    public setSuperClassName(superClassName: string) {
        this.superClassName = superClassName;
    }

    public getImplementedInterfaceNames() {
        return this.implementedInterfaceNames;
    }

    public addImplementedInterfaceName(interfaceName: string) {
        this.implementedInterfaceNames.push(interfaceName);
    }

    public hasImplementedInterface(interfaceName: string) {
        return (this.implementedInterfaceNames.indexOf(interfaceName) > -1);
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

    public getTypeParameter() {
        return this.typeParameters;
    }

    public addTypeParameter(typeParameter: string) {
        this.typeParameters.push(typeParameter);
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

    public setDefaultArkMethod(defaultMethod: ArkMethod) {
        this.defaultMethod = defaultMethod;
        this.addMethod(defaultMethod);
    }

    private genDefaultArkMethod(clsNode: NodeA) {
        let defaultMethod = new ArkMethod();
        defaultMethod.buildArkMethodFromArkClass(clsNode, this);
        this.setDefaultArkMethod(defaultMethod);
    }
}