/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

import { Decorator } from '../../core/base/Decorator';
import { modifiers2stringArray } from '../../core/model/ArkBaseModel';
import { ClassCategory } from '../../core/model/ArkClass';
import { CommentsMetadata } from '../../core/model/ArkMetadata';
import { Printer } from '../Printer';
import { PrinterUtils } from './PrinterUtils';
import { GETTER_PREFIX, SETTER_PREFIX } from '../../core/common/Const';

export interface Dump {
    getLine(): number;
    dump(): string;
}

export interface PrinterOptions {
    pureTs: boolean; // struct 转成class
    noMethodBody: boolean; // 仅输出函数原型，不输出函数体
}

let printerOptions: PrinterOptions = { pureTs: false, noMethodBody: false };
export function setPrinterOptions(options: PrinterOptions): void {
    printerOptions = { ...printerOptions, ...options };
}

export abstract class BasePrinter extends Printer implements Dump {
    public constructor(indent: string) {
        super(indent);
    }
    abstract getLine(): number;

    protected printDecorator(docorator: Decorator[]): void {
        docorator.forEach(value => {
            this.printer.writeIndent().writeLine(value.toString());
        });
    }

    protected printComments(commentsMetadata: CommentsMetadata): void {
        const comments = commentsMetadata.getComments();
        comments.forEach(comment => {
            this.printer.writeIndent().writeLine(comment.content);
        });
    }

    protected modifiersToString(modifiers: number): string {
        let modifiersStr: string[] = modifiers2stringArray(modifiers);
        return modifiersStr.join(' ');
    }

    protected resolveMethodName(name: string): string {
        if (name === '_Constructor') {
            return 'constructor';
        }
        if (name.startsWith(GETTER_PREFIX)) {
            return name.replace(GETTER_PREFIX, 'get ');
        }
        if (name.startsWith(SETTER_PREFIX)) {
            return name.replace(SETTER_PREFIX, 'set ');
        }
        return name;
    }

    protected classOriginTypeToString(clsCategory: ClassCategory): string {
        if (printerOptions.pureTs) {
            if (clsCategory === ClassCategory.STRUCT) {
                clsCategory = ClassCategory.CLASS;
            }
        }

        return PrinterUtils.classOriginTypeToString.get(clsCategory)!;
    }

    public static getPrinterOptions(): PrinterOptions {
        return printerOptions;
    }
}
