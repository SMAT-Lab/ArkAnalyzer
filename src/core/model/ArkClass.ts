import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod, arkMethodNodeKind, buildArkMethodFromArkClass } from "./ArkMethod";
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
    private classSignature: ClassSignature;

    private declaringSignature: string;
    private arkInstancesMap: Map<string, any> = new Map<string, any>();
    private arkSignature: string;

    private superClassName: string = '';
    //private superClass: ArkClass;
    private implementedInterfaceNames: string[] = [];
    private modifiers: Set<string> = new Set<string>();
    private typeParameters: string[] = [];

    private defaultMethod: ArkMethod;

    private methods: ArkMethod[] = [];
    private fields: ArkField[] = [];

    constructor() { }

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

    public getOriginType() {
        return this.originType;
    }

    public setOriginType(originType: string) {
        this.originType = originType;
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

    public addFields(fields: ArkField[]) {
        fields.forEach((field) => {
            this.addField(field);
        });
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
}

export function buildDefaultArkClassFromArkFile(clsNode: NodeA, arkFile: ArkFile, cls: ArkClass) {
    cls.setDeclaringArkFile(arkFile);
    buildDefaultArkClass(clsNode, cls);
}

export function buildDefaultArkClassFromArkNamespace(clsNode: NodeA, arkNamespace: ArkNamespace, cls: ArkClass) {
    cls.setDeclaringArkNamespace(arkNamespace);
    cls.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    buildDefaultArkClass(clsNode, cls);
}

export function buildNormalArkClassFromArkFile(clsNode: NodeA, arkFile: ArkFile, cls: ArkClass) {
    cls.setDeclaringArkFile(arkFile);
    cls.setCode(clsNode.text);
    buildNormalArkClass(clsNode, cls);
}

export function buildNormalArkClassFromArkNamespace(clsNode: NodeA, arkNamespace: ArkNamespace, cls: ArkClass) {
    cls.setDeclaringArkNamespace(arkNamespace);
    cls.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    cls.setCode(clsNode.text);
    buildNormalArkClass(clsNode, cls);
}

function buildDefaultArkClass(clsNode: NodeA, cls: ArkClass) {
    cls.setName("_DEFAULT_ARK_CLASS");
    cls.genSignature();
    genDefaultArkMethod(clsNode, cls);
}

function buildNormalArkClass(clsNode: NodeA, cls: ArkClass) {
    if (!clsNode.classNodeInfo) {
        throw new Error('Error: There is no classNodeInfo for this ClassDeclaration!');
    }
    cls.setName(clsNode.classNodeInfo.getClassName());
    cls.setOriginType(clsNode.classNodeInfo.getOriginType());
    cls.genSignature();

    clsNode.classNodeInfo.getmodifiers().forEach((modifier) => {
        cls.addModifier(modifier);
    });

    for (let [key, value] of clsNode.classNodeInfo.getHeritageClauses()) {
        if (value == 'ExtendsKeyword') {
            cls.setSuperClassName(key);
        }
        else {
            cls.addImplementedInterfaceName(key);
        }
    }

    cls.addFields(clsNode.classNodeInfo.getMembers());
    cls.getFields().forEach((filed) => {
        filed.setDeclaringClass(cls);
        filed.genSignature();
    });

    clsNode.classNodeInfo.getTypeParameters().forEach((typeParameter) => {
        cls.addTypeParameter(typeParameter);
    });

    // generate ArkMethods of this class
    for (let child of clsNode.children) {
        if (child.kind == 'SyntaxList') {
            for (let cld of child.children) {
                if (arkMethodNodeKind.indexOf(cld.kind) > -1) {
                    let mthd: ArkMethod = new ArkMethod();

                    mthd.setDeclaringSignature(cls.getArkSignature());

                    buildArkMethodFromArkClass(cld, cls, mthd);
                    cls.addMethod(mthd);

                    cls.addArkInstance(mthd.getArkSignature(), mthd);
                    mthd.getArkInstancesMap().forEach((value, key) => {
                        cls.addArkInstance(key, value);
                    });
                }
            }
        }
    }
}

function genDefaultArkMethod(clsNode: NodeA, cls: ArkClass) {
    let defaultMethod = new ArkMethod();
    buildArkMethodFromArkClass(clsNode, cls, defaultMethod);
    cls.setDefaultArkMethod(defaultMethod);
}