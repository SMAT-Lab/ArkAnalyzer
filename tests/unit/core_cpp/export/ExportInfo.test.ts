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
import path from 'path';
import { ArkClass, FileSignature, Local, Scene, SceneConfig } from '../../../../src';
import { ArkExport, ExportInfo } from '../../../../src/core/model/ArkExport';
import { ArkBaseModel, ModifierType } from '../../../../src/core/model/ArkBaseModel';
import { CAST_SAMPLE_EXPORT_INFO_EXPECT_IR, MY_HEADER_EXPORT_INFO_EXPECT_IR } from '../../../resources_cpp/exports/indirectRef/include/expectedIR';
import { ArkMethod } from '../../../../src';

const BASE_DIR = 'tests/resources_cpp/exports';

function buildScene(folderName: string): Scene {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(BASE_DIR, folderName));
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();
    return projectScene;
}

function compareModifiers(arkModel: ArkBaseModel | ArkExport, expectedModifiers: any): void {
    if (expectedModifiers.includes('EXPORT')) {
        assert.isTrue(arkModel.containsModifier(ModifierType.EXPORT));
    } else {
        assert.isFalse(arkModel.containsModifier(ModifierType.EXPORT));
    }
    if (expectedModifiers.includes('DEFAULT')) {
        assert.isTrue(arkModel.containsModifier(ModifierType.DEFAULT));
    } else {
        assert.isFalse(arkModel.containsModifier(ModifierType.DEFAULT));
    }
}

function compareExportInfo(exportInfo: ExportInfo | undefined, expectIR: any): void {
    assert.isDefined(exportInfo);
    assert.equal(exportInfo!.isDefault(), expectIR._default);
    assert.equal(exportInfo!.getExportClauseType(), expectIR.exportClauseType);
    if (expectIR.modifiers !== undefined) {
        compareModifiers(exportInfo as ExportInfo, expectIR.modifiers);
    }

    const arkExport = exportInfo!.getArkExport();
    assert.isDefined(arkExport);
    assert.isNotNull(arkExport);
    assert.isTrue(arkExport instanceof expectIR.arkExport.type);
    if (expectIR.arkExport.type === ArkClass) {
        assert.equal((arkExport as ArkClass).getSignature().toString(), expectIR.arkExport.classSignature);
        if (expectIR.arkExport.modifiers !== undefined) {
            compareModifiers(arkExport as ArkExport, expectIR.arkExport.modifiers);
        }
    } else if (expectIR.arkExport.type === Local) {
        if (expectIR.arkExport.local.type === ArkClass) {
            assert.equal((arkExport as Local).getType().toString(), expectIR.arkExport.local.classSignature);
        }
    } else if (expectIR.arkExport.type === ArkMethod) {
        assert.equal((arkExport as ArkMethod).getDeclareSignatures()?.[0].toString(), expectIR.arkExport.methodSignature);
        if (expectIR.arkExport.modifiers !== undefined) {
            compareModifiers(arkExport as ArkExport, expectIR.arkExport.modifiers);
        }
    }
}

let projectScene = buildScene('');

describe('export Test', () => {
    it('function implement in header file case1', () => {
        const fileId1 = new FileSignature(projectScene.getProjectName(), 'funcImplementInHeaderFile/sameDir/main.cpp');
        const file1 = projectScene.getFile(fileId1);
        assert.equal(file1?.getExportInfos().length, 0);
        assert.equal(file1?.getImportInfos().length, 3);
        const stmts = file1?.getDefaultClass().getMethodWithName('main')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
        if (stmts) {
            assert.equal(
                stmts[1].getInvokeExpr()?.getMethodSignature().toString(),
                '@exports/funcImplementInHeaderFile/sameDir/myHeader.h: %dflt.FuncDoSomething(int, int)'
            );
        }

        const fileId2 = new FileSignature(projectScene.getProjectName(), 'funcImplementInHeaderFile/sameDir/myHeader.h');
        const file2 = projectScene.getFile(fileId2);
        assert.equal(file2?.getExportInfos().length, 1);
        assert.equal(file2?.getImportInfos().length, 0);
        const stmts2 = file2?.getDefaultClass().getMethodWithName('FuncDoSomething')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts2);
    });

    it('function implement in header file case2', () => {
        const fileId1 = new FileSignature(projectScene.getProjectName(), 'funcImplementInHeaderFile/diffDir/main.cpp');
        const file1 = projectScene.getFile(fileId1);
        assert.equal(file1?.getExportInfos().length, 0);
        assert.equal(file1?.getImportInfos().length, 3);
        const stmts = file1?.getDefaultClass().getMethodWithName('main')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
        if (stmts) {
            assert.equal(
                stmts[1].getInvokeExpr()?.getMethodSignature().toString(),
                '@exports/funcImplementInHeaderFile/diffDir/include/myHeader.h: %dflt.FuncDoSomething(int, int)'
            );
        }

        const fileId2 = new FileSignature(projectScene.getProjectName(), 'funcImplementInHeaderFile/diffDir/include/myHeader.h');
        const file2 = projectScene.getFile(fileId2);
        assert.equal(file2?.getExportInfos().length, 1);
        assert.equal(file2?.getImportInfos().length, 0);
        const stmts2 = file2?.getDefaultClass().getMethodWithName('FuncDoSomething')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts2);
    });

    it('function implement in cpp file case', () => {
        const fileId1 = new FileSignature(projectScene.getProjectName(), 'funcImplementInCpp/main.cpp');
        const file1 = projectScene.getFile(fileId1);
        assert.equal(file1?.getExportInfos().length, 0);
        assert.equal(file1?.getImportInfos().length, 6);
        const stmts = file1?.getDefaultClass().getMethodWithName('main')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
        if (stmts) {
            assert.equal(
                stmts[1].getInvokeExpr()?.getMethodSignature().toString(),
                '@exports/funcImplementInCpp/include/test.h: %dflt.FuncDoSomething(int, int)'
            );
            assert.equal(stmts[9].getDef()?.getType().toString(), '@exports/funcImplementInCpp/include/test.h: Circle');
            assert.equal(stmts[10].getInvokeExpr()?.getMethodSignature().toString(), '@exports/funcImplementInCpp/include/test.h: Circle.CalculateArea()');
            assert.equal(stmts[12].getInvokeExpr()?.getMethodSignature().toString(), '@exports/funcImplementInCpp/include/test.h: Circle.PrintInfo()');
            // assert.equal(stmts[6].getDef()?.getType().toString(), '@exports/funcImplementInCpp/include/test.h: Point');  // 当前表示为数组？
        }

        const fileId2 = new FileSignature(projectScene.getProjectName(), 'funcImplementInCpp/include/test.h');
        const file2 = projectScene.getFile(fileId2);
        assert.equal(file2?.getExportInfos().length, 4);
        assert.equal(file2?.getImportInfos().length, 0);
        const stmts2 = file2?.getDefaultClass().getMethodWithName('FuncDoSomething')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts2);

        const fileId3 = new FileSignature(projectScene.getProjectName(), 'funcImplementInCpp/src/test.cpp');
        const file3 = projectScene.getFile(fileId3);
        assert.equal(file3?.getExportInfos().length, 0);
        assert.equal(file3?.getImportInfos().length, 5);
        const stmts3 = file3?.getClassWithName('Circle')?.getMethodWithName('CalculateArea')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts3);
        assert.equal(stmts3![1].toString(), '%0 = this.<@exports/funcImplementInCpp/src/test.cpp: Circle.radius>');
    });

    it('Indirect referencing header file case', () => {
        const fileId1 = new FileSignature(projectScene.getProjectName(), 'indirectRef/main.cpp');
        const file1 = projectScene.getFile(fileId1);
        const stmts = file1?.getDefaultClass().getMethodWithName('main')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
        if (stmts) {
            assert.equal(stmts[1].getInvokeExpr()?.getMethodSignature().toString(), '@exports/indirectRef/include/myHeader.h: %dflt.FuncDoSomething(int, int)');
        }
        let importInfos = file1?.getImportInfos();
        assert.equal(importInfos!.length, 5);
        assert.equal(importInfos![0].getLazyExportInfo()?.getArkExport()?.getSignature().toString(), '@exports/indirectRef/include/myHeader.h: %dflt');
        assert.equal(importInfos![1].getLazyExportInfo()?.getArkExport()?.getSignature().toString(), '@exports/indirectRef/include/castSample.h: %dflt');
        assert.equal(
            importInfos![3].getLazyExportInfo()?.getArkExport()?.getSignature().toString(),
            '@exports/indirectRef/src/myHeader.cpp: %dflt.FuncDoSomething(int, int)'
        );
        assert.equal(
            importInfos![4].getLazyExportInfo()?.getArkExport()?.getSignature().toString(),
            '@exports/indirectRef/src/castSample.cpp: %dflt.CXXStaticCast(int)'
        );

        const fileId2 = new FileSignature(projectScene.getProjectName(), 'indirectRef/include/myHeader.h');
        const file2 = projectScene.getFile(fileId2);
        assert.equal(file2?.getExportInfos().length, 1);
        let exportInfo = file2?.getExportInfoBy(MY_HEADER_EXPORT_INFO_EXPECT_IR.exportClauseName);
        compareExportInfo(exportInfo, MY_HEADER_EXPORT_INFO_EXPECT_IR);
        importInfos = file2?.getImportInfos();
        assert.equal(file2?.getImportInfos().length, 2);
        assert.equal(importInfos![0].getLazyExportInfo()?.getArkExport()?.getSignature().toString(), '@exports/indirectRef/include/castSample.h: %dflt');
        assert.equal(
            importInfos![1].getLazyExportInfo()?.getArkExport()?.getSignature().toString(),
            '@exports/indirectRef/src/castSample.cpp: %dflt.CXXStaticCast(int)'
        );

        const fileId3 = new FileSignature(projectScene.getProjectName(), 'indirectRef/include/castSample.h');
        const file3 = projectScene.getFile(fileId3);
        assert.equal(file3?.getExportInfos().length, 1);
        assert.equal(file3?.getImportInfos().length, 0);
        exportInfo = file3?.getExportInfoBy(CAST_SAMPLE_EXPORT_INFO_EXPECT_IR.exportClauseName);
        compareExportInfo(exportInfo, CAST_SAMPLE_EXPORT_INFO_EXPECT_IR);
    });
});
