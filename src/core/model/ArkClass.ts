/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ClassType, GenericType, Type } from '../base/Type';
import { ViewTree } from '../graph/ViewTree';
import { ArkField } from './ArkField';
import { ArkFile, Language } from './ArkFile';
import { ArkMethod } from './ArkMethod';
import { ArkNamespace } from './ArkNamespace';
import { ClassSignature, FieldSignature, FileSignature, MethodSignature, NamespaceSignature } from './ArkSignature';
import { Local } from '../base/Local';
import { ArkExport, ExportType } from './ArkExport';
import { TypeInference } from '../common/TypeInference';
import { ANONYMOUS_CLASS_PREFIX, DEFAULT_ARK_CLASS_NAME, NAME_DELIMITER, NAME_PREFIX } from '../common/Const';
import { getColNo, getLineNo, LineCol, setCol, setLine } from '../base/Position';
import { ArkBaseModel } from './ArkBaseModel';
import { ArkError } from '../common/ArkError';

export enum ClassCategory {
    CLASS = 0,
    STRUCT = 1,
    INTERFACE = 2,
    ENUM = 3,
    TYPE_LITERAL = 4,
    OBJECT = 5,
    // The following are CXX specific categories.
    UNION = 6,
}

/**
 * @category core/model
 */
export class ArkClass extends ArkBaseModel implements ArkExport {
    private category!: ClassCategory;
    private code?: string;
    private lineCol: LineCol = 0;

    private declaringArkFile!: ArkFile;
    private declaringArkNamespace: ArkNamespace | undefined;
    private classSignature!: ClassSignature;
    /**
     * The keys of the `heritageClasses` map represent the names of superclass and interfaces.
     * The superclass name is placed first; if it does not exist, an empty string `''` will occupy this position.
     * The values of the `heritageClasses` map will be replaced with `ArkClass` or `null` during type inference.
     */
    private heritageClasses: Map<string, ArkClass | null | undefined> = new Map<string, ArkClass | null | undefined>();

    private genericsTypes?: GenericType[];
    private realTypes?: Type[];
    private defaultMethod: ArkMethod | null = null;

    // name to model
    private methods: Map<string, ArkMethod> = new Map<string, ArkMethod>();
    private fields: Map<string, ArkField> = new Map<string, ArkField>();
    private extendedClasses: Map<string, ArkClass> = new Map<string, ArkClass>();
    private staticMethods: Map<string, ArkMethod> = new Map<string, ArkMethod>();
    private staticFields: Map<string, ArkField> = new Map<string, ArkField>();

    private instanceInitMethod: ArkMethod = new ArkMethod();
    private staticInitMethod: ArkMethod = new ArkMethod();

    private anonymousMethodNumber: number = 0;
    private indexSignatureNumber: number = 0;

    private viewTree?: ViewTree;

    // In order to record the mapping between arkTS and CPP functions
    private ts2cxxFuncMap: Map<string, ArkMethod[]> = new Map<string, ArkMethod[]>();
    // Record overload methods in cpp. Key of Map is method's name.
    private overloadMethods: Map<string, ArkMethod[]> = new Map<string, ArkMethod[]>();

    constructor() {
        super();
    }

    /**
     * Returns the program language of the file where this class defined.
     */
    public getLanguage(): Language {
        return this.getDeclaringArkFile().getLanguage();
    }

    /**
     * Returns the **string**name of this class.
     * @returns The name of this class.
     */
    public getName(): string {
        return this.classSignature.getClassName();
    }

    /**
     * Returns the codes of class as a **string.**
     * @returns the codes of class.
     */
    public getCode(): string | undefined {
        return this.code;
    }

    public setCode(code: string): void {
        this.code = code;
    }

    /**
     * Returns the line position of this class.
     * @returns The line position of this class.
     */
    public getLine(): number {
        return getLineNo(this.lineCol);
    }

    public setLine(line: number): void {
        this.lineCol = setLine(this.lineCol, line);
    }

    /**
     * Returns the column position of this class.
     * @returns The column position of this class.
     */
    public getColumn(): number {
        return getColNo(this.lineCol);
    }

    public setColumn(column: number): void {
        this.lineCol = setCol(this.lineCol, column);
    }

    public getCategory(): ClassCategory {
        return this.category;
    }

    public setCategory(category: ClassCategory): void {
        this.category = category;
    }

    /**
     * Returns the declaring file.
     * @returns A file defined by ArkAnalyzer.
     * @example
     * 1. Get the {@link ArkFile} which the ArkClass is in.

     ```typescript
     const arkFile = arkClass.getDeclaringArkFile();
     ```
     */
    public getDeclaringArkFile(): ArkFile {
        return this.declaringArkFile;
    }

    public setDeclaringArkFile(declaringArkFile: ArkFile): void {
        this.declaringArkFile = declaringArkFile;
    }

    /**
     * Returns the declaring namespace of this class, which may also be an **undefined**.
     * @returns The declaring namespace (may be **undefined**) of this class.
     */
    public getDeclaringArkNamespace(): ArkNamespace | undefined {
        return this.declaringArkNamespace;
    }

    public setDeclaringArkNamespace(declaringArkNamespace: ArkNamespace | undefined): void {
        this.declaringArkNamespace = declaringArkNamespace;
    }

    public isDefaultArkClass(): boolean {
        return this.getName() === DEFAULT_ARK_CLASS_NAME;
    }

    public isAnonymousClass(): boolean {
        return this.getName().startsWith(ANONYMOUS_CLASS_PREFIX);
    }

    /**
     * Returns the signature of current class (i.e., {@link ClassSignature}).
     * The {@link ClassSignature} can uniquely identify a class, according to which we can find the class from the scene.
     * @returns The class signature.
     */
    public getSignature(): ClassSignature {
        return this.classSignature;
    }

    public setSignature(classSig: ClassSignature): void {
        this.classSignature = classSig;
    }

    public getSuperClassName(): string {
        return this.heritageClasses.keys().next().value || '';
    }

    public addHeritageClassName(className: string): void {
        this.heritageClasses.set(className, undefined);
    }

    /**
     * Returns the superclass of this class.
     * @returns The superclass of this class.
     */
    public getSuperClass(): ArkClass | null {
        const heritageClass = this.getHeritageClass(this.getSuperClassName());
        if (heritageClass && heritageClass.getCategory() !== ClassCategory.INTERFACE) {
            return heritageClass;
        }
        return null;
    }

    public getHeritageClass(heritageClassName: string): ArkClass | null {
        if (!heritageClassName) {
            return null;
        }
        let superClass = this.heritageClasses.get(heritageClassName);
        if (superClass === undefined) {
            let type =
                TypeInference.inferUnclearRefName(heritageClassName, this) ??
                TypeInference.inferUnclearRefName(heritageClassName, this.getDeclaringArkFile().getDefaultClass());
            if (type) {
                type = TypeInference.replaceAliasType(type);
            }
            if (type instanceof ClassType && (superClass = this.declaringArkFile.getScene().getClass(type.getClassSignature()))) {
                superClass.addExtendedClass(this);
                const realGenericTypes = type.getRealGenericTypes();
                if (realGenericTypes) {
                    this.realTypes = realGenericTypes;
                }
            }
            this.heritageClasses.set(heritageClassName, superClass || null);
        }
        return superClass || null;
    }

    public getAllHeritageClasses(): ArkClass[] {
        const result: ArkClass[] = [];
        this.heritageClasses.forEach((v, k) => {
            const heritage = v ?? this.getHeritageClass(k);
            if (heritage) {
                result.push(heritage);
            }
        });
        return result;
    }

    public getExtendedClasses(): Map<string, ArkClass> {
        return this.extendedClasses;
    }

    public addExtendedClass(extendedClass: ArkClass): void {
        this.extendedClasses.set(extendedClass.getName(), extendedClass);
    }

    public getImplementedInterfaceNames(): string[] {
        if (this.category === ClassCategory.INTERFACE) {
            return [];
        }
        return Array.from(this.heritageClasses.keys()).slice(1);
    }

    public hasImplementedInterface(interfaceName: string): boolean {
        return this.heritageClasses.has(interfaceName) && this.getSuperClassName() !== interfaceName;
    }

    public getImplementedInterface(interfaceName: string): ArkClass | null {
        const heritageClass = this.getHeritageClass(interfaceName);
        if (heritageClass && heritageClass.getCategory() === ClassCategory.INTERFACE) {
            return heritageClass;
        }
        return null;
    }

    /**
     * Get the field according to its field signature.
     * If no field cound be found, **null**will be returned.
     * @param fieldSignature - the field's signature.
     * @returns A field. If there is no field in this class, the return will be a **null**.
     */
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

    /**
     * Returns an **array** of fields in the class.
     * @returns an **array** of fields in the class.
     */
    public getFields(): ArkField[] {
        const allFields: ArkField[] = Array.from(this.fields.values());
        allFields.push(...this.staticFields.values());
        return allFields;
    }

    public addField(field: ArkField): void {
        if (field.isStatic()) {
            this.staticFields.set(field.getName(), field);
        } else {
            this.fields.set(field.getName(), field);
        }
    }

    public addFields(fields: ArkField[]): void {
        fields.forEach(field => {
            this.addField(field);
        });
    }

    public getRealTypes(): Type[] | undefined {
        return this.realTypes ? Array.from(this.realTypes) : undefined;
    }

    public getGenericsTypes(): GenericType[] | undefined {
        return this.genericsTypes ? Array.from(this.genericsTypes) : undefined;
    }

    public addGenericType(gType: GenericType): void {
        if (!this.genericsTypes) {
            this.genericsTypes = [];
        }
        this.genericsTypes.push(gType);
    }

    /**
     * Returns all methods defined in the specific class in the form of an array.
     * @param generated - indicating whether this API returns the methods that are dynamically
     * generated at runtime. If it is not specified as true or false, the return will not include the generated method.
     * @returns An array of all methods in this class.
     * @example
     * 1. Get methods defined in class `BookService`.

     ```typescript
     let classes: ArkClass[] = scene.getClasses();
     let serviceClass : ArkClass = classes[1];
     let methods: ArkMethod[] = serviceClass.getMethods();
     let methodNames: string[] = methods.map(mthd => mthd.name);
     console.log(methodNames);
     ```
     */
    public getMethods(generated?: boolean): ArkMethod[] {
        const allMethods = Array.from(this.methods.values()).filter(f => (!generated && !f.isGenerated()) || generated);
        allMethods.push(...this.staticMethods.values());
        const allOverloadMtds: ArkMethod[][] = [...this.overloadMethods.values()];
        allMethods.push(...allOverloadMtds.flat());
        return [...new Set(allMethods)];
    }

    public getMethod(methodSignature: MethodSignature): ArkMethod | null {
        const methodName = methodSignature.getMethodSubSignature().getMethodName();
        const methodsWithSameName = this.getAllMethodsWithName(methodName);
        if (methodsWithSameName.length === 0) {
            return null;
        }
        for (const mtd of methodsWithSameName) {
            let methodMatched = this.findMatchingMethod(mtd, methodSignature);
            if (methodMatched) {
                return methodMatched;
            }
        }
        return null;
    }

    /**
     * Find a method that matches the specified signature
     * @ param mtd - Ark method object to check
     * @ param methodSignature - the method signature to match
     * @ returns If a matching method is found, the method object will be returned; otherwise, null will be returned
     */
    private findMatchingMethod(mtd: ArkMethod, methodSignature: MethodSignature): ArkMethod | null {
        const implSignature = mtd.getImplementationSignature();
        if (implSignature !== null && implSignature.isMatch(methodSignature)) {
            return mtd;
        }
        const declareSignatures = mtd.getDeclareSignatures();
        if (declareSignatures !== null) {
            for (let i = 0; i < declareSignatures.length; i++) {
                if (declareSignatures[i].isMatch(methodSignature)) {
                    return mtd;
                }
            }
        }
        return null;
    }

    public getMethodWithName(methodName: string): ArkMethod | null {
        return this.methods.get(methodName) || null;
    }

    public getStaticMethodWithName(methodName: string): ArkMethod | null {
        return this.staticMethods.get(methodName) || null;
    }

    /**
     * add a method in class.
     * when a nested method with declare name, add both the declare origin name and signature name
     * %${declare name}$${outer method name} in class.
     */
    public addMethod(method: ArkMethod, originName?: string): void {
        const name = originName ?? method.getName();
        if (method.isStatic()) {
            this.staticMethods.set(name, method);
        } else {
            this.methods.set(name, method);
        }
        if (!originName && !method.isAnonymousMethod() && name.startsWith(NAME_PREFIX)) {
            const index = name.indexOf(NAME_DELIMITER);
            if (index > 1) {
                const originName = name.substring(1, index);
                this.addMethod(method, originName);
            }
        }
    }

    /**
     * Adds an overloaded method to the class.
     *
     * This method handles the logic for adding method overloads. If a method with the same name
     * already exists, it creates or updates the overload method list. If the new method has the
     * same signature as an existing method, it replaces the existing method with the new one.
     *
     * @param newMethod - The new method to be added as an overload
     */
    public addOverloadMethod(newMethod: ArkMethod): void {
        const methodName = newMethod.getName();
        const existingMtd = this.getMethodWithName(methodName) ?? this.getStaticMethodWithName(methodName);
        if (!existingMtd) {
            return;
        }
        const newMethodSignature = newMethod.getSignature();
        if (!this.overloadMethods.has(methodName)) {
            if (newMethodSignature.isMatch(existingMtd.getSignature())) {
                return;
            }
            this.overloadMethods.set(methodName, [existingMtd, newMethod]);
            return;
        }
        const overloadMethods = this.overloadMethods.get(methodName);
        const index = overloadMethods!.findIndex(curMtd => curMtd.getSignature().isMatch(newMethodSignature));
        if (index !== -1) {
            overloadMethods![index] = newMethod;
        } else {
            overloadMethods!.push(newMethod);
        }
    }

    // In the case of overloading, there are multiple methods with the same name.
    public getAllMethodsWithName(methodName: string): ArkMethod[] {
        const sameNameMethods = this.overloadMethods.get(methodName) ?? [];
        if (sameNameMethods.length !== 0) {
            return sameNameMethods;
        }
        [this.methods, this.staticMethods].forEach(mtdMap => {
            const matchedMtd = mtdMap.get(methodName);
            if (matchedMtd) {
                sameNameMethods.push(matchedMtd);
            }
        });
        return sameNameMethods;
    }

    public setDefaultArkMethod(defaultMethod: ArkMethod): void {
        this.defaultMethod = defaultMethod;
        this.addMethod(defaultMethod);
    }

    public getDefaultArkMethod(): ArkMethod | null {
        return this.defaultMethod;
    }

    public setViewTree(viewTree: ViewTree): void {
        this.viewTree = viewTree;
    }

    /**
     * Returns the view tree of the ArkClass.
     * @returns The view tree of the ArkClass.
     * @example
     * 1. get viewTree of ArkClass.

     ```typescript
     for (let arkFiles of scene.getFiles()) {
     for (let arkClasss of arkFiles.getClasses()) {
     if (arkClasss.hasViewTree()) {
     arkClasss.getViewTree();
     }
     }
     }
     ```
     */
    public getViewTree(): ViewTree | undefined {
        return this.viewTree;
    }

    /**
     * Check whether the view tree is defined.
     * If it is defined, the return value is true, otherwise it is false.
     * @returns True if the view tree is defined; false otherwise.
     * @example
     * 1. Judge viewTree of ArkClass.

     ```typescript
     for (let arkFiles of scene.getFiles()) {
     for (let arkClasss of arkFiles.getClasses()) {
     if (arkClasss.hasViewTree()) {
     arkClasss.getViewTree();
     }
     }
     }
     ```
     */
    public hasViewTree(): boolean {
        return this.viewTree !== undefined;
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
        if (this.declaringArkNamespace) {
            return globalMap.get(this.declaringArkNamespace.getNamespaceSignature())!;
        }
        return globalMap.get(this.declaringArkFile.getFileSignature())!;
    }

    public getAnonymousMethodNumber(): number {
        return this.anonymousMethodNumber++;
    }

    public getIndexSignatureNumber(): number {
        return this.indexSignatureNumber++;
    }

    getExportType(): ExportType {
        return ExportType.CLASS;
    }

    public getInstanceInitMethod(): ArkMethod {
        return this.instanceInitMethod;
    }

    public getStaticInitMethod(): ArkMethod {
        return this.staticInitMethod;
    }

    public setInstanceInitMethod(arkMethod: ArkMethod): void {
        this.instanceInitMethod = arkMethod;
    }

    public setStaticInitMethod(arkMethod: ArkMethod): void {
        this.staticInitMethod = arkMethod;
    }

    public removeField(field: ArkField): boolean {
        if (field.isStatic()) {
            return this.staticFields.delete(field.getName());
        }
        return this.fields.delete(field.getName());
    }

    public removeMethod(method: ArkMethod): boolean {
        let rtn: boolean = false;
        if (method.isStatic()) {
            rtn = this.staticMethods.delete(method.getName());
        } else {
            rtn = this.methods.delete(method.getName());
        }
        rtn &&= this.getDeclaringArkFile().getScene().removeMethod(method);
        return rtn;
    }

    public validate(): ArkError {
        return this.validateFields(['declaringArkFile', 'category', 'classSignature']);
    }

    public addTs2cxxFuncMapElement(funcName: string, methods: ArkMethod[]): void {
        this.ts2cxxFuncMap.set(funcName, methods);
    }

    public getTs2cxxFuncMap(): Map<string, ArkMethod[]> {
        return this.ts2cxxFuncMap;
    }
}
