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

import { ArkFile, ts } from '..';
import { ETS_COMPILER_OPTIONS } from '../core/common/EtsConst';
import * as crypto from 'crypto';

const sourceFileCache: Map<string, ts.SourceFile> = new Map();

export class AstTreeUtils {
    /**
     * get source file from code segment
     * @param fileName source file name
     * @param code source code
     * @returns ts.SourceFile
     */
    public static getASTNode(fileName: string, code: string): ts.SourceFile {
        const key = this.getKeyFromCode(code);
        let sourceFile = sourceFileCache.get(key);
        if (sourceFile) {
            return sourceFile;
        }
        sourceFile = this.createSourceFile(fileName, code);
        sourceFileCache.set(key, sourceFile);
        return sourceFile;
    }

    /**
     * get source file from ArkFile
     * @param arkFile ArkFile
     * @returns ts.SourceFile
     */
    public static getSourceFileFromArkFile(arkFile: ArkFile): ts.SourceFile {
        let sourceFile: ts.SourceFile | null | undefined = arkFile.getAST();
        if (sourceFile) {
            return sourceFile;
        }
        const signature = arkFile.getFileSignature().toString();
        const key = this.getKeyFromCode(signature);
        sourceFile = sourceFileCache.get(key);
        if (sourceFile) {
            return sourceFile;
        }
        sourceFile = this.createSourceFile(arkFile.getName(), arkFile.getCode());
        sourceFileCache.set(key, sourceFile);
        return sourceFile;
    }

    public static createSourceFile(fileName: string, code: string): ts.SourceFile {
        return ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, undefined, ETS_COMPILER_OPTIONS);
    }

    /**
     * convert source code to hash string
     * @param code source code
     * @returns string
     */
    private static getKeyFromCode(code: string): string {
        return crypto.createHash('sha256').update(code).digest('hex');
    }
}
