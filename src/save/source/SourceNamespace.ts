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

import { ArkMetadataKind, CommentsMetadata } from '../../core/model/ArkMetadata';
import { ArkNamespace } from '../../core/model/ArkNamespace';
import { SourceBase } from './SourceBase';
import { SourceClass } from './SourceClass';
import { SourceMethod } from './SourceMethod';
import { PrinterUtils } from '../base/PrinterUtils';
import { Dump } from '../base/BasePrinter';
import { ExportPrinter } from '../base/ExportPrinter';
import { ArkClass } from '../../core/model/ArkClass';

/**
 * @category save
 */
export class SourceNamespace extends SourceBase {
    ns: ArkNamespace;

    public constructor(ns: ArkNamespace, indent: string = '') {
        super(ns.getDeclaringArkFile(), indent);
        this.ns = ns;
    }

    public getLine(): number {
        const positions = this.ns.getOriginFullPositions();
        return positions.length > 0 ? positions[0].getFirstLine() : 0;
    }

    private printDefaultClassInNamespace(items: Dump[], cls: ArkClass): void {
        for (let method of cls.getMethods()) {
            if (method.isDefaultArkMethod()) {
                items.push(...new SourceMethod(method, this.printer.getIndent()).dumpDefaultMethod());
            } else if (!PrinterUtils.isAnonymousMethod(method.getName())) {
                items.push(new SourceMethod(method, this.printer.getIndent()));
            }
        }
    }

    public dump(): string {
        const commentsMetadata = this.ns.getMetadata(ArkMetadataKind.LEADING_COMMENTS);
        if (commentsMetadata instanceof CommentsMetadata) {
            const comments = commentsMetadata.getComments();
            comments.forEach(comment => {
                this.printer.writeIndent().writeLine(comment.content);
            });
        }
        this.printer.writeIndent().writeSpace(this.modifiersToString(this.ns.getModifiers())).writeLine(`namespace ${this.ns.getName()} {`);
        this.printer.incIndent();

        let items: Dump[] = [];
        // print class
        for (let cls of this.ns.getClasses()) {
            if (PrinterUtils.isAnonymousClass(cls.getName())) {
                continue;
            }
            if (cls.isDefaultArkClass()) {
                this.printDefaultClassInNamespace(items, cls);
            } else {
                items.push(new SourceClass(cls, this.printer.getIndent()));
            }
        }
        // print namespace
        for (let childNs of this.ns.getNamespaces()) {
            items.push(new SourceNamespace(childNs, this.printer.getIndent()));
        }
        // print exportInfos
        for (let exportInfo of this.ns.getExportInfos()) {
            items.push(new ExportPrinter(exportInfo, this.printer.getIndent()));
        }

        items.sort((a, b) => a.getLine() - b.getLine());
        items.forEach((v): void => {
            this.printer.write(v.dump());
        });
        this.printer.decIndent();
        this.printer.writeIndent().writeLine('}');
        return this.printer.toString();
    }
}
