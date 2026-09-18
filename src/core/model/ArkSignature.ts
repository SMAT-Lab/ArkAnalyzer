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

import { transfer2UnixPath } from '../../utils/pathTransfer';
import { ClassType, Type, UnknownType } from '../base/Type';
import { MethodParameter } from './builder/ArkMethodBuilder';
import {
    ANONYMOUS_CLASS_PREFIX,
    LEXICAL_ENV_NAME_PREFIX,
    NAME_DELIMITER,
    NESTED_CLASS_METHOD_DELIMITER,
    UNKNOWN_CLASS_NAME,
    UNKNOWN_NAMESPACE_NAME,
} from '../common/Const';
import { SignatureCanonicalizerRegistry } from '../common/SignatureCanonicalizerRegistry';
import { signatureEquals } from '../common/SignatureCanonicalizer';
import { hashCombineU32, hashString32 } from '../../utils/HashUtils';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';

export type Signature = FileSignature | NamespaceSignature | ClassSignature | MethodSignature | FieldSignature | LocalSignature | AliasTypeSignature;

export interface ArkSignature {
    getSignature(): Signature;
}

/**
 * @category core/model
 */
export class FileSignature {
    private projectName: string;
    private fileName: string;
    private readonly hashCode: number;

    /** The canonical DEFAULT signature (formal sigID 0 in the registry). */
    public static get DEFAULT(): FileSignature {
        return SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.get(0)!;
    }

    constructor(projectName: string, fileName: string) {
        this.projectName = projectName;
        this.fileName = transfer2UnixPath(fileName);
        let h = 0xdeadbeef;
        h = hashCombineU32(h, hashString32(this.projectName));
        h = hashCombineU32(h, hashString32(this.fileName));
        this.hashCode = h >>> 0;
    }

    public getProjectName(): string {
        return this.projectName;
    }

    public getFileName(): string {
        return this.fileName;
    }

    public toString(): string {
        return `@${this.projectName}/${this.fileName}: `;
    }

    /**
     * @deprecated No longer used internally since the ID refactor: identity comparison
     * uses {@link signatureEquals} (hash + equals), indexing uses the canonicalizer.
     * Kept for backward compatibility only — for identity checks use `equals()`
     * (with `getHashCode()` fast reject), for debug output use `toString()`.
     *
     * Implementation note: identity projection (= toString, projectName + fileName are the complete identity fields) — collision-free.
     */
    public toMapKey(): string {
        return this.toString();
    }

    public getHashCode(): number {
        return this.hashCode;
    }

    public equals(other: FileSignature): boolean {
        if (this === other) {
            return true;
        }
        return this.projectName === other.projectName && this.fileName === other.fileName;
    }

    /** @internal FileSignature is never unclear (it is the identity root). */
    public isUnclear(): boolean {
        return false;
    }
}

export class NamespaceSignature {
    private namespaceName: string;
    /** @internal Formal FileSigID for the declaring file. */
    private declaringFileSigID: number;
    /** @internal Formal NamespaceSigID for the declaring namespace. undefined = none (top-level). */
    private declaringNamespaceSigID?: number;
    private readonly hashCode: number;

    private static readonly logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'NamespaceSignature');

    /** The canonical DEFAULT signature (formal sigID 0 in the registry). */
    public static get DEFAULT(): NamespaceSignature {
        return SignatureCanonicalizerRegistry.getInstance().namespaceSigCanonicalizer.get(0)!;
    }

    /**
     * Build from signature instances (backward-compatible value constructor).
     * @deprecated Pass formal SigIDs instead (e.g. via ArkFile.getFileSigID() /
     * ArkNamespace.getNamespaceSigID()). The declaring signatures must already be
     * interned — this overload resolves their existing IDs and fails fast otherwise
     * (it never interns) — and will be removed in a future release.
     */
    constructor(namespaceName: string, declaringFileSignature: FileSignature, declaringNamespaceSignature?: NamespaceSignature | null);
    /**
     * Build directly from formal SigIDs (must already be interned in the registry).
     * This path has no registry dependency and is used by internal bootstrap code.
     */
    constructor(namespaceName: string, declaringFileSigID: number, declaringNamespaceSigID?: number);
    constructor(namespaceName: string, declaringFileOrID: FileSignature | number, declaringNSOrID?: NamespaceSignature | null | number) {
        function computeHashCode(fileId: number, namespaceName: string, declaringNSId?: number): number {
            let h = 0xdeadbeef;
            h = hashCombineU32(h, fileId);
            h = hashCombineU32(h, hashString32(namespaceName));
            h = hashCombineU32(h, declaringNSId ?? 0);
            return h >>> 0;
        }

        this.namespaceName = namespaceName;
        if (typeof declaringFileOrID === 'number') {
            this.declaringFileSigID = declaringFileOrID;
            this.declaringNamespaceSigID = typeof declaringNSOrID === 'number' ? declaringNSOrID : undefined;
            this.hashCode = computeHashCode(this.declaringFileSigID, this.namespaceName, this.declaringNamespaceSigID);
            return;
        }
        const reg = SignatureCanonicalizerRegistry.getInstance();
        let fileSigID: number;
        let nsSigID: number | undefined;

        // FileSignature 永不 unclear——身份根。
        const fileExistingId = reg.fileSigCanonicalizer.getExistingId(declaringFileOrID);
        if (fileExistingId !== -1) {
            fileSigID = fileExistingId;
        } else {
            NamespaceSignature.logger.error(`Clear FileSignature declaring not interned — defaulting to ID 0: ${declaringFileOrID.toString()}`);
            fileSigID = 0;
        }
        // namespace 无 temp 空间。
        if (declaringNSOrID instanceof NamespaceSignature) {
            if (declaringNSOrID.isUnclear()) {
                NamespaceSignature.logger.error(`Unclear NamespaceSignature — marking -1: ${declaringNSOrID.toString()}`);
                nsSigID = -1;
            } else {
                const nsExistingId = reg.namespaceSigCanonicalizer.getExistingId(declaringNSOrID);
                if (nsExistingId !== -1) {
                    nsSigID = nsExistingId;
                } else {
                    NamespaceSignature.logger.error(`Clear NamespaceSignature declaring not interned — marking -1: ${declaringNSOrID.toString()}`);
                    nsSigID = -1;
                }
            }
        }
        this.declaringFileSigID = fileSigID;
        this.declaringNamespaceSigID = nsSigID;
        this.hashCode = computeHashCode(this.declaringFileSigID, this.namespaceName, this.declaringNamespaceSigID);
    }

    public getNamespaceName(): string {
        return this.namespaceName;
    }

    /** @internal Get the formal NamespaceSigID of this signature (interning it if needed). */
    public getNamespaceSigID(): number {
        return SignatureCanonicalizerRegistry.getInstance().namespaceSigCanonicalizer.getExistingId(this);
    }

    public getDeclaringFileSignature(): FileSignature {
        const sig = SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.get(this.declaringFileSigID);
        if (sig !== undefined) {
            return sig;
        }
        // Stale SigID (registry disposed and rebuilt): degrade to DEFAULT instead of crashing.
        NamespaceSignature.logger.error(
            `NamespaceSignature '${this.namespaceName}' has a stale declaring file SigID ${this.declaringFileSigID}; returning DEFAULT.`
        );
        return FileSignature.DEFAULT;
    }

    /** @internal Get the formal FileSigID of the declaring file. (Renamed from
     * getDeclaringFileSigId to align the casing with ClassSignature/getFileSigID.) */
    public getDeclaringFileSigID(): number {
        return this.declaringFileSigID;
    }

    /** @internal Get the formal NamespaceSigID of the declaring namespace. undefined = top-level. */
    public getDeclaringNamespaceSigID(): number | undefined {
        return this.declaringNamespaceSigID;
    }

    public getDeclaringNamespaceSignature(): NamespaceSignature | null {
        if (this.declaringNamespaceSigID === undefined) {
            return null;
        }
        const sig = SignatureCanonicalizerRegistry.getInstance().namespaceSigCanonicalizer.get(this.declaringNamespaceSigID);
        if (sig !== undefined) {
            return sig;
        }
        // Stale SigID (registry disposed and rebuilt): degrade to DEFAULT instead of crashing.
        NamespaceSignature.logger.error(
            `NamespaceSignature '${this.namespaceName}' has a stale declaring namespace SigID ${this.declaringNamespaceSigID}; returning DEFAULT.`
        );
        return NamespaceSignature.DEFAULT;
    }

    public toString(): string {
        const declaringNS = this.getDeclaringNamespaceSignature();
        if (declaringNS !== null) {
            return declaringNS.toString() + '.' + this.namespaceName;
        }
        return this.getDeclaringFileSignature().toString() + this.namespaceName;
    }

    /**
     * @deprecated No longer used internally since the ID refactor: identity comparison
     * uses {@link signatureEquals} (hash + equals), indexing uses the canonicalizer.
     * Kept for backward compatibility only — for identity checks use `equals()`
     * (with `getHashCode()` fast reject), for debug output use `toString()`.
     */
    public toMapKey(): string {
        const declaringNS = this.getDeclaringNamespaceSignature();
        if (declaringNS !== null) {
            return declaringNS.toMapKey() + '.' + this.namespaceName;
        }
        return this.getDeclaringFileSignature().toMapKey() + this.namespaceName;
    }

    public getHashCode(): number {
        return this.hashCode;
    }

    public equals(other: NamespaceSignature): boolean {
        if (this === other) {
            return true;
        }
        if (this.namespaceName !== other.namespaceName) {
            return false;
        }
        if (this.declaringFileSigID !== other.declaringFileSigID) {
            return false;
        }
        return this.declaringNamespaceSigID === other.declaringNamespaceSigID;
    }

    /** Whether this signature's declaring file is unknown (FileSignature.DEFAULT). */
    public isUnclear(): boolean {
        return this.declaringFileSigID === 0 && this.namespaceName !== UNKNOWN_NAMESPACE_NAME;
    }
}

export class ClassSignature {
    private className: string;
    /** @internal Formal FileSigID for the declaring file. */
    private declaringFileSigID: number;
    /** @internal Formal NamespaceSigID for the declaring namespace. undefined = none (top-level). */
    private declaringNamespaceSigID?: number;
    private readonly hashCode: number;

    private static readonly logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ClassSignature');

    /** The canonical DEFAULT signature (formal sigID 0 in the registry). */
    public static get DEFAULT(): ClassSignature {
        return SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.get(0)!;
    }

    /**
     * Build from signature instances (backward-compatible value constructor).
     * @deprecated Pass formal SigIDs instead (e.g. via ArkFile.getFileSigID() /
     * ArkNamespace.getNamespaceSigID()). The declaring signatures must already be
     * interned — this overload resolves their existing IDs and fails fast otherwise
     * (it never interns) — and will be removed in a future release.
     */
    constructor(className: string, declaringFileSignature: FileSignature, declaringNamespaceSignature?: NamespaceSignature | null);
    /**
     * Build directly from formal SigIDs (must already be interned in the registry).
     * This path has no registry dependency and is used by internal bootstrap code.
     */
    constructor(className: string, declaringFileSigID: number, declaringNamespaceSigID?: number);
    constructor(className: string, declaringFileOrID: FileSignature | number, declaringNSOrID?: NamespaceSignature | null | number) {
        function computeHashCode(fileId: number, className: string, namespaceId?: number): number {
            let h = 0xdeadbeef;
            h = hashCombineU32(h, fileId);
            h = hashCombineU32(h, hashString32(className));
            h = hashCombineU32(h, namespaceId ?? 0);
            return h >>> 0;
        }

        this.className = className;
        if (typeof declaringFileOrID === 'number') {
            this.declaringFileSigID = declaringFileOrID;
            this.declaringNamespaceSigID = typeof declaringNSOrID === 'number' ? declaringNSOrID : undefined;
            this.hashCode = computeHashCode(this.declaringFileSigID, this.className, this.declaringNamespaceSigID);
            return;
        }
        let fileSigID: number;
        let nsSigID: number | undefined;
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // FileSignature 永不 unclear——身份根。
        const fileExistingId = reg.fileSigCanonicalizer.getExistingId(declaringFileOrID);
        if (fileExistingId !== -1) {
            fileSigID = fileExistingId;
        } else {
            ClassSignature.logger.error(`Clear FileSignature declaring not interned — defaulting to ID 0: ${declaringFileOrID.toString()}`);
            fileSigID = 0;
        }
        // namespace 无 temp 空间。
        if (declaringNSOrID instanceof NamespaceSignature) {
            if (declaringNSOrID.isUnclear()) {
                nsSigID = -1;
            } else {
                const nsExistingId = reg.namespaceSigCanonicalizer.getExistingId(declaringNSOrID);
                if (nsExistingId !== -1) {
                    nsSigID = nsExistingId;
                } else {
                    ClassSignature.logger.error(`Clear NamespaceSignature declaring not interned — marking -1: ${declaringNSOrID.toString()}`);
                    nsSigID = -1;
                }
            }
        }
        this.declaringFileSigID = fileSigID;
        this.declaringNamespaceSigID = nsSigID;
        this.hashCode = computeHashCode(this.declaringFileSigID, this.className, this.declaringNamespaceSigID);
    }

    /**
     * Returns the declaring file signature.
     * @returns The declaring file signature.
     */
    public getDeclaringFileSignature(): FileSignature {
        const sig = SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.get(this.declaringFileSigID);
        if (sig !== undefined) {
            return sig;
        }
        // Stale SigID (registry disposed and rebuilt): degrade to DEFAULT instead of crashing.
        ClassSignature.logger.error(`ClassSignature '${this.className}' has a stale declaring file SigID ${this.declaringFileSigID}; returning DEFAULT.`);
        return FileSignature.DEFAULT;
    }

    /**
     * Get the declaring namespace's signature.
     * @returns the declaring namespace's signature.
     */
    public getDeclaringNamespaceSignature(): NamespaceSignature | null {
        if (this.declaringNamespaceSigID === undefined) {
            return null;
        }
        const sig = SignatureCanonicalizerRegistry.getInstance().namespaceSigCanonicalizer.get(this.declaringNamespaceSigID);
        if (sig !== undefined) {
            return sig;
        }
        // Stale SigID (registry disposed and rebuilt): degrade to DEFAULT instead of crashing.
        ClassSignature.logger.error(
            `ClassSignature '${this.className}' has a stale declaring namespace SigID ${this.declaringNamespaceSigID}; returning DEFAULT.`
        );
        return NamespaceSignature.DEFAULT;
    }

    /** @internal Get the formal FileSigID of the declaring file. */
    public getDeclaringFileSigID(): number {
        return this.declaringFileSigID;
    }

    /** @internal Get the formal NamespaceSigID of the declaring namespace. Returns undefined for top-level classes. */
    public getDeclaringNamespaceSigID(): number | undefined {
        return this.declaringNamespaceSigID;
    }

    /**
     * Get the **string** name of class from the the class signature. The default value is `""`.
     * @returns The name of this class.
     */
    public getClassName(): string {
        return this.className;
    }

    /**
     *
     * @returns The name of the declare class.
     */
    public getDeclaringClassName(): string {
        if (this.className.startsWith(ANONYMOUS_CLASS_PREFIX)) {
            let temp = this.className;
            do {
                temp = temp.substring(temp.indexOf(NAME_DELIMITER) + 1, temp.lastIndexOf(NESTED_CLASS_METHOD_DELIMITER));
            } while (temp.startsWith(ANONYMOUS_CLASS_PREFIX));
            return temp;
        }
        return this.className;
    }

    /**
     * @deprecated Mutating the class name breaks the cached hash (the signature would intern
     * to a different SigID than a freshly built one with the new name). Build a new
     * ClassSignature instead.
     */
    public setClassName(className: string): void {
        this.className = className;
    }

    public getType(): ClassType {
        return new ClassType(this);
    }

    public toString(): string {
        const declaringNS = this.getDeclaringNamespaceSignature();
        if (declaringNS !== null) {
            return declaringNS.toString() + '.' + this.getClassName();
        }
        return this.getDeclaringFileSignature().toString() + this.getClassName();
    }

    /**
     * @deprecated No longer used internally since the ID refactor: identity comparison
     * uses {@link signatureEquals} (hash + equals), indexing uses the canonicalizer.
     * Kept for backward compatibility only — for identity checks use `equals()`
     * (with `getHashCode()` fast reject), for debug output use `toString()`.
     */
    public toMapKey(): string {
        const declaringNS = this.getDeclaringNamespaceSignature();
        if (declaringNS !== null) {
            return declaringNS.toMapKey() + '.' + this.getClassName();
        }
        return this.getDeclaringFileSignature().toMapKey() + this.getClassName();
    }

    public getHashCode(): number {
        return this.hashCode;
    }

    public equals(other: ClassSignature): boolean {
        if (this === other) {
            return true;
        }
        // display 归一化：alias 与任何普通签名值不等——alias 的身份含 aliasName 维度（见 AliasClassSignature.equals）。对称性由子类 equals 对非
        // alias 返回 false 共同保证。
        if (other instanceof AliasClassSignature) {
            return false;
        }
        if (this.className !== other.className) {
            return false;
        }
        if (this.declaringFileSigID !== other.declaringFileSigID) {
            return false;
        }
        return this.declaringNamespaceSigID === other.declaringNamespaceSigID;
    }

    /**
     * @internal Whether this signature's declaring file is unknown (FileSignature.DEFAULT).
     * Direct field check (no registry lookup): unclear iff declaring file is DEFAULT (FileSigID 0)
     * and this is not the DEFAULT placeholder itself (distinguished by the '%unk' name).
     * This is a hot path in Method/FieldSignature constructor temp/formal branching.
     */
    public isUnclear(): boolean {
        return this.declaringFileSigID === 0 && this.className !== UNKNOWN_CLASS_NAME;
    }
}

/**
 * `AliasClassSignature` is used to extend `ClassSignature`, preserving the actual name used during invocation.
 */
export class AliasClassSignature extends ClassSignature {
    private readonly aliasName: string;
    /** alias 身份 hash（与父类同构公式，className → aliasName）。 */
    private readonly aliasHashCode: number;

    constructor(aliasName: string, signature: ClassSignature) {
        super(signature.getClassName(), signature.getDeclaringFileSigID(), signature.getDeclaringNamespaceSigID());
        this.aliasName = aliasName;
        let h = 0xdeadbeef;
        h = hashCombineU32(h, this.getDeclaringFileSigID());
        h = hashCombineU32(h, hashString32(aliasName));
        h = hashCombineU32(h, this.getDeclaringNamespaceSigID() ?? 0);
        this.aliasHashCode = h >>> 0;
        // formal 直存 + 双注册 origin model。前置：origin 必已在 formal（两个产生点
        // ——组件 pop 构建、Interface 替换——的前提都是真实类已注册）；origin model
        // 缺失时 alias 条目暂无 model（Validator M3 将暴露该形态）。
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const aliasID = reg.classSigCanonicalizer.getOrCreateId(this);
        const originID = reg.classSigCanonicalizer.getExistingId(signature);
        if (originID !== -1) {
            const originModel = reg.classSigCanonicalizer.getModel(originID);
            if (originModel !== undefined) {
                reg.classSigCanonicalizer.setModel(aliasID, originModel);
            }
        }
    }

    /**
     * Returns the name used in the code.
     */
    public getClassName(): string {
        return this.aliasName;
    }

    /**
     * Return the original name of declared class
     */
    public getOriginName(): string {
        return super.getClassName();
    }

    /** alias 身份 hash（aliasName 替代 origin className 参与）。 */
    public getHashCode(): number {
        return this.aliasHashCode;
    }

    /** 比较 aliasName + origin 维度；alias 与普通签名永不相等。 */
    public equals(other: ClassSignature): boolean {
        if (this === other) {
            return true;
        }
        if (!(other instanceof AliasClassSignature)) {
            return false;
        }
        if (this.aliasName !== other.aliasName) {
            return false;
        }
        if (this.getDeclaringFileSigID() !== other.getDeclaringFileSigID()) {
            return false;
        }
        return this.getDeclaringNamespaceSigID() === other.getDeclaringNamespaceSigID();
    }
}

/**
 * @internal
 * display 归一化：将 alias MethodSignature intern 进 methodSig formal 空间并双注册 origin 的 ArkMethod model（与 AliasClassSignature 构造器的 class 侧双注册
 * 对称）。产生点（组件 pop 构建 / Interface 替换）在把签名交给 expr 之前调用——expr 的 route() formal 命中持 SigID，scene.getMethod 经 getModel 直命中
 * 真实方法（callgraph/ViewTree findMethod 全链路无需 fallback）。
 */
export function internAliasMethodSignature(aliasSignature: MethodSignature, originSignature: MethodSignature): void {
    const reg = SignatureCanonicalizerRegistry.getInstance();
    const aliasID = reg.methodSigCanonicalizer.getOrCreateId(aliasSignature);
    const originID = reg.methodSigCanonicalizer.getExistingId(originSignature);
    if (originID === -1) {
        return;
    }
    const originModel = reg.methodSigCanonicalizer.getModel(originID);
    if (originModel !== undefined) {
        reg.methodSigCanonicalizer.setModel(aliasID, originModel);
    }
}

export type BaseSignature = ClassSignature | NamespaceSignature;

export class FieldSignature {
    private fieldName: string;
    private type: Type;
    private staticFlag: boolean;
    /**
     * @internal 构造期按值固化；改写同步更新（就地演进原语——值与 hash 始终一致，不破坏 hash/equals 契约）。
     * 构造器经 {@link recomputeHashCode} 完成首次赋值（TS 无法静态确认，`!` 断言）。
     */
    private hashCode!: number;

    /** @internal Formal ClassSigID of the declaring class. -1 = unclear. undefined = declared by namespace. */
    private declaringClassSigID?: number;
    /** @internal Formal NamespaceSigID of the declaring namespace. -1 = unclear. undefined = declared by class. */
    private declaringNamespaceSigID?: number;
    /** @internal Temp ClassSigID for the unclear declaring class (reference-semantics). */
    private declaringClassTempSigID?: number;

    private static readonly logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'FieldSignature');

    /** The canonical DEFAULT signature (formal sigID 0 in the registry). */
    public static get DEFAULT(): FieldSignature {
        return SignatureCanonicalizerRegistry.getInstance().fieldSigCanonicalizer.get(0)!;
    }

    /**
     * Build from a declaring signature instance (backward-compatible value constructor).
     * @deprecated Pass formal SigIDs (plus optional temp ClassSigID) instead.
     */
    constructor(fieldName: string, declaringSignature: BaseSignature, type: Type, staticFlag?: boolean);
    /**
     * Build from SigIDs. Formal: `(name, classSigID, type, staticFlag?)` with classSigID >= 0.
     * Temp: `(name, -1, type, staticFlag, false, tempClassSigID)` — classSigID = -1 marks unclear.
     */
    constructor(fieldName: string, declaringClassSigID: number, type: Type, staticFlag?: boolean, namespaceDeclared?: false, declaringClassTempSigID?: number);
    /**
     * Build directly from the declaring namespace's formal NamespaceSigID (must already be
     * interned). The trailing literal `true` disambiguates the namespace ID space from the
     * class ID space. Note: staticFlag is required in this overload (TS optional-parameter
     * ordering).
     */
    constructor(fieldName: string, declaringNamespaceSigID: number, type: Type, staticFlag: boolean, namespaceDeclared: true);
    constructor(
        fieldName: string,
        declaringOrID: BaseSignature | number,
        type: Type,
        staticFlag: boolean = false,
        namespaceDeclared?: boolean,
        declaringClassTempSigID?: number
    ) {
        this.fieldName = fieldName;
        this.type = type;
        this.staticFlag = staticFlag;
        if (typeof declaringOrID === 'number' && !namespaceDeclared) {
            // Class-side SigID path: direct field assignment (formal or temp via optional param).
            this.declaringClassSigID = declaringOrID;
            this.declaringClassTempSigID = declaringClassTempSigID;
            this.declaringNamespaceSigID = undefined;
        } else {
            this.setDeclaringFields(declaringOrID, namespaceDeclared ?? false);
        }
        this.recomputeHashCode();
    }

    /**
     * @internal 解析 declaring 并写入三个 SigID 字段（构造器与 {@link applyFields}共用）：
     * 数字重载直存；
     * 对象重载按 isUnclear 分流（unclear class → temp 登记；clear → formal 只读命中；unclear ns → 仅标记 -1）。
     */
    private setDeclaringFields(declaringOrID: BaseSignature | number, namespaceDeclared: boolean = false): void {
        if (typeof declaringOrID === 'number') {
            this.declaringClassSigID = undefined;
            this.declaringClassTempSigID = undefined;
            this.declaringNamespaceSigID = undefined;
            if (namespaceDeclared) {
                this.declaringNamespaceSigID = declaringOrID;
            } else {
                this.declaringClassSigID = declaringOrID;
            }
            return;
        }
        this.declaringClassSigID = undefined;
        this.declaringClassTempSigID = undefined;
        this.declaringNamespaceSigID = undefined;
        const reg = SignatureCanonicalizerRegistry.getInstance();
        if (declaringOrID instanceof ClassSignature) {
            if (declaringOrID.isUnclear()) {
                this.declaringClassSigID = -1;
                this.declaringClassTempSigID = reg.tempClassSigCanonicalizer.register(declaringOrID);
            } else {
                const existingId = reg.classSigCanonicalizer.getExistingId(declaringOrID);
                if (existingId !== -1) {
                    this.declaringClassSigID = existingId;
                } else {
                    FieldSignature.logger.error(`Clear ClassSignature declaring not interned — routing to temp: ${declaringOrID.toString()}`);
                    this.declaringClassSigID = -1;
                    this.declaringClassTempSigID = reg.tempClassSigCanonicalizer.register(declaringOrID);
                }
            }
        } else {
            // namespace 无 temp 空间。
            if (declaringOrID.isUnclear()) {
                FieldSignature.logger.error(`Clear ClassSignature declaring not interned — routing to temp: ${declaringOrID.toString()}`);
                this.declaringNamespaceSigID = -1;
            } else {
                const existingNsId = reg.namespaceSigCanonicalizer.getExistingId(declaringOrID);
                if (existingNsId !== -1) {
                    this.declaringNamespaceSigID = existingNsId;
                } else {
                    FieldSignature.logger.error(`Clear NamespaceSignature declaring not interned — marking -1: ${declaringOrID.toString()}`);
                    this.declaringNamespaceSigID = -1;
                }
            }
        }
    }

    /** @internal 按当前字段值重算 hash（applyFields 就地演进后调用，值与 hash 保持一致）。 */
    private recomputeHashCode(): void {
        let h = 0xdeadbeef;
        h = hashCombineU32(h, this.declaringClassSigID ?? 0);
        h = hashCombineU32(h, this.declaringNamespaceSigID ?? 0);
        h = hashCombineU32(h, this.declaringClassTempSigID ?? 0);
        h = hashCombineU32(h, hashString32(this.fieldName));
        h = hashCombineU32(h, this.staticFlag ? 1 : 0);
        this.hashCode = h >>> 0;
    }

    /**
     * @internal 参数式就地演进原语——不经过中间实例 N，直接按参数赋值字段 + 解析 declaring + 重算 hash（编号不变）。供持有者更新入口的参数式路径
     * （决策表"未毕业抄写"分支的零分配版）使用。
     */
    public applyFields(fieldName: string, declaringOrID: BaseSignature | number, type: Type, staticFlag: boolean, namespaceDeclared: boolean = false): void {
        this.fieldName = fieldName;
        this.type = type;
        this.staticFlag = staticFlag;
        this.setDeclaringFields(declaringOrID, namespaceDeclared);
        this.recomputeHashCode();
    }

    public getDeclaringSignature(): BaseSignature {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        if (this.declaringClassSigID !== undefined && this.declaringClassSigID >= 0) {
            const sig = reg.classSigCanonicalizer.get(this.declaringClassSigID);
            if (sig !== undefined) {
                return sig;
            }
        } else if (this.declaringNamespaceSigID !== undefined && this.declaringNamespaceSigID >= 0) {
            const sig = reg.namespaceSigCanonicalizer.get(this.declaringNamespaceSigID);
            if (sig !== undefined) {
                return sig;
            }
        } else if (this.declaringClassTempSigID !== undefined) {
            const sig = reg.tempClassSigCanonicalizer.get(this.declaringClassTempSigID);
            if (sig !== undefined) {
                return sig;
            }
            const formalId = reg.tempClassSigCanonicalizer.getReplacement(this.declaringClassTempSigID);
            if (formalId !== -1) {
                const formalSig = reg.classSigCanonicalizer.get(formalId);
                if (formalSig !== undefined) {
                    return formalSig;
                }
            }
        }
        // Stale SigID (registry disposed and rebuilt): degrade to DEFAULT instead of crashing.
        FieldSignature.logger.error(
            `FieldSignature '${this.fieldName}' has a stale declaring SigID (class=${this.declaringClassSigID}, namespace=${this.declaringNamespaceSigID}, temp=${this.declaringClassTempSigID}); returning ClassSignature.DEFAULT.`
        );
        return ClassSignature.DEFAULT;
    }

    /** @internal Get the formal ClassSigID of the declaring class. Returns -1 if unclear (temp-held), undefined if declared by namespace. */
    public getDeclaringClassSigID(): number | undefined {
        return this.declaringClassSigID;
    }

    /** @internal Get the formal NamespaceSigID of the declaring namespace. Returns -1 if unclear (temp-held), undefined if declared by class. */
    public getDeclaringNamespaceSigID(): number | undefined {
        return this.declaringNamespaceSigID;
    }

    /** @internal Get the temp ClassSigID of the unclear declaring class. Returns undefined if clear or declared by namespace. */
    public getDeclaringClassTempSigID(): number | undefined {
        return this.declaringClassTempSigID;
    }

    public getBaseName(): string {
        const declaringSignature = this.getDeclaringSignature();
        return declaringSignature instanceof ClassSignature ? declaringSignature.getClassName() : declaringSignature.getNamespaceName();
    }

    public getFieldName(): string {
        return this.fieldName;
    }

    public getType(): Type {
        return this.type;
    }

    public isStatic(): boolean {
        return this.staticFlag;
    }

    // temp for being compatible with existing type inference
    public setType(type: Type): void {
        this.type = type;
    }

    // temp for being compatible with existing type inference
    public setStaticFlag(flag: boolean): void {
        this.staticFlag = flag;
    }

    public toString(): string {
        let tmpSig = this.fieldName;
        if (this.isStatic()) {
            tmpSig = '[static]' + tmpSig;
        }
        return this.getDeclaringSignature().toString() + '.' + tmpSig;
    }

    /**
     * @deprecated No longer used internally since the ID refactor: identity comparison
     * uses {@link signatureEquals} (hash + equals), indexing uses the canonicalizer.
     * Kept for backward compatibility only — for identity checks use `equals()`
     * (with `getHashCode()` fast reject), for debug output use `toString()`.
     */
    public toMapKey(): string {
        let tmpSig = this.fieldName;
        if (this.isStatic()) {
            tmpSig = '[static]' + tmpSig;
        }
        return this.getDeclaringSignature().toMapKey() + '.' + tmpSig;
    }

    public getHashCode(): number {
        return this.hashCode;
    }

    public equals(other: FieldSignature): boolean {
        if (this === other) {
            return true;
        }
        if (this.fieldName !== other.fieldName) {
            return false;
        }
        if (this.staticFlag !== other.staticFlag) {
            return false;
        }
        return this.declaringClassSigID === other.declaringClassSigID &&
            this.declaringNamespaceSigID === other.declaringNamespaceSigID &&
            this.declaringClassTempSigID === other.declaringClassTempSigID;
    }

    /**
     * @internal Whether the declaring signature is unclear (temp-held, unresolved).
     * Direct field check (no registry lookup, no declaring signature chain traversal):
     * class-side unclear = declaringClassSigID is non-positive — -1 (temp-held) or 0
     * (DEFAULT class as declaring, i.e. "method on an unknown class" — stub builders
     * like ArkSignatureBuilder.buildMethodSignatureFromMethodName pass 0 directly);
     * namespace-side unclear = declaringNamespaceSigID === -1.
     * A positive formal declaring ID implies the declaring entity went through the
     * formal path — no chain check needed.
     */
    public isUnclear(): boolean {
        return this.declaringClassSigID === -1 || this.declaringClassSigID === 0 || this.declaringNamespaceSigID === -1;
    }
}

export class MethodSubSignature {
    private methodName: string;
    private parameters: MethodParameter[];
    private returnType: Type;
    private staticFlag: boolean;

    constructor(methodName: string, parameters: MethodParameter[], returnType: Type, staticFlag: boolean = false) {
        this.methodName = methodName;
        this.parameters = parameters;
        this.returnType = returnType;
        this.staticFlag = staticFlag;
    }

    public getMethodName(): string {
        return this.methodName;
    }

    public getParameters(): MethodParameter[] {
        return this.parameters;
    }

    /**
     * @internal Replace the parameter list.
     *
     * Parameter NAMES are not part of the signature identity (hash/equals/toString only use
     * parameter types), so distinct declarations/implementations of the same method share one
     * canonical signature instance. The implementation side is the authority for body-local
     * generation, so its parameter names are refreshed onto the canonical instance.
     */
    public setParameters(parameters: MethodParameter[]): void {
        this.parameters = parameters;
    }

    public getParameterTypes(): Type[] {
        const parameterTypes: Type[] = [];
        this.parameters.forEach(parameter => {
            parameterTypes.push(parameter.getType());
        });
        return parameterTypes;
    }

    public getReturnType(): Type {
        return this.returnType;
    }

    public setReturnType(returnType: Type): void {
        this.returnType = returnType;
    }

    public isStatic(): boolean {
        return this.staticFlag;
    }

    public toString(ptrName?: string, visited?: Set<Type>): string {
        let paraStr = '';
        this.getParameterTypes().forEach(parameterType => {
            const typeStr = parameterType
                ? visited
                    ? parameterType.toStringWithVisited(visited)
                    : parameterType.toString()
                : UnknownType.getInstance().toString();
            paraStr += typeStr + ', ';
        });
        paraStr = paraStr.replace(/, $/, '');
        const tmpSig = `${ptrName ?? this.getMethodName()}(${paraStr})`;
        if (this.isStatic()) {
            return '[static]' + tmpSig;
        }
        return tmpSig;
    }
}

/**
 * @internal Value-semantic equality between two MethodSubSignatures, semantically equivalent to `a.toString() === b.toString()` plus return-type equality,
 * but short-circuits from cheap to expensive with NO string building in the common mismatch cases.
 */
function methodSubSignatureValueEquals(a: MethodSubSignature, b: MethodSubSignature): boolean {
    if (a === b) {
        return true;
    }
    if (a.isStatic() !== b.isStatic()) {
        return false;
    }
    if (a.getMethodName() !== b.getMethodName()) {
        return false;
    }
    const ap = a.getParameters();
    const bp = b.getParameters();
    if (ap.length !== bp.length) {
        return false;
    }
    for (let i = 0; i < ap.length; i++) {
        const at = ap[i]?.getType();
        const bt = bp[i]?.getType();
        if (at === bt) {
            continue;
        }
        if ((at?.toString() ?? UnknownType.getInstance().toString()) !== (bt?.toString() ?? UnknownType.getInstance().toString())) {
            return false;
        }
    }
    return a.getReturnType().toString() === b.getReturnType().toString();
}

/**
 * @category core/model
 */
export class MethodSignature {
    private methodSubSignature: MethodSubSignature;
    private readonly hashCode: number;

    /** @internal Formal ClassSigID for the declaring class. -1 = unclear (temp-held). */
    private declaringClassSigID: number;
    private declaringClassTempSigID?: number;

    private static readonly logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'MethodSignature');

    /** The canonical DEFAULT signature (formal sigID 0 in the registry). */
    public static get DEFAULT(): MethodSignature {
        return SignatureCanonicalizerRegistry.getInstance().methodSigCanonicalizer.get(0)!;
    }

    /**
     * Build from a declaring class signature instance (backward-compatible value constructor).
     * @deprecated Pass the formal ClassSigID (plus optional temp ClassSigID) instead.
     */
    constructor(declaringClassSignature: ClassSignature, methodSubSignature: MethodSubSignature);
    /**
     * Build from SigIDs. Formal: `(classSigID, subSig)` with classSigID >= 0.
     * Temp: `(-1, subSig, tempClassSigID)` — declaringClassSigID = -1 marks unclear, tempClassSigID is the temp index.
     */
    constructor(declaringClassSigID: number, methodSubSignature: MethodSubSignature, declaringClassTempSigID?: number);
    constructor(declaringClassOrID: ClassSignature | number, methodSubSignature: MethodSubSignature, declaringClassTempSigID?: number) {
        this.methodSubSignature = methodSubSignature;
        if (typeof declaringClassOrID === 'number') {
            this.declaringClassSigID = declaringClassOrID;
            this.declaringClassTempSigID = declaringClassTempSigID;
        } else {
            const reg = SignatureCanonicalizerRegistry.getInstance();
            if (declaringClassOrID.isUnclear()) {
                this.declaringClassSigID = -1;
                this.declaringClassTempSigID = reg.tempClassSigCanonicalizer.register(declaringClassOrID);
            } else {
                const existingId = reg.classSigCanonicalizer.getExistingId(declaringClassOrID);
                if (existingId !== -1) {
                    this.declaringClassSigID = existingId;
                } else {
                    MethodSignature.logger.error(`Clear ClassSignature declaring not interned — routing to temp: ${declaringClassOrID.toString()}`);
                    this.declaringClassSigID = -1;
                    this.declaringClassTempSigID = reg.tempClassSigCanonicalizer.register(declaringClassOrID);
                }
            }
        }
        // Hash inputs are lifetime-stable identity fields ONLY: declaring SigIDs, method name, parameter count, static flag.
        // Parameter TYPES and the return type are deliberately excluded — they are mutable in place during inference.
        let h = 0xdeadbeef;
        h = hashCombineU32(h, this.declaringClassSigID);
        h = hashCombineU32(h, this.declaringClassTempSigID ?? 0);
        h = hashCombineU32(h, hashString32(methodSubSignature.getMethodName()));
        h = hashCombineU32(h, methodSubSignature.getParameters().length);
        h = hashCombineU32(h, methodSubSignature.isStatic() ? 1 : 0);
        this.hashCode = h >>> 0;
    }

    /**
     * Return the declaring class signature.
     * A {@link ClassSignature} includes:
     * - File Signature: including the **string** names of the project and file, respectively.
     * The default value of project's name is "%unk" and the default value of file's name is "%unk".
     * - Namespace Signature | **null**:  it may be a namespace signature or **null**.
     * A namespace signature can indicate its **string** name of namespace and its file signature.
     * - Class Name: the **string** name of this class.
     * @returns The declaring class signature.
     */
    public getDeclaringClassSignature(): ClassSignature {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        if (this.declaringClassSigID >= 0) {
            const sig = reg.classSigCanonicalizer.get(this.declaringClassSigID);
            if (sig !== undefined) {
                return sig;
            }
        } else if (this.declaringClassTempSigID !== undefined) {
            const sig = reg.tempClassSigCanonicalizer.get(this.declaringClassTempSigID);
            if (sig !== undefined) {
                return sig;
            }
            const formalId = reg.tempClassSigCanonicalizer.getReplacement(this.declaringClassTempSigID);
            if (formalId !== -1) {
                const formalSig = reg.classSigCanonicalizer.get(formalId);
                if (formalSig !== undefined) {
                    return formalSig;
                }
            }
        }
        // Stale SigID (registry disposed and rebuilt): degrade to DEFAULT instead of crashing.
        MethodSignature.logger.error(
            `MethodSignature '${this.methodSubSignature.getMethodName()}' has a stale declaring class SigID ${this.declaringClassSigID} (temp=${this.declaringClassTempSigID}); returning DEFAULT.`
        );
        return ClassSignature.DEFAULT;
    }

    /** @internal Get the formal ClassSigID of the declaring class. Returns -1 if unclear (temp-held). */
    public getDeclaringClassSigID(): number {
        return this.declaringClassSigID;
    }

    /** @internal Get the temp ClassSigID of the unclear declaring class. Returns undefined if clear. */
    public getDeclaringClassTempSigID(): number | undefined {
        return this.declaringClassTempSigID;
    }

    /**
     * Returns the sub-signature of this method signature.
     * The sub-signature is part of the method signature, which is used to
     * identify the name of the method, its parameters and the return value type.
     * @returns The sub-signature of this method signature.
     */
    public getMethodSubSignature(): MethodSubSignature {
        return this.methodSubSignature;
    }

    public getType(): Type {
        return this.methodSubSignature.getReturnType();
    }

    public toString(ptrName?: string, visited?: Set<Type>): string {
        return this.getDeclaringClassSignature().toString() + '.' + this.methodSubSignature.toString(ptrName, visited);
    }

    /**
     * @deprecated No longer used internally since the ID refactor: identity comparison
     * uses {@link signatureEquals} (hash + equals), indexing uses the canonicalizer.
     * Kept for backward compatibility only — for identity checks use `equals()`
     * (with `getHashCode()` fast reject), for debug output use `toString()`.
     */
    public toMapKey(): string {
        return this.getDeclaringClassSignature().toMapKey() + '.' + this.methodSubSignature.toString();
    }

    public getHashCode(): number {
        return this.hashCode;
    }

    public equals(other: MethodSignature): boolean {
        if (this === other) {
            return true;
        }
        if (this.declaringClassSigID !== other.declaringClassSigID) {
            return false;
        }
        if (this.declaringClassTempSigID !== other.declaringClassTempSigID) {
            return false;
        }
        return methodSubSignatureValueEquals(this.methodSubSignature, other.methodSubSignature);
    }

    public isUnclear(): boolean {
        return this.declaringClassSigID === -1 || this.declaringClassSigID === 0;
    }

    public isMatch(signature: MethodSignature): boolean {
        if (!signatureEquals(this.getDeclaringClassSignature(), signature.getDeclaringClassSignature())) {
            return false;
        }
        // Sub-signature comparison shares the field-level path with equals (was: full
        // MethodSignature.toString() building ×2 + returnType.toString() ×2 per call).
        return methodSubSignatureValueEquals(this.methodSubSignature, signature.methodSubSignature);
    }

    public getParamLength(): number {
        return this.methodSubSignature.getParameters().filter(p => !p.getName().startsWith(LEXICAL_ENV_NAME_PREFIX)).length;
    }
}

export class LocalSignature {
    private name: string;
    private declaringMethodSignature: MethodSignature;

    constructor(name: string, declaringMethodSignature: MethodSignature) {
        this.name = name;
        this.declaringMethodSignature = declaringMethodSignature;
    }

    public getName(): string {
        return this.name;
    }

    public getDeclaringMethodSignature(): MethodSignature {
        return this.declaringMethodSignature;
    }

    public toString(): string {
        return this.declaringMethodSignature.toString() + '#' + this.name;
    }
}

export class AliasTypeSignature {
    private name: string;
    private declaringMethodSignature: MethodSignature;

    constructor(name: string, declaringMethodSignature: MethodSignature) {
        this.name = name;
        this.declaringMethodSignature = declaringMethodSignature;
    }

    public getName(): string {
        return this.name;
    }

    public getDeclaringMethodSignature(): MethodSignature {
        return this.declaringMethodSignature;
    }

    public toString(visited?: Set<Type>): string {
        return this.declaringMethodSignature.toString(undefined, visited) + '#' + this.name;
    }
}

/**
 * Legacy free-function comparators — kept for API compatibility (external callers may exist).
 * Behavior aligns with the corresponding signature classes' `equals()`:
 * - classSignatureCompare compares the declaring namespace (silently ignoring it misjudges same-name classes in different namespaces as equal);
 * - methodSubSignatureCompare compares parameter/return types by value (`===` reference comparison misjudges value-equal distinct Type instances as different).
 */
export function fieldSignatureCompare(leftSig: FieldSignature, rightSig: FieldSignature): boolean {
    return signatureEquals(leftSig.getDeclaringSignature(), rightSig.getDeclaringSignature()) && leftSig.getFieldName() === rightSig.getFieldName();
}

export function methodSignatureCompare(leftSig: MethodSignature, rightSig: MethodSignature): boolean {
    return signatureEquals(leftSig.getDeclaringClassSignature(), rightSig.getDeclaringClassSignature()) &&
        methodSubSignatureValueEquals(leftSig.getMethodSubSignature(), rightSig.getMethodSubSignature());
}

export function methodSubSignatureCompare(leftSig: MethodSubSignature, rightSig: MethodSubSignature): boolean {
    return methodSubSignatureValueEquals(leftSig, rightSig);
}

export function classSignatureCompare(leftSig: ClassSignature, rightSig: ClassSignature): boolean {
    return signatureEquals(leftSig, rightSig);
}

export function fileSignatureCompare(leftSig: FileSignature, rightSig: FileSignature): boolean {
    return leftSig.equals(rightSig);
}

export function genSignature4ImportClause(arkFileName: string, importClauseName: string): string {
    return `<${arkFileName}>.<${importClauseName}>`;
}
