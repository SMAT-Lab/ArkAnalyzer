/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import { describe, expect, it } from 'vitest';
import {
    ArkReturnVoidStmt,
    Local,
    NumberType,
    StringType,
    UnknownType,
} from '../../../../src';
import { NumberConstant } from '../../../../src/core/base/Constant';
import { ModifierType } from '../../../../src/core/model/ArkBaseModel';
import { ExportType } from '../../../../src/core/model/ArkExport';
import { LocalSignature } from '../../../../src/core/model/ArkSignature';

describe('Local Test', () => {
    it('constructor stores name and defaults type to UnknownType', () => {
        const a = new Local('a');
        expect(a.getName()).toBe('a');
        expect(a.getType()).toBe(UnknownType.getInstance());
    });

    it('constructor accepts an explicit type', () => {
        const a = new Local('a', NumberType.getInstance());
        expect(a.getType()).toBe(NumberType.getInstance());
    });

    it('setName/setType update fields', () => {
        const a = new Local('a');
        a.setName('b');
        a.setType(StringType.getInstance());
        expect(a.getName()).toBe('b');
        expect(a.getType()).toBe(StringType.getInstance());
    });

    it('originalValue defaults to null and is updatable', () => {
        const a = new Local('a');
        expect(a.getOriginalValue()).toBeNull();
        const c = new NumberConstant('42');
        a.setOriginalValue(c);
        expect(a.getOriginalValue()).toBe(c);
    });

    it('declaringStmt defaults to null and is updatable', () => {
        const a = new Local('a');
        expect(a.getDeclaringStmt()).toBeNull();
        const stmt = new ArkReturnVoidStmt();
        a.setDeclaringStmt(stmt);
        expect(a.getDeclaringStmt()).toBe(stmt);
    });

    it('getUses() always returns an empty array', () => {
        const a = new Local('a');
        expect(a.getUses()).toEqual([]);
    });

    it('addUsedStmt appends to getUsedStmts and preserves order', () => {
        const a = new Local('a');
        const s1 = new ArkReturnVoidStmt();
        const s2 = new ArkReturnVoidStmt();
        const s3 = new ArkReturnVoidStmt();

        a.addUsedStmt(s1);
        a.addUsedStmt(s2);
        a.addUsedStmt(s3);

        const used = a.getUsedStmts();
        expect(used).toHaveLength(3);
        expect(used[0]).toBe(s1);
        expect(used[1]).toBe(s2);
        expect(used[2]).toBe(s3);
    });

    it('toString returns the local name', () => {
        const a = new Local('myLocal');
        expect(a.toString()).toBe('myLocal');
        a.setName('renamed');
        expect(a.toString()).toBe('renamed');
    });

    it('getExportType is always LOCAL', () => {
        expect(new Local('a').getExportType()).toBe(ExportType.LOCAL);
    });

    it('getModifiers returns 0 (no modifiers)', () => {
        expect(new Local('a').getModifiers()).toBe(0);
    });

    it('containsModifier(CONST) reflects the const flag', () => {
        const a = new Local('a');
        expect(a.containsModifier(ModifierType.CONST)).toBe(false);

        a.setConstFlag(true);
        expect(a.containsModifier(ModifierType.CONST)).toBe(true);

        a.setConstFlag(false);
        expect(a.containsModifier(ModifierType.CONST)).toBe(false);
    });

    it('containsModifier returns false for non-CONST modifier kinds', () => {
        const a = new Local('a');
        a.setConstFlag(true);
        expect(a.containsModifier(ModifierType.STATIC)).toBe(false);
        expect(a.containsModifier(ModifierType.PUBLIC)).toBe(false);
    });

    it('getConstFlag defaults to false and round-trips via setConstFlag', () => {
        const a = new Local('a');
        expect(a.getConstFlag()).toBe(false);
        a.setConstFlag(true);
        expect(a.getConstFlag()).toBe(true);
        a.setConstFlag(false);
        expect(a.getConstFlag()).toBe(false);
    });

    it('getSignature falls back to a default LocalSignature when none was set', () => {
        const a = new Local('a');
        const sig = a.getSignature();
        expect(sig).toBeInstanceOf(LocalSignature);
        // Calling twice without setting returns equivalent (re-built) defaults.
        expect(a.getSignature()).toBeInstanceOf(LocalSignature);
    });

    it('setSignature stores a custom signature and getSignature returns it', () => {
        const a = new Local('a');
        const baseline = a.getSignature();
        a.setSignature(baseline);
        expect(a.getSignature()).toBe(baseline);
    });

    it('different Local instances do not share usedStmts state', () => {
        const a = new Local('a');
        const b = new Local('b');
        a.addUsedStmt(new ArkReturnVoidStmt());
        expect(a.getUsedStmts()).toHaveLength(1);
        expect(b.getUsedStmts()).toHaveLength(0);
    });
});
