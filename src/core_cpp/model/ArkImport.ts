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

import { ArkFile, Language } from './ArkFile';
import { LineColPosition } from '../base/Position';
import { ExportInfo, FromInfo } from './ArkExport';
import { findExportInfo } from '../common/ModelUtils';
import { ArkBaseModel } from './ArkBaseModel';
import { ArkError } from '../common/ArkError';

/**
 * @category core/model
 */
export class ImportInfo extends ArkBaseModel implements FromInfo {
    private importClauseName: string = '';
    private importType: string = '';
    private importFrom?: string;
    private nameBeforeAs?: string;
    private declaringArkFile!: ArkFile;

    private originTsPosition?: LineColPosition;
    private tsSourceCode?: string;
    private lazyExportInfo?: ExportInfo | null;

    constructor() {
        super();
    }

    /**
     * Returns the program language of the file where this import info defined.
     */
    public getLanguage(): Language {
        return this.getDeclaringArkFile().getLanguage();
    }

    public build(
        importClauseName: string,
        importType: string,
        importFrom: string,
        originTsPosition: LineColPosition,
        modifiers: number,
        nameBeforeAs?: string
    ): void {
        this.setImportClauseName(importClauseName);
        this.setImportType(importType);
        this.setImportFrom(importFrom);
        this.setOriginTsPosition(originTsPosition);
        this.addModifier(modifiers);
        this.setNameBeforeAs(nameBeforeAs);
    }

    public getOriginName(): string {
        return this.nameBeforeAs ?? this.importClauseName;
    }

    /**
     * Returns the export information, i.e., the actual reference generated at the time of call.
     * The export information includes: clause's name, clause's type, modifiers, location
     * where it is exported from, etc. If the export information could not be found, **null** will be returned.
     * @returns The export information. If there is no export information, the return will be a **null**.
     */
    public getLazyExportInfo(): ExportInfo | null {
        if (this.lazyExportInfo === undefined && this.declaringArkFile.getScene().getStage() >= 2) {
            this.lazyExportInfo = findExportInfo(this);
        }
        return this.lazyExportInfo || null;
    }

    public setDeclaringArkFile(declaringArkFile: ArkFile): void {
        this.declaringArkFile = declaringArkFile;
    }

    public getDeclaringArkFile(): ArkFile {
        return this.declaringArkFile;
    }

    public getImportClauseName(): string {
        return this.importClauseName;
    }

    public setImportClauseName(importClauseName: string): void {
        this.importClauseName = importClauseName;
    }

    public getImportType(): string {
        return this.importType;
    }

    public setImportType(importType: string): void {
        this.importType = importType;
    }

    public setImportFrom(importFrom: string): void {
        this.importFrom = importFrom;
    }

    public getNameBeforeAs(): string | undefined {
        return this.nameBeforeAs;
    }

    public setNameBeforeAs(nameBeforeAs: string | undefined): void {
        this.nameBeforeAs = nameBeforeAs;
    }

    public setOriginTsPosition(originTsPosition: LineColPosition): void {
        this.originTsPosition = originTsPosition;
    }

    public getOriginTsPosition(): LineColPosition {
        return this.originTsPosition ?? LineColPosition.DEFAULT;
    }

    public setTsSourceCode(tsSourceCode: string): void {
        this.tsSourceCode = tsSourceCode;
    }

    public getTsSourceCode(): string {
        return this.tsSourceCode ?? '';
    }

    public getFrom(): string | undefined {
        return this.importFrom;
    }

    public isDefault(): boolean {
        if (this.nameBeforeAs === 'default') {
            return true;
        }
        return this.importType === 'Identifier';
    }

    public validate(): ArkError {
        return this.validateFields(['declaringArkFile']);
    }
}
