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

import { assert, describe, expect, it } from 'vitest';
import path from 'path';
import {
    AliasClassSignature,
    ArkClass, ArkMethod,
    ClassType,
    FileSignature,
    GlobalRef,
    Local,
    Scene,
    SceneConfig,
    THIS_NAME
} from '../../src';
import { ArkExport, ExportInfo } from '../../src/core/model/ArkExport';
import { ArkBaseModel, ModifierType } from '../../src/core/model/ArkBaseModel';
import {
    DefaultExportClassInstanceWithLetIndependent_Expect_IR,
    DefaultExportClassInstanceWithNew_Expect_IR,
    DefaultExportClassInstanceWithNewIndependent_Expect_IR,
    DefaultExportClassWithDeclaring_Expect_IR,
    DefaultSingleExportClass_Expect_IR,
    ExportClass_Expect_IR,
    ExportClassInstanceWithLet_Expect_IR,
    ExportClassWithAs_Expect_IR,
    ExportClassWithDeclaring_Expect_IR
} from '../resources/exports/class/expectedIR';
import {
    ExportAllFromOtherFile_Expect_IR,
    ExportAllFromThisFile_Expect_IR,
    ExportAllWithAsNameFromOtherFile_Expect_IR,
    ExportAllWithAsNameFromThisFile_Expect_IR,
} from '../resources/exports/from/expectedIR';
import { DefaultExportObjectLiteral_Expect_IR } from '../resources/exports/objectLiteral/expectedIR';

function buildScene(): Scene {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../resources/Sdk') });
    config.getSdksObj().push({
        moduleName: '',
        name: 'lottie',
        path: path.join(__dirname, '../resources/lottieModule'),
    });
    config.buildFromProjectDir(path.join(__dirname, '../resources/exports'));
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();
    return projectScene;
}

let projectScene = buildScene();

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
    assert.equal(exportInfo!.getNameBeforeAs(), expectIR.nameBeforeAs);
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
    }
}

describe("export Test", () => {

    it('debug case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'test.ts');
        const file = projectScene.getFile(fileId);
        assert.equal(file?.getExportInfos().length, 2);
        assert.equal(file?.getImportInfos().length, 5);
        const stmts = file?.getDefaultClass().getMethodWithName('cc')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
    })

    it('namespace export case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'test.ts');
        const file = projectScene.getFile(fileId);
        const stmts = file?.getDefaultClass().getMethodWithName('cc')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
        if (stmts) {
            assert.equal(stmts[10].toString(), 'staticinvoke <@exports/exportSample.ts: %dflt.write()>()');
            assert.equal(stmts[2].toString(), '%0 = @exports/exportSample.ts: %dflt.[static]z');
            assert.equal(stmts[9].toString(), '%2 = @exports/exportSample.ts: %dflt.[static]MyNameSpace');
        }
    })

    it('supperClass Test case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'exportSample.ts');
        assert.isDefined(projectScene.getFile(fileId)?.getClassWithName('d')?.getSuperClass());
    })

    it('import index case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'exportSample.ts');
        assert.isNotNull(projectScene.getFile(fileId)?.getImportInfoBy('Constants')?.getLazyExportInfo());

        const importInfos = projectScene.getFile(fileId)?.getImportInfos();
        assert.isDefined(importInfos);
        assert.equal(importInfos!.length, 4);
        expect([importInfos![0].getOriginTsPosition().getLineNo(), importInfos![0].getOriginTsPosition().getColNo()]).toEqual([16, 10]);
        expect([importInfos![1].getOriginTsPosition().getLineNo(), importInfos![1].getOriginTsPosition().getColNo()]).toEqual([17, 8]);
        expect([importInfos![2].getOriginTsPosition().getLineNo(), importInfos![2].getOriginTsPosition().getColNo()]).toEqual([17, 15]);
        expect([importInfos![3].getOriginTsPosition().getLineNo(), importInfos![3].getOriginTsPosition().getColNo()]).toEqual([18, 10]);

        assert.equal(importInfos![0].getLazyExportInfo()?.getArkExport()?.getSignature().toString(), '@exports/test.ts: %dflt.cc()');
        assert.equal(importInfos![1].getLazyExportInfo()?.getArkExport()?.getSignature().toString(), '@exports/else.ts: dfs');
        assert.equal(importInfos![2].getLazyExportInfo()?.getArkExport()?.getSignature().toString(), '@exports/else.ts: %dflt.something()');
        assert.equal(importInfos![3].getLazyExportInfo()?.getArkExport()?.getSignature().toString(), '@exports/else.ts: dfs');

        const testFileId = new FileSignature(projectScene.getProjectName(), 'test.ts');
        const testImportInfos = projectScene.getFile(testFileId)?.getImportInfos();
        assert.isDefined(testImportInfos);
        assert.equal(testImportInfos!.length, 5);
        expect([testImportInfos![0].getOriginTsPosition().getLineNo(), testImportInfos![0].getOriginTsPosition().getColNo()]).toEqual([16, 13]);
        expect([testImportInfos![1].getOriginTsPosition().getLineNo(), testImportInfos![1].getOriginTsPosition().getColNo()]).toEqual([17, 8]);
        expect([testImportInfos![2].getOriginTsPosition().getLineNo(), testImportInfos![2].getOriginTsPosition().getColNo()]).toEqual([18, 8]);
        expect([testImportInfos![3].getOriginTsPosition().getLineNo(), testImportInfos![3].getOriginTsPosition().getColNo()]).toEqual([19, 8]);

        assert.equal(testImportInfos![0].getLazyExportInfo()?.getArkExport()?.getSignature().toString(), '@exports/exportSample.ts: %dflt');
        assert.equal(testImportInfos![1].getLazyExportInfo()?.getArkExport()?.getSignature().toString(), '@etsSdk/api/@ohos.hilog.d.ts: hilog');
        assert.equal(testImportInfos![2].getLazyExportInfo()?.getArkExport()?.getSignature().toString(), '@etsSdk/api/@ohos.base.d.ts: %dflt');
        assert.equal(testImportInfos![3].getLazyExportInfo(), null);
    })

    it('export local case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'test.ts');
        const file = projectScene.getFile(fileId);
        const ref = file?.getDefaultClass()?.getDefaultArkMethod()?.getBody()?.getUsedGlobals()?.get('arr');
        assert.isTrue(ref instanceof GlobalRef);
        const exportLocal = (ref as GlobalRef).getRef();
        if (exportLocal instanceof Local) {
            assert.equal(exportLocal.getSignature().toString(), '@exports/exportSample.ts: %dflt.[static]%dflt()#arr');
        }
    })

    it('sdk case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'test.ts');
        assert.isDefined(projectScene.getFile(fileId)?.getImportInfoBy('hilog')?.getLazyExportInfo());
    })

    it('namespace case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'else.ts');
        const stmts = projectScene.getFile(fileId)?.getDefaultClass()
            .getMethodWithName('something')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
        if (stmts) {
            assert.equal(stmts[2].toString(), 'staticinvoke <@etsSdk/api/@ohos.web.webview.d.ts: webview.WebviewController.[static]setWebDebuggingAccess(boolean)>(false)');
            assert.equal(stmts[6].toString(), 'instanceinvoke controller.<@etsSdk/api/@ohos.web.webview.d.ts: webview.WebviewController.loadUrl(string|Resource, @etsSdk/api/@ohos.web.webview.d.ts: webview.WebHeader[])>(\'\')')
            assert.equal(stmts[7].toString(), 'staticinvoke <@etsSdk/api/@ohos.hilog.d.ts: hilog.%dflt.info(number, string, string, any[])>(0x0000, \'func\', \'%{public}\', \'Ability onCreate\')')
        }
    })

    it('thirdModule case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'Lottie_Report.ets');
        const arkExport = projectScene.getFile(fileId)?.getImportInfoBy('lottie')
            ?.getLazyExportInfo()?.getArkExport();
        assert.isTrue(arkExport instanceof Local);
    });

    it('get class case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'Lottie_Report.ets');
        const stmt = projectScene.getFile(fileId)?.getClassWithName('BlurEffectsExample')
            ?.getMethodWithName('build')?.getCfg()?.getStmts()[5];
        assert.isDefined(stmt);
        const classSignature = stmt?.getInvokeExpr()?.getMethodSignature().getDeclaringClassSignature();
        assert.isTrue(classSignature instanceof AliasClassSignature);
        if (classSignature) {
            assert.isNotNull(projectScene.getClass(classSignature));
        }

    });

    it('all case', () => {
        let unknownCount = 0;
        projectScene.getMethods().forEach(m => {
            m.getCfg()?.getStmts().forEach(s => {
                const text = s.toString();
                if (text.includes('Unknown')) {
                    unknownCount++;
                    console.debug(text + ' warning ' + m.getSignature().toString());
                }
            })
        })
        expect(unknownCount).lessThanOrEqual(9);
    })

    it('file case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'test.ts');
        const file = projectScene.getFile(fileId);
        const stmts = file?.getClassWithName('test')?.getMethodWithName('type')?.getCfg()?.getStmts();
        assert.isNotEmpty(stmts);
        if (stmts) {
            assert.equal(stmts[3].toString(), 'be = @etsSdk/api/@ohos.base.d.ts: %dflt.[static]BusinessError');
        }
    })

    it('extend function case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'Lottie_Report.ets');
        const stmt = projectScene.getFile(fileId)?.getClassWithName('BlurEffectsExample')
            ?.getMethodWithName('build')?.getCfg()?.getStmts()[37];
        assert.isDefined(stmt);
        const classType = stmt?.getInvokeExpr()?.getType();
        assert.isTrue(classType instanceof ClassType);
        if (classType instanceof ClassType) {
            assert.equal(classType.getClassSignature().getClassName(), 'TextAttribute');
        }
    });

    it('Array map case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'Lottie_Report.ets');
        const stmt = projectScene.getFile(fileId)?.getDefaultClass()
            ?.getMethodWithName('testArrayMap')?.getCfg()?.getStmts()[5];
        assert.isDefined(stmt);
        const arrayType = stmt?.getInvokeExpr()?.getType();
        assert.equal(arrayType?.getTypeString(), 'string[]');
    });

    it('this case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'Lottie_Report.ets');
        const type = projectScene.getFile(fileId)?.getClassWithName('%AC4$MyComponent.build')
            ?.getMethodWithName('%instInit')?.getBody()?.getUsedGlobals()?.get(THIS_NAME)?.getType();
        assert.equal(type?.getTypeString(), '@exports/Lottie_Report.ets: MyComponent');

        const type2 = projectScene.getFile(fileId)?.getClassWithName('MyComponent')
            ?.getMethodWithName('%AM0$func1')?.getBody()?.getLocals().get(THIS_NAME)?.getType();
        assert.equal(type2?.getTypeString(), '@exports/Lottie_Report.ets: MyComponent');
    });

    it('setTimeout case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'Lottie_Report.ets');
        const stmts = projectScene.getFile(fileId)?.getClassWithName('Foo')?.getMethodWithName('func')?.getCfg()?.getStmts();
        const stmt = stmts?.[stmts?.length - 2];
        assert.isDefined(stmt);
        assert.equal(stmt?.getInvokeExpr()?.getArgs()[0].getType().getTypeString(), '@exports/Lottie_Report.ets: %AC2$%AC1$Foo.%instInit.%instInit.%AM0$%instInit()');
    });

    it('export local case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'exportSample.ts');
        const file = projectScene.getFile(fileId);
        assert.equal((file?.getExportInfoBy('a')?.getArkExport() as Local).getSignature().toString(), '@exports/exportSample.ts: %dflt.[static]%dflt()#a');
        assert.equal((file?.getExportInfoBy('c')?.getArkExport() as Local).getSignature().toString(), '@exports/exportSample.ts: %dflt.[static]%dflt()#c');
    })

    it('local Type case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'else.ts');
        const locals = projectScene.getFile(fileId)?.getDefaultClass()
            .getDefaultArkMethod()?.getBody()?.getLocals();
        assert.isNotEmpty(locals);
        if (locals) {
            assert.equal(locals.get('a1')?.getType().getTypeString(), '@built-in/lib.es2015.collection.d.ts: Set<string>');
            assert.equal(locals.get('a2')?.getType().getTypeString(), '@built-in/lib.es2015.collection.d.ts: Map<string,string>')
            assert.equal(locals.get('a3')?.getType().getTypeString(), '@built-in/lib.es2015.collection.d.ts: Set<string[]>')
            assert.equal(locals.get('a4')?.getType().getTypeString(), '@built-in/lib.es2015.collection.d.ts: Set<@built-in/lib.es2015.collection.d.ts: Set<@built-in/lib.es2015.collection.d.ts: Set<string>>>')
            assert.equal(locals.get('%1')?.getType().getTypeString(), '@built-in/lib.es2015.collection.d.ts: Set<any>');
            assert.equal(locals.get('%2')?.getType().getTypeString(), '@built-in/lib.es2015.collection.d.ts: Map<any,string>')
            assert.equal(locals.get('%3')?.getType().getTypeString(), '@built-in/lib.es2015.collection.d.ts: Set<any[]>')
            assert.equal(locals.get('%4')?.getType().getTypeString(), '@built-in/lib.es2015.collection.d.ts: Set<@built-in/lib.es2015.collection.d.ts: Set<@built-in/lib.es2015.collection.d.ts: Set<any>>>')

        }
    })
})

describe("function Test", () => {
    it('thirdModule index case', () => {
        let config: SceneConfig = new SceneConfig();
        config.getSdksObj().push({ moduleName: "", name: "etsSdk", path: path.join(__dirname, "../resources/Sdk") })
        config.getSdksObj().push({
            moduleName: "",
            name: "lottie",
            path: path.join(__dirname, "../resources/lottieModule")
        });
        config.buildFromProjectDir(path.join(__dirname, "../resources/exports"));
        let scene: Scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
        const fileId = new FileSignature(scene.getProjectName(), 'Lottie_Report.ets');
        const signature = scene.getFile(fileId)?.getImportInfoBy('lottie')?.getLazyExportInfo()
            ?.getArkExport()?.toString();
        assert.equal(signature, 'Lottie')
    })
})

describe("export Class Test", () => {
    it('default export class when declaring class', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'class/exportClassNormal.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(DefaultExportClassWithDeclaring_Expect_IR.exportClauseName);
        compareExportInfo(exportInfo, DefaultExportClassWithDeclaring_Expect_IR);
    });

    it('export class independently from class declaration', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'class/exportClassNormal.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(ExportClass_Expect_IR.exportClauseName);
        compareExportInfo(exportInfo, ExportClass_Expect_IR);
    });

    it('export class independently from class declaration by renaming', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'class/exportClassNormal.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(ExportClassWithAs_Expect_IR.exportClauseName);
        compareExportInfo(exportInfo, ExportClassWithAs_Expect_IR);
    });

    it('export class when declaring class', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'class/exportClassNormal.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(ExportClassWithDeclaring_Expect_IR.exportClauseName);
        compareExportInfo(exportInfo, ExportClassWithDeclaring_Expect_IR);
    });

    it('single export class independently from class declaration', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'class/singleExportClass.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(DefaultSingleExportClass_Expect_IR.exportClauseName);
        compareExportInfo(exportInfo, DefaultSingleExportClass_Expect_IR);
    });

    it('default export class instance with new independently', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'class/exportClassInstanceWithNewIndependent.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(DefaultExportClassInstanceWithNewIndependent_Expect_IR.exportClauseName);
        compareExportInfo(exportInfo, DefaultExportClassInstanceWithNewIndependent_Expect_IR);
    });

    it('default export class instance with new', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'class/exportClassInstanceWithNew.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(DefaultExportClassInstanceWithNew_Expect_IR.exportClauseName);
        compareExportInfo(exportInfo, DefaultExportClassInstanceWithNew_Expect_IR);
    });

    it('default export class instance with independent let', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'class/exportClassInstanceWithLet.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(DefaultExportClassInstanceWithLetIndependent_Expect_IR.exportClauseName);
        compareExportInfo(exportInfo, DefaultExportClassInstanceWithLetIndependent_Expect_IR);
    });

    it('export class instance with let', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'class/exportClassInstanceWithLet.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(ExportClassInstanceWithLet_Expect_IR.exportClauseName);
        compareExportInfo(exportInfo, ExportClassInstanceWithLet_Expect_IR);
    });
})

describe("export ObjectLiteral Test", () => {
    it('default export ObjectLiteral', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'objectLiteral/exportObjectLiteral.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(DefaultExportObjectLiteral_Expect_IR.exportClauseName);
        compareExportInfo(exportInfo, DefaultExportObjectLiteral_Expect_IR);

        const anonymousClass = file?.getClassWithName('%AC0$%dflt.%dflt');
        assert.isDefined(anonymousClass);
        assert.isNotNull(anonymousClass);
        assert.isTrue((anonymousClass as ArkClass).getFields().some(field => field.getName() === 'data'));
        assert.isTrue((anonymousClass as ArkClass).getMethods().some(m => m.getName() === 'onCreate'));
        assert.isTrue((anonymousClass as ArkClass).getMethods().some(m => m.getName() === 'onDestroy'));
    });
})

describe("export From Test", () => {
    it('export all from this file', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'from/exportAllFromThisFile.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(ExportAllFromThisFile_Expect_IR.exportClauseName);
        compareExportInfo(exportInfo, ExportAllFromThisFile_Expect_IR);
    });

    it('export all with as name from this file', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'from/exportAllFromThisFile.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(ExportAllWithAsNameFromThisFile_Expect_IR.exportClauseName);
        compareExportInfo(exportInfo, ExportAllWithAsNameFromThisFile_Expect_IR);
    });

    it('export all from other file', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'from/exportAllFromOtherFile.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(ExportAllFromOtherFile_Expect_IR.exportClauseName);
        assert.isUndefined(exportInfo);
    });

    it('export all with as name from other file', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'from/exportAllFromOtherFile.ts');
        const file = projectScene.getFile(fileId);
        const exportInfo = file?.getExportInfoBy(ExportAllWithAsNameFromOtherFile_Expect_IR.exportClauseName);
        compareExportInfo(exportInfo, ExportAllWithAsNameFromOtherFile_Expect_IR);
    });

    it('use export all', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'from/usedExport.ts');
        const file = projectScene.getFile(fileId);
        const some = file?.getImportInfoBy('some')?.getExportInfo()?.getArkExport();
        assert.isTrue(some instanceof ArkMethod);
        const mathUtils = file?.getImportInfoBy('MathUtils')?.getExportInfo()?.getArkExport();
        assert.isTrue(mathUtils instanceof ArkClass);
    });
})