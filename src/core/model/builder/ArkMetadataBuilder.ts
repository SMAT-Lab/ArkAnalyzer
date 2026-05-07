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

import ts from 'ohos-typescript';
import { SceneOptions } from '../../../Config';
import { Stmt } from '../../base/Stmt';
import { ArkBaseModel } from '../ArkBaseModel';
import { FullPosition } from '../../base/Position';
import { ArkMetadataKind, CommentItem, CommentsMetadata, JSDocMetadata, JSDocParamItem, JSDocReturnItem, JSDocTagItem, JSDocThrowItem } from '../ArkMetadata';


export class ArkMetadataBuilder {
    private static readonly PARAM_TAG_REGEX = /^@param\s+\{\s*([^}]+?)\s*\}\s+([^\s-]+)\s*(?:-\s*)?(.*)$/;
    private static readonly RETURNS_TAG_REGEX = /^@returns?\s*(?:\{\s*([^}]+?)\s*\})?\s*(.*)$/;
    private static readonly THROWS_TAG_REGEX = /^@throws\s*(?:\{\s*([^}]+?)\s*\})?\s*(.*)$/;
    private static readonly GENERIC_TAG_REGEX = /^@([^\s]+)\s*(.*)$/;

    public static setComments(metadata: Stmt | ArkBaseModel, node: ts.Node, sourceFile: ts.SourceFile, options: SceneOptions): void {
        const leadingCommentsMetadata = this.getCommentsMetadata(node, sourceFile, options, true);
        if (leadingCommentsMetadata.getComments().length > 0) {
            metadata.setMetadata(ArkMetadataKind.LEADING_COMMENTS, leadingCommentsMetadata);
        }

        const trailingCommentsMetadata = this.getCommentsMetadata(node, sourceFile, options, false);
        if (trailingCommentsMetadata.getComments().length > 0) {
            metadata.setMetadata(ArkMetadataKind.TRAILING_COMMENTS, trailingCommentsMetadata);
        }

        const jsDocMetadatas = this.getJSDocMetadata(node, sourceFile, options);
        if (jsDocMetadatas.length > 0) {
            metadata.setMetadata(ArkMetadataKind.JSDOC, jsDocMetadatas);
        }
    }

    public static getCommentsMetadata(node: ts.Node, sourceFile: ts.SourceFile, options: SceneOptions, isLeading: boolean): CommentsMetadata {
        const comments: CommentItem[] = [];
        if ((isLeading && !options.enableLeadingComments) || (!isLeading && !options.enableTrailingComments)) {
            return new CommentsMetadata(comments);
        }

        const commentRanges =
            (isLeading ? ts.getLeadingCommentRanges(sourceFile.text, node.pos) : ts.getTrailingCommentRanges(sourceFile.text, node.end)) || [];
        const getPosition = (pos: number, end: number): FullPosition => {
            const start = ts.getLineAndCharacterOfPosition(sourceFile, pos);
            const endPos = ts.getLineAndCharacterOfPosition(sourceFile, end);
            return new FullPosition(start.line + 1, start.character + 1, endPos.line + 1, endPos.character + 1);
        };

        for (const range of commentRanges) {
            comments.push({
                content: sourceFile.text.substring(range.pos, range.end).replace(/\r\n/g, '\n'),
                position: getPosition(range.pos, range.end),
            });
        }

        return new CommentsMetadata(comments);
    }

    public static getJSDocMetadata(node: ts.Node, sourceFile: ts.SourceFile, options: SceneOptions): JSDocMetadata[] {
        if (!options.enableJSDoc) {
            return [];
        }
        const commentRanges = ts.getLeadingCommentRanges(sourceFile.text, node.pos) || [];
        const jsDocContents = commentRanges
            .map(range => sourceFile.text.substring(range.pos, range.end).replace(/\r\n/g, '\n'))
            .filter(content => content.startsWith('/**'));
        if (jsDocContents.length === 0) {
            return [];
        }

        const jsDocMetadatas: JSDocMetadata[] = [];
        for (const jsDocContent of jsDocContents) {
            jsDocMetadatas.push(this.parseJSDocContent(jsDocContent));
        }
        return jsDocMetadatas;
    }

    private static parseJSDocContent(content: string): JSDocMetadata {
        const normalizedLines = content
            .split('\n')
            .map(line => line.replace(/^\s*\/\*\*?|\*\/\s*$|^\s*\*\s?(?!\/)/g, '').trim());

        const descriptionLines: string[] = [];
        const params: JSDocParamItem[] = [];
        const tags: JSDocTagItem[] = [];
        const returns: JSDocReturnItem[] = [];
        const throws: JSDocThrowItem[] = [];

        for (const line of normalizedLines) {
            this.parseJSDocLine(line, descriptionLines, params, returns, throws, tags);
        }

        const description = descriptionLines.join('\n').trim();
        return new JSDocMetadata(description, params, tags, returns, throws);
    }

    private static parseJSDocLine(
        line: string,
        descriptionLines: string[],
        params: JSDocParamItem[],
        returns: JSDocReturnItem[],
        throws: JSDocThrowItem[],
        tags: JSDocTagItem[]
    ): void {
        if (!line) {
            return;
        }
        if (!line.startsWith('@')) {
            descriptionLines.push(line);
            return;
        }

        if (this.tryParseParam(line, params)) {
            return;
        }
        if (this.tryParseReturns(line, returns)) {
            return;
        }
        if (this.tryParseThrows(line, throws)) {
            return;
        }
        this.tryParseGenericTag(line, tags);
    }

    private static tryParseParam(line: string, params: JSDocParamItem[]): boolean {
        const match = line.match(ArkMetadataBuilder.PARAM_TAG_REGEX);
        if (!match) {
            return false;
        }
        params.push({
            name: match[2],
            type: match[1].trim(),
            description: match[3].trim(),
        });
        return true;
    }

    private static tryParseReturns(line: string, returns: JSDocReturnItem[]): boolean {
        const match = line.match(ArkMetadataBuilder.RETURNS_TAG_REGEX);
        if (!match) {
            return false;
        }
        returns.push({
            type: match[1]?.trim(),
            description: match[2].trim(),
        });
        return true;
    }

    private static tryParseThrows(line: string, throws: JSDocThrowItem[]): boolean {
        const match = line.match(ArkMetadataBuilder.THROWS_TAG_REGEX);
        if (!match) {
            return false;
        }
        throws.push({
            type: match[1]?.trim(),
            description: match[2].trim(),
        });
        return true;
    }

    private static tryParseGenericTag(line: string, tags: JSDocTagItem[]): void {
        const match = line.match(ArkMetadataBuilder.GENERIC_TAG_REGEX);
        if (!match) {
            return;
        }
        tags.push({
            name: match[1],
            description: match[2].trim(),
        });
    }
}

