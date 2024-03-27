import { NodeA } from "../base/Ast";
import { Type } from "../base/Type";
import { ViewTree } from "../graph/ViewTree";
import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod, arkMethodNodeKind, buildArkMethodFromArkClass } from "./ArkMethod";
import { ArkNamespace } from "./ArkNamespace";
import { ClassSignature, FieldSignature, MethodSignature } from "./ArkSignature";


export class ArkClass {
    private name: string;
    private originType: string = "Class";
    private code: string;
    private line: number = -1;
    private declaringArkFile: ArkFile;
    private declaringArkNamespace: ArkNamespace;
    private classSignature: ClassSignature;

    /* // Deprecated
    private declaringSignature: string;
    private arkInstancesMap: Map<string, any> = new Map<string, any>();
    private arkSignature: string; */

    private superClassName: string = '';
    private superClass: ArkClass;
    private extendedClasses: ArkClass[] = [];
    private implementedInterfaceNames: string[] = [];
    private modifiers: Set<string> = new Set<string>();
    private typeParameters: Type[] = [];

    private defaultMethod: ArkMethod | null = null;

    private methods: ArkMethod[] = [];
    private fields: ArkField[] = [];

    private viewTree: ViewTree;

    constructor() { }

    /* // Deprecated
    public addArkInstance(arkSignature: string, arkInstance: any) {
        this.arkInstancesMap.set(arkSignature, arkInstance);
    }

    public getArkInstancesMap() {
        return this.arkInstancesMap;
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
    }

    public getSuperClassName() {
        return this.superClassName;
    }

    public setSuperClassName(superClassName: string) {
        this.superClassName = superClassName;
    }

    public getSuperClass() {
        return this.superClass;
    }

    public setSuperClass(superClass: ArkClass) {
        this.superClass = superClass;
    }

    public getExtendedClasses() {
        return this.extendedClasses;
    }

    public addExtendedClass(extendedClass: ArkClass) {
        this.extendedClasses.push(extendedClass);
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

    public getField(fieldSignature: FieldSignature): ArkField | null {
        let returnVal: ArkField | null = null;
        this.getFields().forEach((field) => {
            if (field.getSignature().toString() == fieldSignature.toString()) {
                returnVal = field
            }
        });
        return returnVal;
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

    public addTypeParameter(typeParameter: Type) {
        this.typeParameters.push(typeParameter);
    }

    public containsModifier(name: string) {
        return this.modifiers.has(name);
    }

    public getMethods() {
        return this.methods;
    }

    public getMethod(methodSignature: MethodSignature): ArkMethod | null {
        let returnVal: ArkMethod | null = null;
        this.methods.forEach((mtd) => {
            if (mtd.getSignature().toString() == methodSignature.toString()) {
                returnVal = mtd;
            }
        });
        return returnVal;
    }

    public addMethod(method: ArkMethod) {
        this.methods.push(method);
    }

    public setDefaultArkMethod(defaultMethod: ArkMethod) {
        this.defaultMethod = defaultMethod;
        this.addMethod(defaultMethod);
    }

    public getDefaultArkMethod(): ArkMethod | null {
        return this.defaultMethod;
    }

    public setViewTree(viewTree: ViewTree) {
        this.viewTree = viewTree;
    }

    public async getViewTree(): Promise<ViewTree> {
        if (this.hasViewTree() && !this.viewTree.isInitialized()) {
            // deps inferTypes
            this.getDeclaringArkFile().getScene().inferTypes();
            await this.viewTree.buildViewTree();
        }
        return this.viewTree;
    }

    public hasViewTree(): boolean {
        return this.viewTree != null;
    }
}

export function buildDefaultArkClassFromArkFile(defaultlassNode: NodeA, arkFile: ArkFile, defaultClass: ArkClass) {
    defaultClass.setDeclaringArkFile(arkFile);
    buildDefaultArkClass(defaultlassNode, defaultClass);
}

export function buildDefaultArkClassFromArkNamespace(defaultClassNode: NodeA, arkNamespace: ArkNamespace, defaultClass: ArkClass) {
    defaultClass.setDeclaringArkNamespace(arkNamespace);
    defaultClass.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    buildDefaultArkClass(defaultClassNode, defaultClass);
}

export function buildNormalArkClassFromArkFile(clsNode: NodeA, arkFile: ArkFile, cls: ArkClass) {
    cls.setDeclaringArkFile(arkFile);
    cls.setCode(clsNode.text);
    cls.setLine(clsNode.line);
    buildNormalArkClass(clsNode, cls);
}

export function buildNormalArkClassFromArkNamespace(clsNode: NodeA, arkNamespace: ArkNamespace, cls: ArkClass) {
    cls.setDeclaringArkNamespace(arkNamespace);
    cls.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    cls.setCode(clsNode.text);
    cls.setLine(clsNode.line);
    buildNormalArkClass(clsNode, cls);
}

function buildDefaultArkClass(defaultClassNode: NodeA, cls: ArkClass) {
    cls.setName("_DEFAULT_ARK_CLASS");
    cls.genSignature();
    genDefaultArkMethod(defaultClassNode, cls);
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
                    buildArkMethodFromArkClass(cld, cls, mthd);
                    cls.addMethod(mthd);
                }
            }
        }
    }
}

function genDefaultArkMethod(defaultMethodNode: NodeA, cls: ArkClass) {
    let defaultMethod = new ArkMethod();
    buildArkMethodFromArkClass(defaultMethodNode, cls, defaultMethod);
    cls.setDefaultArkMethod(defaultMethod);
}