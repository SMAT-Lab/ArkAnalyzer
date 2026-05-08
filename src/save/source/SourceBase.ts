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

import { ArkFile } from '../../core/model/ArkFile';
import { ArkMethod } from '../../core/model/ArkMethod';
import { ClassSignature, MethodSignature } from '../../core/model/ArkSignature';
import { ArkClass } from '../../core/model/ArkClass';
import { ArkCodeBuffer } from '../ArkStream';
import { Local } from '../../core/base/Local';
import { TransformerContext } from './SourceTransformer';
import { ArkNamespace } from '../../core/model/ArkNamespace';
import { BasePrinter } from '../base/BasePrinter';

export abstract class SourceBase extends BasePrinter implements TransformerContext {
    protected arkFile: ArkFile;
    protected inBuilder: boolean = false;

    public constructor(arkFile: ArkFile, indent: string = '') {
        super(indent);
        this.arkFile = arkFile;
    }

    public getDeclaringArkNamespace(): ArkNamespace | undefined {
        return undefined;
    }

    public getArkFile(): ArkFile {
        return this.arkFile;
    }

    public getMethod(signature: MethodSignature): ArkMethod | null {
        return this.getArkFile().getScene().getMethod(signature);
    }

    public getClass(signature: ClassSignature): ArkClass | null {
        return this.getArkFile().getScene().getClass(signature);
    }

    public getPrinter(): ArkCodeBuffer {
        return this.printer;
    }

    public transTemp2Code(temp: Local, _isLeftOp: boolean = false): string {
        return temp.getName();
    }

    public getTempCode(_tempName: string): string | undefined {
        return undefined;
    }

    public isInBuilderMethod(): boolean {
        return this.inBuilder;
    }

    protected resolveKeywordType(keywordStr: string): string {
        // 'NumberKeyword | NullKeyword |
        let types: string[] = [];
        for (let keyword of keywordStr.split('|')) {
            keyword = keyword.trim();
            if (keyword.length === 0) {
                continue;
            }
            if (keyword.endsWith('Keyword')) {
                keyword = keyword.substring(0, keyword.length - 'Keyword'.length).toLowerCase();
            }
            types.push(keyword);
        }

        return types.join(' | ');
    }
}
