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

import ts from 'ohos-typescript';

const DECLARATION_FILE_NAME = /\.d\.(ts|ets)$/;

/**
 * Parse a source file, keeping the parser from building JSDoc nodes for declaration files.
 *
 * Documentation is read out of the raw text - `getLeadingCommentRanges` plus `substring` in
 * ArkMetadataBuilder, and the scanner in every comment query - never out of `node.jsDoc`, so the JSDoc
 * nodes the parser materialises are pure cost. They are 88% of the parse time of an SDK `.d.ts` file,
 * which is where most of the build's declaration volume sits; project sources carry almost no JSDoc,
 * so they are parsed unchanged.
 *
 * The parser decides from the comment opener alone, so the opener is blanked for the parse
 * (`/**` becomes `/* `). That is one character per comment and it leaves the comment's extent and every
 * offset in the file exactly where they were, so the only difference in the tree is the absent `jsDoc`
 * array. The original text is put back on the SourceFile before anything reads it, which keeps
 * text-derived comments, JSDoc metadata and line maps identical.
 */
export function parseArkSourceFile(fileName: string, sourceText: string, setParentNodes: boolean, options?: ts.CompilerOptions): ts.SourceFile {
    const parseText = DECLARATION_FILE_NAME.test(fileName) ? blankJsDocOpeners(sourceText) : sourceText;
    const sourceFile = ts.createSourceFile(fileName, parseText, ts.ScriptTarget.Latest, setParentNodes, undefined, options);
    if (parseText !== sourceText) {
        (sourceFile as { text: string }).text = sourceText;
        (sourceFile as { lineMap?: readonly number[] }).lineMap = undefined;
    }
    return sourceFile;
}

function blankJsDocOpeners(sourceText: string): string {
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, sourceText);
    const openers: number[] = [];
    for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
        if (token === ts.SyntaxKind.MultiLineCommentTrivia) {
            const pos = scanner.getTokenPos();
            if (sourceText.startsWith('/**', pos) && sourceText[pos + 3] !== '/') {
                openers.push(pos);
            }
        }
    }
    if (openers.length === 0) {
        return sourceText;
    }
    const parts: string[] = [];
    let last = 0;
    for (const pos of openers) {
        parts.push(sourceText.slice(last, pos + 2), ' ');
        last = pos + 3;
    }
    parts.push(sourceText.slice(last));
    return parts.join('');
}
