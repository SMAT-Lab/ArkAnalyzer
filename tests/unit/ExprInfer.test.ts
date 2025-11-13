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

import { assert, describe, it } from 'vitest';
import { ArkAssignStmt, ArkCastExpr, FileSignature } from '../../src';
import path from 'path';
import { buildScene } from './common';

const scene = buildScene(path.join(__dirname, '../resources/typeInference'), true);
const fileId = new FileSignature(scene.getProjectName(), 'ExprSample.ts');

describe('ArkCastExpr Test', () => {
    it('case1: cast expr with any', () => {
        const stmts = scene.getFile(fileId)?.getDefaultClass().getMethodWithName('castWithAny')?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts);
        assert.isAtLeast(stmts!.length, 3);

        assert.isTrue(stmts![1] instanceof ArkAssignStmt);
        assert.equal((stmts![1] as ArkAssignStmt).getLeftOp().getType().toString(), 'number');
        assert.isTrue((stmts![1] as ArkAssignStmt).getRightOp() instanceof ArkCastExpr);
        assert.equal(((stmts![1] as ArkAssignStmt).getRightOp() as ArkCastExpr).getType().toString(), 'any');
        assert.equal(((stmts![1] as ArkAssignStmt).getRightOp() as ArkCastExpr).getOp().getType().toString(), 'number');
        assert.equal(stmts![1].toString(), 'a = <any>1');

        assert.isTrue(stmts![2] instanceof ArkAssignStmt);
        assert.equal((stmts![2] as ArkAssignStmt).getLeftOp().getType().toString(), 'any|string');
        assert.isTrue((stmts![2] as ArkAssignStmt).getRightOp() instanceof ArkCastExpr);
        assert.equal(((stmts![2] as ArkAssignStmt).getRightOp() as ArkCastExpr).getType().toString(), 'string');
        assert.equal(((stmts![2] as ArkAssignStmt).getRightOp() as ArkCastExpr).getOp().getType().toString(), 'number');
        assert.equal(stmts![2].toString(), 'b = <string>1');
    });
});