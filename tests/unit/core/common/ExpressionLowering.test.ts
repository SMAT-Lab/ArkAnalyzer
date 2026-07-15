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

import { describe, expect, it, assert } from 'vitest';
import { buildScene } from '../../common';
import path from 'path';
import { ArkArrayRef, ArkAssignStmt } from '../../../../src';

describe('ExpressionLowering', () => {
    const scene = buildScene(path.join(__dirname, '../../../resources/arkIRTransformer/expression'));
    const arkFile = scene.getFiles().find(f => f.getName().endsWith('IndexExpressionSample.ts'));

    it('string index <s[i]> lowered as ArkArrayRef, not ArkInstanceFieldRef', () => {
        const stmts = arkFile?.getDefaultClass().getMethodWithName('case1')?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        // Find the assign stmt for the index expression (%0 = s[i]), not the parameter binding
        const assignStmt = stmts!.find(s => s instanceof ArkAssignStmt && s.toString().startsWith('%')) as ArkAssignStmt;
        assert.isDefined(assignStmt);
        expect(assignStmt.getRightOp()).toBeInstanceOf(ArkArrayRef);
    });

    it('array index <arr[i]> also lowered as ArkArrayRef', () => {
        const stmts = arkFile?.getDefaultClass().getMethodWithName('case2')?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        const assignStmt = stmts!.find(s => s instanceof ArkAssignStmt && s.toString().startsWith('%')) as ArkAssignStmt;
        assert.isDefined(assignStmt);
        expect(assignStmt.getRightOp()).toBeInstanceOf(ArkArrayRef);
    });
});
