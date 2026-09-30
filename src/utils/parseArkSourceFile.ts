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
    const sourceFile = ts.createSourceFile(fileName, parseText, ts.ScriptTarget.Latest, false, undefined, options);
    if (parseText !== sourceText) {
        (sourceFile as { text: string }).text = sourceText;
        (sourceFile as { lineMap?: readonly number[] }).lineMap = undefined;
    }
    if (setParentNodes) {
        fixupParentReferences(sourceFile);
    }
    return sourceFile;
}

const fixupStack: ts.Node[] = [];
const fixupChildren: ts.Node[] = [];
let fixupStackTop = 0;
let fixupChildCount = 0;
const collectFixupChild = (child: ts.Node): void => {
    fixupChildren[fixupChildCount++] = child;
};

/**
 * Zero-allocation replacement for the parser's built-in parent fixup. The bundled walk
 * (`setParentRecursive` -> `forEachChildRecursively` -> `gatherPossibleChildren`) allocates a
 * children array plus a collector closure per node and grows two parallel work stacks with
 * `unshift`/`push` - gigabytes of churn on a full build where every project file is parsed
 * twice (signature round plus body remount). This explicit-stack walk reuses two module-level
 * scratch arrays and one shared collector closure, and reproduces the same parent links,
 * including the JSDoc nodes the bundled walk binds via `bindJSDoc`.
 *
 * The scratches are reset by cursor, never by `length = 0`: truncating a V8 array to zero
 * drops its backing store, so every refill would reallocate from scratch (measured 12x the
 * scavenge count of the cursor pattern). Spent slots are nulled to the high-water mark so
 * the parsed tree stays collectable; null keeps the arrays in PACKED_ELEMENTS.
 */
export function fixupParentReferences(rootNode: ts.Node): void {
    fixupStack[fixupStackTop++] = rootNode;
    let stackHighWater = fixupStackTop;
    let childHighWater = 0;
    while (fixupStackTop > 0) {
        const node = fixupStack[--fixupStackTop];
        fixupChildCount = 0;
        ts.forEachChild(node, collectFixupChild);
        const jsDoc = (node as ts.Node & { jsDoc?: readonly ts.JSDoc[] }).jsDoc;
        if (jsDoc !== undefined) {
            for (const doc of jsDoc) {
                fixupChildren[fixupChildCount++] = doc;
            }
        }
        if (fixupChildCount > childHighWater) {
            childHighWater = fixupChildCount;
        }
        for (let i = 0; i < fixupChildCount; i++) {
            const child = fixupChildren[i];
            (child as { parent: ts.Node }).parent = node;
            fixupStack[fixupStackTop++] = child;
        }
        if (fixupStackTop > stackHighWater) {
            stackHighWater = fixupStackTop;
        }
    }
    const nullNode = null as unknown as ts.Node;
    for (let i = 0; i < stackHighWater; i++) {
        fixupStack[i] = nullNode;
    }
    for (let i = 0; i < childHighWater; i++) {
        fixupChildren[i] = nullNode;
    }
    fixupStackTop = 0;
    fixupChildCount = 0;
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
