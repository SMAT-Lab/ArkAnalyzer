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
import { ArkClass, FileSignature, Local, Scene, SceneConfig, ArkNamespace, ArkAssignStmt, ArkMethod } from '../../../../src';
import { ArkExport, ExportInfo } from '../../../../src/core/model/ArkExport';
import { ArkBaseModel, ModifierType } from '../../../../src/core/model/ArkBaseModel';
import { CAST_SAMPLE_EXPORT_INFO_EXPECT_IR, MY_HEADER_EXPORT_INFO_EXPECT_IR } from '../../../resources_cpp/exports/indirectRef/expectedIR';
import {
    MAIN_CASE,
    MY_HEADER_EXPORT_INFO1,
    MY_HEADER_EXPORT_INFO2,
    MY_HEADER_EXPORT_INFO3,
    MY_HEADER_EXPORT_INFO4,
    NAMESPACE_EXPORT_INFO,
} from '../../../resources_cpp/exports/crossFileCase/expectedIR';
import { assertBlocksEqual } from '../../common';
import Logger, { LOG_MODULE_TYPE } from '../../../../src/utils/logger';
const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ExportInfoTest');

const BASE_DIR = 'tests/resources_cpp/exports';
const is_system_win32 = process.platform === 'win32';
const deveco_c = process.env.DEVECO_C !== undefined ? process.env.DEVECO_C : '';
const deveco_include = process.env.DEVECO_INCLUDE !== undefined ? process.env.DEVECO_INCLUDE : '';

function buildScene(folderName: string, includeDirs: string[]): Scene {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(BASE_DIR, folderName), includeDirs);
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
        if (expectIR.arkExport.classDeclareSignature) {
            assert.equal((arkExport as ArkClass).getDeclaringArkFile().toString(), expectIR.arkExport.classDeclareSignature);
        }
        if (expectIR.arkExport.modifiers !== undefined) {
            compareModifiers(arkExport as ArkExport, expectIR.arkExport.modifiers);
        }
    } else if (expectIR.arkExport.type === Local) {
        if (expectIR.arkExport.local.type === ArkClass) {
            assert.equal((arkExport as Local).getType().toString(), expectIR.arkExport.local.classSignature);
        }
    } else if (expectIR.arkExport.type === ArkMethod) {
        assert.equal((arkExport as ArkMethod).getDeclareSignatures()?.[0].toString(), expectIR.arkExport.methodDeclareSignature);
        assert.equal((arkExport as ArkMethod).getSignature().toString(), expectIR.arkExport.methodSignature);
        if (expectIR.arkExport.modifiers !== undefined) {
            compareModifiers(arkExport as ArkExport, expectIR.arkExport.modifiers);
        }
    } else if (expectIR.arkExport.type === ArkNamespace) {
        assert.equal((arkExport! as ArkNamespace).getSignature().toString(), expectIR.arkExport.namespaceSignature);
    }
}

describe('export Test', () => {
    it('function implement in header file case1', () => {
        const projectScene = buildScene('funcImplementInHeaderFile/sameDir', [deveco_c, deveco_include]);
        const fileId1 = new FileSignature(projectScene.getProjectName(), 'main.cpp');
        const file1 = projectScene.getFile(fileId1);
        assert.equal(file1?.getExportInfos().length, 0);
        logger.info('funcImplementInHeaderFile/sameDir/main.cpp')
        for (const im of file1!.getImportInfos()) {
            logger.info(im.getImportClauseName());
        }
        assert.equal(file1?.getImportInfos().length, 3);
        const stmts = file1?.getDefaultClass().getMethodWithName('main')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
        if (stmts) {
            assert.equal(
                stmts[1].getInvokeExpr()?.getMethodSignature().toString(),
                '@sameDir/myHeader.h: %dflt.FuncDoSomething(int, int)'
            );
        }

        const fileId2 = new FileSignature(projectScene.getProjectName(), 'myHeader.h');
        const file2 = projectScene.getFile(fileId2);
        assert.equal(file2?.getExportInfos().length, 1);
        assert.equal(file2?.getImportInfos().length, 0);
        const stmts2 = file2?.getDefaultClass().getMethodWithName('FuncDoSomething')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts2);
    });

    it('function implement in header file case2', () => {
        const projectScene = buildScene('funcImplementInHeaderFile/diffDir', [deveco_c, deveco_include]);
        const fileId1 = new FileSignature(projectScene.getProjectName(), 'main.cpp');
        const file1 = projectScene.getFile(fileId1);
        assert.equal(file1?.getExportInfos().length, 0);
        assert.equal(file1?.getImportInfos().length, 3);
        const stmts = file1?.getDefaultClass().getMethodWithName('main')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
        if (stmts) {
            assert.equal(
                stmts[1].getInvokeExpr()?.getMethodSignature().toString(),
                '@diffDir/include/myHeader.h: %dflt.FuncDoSomething(int, int)'
            );
        }

        const fileId2 = new FileSignature(projectScene.getProjectName(), 'include/myHeader.h');
        const file2 = projectScene.getFile(fileId2);
        assert.equal(file2?.getExportInfos().length, 1);
        assert.equal(file2?.getImportInfos().length, 0);
        const stmts2 = file2?.getDefaultClass().getMethodWithName('FuncDoSomething')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts2);
    });

    it('function implement in cpp file case', () => {
        const projectScene = buildScene('funcImplementInCpp', [deveco_c, deveco_include]);
        const fileId1 = new FileSignature(projectScene.getProjectName(), 'main.cpp');
        const file1 = projectScene.getFile(fileId1);
        assert.equal(file1?.getExportInfos().length, 0);
        assert.equal(file1?.getImportInfos().length, 6);
        const stmts = file1?.getDefaultClass().getMethodWithName('main')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
        if (stmts && is_system_win32) {
            assert.equal(
                stmts[1].getInvokeExpr()?.getMethodSignature().toString(),
                '@funcImplementInCpp/include/test.h: %dflt.FuncDoSomething(int, int)'
            );
            assert.equal(stmts[9].getDef()?.getType().toString(), '@funcImplementInCpp/include/test.h: Circle');
            assert.equal(stmts[10].getInvokeExpr()?.getMethodSignature().toString(), '@funcImplementInCpp/include/test.h: Circle.CalculateArea()');
            assert.equal(stmts[12].getInvokeExpr()?.getMethodSignature().toString(), '@funcImplementInCpp/include/test.h: Circle.PrintInfo()');
        }

        const fileId2 = new FileSignature(projectScene.getProjectName(), 'include/test.h');
        const file2 = projectScene.getFile(fileId2);
        assert.equal(file2?.getExportInfos().length, 4);
        assert.equal(file2?.getImportInfos().length, 0);
        const stmts2 = file2?.getDefaultClass().getMethodWithName('FuncDoSomething')?.getCfg()?.getStmts();
        assert.isUndefined(stmts2);

        const fileId3 = new FileSignature(projectScene.getProjectName(), 'src/test.cpp');
        const file3 = projectScene.getFile(fileId3);
        assert.equal(file3?.getExportInfos().length, 0);
        assert.equal(file3?.getImportInfos().length, 0);
        const stmts3 = file3?.getClassWithName('Circle')?.getMethodWithName('CalculateArea')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts3);
        assert.equal(stmts3![1].toString(), '%0 = this.<@funcImplementInCpp/src/test.cpp: Circle.radius>');
    });

    it('Indirect referencing header file case', () => {
        const customizedIncludePath = path.join(path.resolve(__dirname, '../../..'), 'resources_cpp/exports/indirectRef/include');
        const projectScene = buildScene('indirectRef', [deveco_c, deveco_include, customizedIncludePath]);
        const fileId1 = new FileSignature(projectScene.getProjectName(), 'main.cpp');
        const file1 = projectScene.getFile(fileId1);
        const stmts = file1?.getDefaultClass().getMethodWithName('main')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
        if (stmts) {
            assert.equal(stmts[1].getInvokeExpr()?.getMethodSignature().toString(), '@indirectRef/include/myHeader.h: %dflt.FuncDoSomething(int, int)');
        }
        let importInfos = file1?.getImportInfos();
        assert.equal(importInfos!.length, 5);
        assert.equal(importInfos![0].getLazyExportInfo()?.getArkExport()?.getSignature().toString(), '@indirectRef/include/myHeader.h: %dflt');
        assert.equal(importInfos![3].getLazyExportInfo()?.getArkExport()?.getSignature().toString(), '@indirectRef/include/castSample.h: %dflt');
        let invokeMethod = importInfos![4].getLazyExportInfo()?.getArkExport();
        assert.isNotEmpty(invokeMethod);
        assert.isTrue(invokeMethod instanceof ArkMethod);
        assert.equal(
            (invokeMethod as ArkMethod).getSignature().toString(),
            '@indirectRef/src/castSample.cpp: %dflt.CXXStaticCast(int)'
        );
        assert.equal(
            (invokeMethod as ArkMethod).getDeclareSignatures()?.[0].toString(),
            '@indirectRef/include/castSample.h: %dflt.CXXStaticCast(int)'
        );

        const fileId2 = new FileSignature(projectScene.getProjectName(), 'include/myHeader.h');
        const file2 = projectScene.getFile(fileId2);
        assert.equal(file2?.getExportInfos().length, 1);
        let exportInfo = file2?.getExportInfoBy(MY_HEADER_EXPORT_INFO_EXPECT_IR.exportClauseName);
        compareExportInfo(exportInfo, MY_HEADER_EXPORT_INFO_EXPECT_IR);
        importInfos = file2?.getImportInfos();
        assert.equal(file2?.getImportInfos().length, 2);
        assert.equal(importInfos![0].getLazyExportInfo()?.getArkExport()?.getSignature().toString(), '@indirectRef/include/castSample.h: %dflt');
        invokeMethod = importInfos![1].getLazyExportInfo()?.getArkExport();
        assert.isNotEmpty(invokeMethod);
        assert.isTrue(invokeMethod instanceof ArkMethod);
        assert.equal(
            (invokeMethod as ArkMethod).getSignature().toString(),
            '@indirectRef/src/castSample.cpp: %dflt.CXXStaticCast(int)'
        );
        assert.equal(
            (invokeMethod as ArkMethod).getDeclareSignatures()?.[0].toString(),
            '@indirectRef/include/castSample.h: %dflt.CXXStaticCast(int)'
        );

        const fileId3 = new FileSignature(projectScene.getProjectName(), 'include/castSample.h');
        const file3 = projectScene.getFile(fileId3);
        assert.equal(file3?.getExportInfos().length, 1);
        assert.equal(file3?.getImportInfos().length, 0);
        exportInfo = file3?.getExportInfoBy(CAST_SAMPLE_EXPORT_INFO_EXPECT_IR.exportClauseName);
        compareExportInfo(exportInfo, CAST_SAMPLE_EXPORT_INFO_EXPECT_IR);
    });
});

describe('cross file case', () => {
    const customizedIncludePath = path.join(path.resolve(__dirname, '../../..'), 'resources_cpp/exports/crossFileCase/include');
    const projectScene = buildScene('crossFileCase', [deveco_c, deveco_include, customizedIncludePath]);

    it('cross file case1', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'include/myHeader.h');
        const file = projectScene.getFile(fileId);
        assert.equal(file?.getExportInfos().length, 4);
        let exportInfo: ExportInfo | undefined;
        exportInfo = file?.getExportInfoBy(MY_HEADER_EXPORT_INFO1.exportClauseName);
        compareExportInfo(exportInfo, MY_HEADER_EXPORT_INFO1);
        exportInfo = file?.getExportInfoBy(MY_HEADER_EXPORT_INFO2.exportClauseName);
        compareExportInfo(exportInfo, MY_HEADER_EXPORT_INFO2);
        exportInfo = file?.getExportInfoBy(MY_HEADER_EXPORT_INFO3.exportClauseName);
        assert.isNotEmpty(exportInfo);
        compareExportInfo(exportInfo, MY_HEADER_EXPORT_INFO3);
        assert.equal(
            (exportInfo?.getArkExport() as ArkClass).getFieldWithName('center')?.getType().toString(),
            '@crossFileCase/include/namespace.h: nsA.Point'
        );
        assert.equal(
            (exportInfo?.getArkExport() as ArkClass).getMethodWithName('CalculateArea')?.getSignature().toString(),
            '@crossFileCase/src/myHeader.cpp: Circle.CalculateArea()'
        );
        exportInfo = file?.getExportInfoBy(MY_HEADER_EXPORT_INFO4.exportClauseName);
        compareExportInfo(exportInfo, MY_HEADER_EXPORT_INFO4);
    });

    it('cross file case2', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'src/myHeader.cpp');
        const file = projectScene.getFile(fileId);
        assert.equal(file?.getImportInfos().length, 6);
        assert.equal(
            file?.getDefaultClass().getMethodWithName('FuncDoSomething')?.getDeclareSignatures()?.[0].toString(),
            '@crossFileCase/include/myHeader.h: %dflt.FuncDoSomething(int, int)'
        );
        assert.equal(
            file?.getClassWithName('Circle')?.getDeclareSignature()?.toString(),
            '@crossFileCase/include/myHeader.h: Circle'
        );
        const stmts = file?.getClassWithName('Circle')?.getMethodWithName('PrintInfo')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
        assert.equal(stmts![1].toString(), '%0 = this.<@crossFileCase/include/myHeader.h: Circle.center>');
        assert.equal(stmts![2].toString(), '%1 = %0.<@crossFileCase/include/namespace.h: nsA.Point.x>');
        assert.equal(stmts![3].toString(), '%2 = this.<@crossFileCase/include/myHeader.h: Circle.center>');
        assert.equal(stmts![4].toString(), '%3 = %2.<@crossFileCase/include/namespace.h: nsA.Point.y>');
    });

    it('cross file case3', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'include/namespace.h');
        const file = projectScene.getFile(fileId);
        assert.equal(file?.getExportInfos().length, 1);
        let exportInfo: ExportInfo | undefined;
        exportInfo = file?.getExportInfoBy(NAMESPACE_EXPORT_INFO.exportClauseName);
        compareExportInfo(exportInfo, NAMESPACE_EXPORT_INFO);
    });

    it('cross file case4', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'src/namespace.cpp');
        const file = projectScene.getFile(fileId);
        assert.equal(file?.getImportInfos().length, 3);
        assert.equal(
            file?.getNamespaceWithName('nsA')?.getDefaultClass().getMethodWithName('FuncInNamespace')?.
            getDeclareSignatures()?.[0].toString(),
            '@crossFileCase/include/namespace.h: nsA.%dflt.FuncInNamespace()'
        );
        assert.equal(
            file?.getNamespaceWithName('nsA')?.getClassWithName('DefaultClass')?.getDeclareSignature()?.toString(),
            '@crossFileCase/include/namespace.h: nsA.DefaultClass'
        );
        const defaultClass = file?.getNamespaceWithName('nsA')?.getClassWithName('DefaultClass');
        const stmts = defaultClass?.getMethodWithName('constructor')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
        assert.equal((stmts![3] as ArkAssignStmt)!.getLeftOp().getType().toString(), 'char');
        assert.equal((stmts![4] as ArkAssignStmt)!.getLeftOp().getType().toString(), 'int');
    });

    it('cross file case5', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'main.cpp');
        const file = projectScene.getFile(fileId);
        assert.equal(file?.getImportInfos().length, 6);
        const blocks = file?.getDefaultClass().getMethodWithName('main')?.getCfg()?.getBlocks();
        assert.isDefined(blocks);
        assertBlocksEqual(blocks!, MAIN_CASE.blocks);
    });

});
