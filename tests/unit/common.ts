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

import { BasicBlock, DEFAULT_ARK_CLASS_NAME, DEFAULT_ARK_METHOD_NAME, FullPosition, ModelUtils, Scene, SceneConfig, Stmt } from '../../src';
import { assert, expect } from 'vitest';
import { ArkClass } from '../../src';
import { ArkIRMethodPrinter } from '../../src/save/arkir/ArkIRMethodPrinter';

export function buildScene(projectPath: string, needInferTypes: boolean = true) {
    const config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(projectPath);
    const scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    if (needInferTypes) {
        scene.inferTypes();
    }
    return scene;
}

export function testFileStmts(scene: Scene, filePath: string, expectFileStmts: any): void {
    const arkFile = scene.getFiles().find(file => file.getName().endsWith(filePath));
    if (!arkFile) {
        assert.isDefined(arkFile);
        return;
    }
    const methods = ModelUtils.getAllMethodsInFile(arkFile);
    for (const expectMethod of expectFileStmts.methods) {
        const expectMethodName = expectMethod.name;
        const method = methods.find(method => method.getName() === expectMethodName);
        if (!method) {
            assert.isDefined(method);
            continue;
        }
        const stmts = method.getCfg()?.getStmts();
        if (!stmts) {
            assert.isDefined(stmts);
            continue;
        }
        assertStmtsEqual(stmts, expectMethod.stmts);
    }
}

export function testMethodStmts(
    scene: Scene,
    fileName: string,
    expectStmts: any[],
    className: string = DEFAULT_ARK_CLASS_NAME,
    methodName: string = DEFAULT_ARK_METHOD_NAME,
    assertPos: boolean = true
): void {
    const arkFile = scene.getFiles().find(file => file.getName().endsWith(fileName));
    const arkMethod = arkFile
        ?.getClassWithName(className)
        ?.getMethods()
        .find(method => method.getName() === methodName);
    const stmts = arkMethod?.getCfg()?.getStmts();
    if (!stmts) {
        assert.isDefined(stmts);
        return;
    }
    assertStmtsEqual(stmts, expectStmts, assertPos);
}

export function testMethodIR(
    scene: Scene,
    fileName: string,
    className: string = DEFAULT_ARK_CLASS_NAME,
    methodName: string = DEFAULT_ARK_METHOD_NAME,
    expectMethodIR: string
): void {
    const arkFile = scene.getFiles().find(file => file.getName().endsWith(fileName));
    const arkMethod = arkFile
        ?.getClassWithName(className)
        ?.getMethods()
        .find(method => method.getName() === methodName);
    assert.isDefined(arkMethod);
    const printer = new ArkIRMethodPrinter(arkMethod!);
    expect(printer.dump()).toEqual(expectMethodIR);
}

export function testBlocks(scene: Scene, filePath: string, methodName: string, expectBlocks: any[]): void {
    const arkFile = scene.getFiles().find(file => file.getName().endsWith(filePath));
    const arkMethod = arkFile
        ?.getDefaultClass()
        .getMethods()
        .find(method => method.getName() === methodName);
    const blocks = arkMethod?.getCfg()?.getBlocks();
    if (!blocks) {
        assert.isDefined(blocks);
        return;
    }
    // @ts-ignore
    assertBlocksEqual(blocks, expectBlocks);
}

export function testBlocksWithSignature(scene: Scene, filePath: string, className: string, methodSubSignature: string, expectBlocks: any[]): void {
    const arkFile = scene.getFiles().find(file => file.getName().endsWith(filePath));
    let curClass: ArkClass | null | undefined;
    if (!className) {
        curClass = arkFile?.getDefaultClass();
    } else {
        curClass = arkFile?.getClassWithName(className);
    }
    const arkMethod = curClass?.getMethods().find(method => method.getSignature().getMethodSubSignature().toString() === methodSubSignature);
    const blocks = arkMethod?.getCfg()?.getBlocks();
    if (!blocks) {
        assert.isDefined(blocks);
        return;
    }
    // @ts-ignore
    assertBlocksEqual(blocks, expectBlocks);
}

export function showTestBlocks(scene: Scene, filePath: string, methodName: string): void {
    const arkFile = scene.getFiles().find(file => file.getName().endsWith(filePath));
    const arkMethod = arkFile
        ?.getDefaultClass()
        .getMethods()
        .find(method => method.getName() === methodName);
    const blocks = arkMethod?.getCfg()?.getBlocks();
    if (!blocks) {
        assert.isDefined(blocks);
        return;
    }
    // @ts-ignore
    showCfgStmt(blocks);
}

export function showCfgStmt(blocks: Set<BasicBlock>): void {
    const blockMap = new Map<number, BasicBlock>();
    for (const block of blocks) {
        blockMap.set(block.getId(), block);
    }
    blockMap.forEach((value: BasicBlock, key) => {
        const block = blockMap.get(key);
        const stmts: string[] = [];
        // @ts-ignore
        for (const stmt of block.getStmts()) {
            stmts.push(stmt.toString());
        }
        const preds: number[] = [];
        // @ts-ignore
        block.getPredecessors().forEach(predBlock => {
            preds.push(predBlock.getId());
        });
        const succes: number[] = [];
        // @ts-ignore
        block.getSuccessors().forEach(succBlock => {
            succes.push(succBlock.getId());
        });
        console.log({
            id: key,
            stmts: stmts,
            preds: preds,
            succes: succes,
        });
    });
}

export function assertBlocksEqual(blocks: Set<BasicBlock>, expectBlocks: any[]): void {
    try {
        expect(blocks.size).toEqual(expectBlocks.length);
    } catch (e) {
        const stmts: string[] = [];
        for (const block of blocks) {
            for (const stmt of block.getStmts()) {
                stmts.push(stmt.toString());
            }
        }
        throw new Error(`size equal error: \\n ${stmts}`);
    }

    const blockMap = new Map<number, BasicBlock>();
    for (const block of blocks) {
        blockMap.set(block.getId(), block);
    }
    for (let i = 0; i < expectBlocks.length; i++) {
        const blockId = expectBlocks[i].id;
        const block = blockMap.get(blockId);
        if (!block) {
            assert.isDefined(block);
            return;
        }

        const stmts: string[] = [];
        const preds: number[] = [];
        const succes: number[] = [];
        try {
            for (const stmt of block.getStmts()) {
                stmts.push(stmt.toString());
            }
            expect(stmts).toEqual(expectBlocks[i].stmts);

            block.getPredecessors().forEach(predBlock => {
                preds.push(predBlock.getId());
            });
            expect(preds).toEqual(expectBlocks[i].preds);

            block.getSuccessors().forEach(succBlock => {
                succes.push(succBlock.getId());
            });
            expect(succes).toEqual(expectBlocks[i].succes);
        } catch (e) {
            throw new Error(`equal error: \n ${stmts} \n ${preds} \n ${succes} \n ${expectBlocks[i].stmts} \n ${expectBlocks[i].preds} \n ${expectBlocks[i].succes}`);
        }
    }
}

export function assertClassBlocksEqual(method: any, expectBlocks: any[]): void {
    const blocks: Set<BasicBlock> = method?.getCfg()?.getBlocks();
    if (!blocks) {
        assert.isDefined(blocks);
        return;
    }
    assertBlocksEqual(blocks, expectBlocks);
}

export function showClassBlocksEqual(method: any): void {
    const blocks: Set<BasicBlock> = method?.getCfg()?.getBlocks();
    if (!blocks) {
        assert.isDefined(blocks);
        return;
    }
    console.log('===============', method.getName(), '================');
    showCfgStmt(blocks);
}

export function assertStmtsEqual(stmts: Stmt[], expectStmts: any[], assertPos: boolean = true): void {
    expect(stmts.length).toEqual(expectStmts.length);
    for (let i = 0; i < stmts.length; i++) {
        expect(stmts[i].toString()).toEqual(expectStmts[i].text);
        assert.isDefined(stmts[i].getCfg());

        if (expectStmts[i].operandOriginalPositions === undefined) {
            continue;
        }
        if (!assertPos) {
            continue;
        }
        const operandOriginalPositions: any[] = [];
        for (const operand of stmts[i].getDefAndUses()) {
            const operandOriginalPosition = stmts[i].getOperandOriginalPosition(operand);
            if (operandOriginalPosition) {
                operandOriginalPositions.push([
                    operandOriginalPosition.getFirstLine(),
                    operandOriginalPosition.getFirstCol(),
                    operandOriginalPosition.getLastLine(),
                    operandOriginalPosition.getLastCol(),
                ]);
            } else {
                operandOriginalPositions.push(operandOriginalPosition);
            }
        }
        expect(operandOriginalPositions).toEqual(expectStmts[i].operandOriginalPositions);
    }
}

export function fullPosition2String(fullPosition: FullPosition): string {
    return `[[${fullPosition.getFirstLine()}, ${fullPosition.getFirstCol()}], [${fullPosition.getLastLine()}, ${fullPosition.getLastCol()}]]`;
}

export function fullPositionArray2String(fullPositions: FullPosition[]): string {
    let positions: string[] = [];
    fullPositions.forEach(position => positions.push(fullPosition2String(position)));
    return `[${positions.join(', ')}]`;
}
