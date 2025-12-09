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

import { ExportInfo, ExportType } from '../../core/model/ArkExport';
import { ArkMetadataKind, CommentsMetadata } from '../../core/model/ArkMetadata';
import { BasePrinter } from './BasePrinter';
import { TEMP_EXPORT_ALL_PREFIX } from '../../core/common/TSConst';

export class ExportPrinter extends BasePrinter {
    info: ExportInfo;

    public constructor(info: ExportInfo, indent: string = '') {
        super(indent);
        this.info = info;
    }

    public getLine(): number {
        return this.info.getOriginTsPosition().getLineNo();
    }

    public dump(): string {
        this.printer.clear();
        const commentsMetadata = this.info.getMetadata(ArkMetadataKind.LEADING_COMMENTS);
        if (commentsMetadata instanceof CommentsMetadata) {
            this.printComments(commentsMetadata);
        }

        if (
            !this.info.getFrom() &&
            (this.info.isExport() || this.info.getExportClauseType() === ExportType.LOCAL || this.info.getExportClauseType() === ExportType.TYPE)
        ) {
            return this.printer.toString();
        }

        if (this.info.getExportClauseName().startsWith(TEMP_EXPORT_ALL_PREFIX)) {
            // just like: export * as xx from './yy'
            this.printer.writeIndent().write(`export *`);
        } else {
            // just like: export {xxx as x} from './yy'
            if (this.info.getNameBeforeAs() === '*') {
                this.printer.writeIndent().write(`export * as ${this.info.getExportClauseName()}`);
            } else if (this.info.getNameBeforeAs()) {
                this.printer.write(`export {${this.info.getNameBeforeAs()} as ${this.info.getExportClauseName()}}`);
            } else {
                this.printer.write(`export {${this.info.getExportClauseName()}}`);
            }
        }
        if (this.info.getFrom()) {
            this.printer.write(` from '${this.info.getFrom() as string}'`);
        }
        this.printer.writeLine(';');

        return this.printer.toString();
    }
}
