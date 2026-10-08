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
import { Stmt } from '../base/Stmt';
import { ArkClass, ClassCategory } from './ArkClass';
import { FieldSignature } from './ArkSignature';
import { Type } from '../base/Type';
import { ArkBaseModel, BaseModelTag, CLASS_SPECIFIC_TAG_SHIFT, ModifierType } from './ArkBaseModel';
import { ArkError } from '../common/ArkError';
import { Language } from './ArkFile';
import { SignatureCanonicalizerRegistry } from '../common/SignatureCanonicalizerRegistry';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkField');

export enum FieldCategory {
    PROPERTY_DECLARATION = 0,
    PROPERTY_ASSIGNMENT = 1,
    SHORT_HAND_PROPERTY_ASSIGNMENT = 2,
    SPREAD_ASSIGNMENT = 3,
    PROPERTY_SIGNATURE = 4,
    ENUM_MEMBER = 5,
    INDEX_SIGNATURE = 6,
    GET_ACCESSOR = 7,
    PARAMETER_PROPERTY = 8,
}

/**
 * Shift amount for field category encoding in ArkField tags field.
 * Uses CLASS_SPECIFIC_TAG_SHIFT as the base offset for class-specific properties.
 */
export const FIELD_CATEGORY_SHIFT = CLASS_SPECIFIC_TAG_SHIFT;

/**
 * Mask for extracting field category from ArkField tags field.
 * Covers 4 bits for up to 16 field category values.
 */
export const FIELD_CATEGORY_MASK = 0xf << FIELD_CATEGORY_SHIFT;

/**
 * @category core/model
 */
export class ArkField extends ArkBaseModel {
    /** @internal Formal ClassSigID for the declaring class. -1 = not yet interned. */
    private declaringClassID: number = -1;

    /** @internal Formal FieldSigID of this field. -1 = not yet set. */
    private fieldSigID: number = -1;

    /** The full position (start/end line/col) of this field in the source file. */
    private originFullPosition!: FullPosition;
    private sourceCode?: string;

    private initializer: Stmt[] = [];

    /**
     * @deprecated Construct with the declaring class ID and (optionally) the signature
     * object instead.
     */
    constructor();
    /**
     * Build directly from the declaring class ID and (optionally) the field signature.
     * `setSignature` is the registration point: it interns the signature, assigns the
     * FieldSigID, and registers this field as the model.
     * @param declaringClassID - Formal ClassSigID of the declaring class.
     * @param fieldSig - The signature object; not yet registered — registration happens
     *        inside via setSignature.
     */
    constructor(declaringClassID: number, fieldSig?: FieldSignature);
    constructor(declaringClassID?: number, fieldSig?: FieldSignature) {
        super();
        if (declaringClassID !== undefined) {
            this.declaringClassID = declaringClassID;
        }
        if (fieldSig) {
            this.setSignature(fieldSig);
        }
    }

    /**
     * Returns the program language of the file where this field's class defined.
     */
    public getLanguage(): Language {
        return this.getDeclaringArkClass().getLanguage();
    }

    public getDeclaringArkClass(): ArkClass {
        if (this.declaringClassID !== -1) {
            return SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getModel(this.declaringClassID)!;
        }
        return undefined as unknown as ArkClass;
    }

    /** @deprecated Use the ID-injecting constructor {@link constructor(declaringClassID, fieldSig)}. */
    public setDeclaringArkClass(declaringClass: ArkClass): void {
        this.declaringClassID = declaringClass.getClassSigID();
    }

    /** @internal Get the formal ClassSigID of the declaring class. Returns -1 if not interned. */
    public getDeclaringClassID(): number {
        return this.declaringClassID;
    }

    /**
     * Returns the source text of the field extracted from the declaring ArkFile
     * using the field's origin position. Implements lazy loading with caching.
     * @returns The source text of the field, or empty string if unavailable.
     */
    public getCode(): string {
        if (this.sourceCode !== undefined) {
            return this.sourceCode;
        }
        const code = this.getDeclaringArkClass().getDeclaringArkFile().getSourceTextByFullPosition(this.originFullPosition);
        if (code !== undefined) {
            this.sourceCode = code;
            return code;
        }
        return '';
    }

    /**
     * @deprecated Source text is now stored on ArkFile only. This method has no effect.
     * @param _code - The source code (ignored).
     */
    public setCode(_code: string): void {}

    /**
     * Clears the cached source text, forcing re-extraction on next getCode call.
     */
    public clearSourceCode(): void {
        this.sourceCode = undefined;
    }

    public getCategory(): FieldCategory {
        return this.getTagValue(FIELD_CATEGORY_MASK, FIELD_CATEGORY_SHIFT) as FieldCategory;
    }

    public setCategory(category: FieldCategory): void {
        this.setTagValue(FIELD_CATEGORY_MASK, FIELD_CATEGORY_SHIFT, category);
    }

    public getName(): string {
        return this.getSignature().getFieldName();
    }

    public getType(): Type {
        return this.getSignature().getType();
    }

    public getSignature(): FieldSignature {
        if (this.fieldSigID !== -1) {
            const sig = SignatureCanonicalizerRegistry.getInstance().fieldSigCanonicalizer.get(this.fieldSigID);
            if (sig !== undefined) {
                return sig;
            }
        }
        logger.error(`Field has no interned signature (fieldSigID=${this.fieldSigID}); returning DEFAULT.`);
        return FieldSignature.DEFAULT;
    }

    /**
     * Set the field signature.
     * Internally only the formal FieldSigID is stored; the signature itself is
     * resolved back via the field signature canonicalizer (canonical instance).
     * @param fieldSig - the field signature.
     */
    public setSignature(fieldSig: FieldSignature): void {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const existing = reg.fieldSigCanonicalizer.getExistingId(fieldSig);
        this.fieldSigID = existing >= 0 ? existing : reg.fieldSigCanonicalizer.getOrCreateId(fieldSig);
        // 三态处理（与 ArkClass.setSignature 对齐）：
        // 新值首建 → 注册；驱逐态恢复 → 补注册；已有别的 model → 不覆盖。
        if (existing < 0 || reg.fieldSigCanonicalizer.getModel(existing) === undefined) {
            reg.registerField(this);
        }
    }

    /** @internal Get the formal FieldSigID of this field. */
    public getFieldSigID(): number {
        return this.fieldSigID;
    }

    /**
     * Returns the unique ID of this model — the FieldSigID in the canonicalizer.
     * The signature table and the model table share one dense ID space, so this ID
     * resolves both the signature and the model.
     */
    public getId(): number {
        return this.fieldSigID;
    }

    /**
     * Returns an array of statements used for initialization.
     * @returns An array of statements used for initialization.
     */
    public getInitializer(): Stmt[] {
        return this.initializer;
    }

    public setInitializer(initializer: Stmt[]): void {
        this.initializer = initializer;
    }

    public setQuestionToken(questionToken: boolean): void {
        if (questionToken) {
            this.addTag(BaseModelTag.QUESTION_TOKEN);
        } else {
            this.removeTag(BaseModelTag.QUESTION_TOKEN);
        }
    }

    public setExclamationToken(exclamationToken: boolean): void {
        if (exclamationToken) {
            this.addTag(BaseModelTag.EXCLAMATION_TOKEN);
        } else {
            this.removeTag(BaseModelTag.EXCLAMATION_TOKEN);
        }
    }

    public getQuestionToken(): boolean {
        return this.containsTag(BaseModelTag.QUESTION_TOKEN);
    }

    public getExclamationToken(): boolean {
        return this.containsTag(BaseModelTag.EXCLAMATION_TOKEN);
    }

    /**
     * @deprecated Since version 1.0.91. Use setOriginFullPosition() instead.
     * @param position - The LineColPosition to set.
     */
    public setOriginPosition(position: LineColPosition): void {
        this.originFullPosition = new FullPosition(position.getLineNo(), position.getColNo(), position.getLineNo(), position.getColNo());
    }

    /**
     * @deprecated Since version 1.0.91. Use getOriginFullPosition() instead.
     * @returns The original position of the field at source code.
     */
    public getOriginPosition(): LineColPosition {
        return new LineColPosition(this.originFullPosition.getFirstLine(), this.originFullPosition.getFirstCol());
    }

    /**
     * Sets the full position of this field in the source file.
     * @param position - The full position in the source code to set.
     */
    public setOriginFullPosition(position: FullPosition): void {
        this.originFullPosition = position;
    }

    /**
     * Returns the full position (start/end line/col) of this field in the source file.
     * @returns The full position of this field in the source code.
     */
    public getOriginFullPosition(): FullPosition {
        return this.originFullPosition;
    }

    public validate(): ArkError {
        return this.validateFields(['declaringClassID', 'fieldSigID']);
    }

    // For class field, it is default public if there is not any access modify
    public isPublic(): boolean {
        if (
            !this.containsModifier(ModifierType.PUBLIC) &&
            !this.containsModifier(ModifierType.PRIVATE) &&
            !this.containsModifier(ModifierType.PROTECTED) &&
            (this.getDeclaringArkClass().getCategory() === ClassCategory.CLASS ||
                this.getDeclaringArkClass().getCategory() === ClassCategory.INTERFACE ||
                this.getDeclaringArkClass().getCategory() === ClassCategory.OBJECT)
        ) {
            return true;
        }
        return this.containsModifier(ModifierType.PUBLIC);
    }

    public clearAllReferences(): void {
        this.initializer = [];
        this.declaringClassID = -1;
        this.clearSourceCode();
    }
}
