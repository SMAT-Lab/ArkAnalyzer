import { Type } from "../base/Type";
import { ViewTree } from "../graph/ViewTree";
import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod } from "./ArkMethod";
import { ArkNamespace } from "./ArkNamespace";
import { ClassSignature, FieldSignature, MethodSignature } from "./ArkSignature";
import Logger from "../../utils/logger";
import { LineColPosition } from "../base/Position";
import { FileSignature, NamespaceSignature } from "./ArkSignature";
import { Local } from "../base/Local";
import { Decorator } from "../base/Decorator";

const logger = Logger.getLogger();

export class ArkClass {
    private name: string = '';
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
    private implementedInterfaceNames: string[] = [];
    private modifiers: Set<string | Decorator> = new Set<string | Decorator>();
    private typeParameters: Type[] = [];

    private defaultMethod: ArkMethod | null = null;

    // name to model
    private methods: Map<string, ArkMethod> = new Map<string, ArkMethod>();
    private fields: Map<string, ArkField> = new Map<string, ArkField>();
    private extendedClasses: Map<string, ArkClass> = new Map<string, ArkClass>();
    private staticMethods: Map<string, ArkMethod> = new Map<string, ArkMethod>();
    private staticFields: Map<string, ArkField> = new Map<string, ArkField>();

    private anonymousMethodNumber: number = 0;

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
        let fieldSearched: ArkField | null = this.getFieldWithName(fieldName);
        if (!fieldSearched) {
            fieldSearched = this.getStaticFieldWithName(fieldName);
        }
        return fieldSearched;
    }

    public getFieldWithName(fieldName: string): ArkField | null {
        return this.fields.get(fieldName) || null;
    }

    public getStaticFieldWithName(fieldName: string): ArkField | null {
        return this.staticFields.get(fieldName) || null;
    }

    public getFields(): ArkField[] {
        const allFields: ArkField[] = Array.from(this.fields.values());
        allFields.push(...this.staticFields.values());
        return allFields;
    }

    public addField(field: ArkField) {
        if (field.isStatic()) {
            this.staticFields.set(field.getName(), field);
        } else {
            this.fields.set(field.getName(), field);
        }
    }

    public addFields(fields: ArkField[]) {
        fields.forEach((field) => {
            this.addField(field);
        });
    }

    public getModifiers() {
        return this.modifiers;
    }

    public addModifier(name: string | Decorator) {
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
        const allMethods = Array.from(this.methods.values());
        allMethods.push(...this.staticMethods.values());
        return allMethods;
    }

    public getMethod(methodSignature: MethodSignature): ArkMethod | null {
        const methodName = methodSignature.getMethodSubSignature().getMethodName();
        let methodSearched: ArkMethod | null = this.getMethodWithName(methodName);
        if (!methodSearched) {
            methodSearched = this.getStaticMethodWithName(methodName);
        }
        return methodSearched;
    }

    public getMethodWithName(methodName: string): ArkMethod | null {
        return this.methods.get(methodName) || null;
    }

    public getStaticMethodWithName(methodName: string): ArkMethod | null {
        return this.staticMethods.get(methodName) || null;
    }


    public addMethod(method: ArkMethod) {
        if (method.getModifiers().has('StaticKeyword')) {
            this.staticMethods.set(method.getName(), method);
        } else {
            this.methods.set(method.getName(), method);
        }
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

    public getGlobalVariable(globalMap: Map<FileSignature | NamespaceSignature, Local[]>): Local[] {
        let locals: Local[] = [];
        if (this.declaringArkNamespace) {
            return globalMap.get(this.declaringArkNamespace.getNamespaceSignature())!;
        }
        return globalMap.get(this.declaringArkFile.getFileSignature())!;
    }

    public getDecorators(): Decorator[] {
        return Array.from(this.modifiers).filter((item) => {
            return item instanceof Decorator;
        }) as Decorator[];
    }

    public getAnonymousMethodNumber() {
        return this.anonymousMethodNumber++;
    }
}