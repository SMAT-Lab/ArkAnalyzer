/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { ArkField, FieldCategory } from '../../core/model/ArkField';
import { UnknownType } from '../../core/base/Type';
import { ArkMetadataKind, CommentsMetadata } from '../../core/model/ArkMetadata';
import { BasePrinter } from '../base/BasePrinter';

/**
 * @category save
 */
export class ArkIRFieldPrinter extends BasePrinter {
    private field: ArkField;

    public constructor(field: ArkField, indent: string = '') {
        super(indent);
        this.field = field;
    }

    public getLine(): number {
        return this.field.getOriginFullPosition().getFirstLine();
    }
    public dump(): string {
        this.printer.clear();
        const commentsMetadata = this.field.getMetadata(ArkMetadataKind.LEADING_COMMENTS);
        if (commentsMetadata instanceof CommentsMetadata) {
            this.printComments(commentsMetadata);
        }
        this.printDecorator(this.field.getDecorators());
        this.printer.writeIndent();
        if (this.field.getCategory() !== FieldCategory.ENUM_MEMBER) {
            this.printer.writeSpace(this.modifiersToString(this.field.getModifiers()));
        }

        this.printer.write(this.field.getName());

        if (this.field.getQuestionToken()) {
            this.printer.write('?');
        }
        if (this.field.getExclamationToken()) {
            this.printer.write('!');
        }

        // property.getInitializer() PropertyAccessExpression ArrowFunction ClassExpression FirstLiteralToken StringLiteral
        if (!(this.field.getType() instanceof UnknownType) && this.field.getCategory() !== FieldCategory.ENUM_MEMBER) {
            this.printer.write(`: ${this.field.getType().toString()}`);
        }

        if (this.field.getCategory() === FieldCategory.ENUM_MEMBER) {
            this.printer.writeLine(',');
        } else {
            this.printer.writeLine('');
        }
        return this.printer.toString();
    }
}
