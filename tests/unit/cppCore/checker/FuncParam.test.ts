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
import { SceneConfig } from '../../../../src';
import { Scene } from '../../../../src';
import { describe, it } from 'vitest';
import path from 'path';

import { ArkAssignStmt, ArkInvokeStmt, Stmt } from '../../../../src';
import { AbstractInvokeExpr } from '../../../../src';

describe('check func parm', () => {
    it('case1: check func parm', () => {
        const scene = buildScene('func');
        testBlocks(scene, 'Tests.cpp', 'main', []);
    });
});

const BASE_DIR = 'tests/resources_cpp/check';

function buildScene(folderName: string): Scene {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(BASE_DIR, folderName));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    return scene;
}

function getInvokeExprFromStmt(stmt: Stmt): AbstractInvokeExpr | null {
    if (stmt instanceof ArkInvokeStmt) {
        return stmt.getInvokeExpr();
    } else if (stmt instanceof ArkAssignStmt) {
        const rightOp = stmt.getRightOp();
        if (rightOp instanceof AbstractInvokeExpr) {
            return rightOp;
        }
    }
    return null;
}

function testBlocks(scene: Scene, filePath: string, methodName: string, expectBlocks: any[]): void {
    const arkfile = scene.getFiles().find(file => file.getName().endsWith(filePath));
    const arkMethod = arkfile
        ?.getDefaultClass()
        .getMethods()
        .find(method => method.getName() === methodName);
    const stmts = arkMethod?.getBody()?.getCfg().getStmts() ?? [];
    for (const stmt of stmts) {
        const invokeExpr = getInvokeExprFromStmt(stmt);
        if (!invokeExpr) {
            continue;
        }
        const methodSign = invokeExpr.getMethodSignature();
        const methodName = methodSign.getMethodSubSignature().getMethodName();
        const argsNum = invokeExpr.getArgs().length;
        if (methodName === 'SumFourNumber' && argsNum > 3) {
            console.log('Func', methodName, 'has', argsNum, 'args');
        }
    }
}
