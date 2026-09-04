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

import path from 'path';
import { transfer2UnixPath } from '../../utils/pathTransfer';
import { ClassType, Type, UnknownType } from '../base/Type';
import { MethodParameter } from './builder/ArkMethodBuilder';
import { ANONYMOUS_CLASS_PREFIX, LEXICAL_ENV_NAME_PREFIX, NAME_DELIMITER, NESTED_CLASS_METHOD_DELIMITER } from '../common/Const';
import { CryptoUtils } from '../../utils/crypto_utils';
import { SignatureCanonicalizerRegistry } from '../common/SignatureCanonicalizerRegistry';
import { SignatureCanonicalizer, Canonicalizable } from '../common/SignatureCanonicalizer';
import { hashString32, hashCombineU32 } from '../../utils/HashUtils';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';

export type Signature = FileSignature | NamespaceSignature | ClassSignature | MethodSignature | FieldSignature | LocalSignature | AliasTypeSignature;

export interface ArkSignature {
    getSignature(): Signature;
}

/**
 * Resolve the formal SigID of a declaring signature passed to a value-object constructor
 * overload, failing fast when the value has never been interned.
 *
 * The value-object overloads are NOT query paths: silently storing -1 (or silently
 * interning the declaring value) would produce signatures whose declaring SigID cannot
 * be resolved back, or pollute the formal space with model-less entries. Callers must
 * intern the declaring signature first (e.g. via ArkFile.setFileSignature /
 * canonicalizer.getId) or use the SigID overload directly.
 */
function requireExistingId<S extends Canonicalizable>(kind: string, sig: S, canonicalizer: SignatureCanonicalizer<S>): number {
    const id = canonicalizer.getExistingId(sig);
    if (id === -1) {
        throw new Error(
            `${kind}: declaring signature '${sig.toString()}' is not interned. ` +
                `Intern it first (canonicalizer.getId) or use the SigID constructor overload.`
        );
    }
    return id;
}

/**
 * @category core/model
 */
export class FileSignature {
    private projectName: string;
    private fileName: string;
    private hashcode: number;
    private readonly hashCode: number;

    /** The canonical DEFAULT signature (formal sigID 0 in the registry). */
    public static get DEFAULT(): FileSignature {
        return SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.get(0)!;
    }

    constructor(projectName: string, fileName: string) {
        this.projectName = projectName;
        this.fileName = transfer2UnixPath(fileName);
        this.hashcode = CryptoUtils.hashcode(this.toString());
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

    public toMapKey(): string {
        return `${this.hashcode}${path.basename(this.fileName)}`;
    }

    public getHashCode(): number {
        return this.hashCode;
    }

    public equals(other: FileSignature): boolean {
        if (this === other) return true;
        return this.projectName === other.projectName && this.fileName === other.fileName;
    }

    /** @internal Whether this signature is the canonical DEFAULT (formal sigID 0 in the registry). */
    public isDefault(): boolean {
        return SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getExistingId(this) === 0;
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
     * ArkNamespace.getNamespaceSigID()). This value-object overload interns the declaring
     * signatures internally and will be removed in a future release.
     */
    constructor(namespaceName: string, declaringFileSignature: FileSignature, declaringNamespaceSignature?: NamespaceSignature | null);
    /**
     * Build directly from formal SigIDs (must already be interned in the registry).
     * This path has no registry dependency and is used by internal bootstrap code.
     */
    constructor(namespaceName: string, declaringFileSigID: number, declaringNamespaceSigID?: number);
    constructor(namespaceName: string, declaringFileOrID: FileSignature | number, declaringNSOrID?: NamespaceSignature | null | number) {
        this.namespaceName = namespaceName;
        let fileSigID: number;
        let nsSigID: number | undefined;
        if (typeof declaringFileOrID === 'number') {
            fileSigID = declaringFileOrID;
            nsSigID = typeof declaringNSOrID === 'number' ? declaringNSOrID : undefined;
        } else {
            const reg = SignatureCanonicalizerRegistry.getInstance();
            fileSigID = requireExistingId('NamespaceSignature', declaringFileOrID, reg.fileSigCanonicalizer);
            nsSigID =
                declaringNSOrID instanceof NamespaceSignature
                    ? requireExistingId('NamespaceSignature', declaringNSOrID, reg.namespaceSigCanonicalizer)
                    : undefined;
        }
        this.declaringFileSigID = fileSigID;
        this.declaringNamespaceSigID = nsSigID;
        let h = 0xdeadbeef;
        h = hashCombineU32(h, fileSigID);
        h = hashCombineU32(h, hashString32(namespaceName));
        h = hashCombineU32(h, nsSigID ?? 0);
        this.hashCode = h >>> 0;
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
        if (this === other) return true;
        if (this.namespaceName !== other.namespaceName) return false;
        if (this.declaringFileSigID !== other.declaringFileSigID) return false;
        return this.declaringNamespaceSigID === other.declaringNamespaceSigID;
    }

    /** @internal Whether this signature is the canonical DEFAULT (formal sigID 0 in the registry). */
    public isDefault(): boolean {
        return SignatureCanonicalizerRegistry.getInstance().namespaceSigCanonicalizer.getExistingId(this) === 0;
    }

    /** @internal Whether this signature's declaring file is unknown (FileSignature.DEFAULT). */
    public isUnclear(): boolean {
        // ID 快判：FileSigID 0 即 FileSignature.DEFAULT（internDefaults 固化），等价于
        // getDeclaringFileSignature().isDefault()，且省去 fileSig canonicalizer 的两次
        // Map 查找（get + getExistingId）。
        return !this.isDefault() && this.getDeclaringFileSigID() === 0;
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
     * ArkNamespace.getNamespaceSigID()). This value-object overload interns the declaring
     * signatures internally and will be removed in a future release.
     */
    constructor(className: string, declaringFileSignature: FileSignature, declaringNamespaceSignature?: NamespaceSignature | null);
    /**
     * Build directly from formal SigIDs (must already be interned in the registry).
     * This path has no registry dependency and is used by internal bootstrap code.
     */
    constructor(className: string, declaringFileSigID: number, declaringNamespaceSigID?: number);
    constructor(className: string, declaringFileOrID: FileSignature | number, declaringNSOrID?: NamespaceSignature | null | number) {
        this.className = className;
        let fileSigID: number;
        let nsSigID: number | undefined;
        if (typeof declaringFileOrID === 'number') {
            fileSigID = declaringFileOrID;
            nsSigID = typeof declaringNSOrID === 'number' ? declaringNSOrID : undefined;
        } else {
            const reg = SignatureCanonicalizerRegistry.getInstance();
            fileSigID = requireExistingId('ClassSignature', declaringFileOrID, reg.fileSigCanonicalizer);
            nsSigID =
                declaringNSOrID instanceof NamespaceSignature
                    ? requireExistingId('ClassSignature', declaringNSOrID, reg.namespaceSigCanonicalizer)
                    : undefined;
        }
        this.declaringFileSigID = fileSigID;
        this.declaringNamespaceSigID = nsSigID;
        let h = 0xdeadbeef;
        h = hashCombineU32(h, fileSigID);
        h = hashCombineU32(h, hashString32(className));
        h = hashCombineU32(h, nsSigID ?? 0);
        this.hashCode = h >>> 0;
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
        if (this === other) return true;
        // U+（display 归一化）：alias 与任何普通签名值不等——alias 的身份含
        // aliasName 维度（见 AliasClassSignature.equals），与 origin 折叠的历史
        // 语义已退役。对称性由子类 equals 对非 alias 返回 false 共同保证。
        if (other instanceof AliasClassSignature) return false;
        if (this.className !== other.className) return false;
        if (this.declaringFileSigID !== other.declaringFileSigID) return false;
        return this.declaringNamespaceSigID === other.declaringNamespaceSigID;
    }

    /** @internal Whether this signature is the canonical DEFAULT (formal sigID 0 in the registry). */
    public isDefault(): boolean {
        return SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getExistingId(this) === 0;
    }

    /** @internal Whether this signature's declaring file is unknown (FileSignature.DEFAULT). */
    public isUnclear(): boolean {
        // ID 快判：FileSigID 0 即 FileSignature.DEFAULT（internDefaults 固化），等价于
        // getDeclaringFileSignature().isDefault()，且省去 fileSig canonicalizer 的两次
        // Map 查找（get + getExistingId）。本方法是 Method/FieldSignature 构造期 tempsig
        // 分叉的热路径，收益随签名构造量累积。
        return !this.isDefault() && this.getDeclaringFileSigID() === 0;
    }
}

/**
 * `AliasClassSignature` is used to extend `ClassSignature`, preserving the actual name used during invocation.
 *
 * U+（display 归一化，round18）：alias 升格为**一等 formal 签名**，不再是"值折叠
 * 进 origin 的 display 包装"：
 * - **身份**：aliasName 参与 hash/equals——`Text` ≠ `CommonMethod` ≠ `Column`，
 *   各自 intern 为独立的 formal ClassSigID；
 * - **双注册**：构造即 intern 自身 + 将 origin 的 ArkClass model 注册到 alias ID
 *   （多 SigID 单 model，round12 declare 全槽同构先例）——按 alias 签名的值查
 *   （scene.getClass / getMethod）直命中真实模型；
 * - **display 自持**：formal canonical 即本实例，`getClassName()` 多态即 display
 *   ——消费方（ViewTree 层级匹配、PrinterUtils 组件判断）零改动，expr 侧
 *   "formal 命中仍锚定传入实例"的 display 载体特殊逻辑随之退役（B 轮统一清理）。
 *
 * 推导引擎兼容（实证）：alias 的 declaring file 恒为真实文件（如 common.d.ts），
 * `IRInference.inferStaticInvokeExpr` 的 fileSigID≠0 短路使其零推导处理——display
 * 不会被推导替换破坏。
 */
export class AliasClassSignature extends ClassSignature {
    private readonly aliasName: string;
    /** U+：alias 身份 hash（与父类同构公式，className → aliasName）。 */
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
        const aliasID = reg.classSigCanonicalizer.getId(this);
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

    /** U+：alias 身份 hash（aliasName 替代 origin className 参与）。 */
    public getHashCode(): number {
        return this.aliasHashCode;
    }

    /** U+：alias↔alias 比较 aliasName + origin 维度；alias 与普通签名永不相等。 */
    public equals(other: ClassSignature): boolean {
        if (this === other) return true;
        if (!(other instanceof AliasClassSignature)) return false;
        if (this.aliasName !== other.aliasName) return false;
        if (this.getDeclaringFileSigID() !== other.getDeclaringFileSigID()) return false;
        return this.getDeclaringNamespaceSigID() === other.getDeclaringNamespaceSigID();
    }
}

/**
 * U+（display 归一化）：将 alias MethodSignature intern 进 methodSig formal 空间
 * 并双注册 origin 的 ArkMethod model（与 AliasClassSignature 构造器的 class 侧
 * 双注册对称）。产生点（组件 pop 构建 / Interface 替换）在把签名交给 expr 之前
 * 调用——expr 的 route() formal 命中持 SigID，scene.getMethod 经 getModel 直命中
 * 真实方法（callgraph/ViewTree findMethod 全链路无需 fallback）。
 */
export function internAliasMethodSignature(aliasSignature: MethodSignature, originSignature: MethodSignature): void {
    const reg = SignatureCanonicalizerRegistry.getInstance();
    const aliasID = reg.methodSigCanonicalizer.getId(aliasSignature);
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
     * @internal 构造期按值固化；A2 批 2 起可经 {@link copyFieldsFrom} 随字段
     * 改写同步更新（就地演进原语——值与 hash 始终一致，不破坏 hash/equals 契约）。
     * 构造器经 {@link recomputeHashCode} 完成首次赋值（TS 无法静态确认，`!` 断言）。
     */
    private hashCode!: number;

    /** @internal Formal ClassSigID of the declaring class. -1 = unclear. undefined = declared by namespace. */
    private declaringClassSigID?: number;
    /** @internal Formal NamespaceSigID of the declaring namespace. -1 = unclear. undefined = declared by class. */
    private declaringNamespaceSigID?: number;
    /**
     * @internal Temp ClassSigID for the unclear declaring class (reference-semantics).
     * B 轮（索引表）后是唯一的 temp 侧状态——取回走 slot、迁移经替换记录惰性
     * 物化（tempSigID 保留作痕迹）。历史 display 锚（declaringSignatureDisplay）
     * 已删：U+ 后 alias declaring 是独立 formal 条目自持 display，普通场景
     * canonical 与传入实例值等价。
     */
    private declaringClassTempSigID?: number;

    private static readonly logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'FieldSignature');

    /** The canonical DEFAULT signature (formal sigID 0 in the registry). */
    public static get DEFAULT(): FieldSignature {
        return SignatureCanonicalizerRegistry.getInstance().fieldSigCanonicalizer.get(0)!;
    }

    /**
     * Build from a declaring signature instance (backward-compatible value constructor).
     * Unclear declaring signatures are routed to the temp canonicalizer (reference
     * semantics, independently migratable); clear ones are interned into the formal space.
     * @deprecated Pass formal SigIDs instead: the class-ID overload, or the namespace-ID
     * overload with the trailing literal `true`.
     */
    constructor(fieldName: string, declaringSignature: BaseSignature, type: Type, staticFlag?: boolean);
    /**
     * Build directly from the declaring class's formal ClassSigID (must already be interned).
     */
    constructor(fieldName: string, declaringClassSigID: number, type: Type, staticFlag?: boolean);
    /**
     * Build directly from the declaring namespace's formal NamespaceSigID (must already be
     * interned). The trailing literal `true` disambiguates the namespace ID space from the
     * class ID space. Note: staticFlag is required in this overload (TS optional-parameter
     * ordering).
     */
    constructor(fieldName: string, declaringNamespaceSigID: number, type: Type, staticFlag: boolean, namespaceDeclared: true);
    constructor(fieldName: string, declaringOrID: BaseSignature | number, type: Type, staticFlag: boolean = false, namespaceDeclared?: true) {
        this.fieldName = fieldName;
        this.type = type;
        this.staticFlag = staticFlag;
        this.setDeclaringFields(declaringOrID, namespaceDeclared);
        this.recomputeHashCode();
    }

    /**
     * @internal 解析 declaring 并写入三个 SigID 字段（构造器与 {@link applyFields}
     * 共用）：数字重载直存；对象重载按 isUnclear 分流（unclear class → temp 登记；
     * clear → formal 只读命中；unclear ns → 仅标记 -1）。
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
                this.declaringClassSigID = requireExistingId('FieldSignature', declaringOrID, reg.classSigCanonicalizer);
            }
        } else {
            if (declaringOrID.isUnclear()) {
                // Unclear namespace: mark only — no temp registration (the temp namespace
                // space never had a production registrant; the unclear-ns form is a
                // marking-only shape with no SigID-path retrieval — callers keep the
                // signature instance themselves when needed).
                this.declaringNamespaceSigID = -1;
            } else {
                this.declaringNamespaceSigID = requireExistingId('FieldSignature', declaringOrID, reg.namespaceSigCanonicalizer);
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
     * @internal A2 批 4：参数式就地演进原语——不经过中间实例 N，直接按参数赋值
     * 字段 + 解析 declaring + 重算 hash（编号不变）。供持有者更新入口的参数式
     * 路径（决策表"未毕业抄写"分支的零分配版）使用。
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
            // B 轮（索引表）三级查：temp slot（未迁移）→ 替换记录 formal（已迁移，
            // 惰性物化写回 declaringClassSigID，declaringClassTempSigID 保留作痕迹）。
            const sig = reg.tempClassSigCanonicalizer.get(this.declaringClassTempSigID);
            if (sig !== undefined) {
                return sig;
            }
            const formalId = reg.tempClassSigCanonicalizer.getReplacement(this.declaringClassTempSigID);
            if (formalId !== -1) {
                const formalSig = reg.classSigCanonicalizer.get(formalId);
                if (formalSig !== undefined) {
                    this.declaringClassSigID = formalId;
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
        if (this === other) return true;
        if (this.fieldName !== other.fieldName) return false;
        if (this.staticFlag !== other.staticFlag) return false;
        return this.declaringClassSigID === other.declaringClassSigID && this.declaringNamespaceSigID === other.declaringNamespaceSigID && this.declaringClassTempSigID === other.declaringClassTempSigID;
    }

    /** @internal Whether this signature is the canonical DEFAULT (formal sigID 0 in the registry). */
    public isDefault(): boolean {
        return SignatureCanonicalizerRegistry.getInstance().fieldSigCanonicalizer.getExistingId(this) === 0;
    }

    /** @internal Whether the declaring signature is unclear (temp-held, unresolved). */
    public isUnclear(): boolean {
        if (this.isDefault()) return false;
        if (this.declaringClassSigID === -1 || this.declaringNamespaceSigID === -1) {
            return true;
        }
        const declaringSignature = this.getDeclaringSignature();
        if (declaringSignature instanceof ClassSignature && declaringSignature.isDefault()) return false;
        // ID 快判（FileSigID 0 即 FileSignature.DEFAULT）：省去 fileSig canonicalizer 的
        // get + getExistingId 两次 Map 查找。
        return declaringSignature.getDeclaringFileSigID() === 0;
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
 * @category core/model
 */
export class MethodSignature {
    private methodSubSignature: MethodSubSignature;
    private readonly hashCode: number;

    /** @internal Formal ClassSigID for the declaring class. -1 = unclear (temp-held). */
    private declaringClassSigID: number;
    /**
     * @internal Temp ClassSigID for the unclear declaring class (reference-semantics).
     * B 轮（索引表）后是唯一的 temp 侧状态——取回走 slot、迁移经替换记录惰性
     * 物化（tempSigID 保留作痕迹）。历史 display 锚（declaringClassSignatureDisplay）
     * 已删：U+ 后 alias declaring 是独立 formal 条目自持 display，普通场景
     * canonical 与传入实例值等价。
     */
    private declaringClassTempSigID?: number;

    private static readonly logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'MethodSignature');

    /** The canonical DEFAULT signature (formal sigID 0 in the registry). */
    public static get DEFAULT(): MethodSignature {
        return SignatureCanonicalizerRegistry.getInstance().methodSigCanonicalizer.get(0)!;
    }

    /**
     * Build from a declaring class signature instance (backward-compatible value constructor).
     * Unclear declaring signatures are routed to the temp canonicalizer (reference
     * semantics, independently migratable); clear ones resolve to their formal ClassSigID.
     * @deprecated Pass the formal ClassSigID instead (e.g. via ArkClass.getClassSigID()).
     */
    constructor(declaringClassSignature: ClassSignature, methodSubSignature: MethodSubSignature);
    /**
     * Build directly from the declaring class's formal ClassSigID (must already be interned).
     */
    constructor(declaringClassSigID: number, methodSubSignature: MethodSubSignature);
    constructor(declaringClassOrID: ClassSignature | number, methodSubSignature: MethodSubSignature) {
        this.methodSubSignature = methodSubSignature;
        if (typeof declaringClassOrID === 'number') {
            this.declaringClassSigID = declaringClassOrID;
        } else {
            const reg = SignatureCanonicalizerRegistry.getInstance();
            if (declaringClassOrID.isUnclear()) {
                this.declaringClassSigID = -1;
                this.declaringClassTempSigID = reg.tempClassSigCanonicalizer.register(declaringClassOrID);
            } else {
                this.declaringClassSigID = requireExistingId('MethodSignature', declaringClassOrID, reg.classSigCanonicalizer);
            }
        }
        let h = 0xdeadbeef;
        h = hashCombineU32(h, this.declaringClassSigID);
        h = hashCombineU32(h, this.declaringClassTempSigID ?? 0);
        h = hashCombineU32(h, hashString32(methodSubSignature.toString()));
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
     * @example
     * 1. get class signature from ArkMethod.

  ```typescript
  let methodSignature = expr.getMethodSignature();
  let name = methodSignature.getDeclaringClassSignature().getClassName();
  ```
     *
     */
    public getDeclaringClassSignature(): ClassSignature {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        if (this.declaringClassSigID >= 0) {
            const sig = reg.classSigCanonicalizer.get(this.declaringClassSigID);
            if (sig !== undefined) {
                return sig;
            }
        } else if (this.declaringClassTempSigID !== undefined) {
            // B 轮（索引表）三级查：temp slot（未迁移）→ 替换记录 formal（已迁移，
            // 惰性物化写回 declaringClassSigID，declaringClassTempSigID 保留作痕迹）。
            const sig = reg.tempClassSigCanonicalizer.get(this.declaringClassTempSigID);
            if (sig !== undefined) {
                return sig;
            }
            const formalId = reg.tempClassSigCanonicalizer.getReplacement(this.declaringClassTempSigID);
            if (formalId !== -1) {
                const formalSig = reg.classSigCanonicalizer.get(formalId);
                if (formalSig !== undefined) {
                    this.declaringClassSigID = formalId;
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

    public toMapKey(): string {
        return this.getDeclaringClassSignature().toMapKey() + '.' + this.methodSubSignature.toString();
    }

    public getHashCode(): number {
        return this.hashCode;
    }

    public equals(other: MethodSignature): boolean {
        if (this === other) return true;
        if (this.declaringClassSigID !== other.declaringClassSigID) return false;
        if (this.declaringClassTempSigID !== other.declaringClassTempSigID) return false;
        if (this.methodSubSignature.toString() !== other.methodSubSignature.toString()) return false;
        // The return type participates in equality (like isMatch) so that overloads differing
        // only in return type intern to distinct IDs. It is intentionally NOT part of the
        // cached hash: type inference mutates return types in place, and keeping the hash
        // stable allows re-interning the mutated signature to the same ID (hash-equal is a
        // legal superset of equals-equal).
        return this.methodSubSignature.getReturnType().toString() === other.methodSubSignature.getReturnType().toString();
    }

    /** @internal Whether this signature is the canonical DEFAULT (formal sigID 0 in the registry). */
    public isDefault(): boolean {
        return SignatureCanonicalizerRegistry.getInstance().methodSigCanonicalizer.getExistingId(this) === 0;
    }

    /** @internal Whether the declaring class is unclear (temp-held, unresolved). */
    public isUnclear(): boolean {
        if (this.isDefault()) return false;
        if (this.declaringClassSigID === -1) return true;
        if (this.declaringClassSigID === 0) return false;
        // ID 快判（FileSigID 0 即 FileSignature.DEFAULT）：原三环链
        // （classSig Map 查 → fileSig Map 查 → getExistingId Map 查）收敛为一次
        // classSig Map 查 + 字段读。
        return this.getDeclaringClassSignature().getDeclaringFileSigID() === 0;
    }

    public isMatch(signature: MethodSignature): boolean {
        return this.toString() === signature.toString() && this.getType().toString() === signature.getType().toString();
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

//TODO, reconstruct
export function fieldSignatureCompare(leftSig: FieldSignature, rightSig: FieldSignature): boolean {
    if (leftSig.getDeclaringSignature().toString() === rightSig.getDeclaringSignature().toString() && leftSig.getFieldName() === rightSig.getFieldName()) {
        return true;
    }
    return false;
}

export function methodSignatureCompare(leftSig: MethodSignature, rightSig: MethodSignature): boolean {
    if (
        classSignatureCompare(leftSig.getDeclaringClassSignature(), rightSig.getDeclaringClassSignature()) &&
        methodSubSignatureCompare(leftSig.getMethodSubSignature(), rightSig.getMethodSubSignature())
    ) {
        return true;
    }
    return false;
}

export function methodSubSignatureCompare(leftSig: MethodSubSignature, rightSig: MethodSubSignature): boolean {
    if (
        leftSig.getMethodName() === rightSig.getMethodName() &&
        arrayCompare(leftSig.getParameterTypes(), rightSig.getParameterTypes()) &&
        leftSig.getReturnType() === rightSig.getReturnType() &&
        leftSig.isStatic() === rightSig.isStatic()
    ) {
        return true;
    }
    return false;
}

export function classSignatureCompare(leftSig: ClassSignature, rightSig: ClassSignature): boolean {
    if (fileSignatureCompare(leftSig.getDeclaringFileSignature(), rightSig.getDeclaringFileSignature()) && leftSig.getClassName() === rightSig.getClassName()) {
        return true;
    }
    return false;
}

export function fileSignatureCompare(leftSig: FileSignature, rightSig: FileSignature): boolean {
    if (leftSig.getFileName() === rightSig.getFileName() && leftSig.getProjectName() === rightSig.getProjectName()) {
        return true;
    }
    return false;
}

function arrayCompare(leftArray: any[], rightArray: any[]): boolean {
    if (leftArray.length !== rightArray.length) {
        return false;
    }
    for (let i = 0; i < leftArray.length; i++) {
        if (leftArray[i] !== rightArray[i]) {
            return false;
        }
    }
    return true;
}

export function genSignature4ImportClause(arkFileName: string, importClauseName: string): string {
    return `<${arkFileName}>.<${importClauseName}>`;
}
