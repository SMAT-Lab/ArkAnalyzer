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
import {
    AliasType,
    ArkAssignStmt, ArkClass,
    ArkInstanceFieldRef,
    ArkInvokeStmt,
    ArkNamespace,
    ArkNewArrayExpr,
    ArkStaticFieldRef,
    ArrayType,
    ClassType,
    DEFAULT_ARK_CLASS_NAME,
    DEFAULT_ARK_METHOD_NAME,
    FileSignature,
    NumberType,
    Scene,
    SceneConfig,
    StringType
} from '../../src';
import Logger, { LOG_LEVEL, LOG_MODULE_TYPE } from '../../src/utils/logger';

const logPath = 'out/ArkAnalyzer.log';
const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'InferArrayTest');
Logger.configure(logPath, LOG_LEVEL.DEBUG, LOG_LEVEL.DEBUG);

describe("Infer Array Test", () => {

    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, "../resources/inferType"));
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();

    it('normal case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass().getMethodWithName('test_new_array');
        assert.isDefined(method);
        const stmt = method?.getCfg()?.getStmts()[2];
        assert.isTrue(stmt instanceof ArkAssignStmt);
        assert.isTrue((stmt as ArkAssignStmt).getRightOp() instanceof ArkNewArrayExpr);
        assert.isTrue((stmt as ArkAssignStmt).getRightOp().getType() instanceof ArrayType);
        assert.isTrue((stmt as ArkAssignStmt).getLeftOp().getType() instanceof ArrayType);
    })

    it('array case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass().getMethodWithName('testArray');
        const stmt = method?.getCfg()?.getStmts()[2];
        assert.isTrue(stmt instanceof ArkAssignStmt);
        const type = (stmt as ArkAssignStmt).getLeftOp().getType();
        assert.isTrue(type instanceof ArrayType);
        assert.isTrue((type as ArrayType).getBaseType() instanceof NumberType);
    })

    it('array Expr case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass().getMethodWithName('arrayExpr');
        const stmts = method?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[1].toString(), '%0 = newarray (number)[0]');
            assert.equal(stmts[2].toString(), '%1 = newarray (string)[0]');
            assert.equal(stmts[3].toString(), '%2 = newarray (@inferType/inferSample.ts: Sample)[0]');
            assert.equal(stmts[4].toString(), '%3 = newarray (string|@inferType/inferSample.ts: Sample)[2]');
            assert.equal(stmts[5].toString(), '%4 = newarray (any)[0]');
        }
    })

    it('array Literal case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass().getMethodWithName('arrayLiteral');
        const stmts = method?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[1].toString(), '%0 = newarray (number)[3]');
            assert.equal(stmts[6].toString(), '%1 = newarray (string)[2]');
            assert.equal(stmts[12].toString(), '%3 = newarray (@inferType/inferSample.ts: Sample)[1]');
            assert.equal(stmts[15].toString(), '%4 = newarray (number|string)[2]');
            assert.equal(stmts[19].toString(), '%5 = newarray (any)[0]');
            assert.equal(stmts[23].toString(), '%7 = newarray (number|string|@inferType/inferSample.ts: Sample)[3]');
        }
    })

    it('fieldRef to ArrayRef case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass().getMethodWithName('test_new_array');
        const stmts = method?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[10].toString(), 'c = %2[%3]');
            assert.equal(stmts[12].toString(), 's = %4[a]');
            assert.equal(stmts[14].toString(), 'n = %5[3]');
        }
    })

    it('global ref case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass().getMethodWithName('test1');
        const type = method?.getBody()?.getUsedGlobals()?.get('out')?.getType();
        assert.isTrue(type instanceof NumberType);

    })

    it('demo case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'demo.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getClassWithName('StaticUserB')?.getMethodWithName('f1');
        const stmt = method?.getCfg()?.getStmts()[1];
        assert.isDefined(stmt);
        assert.isTrue((stmt as ArkAssignStmt).getLeftOp().getType() instanceof NumberType);
        assert.isTrue((stmt as ArkAssignStmt).getRightOp() instanceof ArkStaticFieldRef);
    })

    it('embed namespace case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'demo.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass()?.getMethodWithName('testDoubleNamespace');
        const stmts = method?.getCfg()?.getStmts();
        const stmt = stmts?.[stmts?.length - 2];
        assert.isDefined(stmt);
        assert.equal(stmt!.toString(), 'staticinvoke <@inferType/demo.ts: outer.inner.TestClass.[static]request()>()');
    })

    it('field case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'Field.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getClassWithName('C2')?.getMethodWithName('f2');
        const stmt = method?.getCfg()?.getStmts()[2];
        assert.isDefined(stmt);
        assert.isTrue((stmt as ArkAssignStmt).getLeftOp().getType() instanceof ClassType);
        assert.isTrue((stmt as ArkAssignStmt).getRightOp() instanceof ArkInstanceFieldRef);
        assert.equal(file?.getClassWithName('C1')?.getFieldWithName('s')?.getType(), StringType.getInstance());
    })

    it('field type case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const fields = file?.getClassWithName('FieldType')?.getFields();
        if (fields) {
            const arkField = fields[0];
            assert.equal(arkField.getType().toString(), '(number|string)[]');
            assert.equal(fields[1].getType(), StringType.getInstance());
        }
    })

    it('embed class case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const embedClassType = file?.getDefaultClass().getMethodWithName('foo')?.getBody()?.getLocals().get('t')?.getType();
        assert.isDefined(embedClassType);
        if (embedClassType) {
            assert.equal(embedClassType.toString(), '@inferType/inferSample.ts: Test$%dflt.foo');
        }
    })

    it('supperClass Test case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'B.ets');
        const classB = projectScene.getFile(fileId)?.getClassWithName('ClassB');
        assert.isDefined(classB?.getSuperClass());
        assert.isTrue(classB?.getFieldWithName('field1')?.getType() instanceof AliasType);
    })

    it('alias type Test case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'B.ets');
        const aliasType = projectScene.getFile(fileId)?.getDefaultClass().getDefaultArkMethod()?.getBody()?.getAliasTypeByName('TestType');
        assert.isTrue(aliasType?.getOriginalType() instanceof AliasType);
        assert.equal((aliasType?.getOriginalType() as AliasType).getOriginalType().getTypeString(), '@inferType/Target.ets: MySpace.%AC0<@inferType/Target.ets: MySpace.ClassTarget>');
    })

    it('constructor case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'demo.ts');
        const file = projectScene.getFile(fileId);
        const returnType = file?.getClassWithName('Test')?.getMethodWithName('constructor')
            ?.getReturnType();
        assert.isTrue(returnType instanceof ClassType);
        assert.equal((returnType as ClassType).getClassSignature().toString(), '@inferType/demo.ts: Test');
    })

    it('all case', () => {
        projectScene.getMethods().forEach(m => {
            m.getCfg()?.getStmts().forEach(s => {
                const text = s.toString();
                if (text.includes('Unknown')) {
                    logger.log(text + ' warning ' + m.getSignature().toString());
                }
            })
        })
    })

    it('methodsMap refresh', () => {
        let flag = false;
        projectScene.getMethods().forEach(m => {
            if (m.getSignature().toString().includes('SCBTransitionManager.registerUnlockTransitionController(@inferType/test1.ets: SCBUnlockTransitionController')) {
                if (projectScene.getMethod(m.getSignature()) !== null) {
                    flag = true;
                }
            }
        })
        assert.isTrue(flag);
    })

    it('union array case', () => {
        let flag = false;
        const paramToString = `@inferType/UnionArray.ts: ${DEFAULT_ARK_CLASS_NAME}.[static]${DEFAULT_ARK_METHOD_NAME}()#ISceneEvent`;
        projectScene.getMethods().forEach(m => {
            if (m.getSignature().toString().includes(`${paramToString}[]|${paramToString}`)) {
                if (projectScene.getMethod(m.getSignature()) !== null) {
                    flag = true;
                }
            }
        })
        assert.isTrue(flag);
    })

    it('field to ArrayRef case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'Field.ts');
        const file = projectScene.getFile(fileId);
        const stmts = file?.getClassWithName('User')?.getFieldWithName('role')?.getInitializer();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[2].toString(), '%3 = %1[%2]');
        }
    })

    it('instance of case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'demo.ts');
        const file = projectScene.getFile(fileId);
        const stmts = file?.getDefaultClass()?.getMethodWithName('responseType')
            ?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[2].toString(), '%0 = d instanceof @inferType/demo.ts: Test');
            assert.equal(stmts[3].toString(), 'if %0 != false');
        }
    })

    it('any type case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const arkExport = file?.getImportInfoBy('myNamespaceA')?.getLazyExportInfo()?.getArkExport();
        assert.isDefined((arkExport as ArkNamespace).getExportInfoBy('a')?.getArkExport());
    })
})

describe("function Test", () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: "", name: "etsSdk", path: path.join(__dirname, "../resources/Sdk") })
    config.buildFromProjectDir(path.join(__dirname, "../resources/inferType"));
    let scene: Scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();
    it('generic case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'test2.ets');
        const file = scene.getFile(fileId);
        const actual = file?.getClassWithName('SCBSceneSessionManager')
            ?.getFieldWithName('property1')?.getSignature().getType().toString();
        assert.equal(actual, '@etsSdk/arkts/@arkts.collections.d.ets: collections.Array<number>');
    })

    it('overload case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'test2.ets');
        const file = scene.getFile(fileId);
        const actual = file?.getDefaultClass()?.getMethodWithName('demoCallBack')
            ?.getCfg()?.getStmts();
        assert.equal((actual?.[1] as ArkInvokeStmt).getInvokeExpr().getMethodSignature().toString(),
            '@etsSdk/api/@ohos.multimedia.media.d.ts: media.%dflt.createAVPlayer(@etsSdk/api/@ohos.base.d.ts: AsyncCallback<@etsSdk/api/@ohos.multimedia.media.d.ts: media.AVPlayer,void>)');
        assert.equal((actual?.[2] as ArkAssignStmt).getInvokeExpr()?.getMethodSignature().toString(),
            '@etsSdk/api/@ohos.multimedia.media.d.ts: media.%dflt.createAVPlayer()');
    })

    it('callback case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'test2.ets');
        const file = scene.getFile(fileId);
        const actual = file?.getDefaultClass()?.getMethodWithName('%AM0$demoCallBack')
            ?.getCfg()?.getStmts().find(s => s instanceof ArkInvokeStmt)?.toString();
        assert.equal(actual, 'instanceinvoke player.<@etsSdk/api/@ohos.multimedia.media.d.ts: media.AVPlayer.on(\'audioInterrupt\', @etsSdk/api/@ohos.base.d.ts: Callback<audio.InterruptEvent>)>(\'audioInterrupt\', %AM1$%AM0$demoCallBack)');
    })

    it('promise case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'test2.ets');
        const file = scene.getFile(fileId);
        const actual2 = file?.getDefaultClass()?.getMethodWithName('%AM3$demoCallBack')
            ?.getCfg()?.getStmts().find(s => s instanceof ArkInvokeStmt)?.toString();
        assert.equal(actual2, 'instanceinvoke player.<@etsSdk/api/@ohos.multimedia.media.d.ts: media.AVPlayer.on(\'audioInterrupt\', @etsSdk/api/@ohos.base.d.ts: Callback<audio.InterruptEvent>)>(mode, %AM4$%AM3$demoCallBack)');
    })

    it('enum value type case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const file = scene.getFile(fileId);
        const stmts = file?.getDefaultClass()?.getMethodWithName('testEnumValue')?.getCfg()?.getStmts();
        if (stmts) {
            assert.equal(stmts[3].toString(), 'staticinvoke <@etsSdk/api/@ohos.sensor.d.ts: sensor.%dflt.off(@etsSdk/api/@ohos.sensor.d.ts: sensor.SensorId.[static]GRAVITY, @etsSdk/api/@ohos.base.d.ts: Callback<@etsSdk/api/@ohos.sensor.d.ts: sensor.GravityResponse>)>(%1)');
            assert.equal(stmts[4].toString(), 'staticinvoke <@etsSdk/api/@ohos.sensor.d.ts: sensor.%dflt.off(@etsSdk/api/@ohos.sensor.d.ts: sensor.SensorId.[static]AMBIENT_LIGHT, @etsSdk/api/@ohos.base.d.ts: Callback<@etsSdk/api/@ohos.sensor.d.ts: sensor.LightResponse>)>(5)');
        }
    })

    it('function name same with param type', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const file = scene.getFile(fileId);
        const parameter = file?.getDefaultClass()?.getMethodWithName('ResponseType')?.getParameters()[0];
        if (parameter) {
            assert.equal(parameter.getType().toString(), '@etsSdk/api/@internal/component/ets/enums.d.ts: ResponseType');
        }
    })

    it('sdk import', () => {
        const fileId = new FileSignature('etsSdk', 'api/@internal/ets/lifecycle.d.ts');
        const file = scene.getFile(fileId);
        assert.isNotNull(file?.getImportInfoBy('AsyncCallback')?.getLazyExportInfo());
    })

    it('match override case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'test2.ets');
        const file = scene.getFile(fileId);
        const stmts = file?.getDefaultClass()?.getMethodWithName('%AM5$matchOverride')
            ?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[4].toString(), 'instanceinvoke player.<@etsSdk/api/@ohos.multimedia.media.d.ts: media.AVPlayer.on(\'stateChange\', @etsSdk/api/@ohos.multimedia.media.d.ts: media.%dflt.[static]%dflt()#OnAVPlayerStateChangeHandle)>(%0, %AM6$%AM5$matchOverride)');
        }
    })

    it('testArrayFrom', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const file = scene.getFile(fileId);
        const locals = file?.getDefaultClass()?.getMethodWithName('testArrayFrom')?.getBody()?.getLocals();
        assert.isDefined(locals)
        assert.isTrue(locals?.get('arr1')?.getType() instanceof ArrayType);
        assert.equal(locals?.get('arr2')?.getType().toString(), 'string[]');
    })
})

describe("for Test without sdk", () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, "../resources/cfg/loop"));
    config.getOptions().enableBuiltIn = false;
    let scene: Scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();
    it('for case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'LoopSample.ts');
        const file = scene.getFile(fileId);
        const item = file?.getDefaultClass()?.getMethodWithName('testFor')
            ?.getBody()?.getLocals().get('item');
        assert.isDefined(item);
        if (item) {
            assert.equal(item.getType().toString(), 'number');
        }
        assert.equal(file?.getDefaultClass()?.getMethodWithName('testFor')
            ?.getCfg()?.getStmts()?.[10].toString(), '%4 = %2.<@ES2015/BuiltinClass: IteratorResult.value>')
    })

    it('while case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'LoopSample.ts');
        const file = scene.getFile(fileId);
        const item = file?.getDefaultClass()?.getMethodWithName('testWhile')
            ?.getBody()?.getLocals().get('item');
        assert.isDefined(item);
        if (item) {
            assert.equal(item.getType().toString(), 'number');
        }
        assert.equal(file?.getDefaultClass()?.getMethodWithName('testFor')
            ?.getCfg()?.getStmts()?.[10].toString(), '%4 = %2.<@ES2015/BuiltinClass: IteratorResult.value>')
    })

})

describe("for Test with sdk", () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, "../resources/cfg/loop"));
    config.getOptions().enableBuiltIn = true;
    let scene: Scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();
    it('for case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'LoopSample.ts');
        const file = scene.getFile(fileId);
        const item = file?.getDefaultClass()?.getMethodWithName('testFor')
            ?.getBody()?.getLocals().get('item');
        assert.isDefined(item);
        if (item) {
            assert.equal(item.getType().toString(), 'number');
        }
        assert.equal(file?.getDefaultClass()?.getMethodWithName('testFor')
            ?.getCfg()?.getStmts()?.[10].toString(), '%4 = %2.<@built-in/lib.es2015.iterable.d.ts: IteratorYieldResult.value>')
    })

    it('while case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'LoopSample.ts');
        const file = scene.getFile(fileId);
        const item = file?.getDefaultClass()?.getMethodWithName('testWhile')
            ?.getBody()?.getLocals().get('item');
        assert.isDefined(item);
        if (item) {
            assert.equal(item.getType().toString(), 'number');
        }
        assert.equal(file?.getDefaultClass()?.getMethodWithName('testWhile')
            ?.getCfg()?.getStmts()?.[11].toString(), 'item = next.<@built-in/lib.es2015.iterable.d.ts: IteratorYieldResult.value>')
    })
})

describe("Test built in version", () => {

    it('version 2017 case', () => {
        let config: SceneConfig = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/dependency/exampleProject/DependencyTest1');
        config.getOptions().enableBuiltIn = true;
        let scene: Scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
        assert.isNull((scene.getSdkGlobal('Promise') as ArkClass).getMethodWithName('any'));
    })

    it('version 2021 case', () => {
        let config: SceneConfig = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/dependency/exampleProject/DependencyTest');
        config.getOptions().enableBuiltIn = true;
        let scene: Scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
        assert.isNotNull((scene.getSdkGlobal('Promise') as ArkClass).getMethodWithName('any'));
    })
})