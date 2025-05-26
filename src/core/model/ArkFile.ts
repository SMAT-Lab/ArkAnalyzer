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

import { ModuleScene, Scene } from '../../Scene';
import { ArkExport, ExportInfo } from './ArkExport';
import { ImportInfo } from './ArkImport';
import { ArkClass } from './ArkClass';
import { ArkNamespace } from './ArkNamespace';
import { AliasClassSignature, ClassSignature, FileSignature, NamespaceSignature } from './ArkSignature';
import { ALL } from '../common/TSConst';
import { NAME_DELIMITER } from '../common/Const';

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
    UNKNOWN = -1,
}

/**
 * @category core/model
 */
export class ArkFile {
    private language: Language;
    private absoluteFilePath: string = '';
    private projectDir: string = '';
    private code: string = '';

    private defaultClass!: ArkClass;

    // name to model
    private namespaces: Map<string, ArkNamespace> = new Map<string, ArkNamespace>(); // don't contain nested namespaces
    private classes: Map<string, ArkClass> = new Map<string, ArkClass>(); // don't contain class in namespace

    private importInfoMap: Map<string, ImportInfo> = new Map<string, ImportInfo>();
    private exportInfoMap: Map<string, ExportInfo> = new Map<string, ExportInfo>();

    private scene!: Scene;
    private moduleScene?: ModuleScene;

    private fileSignature: FileSignature = FileSignature.DEFAULT;

    private ohPackageJson5Path: string[] = [];

    private anonymousClassNumber: number = 0;

    constructor(language: Language) {
        this.language = language;
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
        return this.fileSignature.getFileName();
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
        this.code = code;
    }

    /**
     * Returns the codes of file as a **string.**
     * @returns the codes of file.
     */
    public getCode(): string {
        return this.code;
    }

    public addArkClass(arkClass: ArkClass, originName?: string): void {
        const name = originName ?? arkClass.getName();
        this.classes.set(name, arkClass);
        if (!originName && !arkClass.isAnonymousClass()) {
            const index = name.indexOf(NAME_DELIMITER);
            if (index > 0) {
                const originName = name.substring(0, index);
                this.addArkClass(arkClass, originName);
            }
        }
    }

    public getDefaultClass(): ArkClass {
        return this.defaultClass;
    }

    public setDefaultClass(defaultClass: ArkClass): void {
        this.defaultClass = defaultClass;
    }

    public getNamespace(namespaceSignature: NamespaceSignature): ArkNamespace | null {
        const namespaceName = namespaceSignature.getNamespaceName();
        return this.getNamespaceWithName(namespaceName);
    }

    public getNamespaceWithName(namespaceName: string): ArkNamespace | null {
        return this.namespaces.get(namespaceName) || null;
    }

    public getNamespaces(): ArkNamespace[] {
        return Array.from(this.namespaces.values());
    }

    /**
     * Returns the class based on its class signature. If the class could not be found, **null** will be returned.
     * @param classSignature - the class signature.
     * @returns A class. If there is no class, the return will be a **null**.
     */
    public getClass(classSignature: ClassSignature): ArkClass | null {
        const className = classSignature instanceof AliasClassSignature ? classSignature.getOriginName() : classSignature.getClassName();
        return this.getClassWithName(className);
    }

    public getClassWithName(Class: string): ArkClass | null {
        return this.classes.get(Class) || null;
    }

    public getClasses(): ArkClass[] {
        return Array.from(new Set(this.classes.values()));
    }

    public addNamespace(namespace: ArkNamespace): void {
        this.namespaces.set(namespace.getName(), namespace);
    }

    /**
     * Returns an **array** of import information.
     * The import information includes: clause's name, type, modifiers, location where it is imported from, etc.
     * @returns An **array** of import information.
     */
    public getImportInfos(): ImportInfo[] {
        return Array.from(this.importInfoMap.values());
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
        let rtn = this.namespaces.delete(namespace.getName());
        rtn &&= this.getScene().removeNamespace(namespace);
        return rtn;
    }

    public removeArkClass(arkClass: ArkClass): boolean {
        let rtn = this.classes.delete(arkClass.getName());
        rtn &&= this.getScene().removeClass(arkClass);
        return rtn;
    }

    public getExportInfos(): ExportInfo[] {
        const exportInfos: ExportInfo[] = [];
        this.exportInfoMap.forEach((value, key) => {
            if (key !== ALL || value.getFrom()) {
                exportInfos.push(value);
            }
        });
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
        return this.fileSignature.getProjectName();
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

    /**
     * Returns the file signature of this file. A file signature consists of project's name and file's name.
     * @returns The file signature of this file.
     */
    public getFileSignature(): FileSignature {
        return this.fileSignature;
    }

    public setFileSignature(fileSignature: FileSignature): void {
        this.fileSignature = fileSignature;
    }

    public getAllNamespacesUnderThisFile(): ArkNamespace[] {
        let namespaces: ArkNamespace[] = [];
        namespaces.push(...this.namespaces.values());
        this.namespaces.forEach(ns => {
            namespaces.push(...ns.getAllNamespacesUnderThisNamespace());
        });
        return namespaces;
    }

    public getAnonymousClassNumber(): number {
        return this.anonymousClassNumber++;
    }
}
