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

import { assert, describe, it } from 'vitest';
import path from 'path';
import { ArkAssignStmt, ArkField, ArkIfStmt, Cfg } from '../../../../src';
import { ANONYMOUS_CLASS_PREFIX } from '../../../../src/core/common/Const';
import { DummyStmt } from '../../../../src/core/common/ArkIRTransformer';
import { buildScene } from '../../common';

const scene = buildScene(path.join(__dirname, '../../../resources/model/field'));
const arkFile = scene.getFiles().find((file) => file.getName().endsWith('DummyStmtInitializer.ts'));

function assertInitializerHasNoDummyStmt(field: ArkField | null | undefined): void {
    assert.isDefined(field);
    const initializer = field!.getInitializer();
    assert.isAtLeast(initializer.length, 1);
    for (const stmt of initializer) {
        assert.isFalse(stmt instanceof DummyStmt, `DummyStmt leaked into initializer: ${stmt.toString()}`);
        assert.isDefined(stmt.getCfg(), `initializer stmt has no cfg: ${stmt.toString()}`);
    }
    const lastStmt = initializer[initializer.length - 1];
    assert.isTrue(lastStmt instanceof ArkAssignStmt);
}

function assertCfgSplitsConditionalBranches(cfg: Cfg | undefined): void {
    assert.isDefined(cfg);
    let ifBlockFound = false;
    for (const block of cfg!.getBlocks()) {
        if (!block.getStmts().some((stmt) => stmt instanceof ArkIfStmt)) {
            continue;
        }
        ifBlockFound = true;
        assert.equal(block.getSuccessors().length, 2);
    }
    assert.isTrue(ifBlockFound);
}

function assertCfgHasIfWithoutDummyStmt(cfg: Cfg | undefined): void {
    assert.isDefined(cfg);
    const stmts = cfg!.getStmts();
    assert.isTrue(stmts.some((stmt) => stmt instanceof ArkIfStmt));
    assert.isFalse(stmts.some((stmt) => stmt instanceof DummyStmt));
}

describe('DummyStmt must not remain in field initializer', () => {
    it('filters DummyStmt from object literal property initializer', () => {
        assert.isDefined(arkFile);
        let bottomField: ArkField | null = null;
        for (const cls of arkFile!.getClasses()) {
            if (!cls.getName().startsWith(ANONYMOUS_CLASS_PREFIX)) {
                continue;
            }
            const field = cls.getFieldWithName('bottom');
            if (field) {
                bottomField = field;
                break;
            }
        }
        assertInitializerHasNoDummyStmt(bottomField);

        const method = arkFile!.getDefaultClass().getMethodWithName('useObjectLiteral');
        assertCfgSplitsConditionalBranches(method?.getCfg());
    });

    it('filters DummyStmt from class instance and static field initializers', () => {
        assert.isDefined(arkFile);
        const fooClass = arkFile!.getClassWithName('Foo');
        assert.isDefined(fooClass);

        assertInitializerHasNoDummyStmt(fooClass!.getFieldWithName('x'));
        assertInitializerHasNoDummyStmt(fooClass!.getStaticFieldWithName('y'));

        // %instInit/%statInit are linear CFGs; DummyStmt is only a split marker and must not remain.
        assertCfgHasIfWithoutDummyStmt(fooClass!.getInstanceInitMethod().getCfg());
        assertCfgHasIfWithoutDummyStmt(fooClass!.getStaticInitMethod().getCfg());
    });
});
