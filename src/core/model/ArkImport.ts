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
import { ArkBaseModel, CLASS_SPECIFIC_TAG_SHIFT } from './ArkBaseModel';
import { ArkError } from '../common/ArkError';
import { extractSourceTextByFullPosition } from '../common/StringUtils';

/**
 * Shift amount for import type encoding in ImportInfo tags field.
 * Uses CLASS_SPECIFIC_TAG_SHIFT as the base offset for class-specific properties.
 */
export const IMPORT_TYPE_SHIFT = CLASS_SPECIFIC_TAG_SHIFT;

/**
 * Mask for extracting import type from ImportInfo tags field.
 * Covers 3 bits for up to 8 import type values.
 * Uses value encoding (like ClassCategory) instead of bitmask encoding.
 */
export const IMPORT_TYPE_MASK = 0x7 << IMPORT_TYPE_SHIFT;

/**
 * Import type enum values for encoding in ImportInfo tags field.
 * Uses value encoding (sequential numbers) instead of bitmask encoding.
 * This allows storing up to 8 values using only 3 bits.
 */
export enum ImportType {
    /** Value 0: None/Unknown import type (side-effect import like `import '../xxx'`) */
    NONE_IMPORT = 0,
    /** Value 1: Identifier import (default import) */
    IDENTIFIER_IMPORT = 1,
    /** Value 2: Named imports */
    NAMED_IMPORTS_IMPORT = 2,
    /** Value 3: Namespace import */
    NAMESPACE_IMPORT = 3,
    /** Value 4: Equals import */
    EQUALS_IMPORT = 4,
    /** Value 5: Type alias import (used in ArkIRTransformer for import type nodes) */
    TYPE_ALIAS_IMPORT = 5,
}

/**
 * @category core/model
 */
export class ImportInfo extends ArkBaseModel implements FromInfo {
    private importClauseName: string = '';
    private importFrom?: string;
    private nameBeforeAs?: string;
    private declaringArkFile!: ArkFile;

    /** The full position of the entire import statement in the source file. */
    private originFullPosition!: FullPosition;
    /** The full position of the specific import item within the import statement.
     *  Undefined when this import info has no item (e.g., namespace import). */
    private itemOriginFullPosition?: FullPosition;
    private sourceCode?: string;
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

    /**
     * Builds the import info with the given parameters.
     * @param importClauseName - The import clause name
     * @param importTypeTag - The import type tag (ImportType.IDENTIFIER_IMPORT, ImportType.NAMED_IMPORTS_IMPORT, etc.)
     * @param importFrom - The import source path
     * @param originTsPosition - The original TypeScript position
     * @param modifiers - The modifiers value
     * @param nameBeforeAs - The name before 'as' keyword (optional)
     */
    public build(
        importClauseName: string,
        importTypeTag: number,
        importFrom: string,
        originFullPosition: FullPosition,
        modifiers: number,
        nameBeforeAs?: string,
        itemOriginFullPosition?: FullPosition
    ): void {
        this.setImportClauseName(importClauseName);
        this.setImportTypeTag(importTypeTag);
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

    /**
     * Gets the import type as an ImportType value.
     * Returns the encoded import type value (ImportType.NONE_IMPORT, ImportType.IDENTIFIER_IMPORT, etc.)
     * If no import type is set, returns ImportType.NONE_IMPORT (0).
     * @returns The import type as an ImportType value
     */
    public getImportTypeTag(): ImportType {
        return this.getTagValue(IMPORT_TYPE_MASK, IMPORT_TYPE_SHIFT) as ImportType;
    }

    /**
     * Sets the import type using an ImportType value.
     * Uses value encoding (setTagValue) instead of bitmask encoding.
     * @param importTypeTag - The import type value (ImportType.IDENTIFIER_IMPORT, ImportType.NAMED_IMPORTS_IMPORT, etc.)
     */
    public setImportTypeTag(importTypeTag: ImportType): void {
        this.setTagValue(IMPORT_TYPE_MASK, IMPORT_TYPE_SHIFT, importTypeTag);
    }

    /**
     * Gets the import type as a string value.
     * @deprecated Use {@link getImportTypeTag} instead for better type safety and performance.
     * @returns The import type string: '', 'Identifier', 'NamedImports', 'NamespaceImport', 'EqualsImport', or 'TypeAlias'
     */
    public getImportType(): string {
        const typeValue = this.getImportTypeTag();
        switch (typeValue) {
            case ImportType.IDENTIFIER_IMPORT:
                return 'Identifier';
            case ImportType.NAMED_IMPORTS_IMPORT:
                return 'NamedImports';
            case ImportType.NAMESPACE_IMPORT:
                return 'NamespaceImport';
            case ImportType.EQUALS_IMPORT:
                return 'EqualsImport';
            case ImportType.TYPE_ALIAS_IMPORT:
                return 'TypeAlias';
            default:
                return '';
        }
    }

    /**
     * Sets the import type using a string value.
     * @deprecated Use {@link setImportTypeTag} instead for better type safety and performance.
     * @param importType - The import type string: '', 'Identifier', 'NamedImports', 'NamespaceImport', 'EqualsImport', or 'TypeAlias'
     */
    public setImportType(importType: string): void {
        let typeValue: number;
        switch (importType) {
            case 'Identifier':
                typeValue = ImportType.IDENTIFIER_IMPORT;
                break;
            case 'NamedImports':
                typeValue = ImportType.NAMED_IMPORTS_IMPORT;
                break;
            case 'NamespaceImport':
                typeValue = ImportType.NAMESPACE_IMPORT;
                break;
            case 'EqualsImport':
                typeValue = ImportType.EQUALS_IMPORT;
                break;
            case 'TypeAlias':
                typeValue = ImportType.TYPE_ALIAS_IMPORT;
                break;
            default:
                typeValue = ImportType.NONE_IMPORT;
        }
        this.setImportTypeTag(typeValue);
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

    /**
     * @deprecated Source text is now stored on ArkFile only. This method has no effect.
     * @param _tsSourceCode - The source code (ignored).
     */
    public setTsSourceCode(_tsSourceCode: string): void {
    }

    /**
     * Returns the source text of the import extracted from the declaring ArkFile
     * using the import's origin position. Implements lazy loading with caching.
     * @returns The source text of the import, or empty string if unavailable.
     */
    public getTsSourceCode(): string {
        if (this.sourceCode !== undefined) {
            return this.sourceCode;
        }
        const code = extractSourceTextByFullPosition(this.getDeclaringArkFile().getCode(), this.originFullPosition);
        if (code !== undefined) {
            this.sourceCode = code;
            return code;
        }
        return '';
    }

    /**
     * Clears the cached source text, forcing re-extraction on next getTsSourceCode call.
     */
    public clearSourceCode(): void {
        this.sourceCode = undefined;
    }

    public getFrom(): string | undefined {
        return this.importFrom;
    }

    public isDefault(): boolean {
        if (this.nameBeforeAs === 'default') {
            return true;
        }
        return this.getImportTypeTag() === ImportType.IDENTIFIER_IMPORT;
    }

    public validate(): ArkError {
        return this.validateFields(['declaringArkFile']);
    }

    public clearAllReferences(): void {
        this.lazyExportInfo = null;
        this.declaringArkFile = undefined as unknown as ArkFile;
        this.clearSourceCode();
    }
}
