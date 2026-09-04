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

import { describe, expect, it, assert, beforeAll } from 'vitest';
import { buildScene } from '../../common';
import path from 'path';
import { ArkReturnStmt, ArkAssignStmt, ArkIfStmt, ArkInvokeStmt, ArkClass, ArkFile, Local, DEFAULT_ARK_METHOD_NAME, Stmt, FullPosition } from '../../../../src';

describe('Stmt Source Code and Position Test', () => {
    let defaultClass: ArkClass | undefined = undefined;

    beforeAll((): void => {
        const scene = buildScene(path.join(__dirname, '../../../resources/model/method'));
        const arkFile = scene.getFiles().find((file) => file.getName() === 'method.ts');
        defaultClass = arkFile?.getDefaultClass();
    });

    describe('getA function stmt tests', () => {
        let stmts: Stmt[] | undefined;

        beforeAll((): void => {
            const method = defaultClass?.getMethodWithName('getA');
            stmts = method?.getBody()?.getCfg().getStmts();
        })

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
        let stmts: Stmt[] | undefined;

        beforeAll((): void => {
            const method = defaultClass?.getMethodWithName('paramInitializerWithIfBranch');
            stmts = method?.getBody()?.getCfg().getStmts();
        })

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
});

describe('switch statement line numbers', () => {
    let switchFile: ArkFile | undefined;

    beforeAll((): void => {
        const switchScene = buildScene(path.join(__dirname, '../../../resources/cfg/switch'), false);
        switchFile = switchScene.getFiles().find(f => f.getName().endsWith('SwitchSample.ts'));
    })

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

    describe('getInvokeFullPosition', () => {
        const callScene = buildScene(path.join(__dirname, '../../../resources/arkIRTransformer/expression'));
        const callFile = callScene.getFiles().find((file) => file.getName() === 'CallExpressionTest.ts');
        const callStmts = callFile?.getDefaultClass().getMethodWithName(DEFAULT_ARK_METHOD_NAME)?.getCfg()?.getStmts();

        function findStmtByOriginalText(text: string): Stmt {
            const stmt = callStmts?.find((s) => s.getOriginalText() === text);
            assert.isDefined(stmt);
            return stmt!;
        }

        function findStmtByIrText(substr: string): Stmt {
            const stmt = callStmts?.find((s) => s.toString().includes(substr));
            assert.isDefined(stmt);
            return stmt!;
        }

        function expectFullPos(pos: FullPosition, firstLine: number, firstCol: number, lastLine: number, lastCol: number): void {
            expect(pos.getFirstLine()).toBe(firstLine);
            expect(pos.getFirstCol()).toBe(firstCol);
            expect(pos.getLastLine()).toBe(lastLine);
            expect(pos.getLastCol()).toBe(lastCol);
        }

        it('returns full position for static call call10()', () => {
            const stmt = findStmtByOriginalText('call10();');
            expectFullPos(stmt.getInvokeFullPosition(), 23, 1, 23, 9);
        });

        it('returns full position for member call call1()', () => {
            const stmt = findStmtByOriginalText('a1.call1();');
            expectFullPos(stmt.getInvokeFullPosition(), 17, 4, 17, 11);
        });

        it('returns full position for member call call2()', () => {
            const stmt = findStmtByOriginalText('let a2 = a3.call2();');
            expectFullPos(stmt.getInvokeFullPosition(), 18, 13, 18, 20);
        });

        it('returns invoke position on the IR stmt that owns that call', () => {
            expectFullPos(findStmtByIrText('.call200()').getInvokeFullPosition(), 28, 12, 28, 21);
            expectFullPos(findStmtByIrText('.call300()').getInvokeFullPosition(), 28, 22, 28, 47);
        });

        it('returns full position for multiline member call chain', () => {
            expectFullPos(findStmtByIrText('.call400()').getInvokeFullPosition(), 32, 6, 32, 15);
            expectFullPos(findStmtByIrText('.call500()').getInvokeFullPosition(), 33, 6, 33, 20);
        });

        it('returns full position for multiline static call chain', () => {
            expectFullPos(findStmtByIrText('.call600()').getInvokeFullPosition(), 35, 12, 35, 21);
            expectFullPos(findStmtByIrText('.call700()').getInvokeFullPosition(), 36, 6, 36, 15);
            expectFullPos(findStmtByIrText('.call800()').getInvokeFullPosition(), 37, 6, 37, 15);
        });

        it('returns full position for optional chain call900()', () => {
            const stmt = findStmtByOriginalText('obj?.call900();');
            expectFullPos(stmt.getInvokeFullPosition(), 40, 6, 40, 15);
        });

        it('returns full position for prefixCall10 without matching call10 substring', () => {
            const prefixStmt = findStmtByOriginalText('prefixCall10();');
            expectFullPos(prefixStmt.getInvokeFullPosition(), 43, 1, 43, 15);
        });

        it('returns full position for $ identifier call', () => {
            const stmt = findStmtByOriginalText('$tempCall();');
            expectFullPos(stmt.getInvokeFullPosition(), 44, 1, 44, 12);
        });

        it('matches call with whitespace before parenthesis', () => {
            const stmt = findStmtByOriginalText('callSpace ();');
            expectFullPos(stmt.getInvokeFullPosition(), 45, 1, 45, 13);
        });

        it('matches simple generic type arguments', () => {
            const stmt = findStmtByOriginalText('genericCall<T>();');
            expectFullPos(stmt.getInvokeFullPosition(), 46, 1, 46, 17);
        });

        it('matches call with newline before parenthesis', () => {
            expectFullPos(findStmtByIrText('.callNewline()').getInvokeFullPosition(), 47, 1, 48, 3);
        });

        it('matches parenthesized callee (parenCall)()', () => {
            const stmt = findStmtByOriginalText('(parenCall)();');
            expectFullPos(stmt.getInvokeFullPosition(), 49, 2, 49, 14);
        });

        it('matches nested generic type arguments', () => {
            const stmt = findStmtByOriginalText('nestedGeneric<Bar<T>>();');
            expectFullPos(stmt.getInvokeFullPosition(), 50, 1, 50, 24);
        });

        it('matches generic type arguments containing =>', () => {
            const stmt = findStmtByOriginalText('arrowGeneric<() => void>();');
            expectFullPos(stmt.getInvokeFullPosition(), 51, 1, 51, 27);
        });

        it('matches generic type arguments with > inside a string literal', () => {
            const stmt = findStmtByOriginalText('strGeneric<\'a>b\'>();');
            expectFullPos(stmt.getInvokeFullPosition(), 52, 1, 52, 20);
        });

        it('matches nested function types with =>', () => {
            const stmt = findStmtByOriginalText('fnGeneric<(x: () => void) => string>();');
            expectFullPos(stmt.getInvokeFullPosition(), 53, 1, 53, 39);
        });

        it('matches generic type arguments with > inside a comment', () => {
            const stmt = findStmtByOriginalText('commentGeneric<T /* > */>();');
            expectFullPos(stmt.getInvokeFullPosition(), 54, 1, 54, 28);
        });

        it('returns position of call3 for stmt with call args', () => {
            const stmt = findStmtByOriginalText('let a4 = a3.call3(para1, para2);');
            expectFullPos(stmt.getInvokeFullPosition(), 19, 13, 19, 32);
        });

        it('returns distinct positions for same-name call chain fooSame().fooSame()', () => {
            const sameNameStmts = callStmts?.filter((s) => s.toString().includes('fooSame')) ?? [];
            const first = sameNameStmts.find((s) => s instanceof ArkAssignStmt);
            const second = sameNameStmts.find((s) => s instanceof ArkInvokeStmt);
            assert.isDefined(first);
            assert.isDefined(second);
            expectFullPos(first!.getInvokeFullPosition(), 57, 1, 57, 10);
            expectFullPos(second!.getInvokeFullPosition(), 57, 11, 57, 20);
        });

        it('starts at method name for (obj).callParenBase()', () => {
            const stmt = findStmtByOriginalText('(obj).callParenBase();');
            expectFullPos(stmt.getInvokeFullPosition(), 60, 7, 60, 22);
        });

        it('starts at method name for parenthesized property access (obj.m)()', () => {
            const stmt = findStmtByOriginalText('(obj.m)();');
            expectFullPos(stmt.getInvokeFullPosition(), 61, 6, 61, 10);
        });

        it('unwraps nested parentheses for ((parenCall2))()', () => {
            const stmt = findStmtByOriginalText('((parenCall2))();');
            expectFullPos(stmt.getInvokeFullPosition(), 62, 3, 62, 17);
        });

        it('starts at method name for non-null member call obj!.callNonNull()', () => {
            const stmt = findStmtByOriginalText('obj!.callNonNull();');
            expectFullPos(stmt.getInvokeFullPosition(), 63, 6, 63, 19);
        });

        it('unwraps non-null on callee callBang!()', () => {
            const stmt = findStmtByOriginalText('callBang!();');
            expectFullPos(stmt.getInvokeFullPosition(), 64, 1, 64, 12);
        });

        it('unwraps as-expression for (callAs as any)()', () => {
            expectFullPos(findStmtByIrText('ptrinvoke %6').getInvokeFullPosition(), 65, 2, 65, 18);
        });

        it('starts at element key for obj[key]()', () => {
            const stmt = findStmtByOriginalText('obj[key]();');
            expectFullPos(stmt.getInvokeFullPosition(), 66, 5, 66, 11);
        });

        it('starts at string literal key for obj[\'lit\']()', () => {
            const stmt = findStmtByOriginalText('obj[\'lit\']();');
            expectFullPos(stmt.getInvokeFullPosition(), 67, 5, 67, 13);
        });

        it('covers multiline argument list for callMultilineArgs', () => {
            expectFullPos(findStmtByIrText('.callMultilineArgs()').getInvokeFullPosition(), 68, 5, 70, 2);
        });

        it('returns DEFAULT when statement has no invoke', () => {
            const stmt = new ArkAssignStmt(new Local('lhs'), new Local('rhs'));
            expect(stmt.getInvokeFullPosition()).toBe(FullPosition.DEFAULT);
        });
    });
});
