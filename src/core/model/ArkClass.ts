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
const forEachMethodSeenScratch: ArkMethod[] = [];
let forEachMethodSeenTop = 0;
const forEachMethodOverflow: Array<Set<ArkMethod> | undefined> = [];
let forEachMethodDepth = 0;
const SEEN_LINEAR_LIMIT = 32;

function markSeen(base: number, depth: number, method: ArkMethod): boolean {
    const overflow = forEachMethodOverflow[depth];
    if (overflow !== undefined) {
        if (overflow.has(method)) {
            return true;
        }
        overflow.add(method);
        return false;
    }
    for (let i = base; i < forEachMethodSeenTop; i++) {
        if (forEachMethodSeenScratch[i] === method) {
            return true;
        }
    }
    if (forEachMethodSeenTop - base >= SEEN_LINEAR_LIMIT) {
        const promoted = new Set<ArkMethod>();
        for (let i = base; i < forEachMethodSeenTop; i++) {
            promoted.add(forEachMethodSeenScratch[i]);
        }
        promoted.add(method);
        forEachMethodOverflow[depth] = promoted;
        return false;
    }
    forEachMethodSeenScratch[forEachMethodSeenTop++] = method;
    return false;
}

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

    /**
     * @internal Name index of direct instance methods: full method name → selected SigIDs
     * (impl SigID, or the first declare SigID for declare-only methods), in add order.
     * One entry per method; same-name coexistence only for overload-supported languages (CXX).
     * undefined = no instance methods yet.
     */
    private methodNameIndex?: Map<string, number[]>;

    /**
     * @internal Name index of direct static methods. Same layout as {@link methodNameIndex}.
     * undefined = no static methods yet.
     */
    private staticMethodNameIndex?: Map<string, number[]>;

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
        this.classSigID = existing >= 0 ? existing : this.registry.classSigCanonicalizer.getOrCreateId(classSig);
        // 新值首建 → 注册；
        // 驱逐态恢复（sig 值残留、model 已被 removeClass 删除）→ 补注册（否则 reload 时 getDeclaringArkClass 查不到 model，genDefaultArkMethod 链 NPE）；
        // 已有别的 model 持有该签名 → 不覆盖（防"后 setSignature 者顶替"写穿）。
        if (existing < 0 || this.registry.classSigCanonicalizer.getModel(existing) === undefined) {
            this.registry.registerClass(this);
        }
    }

    /** @internal Get the formal ClassSigID of this class. */
    public getClassSigID(): number {
        return this.classSigID;
    }

    /**
     * Returns the unique ID of this model — the ClassSigID in the canonicalizer.
     * The signature table and the model table share one dense ID space, so this ID
     * resolves both the signature and the model.
     */
    public getId(): number {
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

    /** @deprecated No callers remain in the codebase; no replacement. */
    public hasImplementedInterface(interfaceName: string): boolean {
        return this.heritageClasses.has(interfaceName) && this.getSuperClassName() !== interfaceName;
    }

    /** @deprecated No callers remain in the codebase; no replacement. */
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
        const id = this.registry.fieldSigCanonicalizer.getExistingId(FieldSignature.probe(fieldName, this.classSigID, UnknownType.getInstance(), false));
        if (id !== -1) {
            return this.registry.fieldSigCanonicalizer.getModel(id) ?? null;
        }
        return null;
    }

    public getStaticFieldWithName(fieldName: string): ArkField | null {
        // 同 getFieldWithName，staticFlag = true。
        const id = this.registry.fieldSigCanonicalizer.getExistingId(FieldSignature.probe(fieldName, this.classSigID, UnknownType.getInstance(), true));
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
                this.addTopStaticFieldSigID(id);
            }
        } else {
            if (!this.hasTopFieldWithID(id)) {
                this.addTopFieldSigID(id);
            }
        }
    }

    /** @deprecated No callers remain in the codebase; use {@link addField} per field instead. */
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
        const ids = new Set<number>();
        for (const entry of this.methodNameIndex?.values() ?? []) {
            for (const id of entry) {
                ids.add(id);
            }
        }
        for (const entry of this.staticMethodNameIndex?.values() ?? []) {
            for (const id of entry) {
                ids.add(id);
            }
        }
        const seen = new Set<ArkMethod>();
        const result: ArkMethod[] = [];
        for (const id of ids) {
            const m = this.registry.methodSigCanonicalizer.getModel(id);
            if (m !== undefined && (generated || !m.isGenerated()) && !seen.has(m)) {
                seen.add(m);
                result.push(m);
            }
        }
        return result;
    }

    /**
     * @internal Iterates the class methods in {@link getMethods} order without building the
     * result array. Dedup uses a module-level scratch segment with base/top discipline instead
     * of a per-call Set: each invocation appends its yielded methods above the current top and
     * pops (nulling) its segment on exit, which keeps the walk reentrant - a callback may call
     * forEachMethod again without disturbing the outer dedup - and allocation-free per call.
     * Return false from the callback to stop early. Use getMethods when the caller needs the
     * array itself (e.g. to sort it).
     */
    public forEachMethod(callback: (method: ArkMethod) => boolean, generated?: boolean): void {
        const canonicalizer = this.registry.methodSigCanonicalizer;
        const base = forEachMethodSeenTop;
        const depth = forEachMethodDepth++;
        try {
            let earlyExit = false;
            const index = this.methodNameIndex;
            if (index !== undefined) {
                for (const entry of index.values()) {
                    for (let i = 0; i < entry.length; i++) {
                        const m = canonicalizer.getModel(entry[i]);
                        if (m !== undefined && (generated || !m.isGenerated()) && !markSeen(base, depth, m)) {
                            if (!callback(m)) {
                                earlyExit = true;
                                break;
                            }
                        }
                    }
                    if (earlyExit) {
                        break;
                    }
                }
            }
            const staticIndex = this.staticMethodNameIndex;
            if (!earlyExit && staticIndex !== undefined) {
                for (const entry of staticIndex.values()) {
                    for (let i = 0; i < entry.length; i++) {
                        const m = canonicalizer.getModel(entry[i]);
                        if (m !== undefined && (generated || !m.isGenerated()) && !markSeen(base, depth, m)) {
                            if (!callback(m)) {
                                earlyExit = true;
                                break;
                            }
                        }
                    }
                    if (earlyExit) {
                        break;
                    }
                }
            }
        } finally {
            forEachMethodDepth = depth;
            if (forEachMethodOverflow[depth] !== undefined) {
                forEachMethodOverflow[depth] = undefined;
            }
            const nullMethod = null as unknown as ArkMethod;
            for (let i = base; i < forEachMethodSeenTop; i++) {
                forEachMethodSeenScratch[i] = nullMethod;
            }
            forEachMethodSeenTop = base;
        }
    }

    /**
     * @internal Iterates the methods whose names mark them as nested inside `outerMethodName`
     * (NAME_PREFIX ... NAME_DELIMITER + outerMethodName), in the same order and with the same
     * dedup as an equivalent filtered {@link forEachMethod} walk, but scanning the name-index
     * keys as strings and resolving models only for hits - no per-call Set and no O(class)
     * model resolution, which mattered for large SDK classes walked once per outer method.
     */
    public forEachNestedMethodOf(outerMethodName: string, callback: (method: ArkMethod) => boolean): void {
        const suffix = NAME_DELIMITER + outerMethodName;
        const canonicalizer = this.registry.methodSigCanonicalizer;
        const base = forEachMethodSeenTop;
        const depth = forEachMethodDepth++;
        try {
            let stop = false;
            for (let pass = 0; pass < 2 && !stop; pass++) {
                const index = pass === 0 ? this.methodNameIndex : this.staticMethodNameIndex;
                if (index === undefined) {
                    continue;
                }
                for (const name of index.keys()) {
                    if (!name.startsWith(NAME_PREFIX) || !name.endsWith(suffix)) {
                        continue;
                    }
                    const ids = index.get(name)!;
                    for (let i = 0; i < ids.length; i++) {
                        const m = canonicalizer.getModel(ids[i]);
                        if (m !== undefined && !m.isGenerated() && !markSeen(base, depth, m)) {
                            if (!callback(m)) {
                                stop = true;
                                break;
                            }
                        }
                    }
                    if (stop) {
                        break;
                    }
                }
            }
        } finally {
            forEachMethodDepth = depth;
            if (forEachMethodOverflow[depth] !== undefined) {
                forEachMethodOverflow[depth] = undefined;
            }
            const nullMethod = null as unknown as ArkMethod;
            for (let i = base; i < forEachMethodSeenTop; i++) {
                forEachMethodSeenScratch[i] = nullMethod;
            }
            forEachMethodSeenTop = base;
        }
    }

    public getMethod(methodSignature: MethodSignature): ArkMethod | null {
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
        //    → 全槽注册后 declare 槽已注册，此缺口关闭；
        // ② 闭包 declare 重建签名（updateNestedMethodWithClosures 只 intern 不注册）；
        // ③ C++ 跨类借用（声明方法借实现侧签名，fast path 归属校验失败后在此命中）。
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
        const ids = this.methodNameIndex?.get(methodName);
        if (ids === undefined || ids.length === 0) {
            return null;
        }
        const reg = this.registry;
        let first: ArkMethod | null = null;
        let resolved = 0;
        for (let i = 0; i < ids.length; i++) {
            const m = reg.methodSigCanonicalizer.getModel(ids[i]);
            if (m) {
                resolved++;
                if (first === null) {
                    first = m;
                }
            }
        }
        if (resolved > 1) {
            logger.warn(
                "There are multiple non-static methods with the same name, and the interface 'getMethodWithName' only returns one of them. " +
                    "If you want to obtain all non-static methods with the same name, please use the interface 'getMethodsWithName'."
            );
        }
        return first;
    }

    public getStaticMethodWithName(methodName: string): ArkMethod | null {
        const ids = this.staticMethodNameIndex?.get(methodName);
        if (ids === undefined || ids.length === 0) {
            return null;
        }
        const reg = this.registry;
        let first: ArkMethod | null = null;
        let resolved = 0;
        for (let i = 0; i < ids.length; i++) {
            const m = reg.methodSigCanonicalizer.getModel(ids[i]);
            if (m) {
                resolved++;
                if (first === null) {
                    first = m;
                }
            }
        }
        if (resolved > 1) {
            logger.warn(
                "There are multiple static methods with the same name, and the interface 'getStaticMethodWithName' only returns one of them. " +
                    "If you want to obtain all static methods with the same name, please use the interface 'getStaticMethodsWithName'."
            );
        }
        return first;
    }

    /**
     * add a method in class.
     */
    public addMethod(method: ArkMethod): void {
        const id = method.getMethodSigID() ?? method.getDeclareSigIDs()?.[0];
        if (id === undefined || id <= 0) {
            logger.error(`Cannot add method (SigID=${method.getMethodSigID()}) to class (SigID=${this.getClassSigID()}): it has no interned signature.`);
            return;
        }
        const canonicalizer = this.registry.methodSigCanonicalizer;
        // The class index is authoritative: registering here (unconditionally) marks the final
        // winner of any same-signature merge chain performed by builders.
        canonicalizer.setModel(id, method);
        const declareSigIDs = method.getDeclareSigIDs();
        if (declareSigIDs !== null && declareSigIDs !== undefined) {
            for (let i = 0; i < declareSigIDs.length; i++) {
                const declareID = declareSigIDs[i];
                if (declareID > 0 && declareID !== id) {
                    this.registerDeclareSlotWithArbitration(canonicalizer, declareID, method);
                }
            }
        }
        this.updateMethodIndex(method, id);
    }

    /**
     * @internal Register a method as the model of one of its non-primary declare slots.
     *
     * Arbitration (single rule, no same-class sibling protection — addMethod is the
     * terminal registration point where the merge winner must take over same-class
     * declare slots; compare registerImplModelWithArbitration in ArkMethod for the
     * construction-time rules):
     * - a slot already held by a body-carrying method is never taken over by a
     *   body-less one (C++ decl/impl split added in reverse order).
     */
    private registerDeclareSlotWithArbitration(
        canonicalizer: { getModel(id: number): ArkMethod | undefined; setModel(id: number, model: ArkMethod): void },
        declareID: number,
        method: ArkMethod
    ): void {
        const existing = canonicalizer.getModel(declareID);
        if (existing !== undefined && existing !== method) {
            if (existing.getBody() !== undefined && method.getBody() === undefined) {
                return;
            }
        }
        canonicalizer.setModel(declareID, method);
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
                // Non-overload languages: same-name methods replace each other. set() on an
                // existing key keeps its insertion position, so the first-occurrence order
                // of getMethods is stable across same-name re-adds.
                this.setStaticMethodNameEntry(newMethod.getName(), sigID);
            } else if (!this.replaceTopStaticMethodSigIDByMatch(newMethod)) {
                this.appendStaticMethodNameEntry(newMethod.getName(), sigID);
            }
            return;
        }
        if (!ModelUtils.isLanguageOverloadSupport(this.getLanguage())) {
            this.setMethodNameEntry(newMethod.getName(), sigID);
        } else if (!this.replaceTopMethodSigIDByMatch(newMethod)) {
            this.appendMethodNameEntry(newMethod.getName(), sigID);
        }
    }

    /**
     * Get all non-static methods with the same name.
     *
     * @param methodName - name of method
     * @returns an **array** of methods in the class.
     */
    public getMethodsWithName(methodName: string): ArkMethod[] {
        const ids = this.methodNameIndex?.get(methodName);
        if (ids === undefined || ids.length === 0) {
            return [];
        }
        const reg = this.registry;
        const result: ArkMethod[] = [];
        for (let i = 0; i < ids.length; i++) {
            const m = reg.methodSigCanonicalizer.getModel(ids[i]);
            if (m) {
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
        const ids = this.staticMethodNameIndex?.get(methodName);
        if (ids === undefined || ids.length === 0) {
            return [];
        }
        const reg = this.registry;
        const result: ArkMethod[] = [];
        for (let i = 0; i < ids.length; i++) {
            const m = reg.methodSigCanonicalizer.getModel(ids[i]);
            if (m) {
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

    /** @deprecated No callers remain in the codebase; no replacement. */
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

    /** @deprecated No callers remain in the codebase; no replacement. */
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

    // --- Instance/static method name index ---

    /** @internal Returns the instance method name index, or undefined if no instance methods exist. */
    public getMethodNameIndex(): Map<string, number[]> | undefined {
        return this.methodNameIndex;
    }

    /** @internal Returns the static method name index, or undefined if no static methods exist. */
    public getStaticMethodNameIndex(): Map<string, number[]> | undefined {
        return this.staticMethodNameIndex;
    }

    /** @internal Appends the SigID under the method name in the instance index. */
    private appendMethodNameEntry(name: string, id: number): void {
        const ids = this.methodNameIndex?.get(name);
        if (ids !== undefined) {
            ids.push(id);
            return;
        }
        (this.methodNameIndex ??= new Map<string, number[]>()).set(name, [id]);
    }

    /** @internal Appends the SigID under the method name in the static index. */
    private appendStaticMethodNameEntry(name: string, id: number): void {
        const ids = this.staticMethodNameIndex?.get(name);
        if (ids !== undefined) {
            ids.push(id);
            return;
        }
        (this.staticMethodNameIndex ??= new Map<string, number[]>()).set(name, [id]);
    }

    /**
     * @internal Sets the instance method name entry to a single SigID. Overwrites any
     * previous same-name entry; set() on an existing key preserves its insertion position
     * (non-overload same-name replacement keeps the first-occurrence order).
     */
    private setMethodNameEntry(name: string, id: number): void {
        (this.methodNameIndex ??= new Map<string, number[]>()).set(name, [id]);
    }

    /**
     * @internal Sets the static method name entry to a single SigID. See {@link setMethodNameEntry}.
     */
    private setStaticMethodNameEntry(name: string, id: number): void {
        (this.staticMethodNameIndex ??= new Map<string, number[]>()).set(name, [id]);
    }

    /**
     * @internal For overload-supported languages: replace the SigID of the same-signature
     * instance method in place. Returns true if replaced.
     */
    private replaceTopMethodSigIDByMatch(newMethod: ArkMethod): boolean {
        const index = this.methodNameIndex;
        if (!index) {
            return false;
        }
        const reg = this.registry;
        const newSig = newMethod.getSignature();
        const newID = newMethod.getMethodSigID() ?? newMethod.getDeclareSigIDs()?.[0];
        if (newID === undefined) {
            return false;
        }
        for (const ids of index.values()) {
            for (let i = 0; i < ids.length; i++) {
                const m = reg.methodSigCanonicalizer.getModel(ids[i]);
                if (m && m.getSignature().isMatch(newSig)) {
                    ids[i] = newID;
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * @internal For overload-supported languages: replace the SigID of the same-signature
     * static method in place. Returns true if replaced.
     */
    private replaceTopStaticMethodSigIDByMatch(newMethod: ArkMethod): boolean {
        const index = this.staticMethodNameIndex;
        if (!index) {
            return false;
        }
        const reg = this.registry;
        const newSig = newMethod.getSignature();
        const newID = newMethod.getMethodSigID() ?? newMethod.getDeclareSigIDs()?.[0];
        if (newID === undefined) {
            return false;
        }
        for (const ids of index.values()) {
            for (let i = 0; i < ids.length; i++) {
                const m = reg.methodSigCanonicalizer.getModel(ids[i]);
                if (m && m.getSignature().isMatch(newSig)) {
                    ids[i] = newID;
                    return true;
                }
            }
        }
        return false;
    }

    /** @internal Removes the SigID of one instance method from the index (exact ID match). Returns true if it was held. */
    private removeTopMethodSigID(id: number): boolean {
        const index = this.methodNameIndex;
        if (!index) {
            return false;
        }
        for (const [name, ids] of index) {
            const i = ids.indexOf(id);
            if (i >= 0) {
                if (ids.length === 1) {
                    index.delete(name);
                } else {
                    ids.splice(i, 1);
                }
                return true;
            }
        }
        return false;
    }

    /** @internal Removes the SigID of one static method from the index (exact ID match). Returns true if it was held. */
    private removeTopStaticMethodSigID(id: number): boolean {
        const index = this.staticMethodNameIndex;
        if (!index) {
            return false;
        }
        for (const [name, ids] of index) {
            const i = ids.indexOf(id);
            if (i >= 0) {
                if (ids.length === 1) {
                    index.delete(name);
                } else {
                    ids.splice(i, 1);
                }
                return true;
            }
        }
        return false;
    }

    // --- Instance field SigID index ---

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
                this.registry.removeField(field);
            }
            return rtn;
        }
        const rtn = this.hasTopFieldWithID(id);
        if (rtn) {
            this.removeTopFieldSigID(id);
            this.registry.removeField(field);
        }
        return rtn;
    }

    public removeMethod(method: ArkMethod): boolean {
        // Remove exactly this method (by its index SigID), not all same-name siblings.
        const id = method.getMethodSigID() ?? method.getDeclareSigIDs()?.[0] ?? -1;
        let rtn: boolean = false;
        if (method.isStatic()) {
            rtn = this.removeTopStaticMethodSigID(id);
        } else {
            rtn = this.removeTopMethodSigID(id);
        }
        rtn &&= this.registry.removeMethod(method);
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
        const index = this.methodNameIndex;
        if (index) {
            for (const ids of index.values()) {
                for (let i = 0; i < ids.length; i++) {
                    reg.methodSigCanonicalizer.getModel(ids[i])?.clearAllReferences();
                }
            }
        }
        const staticIndex = this.staticMethodNameIndex;
        if (staticIndex) {
            for (const ids of staticIndex.values()) {
                for (let i = 0; i < ids.length; i++) {
                    reg.methodSigCanonicalizer.getModel(ids[i])?.clearAllReferences();
                }
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
        this.methodNameIndex = undefined;
        this.staticMethodNameIndex = undefined;
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
