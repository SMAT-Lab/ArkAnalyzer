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

import { AbstractBinopExpr, AbstractInvokeExpr, ArkCastExpr, ArkUnopExpr } from '../base/Expr';
import { AbstractFieldRef, AbstractRef, ArkArrayRef, ArkInstanceFieldRef, ArkStaticFieldRef } from '../base/Ref';
import { Value } from '../base/Value';
import { Scene } from '../../Scene';
import ts from 'ohos-typescript';
import { SceneOptions } from '../../Config';
import { ArkMetadataKind, CommentItem, CommentsMetadata } from '../model/ArkMetadata';
import { Stmt } from '../base/Stmt';
import { ArkBaseModel } from '../model/ArkBaseModel';
import { FullPosition } from '../base/Position';
import { Local } from '../base/Local';
import { NAME_PREFIX } from './Const';

export class IRUtils {
    public static moreThanOneAddress(value: Value): boolean {
        if (
            value instanceof AbstractBinopExpr ||
            value instanceof AbstractInvokeExpr ||
            value instanceof AbstractFieldRef ||
            value instanceof ArkArrayRef ||
            value instanceof ArkCastExpr ||
            value instanceof ArkUnopExpr
        ) {
            return true;
        }
        return false;
    }

    public static generateTextForStmt(scene: Scene): void {
        for (const method of scene.getMethods()) {
            const cfg = method.getCfg();
            if (cfg) {
                for (const stmt of cfg.getStmts()) {
                    stmt.setText(stmt.toString());
                }
            }
        }
    }

    public static setComments(metadata: Stmt | ArkBaseModel, node: ts.Node, sourceFile: ts.SourceFile, options: SceneOptions): void {
        const leadingCommentsMetadata = this.getCommentsMetadata(node, sourceFile, options, true);
        if (leadingCommentsMetadata.getComments().length > 0) {
            metadata.setMetadata(ArkMetadataKind.LEADING_COMMENTS, leadingCommentsMetadata);
        }

        const trailingCommentsMetadata = this.getCommentsMetadata(node, sourceFile, options, false);
        if (trailingCommentsMetadata.getComments().length > 0) {
            metadata.setMetadata(ArkMetadataKind.TRAILING_COMMENTS, trailingCommentsMetadata);
        }
    }

    public static getCommentsMetadata(node: ts.Node, sourceFile: ts.SourceFile, options: SceneOptions, isLeading: boolean): CommentsMetadata {
        const comments: CommentItem[] = [];
        if ((isLeading && !options.enableLeadingComments) || (!isLeading && !options.enableTrailingComments)) {
            return new CommentsMetadata(comments);
        }

        // node.pos is the start position of
        const commentRanges =
            (isLeading ? ts.getLeadingCommentRanges(sourceFile.text, node.pos) : ts.getTrailingCommentRanges(sourceFile.text, node.end)) || [];
        // leading comment, while node.end is the
        // end position of the statement
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

    public static isTempLocal(value: Value): boolean {
        return value instanceof Local && value.getName().startsWith(NAME_PREFIX);
    }

    public static findOperandIdx(stmt: Stmt, operand: Value): number {
        let index: number = -1;
        const operands = stmt.getDefAndUses();
        for (let i = 0; i < operands.length; i++) {
            if (operands[i] === operand) {
                index = i;
                break;
            }
        }
        return index;
    }

    public static adjustOperandOriginalPositions(stmt: Stmt, oldValue: Value, newValue: Value): void {
        const operandOriginalPositions = stmt.getOperandOriginalPositions();
        if (!operandOriginalPositions) {
            return;
        }
        const operandOriginalPositionSize = operandOriginalPositions.length;
        const defUseSize = stmt.getDefAndUses().length;
        const oldValueUseSize = oldValue.getUses().length;
        const newValueUseSize = newValue.getUses().length;
        const oldValueIdx = IRUtils.findOperandIdx(stmt, oldValue);
        const baseValueOffset = 1;
        const fieldValueOffset = 2;

        if (oldValue instanceof AbstractRef && newValue instanceof AbstractRef) {
            if (newValue instanceof ArkStaticFieldRef) {
                operandOriginalPositions.splice(oldValueIdx + baseValueOffset, oldValueUseSize - newValueUseSize);
            } else if (oldValue instanceof ArkStaticFieldRef) {
                operandOriginalPositions.splice(oldValueIdx + baseValueOffset, 0, ...IRUtils.generateDefaultPositions(newValueUseSize - oldValueUseSize));
            }

            if (oldValue instanceof ArkInstanceFieldRef && newValue instanceof ArkArrayRef) {
                if (operandOriginalPositionSize === defUseSize) {
                    // may not reserve positions for field name
                    operandOriginalPositions.splice(oldValueIdx + fieldValueOffset, 0, ...IRUtils.generateDefaultPositions(newValueUseSize - oldValueUseSize));
                }
            } else if (oldValue instanceof ArkArrayRef && newValue instanceof ArkInstanceFieldRef) {
                operandOriginalPositions.splice(oldValueIdx + fieldValueOffset, oldValueUseSize - newValueUseSize);
            }
        } else if (oldValue instanceof AbstractInvokeExpr && newValue instanceof AbstractInvokeExpr) {
            if (oldValueUseSize === newValueUseSize + 1) {
                operandOriginalPositions.splice(oldValueIdx + baseValueOffset, 1);
            } else if (oldValueUseSize === newValueUseSize - 1) {
                operandOriginalPositions.splice(oldValueIdx + baseValueOffset, 0, FullPosition.DEFAULT);
            }
        }
    }

    public static generateDefaultPositions(count: number): FullPosition[] {
        const defaultPositions: FullPosition[] = [];
        for (let i = 0; i < count; i++) {
            defaultPositions.push(FullPosition.DEFAULT);
        }
        return defaultPositions;
    }
}
