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

import { FullPosition, LineColPosition } from '../base/Position';
import { ArkFile, Language } from './ArkFile';
import { ArkSignature, ClassSignature, LocalSignature, MethodSignature, NamespaceSignature } from './ArkSignature';
import { DEFAULT } from '../common/TSConst';
import { ArkBaseModel, CLASS_SPECIFIC_TAG_SHIFT, ModifierType } from './ArkBaseModel';
import { ArkError } from '../common/ArkError';
import { ArkMetadataKind, CommentsMetadata } from './ArkMetadata';
import { ArkNamespace } from './ArkNamespace';
import { extractSourceTextByFullPosition } from '../common/StringUtils';

export type ExportSignature = NamespaceSignature | ClassSignature | MethodSignature | LocalSignature;

export enum ExportType {
    NAME_SPACE = 0,
    CLASS = 1,
    METHOD = 2,
    LOCAL = 3,
    TYPE = 4,
    UNKNOWN = 9,
}

/**
 * Shift amount for export type encoding in ExportInfo tags field.
 * Uses CLASS_SPECIFIC_TAG_SHIFT as the base offset for class-specific properties.
 */
export const EXPORT_TYPE_SHIFT = CLASS_SPECIFIC_TAG_SHIFT;

/**
 * Mask for extracting export type from ExportInfo tags field.
 * Covers 4 bits for up to 16 export type values.
 */
export const EXPORT_TYPE_MASK = 0xF << EXPORT_TYPE_SHIFT;

export interface ArkExport extends ArkSignature {
    getModifiers(): number;
    containsModifier(modifierType: ModifierType): boolean;

    getName(): string;

    getExportType(): ExportType;
}

export interface FromInfo {
    isDefault(): boolean;

    getOriginName(): string;

    getFrom(): string | undefined;

    getDeclaringArkFile(): ArkFile;
}

/**
 * @category core/model
 */
export class ExportInfo extends ArkBaseModel implements FromInfo {
    private nameBeforeAs?: string;
    private exportClauseName: string = '';

    private arkExport?: ArkExport | null;
    private exportFrom?: string;

    /** The full position (start/end line/col) of this export in the source file. */
    private originFullPosition!: FullPosition;
    private sourceCode?: string;
    private declaringArkFile!: ArkFile;
    private declaringArkNamespace?: ArkNamespace;
    private constructor() {
        super();
    }

    /**
     * Returns the program language of the file where this export info defined.
     */
    public getLanguage(): Language {
        return this.getDeclaringArkFile().getLanguage();
    }

    public getFrom(): string | undefined {
        return this.exportFrom;
    }

    public getOriginName(): string {
        return this.nameBeforeAs ?? this.exportClauseName;
    }

    public getExportClauseName(): string {
        return this.exportClauseName;
    }

    public setExportClauseType(exportClauseType: ExportType): void {
        this.setTagValue(EXPORT_TYPE_MASK, EXPORT_TYPE_SHIFT, exportClauseType);
    }

    public getExportClauseType(): ExportType {
        return this.getTagValue(EXPORT_TYPE_MASK, EXPORT_TYPE_SHIFT);
    }

    public getNameBeforeAs(): string | undefined {
        return this.nameBeforeAs;
    }

    public setArkExport(value: ArkExport | null): void {
        this.arkExport = value;
    }

    public getArkExport(): ArkExport | undefined | null {
        return this.arkExport;
    }

    public isDefault(): boolean {
        if (this.exportFrom) {
            return this.nameBeforeAs === DEFAULT;
        }
        return this.containsModifier(ModifierType.DEFAULT);
    }

    /**
     * @deprecated Use getOriginFullPosition() instead.
     * @returns The LineColPosition of this export.
     */
    public getOriginTsPosition(): LineColPosition {
        return new LineColPosition(this.originFullPosition.getFirstLine(), this.originFullPosition.getFirstCol());
    }

    /**
     * Returns the full position (start/end line/col) of this export in the source file.
     * @returns The full position in the source code of this export.
     */
    public getOriginFullPosition(): FullPosition {
        return this.originFullPosition;
    }

    /**
     * Returns the source text of the export extracted from the declaring ArkFile
     * using the export's origin position. Implements lazy loading with caching.
     * @returns The source text of the export, or empty string if unavailable.
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

    public getDeclaringArkFile(): ArkFile {
        return this.declaringArkFile;
    }

    public getDeclaringArkNamespace(): ArkNamespace | undefined {
        return this.declaringArkNamespace;
    }

    public static Builder = class ArkExportBuilder {
        exportInfo: ExportInfo = new ExportInfo();

        public exportClauseName(exportClauseName: string): ArkExportBuilder {
            this.exportInfo.exportClauseName = exportClauseName;
            return this;
        }

        public exportClauseType(exportClauseType: ExportType): ArkExportBuilder {
            this.exportInfo.setExportClauseType(exportClauseType);
            return this;
        }

        public nameBeforeAs(nameBeforeAs: string): ArkExportBuilder {
            this.exportInfo.nameBeforeAs = nameBeforeAs;
            return this;
        }

        public modifiers(modifiers: number): ArkExportBuilder {
            this.exportInfo.modifiers = modifiers;
            return this;
        }

        /**
         * @deprecated Use originFullPosition() instead.
         * @param originTsPosition - The LineColPosition to set.
         */
        public originTsPosition(originTsPosition: LineColPosition): ArkExportBuilder {
            this.exportInfo.originFullPosition = new FullPosition(
                originTsPosition.getLineNo(),
                originTsPosition.getColNo(),
                originTsPosition.getLineNo(),
                originTsPosition.getColNo()
            );
            return this;
        }

        /**
         * Sets the full position of this export in the source file.
         * @param originFullPosition - The full position in the source code to set.
         */
        public originFullPosition(originFullPosition: FullPosition): ArkExportBuilder {
            this.exportInfo.originFullPosition = originFullPosition;
            return this;
        }

        /**
         * @deprecated Source text is now stored on ArkFile only. This method has no effect.
         * @param _tsSourceCode - The source code (ignored).
         */
        public tsSourceCode(_tsSourceCode: string): ArkExportBuilder {
            return this;
        }

        /**
         * Sets the declaring ArkFile of this export.
         * @param value - The ArkFile to set.
         */
        public declaringArkFile(value: ArkFile): ArkExportBuilder {
            this.exportInfo.declaringArkFile = value;
            return this;
        }

        /**
         * Sets the declaring ArkNamespace of this export.
         * @param value - The ArkNamespace to set.
         */
        public declaringArkNamespace(value: ArkNamespace): ArkExportBuilder {
            this.exportInfo.declaringArkNamespace = value;
            return this;
        }

        public arkExport(value: ArkExport): ArkExportBuilder {
            this.exportInfo.arkExport = value;
            return this;
        }

        public exportFrom(exportFrom: string): ArkExportBuilder {
            if (exportFrom !== '') {
                this.exportInfo.exportFrom = exportFrom;
            }
            return this;
        }

        public setLeadingComments(commentsMetadata: CommentsMetadata): ArkExportBuilder {
            if (commentsMetadata.getComments().length > 0) {
                this.exportInfo.setMetadata(ArkMetadataKind.LEADING_COMMENTS, commentsMetadata);
            }
            return this;
        }

        public setTrailingComments(commentsMetadata: CommentsMetadata): ArkExportBuilder {
            if (commentsMetadata.getComments().length > 0) {
                this.exportInfo.setMetadata(ArkMetadataKind.TRAILING_COMMENTS, commentsMetadata);
            }
            return this;
        }

        public build(): ExportInfo {
            return this.exportInfo;
        }
    };

    public validate(): ArkError {
        return this.validateFields(['declaringArkFile']);
    }

    public clearAllReferences(): void {
        this.arkExport = null;
        this.declaringArkFile = undefined as unknown as ArkFile;
        this.declaringArkNamespace = undefined;
        this.clearSourceCode();
    }
}
