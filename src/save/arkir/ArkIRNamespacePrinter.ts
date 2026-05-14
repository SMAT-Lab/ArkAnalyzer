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

import { ArkMetadataKind, CommentsMetadata } from '../../core/model/ArkMetadata';
import { ArkNamespace } from '../../core/model/ArkNamespace';

import { BasePrinter, Dump } from '../base/BasePrinter';
import { ArkIRClassPrinter } from './ArkIRClassPrinter';
import { ExportPrinter } from '../base/ExportPrinter';

/**
 * @category save
 */
export class ArkIRNamespacePrinter extends BasePrinter {
    ns: ArkNamespace;

    public constructor(ns: ArkNamespace, indent: string = '') {
        super(indent);
        this.ns = ns;
    }

    public getLine(): number {
        const positions = this.ns.getOriginFullPositions();
        return positions.length > 0 ? positions[0].getFirstLine() : 0;
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
            items.push(new ArkIRClassPrinter(cls, this.printer.getIndent()));
        }
        // print namespace
        for (let childNs of this.ns.getNamespaces()) {
            items.push(new ArkIRNamespacePrinter(childNs, this.printer.getIndent()));
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
