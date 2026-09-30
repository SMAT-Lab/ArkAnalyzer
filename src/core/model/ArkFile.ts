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

import fs from 'fs';
// type-only：消除 core→Scene 的运行时导入边（ArkFile 仅将二者用作类型）。
import type { ModuleScene, Scene } from '../../Scene';
import type { ArkModule } from './ArkModule';
import { ArkExport, ExportInfo } from './ArkExport';
import { ImportInfo } from './ArkImport';
import { ArkClass } from './ArkClass';
import { ArkNamespace } from './ArkNamespace';
import { ClassSignature, FileSignature, NamespaceSignature } from './ArkSignature';
import { ALL } from '../common/TSConst';
import { buildLineStarts, extractSourceTextByFullPosition } from '../common/StringUtils';
import { FullPosition } from '../base/Position';
import { ts } from '../../index';
import { SdkUtils } from '../common/SdkUtils';
import { SignatureCanonicalizerRegistry } from '../common/SignatureCanonicalizerRegistry';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkFile');

export const notStmtOrExprKind = [
    'ModuleDeclaration',
    'ClassDeclaration',
    'InterfaceDeclaration',
    'EnumDeclaration',
    'ExportDeclaration',
    'ExportAssignment',
    'MethodDeclaration',
    'Constructor',
    'FunctionDeclaration',
    'GetAccessor',
    'SetAccessor',
    'ArrowFunction',
    'FunctionExpression',
    'MethodSignature',
    'ConstructSignature',
    'CallSignature',
];

export enum Language {
    TYPESCRIPT = 0,
    ARKTS1_1 = 1,
    ARKTS1_2 = 2,
    JAVASCRIPT = 3,
    CXX = 4,
    ABC = 5,
    UNKNOWN = -1,
}

/**
 * @category core/model
 */
export class ArkFile {
    private language: Language;
    private absoluteFilePath: string = '';
    private projectDir: string = '';
    /** Cached source text of this file, lazily loaded from the file system. */
    private sourceCode?: string;
    /** Cached line-start offsets for {@link sourceCode}; invalidated when code changes. */
    private lineStarts?: number[];

    /** @internal Formal FileSigID of this file. 0 = DEFAULT (not yet set). */
    private fileSigID: number = 0;

    /** @internal Formal ClassSigID for the default class. -1 = not yet interned. */
    private defaultClassID: number = -1;

    /** @internal Whether this file belongs to the current project (true) or is external (SDK/BuiltIn/library, false). */
    private projectFile: boolean = false;

    /** @internal SigIDs of direct (top-level) child classes. undefined = no classes allocated yet. */
    private topClassSigIDSet?: Set<number>;

    /** @internal SigIDs of direct (top-level) child namespaces. undefined = no namespaces allocated yet. */
    private topNamespaceSigIDs?: Int32Array;
    private topNamespaceCount: number = 0;

    private importInfoMap: Map<string, ImportInfo> = new Map<string, ImportInfo>();
    private exportInfoMap: Map<string, ExportInfo> = new Map<string, ExportInfo>();

    private scene!: Scene;
    private moduleScene?: ModuleScene;
    private arkModule?: ArkModule;

    /** @internal Get the Registry singleton. */
    private get registry(): SignatureCanonicalizerRegistry {
        return SignatureCanonicalizerRegistry.getInstance();
    }

    private ohPackageJson5Path!: string[];

    private anonymousClassNumber: number = 0;

    private anonymousNamespaceNumber: number = 0;

    private ast: ts.SourceFile | null = null;

    constructor(language: Language) {
        this.language = language;
    }

    /**
     * Returns the file signature of this file. A file signature consists of project's name and file's name.
     * @returns The file signature of this file.
     */
    public getFileSignature(): FileSignature {
        return this.registry.fileSigCanonicalizer.get(this.fileSigID)!;
    }

    /** @internal */
    public setFileSignature(fileSignature: FileSignature): void {
        // 三态处理（与 ArkClass.setSignature 对齐）：
        // 新值首建 → 注册；驱逐态恢复 → 补注册；已有别的 model 持有该签名 → 不覆盖（防"后 setFileSignature 者顶替"写穿）。
        const existing = this.registry.fileSigCanonicalizer.getExistingId(fileSignature);
        this.fileSigID = existing >= 0 ? existing : this.registry.fileSigCanonicalizer.getOrCreateId(fileSignature);
        if (existing < 0 || this.registry.fileSigCanonicalizer.getModel(existing) === undefined) {
            this.registry.registerFile(this);
        }
    }

    /** @internal Get the formal FileSigID of this file. */
    public getFileSigID(): number {
        return this.fileSigID;
    }

    /**
     * Returns the unique ID of this model — the FileSigID in the canonicalizer.
     * The signature table and the model table share one dense ID space, so this ID
     * resolves both the signature and the model.
     */
    public getId(): number {
        return this.fileSigID;
    }

    /**
     * Returns the program language of the file.
     */
    public getLanguage(): Language {
        return this.language;
    }

    public setLanguage(language: Language): void {
        this.language = language;
    }

    /**
     * Returns the **string** name of the file, which also acts as the file's relative path.
     * @returns The file's name (also means its relative path).
     */
    public getName(): string {
        return this.getFileSignature().getFileName();
    }

    public setScene(scene: Scene): void {
        this.scene = scene;
    }

    /**
     * Returns the scene (i.e., {@link Scene}) built for the project. The {@link Scene} is the core class of ArkAnalyzer,
     * through which users can access all the information of the analyzed code (project),
     * including file list, class list, method list, property list, etc.
     * @returns The scene of the file.
     */
    public getScene(): Scene {
        return this.scene;
    }

    public getModuleScene(): ModuleScene | undefined {
        return this.moduleScene;
    }

    public setModuleScene(moduleScene: ModuleScene): void {
        this.moduleScene = moduleScene;
    }

    public getArkModule(): ArkModule | undefined {
        return this.arkModule;
    }

    public setArkModule(arkModule: ArkModule): void {
        this.arkModule = arkModule;
    }

    public setProjectDir(projectDir: string): void {
        this.projectDir = projectDir;
    }

    public getProjectDir(): string {
        return this.projectDir;
    }

    /**
     * Get a file path.
     * @returns The absolute file path.
     * @example
     * 1. Read source code based on file path.

     ```typescript
     let str = fs.readFileSync(arkFile.getFilePath(), 'utf8');
     ```
     */
    public getFilePath(): string {
        return this.absoluteFilePath;
    }

    public setFilePath(absoluteFilePath: string): void {
        this.absoluteFilePath = absoluteFilePath;
    }

    public setCode(code: string): void {
        this.sourceCode = code;
        this.lineStarts = undefined;
    }

    /**
     * Returns the codes of file as a **string.**
     * Implements lazy loading: if `sourceCode` is not cached, reads from the file system and caches it.
     * @returns the codes of file, or undefined if the file cannot be read.
     */
    public getCode(): string {
        if (this.sourceCode !== undefined) {
            return this.sourceCode;
        }
        try {
            const sourceText = fs.readFileSync(this.absoluteFilePath, 'utf8');
            this.sourceCode = sourceText;
            this.lineStarts = undefined;
            return this.sourceCode;
        } catch (error) {
            logger.warn(`Failed to read file for lazy loading source text: ${error}`);
            return '';
        }
    }

    /**
     * Returns cached absolute offsets of each line start in {@link getCode}.
     * Built once per source text and reused by position-based source extraction.
     */
    public getLineStarts(): number[] {
        if (this.lineStarts === undefined) {
            this.lineStarts = buildLineStarts(this.getCode());
        }
        return this.lineStarts;
    }

    /**
     * Extracts a source slice by full position using the cached {@link getLineStarts} map.
     */
    public getSourceTextByFullPosition(position: FullPosition | undefined): string | undefined {
        return extractSourceTextByFullPosition(this.getCode(), position, this.getLineStarts());
    }

    /**
     * Clears the cached source text, forcing re-read from file system on next getCode call.
     */
    public clearSourceCode(): void {
        this.sourceCode = undefined;
        this.lineStarts = undefined;
    }

    public addArkClass(arkClass: ArkClass): void {
        const existing = this.getTopClassByID(arkClass.getClassSigID());
        if (existing) {
            SdkUtils.copyMembers(arkClass, existing);
        } else {
            if (!this.topClassSigIDSet) {
                this.topClassSigIDSet = new Set<number>();
            }
            this.topClassSigIDSet.add(arkClass.getClassSigID());
        }
    }

    public getDefaultClass(): ArkClass {
        if (this.defaultClassID !== -1) {
            return this.registry.classSigCanonicalizer.getModel(this.defaultClassID)!;
        }
        return undefined as unknown as ArkClass;
    }

    public setDefaultClass(defaultClass: ArkClass): void {
        this.defaultClassID = defaultClass.getClassSigID();
    }

    /** @internal Get the formal ClassSigID of the default class. Returns -1 if not interned. */
    public getDefaultClassID(): number {
        return this.defaultClassID;
    }

    /** @internal Set the formal ClassSigID of the default class directly. */
    public setDefaultClassID(classID: number): void {
        this.defaultClassID = classID;
    }

    /** @internal Whether this file belongs to the current project. */
    public isProjectFile(): boolean {
        return this.projectFile;
    }

    /** @internal Set whether this file belongs to the current project. */
    public setProjectFile(isProject: boolean): void {
        this.projectFile = isProject;
    }

    public getNamespace(namespaceSignature: NamespaceSignature): ArkNamespace | null {
        // O(1) 归属初筛：签名的 declaringFileSigID 直比本 file 的 SigID。
        if (namespaceSignature.getDeclaringFileSigID() !== this.fileSigID) {
            return null;
        }
        const id = this.registry.namespaceSigCanonicalizer.getExistingId(namespaceSignature);
        if (id !== -1 && this.hasTopNamespaceWithID(id)) {
            return this.registry.namespaceSigCanonicalizer.getModel(id) ?? null;
        }
        return null;
    }

    public getNamespaceWithName(namespaceName: string): ArkNamespace | null {
        // 精确匹配：拼本文件归属签名直查（复用 canonicalizer 值索引，O(1)，对齐getClassWithName）；
        // miss 即 null——签名归属是唯一真相，不做线性扫描兜底。
        if (this.fileSigID >= 0) {
            return this.getNamespace(new NamespaceSignature(namespaceName, this.fileSigID));
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

    /** @internal Checks whether a namespace with the given SigID is a direct child of this file. */
    public hasTopNamespaceWithID(id: number): boolean {
        const arr = this.topNamespaceSigIDs;
        if (!arr) {
            return false;
        }
        for (let i = 0; i < this.topNamespaceCount; i++) {
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

    /** @internal Appends a namespace SigID to the index. */
    private addTopNamespaceSigID(id: number): void {
        this.ensureTopNamespaceCapacity(this.topNamespaceCount + 1);
        this.topNamespaceSigIDs![this.topNamespaceCount++] = id;
    }

    /** @internal Removes a namespace SigID from the index (swap-remove). */
    private removeTopNamespaceSigID(id: number): void {
        const arr = this.topNamespaceSigIDs;
        if (!arr) {
            return;
        }
        for (let i = 0; i < this.topNamespaceCount; i++) {
            if (arr[i] === id) {
                arr[i] = arr[--this.topNamespaceCount];
                return;
            }
        }
    }

    /** @internal Returns the SigIDs of direct child classes, or null if no classes exist. */
    public getTopClassSigIDs(): Set<number> | null {
        return this.topClassSigIDSet ?? null;
    }

    /** @internal Returns the number of direct child classes (deduplicated by sigID). */
    public getTopClassCount(): number {
        return this.topClassSigIDSet?.size ?? 0;
    }

    /** @internal Checks whether a class with the given SigID is a direct child of this file. */
    public hasTopClassWithID(id: number): boolean {
        return this.topClassSigIDSet?.has(id) ?? false;
    }

    /** @internal Returns the direct child class with the given SigID, or undefined. */
    public getTopClassByID(id: number): ArkClass | undefined {
        if (this.hasTopClassWithID(id)) {
            return SignatureCanonicalizerRegistry.getInstance().getClassById(id);
        }
        return undefined;
    }

    /**
     * Returns the class based on its class signature. If the class could not be found, **null** will be returned.
     * @param classSignature - the class signature.
     * @returns A class. If there is no class, the return will be a **null**.
     */
    public getClass(classSignature: ClassSignature): ArkClass | null {
        // O(1) 归属初筛：签名的 declaringFileSigID 直比本 file 的 SigID。
        if (classSignature.getDeclaringFileSigID() !== this.fileSigID) {
            return null;
        }
        const id = this.registry.classSigCanonicalizer.getExistingId(classSignature);
        if (id !== -1 && this.hasTopClassWithID(id)) {
            return this.registry.classSigCanonicalizer.getModel(id) ?? null;
        }
        return null;
    }

    public getClassWithName(className: string): ArkClass | null {
        if (this.fileSigID >= 0) {
            const top = this.getClass(ClassSignature.probe(className, this.fileSigID));
            if (top) {
                return top;
            }
        }
        const nsIds = this.topNamespaceSigIDs;
        if (nsIds !== null && nsIds !== undefined) {
            const reg = this.registry;
            for (let i = 0; i < this.topNamespaceCount; i++) {
                const ns = reg.namespaceSigCanonicalizer.getModel(nsIds[i]);
                if (ns) {
                    const cls = this.findClassInNamespace(ns, className);
                    if (cls) {
                        return cls;
                    }
                }
            }
        }
        return null;
    }

    private findClassInNamespace(namespace: ArkNamespace, className: string): ArkClass | null {
        const cls = namespace.getClassWithName(className);
        if (cls) {
            return cls;
        }

        for (const ns of namespace.getNamespaces()) {
            const found = this.findClassInNamespace(ns, className);
            if (found) {
                return found;
            }
        }
        return null;
    }

    public getClasses(): ArkClass[] {
        const set = this.topClassSigIDSet;
        if (!set) {
            return [];
        }
        const result: ArkClass[] = [];
        for (const sigID of set) {
            const cls = SignatureCanonicalizerRegistry.getInstance().getClassById(sigID);
            if (cls) {
                result.push(cls);
            }
        }
        return result;
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

    /**
     * Returns an **array** of import information.
     * The import information includes: clause's name, type, modifiers, location where it is imported from, etc.
     * @returns An **array** of import information.
     */
    public getImportInfos(): ImportInfo[] {
        const imports = Array.from(this.importInfoMap.values());
        if (this.language !== Language.CXX || imports.length < 2) {
            return imports;
        }
        const from0 = (imports[0].getFrom() ?? '').replace(/\\/g, '/').toLowerCase();
        const from1 = (imports[1].getFrom() ?? '').replace(/\\/g, '/').toLowerCase();
        const firstIsSdkStd = from0.includes('/sdk/default/') || from0.includes('/libc++/');
        const secondIsSdkStd = from1.includes('/sdk/default/') || from1.includes('/libc++/');
        if (firstIsSdkStd && !secondIsSdkStd) {
            return [imports[1], imports[0], ...imports.slice(2)];
        }
        return imports;
    }

    public getImportInfoBy(name: string): ImportInfo | undefined {
        return this.importInfoMap.get(name);
    }

    public addImportInfo(importInfo: ImportInfo): void {
        this.importInfoMap.set(importInfo.getImportClauseName(), importInfo);
    }

    public removeImportInfo(importInfo: ImportInfo): boolean {
        return this.importInfoMap.delete(importInfo.getImportClauseName());
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

    public removeArkClass(arkClass: ArkClass): boolean {
        const id = arkClass.getClassSigID();
        const rtn = this.hasTopClassWithID(id);
        if (rtn) {
            this.topClassSigIDSet!.delete(id);
            this.registry.removeClass(arkClass);
        }
        return rtn;
    }

    public getExportInfos(): ExportInfo[] {
        const exportInfos: ExportInfo[] = new Array<ExportInfo>(this.exportInfoMap.size);
        let writeIdx = 0;
        this.exportInfoMap.forEach((value, key) => {
            if (key !== ALL || value.getFrom()) {
                exportInfos[writeIdx++] = value;
            }
        });
        if (writeIdx < exportInfos.length) {
            exportInfos.length = writeIdx;
        }
        return exportInfos;
    }

    /**
     * Find out the {@link ExportInfo} of this {@link ArkFile} by the given export name.
     * It returns an {@link ExportInfo} or 'undefined' if it failed to find.
     * @param name
     * @returns
     * @example
     ```typescript
     // abc.ts ArkFile
     export class A {
     ...
     }

     export namespace B {
     export namespace C {
     export class D {}
     }
     }

     // xyz.ts call getExportInfoBy
     let arkFile = scene.getFile(fileSignature);

     // a is the export class A defined in abc.ts
     let a = arkFile.getExportInfoBy('A');

     // b is the export class D within namespace C defined in abc.ts
     let b = arkFile.getExportInfoBy('B.C.D');
     ```
     */
    public getExportInfoBy(name: string): ExportInfo | undefined {
        const separator = '.';
        const names = name.split(separator);
        if (names.length === 1) {
            return this.exportInfoMap.get(names[0]);
        }

        let index = 0;
        let currExportInfo = this.exportInfoMap.get(names[index]);
        if (currExportInfo === undefined) {
            return undefined;
        }

        for (let i = 1; i < names.length; i++) {
            const arkExport: ArkExport | null | undefined = currExportInfo.getArkExport();
            if (arkExport && arkExport instanceof ArkNamespace) {
                currExportInfo = arkExport.getExportInfoBy(names[i]);
                if (currExportInfo === undefined) {
                    return undefined;
                }
            }
        }
        return currExportInfo;
    }

    public addExportInfo(exportInfo: ExportInfo, key?: string): void {
        this.exportInfoMap.set(key ?? exportInfo.getExportClauseName(), exportInfo);
    }

    public removeExportInfo(exportInfo: ExportInfo, key?: string): void {
        if (key) {
            this.exportInfoMap.delete(key);
            return;
        }
        this.exportInfoMap.delete(exportInfo.getExportClauseName());
    }

    public getProjectName(): string {
        return this.getFileSignature().getProjectName();
    }

    public getModuleName(): string | undefined {
        return this.moduleScene?.getModuleName();
    }

    public setOhPackageJson5Path(ohPackageJson5Path: string[]): void {
        this.ohPackageJson5Path = ohPackageJson5Path;
    }

    public getOhPackageJson5Path(): string[] {
        return this.ohPackageJson5Path;
    }

    public getAllNamespacesUnderThisFile(): ArkNamespace[] {
        const result: ArkNamespace[] = [];
        for (const ns of this.getNamespaces()) {
            result.push(ns);
            result.push(...ns.getAllNamespacesUnderThisNamespace());
        }
        return result;
    }

    public getAnonymousClassNumber(): number {
        return this.anonymousClassNumber++;
    }

    public getAnonymousNamespaceNumber(): number {
        return this.anonymousNamespaceNumber++;
    }

    public getAST(): ts.SourceFile | null {
        return this.ast;
    }

    public setAST(value: ts.SourceFile | null): void {
        this.ast = value;
    }

    public clearAllReferences(): void {
        for (const cls of this.getClasses()) {
            cls.clearAllReferences();
        }
        for (const ns of this.getNamespaces()) {
            ns.clearAllReferences();
        }
        for (const exp of this.exportInfoMap.values()) {
            exp.clearAllReferences();
        }
        for (const imp of this.importInfoMap.values()) {
            imp.clearAllReferences();
        }
        this.topClassSigIDSet = undefined;
        this.topNamespaceSigIDs = undefined;
        this.topNamespaceCount = 0;
        this.importInfoMap.clear();
        this.exportInfoMap.clear();
        this.defaultClassID = -1;
        this.scene = undefined as unknown as Scene;
        this.moduleScene = undefined;
        this.arkModule = undefined;
        this.setAST(null);
        this.clearSourceCode();
    }
}
