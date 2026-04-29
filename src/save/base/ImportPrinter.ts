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

import { ImportInfo } from '../../core/model/ArkImport';
import { ArkMetadataKind, CommentsMetadata } from '../../core/model/ArkMetadata';
import { BasePrinter, Dump } from './BasePrinter';

export class ImportPrinter extends BasePrinter {
    infos: ImportInfo[];

    public constructor(infos: ImportInfo[], indent: string = '') {
        super(indent);
        this.infos = infos;
    }

    public getLine(): number {
        return this.infos[0].getOriginFullPosition().getFirstLine();
    }

    public dump(): string {
        const commentsMetadata = this.infos[0].getMetadata(ArkMetadataKind.LEADING_COMMENTS);
        if (commentsMetadata instanceof CommentsMetadata) {
            this.printComments(commentsMetadata);
        }
        let clauseNames: string[] = [];
        let namedImports: string[] = [];

        for (const info of this.infos) {
            if (info.getImportType() === 'Identifier') {
                // sample: import fs from 'fs'
                clauseNames.push(info.getImportClauseName());
            } else if (info.getImportType() === 'NamedImports') {
                // sample: import {xxx} from './yyy'
                if (info.getNameBeforeAs()) {
                    namedImports.push(`${info.getNameBeforeAs()} as ${info.getImportClauseName()}`);
                } else {
                    namedImports.push(info.getImportClauseName());
                }
            } else if (info.getImportType() === 'NamespaceImport') {
                // sample: import * as ts from 'ohos-typescript'
                clauseNames.push(`* as ${info.getImportClauseName()}`);
            } else if (info.getImportType() === 'EqualsImport') {
                // sample: import mmmm = require('./xxx')
                this.printer.writeIndent().writeLine(`import ${info.getImportClauseName()} =  require('${info.getFrom() as string}');`);
            } else {
                // sample: import '../xxx'
                this.printer.writeIndent().writeLine(`import '${info.getFrom() as string}';`);
            }
        }

        if (namedImports.length > 0) {
            clauseNames.push(`{${namedImports.join(', ')}}`);
        }

        this.printer.writeIndent().writeLine(`import ${clauseNames.join(', ')} from '${this.infos[0].getFrom() as string}';`);

        return this.printer.toString();
    }
}

function mergeImportInfos(infos: ImportInfo[]): Map<string, ImportInfo[]> {
    let map = new Map<string, ImportInfo[]>();

    for (let info of infos) {
        let key = `${info.getOriginFullPosition().getFirstLine()}-${info.getFrom()}`;
        let merge = map.get(key) || [];
        merge.push(info);
        map.set(key, merge);
    }

    return map;
}

export function printImports(imports: ImportInfo[], indent: string): Dump[] {
    let mergeImports = mergeImportInfos(imports);
    let items: Dump[] = [];

    for (const [_, importInfos] of mergeImports) {
        items.push(new ImportPrinter(importInfos, indent));
    }
    return items;
}
