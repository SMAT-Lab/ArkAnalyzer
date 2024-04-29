import { NodeA } from "../base/Ast";
import { Type } from "../base/Type";
import { ViewTree } from "../graph/ViewTree";
import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod, arkMethodNodeKind, buildArkMethodFromArkClass } from "./ArkMethod";
import { ArkNamespace } from "./ArkNamespace";
import { ClassSignature, FieldSignature, MethodSignature } from "./ArkSignature";
import Logger, { LOG_LEVEL } from "../../utils/logger";
import { LineColPosition } from "../base/Position";
import { ObjectLiteralExpr } from "../base/Expr";
import { FileSignature,NamespaceSignature } from "./ArkSignature";

const logger = Logger.getLogger();

export class ArkClass {
    private name: string;
    private originType: string = "Class";
    private code: string;
    private line: number = -1;
    private column: number = -1;

    private etsPosition: LineColPosition;

    private declaringArkFile: ArkFile;
    private declaringArkNamespace: ArkNamespace;
    private classSignature: ClassSignature;

    private superClassName: string = '';
    private superClass: ArkClass;
    // private extendedClasses: ArkClass[] = [];
    private implementedInterfaceNames: string[] = [];
    private modifiers: Set<string> = new Set<string>();
    private typeParameters: Type[] = [];

    private defaultMethod: ArkMethod | null = null;

    // name to model
    private methods: Map<string, ArkMethod> = new Map<string, ArkMethod>();
    private fields: Map<string, ArkField> = new Map<string, ArkField>();
    private extendedClasses: Map<string, ArkClass> = new Map<string, ArkClass>();

    private viewTree: ViewTree;

    constructor() {
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

    public getColumn() {
        return this.column;
    }

    public setColumn(column: number) {
        this.column = column;
    }

    public setEtsPositionInfo(position: LineColPosition) {
        this.etsPosition = position;
    }

    public async getEtsPositionInfo(): Promise<LineColPosition> {
        if (!this.etsPosition) {
            let arkFile = this.declaringArkFile;
            const etsPosition = await arkFile.getEtsOriginalPositionFor(new LineColPosition(this.line, this.column));
            this.setEtsPositionInfo(etsPosition);
        }
        return this.etsPosition;
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

    public getSuperClass(): ArkClass {
        return this.superClass;
    }

    public setSuperClass(superClass: ArkClass) {
        this.superClass = superClass;
    }

    public getExtendedClasses(): Map<string, ArkClass> {
        return this.extendedClasses;
    }

    public addExtendedClass(extendedClass: ArkClass) {
        this.extendedClasses.set(extendedClass.getName(), extendedClass);
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
        const fieldName = fieldSignature.getFieldName();
        return this.getFieldWithName(fieldName);
    }

    public getFieldWithName(fieldName: string): ArkField | null {
        return this.fields.get(fieldName) || null;
    }

    public getFields(): ArkField[] {
        return Array.from(this.fields.values());
    }

    public addField(field: ArkField) {
        this.fields.set(field.getName(), field);
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

    public getMethods(): ArkMethod[] {
        return Array.from(this.methods.values());
    }

    public getMethod(methodSignature: MethodSignature): ArkMethod | null {
        const methodName = methodSignature.getMethodSubSignature().getMethodName();
        return this.getMethodWithName(methodName);
    }

    public getMethodWithName(methodName: string): ArkMethod | null {
        return this.methods.get(methodName) || null;
    }

    public addMethod(method: ArkMethod) {
        this.methods.set(method.getName(), method);
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
            await this.viewTree.buildViewTree();
        }
        return this.viewTree;
    }

    public hasViewTree(): boolean {
        return this.viewTree != undefined;
    }

    public getStaticFields(classMap: Map<FileSignature | NamespaceSignature, ArkClass[]>): ArkField[] {
        const fields: ArkField[] = [];
        let classes: ArkClass[] = [];
        if (this.declaringArkNamespace) {
            classes = classMap.get(this.declaringArkNamespace.getNamespaceSignature())!;
        } else {
            classes = classMap.get(this.declaringArkFile.getFileSignature())!;
        }
        for (const arkClass of classes) {
            for (const field of arkClass.getFields()) {
                if (field.isStatic()) {
                    fields.push(field);
                }
            }
        }
        return fields;
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
    cls.setLine(clsNode.line + 1);
    cls.setColumn(clsNode.character + 1);
    buildNormalArkClass(clsNode, cls);
}

export function buildNormalArkClassFromArkNamespace(clsNode: NodeA, arkNamespace: ArkNamespace, cls: ArkClass) {
    cls.setDeclaringArkNamespace(arkNamespace);
    cls.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    cls.setCode(clsNode.text);
    cls.setLine(clsNode.line + 1);
    cls.setColumn(clsNode.character + 1);
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
        } else {
            cls.addImplementedInterfaceName(key);
        }
    }

    cls.addFields(clsNode.classNodeInfo.getMembers());
    cls.getFields().forEach((field) => {
        field.setDeclaringClass(cls);
        field.genSignature();
        let initializer = field.getInitializer();
        if (initializer instanceof ObjectLiteralExpr) {
            let anonymousClass = initializer.getAnonymousClass();
            let newName = 'AnonymousClass-' + cls.getName() + '-' + field.getName();
            anonymousClass.setName(newName);
            anonymousClass.setDeclaringArkNamespace(cls.getDeclaringArkNamespace());
            anonymousClass.setDeclaringArkFile(cls.getDeclaringArkFile());
            anonymousClass.genSignature();
            anonymousClass.getMethods().forEach((mtd) => {
                mtd.setDeclaringArkClass(anonymousClass);
                mtd.setDeclaringArkFile();
                mtd.genSignature();
            });
        }
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
                    if (cld.kind == 'GetAccessor') {
                        let getAccessorName = cld.methodNodeInfo?.getAccessorName;
                        if (!getAccessorName) {
                            logger.warn("Cannot get GetAccessorName for method: ", mthd.getSignature().toString());
                        } else {
                            cls.getFields().forEach((field) => {
                                if (field.getName() === getAccessorName) {
                                    field.setParameters(mthd.getParameters());
                                    field.setType(mthd.getReturnType());
                                    field.setTypeParameters(mthd.getTypeParameter());
                                    field.setArkMethodSignature(mthd.getSignature());
                                }
                            });
                        }
                    }
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