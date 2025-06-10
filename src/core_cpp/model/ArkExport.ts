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

import { LineColPosition } from '../base/Position';
import { ArkFile, Language } from './ArkFile';
import { ArkSignature, ClassSignature, LocalSignature, MethodSignature, NamespaceSignature } from './ArkSignature';
import { DEFAULT } from '../common/TSConst';
import { ArkBaseModel, ModifierType } from './ArkBaseModel';
import { ArkError } from '../common/ArkError';
import { ArkMetadataKind, CommentsMetadata } from './ArkMetadata';
import { ArkNamespace } from './ArkNamespace';

export type ExportSignature = NamespaceSignature | ClassSignature | MethodSignature | LocalSignature;

export enum ExportType {
    NAME_SPACE = 0,
    CLASS = 1,
    METHOD = 2,
    LOCAL = 3,
    TYPE = 4,
    UNKNOWN = 9,
}

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
    private _default?: boolean;
    private nameBeforeAs?: string;
    private exportClauseName: string = '';

    private exportClauseType: ExportType = ExportType.UNKNOWN;
    private arkExport?: ArkExport | null;
    private exportFrom?: string;

    private originTsPosition?: LineColPosition;
    private tsSourceCode?: string;
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
        this.exportClauseType = exportClauseType;
    }

    public getExportClauseType(): ExportType {
        return this.exportClauseType;
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
        if (this._default === undefined) {
            this._default = this.containsModifier(ModifierType.DEFAULT);
        }
        return this._default;
    }

    public getOriginTsPosition(): LineColPosition {
        return this.originTsPosition ?? LineColPosition.DEFAULT;
    }

    public getTsSourceCode(): string {
        return this.tsSourceCode ?? '';
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

        public originTsPosition(originTsPosition: LineColPosition): ArkExportBuilder {
            this.exportInfo.originTsPosition = originTsPosition;
            return this;
        }

        public tsSourceCode(tsSourceCode: string): ArkExportBuilder {
            this.exportInfo.tsSourceCode = tsSourceCode;
            return this;
        }

        public declaringArkFile(value: ArkFile): ArkExportBuilder {
            this.exportInfo.declaringArkFile = value;
            return this;
        }

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
}
