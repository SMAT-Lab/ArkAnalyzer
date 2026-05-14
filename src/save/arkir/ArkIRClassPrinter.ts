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

import { ArkClass } from '../../core/model/ArkClass';
import { ArkMetadataKind, CommentsMetadata } from '../../core/model/ArkMetadata';
import { BasePrinter, Dump } from '../base/BasePrinter';
import { ArkIRFieldPrinter } from './ArkIRFieldPrinter';
import { ArkIRMethodPrinter } from './ArkIRMethodPrinter';

/**
 * @category save
 */
export class ArkIRClassPrinter extends BasePrinter {
    protected cls: ArkClass;

    public constructor(cls: ArkClass, indent: string = '') {
        super(indent);
        this.cls = cls;
    }

    public getLine(): number {
        return this.cls.getOriginFullPosition()?.getFirstLine() ?? 0;
    }

    public dump(): string {
        this.printer.clear();

        const commentsMetadata = this.cls.getMetadata(ArkMetadataKind.LEADING_COMMENTS);
        if (commentsMetadata instanceof CommentsMetadata) {
            this.printComments(commentsMetadata);
        }

        this.printDecorator(this.cls.getDecorators());
        // print export class name<> + extends c0 implements x1, x2 {
        this.printer
            .writeIndent()
            .writeSpace(this.modifiersToString(this.cls.getModifiers()))
            .write(`${this.classOriginTypeToString(this.cls.getCategory())} `);

        this.printer.write(this.cls.getName());

        const genericsTypes = this.cls.getGenericsTypes();
        if (genericsTypes) {
            this.printer.write(`<${genericsTypes.map(v => v.toString()).join(', ')}>`);
        }
        if (this.cls.getSuperClassName() && !this.cls.hasComponentDecorator()) {
            this.printer.write(` extends ${this.cls.getSuperClassName()}`);
        }
        if (this.cls.getImplementedInterfaceNames().length > 0) {
            this.printer.write(` implements ${this.cls.getImplementedInterfaceNames().join(', ')}`);
        }

        this.printer.writeLine(' {');
        this.printer.incIndent();
        let items: Dump[] = [];

        let fieldItems = this.printFields();
        fieldItems.sort((a, b) => a.getLine() - b.getLine());
        items.push(...fieldItems);

        let methodItems = this.printMethods();
        methodItems.sort((a, b) => a.getLine() - b.getLine());
        items.push(...methodItems);
        let isFirstMethod = true;
        let hasField = false;
        items.forEach((v): void => {
            if (v instanceof ArkIRMethodPrinter) {
                if (!isFirstMethod || hasField) {
                    this.printer.writeLine('');
                } else {
                    isFirstMethod = false;
                }
            } else if (v instanceof ArkIRFieldPrinter) {
                hasField = true;
            }
            this.printer.write(v.dump());
        });

        this.printer.decIndent();
        this.printer.writeIndent().writeLine('}');

        return this.printer.toString();
    }

    protected printMethods(): Dump[] {
        let items: Dump[] = [];
        for (let method of this.cls.getMethods(true)) {
            items.push(new ArkIRMethodPrinter(method, this.printer.getIndent()));
        }
        return items;
    }

    private printFields(): Dump[] {
        let items: Dump[] = [];
        for (let field of this.cls.getFields()) {
            items.push(new ArkIRFieldPrinter(field, this.printer.getIndent()));
        }
        return items;
    }
}
