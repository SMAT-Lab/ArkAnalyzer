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
import { ModelUtils } from '../common/ModelUtils';

import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkClass');

export enum ClassCategory {
    CLASS = 0,
    STRUCT = 1,
    INTERFACE = 2,
    ENUM = 3,
    TYPE_LITERAL = 4,
    OBJECT = 5,
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
    private methods: Map<string, ArkMethod[]> = new Map<string, ArkMethod[]>();
    private fields: Map<string, ArkField> = new Map<string, ArkField>();
    private extendedClasses: Map<string, ArkClass> = new Map<string, ArkClass>();
    private staticMethods: Map<string, ArkMethod[]> = new Map<string, ArkMethod[]>();
    private staticFields: Map<string, ArkField> = new Map<string, ArkField>();

    private instanceInitMethod: ArkMethod = new ArkMethod();
    private staticInitMethod: ArkMethod = new ArkMethod();

    private anonymousMethodNumber: number = 0;
    private indexSignatureNumber: number = 0;

    private viewTree?: ViewTree;

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
        return this.category ?? ClassCategory.CLASS;
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

    private getHeritageClass(heritageClassName: string): ArkClass | null {
        if (!heritageClassName) {
            return null;
        }
        let superClass = this.heritageClasses.get(heritageClassName);
        if (superClass === undefined) {
            let type = TypeInference.inferUnclearRefName(heritageClassName, this) ??
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
        const allFields: ArkField[] = Array.from(this.staticFields.values());
        allFields.push(...this.fields.values());
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
        const flattenReducer = (acc: ArkMethod[], val: ArkMethod[]): ArkMethod[] => acc.concat(val);
        const allMethods = Array.from(this.methods.values()).reduce(flattenReducer, []).filter(f => (!generated && !f.isGenerated()) || generated);
        allMethods.push(...[...this.staticMethods.values()].reduce(flattenReducer, []));
        return [...new Set(allMethods)];
    }

    public getMethod(methodSignature: MethodSignature): ArkMethod | null {
        const methodName = methodSignature.getMethodSubSignature().getMethodName();
        const methodSearched = this.getMethodWithName(methodName) ?? this.getStaticMethodWithName(methodName);
        if (methodSearched === null) {
            return null;
        }
        const implSignature = methodSearched.getImplementationSignature();
        if (implSignature !== null && implSignature.isMatch(methodSignature)) {
            return methodSearched;
        }
        const declareSignatures = methodSearched.getDeclareSignatures();
        if (declareSignatures !== null) {
            for (let i = 0; i < declareSignatures.length; i++) {
                if (declareSignatures[i].isMatch(methodSignature)) {
                    return methodSearched;
                }
            }
        }
        return null;
    }

    public getMethodWithName(methodName: string): ArkMethod | null {
        const sameNameMethods = this.methods.get(methodName);
        if (!sameNameMethods) {
            return null;
        }
        if (sameNameMethods.length > 1) {
            logger.warn("There are multiple non-static methods with the same name, and the interface 'getMethodWithName' only returns one of them. " +
                "If you want to obtain all non-static methods with the same name, please use the interface 'getMethodsWithName'.");
        }
        return sameNameMethods[0];
    }

    public getStaticMethodWithName(methodName: string): ArkMethod | null {
        const sameNameStaticMethods = this.staticMethods.get(methodName);
        if (!sameNameStaticMethods) {
            return null;
        }
        if (sameNameStaticMethods.length > 1) {
            logger.warn("There are multiple static methods with the same name, and the interface 'getStaticMethodWithName' only returns one of them. " +
                "If you want to obtain all static methods with the same name, please use the interface 'getStaticMethodsWithName'.");
        }
        return sameNameStaticMethods[0];
    }

    /**
     * add a method in class.
     * when a nested method with declare name, add both the declare origin name and signature name
     * %${declare name}$${outer method name} in class.
     */
    public addMethod(method: ArkMethod, originName?: string): void {
        const name = originName ?? method.getName();
        this.updateMethodMap(method, name);
        if (!originName && !method.isAnonymousMethod() && name.startsWith(NAME_PREFIX)) {
            const index = name.indexOf(NAME_DELIMITER);
            if (index > 1) {
                const originName = name.substring(1, index);
                this.addMethod(method, originName);
            }
        }
    }

    /**
     * Update the new method to the corresponding Map.
     *
     * @param newMethod - the new method
     * @param methodName - name of new method
     */
    private updateMethodMap(newMethod: ArkMethod, methodName: string): void {
        const methodMap = newMethod.isStatic() ? this.staticMethods : this.methods;
        const methodsWithSameName = methodMap.get(methodName);
        if (!methodsWithSameName || !ModelUtils.isLanguageOverloadSupport(this.getLanguage())) {
            methodMap.set(methodName, [newMethod]);
            return;
        }

        const newMethodSignature = newMethod.getSignature();
        const matchIndex = methodsWithSameName.findIndex(
            // CXXTodo: After the subsequent abstraction of BodyBuilder, this conditions need to be refactored.
            preMtd => preMtd.getSignature().isMatch(newMethodSignature)
        );

        if (matchIndex === -1) {
            methodsWithSameName.push(newMethod);
        } else {
            methodsWithSameName[matchIndex] = newMethod;
        }
    }

    /**
     * Get all non-static methods with the same name.
     *
     * @param methodName - name of method
     * @returns an **array** of methods in the class.
     */
    public getMethodsWithName(methodName: string): ArkMethod[] {
        return this.methods.get(methodName) ?? [];
    }

    /**
     * Get all static methods with the same name.
     *
     * @param methodName - name of method
     * @returns an **array** of methods in the class.
     */
    public getStaticMethodsWithName(methodName: string): ArkMethod[] {
        return this.staticMethods.get(methodName) ?? [];
    }

    /**
     * Get all non-static and static methods with the same name.
     *
     * @param methodName - name of method
     * @returns an **array** of methods in the class.
     */
    public getAllMethodsWithName(methodName: string): ArkMethod[] {
        const allMethods = [...this.getMethodsWithName(methodName), ...this.getStaticMethodsWithName(methodName)];
        return [...new Set(allMethods)];
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
        return Array.from(this.staticFields.values());
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
}
