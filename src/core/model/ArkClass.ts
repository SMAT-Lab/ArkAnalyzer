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

import { ClassType, GenericType, Type, UnknownType } from '../base/Type';
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
import { FullPosition, INVALID_LINE } from '../base/Position';
import { ArkBaseModel, CLASS_SPECIFIC_TAG_SHIFT } from './ArkBaseModel';
import { ArkError } from '../common/ArkError';
import { ModelUtils } from '../common/ModelUtils';
import { SignatureCanonicalizerRegistry } from '../common/SignatureCanonicalizerRegistry';

import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkClass');

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
 * Shift amount for class category encoding in ArkClass tags field.
 * Uses CLASS_SPECIFIC_TAG_SHIFT as the base offset for class-specific properties.
 */
export const CLASS_CATEGORY_SHIFT = CLASS_SPECIFIC_TAG_SHIFT;

/**
 * Mask for extracting class category from ArkClass tags field.
 * Covers 3 bits for up to 8 class category values.
 */
export const CLASS_CATEGORY_MASK = 0x7 << CLASS_CATEGORY_SHIFT;

export interface heritageClassWithInfo {
    baseClass: ArkClass | undefined | null;
    isVirtual: boolean;
    access: string;
}

/**
 * @category core/model
 */
export class ArkClass extends ArkBaseModel implements ArkExport {
    private sourceCode?: string;
    /** The full position (start/end line/col) of this class in the source file.
     *  Undefined when this class is an automatically generated default class during IR construction. */
    private originFullPosition?: FullPosition;

    /** @internal Formal FileSigID for the declaring file. -1 = not yet interned. */
    private declaringFileID: number = -1;

    /** @internal Formal NamespaceSigID for the declaring namespace. undefined = no namespace. */
    private declaringNamespaceSigID?: number;

    /** @internal Formal ClassSigID of this class. -1 = not yet set. */
    private classSigID: number = -1;

    /** @internal MethodSigID of the default method. undefined = no default method (most classes). */
    private defaultMethodSigID?: number;
    /** @internal MethodSigID of the instance init method. undefined = not set. */
    private instanceInitMethodSigID?: number;
    /** @internal MethodSigID of the static init method. undefined = not set. */
    private staticInitMethodSigID?: number;

    /** @internal Get the Registry singleton. */
    private get registry(): SignatureCanonicalizerRegistry {
        return SignatureCanonicalizerRegistry.getInstance();
    }

    /**
     * The keys of the `heritageClasses` map represent the names of superclass and interfaces.
     * The superclass name is placed first; if it does not exist, an empty string `''` will occupy this position.
     * The values of the `heritageClasses` map will be replaced with `ArkClass` or `null` during type inference.
     */
    private heritageClasses: Map<string, heritageClassWithInfo | undefined> = new Map<string, heritageClassWithInfo | undefined>();

    private genericsTypes?: GenericType[];
    private realTypes?: Type[];

    /** @internal SigIDs of direct instance methods. undefined = no methods allocated yet. */
    private topMethodSigIDs?: Int32Array;
    private topMethodCount: number = 0;

    /** @internal SigIDs of direct static methods. undefined = no static methods allocated yet. */
    private topStaticMethodSigIDs?: Int32Array;
    private topStaticMethodCount: number = 0;

    /** @internal SigIDs of direct subclasses (parent→child back-references). undefined = none yet. */
    private extendedClassSigIDs?: Int32Array;
    private extendedClassCount: number = 0;

    /** @internal SigIDs of direct instance fields. undefined = no fields allocated yet. */
    private topFieldSigIDs?: Int32Array;
    private topFieldCount: number = 0;

    /** @internal SigIDs of direct static fields. undefined = no static fields allocated yet. */
    private topStaticFieldSigIDs?: Int32Array;
    private topStaticFieldCount: number = 0;

    private anonymousMethodNumber: number = 0;
    private indexSignatureNumber: number = 0;

    private viewTree?: ViewTree;

    // In order to record the mapping between arkTS and CPP functions
    private ts2cxxFuncMap: Map<string, ArkMethod[]> = new Map<string, ArkMethod[]>();
    // When the declaration and definition of a class in C++ are separated, record the signature of the relevant declaration.
    private classDeclareSignature?: ClassSignature;

    /**
     * @deprecated Construct with the declaring IDs and (optionally) the signature
     * object instead.
     */
    constructor();
    /**
     * Build directly from the declaring file ID, the declaring (parent) namespace SigID,
     * and (optionally) the class signature.
     * `setSignature` is the registration point: it interns the signature, assigns the
     * ClassSigID, and registers this class as the model on first interning.
     * @param declaringFileID - Formal FileSigID of the declaring file.
     * @param declaringNamespaceSigID - Formal NamespaceSigID of the declaring (parent)
     *        namespace; omit for top-level classes.
     * @param classSig - The signature object; not yet registered — registration happens
     *        inside via setSignature.
     */
    constructor(declaringFileID: number, declaringNamespaceSigID?: number, classSig?: ClassSignature);
    constructor(declaringFileID?: number, declaringNamespaceSigID?: number, classSig?: ClassSignature) {
        super();
        if (declaringFileID !== undefined) {
            this.declaringFileID = declaringFileID;
        }
        if (declaringNamespaceSigID !== undefined) {
            this.declaringNamespaceSigID = declaringNamespaceSigID;
        }
        if (classSig) {
            this.setSignature(classSig);
        }
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
        return this.getSignature().getClassName();
    }

    /**
     * Returns the source text of the class extracted from the declaring ArkFile
     * using the class's origin position.
     * @returns the source text of the class, or undefined if unavailable.
     */
    public getCode(): string | undefined {
        if (this.sourceCode !== undefined) {
            return this.sourceCode;
        }
        const code = this.getDeclaringArkFile().getSourceTextByFullPosition(this.originFullPosition);
        if (code !== undefined) {
            this.sourceCode = code;
        }
        return code;
    }

    /**
     * @deprecated Source text is now stored on ArkFile only. This method has no effect.
     * @param _code - The source code (ignored).
     */
    public setCode(_code: string): void {}

    /**
     * Returns the full position (start/end line/col) of this class in the source file.
     * @returns The full position of this class in the source code, or undefined if this class
     *          is an automatically generated default class during IR construction.
     */
    public getOriginFullPosition(): FullPosition | undefined {
        return this.originFullPosition;
    }

    /**
     * Sets the full position of this class in the source file.
     * @param position - The full position in the source code to set.
     */
    public setOriginFullPosition(position: FullPosition): void {
        this.originFullPosition = position;
    }

    /**
     * @deprecated Use getOriginFullPosition()?.getFirstLine() instead.
     * @returns The line number of this class in the source code, or INVALID_LINE if this class
     *          is an automatically generated default class during IR construction.
     */
    public getLine(): number {
        return this.originFullPosition?.getFirstLine() ?? INVALID_LINE;
    }

    /**
     * @deprecated Use setOriginFullPosition() instead.
     * @param line - The line number in the source code to set.
     */
    public setLine(line: number): void {
        if (this.originFullPosition) {
            const firstCol = this.originFullPosition.getFirstCol();
            const lastLine = this.originFullPosition.getLastLine();
            const lastCol = this.originFullPosition.getLastCol();
            this.originFullPosition = new FullPosition(line, firstCol, lastLine, lastCol);
        }
    }

    /**
     * @deprecated Use getOriginFullPosition()?.getFirstCol() instead.
     * @returns The column number of this class in the source code, or INVALID_LINE if this class
     *          is an automatically generated default class during IR construction.
     */
    public getColumn(): number {
        return this.originFullPosition?.getFirstCol() ?? INVALID_LINE;
    }

    /**
     * @deprecated Use setOriginFullPosition() instead.
     * @param column - The column number in the source code to set.
     */
    public setColumn(column: number): void {
        if (this.originFullPosition) {
            const firstLine = this.originFullPosition.getFirstLine();
            const lastLine = this.originFullPosition.getLastLine();
            const lastCol = this.originFullPosition.getLastCol();
            this.originFullPosition = new FullPosition(firstLine, column, lastLine, lastCol);
        }
    }

    public getCategory(): ClassCategory {
        const value = this.getTagValue(CLASS_CATEGORY_MASK, CLASS_CATEGORY_SHIFT);
        return value !== 0 ? (value as ClassCategory) : ClassCategory.CLASS;
    }

    public setCategory(category: ClassCategory): void {
        this.setTagValue(CLASS_CATEGORY_MASK, CLASS_CATEGORY_SHIFT, category);
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
        if (this.declaringFileID !== -1) {
            return this.registry.fileSigCanonicalizer.getModel(this.declaringFileID)!;
        }
        return undefined as unknown as ArkFile;
    }

    /** @deprecated Use {@link constructor} instead. */
    public setDeclaringArkFile(declaringArkFile: ArkFile): void {
        this.declaringFileID = declaringArkFile.getFileSigID();
    }

    /** @internal Get the formal FileSigID of the declaring file. Returns -1 if not interned. */
    public getDeclaringFileID(): number {
        return this.declaringFileID;
    }

    /**
     * Returns the declaring namespace of this class, which may also be an **undefined**.
     * @returns The declaring namespace (may be **undefined**) of this class.
     */
    public getDeclaringArkNamespace(): ArkNamespace | undefined {
        if (this.declaringNamespaceSigID !== undefined) {
            return this.registry.namespaceSigCanonicalizer.getModel(this.declaringNamespaceSigID) ?? undefined;
        }
        return undefined;
    }

    public getDeclaringArkNamespaceID(): number | undefined {
        if (this.declaringNamespaceSigID !== undefined) {
            return this.declaringNamespaceSigID;
        }
        return undefined;
    }

    /**
     * @deprecated Use the ID-injecting constructor
     * {@link constructor(declaringFileID, declaringNamespaceSigID, classSig)} or
     * {@link setDeclaringArkNamespaceID} instead.
     */
    public setDeclaringArkNamespace(declaringArkNamespace: ArkNamespace | undefined): void {
        this.declaringNamespaceSigID = declaringArkNamespace?.getNamespaceSigID();
    }

    public isDefaultArkClass(): boolean {
        return this.getName() === DEFAULT_ARK_CLASS_NAME;
    }

    public isAnonymousClass(): boolean {
        return this.getName().startsWith(ANONYMOUS_CLASS_PREFIX);
    }

    public isLibraryClass(): boolean {
        const file = this.getDeclaringArkFile();
        return file.getProjectName() !== file.getScene().getProjectName();
    }

    /**
     * Returns the signature of current class (i.e., {@link ClassSignature}).
     * The {@link ClassSignature} can uniquely identify a class, according to which we can find the class from the scene.
     * @returns The class signature.
     */
    public getSignature(): ClassSignature {
        return this.registry.classSigCanonicalizer.get(this.classSigID)!;
    }

    public setSignature(classSig: ClassSignature): void {
        const existing = this.registry.classSigCanonicalizer.getExistingId(classSig);
        this.classSigID = this.registry.classSigCanonicalizer.getId(classSig);
        // 新值首建 → 注册；驱逐态恢复（sig 值残留、model 已被 removeClass 删除）→ 补注册
        //（否则 reload 时 getDeclaringArkClass 查不到 model，genDefaultArkMethod 链 NPE）；
        // 已有别的 model 持有该签名 → 不覆盖（防"后 setSignature 者顶替"写穿）。
        if (existing < 0 || this.registry.classSigCanonicalizer.getModel(existing) === undefined) {
            SignatureCanonicalizerRegistry.registerClass(this);
        }
    }

    /** @internal Get the formal ClassSigID of this class. */
    public getClassSigID(): number {
        return this.classSigID;
    }

    public getSuperClassName(): string {
        return this.heritageClasses.keys().next().value || '';
    }

    public addHeritageClassName(className: string): void {
        this.heritageClasses.set(className, undefined);
    }

    public addHeritageClassNameWithInfo(className: string, classInfo: heritageClassWithInfo): void {
        this.heritageClasses.set(className, classInfo);
    }

    /**
     * Returns the superclass of this class.
     * If the superclass is defined in this project, then its category must not be INTERFACE.
     * If the superclass is from the 3rd party library, then its category could be INTERFACE.
     * @returns The superclass of this class.
     */
    public getSuperClass(): ArkClass | null {
        const heritageClass = this.getHeritageClass(this.getSuperClassName());
        if (heritageClass) {
            if (heritageClass.getCategory() !== ClassCategory.INTERFACE) {
                return heritageClass;
            }
            if (heritageClass.isLibraryClass()) {
                return heritageClass;
            }
        }
        return null;
    }

    public getHeritageClass(heritageClassName: string): ArkClass | null {
        if (!heritageClassName) {
            return null;
        }
        let superClassWithInfo = this.heritageClasses.get(heritageClassName);
        let superClass = superClassWithInfo?.baseClass;
        if (superClass === undefined) {
            let type =
                TypeInference.inferUnclearRefName(heritageClassName, this) ??
                TypeInference.inferUnclearRefName(heritageClassName, this.getDeclaringArkFile().getDefaultClass());
            if (type) {
                type = TypeInference.replaceAliasType(type);
            }
            if (type instanceof ClassType && (superClass = this.getDeclaringArkFile().getScene().getClass(type.getClassSignature()))) {
                superClass.addExtendedClass(this);
                const realGenericTypes = type.getRealGenericTypes();
                if (realGenericTypes) {
                    this.realTypes = realGenericTypes;
                }
            }
            superClassWithInfo = {
                baseClass: superClass,
                isVirtual: superClassWithInfo?.isVirtual ?? false,
                access: superClassWithInfo?.access ?? 'private',
            };
            this.heritageClasses.set(heritageClassName, superClassWithInfo);
        }
        return superClassWithInfo?.baseClass || null;
    }

    public getAllHeritageClasses(): ArkClass[] {
        const result: ArkClass[] = [];
        this.heritageClasses.forEach((v, k) => {
            const heritage = v ?? this.getHeritageClass(k);
            if (heritage) {
                // C++ feature: inheritance may carry extra metadata (e.g., virtual inheritance/access),
                // so we may get `heritageClassWithInfo` and must extract `baseClass`.
                if ('baseClass' in heritage && heritage.baseClass) {
                    result.push(heritage.baseClass);
                } else if (heritage instanceof ArkClass) {
                    result.push(heritage);
                }
            }
        });
        return result;
    }

    /**
     * Returns the direct subclasses (parent→child back-references) of this class.
     * The returned Map is a rebuilt view keyed by class name; mutating it does not
     * affect the internal storage.
     */
    public getExtendedClasses(): Map<string, ArkClass> {
        const result = new Map<string, ArkClass>();
        const arr = this.extendedClassSigIDs;
        if (!arr) {
            return result;
        }
        const reg = this.registry;
        for (let i = 0; i < this.extendedClassCount; i++) {
            const cls = reg.classSigCanonicalizer.getModel(arr[i]);
            if (cls) {
                result.set(cls.getName(), cls);
            }
        }
        return result;
    }

    /**
     * @internal Returns the direct subclasses as an array, or **null** if this class
     * has no extended classes. Preferred over {@link getExtendedClasses} in hot paths
     * to avoid rebuilding a Map. Stale SigIDs (whose classes were removed) are skipped.
     */
    public getExtendedClassList(): ArkClass[] | null {
        const arr = this.extendedClassSigIDs;
        if (!arr || this.extendedClassCount === 0) {
            return null;
        }
        const result: ArkClass[] = [];
        const reg = this.registry;
        for (let i = 0; i < this.extendedClassCount; i++) {
            const cls = reg.classSigCanonicalizer.getModel(arr[i]);
            if (cls) {
                result.push(cls);
            }
        }
        return result;
    }

    public addExtendedClass(extendedClass: ArkClass): void {
        const id = extendedClass.getClassSigID();
        if (id <= 0 || this.hasExtendedClassWithID(id)) {
            return;
        }
        this.addExtendedClassSigID(id);
    }

    /** @internal Removes a direct subclass back-reference (by ClassSigID, swap-remove). */
    public removeExtendedClass(extendedClass: ArkClass): void {
        this.removeExtendedClassSigID(extendedClass.getClassSigID());
    }

    public getImplementedInterfaceNames(): string[] {
        if (this.getCategory() === ClassCategory.INTERFACE) {
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
        // 按传入签名整体身份直查：FieldSignature 身份 = (name, declaringClassSigID,
        // staticFlag)（type 不参与 hash/equals）。语义精确化——原实现忽略传入签名
        // 的 staticFlag（先 instance 后 static 各扫一遍），现 staticFlag 不匹配即
        // miss（instance 与 static 同名字段本就是两个不同身份的字段）。
        // 归属校验（对齐 getMethod 的 Plan A 模式）：值命中的 SigID 可能是父类/
        // 他类字段（如 ref 签名归属父类），必须确认模型归属本类，防越界命中。
        const id = this.registry.fieldSigCanonicalizer.getExistingId(fieldSignature);
        if (id !== -1) {
            const fld = this.registry.fieldSigCanonicalizer.getModel(id);
            if (fld !== undefined && fld.getDeclaringClassID() === this.classSigID) {
                return fld;
            }
        }
        return null;
    }

    public getFieldWithName(fieldName: string): ArkField | null {
        // 精确匹配：拼本类归属签名直查（type 不参与 FieldSignature 身份，用
        // UnknownType 占位）。全局不变量"字段签名归属 == 挂载类"已成立（顶层
        // 全局符号 round9 多值化 + ns 级 copyNamespace round10 退役，实证违规
        // 归零），miss 即 null——签名归属是唯一真相。
        const id = this.registry.fieldSigCanonicalizer.getExistingId(new FieldSignature(fieldName, this.classSigID, UnknownType.getInstance(), false));
        if (id !== -1) {
            return this.registry.fieldSigCanonicalizer.getModel(id) ?? null;
        }
        return null;
    }

    public getStaticFieldWithName(fieldName: string): ArkField | null {
        // 同 getFieldWithName，staticFlag = true。
        const id = this.registry.fieldSigCanonicalizer.getExistingId(new FieldSignature(fieldName, this.classSigID, UnknownType.getInstance(), true));
        if (id !== -1) {
            return this.registry.fieldSigCanonicalizer.getModel(id) ?? null;
        }
        return null;
    }

    /**
     * Returns an **array** of fields in the class.
     * @returns an **array** of fields in the class.
     */
    public getFields(): ArkField[] {
        const result: ArkField[] = [];
        const sArr = this.topStaticFieldSigIDs;
        if (sArr) {
            const reg = this.registry;
            for (let i = 0; i < this.topStaticFieldCount; i++) {
                const fld = reg.fieldSigCanonicalizer.getModel(sArr[i]);
                if (fld) {
                    result.push(fld);
                }
            }
        }
        const arr = this.topFieldSigIDs;
        if (arr) {
            const reg = this.registry;
            for (let i = 0; i < this.topFieldCount; i++) {
                const fld = reg.fieldSigCanonicalizer.getModel(arr[i]);
                if (fld) {
                    result.push(fld);
                }
            }
        }
        return result;
    }

    public addField(field: ArkField): void {
        const id = field.getFieldSigID();
        if (field.isStatic()) {
            if (!this.hasTopStaticFieldWithID(id)) {
                SignatureCanonicalizerRegistry.registerField(field);
                this.addTopStaticFieldSigID(id);
            }
        } else {
            if (!this.hasTopFieldWithID(id)) {
                SignatureCanonicalizerRegistry.registerField(field);
                this.addTopFieldSigID(id);
            }
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
        const result: ArkMethod[] = [];
        const reg = this.registry;
        const arr = this.topMethodSigIDs;
        if (arr) {
            for (let i = 0; i < this.topMethodCount; i++) {
                const m = reg.methodSigCanonicalizer.getModel(arr[i]);
                if (m && (generated || !m.isGenerated())) {
                    result.push(m);
                }
            }
        }
        const sArr = this.topStaticMethodSigIDs;
        if (sArr) {
            for (let i = 0; i < this.topStaticMethodCount; i++) {
                const m = reg.methodSigCanonicalizer.getModel(sArr[i]);
                if (m && (generated || !m.isGenerated())) {
                    result.push(m);
                }
            }
        }
        return result;
    }

    public getMethod(methodSignature: MethodSignature): ArkMethod | null {
        // Fast path: the signature is already interned and its model registered —
        // equals() includes the declaring class, so a value hit is authoritative.
        // 归属守卫（方案 A）：fast path 的值查找是全局的，必须校验命中方法的
        // declaringClassID === 本类——否则任意已注册签名（他类同名方法 / SDK 接口
        // 声明 / 闭包旧挂载）都会越界命中（实测 100% 越界）。越界命中不直接返回，
        // 落入下方本类遍历 fallback。闭包双签名不受影响：S2 声明的 declaringClass
        // 恒为本类（createNewSignatureWithClosures 保留 declaringClassSigID）。
        const canonicalizer = this.registry.methodSigCanonicalizer;
        const id = canonicalizer.getExistingId(methodSignature);
        if (id !== -1) {
            const mtd = canonicalizer.getModel(id);
            if (mtd !== undefined && mtd.getDeclaringClassID() === this.classSigID) {
                return mtd;
            }
        }
        // Fallback: class-local traversal with signature matching.
        // 不能删除（结构性缺口承载者）：
        // ① declare[k>0] 无 model——addMethod 只注册 impl ?? declare[0]，而
        //    matchMethodSignature 为可选参数/重载调用点选出的非首选声明签名
        //    （callgraph callee 解析主链路，PagBuilder/CallGraph/RTA 等）只能在此命中；
        // ② 闭包 declare 重建签名（updateNestedMethodWithClosures 只 intern 不注册）；
        // ③ C++ 跨类借用（声明方法借实现侧签名，fast path 归属校验失败后在此命中）。
        // 收窄路径（独立轮次）：addMethod 补齐 declare 全槽注册（需带仲裁）→ 命中
        // 计数验证残余 → 最终收窄为 CXX/unclear 归属专属。
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

    // 注：method WithName 系列（getMethodWithName / getStaticMethodWithName /
    // getMethodsWithName / getStaticMethodsWithName / getAllMethodsWithName）不可
    // 签名化——MethodSignature 身份含参数列表与返回类型，方法名不足以构造签名；
    // 且 methodMatchesName 的 '%origin$outer' 按 origin 前缀匹配是被测试守护的
    // 公开语义（替代历史 dual-registration），非内部实现细节。
    public getMethodWithName(methodName: string): ArkMethod | null {
        const sameNameMethods = this.getMethodsWithName(methodName);
        if (sameNameMethods.length === 0) {
            return null;
        }
        if (sameNameMethods.length > 1) {
            logger.warn(
                "There are multiple non-static methods with the same name, and the interface 'getMethodWithName' only returns one of them. " +
                    "If you want to obtain all non-static methods with the same name, please use the interface 'getMethodsWithName'."
            );
        }
        return sameNameMethods[0];
    }

    public getStaticMethodWithName(methodName: string): ArkMethod | null {
        const sameNameStaticMethods = this.getStaticMethodsWithName(methodName);
        if (sameNameStaticMethods.length === 0) {
            return null;
        }
        if (sameNameStaticMethods.length > 1) {
            logger.warn(
                "There are multiple static methods with the same name, and the interface 'getStaticMethodWithName' only returns one of them. " +
                    "If you want to obtain all static methods with the same name, please use the interface 'getStaticMethodsWithName'."
            );
        }
        return sameNameStaticMethods[0];
    }

    /**
     * Whether a method's (possibly composed) name matches the given plain name.
     * A nested method is stored under its full composed name `%origin$outer`; it should
     * also be reachable by its plain origin name (replacing the previous dual-registration
     * of origin names in the method map).
     */
    private static methodMatchesName(mtd: ArkMethod, name: string): boolean {
        const n = mtd.getName();
        return n === name || n.startsWith(NAME_PREFIX + name + NAME_DELIMITER);
    }

    /**
     * add a method in class.
     */
    public addMethod(method: ArkMethod): void {
        const id = method.getMethodSigID() ?? method.getDeclareSigIDs()?.[0];
        if (id === undefined || id <= 0) {
            // Unreachable in normal flows: builders always set an implementation or declaration
            // signature before adding the method. Log loudly so violations surface immediately.
            logger.error(`Cannot add method '${method.getName()}' to class '${this.getName()}': it has no interned signature.`);
            return;
        }
        // The class index is authoritative: registering here (unconditionally) marks the final
        // winner of any same-signature merge chain performed by builders.
        this.registry.methodSigCanonicalizer.setModel(id, method);
        this.updateMethodIndex(method, id);
    }

    /**
     * Update the new method in the corresponding SigID index.
     *
     * @param newMethod - the new method
     * @param sigID - the formal MethodSigID (or first declare SigID) indexing the method
     */
    private updateMethodIndex(newMethod: ArkMethod, sigID: number): void {
        if (newMethod.isStatic()) {
            if (!ModelUtils.isLanguageOverloadSupport(this.getLanguage())) {
                // Non-overload languages: same-name methods replace each other in place,
                // preserving the index position of the first occurrence.
                const insertAt = this.removeStaticMethodsByName(newMethod.getName());
                this.insertTopStaticMethodSigID(sigID, insertAt);
            } else if (!this.replaceTopStaticMethodSigIDByMatch(newMethod)) {
                this.addTopStaticMethodSigID(sigID);
            }
            return;
        }
        if (!ModelUtils.isLanguageOverloadSupport(this.getLanguage())) {
            const insertAt = this.removeMethodsByName(newMethod.getName());
            this.insertTopMethodSigID(sigID, insertAt);
        } else if (!this.replaceTopMethodSigIDByMatch(newMethod)) {
            this.addTopMethodSigID(sigID);
        }
    }

    /**
     * Get all non-static methods with the same name.
     *
     * @param methodName - name of method
     * @returns an **array** of methods in the class.
     */
    public getMethodsWithName(methodName: string): ArkMethod[] {
        const arr = this.topMethodSigIDs;
        if (!arr) {
            return [];
        }
        const reg = this.registry;
        const result: ArkMethod[] = [];
        for (let i = 0; i < this.topMethodCount; i++) {
            const m = reg.methodSigCanonicalizer.getModel(arr[i]);
            if (m && ArkClass.methodMatchesName(m, methodName)) {
                result.push(m);
            }
        }
        return result;
    }

    /**
     * Get all static methods with the same name.
     *
     * @param methodName - name of method
     * @returns an **array** of methods in the class.
     */
    public getStaticMethodsWithName(methodName: string): ArkMethod[] {
        const arr = this.topStaticMethodSigIDs;
        if (!arr) {
            return [];
        }
        const reg = this.registry;
        const result: ArkMethod[] = [];
        for (let i = 0; i < this.topStaticMethodCount; i++) {
            const m = reg.methodSigCanonicalizer.getModel(arr[i]);
            if (m && ArkClass.methodMatchesName(m, methodName)) {
                result.push(m);
            }
        }
        return result;
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
        this.defaultMethodSigID = defaultMethod.getMethodSigID();
        this.addMethod(defaultMethod);
    }

    public getDefaultArkMethod(): ArkMethod | null {
        if (this.defaultMethodSigID === undefined) {
            return null;
        }
        return SignatureCanonicalizerRegistry.getInstance().methodSigCanonicalizer.getModel(this.defaultMethodSigID) ?? null;
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

    /**
     * Returns the static fields declared in this class.
     * @returns An **array** of static fields.
     */
    public getStaticFields(): ArkField[];
    /**
     * @deprecated The `classMap` parameter has never been used by this method — it is
     * a historical cross-class lookup input left over from the pre-ID era. Call the
     * no-argument overload {@link getStaticFields} instead.
     */
    public getStaticFields(classMap: Map<FileSignature | NamespaceSignature, ArkClass[]>): ArkField[];
    public getStaticFields(_classMap?: Map<FileSignature | NamespaceSignature, ArkClass[]>): ArkField[] {
        const arr = this.topStaticFieldSigIDs;
        if (!arr) {
            return [];
        }
        const reg = this.registry;
        const result: ArkField[] = [];
        for (let i = 0; i < this.topStaticFieldCount; i++) {
            const fld = reg.fieldSigCanonicalizer.getModel(arr[i]);
            if (fld) {
                result.push(fld);
            }
        }
        return result;
    }

    public getGlobalVariable(globalMap: Map<FileSignature | NamespaceSignature, Local[]>): Local[] {
        const ns = this.getDeclaringArkNamespace();
        if (ns) {
            return globalMap.get(ns.getNamespaceSignature())!;
        }
        return globalMap.get(this.getDeclaringArkFile().getFileSignature())!;
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

    /** @internal Returns the instance init method, or null if not set. */
    public getInstanceInitMethodOrNull(): ArkMethod | null {
        if (this.instanceInitMethodSigID === undefined) {
            return null;
        }
        return this.registry.methodSigCanonicalizer.getModel(this.instanceInitMethodSigID) ?? null;
    }

    /** @internal Returns the static init method, or null if not set. */
    public getStaticInitMethodOrNull(): ArkMethod | null {
        if (this.staticInitMethodSigID === undefined) {
            return null;
        }
        return this.registry.methodSigCanonicalizer.getModel(this.staticInitMethodSigID) ?? null;
    }

    /** @deprecated Use {@link getInstanceInitMethodOrNull} instead. */
    public getInstanceInitMethod(): ArkMethod {
        return this.getInstanceInitMethodOrNull() ?? new ArkMethod();
    }

    /** @deprecated Use {@link getStaticInitMethodOrNull} instead. */
    public getStaticInitMethod(): ArkMethod {
        return this.getStaticInitMethodOrNull() ?? new ArkMethod();
    }

    public setInstanceInitMethod(arkMethod: ArkMethod): void {
        this.instanceInitMethodSigID = arkMethod.getMethodSigID();
    }

    public setStaticInitMethod(arkMethod: ArkMethod): void {
        this.staticInitMethodSigID = arkMethod.getMethodSigID();
    }

    // --- Instance method SigID index ---

    /** @internal Returns the SigIDs of direct instance methods, or null if none exist. */
    public getTopMethodSigIDs(): Int32Array | null {
        return this.topMethodSigIDs?.subarray(0, this.topMethodCount) ?? null;
    }

    /** @internal Returns the number of direct instance methods. */
    public getTopMethodCount(): number {
        return this.topMethodCount;
    }

    /** @internal Checks whether a method with the given SigID is a direct instance method. */
    public hasTopMethodWithID(id: number): boolean {
        const arr = this.topMethodSigIDs;
        if (!arr) {
            return false;
        }
        const count = this.topMethodCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                return true;
            }
        }
        return false;
    }

    /** @internal Ensures the instance method Int32Array has at least minCapacity slots. */
    private ensureTopMethodCapacity(minCapacity: number): void {
        if (!this.topMethodSigIDs) {
            this.topMethodSigIDs = new Int32Array(Math.max(minCapacity, 8));
            return;
        }
        if (this.topMethodSigIDs.length < minCapacity) {
            const newCapacity = Math.max(minCapacity, this.topMethodSigIDs.length * 2);
            const newArray = new Int32Array(newCapacity);
            newArray.set(this.topMethodSigIDs.subarray(0, this.topMethodCount));
            this.topMethodSigIDs = newArray;
        }
    }

    /** @internal Appends an instance method SigID to the index. */
    private addTopMethodSigID(id: number): void {
        this.ensureTopMethodCapacity(this.topMethodCount + 1);
        this.topMethodSigIDs![this.topMethodCount++] = id;
    }

    /** @internal Inserts an instance method SigID at the given index (default append). */
    private insertTopMethodSigID(id: number, index: number): void {
        if (index < 0 || index >= this.topMethodCount) {
            this.addTopMethodSigID(id);
            return;
        }
        this.ensureTopMethodCapacity(this.topMethodCount + 1);
        const arr = this.topMethodSigIDs!;
        for (let i = this.topMethodCount; i > index; i--) {
            arr[i] = arr[i - 1];
        }
        arr[index] = id;
        this.topMethodCount++;
    }

    /** @internal Removes an instance method SigID from the index (swap-remove). */
    private removeTopMethodSigID(id: number): void {
        const arr = this.topMethodSigIDs;
        if (!arr) {
            return;
        }
        const count = this.topMethodCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                arr[i] = arr[--this.topMethodCount];
                return;
            }
        }
    }

    /** @internal Removes all instance methods whose name matches (exact or nested-origin prefix). Returns the first removed index, or -1. */
    private removeMethodsByName(name: string): number {
        const arr = this.topMethodSigIDs;
        if (!arr) {
            return -1;
        }
        const reg = this.registry;
        let firstIndex = -1;
        let i = 0;
        while (i < this.topMethodCount) {
            const m = reg.methodSigCanonicalizer.getModel(arr[i]);
            if (m && ArkClass.methodMatchesName(m, name)) {
                if (firstIndex === -1) {
                    firstIndex = i;
                }
                arr[i] = arr[--this.topMethodCount];
            } else {
                i++;
            }
        }
        return firstIndex;
    }

    /** @internal For overload-supported languages: replace the SigID of the same-signature instance method. Returns true if replaced. */
    private replaceTopMethodSigIDByMatch(newMethod: ArkMethod): boolean {
        const arr = this.topMethodSigIDs;
        if (!arr) {
            return false;
        }
        const reg = this.registry;
        const newSig = newMethod.getSignature();
        for (let i = 0; i < this.topMethodCount; i++) {
            const m = reg.methodSigCanonicalizer.getModel(arr[i]);
            if (m && m.getSignature().isMatch(newSig)) {
                arr[i] = newMethod.getMethodSigID() ?? newMethod.getDeclareSigIDs()?.[0] ?? arr[i];
                return true;
            }
        }
        return false;
    }

    // --- Static method SigID index ---

    /** @internal Returns the SigIDs of direct static methods, or null if none exist. */
    public getTopStaticMethodSigIDs(): Int32Array | null {
        return this.topStaticMethodSigIDs?.subarray(0, this.topStaticMethodCount) ?? null;
    }

    /** @internal Returns the number of direct static methods. */
    public getTopStaticMethodCount(): number {
        return this.topStaticMethodCount;
    }

    /** @internal Checks whether a method with the given SigID is a direct static method. */
    public hasTopStaticMethodWithID(id: number): boolean {
        const arr = this.topStaticMethodSigIDs;
        if (!arr) {
            return false;
        }
        const count = this.topStaticMethodCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                return true;
            }
        }
        return false;
    }

    /** @internal Ensures the static method Int32Array has at least minCapacity slots. */
    private ensureTopStaticMethodCapacity(minCapacity: number): void {
        if (!this.topStaticMethodSigIDs) {
            this.topStaticMethodSigIDs = new Int32Array(Math.max(minCapacity, 8));
            return;
        }
        if (this.topStaticMethodSigIDs.length < minCapacity) {
            const newCapacity = Math.max(minCapacity, this.topStaticMethodSigIDs.length * 2);
            const newArray = new Int32Array(newCapacity);
            newArray.set(this.topStaticMethodSigIDs.subarray(0, this.topStaticMethodCount));
            this.topStaticMethodSigIDs = newArray;
        }
    }

    /** @internal Appends a static method SigID to the index. */
    private addTopStaticMethodSigID(id: number): void {
        this.ensureTopStaticMethodCapacity(this.topStaticMethodCount + 1);
        this.topStaticMethodSigIDs![this.topStaticMethodCount++] = id;
    }

    /** @internal Inserts a static method SigID at the given index (default append). */
    private insertTopStaticMethodSigID(id: number, index: number): void {
        if (index < 0 || index >= this.topStaticMethodCount) {
            this.addTopStaticMethodSigID(id);
            return;
        }
        this.ensureTopStaticMethodCapacity(this.topStaticMethodCount + 1);
        const arr = this.topStaticMethodSigIDs!;
        for (let i = this.topStaticMethodCount; i > index; i--) {
            arr[i] = arr[i - 1];
        }
        arr[index] = id;
        this.topStaticMethodCount++;
    }

    /** @internal Removes a static method SigID from the index (swap-remove). */
    private removeTopStaticMethodSigID(id: number): void {
        const arr = this.topStaticMethodSigIDs;
        if (!arr) {
            return;
        }
        const count = this.topStaticMethodCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                arr[i] = arr[--this.topStaticMethodCount];
                return;
            }
        }
    }

    /** @internal Removes all static methods whose name matches (exact or nested-origin prefix). Returns the first removed index, or -1. */
    private removeStaticMethodsByName(name: string): number {
        const arr = this.topStaticMethodSigIDs;
        if (!arr) {
            return -1;
        }
        const reg = this.registry;
        let firstIndex = -1;
        let i = 0;
        while (i < this.topStaticMethodCount) {
            const m = reg.methodSigCanonicalizer.getModel(arr[i]);
            if (m && ArkClass.methodMatchesName(m, name)) {
                if (firstIndex === -1) {
                    firstIndex = i;
                }
                arr[i] = arr[--this.topStaticMethodCount];
            } else {
                i++;
            }
        }
        return firstIndex;
    }

    /** @internal For overload-supported languages: replace the SigID of the same-signature static method. Returns true if replaced. */
    private replaceTopStaticMethodSigIDByMatch(newMethod: ArkMethod): boolean {
        const arr = this.topStaticMethodSigIDs;
        if (!arr) {
            return false;
        }
        const reg = this.registry;
        const newSig = newMethod.getSignature();
        for (let i = 0; i < this.topStaticMethodCount; i++) {
            const m = reg.methodSigCanonicalizer.getModel(arr[i]);
            if (m && m.getSignature().isMatch(newSig)) {
                arr[i] = newMethod.getMethodSigID() ?? newMethod.getDeclareSigIDs()?.[0] ?? arr[i];
                return true;
            }
        }
        return false;
    }

    // --- Instance field SigID index ---

    /** @internal Returns the SigIDs of direct instance fields, or null if no fields exist. */
    public getTopFieldSigIDs(): Int32Array | null {
        return this.topFieldSigIDs?.subarray(0, this.topFieldCount) ?? null;
    }

    /** @internal Returns the number of direct instance fields. */
    public getTopFieldCount(): number {
        return this.topFieldCount;
    }

    /** @internal Checks whether a field with the given SigID is a direct instance field. */
    public hasTopFieldWithID(id: number): boolean {
        const arr = this.topFieldSigIDs;
        if (!arr) {
            return false;
        }
        const count = this.topFieldCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                return true;
            }
        }
        return false;
    }

    /** @internal Returns the direct instance field with the given SigID, or undefined. */
    public getTopFieldByID(id: number): ArkField | undefined {
        if (this.hasTopFieldWithID(id)) {
            return SignatureCanonicalizerRegistry.getInstance().getArkFieldById(id);
        }
        return undefined;
    }

    /** @internal Ensures the instance field Int32Array has at least minCapacity slots. */
    private ensureTopFieldCapacity(minCapacity: number): void {
        if (!this.topFieldSigIDs) {
            this.topFieldSigIDs = new Int32Array(Math.max(minCapacity, 8));
            return;
        }
        if (this.topFieldSigIDs.length < minCapacity) {
            const newCapacity = Math.max(minCapacity, this.topFieldSigIDs.length * 2);
            const newArray = new Int32Array(newCapacity);
            newArray.set(this.topFieldSigIDs.subarray(0, this.topFieldCount));
            this.topFieldSigIDs = newArray;
        }
    }

    /** @internal Appends an instance field SigID to the index. */
    private addTopFieldSigID(id: number): void {
        this.ensureTopFieldCapacity(this.topFieldCount + 1);
        this.topFieldSigIDs![this.topFieldCount++] = id;
    }

    /** @internal Removes an instance field SigID from the index (swap-remove). */
    private removeTopFieldSigID(id: number): void {
        const arr = this.topFieldSigIDs;
        if (!arr) {
            return;
        }
        const count = this.topFieldCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                arr[i] = arr[--this.topFieldCount];
                return;
            }
        }
    }

    // --- Static field SigID index ---

    /** @internal Returns the SigIDs of direct static fields, or null if no static fields exist. */
    public getTopStaticFieldSigIDs(): Int32Array | null {
        return this.topStaticFieldSigIDs?.subarray(0, this.topStaticFieldCount) ?? null;
    }

    /** @internal Returns the number of direct static fields. */
    public getTopStaticFieldCount(): number {
        return this.topStaticFieldCount;
    }

    /** @internal Checks whether a field with the given SigID is a direct static field. */
    public hasTopStaticFieldWithID(id: number): boolean {
        const arr = this.topStaticFieldSigIDs;
        if (!arr) {
            return false;
        }
        const count = this.topStaticFieldCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                return true;
            }
        }
        return false;
    }

    /** @internal Returns the direct static field with the given SigID, or undefined. */
    public getTopStaticFieldByID(id: number): ArkField | undefined {
        if (this.hasTopStaticFieldWithID(id)) {
            return SignatureCanonicalizerRegistry.getInstance().getArkFieldById(id);
        }
        return undefined;
    }

    /** @internal Ensures the static field Int32Array has at least minCapacity slots. */
    private ensureTopStaticFieldCapacity(minCapacity: number): void {
        if (!this.topStaticFieldSigIDs) {
            this.topStaticFieldSigIDs = new Int32Array(Math.max(minCapacity, 8));
            return;
        }
        if (this.topStaticFieldSigIDs.length < minCapacity) {
            const newCapacity = Math.max(minCapacity, this.topStaticFieldSigIDs.length * 2);
            const newArray = new Int32Array(newCapacity);
            newArray.set(this.topStaticFieldSigIDs.subarray(0, this.topStaticFieldCount));
            this.topStaticFieldSigIDs = newArray;
        }
    }

    /** @internal Appends a static field SigID to the index. */
    private addTopStaticFieldSigID(id: number): void {
        this.ensureTopStaticFieldCapacity(this.topStaticFieldCount + 1);
        this.topStaticFieldSigIDs![this.topStaticFieldCount++] = id;
    }

    /** @internal Removes a static field SigID from the index (swap-remove). */
    private removeTopStaticFieldSigID(id: number): void {
        const arr = this.topStaticFieldSigIDs;
        if (!arr) {
            return;
        }
        const count = this.topStaticFieldCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                arr[i] = arr[--this.topStaticFieldCount];
                return;
            }
        }
    }

    // --- Extended class (subclass back-reference) SigID index ---

    /** @internal Returns the ClassSigIDs of direct subclasses, or null if none exist. */
    public getExtendedClassSigIDs(): Int32Array | null {
        return this.extendedClassSigIDs?.subarray(0, this.extendedClassCount) ?? null;
    }

    /** @internal Returns the number of direct subclasses. */
    public getExtendedClassCount(): number {
        return this.extendedClassCount;
    }

    /** @internal Checks whether a class with the given ClassSigID is a direct subclass. */
    public hasExtendedClassWithID(id: number): boolean {
        const arr = this.extendedClassSigIDs;
        if (!arr) {
            return false;
        }
        const count = this.extendedClassCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                return true;
            }
        }
        return false;
    }

    /** @internal Ensures the extended class Int32Array has at least minCapacity slots. */
    private ensureExtendedClassCapacity(minCapacity: number): void {
        if (!this.extendedClassSigIDs) {
            this.extendedClassSigIDs = new Int32Array(Math.max(minCapacity, 8));
            return;
        }
        if (this.extendedClassSigIDs.length < minCapacity) {
            const newCapacity = Math.max(minCapacity, this.extendedClassSigIDs.length * 2);
            const newArray = new Int32Array(newCapacity);
            newArray.set(this.extendedClassSigIDs.subarray(0, this.extendedClassCount));
            this.extendedClassSigIDs = newArray;
        }
    }

    /** @internal Appends a subclass ClassSigID to the index. */
    private addExtendedClassSigID(id: number): void {
        this.ensureExtendedClassCapacity(this.extendedClassCount + 1);
        this.extendedClassSigIDs![this.extendedClassCount++] = id;
    }

    /** @internal Removes a subclass ClassSigID from the index (swap-remove). */
    private removeExtendedClassSigID(id: number): void {
        const arr = this.extendedClassSigIDs;
        if (!arr) {
            return;
        }
        const count = this.extendedClassCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                arr[i] = arr[--this.extendedClassCount];
                return;
            }
        }
    }

    public removeField(field: ArkField): boolean {
        const id = field.getFieldSigID();
        if (field.isStatic()) {
            const rtn = this.hasTopStaticFieldWithID(id);
            if (rtn) {
                this.removeTopStaticFieldSigID(id);
                SignatureCanonicalizerRegistry.removeField(field);
            }
            return rtn;
        }
        const rtn = this.hasTopFieldWithID(id);
        if (rtn) {
            this.removeTopFieldSigID(id);
            SignatureCanonicalizerRegistry.removeField(field);
        }
        return rtn;
    }

    public removeMethod(method: ArkMethod): boolean {
        // Remove exactly this method (by its index SigID), not all same-name siblings.
        const id = method.getMethodSigID() ?? method.getDeclareSigIDs()?.[0] ?? -1;
        let rtn: boolean = false;
        if (method.isStatic()) {
            rtn = this.hasTopStaticMethodWithID(id);
            if (rtn) {
                this.removeTopStaticMethodSigID(id);
            }
        } else {
            rtn = this.hasTopMethodWithID(id);
            if (rtn) {
                this.removeTopMethodSigID(id);
            }
        }
        rtn &&= SignatureCanonicalizerRegistry.removeMethod(method);
        return rtn;
    }

    public validate(): ArkError {
        return this.validateFields(['declaringFileID']);
    }

    public addTs2cxxFuncMapElement(funcName: string, methods: ArkMethod[]): void {
        this.ts2cxxFuncMap.set(funcName, methods);
    }

    public getTs2cxxFuncMap(): Map<string, ArkMethod[]> {
        return this.ts2cxxFuncMap;
    }

    public getDeclareSignature(): ClassSignature | undefined {
        return this.classDeclareSignature;
    }

    public setDeclareSignature(classSig: ClassSignature): void {
        this.classDeclareSignature = classSig;
    }

    public clearAllReferences(): void {
        const reg = this.registry;
        const arr = this.topMethodSigIDs;
        if (arr) {
            for (let i = 0; i < this.topMethodCount; i++) {
                reg.methodSigCanonicalizer.getModel(arr[i])?.clearAllReferences();
            }
        }
        const sArr = this.topStaticMethodSigIDs;
        if (sArr) {
            for (let i = 0; i < this.topStaticMethodCount; i++) {
                reg.methodSigCanonicalizer.getModel(sArr[i])?.clearAllReferences();
            }
        }
        for (const fld of this.getFields()) {
            fld.clearAllReferences();
        }
        const instanceInit = this.getInstanceInitMethodOrNull();
        if (instanceInit) {
            instanceInit.clearAllReferences();
        }
        const staticInit = this.getStaticInitMethodOrNull();
        if (staticInit) {
            staticInit.clearAllReferences();
        }
        this.topMethodSigIDs = undefined;
        this.topMethodCount = 0;
        this.topStaticMethodSigIDs = undefined;
        this.topStaticMethodCount = 0;
        this.topFieldSigIDs = undefined;
        this.topFieldCount = 0;
        this.topStaticFieldSigIDs = undefined;
        this.topStaticFieldCount = 0;
        this.extendedClassSigIDs = undefined;
        this.extendedClassCount = 0;
        this.heritageClasses.clear();
        this.ts2cxxFuncMap.clear();
        this.defaultMethodSigID = undefined;
        this.instanceInitMethodSigID = undefined;
        this.staticInitMethodSigID = undefined;
        this.viewTree = undefined;
        this.declaringFileID = -1;
        this.declaringNamespaceSigID = undefined;
    }
}
