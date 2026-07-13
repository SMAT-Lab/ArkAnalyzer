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

import { describe, expect, it, assert } from 'vitest';
import { buildScene } from '../../common';
import path from 'path';
import { ArkReturnStmt, ArkAssignStmt, ArkIfStmt } from '../../../../src';

describe('Stmt Source Code and Position Test', () => {
    const scene = buildScene(path.join(__dirname, '../../../resources/model/method'));
    const arkFile = scene.getFiles().find((file) => file.getName() === 'method.ts');
    const defaultClass = arkFile?.getDefaultClass();

    describe('getA function stmt tests', () => {
        const method = defaultClass?.getMethodWithName('getA');
        const stmts = method?.getBody()?.getCfg().getStmts();

        it('test getOriginPositionInfo for return stmt', async () => {
            const returnStmt = stmts?.find(stmt => stmt instanceof ArkReturnStmt) as ArkReturnStmt;
            assert.isDefined(returnStmt);
            
            const positionInfo = returnStmt.getOriginPositionInfo();
            expect(positionInfo.getLineNo()).eq(116);
            expect(positionInfo.getColNo()).eq(5);
        });

        it('test getOriginFullPosition for return stmt', async () => {
            const returnStmt = stmts?.find(stmt => stmt instanceof ArkReturnStmt) as ArkReturnStmt;
            assert.isDefined(returnStmt);
            
            const position = returnStmt.getOriginFullPosition();
            assert.isDefined(position);
            expect(position!.getFirstLine()).eq(116);
            expect(position!.getFirstCol()).eq(5);
            expect(position!.getLastLine()).eq(116);
            expect(position!.getLastCol()).eq(14);
        });

        it('test getOriginalText for return stmt', async () => {
            const returnStmt = stmts?.find(stmt => stmt instanceof ArkReturnStmt) as ArkReturnStmt;
            assert.isDefined(returnStmt);
            
            const originalText = returnStmt.getOriginalText();
            assert.isDefined(originalText);
            expect(originalText).eq('return 1;');
        });
    });

    describe('paramInitializerWithIfBranch function stmt tests', () => {
        const method = defaultClass?.getMethodWithName('paramInitializerWithIfBranch');
        const stmts = method?.getBody()?.getCfg().getStmts();

        it('test getOriginPositionInfo for assign stmt (a = 3)', async () => {
            const assignStmt = stmts?.filter(stmt => stmt instanceof ArkAssignStmt && stmt.toString() === 'a = 3')[0] as ArkAssignStmt;
            assert.isDefined(assignStmt);
            
            const positionInfo = assignStmt.getOriginPositionInfo();
            expect(positionInfo.getLineNo()).eq(125);
            expect(positionInfo.getColNo()).eq(39);
        });

        it('test getOriginFullPosition for assign stmt (a = 3)', async () => {
            const assignStmt = stmts?.filter(stmt => stmt instanceof ArkAssignStmt && stmt.toString() === 'a = 3')[0] as ArkAssignStmt;
            assert.isDefined(assignStmt);
            
            const position = assignStmt.getOriginFullPosition();
            assert.isDefined(position);
            expect(position!.getFirstLine()).eq(125);
            expect(position!.getFirstCol()).eq(39);
            expect(position!.getLastLine()).eq(125);
            expect(position!.getLastCol()).eq(44);
        });

        it('test getOriginalText for assign stmt (a = 3)', async () => {
            const assignStmt = stmts?.filter(stmt => stmt instanceof ArkAssignStmt && stmt.toString() === 'a = 3')[0] as ArkAssignStmt;
            assert.isDefined(assignStmt);
            
            const originalText = assignStmt.getOriginalText();
            assert.isDefined(originalText);
            expect(originalText).eq('a = 3');
        });

        it('test getOriginPositionInfo for return stmt (return a)', async () => {
            const returnStmt = stmts?.filter(stmt => stmt instanceof ArkReturnStmt && stmt.toString() === 'return a')[0] as ArkReturnStmt;
            assert.isDefined(returnStmt);
            
            const positionInfo = returnStmt.getOriginPositionInfo();
            expect(positionInfo.getLineNo()).eq(127);
            expect(positionInfo.getColNo()).eq(9);
        });

        it('test getOriginFullPosition for return stmt (return a)', async () => {
            const returnStmt = stmts?.filter(stmt => stmt instanceof ArkReturnStmt && stmt.toString() === 'return a')[0] as ArkReturnStmt;
            assert.isDefined(returnStmt);
            
            const position = returnStmt.getOriginFullPosition();
            assert.isDefined(position);
            expect(position!.getFirstLine()).eq(127);
            expect(position!.getFirstCol()).eq(9);
            expect(position!.getLastLine()).eq(127);
            expect(position!.getLastCol()).eq(18);
        });

        it('test getOriginalText for return stmt (return a)', async () => {
            const returnStmt = stmts?.filter(stmt => stmt instanceof ArkReturnStmt && stmt.toString() === 'return a')[0] as ArkReturnStmt;
            assert.isDefined(returnStmt);
            
            const originalText = returnStmt.getOriginalText();
            assert.isDefined(originalText);
            expect(originalText).eq('return a;');
        });

        it('test getOriginPositionInfo for if stmt', async () => {
            const ifStmt = stmts?.filter(stmt => stmt instanceof ArkIfStmt && stmt.toString() === 'if a > 0')[0] as ArkIfStmt;
            assert.isDefined(ifStmt);
            
            const positionInfo = ifStmt.getOriginPositionInfo();
            expect(positionInfo.getLineNo()).eq(126);
            expect(positionInfo.getColNo()).eq(5);
        });

        it('test getOriginFullPosition for if stmt', async () => {
            const ifStmt = stmts?.filter(stmt => stmt instanceof ArkIfStmt && stmt.toString() === 'if a > 0')[0] as ArkIfStmt;
            assert.isDefined(ifStmt);
            
            const position = ifStmt.getOriginFullPosition();
            assert.isDefined(position);
            expect(position!.getFirstLine()).eq(126);
            expect(position!.getFirstCol()).eq(5);
            expect(position!.getLastLine()).eq(130);
            expect(position!.getLastCol()).eq(6);
        });

        it('test getOriginalText for if stmt', async () => {
            const ifStmt = stmts?.filter(stmt => stmt instanceof ArkIfStmt && stmt.toString() === 'if a > 0')[0] as ArkIfStmt;
            assert.isDefined(ifStmt);
            
            const originalText = ifStmt.getOriginalText();
            assert.isDefined(originalText);
            const expectedText = `if (a > 0) {
        return a;
    } else {
        return -a;
    }`;
            expect(originalText?.replace(/\r\n/g, '\n')).eq(expectedText);
        });
    });

    describe('switch statement line numbers', () => {
        const switchScene = buildScene(path.join(__dirname, '../../../resources/cfg/switch'), false);
        const switchFile = switchScene.getFiles().find(f => f.getName().endsWith('SwitchSample.ts'));

        it('ifStmt generated from switch case should have correct line number and column', () => {
            const method = switchFile?.getDefaultClass().getMethodWithName('case1');
            const stmts = method?.getBody()?.getCfg().getStmts();
            const ifStmts = stmts?.filter(s => s instanceof ArkIfStmt) as ArkIfStmt[];

            expect(ifStmts.length).toBe(2);

            const ifStmt2 = ifStmts.find(s => s.toString() === 'if a == 2') as ArkIfStmt;
            assert.isDefined(ifStmt2);
            expect(ifStmt2.getOriginPositionInfo().getLineNo()).toBe(20);
            expect(ifStmt2.getOriginPositionInfo().getColNo()).toBe(14);

            const ifStmt3 = ifStmts.find(s => s.toString() === 'if a == 3') as ArkIfStmt;
            assert.isDefined(ifStmt3);
            expect(ifStmt3.getOriginPositionInfo().getLineNo()).toBe(22);
            expect(ifStmt3.getOriginPositionInfo().getColNo()).toBe(14);
        });

        it('ifStmt generated from switch case should have correct originFullPosition', () => {
            const method = switchFile?.getDefaultClass().getMethodWithName('case1');
            const stmts = method?.getBody()?.getCfg().getStmts();
            const ifStmts = stmts?.filter(s => s instanceof ArkIfStmt) as ArkIfStmt[];

            expect(ifStmts.length).toBe(2);

            const ifStmt2 = ifStmts.find(s => s.toString() === 'if a == 2') as ArkIfStmt;
            assert.isDefined(ifStmt2);
            const pos2 = ifStmt2.getOriginFullPosition();
            assert.isDefined(pos2);
            expect(pos2!.getFirstLine()).toBe(20);
            expect(pos2!.getFirstCol()).toBe(14);

            const ifStmt3 = ifStmts.find(s => s.toString() === 'if a == 3') as ArkIfStmt;
            assert.isDefined(ifStmt3);
            const pos3 = ifStmt3.getOriginFullPosition();
            assert.isDefined(pos3);
            expect(pos3!.getFirstLine()).toBe(22);
            expect(pos3!.getFirstCol()).toBe(14);
        });
    });
});