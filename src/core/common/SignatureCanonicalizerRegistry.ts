/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import { FileSignature, ClassSignature, MethodSignature, NamespaceSignature, FieldSignature, MethodSubSignature } from '../model/ArkSignature';
import { ClassType, UnknownType } from '../base/Type';
import { UNKNOWN_CLASS_NAME, UNKNOWN_FIELD_NAME, UNKNOWN_FILE_NAME, UNKNOWN_METHOD_NAME, UNKNOWN_NAMESPACE_NAME, UNKNOWN_PROJECT_NAME } from './Const';
import { ArkFile } from '../model/ArkFile';
import { ArkClass } from '../model/ArkClass';
import { ArkMethod } from '../model/ArkMethod';
import { ArkNamespace } from '../model/ArkNamespace';
import { ArkField } from '../model/ArkField';
import { ArkExport } from '../model/ArkExport';
import { SignatureModelCanonicalizer } from './SignatureModelCanonicalizer';
import { TempSignatureCanonicalizer } from './TempSignatureCanonicalizer';

/**
 * Global singleton registry that centralizes all signature canonicalizers and model storage.
 *
 * Any code can access canonicalizers via `SignatureCanonicalizerRegistry.getInstance()`
 * or static shortcut methods, without needing a Scene reference.
 *
 * **Design constraint**: Assumes a single Scene instance at runtime.
 * For multi-Scene support, change to per-Scene instances — a small modification.
 *
 * **Lifecycle**: `Scene.dispose()` / `Scene.clear()` should call `dispose()`.
 * After dispose, `getInstance()` auto-rebuilds and re-initializes DEFAULT signatures.
 */

/** 单个 temp 索引表空间的统计快照（字段语义见 TempSignatureCanonicalizer.getStats）。 */
export interface TempSpaceStats {
    /** 未迁移（非空 slot）的签名数——含 Builtin stub 池等常驻基线与推导中间垃圾。 */
    liveCount: number;
    /** 历史注册总量（= nextId，永不复用）。 */
    totalRegistered: number;
    /** 已迁移（retire 置空）总量。三数自洽：totalRegistered = liveCount + retiredCount。 */
    retiredCount: number;
    /** 有 formal 归宿记录的迁移数（≤ retiredCount）。 */
    replacedCount: number;
}

export class SignatureCanonicalizerRegistry {
    // --- Formal canonicalizers (value-semantic dedup + model storage) ---

    public readonly fileSigCanonicalizer: SignatureModelCanonicalizer<FileSignature, ArkFile> = new SignatureModelCanonicalizer<FileSignature, ArkFile>();
    public readonly classSigCanonicalizer: SignatureModelCanonicalizer<ClassSignature, ArkClass> = new SignatureModelCanonicalizer<ClassSignature, ArkClass>();
    public readonly namespaceSigCanonicalizer: SignatureModelCanonicalizer<NamespaceSignature, ArkNamespace> = new SignatureModelCanonicalizer<
        NamespaceSignature,
        ArkNamespace
    >();
    public readonly fieldSigCanonicalizer: SignatureModelCanonicalizer<FieldSignature, ArkField> = new SignatureModelCanonicalizer<FieldSignature, ArkField>();
    public readonly methodSigCanonicalizer: SignatureModelCanonicalizer<MethodSignature, ArkMethod> = new SignatureModelCanonicalizer<
        MethodSignature,
        ArkMethod
    >();

    // --- Temp canonicalizers (index-table semantics, see TempSignatureCanonicalizer) ---
    // Note: no tempFile/tempNamespace spaces — both were permanently empty. FileSignature
    // is the identity root (never temp-held), and no production path ever registered a
    // namespace into the temp space (namespace-declaring FieldSignatures go through the
    // SigID overloads; the unclear-ns value-constructor branch only marks SigID = -1).

    public readonly tempClassSigCanonicalizer: TempSignatureCanonicalizer<ClassSignature> = new TempSignatureCanonicalizer<ClassSignature>();
    public readonly tempMethodSigCanonicalizer: TempSignatureCanonicalizer<MethodSignature> = new TempSignatureCanonicalizer<MethodSignature>();
    public readonly tempFieldSigCanonicalizer: TempSignatureCanonicalizer<FieldSignature> = new TempSignatureCanonicalizer<FieldSignature>();

    // --- Maps that cannot be replaced by canonicalizer ---

    /** Custom @Component name → ClassSignature (survives module unload for ViewTree stubs). */
    public customComponentMap: Map<string, ClassSignature> = new Map();

    /**
     * SDK 全局符号多值表（名字 → 实体列表，按登记序；列表 [0] 即单值视图首实体，
     * 即旧单值 Map 的 first-win 语义）。实体种类：顶层 interface/class（ArkClass，
     * 同名跨文件多实体）、全局函数（ArkMethod）、类型别名（AliasType）、namespace
     *（ArkNamespace）、declare var 的 Local（var 侧探测锚点）。存对象引用不存 ID
     *（Local 无 SigID；class/ns 双 ID 空间冲突；对象本就在各 canonicalizer models
     * 中存活，此处仅名字索引）。写入方 SdkUtils.loadAPI 族；读取方 Scene
     * getSdkGlobal 族（委托）。随 dispose() 清理；disposeModule 不清（模块卸载
     * 后全局符号仍可解析，与旧 Scene 字段语义一致）。
     */
    public sdkGlobalMap: Map<string, ArkExport[]> = new Map();

    // --- SDK global symbol queries (owner of sdkGlobalMap) ---
    // 加载边约束：Registry 处于依赖图最底层（一切模块 import 它）。方法内**禁止**
    // 值 import ArkClass/ArkNamespace/Local 等——esbuild 会把这些 import 真实化
    // （基线中它们是纯类型使用、被 elision 剥离），形成 Registry → 模型深链的新
    // 增加载边，翻转 ESM 循环（Registry ↔ base/Type ↔ cpp/ModelUtils → cpp/base/Type
    // extends 未完成类）的进入方向，实测触发 "Class extends value undefined"。
    // 实体判别一律用下面的结构 helper（ArkClass/ArkNamespace 均有 XxxSigID getter，
    // ArkClass/ArkNamespace/Local/ArkMethod/AliasType 的特征互斥）。

    private static isArkClassEntity(e: ArkExport): e is ArkClass {
        const c = e as Partial<Record<'getClassSigID' | 'getFields', unknown>>;
        return typeof c.getClassSigID === 'function' && typeof c.getFields === 'function';
    }

    private static isArkNamespaceEntity(e: ArkExport): e is ArkNamespace {
        const n = e as Partial<Record<'getNamespaceSigID' | 'getNamespaces', unknown>>;
        return typeof n.getNamespaceSigID === 'function' && typeof n.getNamespaces === 'function';
    }

    /**
     * Single-value view of the SDK global map: the first entity registered under
     * the name (legacy first-win semantics). Returns null when unregistered.
     */
    public static getSdkGlobal(globalName: string): ArkExport | null {
        return this.getInstance().sdkGlobalMap.get(globalName)?.[0] ?? null;
    }

    /**
     * All SDK global entities registered under the given name (multi-declaration
     * scenario: e.g. `interface Object` + `declare var Object: ObjectConstructor` are
     * two entities). Order is the registration order; entry [0] equals {@link getSdkGlobal}.
     */
    public static getSdkGlobals(globalName: string): ArkExport[] {
        return this.getInstance().sdkGlobalMap.get(globalName) ?? [];
    }

    /**
     * Get all member-provider classes of a global symbol for member probing —
     * equivalent to the member union the legacy copyMembers merging produced:
     *  - every ArkClass entity registered under the name (same-name interface
     *    declarations across lib files), and
     *  - for `declare var X: XConstructor` locals, the constructor-side class
     *    (XConstructor) plus every entity registered under THAT name.
     * Members resolved against these candidates carry their real declaring class
     * in the signature (version judgement).
     */
    public static getSdkGlobalMemberClasses(globalName: string): ArkClass[] {
        const result: ArkClass[] = [];
        const seen = new Set<ArkClass>();
        const push = (c: ArkClass) => {
            if (!seen.has(c)) {
                seen.add(c);
                result.push(c);
            }
        };
        for (const e of this.getSdkGlobals(globalName)) {
            if (this.isArkClassEntity(e)) {
                push(e);
            } else if (
                // var 声明的 Local 实体结构判别：ArkMethod/AliasType 无 getType，
                // ArkClass/ArkNamespace 已排除。
                !this.isArkNamespaceEntity(e) &&
                typeof (e as { getType?: unknown }).getType === 'function'
            ) {
                const localType = (e as unknown as { getType: () => unknown }).getType();
                if (localType instanceof ClassType) {
                    // Local → ctor class via canonicalizer direct lookup: SDK classes are
                    // registered (setModel) at build time before their var locals enter
                    // the global map, so this is equivalent to the legacy Scene.getClass
                    // path; evicted models miss the same way on both paths.
                    const ctorSig = (localType as ClassType).getClassSignature();
                    const id = this.getInstance().classSigCanonicalizer.getExistingId(ctorSig);
                    const ctorClass = id !== -1 ? this.getInstance().classSigCanonicalizer.getModel(id) : undefined;
                    if (ctorClass !== undefined) {
                        push(ctorClass);
                    }
                    for (const c of this.getSdkGlobals(ctorSig.getClassName())) {
                        if (this.isArkClassEntity(c)) {
                            push(c);
                        }
                    }
                }
            }
        }
        return result;
    }

    /**
     * Get the same-name classes mounted in sibling entities of a class's declaring
     * namespace — for cross-file same-name namespaces (e.g. `Intl` declared across
     * lib.es5 + lib.es20XX.intl), the class's counterpart in each sibling namespace
     * carries members declared in that file. Sibling order follows registration
     * order (= DFS file order); returns [] for non-global namespaces.
     */
    public static getNamespacedSiblingClasses(arkClass: ArkClass): ArkClass[] {
        const ns = arkClass.getDeclaringArkNamespace();
        if (!ns) {
            return [];
        }
        const result: ArkClass[] = [];
        const className = arkClass.getName();
        for (const e of this.getSdkGlobals(ns.getName())) {
            if (this.isArkNamespaceEntity(e) && e !== ns) {
                const c = e.getClassWithName(className);
                if (c) {
                    result.push(c);
                }
            }
        }
        return result;
    }

    // --- Project/SDK file ID boundary ---

    /**
     * fileSigCanonicalizer 的 ID 边界：[1, firstProjectFileSigID) 为 SDK 文件，
     * [firstProjectFileSigID, size) 为 project 文件。ID 0 = DEFAULT，两侧均不属于。
     * -1 = 边界未设置（尚未完成 SDK 构建阶段）。
     *
     * 语义前提：构建时序上全部 SDK（含 oh_modules 依赖包）先于 project 文件注册
     * （见 ModuleBuilder.prepareSdks → buildBasicInfo → genArkFiles），因此边界单调。
     */
    private firstProjectFileSigID: number = -1;

    /**
     * 标记 project/SDK ID 边界。取当前 fileSigCanonicalizer.size()：dense array 语义下，
     * 下一个 intern 的 ID 恰为 size，即首个 project 文件将获得的 ID。重复调用以首次为准
     * （幂等守卫，防止误调用覆盖已成立的边界）。
     */
    public markProjectFileBoundary(): void {
        if (this.firstProjectFileSigID !== -1) {
            return;
        }
        this.firstProjectFileSigID = this.fileSigCanonicalizer.size();
    }

    /** 获取 project/SDK ID 边界。-1 = 未设置。 */
    public getFirstProjectFileSigID(): number {
        return this.firstProjectFileSigID;
    }

    /** 仅凭 FileSigID 快速判断是否为 project 文件。边界未设置时恒返回 false。 */
    public isProjectFileID(id: number): boolean {
        return this.firstProjectFileSigID !== -1 && id >= this.firstProjectFileSigID;
    }

    /**
     * 仅凭 FileSigID 快速判断是否为 SDK 文件。ID 0（DEFAULT）与边界未设置时恒返回 false。
     */
    public isSdkFileID(id: number): boolean {
        return this.firstProjectFileSigID !== -1 && id > 0 && id < this.firstProjectFileSigID;
    }

    private static instance: SignatureCanonicalizerRegistry | undefined;

    private constructor() {
        this.internDefaults();
    }

    /**
     * Get the singleton instance. Auto-creates and initializes DEFAULT signatures on first call
     * (or after `dispose()` was called).
     */
    public static getInstance(): SignatureCanonicalizerRegistry {
        if (!SignatureCanonicalizerRegistry.instance) {
            SignatureCanonicalizerRegistry.instance = new SignatureCanonicalizerRegistry();
        }
        return SignatureCanonicalizerRegistry.instance;
    }

    /**
     * Dispose the singleton: clear all canonicalizers, models, and maps.
     * Next `getInstance()` call will auto-rebuild.
     */
    public static dispose(): void {
        if (SignatureCanonicalizerRegistry.instance) {
            const reg = SignatureCanonicalizerRegistry.instance;
            reg.fileSigCanonicalizer.clear();
            reg.classSigCanonicalizer.clear();
            reg.namespaceSigCanonicalizer.clear();
            reg.fieldSigCanonicalizer.clear();
            reg.methodSigCanonicalizer.clear();
            reg.tempClassSigCanonicalizer.clear();
            reg.tempMethodSigCanonicalizer.clear();
            reg.tempFieldSigCanonicalizer.clear();
            reg.customComponentMap.clear();
            reg.sdkGlobalMap.clear();
            SignatureCanonicalizerRegistry.instance = undefined;
        }
    }

    /** 单个 temp 索引表空间的统计快照（字段语义见 TempSignatureCanonicalizer.getStats）。 */
    public static getTempSpacesStats(): {
        class: TempSpaceStats;
        method: TempSpaceStats;
        field: TempSpaceStats;
    } {
        const reg = this.getInstance();
        return {
            class: reg.tempClassSigCanonicalizer.getStats(),
            method: reg.tempMethodSigCanonicalizer.getStats(),
            field: reg.tempFieldSigCanonicalizer.getStats(),
        };
    }

    /**
     * 返回 temp 索引表空间的精确统计。
     *
     * B 轮（三版索引表）后统计**同步即精确**（slot 强持有、增量计数，无弱表的
     * KeepDuringJob pending-dead 窗口）——历史上的 gc × job 边界轮次（促使
     * FinalizationRegistry 清理死条目）已随弱表机制退役。async 签名保留仅为
     * 调用方兼容（await 无成本）；适合在 inferTypes 完成后、生成报告前调用。
     *
     * @returns 三空间统计（结构与 {@link getTempSpacesStats} 相同）。
     */
    public static async settleTempSpaces(): Promise<{
        class: TempSpaceStats;
        method: TempSpaceStats;
        field: TempSpaceStats;
    }> {
        return this.getTempSpacesStats();
    }

    // --- Static shortcut methods ---

    /** @internal Get the formal FileSigID for a FileSignature. */
    public getFileId(sig: FileSignature): number {
        return this.fileSigCanonicalizer.getExistingId(sig);
    }

    /** @internal Get the formal ClassSigID for a ClassSignature. */
    public getClassId(sig: ClassSignature): number {
        return this.classSigCanonicalizer.getExistingId(sig);
    }

    /** @internal Get the formal MethodSigID for a MethodSignature. */
    public getMethodId(sig: MethodSignature): number {
        return this.methodSigCanonicalizer.getExistingId(sig);
    }

    /** @internal Get the formal NamespaceSigID for a NamespaceSignature. */
    public getNamespaceId(sig: NamespaceSignature): number {
        return this.namespaceSigCanonicalizer.getExistingId(sig);
    }

    /** @internal Get the formal FieldSigID for a FieldSignature. */
    public getFieldId(sig: FieldSignature): number {
        return this.fieldSigCanonicalizer.getExistingId(sig);
    }

    /** @internal Get an ArkFile by its formal FileSigID. */
    public getArkFileById(id: number): ArkFile | undefined {
        return this.fileSigCanonicalizer.getModel(id);
    }

    /** @internal Get an ArkFile by its formal FileSigID. Read-only: never interns the signature. */
    public getArkFileBySig(fileSig: FileSignature): ArkFile | undefined {
        const id = this.fileSigCanonicalizer.getExistingId(fileSig);
        return id === -1 ? undefined : this.fileSigCanonicalizer.getModel(id);
    }

    /** @internal Get an ArkClass by its formal ClassSigID. */
    public getArkClassById(id: number): ArkClass | undefined {
        return this.classSigCanonicalizer.getModel(id);
    }

    /** @internal Get an ArkClass by its formal ClassSigID. Read-only: never interns the signature. */
    public getArkClassBySig(classSig: ClassSignature): ArkClass | undefined {
        const id = this.classSigCanonicalizer.getExistingId(classSig);
        return id === -1 ? undefined : this.classSigCanonicalizer.getModel(id);
    }

    /** @internal Get an ArkMethod by its formal MethodSigID. */
    public getArkMethodById(id: number): ArkMethod | undefined {
        return this.methodSigCanonicalizer.getModel(id);
    }

    /** @internal Get an ArkMethod by its formal MethodSigID. Read-only: never interns the signature. */
    public getArkMethodBySig(methodSig: MethodSignature): ArkMethod | undefined {
        const id = this.methodSigCanonicalizer.getExistingId(methodSig);
        return id === -1 ? undefined : this.methodSigCanonicalizer.getModel(id);
    }

    /** @internal Get an ArkNamespace by its formal NamespaceSigID. */
    public getArkNamespaceById(id: number): ArkNamespace | undefined {
        return this.namespaceSigCanonicalizer.getModel(id);
    }

    /** @internal Get an ArkNamespace by its formal NamespaceSigID. Read-only: never interns the signature. */
    public getArkNamespaceBySig(nsSig: NamespaceSignature): ArkNamespace | undefined {
        const id = this.namespaceSigCanonicalizer.getExistingId(nsSig);
        return id === -1 ? undefined : this.namespaceSigCanonicalizer.getModel(id);
    }

    /** @internal Get an ArkField by its formal FieldSigID. */
    public getArkFieldById(id: number): ArkField | undefined {
        return this.fieldSigCanonicalizer.getModel(id);
    }

    /** @internal Get an ArkField by its formal FieldSigID. Read-only: never interns the signature. */
    public getArkFieldBySig(fieldSig: FieldSignature): ArkField | undefined {
        const id = this.fieldSigCanonicalizer.getExistingId(fieldSig);
        return id === -1 ? undefined : this.fieldSigCanonicalizer.getModel(id);
    }

    // --- Static shortcut methods for model register/remove ---

    /** @internal Register an ArkFile into the file canonicalizer. Skips if fileSigID is 0 (DEFAULT). */
    public registerFile(file: ArkFile): void {
        const id = file.getFileSigID();
        if (id > 0) {
            this.fileSigCanonicalizer.setModel(id, file);
        }
    }

    /** @internal Register an ArkClass into the class canonicalizer. */
    public static registerClass(cls: ArkClass): void {
        this.getInstance().classSigCanonicalizer.setModel(cls.getClassSigID(), cls);
    }

    /** @internal Register an ArkMethod into the method canonicalizer. Skips if methodSigID is undefined (declare-only) or not positive. */
    public static registerMethod(method: ArkMethod): void {
        const id = method.getMethodSigID();
        if (id !== undefined && id > 0) {
            this.getInstance().methodSigCanonicalizer.setModel(id, method);
        }
    }

    /** @internal Register an ArkNamespace into the namespace canonicalizer. Skips if namespaceSigID is 0 (DEFAULT). */
    public static registerNamespace(ns: ArkNamespace): void {
        const id = ns.getNamespaceSigID();
        if (id > 0) {
            this.getInstance().namespaceSigCanonicalizer.setModel(id, ns);
        }
    }

    /**
     * @internal Register a custom @Component into customComponentMap.
     * Entries intentionally survive module unload so ViewTree can still resolve signatures.
     */
    public static registerCustomComponent(cls: ArkClass): void {
        if (!cls.hasComponentDecorator()) {
            return;
        }
        const name = cls.getName();
        if (!name || name.startsWith('%')) {
            return;
        }
        this.getInstance().customComponentMap.set(name, cls.getSignature());
    }

    /**
     * @internal Remove a custom component entry from customComponentMap.
     * Not called on module unload — the map must outlive IR.
     */
    public static unregisterCustomComponent(cls: ArkClass): void {
        const name = cls.getName();
        if (!name || !cls.hasComponentDecorator()) {
            return;
        }
        const reg = this.getInstance();
        const existing = reg.customComponentMap.get(name);
        if (existing && reg.classSigCanonicalizer.getExistingId(existing) === cls.getClassSigID()) {
            reg.customComponentMap.delete(name);
        }
    }

    /** @internal Remove an ArkFile from the file canonicalizer. Returns true if it existed. */
    public static removeFile(file: ArkFile): boolean {
        const id = file.getFileSigID();
        const reg = this.getInstance();
        const existed = reg.fileSigCanonicalizer.getModel(id) !== undefined;
        reg.fileSigCanonicalizer.removeModel(id);
        return existed;
    }

    /** @internal Remove an ArkClass from the class canonicalizer and customComponentMap. Returns true if it existed. */
    public static removeClass(arkClass: ArkClass): boolean {
        this.unregisterCustomComponent(arkClass);
        const id = arkClass.getClassSigID();
        const reg = this.getInstance();
        const existed = reg.classSigCanonicalizer.getModel(id) !== undefined;
        reg.classSigCanonicalizer.removeModel(id);
        return existed;
    }

    /**
     * @internal Remove an ArkClass from the class canonicalizer without touching customComponentMap.
     * Used by disposeModule where customComponentMap entries must survive module unload.
     */
    public static removeClassModel(arkClass: ArkClass): boolean {
        const id = arkClass.getClassSigID();
        const reg = this.getInstance();
        const existed = reg.classSigCanonicalizer.getModel(id) !== undefined;
        reg.classSigCanonicalizer.removeModel(id);
        return existed;
    }

    /** @internal Remove an ArkMethod from the method canonicalizer (impl + declare slots). Returns true if any existed. */
    public static removeMethod(method: ArkMethod): boolean {
        const reg = this.getInstance();
        let existed = false;
        const implID = method.getMethodSigID();
        if (implID !== undefined && implID > 0) {
            existed = reg.methodSigCanonicalizer.getModel(implID) !== undefined;
            reg.methodSigCanonicalizer.removeModel(implID);
        }
        for (const declareID of method.getDeclareSigIDs() ?? []) {
            if (declareID > 0 && reg.methodSigCanonicalizer.getModel(declareID) !== undefined) {
                existed = true;
                reg.methodSigCanonicalizer.removeModel(declareID);
            }
        }
        return existed;
    }

    /** @internal Remove an ArkNamespace from the namespace canonicalizer. Returns true if it existed. */
    public static removeNamespace(namespace: ArkNamespace): boolean {
        const id = namespace.getNamespaceSigID();
        const reg = this.getInstance();
        const existed = reg.namespaceSigCanonicalizer.getModel(id) !== undefined;
        reg.namespaceSigCanonicalizer.removeModel(id);
        return existed;
    }

    /** @internal Register an ArkField into the field canonicalizer. Skips if fieldSigID is 0 (DEFAULT) or -1 (not set). */
    public static registerField(field: ArkField): void {
        const id = field.getFieldSigID();
        if (id > 0) {
            this.getInstance().fieldSigCanonicalizer.setModel(id, field);
        }
    }

    /** @internal Remove an ArkField from the field canonicalizer. Returns true if it existed. */
    public static removeField(field: ArkField): boolean {
        const id = field.getFieldSigID();
        const reg = this.getInstance();
        const existed = reg.fieldSigCanonicalizer.getModel(id) !== undefined;
        reg.fieldSigCanonicalizer.removeModel(id);
        return existed;
    }

    // --- Static shortcut methods for temp canonicalizers ---

    // 注：temp 空间为索引表（三版：slot 强持有 + retire 显式迁移 + 替换记录，
    // 见 TempSignatureCanonicalizer）；持有者直接经 getInstance() 使用各
    // tempXxxSigCanonicalizer（register/get/getReplacement/retire）。

    // --- Instance helper methods ---

    /**
     * Intern the 5 DEFAULT signatures to formal canonicalizers, each obtaining fixed ID 0.
     * ID 0 does not correspond to any model (models[0] remains undefined).
     *
     * All value-object overloads resolve through `getInstance()`, but `instance` is assigned
     * only after this constructor returns — hence every DEFAULT here is built via a
     * SigID constructor overload with the already-interned file DEFAULT (ID 0).
     */
    private internDefaults(): void {
        const fileDefault = new FileSignature(UNKNOWN_PROJECT_NAME, UNKNOWN_FILE_NAME);
        this.fileSigCanonicalizer.getId(fileDefault);
        this.classSigCanonicalizer.getId(new ClassSignature(UNKNOWN_CLASS_NAME, 0, undefined));
        this.namespaceSigCanonicalizer.getId(new NamespaceSignature(UNKNOWN_NAMESPACE_NAME, 0, undefined));
        this.fieldSigCanonicalizer.getId(new FieldSignature(UNKNOWN_FIELD_NAME, 0, UnknownType.getInstance(), false));
        this.methodSigCanonicalizer.getId(new MethodSignature(0, new MethodSubSignature(UNKNOWN_METHOD_NAME, [], UnknownType.getInstance(), false)));
    }
}
