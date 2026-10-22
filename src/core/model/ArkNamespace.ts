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

import { ArkExport, ExportInfo, ExportType } from './ArkExport';
import { ArkClass } from './ArkClass';
import { ArkFile, Language } from './ArkFile';
import { ArkMethod } from './ArkMethod';
import { ClassSignature, NamespaceSignature } from './ArkSignature';
import { ALL } from '../common/TSConst';
import { FullPosition } from '../base/Position';
import { ArkBaseModel } from './ArkBaseModel';
import { ArkError } from '../common/ArkError';
import { SdkUtils } from '../common/SdkUtils';
import { SignatureCanonicalizerRegistry } from '../common/SignatureCanonicalizerRegistry';

/**
 * @category core/model
 */
export class ArkNamespace extends ArkBaseModel implements ArkExport {
    private sourceCodes?: string[];
    /** The full positions of this namespace (can have multiple positions for merged namespaces). */
    private originFullPositions!: FullPosition[];

    /** @internal Formal FileSigID for the declaring file. -1 = not yet interned. */
    private declaringFileID: number = -1;

    /** @internal Formal NamespaceSigID for the declaring namespace. undefined = top-level namespace (declaring is ArkFile). */
    private declaringNamespaceSigID?: number;

    /** @internal Formal NamespaceSigID of this namespace. -1 = not yet set. */
    private namespaceSigID: number = -1;

    private exportInfos: Map<string, ExportInfo> = new Map<string, ExportInfo>();

    /** @internal Formal ClassSigID for the default class. -1 = not yet set. */
    private defaultClassSigID: number = -1;

    /** @internal SigIDs of direct (top-level) child classes. undefined = no classes allocated yet. */
    private topClassSigIDs?: Int32Array;
    private topClassCount: number = 0;

    /** @internal SigIDs of direct (top-level) child namespaces. undefined = no namespaces allocated yet. */
    private topNamespaceSigIDs?: Int32Array;
    private topNamespaceCount: number = 0;

    /** @internal Get the Registry singleton. */
    private get registry(): SignatureCanonicalizerRegistry {
        return SignatureCanonicalizerRegistry.getInstance();
    }

    private anonymousClassNumber: number = 0;

    private anonymousNamespaceNumber: number = 0;

    /**
     * @deprecated Construct with declaring IDs and (optionally) the signature object instead.
     */
    constructor();
    /**
     * Build directly from the declaring IDs and the (not yet registered) signature object.
     * `setSignature` is the registration point: it interns the signature, assigns the
     * NamespaceSigID, and registers this namespace as the model on first interning.
     * @param declaringFileID - Formal FileSigID of the declaring file (top-level namespaces).
     * @param declaringNamespaceSigID - Formal NamespaceSigID of the declaring (parent)
     *        namespace; omit for top-level namespaces.
     * @param namespaceSignature - The signature object; not yet registered — registration
     *        happens inside via setSignature.
     */
    constructor(declaringFileID: number, declaringNamespaceSigID?: number, namespaceSignature?: NamespaceSignature);
    constructor(declaringFileID?: number, declaringNamespaceSigID?: number, namespaceSignature?: NamespaceSignature) {
        super();
        if (declaringFileID !== undefined) {
            this.declaringFileID = declaringFileID;
        }
        if (declaringNamespaceSigID !== undefined) {
            this.declaringNamespaceSigID = declaringNamespaceSigID;
        }
        if (namespaceSignature) {
            this.setSignature(namespaceSignature);
        }
    }

    /**
     * Returns the program language of the file where this namespace defined.
     */
    public getLanguage(): Language {
        return this.getDeclaringArkFile().getLanguage();
    }

    public addNamespace(namespace: ArkNamespace): void {
        const existing = this.getNamespace(namespace.getSignature());
        if (existing) {
            // Merge content of namespaces with the same name
            namespace.getClasses().forEach(cls => existing.addArkClass(cls));
            namespace.getNamespaces().forEach(ns => existing.addNamespace(ns));
            return;
        }
        this.addTopNamespaceSigID(namespace.getNamespaceSigID());
    }

    public getNamespace(namespaceSignature: NamespaceSignature): ArkNamespace | null {
        // O(1) 归属初筛：签名的 declaringNamespaceSigID 直比本 namespace 的 SigID。
        const declaring = namespaceSignature.getDeclaringNamespaceSigID();
        if (declaring !== undefined && declaring >= 0 && this.namespaceSigID >= 0 && declaring !== this.namespaceSigID) {
            return null;
        }
        const id = this.registry.namespaceSigCanonicalizer.getExistingId(namespaceSignature);
        if (id !== -1 && this.hasTopNamespaceWithID(id)) {
            return this.registry.namespaceSigCanonicalizer.getModel(id) ?? null;
        }
        return null;
    }

    public getNamespaceWithName(namespaceName: string): ArkNamespace | null {
        // 精确匹配：拼本容器归属签名直查（复用 canonicalizer 值索引，O(1)，对齐getClassWithName）。
        if (this.namespaceSigID >= 0 && this.declaringFileID >= 0) {
            return this.getNamespace(new NamespaceSignature(namespaceName, this.declaringFileID, this.namespaceSigID));
        }
        return null;
    }

    public getNamespaces(): ArkNamespace[] {
        const arr = this.topNamespaceSigIDs;
        if (!arr) {
            return [];
        }
        const reg = this.registry;
        const result: ArkNamespace[] = [];
        for (let i = 0; i < this.topNamespaceCount; i++) {
            const ns = reg.namespaceSigCanonicalizer.getModel(arr[i]);
            if (ns) {
                result.push(ns);
            }
        }
        return result;
    }

    /** @internal Returns the SigIDs of direct child namespaces, or null if no namespaces exist. */
    public getTopNamespaceSigIDs(): Int32Array | null {
        return this.topNamespaceSigIDs?.subarray(0, this.topNamespaceCount) ?? null;
    }

    /** @internal Returns the number of direct child namespaces. */
    public getTopNamespaceCount(): number {
        return this.topNamespaceCount;
    }

    /** @internal Checks whether a namespace with the given SigID is a direct child of this namespace. */
    public hasTopNamespaceWithID(id: number): boolean {
        const arr = this.topNamespaceSigIDs;
        if (!arr) {
            return false;
        }
        const count = this.topNamespaceCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                return true;
            }
        }
        return false;
    }

    /** @internal Returns the direct child namespace with the given SigID, or undefined. */
    public getTopNamespaceByID(id: number): ArkNamespace | undefined {
        if (this.hasTopNamespaceWithID(id)) {
            return SignatureCanonicalizerRegistry.getInstance().getNamespaceById(id);
        }
        return undefined;
    }

    /** @internal Ensures the Int32Array has at least minCapacity slots. */
    private ensureTopNamespaceCapacity(minCapacity: number): void {
        if (!this.topNamespaceSigIDs) {
            this.topNamespaceSigIDs = new Int32Array(Math.max(minCapacity, 8));
            return;
        }
        if (this.topNamespaceSigIDs.length < minCapacity) {
            const newCapacity = Math.max(minCapacity, this.topNamespaceSigIDs.length * 2);
            const newArray = new Int32Array(newCapacity);
            newArray.set(this.topNamespaceSigIDs.subarray(0, this.topNamespaceCount));
            this.topNamespaceSigIDs = newArray;
        }
    }

    /** @internal Appends a namespace SigID to the parallel index. */
    private addTopNamespaceSigID(id: number): void {
        this.ensureTopNamespaceCapacity(this.topNamespaceCount + 1);
        this.topNamespaceSigIDs![this.topNamespaceCount++] = id;
    }

    /** @internal Removes a namespace SigID from the parallel index (swap-remove). */
    private removeTopNamespaceSigID(id: number): void {
        const arr = this.topNamespaceSigIDs;
        if (!arr) {
            return;
        }
        const count = this.topNamespaceCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                arr[i] = arr[--this.topNamespaceCount];
                return;
            }
        }
    }

    /** @internal Returns the SigIDs of direct child classes, or null if no classes exist. */
    public getTopClassSigIDs(): Int32Array | null {
        return this.topClassSigIDs?.subarray(0, this.topClassCount) ?? null;
    }

    /** @internal Returns the number of direct child classes. */
    public getTopClassCount(): number {
        return this.topClassCount;
    }

    /** @internal Checks whether a class with the given SigID is a direct child of this namespace. */
    public hasTopClassWithID(id: number): boolean {
        const arr = this.topClassSigIDs;
        if (!arr) {
            return false;
        }
        const count = this.topClassCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                return true;
            }
        }
        return false;
    }

    /** @internal Returns the direct child class with the given SigID, or undefined. */
    public getTopClassByID(id: number): ArkClass | undefined {
        if (this.hasTopClassWithID(id)) {
            return SignatureCanonicalizerRegistry.getInstance().getClassById(id);
        }
        return undefined;
    }

    /** @internal Ensures the class Int32Array has at least minCapacity slots. */
    private ensureTopClassCapacity(minCapacity: number): void {
        if (!this.topClassSigIDs) {
            this.topClassSigIDs = new Int32Array(Math.max(minCapacity, 8));
            return;
        }
        if (this.topClassSigIDs.length < minCapacity) {
            const newCapacity = Math.max(minCapacity, this.topClassSigIDs.length * 2);
            const newArray = new Int32Array(newCapacity);
            newArray.set(this.topClassSigIDs.subarray(0, this.topClassCount));
            this.topClassSigIDs = newArray;
        }
    }

    /** @internal Appends a class SigID to the index. */
    private addTopClassSigID(id: number): void {
        this.ensureTopClassCapacity(this.topClassCount + 1);
        this.topClassSigIDs![this.topClassCount++] = id;
    }

    /** @internal Removes a class SigID from the index (swap-remove). */
    private removeTopClassSigID(id: number): void {
        const arr = this.topClassSigIDs;
        if (!arr) {
            return;
        }
        const count = this.topClassCount;
        for (let i = 0; i < count; i++) {
            if (arr[i] === id) {
                arr[i] = arr[--this.topClassCount];
                return;
            }
        }
    }

    public setSignature(namespaceSignature: NamespaceSignature): void {
        // 三态处理（与 ArkClass.setSignature 对齐）：
        // 新值首建 → 注册；驱逐态恢复 → 补注册；已有别的 model 持有该签名 → 不覆盖。
        const existing = this.registry.namespaceSigCanonicalizer.getExistingId(namespaceSignature);
        this.namespaceSigID = existing >= 0 ? existing : this.registry.namespaceSigCanonicalizer.getOrCreateId(namespaceSignature);
        if (existing < 0 || this.registry.namespaceSigCanonicalizer.getModel(existing) === undefined) {
            this.registry.registerNamespace(this);
        }
    }

    /** @internal Get the formal NamespaceSigID of this namespace. */
    public getNamespaceSigID(): number {
        return this.namespaceSigID;
    }

    /**
     * Returns the unique ID of this model — the NamespaceSigID in the canonicalizer.
     * The signature table and the model table share one dense ID space, so this ID
     * resolves both the signature and the model.
     */
    public getId(): number {
        return this.namespaceSigID;
    }

    public getSignature(): NamespaceSignature {
        return this.registry.namespaceSigCanonicalizer.get(this.namespaceSigID)!;
    }

    public getNamespaceSignature(): NamespaceSignature {
        return this.getSignature();
    }

    public getName(): string {
        return this.getSignature().getNamespaceName();
    }

    public getCode(): string {
        const codes = this.getCodes();
        return codes.length > 0 ? codes[0] : '';
    }

    /**
     * @deprecated Source text is now stored on ArkFile only. This method has no effect.
     * @param _sourceCode - The source code (ignored).
     */
    public setCode(_sourceCode: string): void {}

    /**
     * Returns the source texts of this namespace extracted from the declaring ArkFile
     * using the namespace's origin positions. Implements lazy loading with caching.
     * A namespace may have multiple source segments (for merged namespaces).
     * @returns An array of source texts extracted from each origin position.
     */
    public getCodes(): string[] {
        if (this.sourceCodes !== undefined) {
            return this.sourceCodes;
        }
        const file = this.getDeclaringArkFile();
        const codes = this.originFullPositions
            .map(position => file.getSourceTextByFullPosition(position))
            .filter((code): code is string => code !== undefined);
        this.sourceCodes = codes;
        return codes;
    }

    /**
     * @deprecated Source text is now stored on ArkFile only. This method has no effect.
     * @param _sourceCodes - The source codes array (ignored).
     */
    public setCodes(_sourceCodes: string[]): void {}

    /**
     * @deprecated Source text is now stored on ArkFile only. This method has no effect.
     * @param _sourceCode - The source code (ignored).
     */
    public addCode(_sourceCode: string): void {}

    /**
     * @deprecated Use getOriginFullPositions()[0]?.getFirstLine() instead.
     * @returns The line number of the first namespace position.
     */
    public getLine(): number {
        return this.originFullPositions[0]?.getFirstLine() ?? 0;
    }

    /**
     * @deprecated Use setOriginFullPositions() instead.
     * @param line - The line number to set.
     */
    public setLine(line: number): void {
        if (this.originFullPositions && this.originFullPositions.length > 0) {
            const firstCol = this.originFullPositions[0].getFirstCol();
            const lastLine = this.originFullPositions[0].getLastLine();
            const lastCol = this.originFullPositions[0].getLastCol();
            this.originFullPositions[0] = new FullPosition(line, firstCol, lastLine, lastCol);
        }
    }

    /**
     * @deprecated Use getOriginFullPositions()[0]?.getFirstCol() instead.
     * @returns The column number of the first namespace position.
     */
    public getColumn(): number {
        return this.originFullPositions[0]?.getFirstCol() ?? 0;
    }

    /**
     * @deprecated Use setOriginFullPositions() instead.
     * @param column - The column number to set.
     */
    public setColumn(column: number): void {
        if (this.originFullPositions && this.originFullPositions.length > 0) {
            const firstLine = this.originFullPositions[0].getFirstLine();
            const lastLine = this.originFullPositions[0].getLastLine();
            const lastCol = this.originFullPositions[0].getLastCol();
            this.originFullPositions[0] = new FullPosition(firstLine, column, lastLine, lastCol);
        }
    }

    /**
     * @deprecated Use getOriginFullPositions().map() instead.
     * @returns The line/column pairs of all namespace positions.
     */
    public getLineColPairs(): [number, number][] {
        const lineColPairs: [number, number][] = [];
        this.originFullPositions?.forEach(position => {
            lineColPairs.push([position.getFirstLine(), position.getFirstCol()]);
        });
        return lineColPairs;
    }

    /**
     * @deprecated Use setOriginFullPositions() instead.
     * @param lineColPairs - The line/column pairs to set.
     */
    public setLineCols(lineColPairs: [number, number][]): void {
        this.originFullPositions = [];
        lineColPairs.forEach(lineColPair => {
            this.originFullPositions.push(new FullPosition(lineColPair[0], lineColPair[1], lineColPair[0], lineColPair[1]));
        });
    }

    /**
     * Returns the full positions of this namespace in the source file.
     * A namespace can have multiple positions when merged from multiple namespaces with the same name.
     * @returns An array of full positions in the source code.
     */
    public getOriginFullPositions(): FullPosition[] {
        return this.originFullPositions ?? [];
    }

    /**
     * Sets the full positions of this namespace in the source file.
     * @param positions - An array of full positions in the source code to set.
     */
    public setOriginFullPositions(positions: FullPosition[]): void {
        this.originFullPositions = [...positions];
    }

    public getDeclaringInstance(): ArkNamespace | ArkFile {
        const ns = this.getDeclaringArkNamespace();
        if (ns) {
            return ns;
        }
        return this.getDeclaringArkFile();
    }

    public getDeclaringArkFile(): ArkFile {
        if (this.declaringFileID !== -1) {
            return SignatureCanonicalizerRegistry.getInstance().fileSigCanonicalizer.getModel(this.declaringFileID)!;
        }
        return undefined as unknown as ArkFile;
    }

    /**
     * @deprecated Use the ID-injecting constructor
     * {@link constructor(declaringFileID, declaringNamespaceSigID, namespaceSignature)} or
     * {@link setDeclaringFileID} instead.
     */
    public setDeclaringArkFile(declaringArkFile: ArkFile): void {
        this.declaringFileID = declaringArkFile.getFileSigID();
    }

    /** @internal Get the formal FileSigID of the declaring file. Returns -1 if not interned. */
    public getDeclaringFileID(): number {
        return this.declaringFileID;
    }

    public getDeclaringArkNamespace(): ArkNamespace | null {
        if (this.declaringNamespaceSigID !== undefined) {
            return this.registry.namespaceSigCanonicalizer.getModel(this.declaringNamespaceSigID) ?? null;
        }
        return null;
    }

    /**
     * @deprecated Use the ID-injecting constructor
     * {@link constructor(declaringFileID, declaringNamespaceSigID, namespaceSignature)}
     * instead — it covers both the parent SigID and the inherited file ID.
     */
    public setDeclaringArkNamespace(declaringArkNamespace: ArkNamespace): void {
        this.declaringNamespaceSigID = declaringArkNamespace.getNamespaceSigID();
        this.declaringFileID = declaringArkNamespace.getDeclaringFileID();
    }

    public getClass(classSignature: ClassSignature): ArkClass | null {
        // O(1) 归属初筛：签名的 declaringNamespaceSigID 直比本 namespace 的 SigID 顶层类签名该值为 undefined，直接 miss）。
        // AliasClassSignature 的 hash/equals 继承父类三元组（originName + 双归属 SigID），与源签名值等价，getExistingId 直接命中，无需名字匹配。
        if (classSignature.getDeclaringNamespaceSigID() !== this.namespaceSigID) {
            return null;
        }
        const id = this.registry.classSigCanonicalizer.getExistingId(classSignature);
        if (id !== -1 && this.hasTopClassWithID(id)) {
            return this.registry.classSigCanonicalizer.getModel(id) ?? null;
        }
        return null;
    }

    public getClassWithName(className: string): ArkClass | null {
        // 精确匹配：拼本容器归属签名直查（复用 canonicalizer 的值索引，O(1)）
        if (this.namespaceSigID >= 0 && this.declaringFileID >= 0) {
            return this.getClass(ClassSignature.probe(className, this.declaringFileID, this.namespaceSigID));
        }
        return null;
    }

    public getClasses(): ArkClass[] {
        const arr = this.topClassSigIDs;
        if (!arr) {
            return [];
        }
        const reg = this.registry;
        const result: ArkClass[] = [];
        for (let i = 0; i < this.topClassCount; i++) {
            const cls = reg.classSigCanonicalizer.getModel(arr[i]);
            if (cls) {
                result.push(cls);
            }
        }
        return result;
    }

    public addArkClass(arkClass: ArkClass): void {
        const existing = this.getTopClassByID(arkClass.getClassSigID());
        if (existing) {
            SdkUtils.copyMembers(arkClass, existing);
        } else {
            this.addTopClassSigID(arkClass.getClassSigID());
        }
    }

    public getExportInfos(): ExportInfo[] {
        const exportInfos: ExportInfo[] = [];
        this.exportInfos.forEach((value, key) => {
            if (key !== ALL || value.getFrom()) {
                exportInfos.push(value);
            }
        });
        return exportInfos;
    }

    public getExportInfoBy(name: string): ExportInfo | undefined {
        return this.exportInfos.get(name);
    }

    public addExportInfo(exportInfo: ExportInfo): void {
        this.exportInfos.set(exportInfo.getExportClauseName(), exportInfo);
    }

    public getDefaultClass(): ArkClass {
        if (this.defaultClassSigID !== -1) {
            return this.registry.classSigCanonicalizer.getModel(this.defaultClassSigID)!;
        }
        return undefined as unknown as ArkClass;
    }

    public setDefaultClass(defaultClass: ArkClass): void {
        this.defaultClassSigID = defaultClass.getClassSigID();
    }

    public getAllMethodsUnderThisNamespace(): ArkMethod[] {
        let methods: ArkMethod[] = [];
        for (const cls of this.getClasses()) {
            methods.push(...cls.getMethods());
        }
        for (const ns of this.getNamespaces()) {
            methods.push(...ns.getAllMethodsUnderThisNamespace());
        }
        return methods;
    }

    public getAllClassesUnderThisNamespace(): ArkClass[] {
        let classes: ArkClass[] = [];
        classes.push(...this.getClasses());
        for (const ns of this.getNamespaces()) {
            classes.push(...ns.getAllClassesUnderThisNamespace());
        }
        return classes;
    }

    public getAllNamespacesUnderThisNamespace(): ArkNamespace[] {
        let namespaces: ArkNamespace[] = [];
        const topNamespaces = this.getNamespaces();
        namespaces.push(...topNamespaces);
        for (const ns of topNamespaces) {
            namespaces.push(...ns.getAllNamespacesUnderThisNamespace());
        }
        return namespaces;
    }

    public getAnonymousClassNumber(): number {
        return this.anonymousClassNumber++;
    }

    public getAnonymousNamespaceNumber(): number {
        return this.anonymousNamespaceNumber++;
    }

    getExportType(): ExportType {
        return ExportType.NAME_SPACE;
    }

    public removeArkClass(arkClass: ArkClass): boolean {
        const id = arkClass.getClassSigID();
        const rtn = this.hasTopClassWithID(id);
        if (rtn) {
            this.removeTopClassSigID(id);
            this.registry.removeClass(arkClass);
        }
        return rtn;
    }

    public removeNamespace(namespace: ArkNamespace): boolean {
        const id = namespace.getNamespaceSigID();
        const rtn = this.hasTopNamespaceWithID(id);
        if (rtn) {
            this.removeTopNamespaceSigID(id);
            this.registry.removeNamespace(namespace);
        }
        return rtn;
    }

    public validate(): ArkError {
        return this.validateFields(['declaringFileID', 'namespaceSigID', 'defaultClassSigID']);
    }

    public clearAllReferences(): void {
        for (const cls of this.getClasses()) {
            cls.clearAllReferences();
        }
        for (const ns of this.getNamespaces()) {
            ns.clearAllReferences();
        }
        for (const exp of this.exportInfos.values()) {
            exp.clearAllReferences();
        }
        this.topClassSigIDs = undefined;
        this.topClassCount = 0;
        this.topNamespaceSigIDs = undefined;
        this.topNamespaceCount = 0;
        this.exportInfos.clear();
        this.defaultClassSigID = -1;
        this.declaringFileID = -1;
        this.declaringNamespaceSigID = undefined;
    }
}
