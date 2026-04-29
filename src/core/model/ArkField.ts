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
import { ArkBaseModel, ModifierType } from './ArkBaseModel';
import { ArkError } from '../common/ArkError';
import { Language } from './ArkFile';

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
 * @category core/model
 */
export class ArkField extends ArkBaseModel {
    private code: string = '';
    private category!: FieldCategory;

    private declaringClass!: ArkClass;
    private questionToken: boolean = false;
    private exclamationToken: boolean = false;

    private fieldSignature!: FieldSignature;
    /** The full position (start/end line/col) of this field in the source file. */
    private originFullPosition!: FullPosition;

    private initializer: Stmt[] = [];

    constructor() {
        super();
    }

    /**
     * Returns the program language of the file where this field's class defined.
     */
    public getLanguage(): Language {
        return this.getDeclaringArkClass().getLanguage();
    }

    public getDeclaringArkClass(): ArkClass {
        return this.declaringClass;
    }

    public setDeclaringArkClass(declaringClass: ArkClass): void {
        this.declaringClass = declaringClass;
    }

    /**
     * Returns the codes of field as a **string.**
     * @returns the codes of field.
     */
    public getCode(): string {
        return this.code;
    }

    public setCode(code: string): void {
        this.code = code;
    }

    public getCategory(): FieldCategory {
        return this.category;
    }

    public setCategory(category: FieldCategory): void {
        this.category = category;
    }

    public getName(): string {
        return this.fieldSignature.getFieldName();
    }

    public getType(): Type {
        return this.fieldSignature.getType();
    }

    public getSignature(): FieldSignature {
        return this.fieldSignature;
    }

    public setSignature(fieldSig: FieldSignature): void {
        this.fieldSignature = fieldSig;
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
        this.questionToken = questionToken;
    }

    public setExclamationToken(exclamationToken: boolean): void {
        this.exclamationToken = exclamationToken;
    }

    public getQuestionToken(): boolean {
        return this.questionToken;
    }

    public getExclamationToken(): boolean {
        return this.exclamationToken;
    }

    /**
     * @deprecated Use setOriginFullPosition() instead.
     * @param position - The LineColPosition to set.
     */
    public setOriginPosition(position: LineColPosition): void {
        this.originFullPosition = new FullPosition(
            position.getLineNo(),
            position.getColNo(),
            position.getLineNo(),
            position.getColNo()
        );
    }

    /**
     * @deprecated Use getOriginFullPosition() instead.
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
        return this.validateFields(['category', 'declaringClass', 'fieldSignature']);
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
}
