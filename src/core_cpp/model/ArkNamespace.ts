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
import { AliasClassSignature, ClassSignature, NamespaceSignature } from './ArkSignature';
import { ALL } from '../common/TSConst';
import { getColNo, getLineNo, LineCol, setCol, setLine, setLineCol } from '../base/Position';
import { ArkBaseModel } from './ArkBaseModel';
import { ArkError } from '../common/ArkError';
import { NAME_DELIMITER } from '../common/Const';

/**
 * @category core/model
 */
export class ArkNamespace extends ArkBaseModel implements ArkExport {
    private sourceCodes: string[] = [''];
    private lineCols: LineCol[] = [];

    private declaringArkFile!: ArkFile;
    private declaringArkNamespace: ArkNamespace | null = null;

    private declaringInstance!: ArkFile | ArkNamespace;

    private exportInfos: Map<string, ExportInfo> = new Map<string, ExportInfo>();

    private defaultClass!: ArkClass;

    // name to model
    private namespaces: Map<string, ArkNamespace> = new Map<string, ArkNamespace>(); // don't contain nested namespace
    private classes: Map<string, ArkClass> = new Map<string, ArkClass>();

    private namespaceSignature!: NamespaceSignature;

    private anonymousClassNumber: number = 0;

    constructor() {
        super();
    }

    /**
     * Returns the program language of the file where this namespace defined.
     */
    public getLanguage(): Language {
        return this.getDeclaringArkFile().getLanguage();
    }

    public addNamespace(namespace: ArkNamespace): void {
        this.namespaces.set(namespace.getName(), namespace);
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

    public setSignature(namespaceSignature: NamespaceSignature): void {
        this.namespaceSignature = namespaceSignature;
    }

    public getSignature(): NamespaceSignature {
        return this.namespaceSignature;
    }

    public getNamespaceSignature(): NamespaceSignature {
        return this.namespaceSignature;
    }

    public getName(): string {
        return this.namespaceSignature.getNamespaceName();
    }

    public getCode(): string {
        return this.sourceCodes[0];
    }

    public setCode(sourceCode: string): void {
        this.sourceCodes[0] = sourceCode;
    }

    /*
     * Get multiple sourceCodes when the arkNamespace is merged from multiple namespace with the same name
     */
    public getCodes(): string[] {
        return this.sourceCodes;
    }

    /*
     * Set multiple sourceCodes when the arkNamespace is merged from multiple namespace with the same name
     */
    public setCodes(sourceCodes: string[]): void {
        this.sourceCodes = [];
        this.sourceCodes.push(...sourceCodes);
    }

    public addCode(sourceCode: string): void {
        this.sourceCodes.push(sourceCode);
    }

    public getLine(): number {
        return getLineNo(this.lineCols[0]);
    }

    public setLine(line: number): void {
        this.lineCols[0] = setLine(this.lineCols[0], line);
    }

    public getColumn(): number {
        return getColNo(this.lineCols[0]);
    }

    public setColumn(column: number): void {
        this.lineCols[0] = setCol(this.lineCols[0], column);
    }

    public getLineColPairs(): [number, number][] {
        const lineColPairs: [number, number][] = [];
        this.lineCols.forEach(lineCol => {
            lineColPairs.push([getLineNo(lineCol), getColNo(lineCol)]);
        });
        return lineColPairs;
    }

    public setLineCols(lineColPairs: [number, number][]): void {
        this.lineCols = [];
        lineColPairs.forEach(lineColPair => {
            this.lineCols.push(setLineCol(lineColPair[0], lineColPair[1]));
        });
    }

    public getDeclaringInstance(): ArkNamespace | ArkFile {
        return this.declaringInstance;
    }

    public setDeclaringInstance(declaringInstance: ArkFile | ArkNamespace): void {
        this.declaringInstance = declaringInstance;
    }

    public getDeclaringArkFile(): ArkFile {
        return this.declaringArkFile;
    }

    public setDeclaringArkFile(declaringArkFile: ArkFile): void {
        this.declaringArkFile = declaringArkFile;
    }

    public getDeclaringArkNamespace(): ArkNamespace | null {
        return this.declaringArkNamespace;
    }

    public setDeclaringArkNamespace(declaringArkNamespace: ArkNamespace): void {
        this.declaringArkNamespace = declaringArkNamespace;
    }

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
        return this.defaultClass;
    }

    public setDefaultClass(defaultClass: ArkClass): void {
        this.defaultClass = defaultClass;
    }

    public getAllMethodsUnderThisNamespace(): ArkMethod[] {
        let methods: ArkMethod[] = [];
        this.classes.forEach(cls => {
            methods.push(...cls.getMethods());
        });
        this.namespaces.forEach(ns => {
            methods.push(...ns.getAllMethodsUnderThisNamespace());
        });
        return methods;
    }

    public getAllClassesUnderThisNamespace(): ArkClass[] {
        let classes: ArkClass[] = [];
        classes.push(...this.classes.values());
        this.namespaces.forEach(ns => {
            classes.push(...ns.getAllClassesUnderThisNamespace());
        });
        return classes;
    }

    public getAllNamespacesUnderThisNamespace(): ArkNamespace[] {
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

    getExportType(): ExportType {
        return ExportType.NAME_SPACE;
    }

    public removeArkClass(arkClass: ArkClass): boolean {
        let rtn = this.classes.delete(arkClass.getName());
        rtn &&= this.getDeclaringArkFile().getScene().removeClass(arkClass);
        return rtn;
    }

    public removeNamespace(namespace: ArkNamespace): boolean {
        let rtn = this.namespaces.delete(namespace.getName());
        rtn &&= this.getDeclaringArkFile().getScene().removeNamespace(namespace);
        return rtn;
    }

    public validate(): ArkError {
        return this.validateFields(['declaringArkFile', 'declaringInstance', 'namespaceSignature', 'defaultClass']);
    }
}
