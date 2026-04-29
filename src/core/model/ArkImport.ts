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
import { FullPosition, LineColPosition } from '../base/Position';
import { ExportInfo, FromInfo } from './ArkExport';
import { findExportInfo } from '../common/ModelUtils';
import { findExportInfo as findCxxExportInfo } from '../../frontend/cppFrontend/common/ModelUtils';
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

    /** The full position of the entire import statement in the source file. */
    private originFullPosition!: FullPosition;
    /** The full position of the specific import item within the import statement.
     *  Undefined when this import info has no item (e.g., namespace import). */
    private itemOriginFullPosition?: FullPosition;
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
        originFullPosition: FullPosition,
        modifiers: number,
        nameBeforeAs?: string,
        itemOriginFullPosition?: FullPosition
    ): void {
        this.setImportClauseName(importClauseName);
        this.setImportType(importType);
        this.setImportFrom(importFrom);
        this.setOriginFullPosition(originFullPosition);
        this.addModifier(modifiers);
        this.setNameBeforeAs(nameBeforeAs);
        if (itemOriginFullPosition) {
            this.setItemOriginFullPosition(itemOriginFullPosition);
        }
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
        if (this.lazyExportInfo === undefined) {
            // CXXTodo: Distinguish between C++ and TS/ArkTS.
            if (this.declaringArkFile.getLanguage() === Language.CXX) {
                this.lazyExportInfo = findCxxExportInfo(this);
            } else {
                this.lazyExportInfo = findExportInfo(this);
            }
        }
        return this.lazyExportInfo || null;
    }

    public getExportInfo(): ExportInfo | null | undefined {
        return this.lazyExportInfo;
    }

    public setExportInfo(exportInfo: ExportInfo | null): void {
        this.lazyExportInfo = exportInfo;
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

    /**
     * @deprecated Use setItemOriginFullPosition() instead.
     * @param originTsPosition - The LineColPosition to set.
     */
    public setOriginTsPosition(originTsPosition: LineColPosition): void {
        this.itemOriginFullPosition = new FullPosition(
            originTsPosition.getLineNo(),
            originTsPosition.getColNo(),
            originTsPosition.getLineNo(),
            originTsPosition.getColNo()
        );
    }

    /**
     * @deprecated Use getItemOriginFullPosition() instead.
     * @returns The LineColPosition of the import item.
     */
    public getOriginTsPosition(): LineColPosition {
        if (this.itemOriginFullPosition === undefined) {
            return LineColPosition.DEFAULT;
        }
        return new LineColPosition(this.itemOriginFullPosition.getFirstLine(), this.itemOriginFullPosition.getFirstCol());
    }

    /**
     * Sets the full position of the entire import statement in the source file.
     * @param originFullPosition - The full position in the source code to set.
     */
    public setOriginFullPosition(originFullPosition: FullPosition): void {
        this.originFullPosition = originFullPosition;
    }

    /**
     * Returns the full position of the entire import statement in the source file.
     * @returns The full position in the source code of this import statement.
     */
    public getOriginFullPosition(): FullPosition {
        return this.originFullPosition;
    }

    /**
     * Sets the full position of the specific import item within the import statement.
     * @param itemOriginFullPosition - The full position in the source code to set.
     */
    public setItemOriginFullPosition(itemOriginFullPosition: FullPosition): void {
        this.itemOriginFullPosition = itemOriginFullPosition;
    }

    /**
     * Returns the full position of the specific import item within the import statement.
     * @returns The full position in the source code of the import item, or undefined if this
     *          import info has no item (e.g., namespace import or default import).
     */
    public getItemOriginFullPosition(): FullPosition | undefined {
        return this.itemOriginFullPosition;
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
