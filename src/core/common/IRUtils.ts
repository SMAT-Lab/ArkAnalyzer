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
import { CommentsMetadata } from '../model/ArkMetadata';
import { Stmt } from '../base/Stmt';
import { ArkBaseModel } from '../model/ArkBaseModel';
import { FullPosition } from '../base/Position';
import { Local } from '../base/Local';
import { NAME_PREFIX } from './Const';
import { ArkMetadataBuilder } from '../model/builder/ArkMetadataBuilder';

const operandCountScratch: Value[] = [];
const DEFAULT_POSITION_FIRST = FullPosition.DEFAULT.getFirstPacked();
const DEFAULT_POSITION_LAST = FullPosition.DEFAULT.getLastPacked();

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
        ArkMetadataBuilder.setComments(metadata, node, sourceFile, options);
    }

    public static getCommentsMetadata(node: ts.Node, sourceFile: ts.SourceFile, options: SceneOptions, isLeading: boolean): CommentsMetadata {
        return ArkMetadataBuilder.getCommentsMetadata(node, sourceFile, options, isLeading);
    }

    public static isTempLocal(value: Value): boolean {
        return value instanceof Local && value.getName().startsWith(NAME_PREFIX);
    }

    public static findOperandIdx(stmt: Stmt, operand: Value): number {
        let index: number = -1;
        while (operandCountScratch.length > 0) {
            operandCountScratch.pop();
        }
        const operands = stmt.getDefAndUses(operandCountScratch);
        for (let i = 0; i < operands.length; i++) {
            if (operands[i] === operand) {
                index = i;
                break;
            }
        }
        while (operandCountScratch.length > 0) {
            operandCountScratch.pop();
        }
        return index;
    }

    public static adjustOperandOriginalPositions(stmt: Stmt, oldValue: Value, newValue: Value): void {
        const packed = stmt.getOperandPositionsPacked();
        if (!packed) {
            return;
        }
        const operandOriginalPositionSize = packed.length >> 1;
        while (operandCountScratch.length > 0) {
            operandCountScratch.pop();
        }
        stmt.getDefAndUses(operandCountScratch);
        const defUseSize = operandCountScratch.length;
        while (operandCountScratch.length > 0) {
            operandCountScratch.pop();
        }
        oldValue.getUses(operandCountScratch);
        const oldValueUseSize = operandCountScratch.length;
        while (operandCountScratch.length > 0) {
            operandCountScratch.pop();
        }
        newValue.getUses(operandCountScratch);
        const newValueUseSize = operandCountScratch.length;
        while (operandCountScratch.length > 0) {
            operandCountScratch.pop();
        }
        const oldValueIdx = IRUtils.findOperandIdx(stmt, oldValue);
        const baseValueOffset = 1;
        const fieldValueOffset = 2;

        if (oldValue instanceof AbstractRef && newValue instanceof AbstractRef) {
            if (newValue instanceof ArkStaticFieldRef) {
                packed.splice(2 * (oldValueIdx + baseValueOffset), 2 * (oldValueUseSize - newValueUseSize));
            } else if (oldValue instanceof ArkStaticFieldRef) {
                packed.splice(2 * (oldValueIdx + baseValueOffset), 0, ...IRUtils.generateDefaultPositionsPacked(newValueUseSize - oldValueUseSize));
            }

            if (oldValue instanceof ArkInstanceFieldRef && newValue instanceof ArkArrayRef) {
                if (operandOriginalPositionSize === defUseSize) {
                    // may not reserve positions for field name
                    packed.splice(2 * (oldValueIdx + fieldValueOffset), 0, ...IRUtils.generateDefaultPositionsPacked(newValueUseSize - oldValueUseSize));
                }
            } else if (oldValue instanceof ArkArrayRef && newValue instanceof ArkInstanceFieldRef) {
                packed.splice(2 * (oldValueIdx + fieldValueOffset), 2 * (oldValueUseSize - newValueUseSize));
            }
        } else if (oldValue instanceof AbstractInvokeExpr && newValue instanceof AbstractInvokeExpr) {
            if (oldValueUseSize === newValueUseSize + 1) {
                packed.splice(2 * (oldValueIdx + baseValueOffset), 2);
            } else if (oldValueUseSize === newValueUseSize - 1) {
                packed.splice(2 * (oldValueIdx + baseValueOffset), 0, DEFAULT_POSITION_FIRST, DEFAULT_POSITION_LAST);
            }
        }
    }

    public static generateDefaultPositionsPacked(count: number): number[] {
        const packed: number[] = [];
        for (let i = 0; i < count; i++) {
            packed.push(DEFAULT_POSITION_FIRST, DEFAULT_POSITION_LAST);
        }
        return packed;
    }

    public static generateDefaultPositions(count: number): FullPosition[] {
        const defaultPositions: FullPosition[] = [];
        for (let i = 0; i < count; i++) {
            defaultPositions.push(FullPosition.DEFAULT);
        }
        return defaultPositions;
    }
}
